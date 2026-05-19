import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middlewares/auth';

const router = Router();
const prisma = new PrismaClient();

// GET /api/dashboard/:mesAno
router.get('/:mesAno', authenticate, async (req: Request, res: Response) => {
  try {
    const { mesAno } = req.params;
    const userId = req.userId!;

    // Validar formato mes-ano (YYYY-MM)
    if (!/^\d{4}-\d{2}$/.test(mesAno)) {
      return res.status(400).json({ error: 'Invalid month format. Use YYYY-MM' });
    }

    // Buscar todas as rendas do mês
    const rendas = await prisma.renda.findMany({
      where: {
        userId,
        mes_ano: mesAno,
      },
      include: {
        outros_descontos: true,
      },
    });

    // Buscar todos os gastos fixos do mês
    const gastos_fixos = await prisma.gastoFixo.findMany({
      where: {
        userId,
        mes_ano: mesAno,
      },
    });

    // Buscar todas as dívidas do mês
    const dividas = await prisma.divida.findMany({
      where: {
        userId,
        mes_ano: mesAno,
      },
    });

    // Buscar gastos variáveis do mês
    const [startDate, endDate] = getMonthDateRange(mesAno);
    const gastos_variaveis = await prisma.gastoVariavel.findMany({
      where: {
        userId,
        data: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Buscar investimentos do mês
    const investimentos = await prisma.investimento.findMany({
      where: {
        userId,
        mes_ano: mesAno,
      },
    });

    // Calcular totais
    const renda_liquida = rendas.reduce((sum, r) => sum + Number(r.valor_liquido), 0);
    const gastos_fixos_total = gastos_fixos.reduce((sum, g) => sum + Number(g.valor), 0);
    const dividas_total = dividas.reduce((sum, d) => sum + Number(d.parcela), 0);
    const gastos_variaveis_total = gastos_variaveis.reduce((sum, g) => sum + Number(g.valor), 0);
    const investimentos_total = investimentos.reduce((sum, i) => sum + Number(i.valor), 0);

    const total_gastos = gastos_fixos_total + dividas_total + gastos_variaveis_total;
    const saldo_final = renda_liquida - total_gastos;

    res.json({
      rendas,
      gastos_fixos,
      dividas,
      gastos_variaveis,
      investimentos,
      totals: {
        renda_liquida: Number(renda_liquida.toFixed(2)),
        gastos_fixos: Number(gastos_fixos_total.toFixed(2)),
        dividas: Number(dividas_total.toFixed(2)),
        gastos_variaveis: Number(gastos_variaveis_total.toFixed(2)),
        investimentos: Number(investimentos_total.toFixed(2)),
        total_gastos: Number(total_gastos.toFixed(2)),
        para_investir: Number((saldo_final > 0 ? saldo_final : 0).toFixed(2)),
        saldo_final: Number(saldo_final.toFixed(2)),
      },
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

function getMonthDateRange(mesAno: string) {
  const [year, month] = mesAno.split('-').map(Number);
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);
  return [startDate, endDate];
}

export default router;
