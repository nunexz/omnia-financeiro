import { Router, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate } from '../middlewares/auth'
import { requireAdmin } from '../middlewares/admin'
import { emailService } from '../services/emailService'
import crypto from 'crypto'

const router = Router()
const prisma = new PrismaClient()

// GET /api/admin/users - listar com filtro por status
router.get('/users', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { status } = req.query
    const where: any = {}

    if (status && typeof status === 'string') {
      where.status = status
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        nome: true,
        is_admin: true,
        status: true,
        tier: true,
        trialEndsAt: true,
        createdAt: true,
        approvedAt: true,
        suspendedAt: true,
        suspendReason: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    res.json(users)
  } catch (error) {
    console.error('Get users error:', error)
    res.status(500).json({ error: 'Failed to fetch users' })
  }
})

// PATCH /api/admin/users/:userId/toggle-admin
router.patch('/users/:userId/toggle-admin', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params
    const currentUserId = req.userId!

    // Prevenir que um admin remova seu próprio acesso
    if (userId === currentUserId) {
      return res.status(400).json({ error: 'Cannot remove your own admin access' })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { is_admin: true },
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { is_admin: !user.is_admin },
      select: {
        id: true,
        email: true,
        nome: true,
        is_admin: true,
      },
    })

    res.json(updated)
  } catch (error) {
    console.error('Toggle admin error:', error)
    res.status(500).json({ error: 'Failed to update user' })
  }
})

// GET /api/admin/users/:userId/data
router.get('/users/:userId/data', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params
    const { mesAno } = req.query

    if (!mesAno || typeof mesAno !== 'string') {
      return res.status(400).json({ error: 'mes-ano parameter is required' })
    }

    const [rendas, gastos, dividas, gastosVariaveis] = await Promise.all([
      prisma.renda.findMany({
        where: { userId, mes_ano: mesAno },
        include: { descontos: true },
      }),
      prisma.gastoFixo.findMany({
        where: { userId, mes_ano: mesAno },
      }),
      prisma.divida.findMany({
        where: { userId, mes_ano: mesAno },
      }),
      prisma.gastoVariavel.findMany({
        where: {
          userId,
          data: {
            gte: new Date(`${mesAno}-01`),
            lt: new Date(`${mesAno.split('-')[0]}-${parseInt(mesAno.split('-')[1]) + 1}-01`),
          },
        },
      }),
    ])

    res.json({
      rendas,
      gastos,
      dividas,
      gastosVariaveis,
    })
  } catch (error) {
    console.error('Get user data error:', error)
    res.status(500).json({ error: 'Failed to fetch user data' })
  }
})

// PATCH /api/admin/users/:userId/approve - aprovar usuário
router.patch('/users/:userId/approve', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params
    const adminId = req.userId!

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { status: true },
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    if (user.status !== 'pending_approval') {
      return res.status(400).json({ error: 'User is not pending approval' })
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        status: 'active',
        approvedAt: new Date(),
        approvedBy: adminId,
        trialEndsAt: null, // Remove trial quando aprovado
      },
      select: {
        id: true,
        email: true,
        nome: true,
        status: true,
        trialEndsAt: true,
      },
    })

    // Registrar no audit log
    await prisma.userApprovalAudit.create({
      data: {
        userId,
        action: 'approved',
        approvedBy: adminId,
      },
    })

    res.json(updated)
  } catch (error) {
    console.error('Approve user error:', error)
    res.status(500).json({ error: 'Failed to approve user' })
  }
})

// PATCH /api/admin/users/:userId/reject - rejeitar usuário
router.patch('/users/:userId/reject', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params
    const { reason } = req.body
    const adminId = req.userId!

    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    if (user.status !== 'pending_approval') {
      return res.status(400).json({ error: 'Only pending users can be rejected' })
    }

    // Registrar no audit log antes de deletar
    await prisma.userApprovalAudit.create({
      data: {
        userId,
        action: 'rejected',
        reason: reason || 'No reason specified',
        approvedBy: adminId,
      },
    })

    // Deletar usuário rejeitado
    await prisma.user.delete({
      where: { id: userId },
    })

    res.json({ success: true, message: 'User rejected and removed' })
  } catch (error) {
    console.error('Reject user error:', error)
    res.status(500).json({ error: 'Failed to reject user' })
  }
})

// PATCH /api/admin/users/:userId/suspend - suspender usuário
router.patch('/users/:userId/suspend', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params
    const { reason } = req.body
    const adminId = req.userId!

    if (userId === adminId) {
      return res.status(400).json({ error: 'Cannot suspend yourself' })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        status: 'suspended',
        suspendedAt: new Date(),
        suspendReason: reason || 'No reason specified',
      },
      select: {
        id: true,
        email: true,
        nome: true,
        status: true,
      },
    })

    // Registrar no audit log
    await prisma.userApprovalAudit.create({
      data: {
        userId,
        action: 'suspended',
        reason: reason || 'No reason specified',
        approvedBy: adminId,
      },
    })

    res.json(updated)
  } catch (error) {
    console.error('Suspend user error:', error)
    res.status(500).json({ error: 'Failed to suspend user' })
  }
})

