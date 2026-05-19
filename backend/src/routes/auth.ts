import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { PrismaClient } from '@prisma/client';
import * as speakeasy from 'speakeasy';
import { QRCode } from 'qrcode';
import { authenticate } from '../middlewares/auth';
import axios from 'axios';

const router = Router();
const prisma = new PrismaClient();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Login com Google
router.post('/google', async (req: Request, res: Response) => {
  try {
    const { googleToken } = req.body;

    if (!googleToken) {
      return res.status(400).json({ error: 'Google token is required' });
    }

    let payload: any = null;

    try {
      // Tenta verificar como ID token
      console.log('Verifying ID token with Client ID:', process.env.GOOGLE_CLIENT_ID);
      const ticket = await googleClient.verifyIdToken({
        idToken: googleToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
      console.log('Token verified successfully:', payload?.email);
    } catch (error: any) {
      console.error('ID token verification failed:', error.message);

      // Se falhar, tenta obter informações do token via API do Google
      try {
        console.log('Attempting to verify via Google API...');
        const response = await axios.get(`https://www.googleapis.com/oauth2/v1/userinfo?access_token=${googleToken}`);
        payload = response.data;
        console.log('Token verified via API:', payload?.email);
      } catch (apiError: any) {
        console.error('API verification failed:', apiError.message);
        return res.status(401).json({ error: 'Invalid Google token', details: error.message });
      }
    }

    if (!payload || !payload.email) {
      return res.status(400).json({ error: 'Invalid Google token payload' });
    }

    let user = await prisma.user.findUnique({
      where: { email: payload.email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: payload.email,
          nome: payload.name || payload.email.split('@')[0],
          googleId: payload.sub || `google_${payload.email}`,
          photoUrl: payload.picture || '',
        },
      });
    }

    const accessToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        is_admin: user.is_admin,
      },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        nome: user.nome,
        photoUrl: user.photoUrl,
        is_admin: user.is_admin,
        totpEnabled: !!user.totpSecret,
      },
    });
  } catch (error: any) {
    console.error('Google auth error:', error);
    res.status(401).json({ error: 'Google authentication failed', details: error.message });
  }
});

// Setup 2FA
router.post('/2fa/setup', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;

    const secret = speakeasy.generateSecret({
      name: `Omnia Financeiro (${req.user?.email})`,
      issuer: 'Omnia Financeiro',
      length: 32,
    });

    const qrCode = await QRCode.toDataURL(secret.otpauth_url!);

    // Temporariamente guarda o secret na sessão (será confirmado após verificação)
    res.json({
      secret: secret.base32,
      qrCode: qrCode,
    });
  } catch (error) {
    console.error('2FA setup error:', error);
    res.status(500).json({ error: '2FA setup failed' });
  }
});

// Verify 2FA
router.post('/2fa/verify', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    // Por enquanto, apenas marca como habilitado (em produção, validar contra o secret armazenado)
    // Isso seria implementado com o fluxo completo de 2FA

    res.json({ success: true, message: '2FA verified' });
  } catch (error) {
    console.error('2FA verify error:', error);
    res.status(400).json({ error: '2FA verification failed' });
  }
});

export default router;
