require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const prisma = new PrismaClient();

// Simular o emailService
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

async function testInviteWithEmail() {
  try {
    console.log('🧪 Testando invite COM EMAIL...\n');

    const email = 'teste.completo@example.com';
    const adminId = 'test-admin-id-2';
    const token = crypto.randomBytes(32).toString('hex');

    console.log('📧 Email:', email);
    console.log('🔐 Token:', token.substring(0, 10) + '...');

    // 1. Criar invite
    console.log('\n⏳ Criando AdminInvite...');
    const invite = await prisma.adminInvite.create({
      data: {
        email,
        token,
        createdBy: adminId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
    console.log('✅ AdminInvite criado');

    // 2. Tentar enviar email
    console.log('\n⏳ Tentando enviar email...');

    const inviteUrl = `http://localhost:5173/admin-invite/${token}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: '🎉 Você foi convidado para ser Administrador - Controle Financeiro',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0;">Bem-vindo, Administrador!</h1>
          </div>
          <div style="background: #f5f5f5; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="color: #333; font-size: 16px;">Olá,</p>
            <p style="color: #666; font-size: 14px; line-height: 1.6;">
              Você foi convidado para ser <strong>Administrador</strong>.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${inviteUrl}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                Aceitar Convite
              </a>
            </div>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Email enviado com sucesso!');

    console.log('\n✅ TUDO FUNCIONOU!');
  } catch (error) {
    console.error('❌ ERRO:', error.message);
    if (error.response) console.error('Resposta:', error.response);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testInviteWithEmail();