// PATCH /api/admin/users/:userId/unsuspend - reativar usuário suspenso
router.patch('/users/:userId/unsuspend', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params
    const adminId = req.userId!

    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    if (user.status !== 'suspended') {
      return res.status(400).json({ error: 'User is not suspended' })
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        status: 'active',
        suspendedAt: null,
        suspendReason: null,
      },
      select: {
        id: true,
        email: true,
        nome: true,
        status: true,
      },
    })

    // Registrar no audit log
    await prisma.userApprovalAudit.create({
      data: {
        userId,
        action: 'unsuspended',
        approvedBy: adminId,
      },
    })

    res.json(updated)
  } catch (error) {
    console.error('Unsuspend user error:', error)
    res.status(500).json({ error: 'Failed to unsuspend user' })
  }
})

// GET /api/admin/audit-log - listar histórico de aprovações
router.get('/audit-log', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { userId, action } = req.query
    const where: any = {}

    if (userId && typeof userId === 'string') {
      where.userId = userId
    }

    if (action && typeof action === 'string') {
      where.action = action
    }

    const logs = await prisma.userApprovalAudit.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            nome: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    res.json(logs)
  } catch (error) {
    console.error('Get audit log error:', error)
    res.status(500).json({ error: 'Failed to fetch audit log' })
  }
})

// POST /api/admin/invites - gerar convite para novo admin
router.post('/invites', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { email } = req.body
    const adminId = req.userId!

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Email is required' })
    }

    // Verificar se já existe usuário com esse email
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' })
    }

    // Gerar token único
    const token = crypto.randomBytes(32).toString('hex')

    // Criar invite
    const invite = await prisma.adminInvite.create({
      data: {
        email,
        token,
        createdBy: adminId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
      },
    })

    // Gerar URL de invite
    const inviteUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/admin-invite/${token}`

    // Enviar email
    await emailService.sendAdminInvite(email, token, inviteUrl)

    res.json({
      success: true,
      message: 'Convite enviado com sucesso',
      invite: {
        id: invite.id,
        email: invite.email,
        expiresAt: invite.expiresAt,
      },
    })
  } catch (error: any) {
    console.error('Create invite error:', error)
    res.status(500).json({ error: error.message || 'Failed to create invite' })
  }
})

// GET /api/admin/invites - listar convites pendentes
router.get('/invites', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const invites = await prisma.adminInvite.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    res.json(invites)
  } catch (error) {
    console.error('Get invites error:', error)
    res.status(500).json({ error: 'Failed to fetch invites' })
  }
})

// POST /api/admin/invites/:token/accept - aceitar convite e virar admin
router.post('/invites/:token/accept', async (req: Request, res: Response) => {
  try {
    const { token } = req.params
    const { googleToken } = req.body

    // Verificar token de invite
    const invite = await prisma.adminInvite.findUnique({
      where: { token },
    })

    if (!invite) {
      return res.status(404).json({ error: 'Invite not found' })
    }

    if (invite.status !== 'pending') {
      return res.status(400).json({ error: 'This invite has already been used or rejected' })
    }

    if (new Date() > invite.expiresAt) {
      return res.status(400).json({ error: 'This invite has expired' })
    }

    // Verificar se usuário já existe
    let user = await prisma.user.findUnique({
      where: { email: invite.email },
    })

    // Se não existe, ele precisa fazer login com Google primeiro
    if (!user && googleToken) {
      // Login normal com Google, mas já ativar como admin
      // (Isso será feito no frontend - ele faz login normal, depois aceita o invite)
      return res.json({
        requiresLogin: true,
        message: 'Please login with Google first using this email',
        inviteEmail: invite.email,
      })
    }

    if (!user) {
      return res.status(400).json({
        error: 'You need to login with Google first using this email',
        inviteEmail: invite.email,
      })
    }

    // Promover para admin
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        is_admin: true,
      },
    })

    // Marcar invite como aceito
    await prisma.adminInvite.update({
      where: { id: invite.id },
      data: {
        status: 'accepted',
        acceptedBy: user.id,
        acceptedAt: new Date(),
      },
    })

    res.json({
      success: true,
      message: 'You are now an administrator!',
      user: {
        id: user.id,
        email: user.email,
        nome: user.nome,
        is_admin: true,
      },
    })
  } catch (error: any) {
    console.error('Accept invite error:', error)
    res.status(500).json({ error: 'Failed to accept invite' })
  }
})

// PATCH /api/admin/users/:userId/extend-trial - estender trial de um usuário
router.patch('/users/:userId/extend-trial', authenticate, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params
    const { days } = req.body

    if (!days || typeof days !== 'number' || days <= 0) {
      return res.status(400).json({ error: 'Days must be a positive number' })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Calcular nova data de expiração
    let newTrialEndsAt = new Date()
    if (user.trialEndsAt && new Date() < user.trialEndsAt) {
      // Se trial ainda não expirou, estender a partir da data atual
      newTrialEndsAt = user.trialEndsAt
    }
    newTrialEndsAt.setDate(newTrialEndsAt.getDate() + days)

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        trialEndsAt: newTrialEndsAt,
      },
      select: {
        id: true,
        email: true,
        nome: true,
        trialEndsAt: true,
      },
    })

    // Registrar no audit log
    await prisma.userApprovalAudit.create({
      data: {
        userId,
        action: 'trial_extended',
        reason: `Extended trial by ${days} days until ${newTrialEndsAt.toISOString()}`,
        approvedBy: req.userId!,
      },
    })

    res.json(updated)
  } catch (error) {
    console.error('Extend trial error:', error)
    res.status(500).json({ error: 'Failed to extend trial' })
  }
})

export default router
