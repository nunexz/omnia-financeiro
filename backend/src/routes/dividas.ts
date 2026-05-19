import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middlewares/auth';

const router = Router();
const prisma = new PrismaClient();

// GET /api/dividas/:mesAno
router.get('/:mesAno', authenticate, async (req: Request, res: Response) => {
  try {
    const { mesAno } = req.params;
    const userId = req.userId!;

    const dividas = await prisma.divida.findMany({
      where: {
        userId,
        mes_ano: mesAno,
      },
      orderBy: { vencimento: 'asc' },
    });

    res.json(dividas);
  } catch (error) {
    console.error('Get dividas error:', error);
    res.status(500).json({ error: 'Failed to fetch dividas' });
  }
});

// POST /api/dividas
router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { nome, parcela, vencimento, parcelas_pagas, parcelas_totais, mes_ano } = req.body;

    if (!nome || !parcela || !vencimento || !parcelas_totais || !mes_ano) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const parcelaNum = parseFloat(parcela);
    const parcelasPagasNum = parcelas_pagas || 0;
    const parcelasToaisNum = parseInt(parcelas_totais);

    // Calcular saldo devedor inicial
    const saldoDevedor = (parcelasToaisNum - parcelasPagasNum) * parcelaNum;

    const divida = await prisma.divida.create({
      data: {
        userId,
        nome,
        parcela: parcelaNum,
        vencimento: parseInt(vencimento),
        parcelas_pagas: parcelasPagasNum,
        parcelas_totais: parcelasToaisNum,
        saldo_devedor: saldoDevedor,
        mes_ano,
      },
    });

    res.status(201).json(divida);
  } catch (error) {
    console.error('Create divida error:', error);
    res.status(500).json({ error: 'Failed to create divida' });
  }
});

// PUT /api/dividas/:id
router.put('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;
    const { nome, parcela, vencimento, parcelas_pagas, parcelas_totais, pago } = req.body;

    // Verificar se pertence ao usuário
    const divida = await prisma.divida.findUnique({ where: { id } });
    if (!divida || divida.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Calcular novo saldo devedor se parcelas mudarem
    let saldoDevedor = divida.saldo_devedor;
    const novasParcelas = parcelas_pagas !== undefined ? parseInt(parcelas_pagas) : divida.parcelas_pagas;
    const novaParcela = parcela ? parseFloat(parcela) : divida.parcela;
    const novasTotais = parcelas_totais ? parseInt(parcelas_totais) : divida.parcelas_totais;

    if (parcelas_pagas !== undefined || parcela || parcelas_totais) {
      saldoDevedor = Math.max(0, (novasTotais - novasParcelas) * novaParcela);
    }

    const updated = await prisma.divida.update({
      where: { id },
      data: {
        nome: nome || undefined,
        parcela: parcela ? parseFloat(parcela) : undefined,
        vencimento: vencimento ? parseInt(vencimento) : undefined,
        parcelas_pagas: parcelas_pagas !== undefined ? parseInt(parcelas_pagas) : undefined,
        parcelas_totais: parcelas_totais ? parseInt(parcelas_totais) : undefined,
        saldo_devedor: saldoDevedor,
        pago: pago !== undefined ? pago : undefined,
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('Update divida error:', error);
    res.status(500).json({ error: 'Failed to update divida' });
  }
});

// DELETE /api/dividas/:id
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    // Verificar se pertence ao usuário
    const divida = await prisma.divida.findUnique({ where: { id } });
    if (!divida || divida.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await prisma.divida.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete divida error:', error);
    res.status(500).json({ error: 'Failed to delete divida' });
  }
});

// PATCH /api/dividas/:id/marcar-pago - Marca a parcela do mês como paga
router.patch('/:id/marcar-pago', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;
    const { pago } = req.body;

    const divida = await prisma.divida.findUnique({ where: { id } });
    if (!divida || divida.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const updated = await prisma.divida.update({
      where: { id },
      data: { pago },
    });

    res.json(updated);
  } catch (error) {
    console.error('Mark divida as paid error:', error);
    res.status(500).json({ error: 'Failed to update divida' });
  }
});

// PATCH /api/dividas/:id/antecipacao - Registra antecipação (pagar parcelas extras)
router.patch('/:id/antecipacao', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;
    const { parcelas_adicionais } = req.body;

    if (!parcelas_adicionais || parcelas_adicionais <= 0) {
      return res.status(400).json({ error: 'Número de parcelas inválido' });
    }

    const divida = await prisma.divida.findUnique({ where: { id } });
    if (!divida || divida.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const novasParcelas = Math.min(
      divida.parcelas_pagas + parcelas_adicionais,
      divida.parcelas_totais
    );

    const novoSaldoDevedor = Math.max(
      0,
      (divida.parcelas_totais - novasParcelas) * divida.parcela
    );

    const updated = await prisma.divida.update({
      where: { id },
      data: {
        parcelas_pagas: novasParcelas,
        saldo_devedor: novoSaldoDevedor,
        quitado: novasParcelas >= divida.parcelas_totais,
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('Antecipacao error:', error);
    res.status(500).json({ error: 'Failed to register antecipacao' });
  }
});

// PATCH /api/dividas/:id/quitar - Quita a dívida completamente
router.patch('/:id/quitar', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    const divida = await prisma.divida.findUnique({ where: { id } });
    if (!divida || divida.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const updated = await prisma.divida.update({
      where: { id },
      data: {
        parcelas_pagas: divida.parcelas_totais,
        saldo_devedor: 0,
        quitado: true,
      },
    });

    res.json(updated);
  } catch (error) {
    console.error('Quitar divida error:', error);
    res.status(500).json({ error: 'Failed to quitar divida' });
  }
});

export default router;
