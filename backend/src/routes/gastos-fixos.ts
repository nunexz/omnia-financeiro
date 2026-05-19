import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middlewares/auth';

const router = Router();
const prisma = new PrismaClient();

// GET /api/gastos-fixos/:mesAno
router.get('/:mesAno', authenticate, async (req: Request, res: Response) => {
  try {
    const { mesAno } = req.params;
    const userId = req.userId!;

    const gastos = await prisma.gastoFixo.findMany({
      where: {
        userId,
        mes_ano: mesAno,
      },
      orderBy: { vencimento: 'asc' },
    });

    res.json(gastos);
  } catch (error) {
    console.error('Get gastos fixos error:', error);
    res.status(500).json({ error: 'Failed to fetch gastos fixos' });
  }
});

// POST /api/gastos-fixos
router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { nome, valor, vencimento, mes_ano } = req.body;

    if (!nome || !valor || !vencimento || !mes_ano) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const gasto = await prisma.gastoFixo.create({
      data: {
        userId,
        nome,
        valor: parseFloat(valor),
        vencimento: parseInt(vencimento),
        mes_ano,
      },
    });

    res.status(201).json(gasto);
  } catch (error) {
    console.error('Create gasto fixo error:', error);
    res.status(500).json({ error: 'Failed to create gasto fixo' });
  }
});

// PUT /api/gastos-fixos/:id
router.put('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;
    const { nome, valor, vencimento, pago } = req.body;

    // Verificar se pertence ao usuário
    const gasto = await prisma.gastoFixo.findUnique({ where: { id } });
    if (!gasto || gasto.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const updated = await prisma.gastoFixo.update({
      where: { id },
      data: {
        nome,
        valor: valor ? parseFloat(valor) : undefined,
        vencimento: vencimento ? parseInt(vencimento) : undefined,
        pago: pago !== undefined ? pago : undefined,
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('Update gasto fixo error:', error);
    res.status(500).json({ error: 'Failed to update gasto fixo' });
  }
});

// DELETE /api/gastos-fixos/:id
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    // Verificar se pertence ao usuário
    const gasto = await prisma.gastoFixo.findUnique({ where: { id } });
    if (!gasto || gasto.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await prisma.gastoFixo.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete gasto fixo error:', error);
    res.status(500).json({ error: 'Failed to delete gasto fixo' });
  }
});

// PATCH /api/gastos-fixos/:id/marcar-pago - Toggle status de pagamento
router.patch('/:id/marcar-pago', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;
    const { pago } = req.body;

    const gasto = await prisma.gastoFixo.findUnique({ where: { id } });
    if (!gasto || gasto.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const updated = await prisma.gastoFixo.update({
      where: { id },
      data: { pago },
    });

    res.json(updated);
  } catch (error) {
    console.error('Mark gasto fixo as paid error:', error);
    res.status(500).json({ error: 'Failed to update gasto fixo' });
  }
});

export default router;
