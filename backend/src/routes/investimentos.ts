import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middlewares/auth';

const router = Router();
const prisma = new PrismaClient();

// POST - Criar investimento
router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { nome, valor, mes_ano } = req.body;
    const userId = req.userId!;

    if (!nome || !valor || !mes_ano) {
      return res.status(400).json({ error: 'Nome, valor e mês/ano são obrigatórios' });
    }

    const investimento = await prisma.investimento.create({
      data: {
        userId,
        nome,
        valor: parseFloat(valor),
        mes_ano,
      },
    });

    res.json(investimento);
  } catch (error: any) {
    console.error('Erro ao criar investimento:', error);
    res.status(500).json({ error: 'Erro ao criar investimento' });
  }
});

// GET - Listar investimentos do mês
router.get('/:mes_ano', authenticate, async (req: Request, res: Response) => {
  try {
    const { mes_ano } = req.params;
    const userId = req.userId!;

    const investimentos = await prisma.investimento.findMany({
      where: {
        userId,
        mes_ano,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(investimentos);
  } catch (error: any) {
    console.error('Erro ao listar investimentos:', error);
    res.status(500).json({ error: 'Erro ao listar investimentos' });
  }
});

// PUT - Editar investimento
router.put('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nome, valor } = req.body;
    const userId = req.userId!;

    // Verificar se o investimento pertence ao usuário
    const investimento = await prisma.investimento.findUnique({
      where: { id },
    });

    if (!investimento || investimento.userId !== userId) {
      return res.status(403).json({ error: 'Não autorizado' });
    }

    if (!nome || !valor) {
      return res.status(400).json({ error: 'Nome e valor são obrigatórios' });
    }

    const updated = await prisma.investimento.update({
      where: { id },
      data: {
        nome,
        valor: parseFloat(valor),
      },
    });

    res.json(updated);
  } catch (error: any) {
    console.error('Erro ao editar investimento:', error);
    res.status(500).json({ error: 'Erro ao editar investimento' });
  }
});

// DELETE - Deletar investimento
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    // Verificar se o investimento pertence ao usuário
    const investimento = await prisma.investimento.findUnique({
      where: { id },
    });

    if (!investimento || investimento.userId !== userId) {
      return res.status(403).json({ error: 'Não autorizado' });
    }

    await prisma.investimento.delete({
      where: { id },
    });

    res.json({ message: 'Investimento deletado com sucesso' });
  } catch (error: any) {
    console.error('Erro ao deletar investimento:', error);
    res.status(500).json({ error: 'Erro ao deletar investimento' });
  }
});

export default router;
