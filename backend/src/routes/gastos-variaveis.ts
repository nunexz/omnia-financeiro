import { Router, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate } from '../middlewares/auth'

const router = Router()
const prisma = new PrismaClient()

// GET /api/gastos-variaveis/:mesAno
router.get('/:mesAno', authenticate, async (req: Request, res: Response) => {
  try {
    const { mesAno } = req.params
    const userId = req.userId!

    const gastos = await prisma.gastoVariavel.findMany({
      where: {
        userId,
        data: {
          gte: new Date(`${mesAno}-01`),
          lt: new Date(`${mesAno.split('-')[0]}-${parseInt(mesAno.split('-')[1]) + 1}-01`),
        },
      },
      orderBy: { data: 'desc' },
    })

    res.json(gastos)
  } catch (error) {
    console.error('Get gastos variáveis error:', error)
    res.status(500).json({ error: 'Failed to fetch gastos variáveis' })
  }
})

// POST /api/gastos-variaveis
router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!
    const { descricao, valor, categoria, data, obs } = req.body

    if (!descricao || !valor || !categoria || !data) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    const gasto = await prisma.gastoVariavel.create({
      data: {
        userId,
        descricao,
        valor: parseFloat(valor),
        categoria,
        data: new Date(data),
        obs: obs || null,
      },
    })

    res.status(201).json(gasto)
  } catch (error) {
    console.error('Create gasto variável error:', error)
    res.status(500).json({ error: 'Failed to create gasto variável' })
  }
})

// PUT /api/gastos-variaveis/:id
router.put('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const userId = req.userId!
    const { descricao, valor, categoria, data, obs } = req.body

    // Verificar se pertence ao usuário
    const gasto = await prisma.gastoVariavel.findUnique({ where: { id } })
    if (!gasto || gasto.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    const updated = await prisma.gastoVariavel.update({
      where: { id },
      data: {
        descricao: descricao || undefined,
        valor: valor ? parseFloat(valor) : undefined,
        categoria: categoria || undefined,
        data: data ? new Date(data) : undefined,
        obs: obs !== undefined ? obs : undefined,
      },
    })

    res.json(updated)
  } catch (error) {
    console.error('Update gasto variável error:', error)
    res.status(500).json({ error: 'Failed to update gasto variável' })
  }
})

// DELETE /api/gastos-variaveis/:id
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const userId = req.userId!

    // Verificar se pertence ao usuário
    const gasto = await prisma.gastoVariavel.findUnique({ where: { id } })
    if (!gasto || gasto.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' })
    }

    await prisma.gastoVariavel.delete({ where: { id } })
    res.json({ success: true })
  } catch (error) {
    console.error('Delete gasto variável error:', error)
    res.status(500).json({ error: 'Failed to delete gasto variável' })
  }
})

export default router
