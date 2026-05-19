import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middlewares/auth';

const router = Router();
const prisma = new PrismaClient();

// GET /api/rendas/:mesAno
router.get('/:mesAno', authenticate, async (req: Request, res: Response) => {
  try {
    const { mesAno } = req.params;
    const userId = req.userId!;

    const rendas = await prisma.renda.findMany({
      where: {
        userId,
        mes_ano: mesAno,
      },
      include: {
        outros_descontos: true,
      },
    });

    res.json(rendas);
  } catch (error) {
    console.error('Get rendas error:', error);
    res.status(500).json({ error: 'Failed to fetch rendas' });
  }
});

// POST /api/rendas
router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { nome, valor_bruto, valor_liquido, is_clt, dependentes, mes_ano, outros_descontos } = req.body;

    if (!nome || !valor_bruto || !valor_liquido || !mes_ano) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const renda = await prisma.renda.create({
      data: {
        userId,
        nome,
        valor_bruto: parseFloat(valor_bruto),
        valor_liquido: parseFloat(valor_liquido),
        is_clt: is_clt || false,
        dependentes: parseInt(dependentes) || 0,
        mes_ano,
        outros_descontos: outros_descontos && outros_descontos.length > 0
          ? {
              createMany: {
                data: outros_descontos.map((d: any) => ({
                  desc: d.desc,
                  valor: parseFloat(d.valor),
                })),
              },
            }
          : undefined,
      },
      include: {
        outros_descontos: true,
      },
    });

    res.status(201).json(renda);
  } catch (error) {
    console.error('Create renda error:', error);
    res.status(500).json({ error: 'Failed to create renda' });
  }
});

// PUT /api/rendas/:id
router.put('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;
    const { nome, valor_bruto, valor_liquido, is_clt, dependentes } = req.body;

    // Verificar se pertence ao usuário
    const renda = await prisma.renda.findUnique({ where: { id } });
    if (!renda || renda.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const updated = await prisma.renda.update({
      where: { id },
      data: {
        nome,
        valor_bruto: parseFloat(valor_bruto),
        valor_liquido: parseFloat(valor_liquido),
        is_clt,
        dependentes,
      },
      include: {
        outros_descontos: true,
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('Update renda error:', error);
    res.status(500).json({ error: 'Failed to update renda' });
  }
});

// DELETE /api/rendas/:id
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    // Verificar se pertence ao usuário
    const renda = await prisma.renda.findUnique({ where: { id } });
    if (!renda || renda.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await prisma.renda.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete renda error:', error);
    res.status(500).json({ error: 'Failed to delete renda' });
  }
});

export default router;
