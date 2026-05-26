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
    const { nome, valor_bruto, valor_liquido, is_clt, dependentes, outros_descontos } = req.body;

    // Verificar se pertence ao usuário
    const renda = await prisma.renda.findUnique({ where: { id } });
    if (!renda || renda.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Deletar descontos antigos
    await prisma.descontoRenda.deleteMany({
      where: { rendaId: id },
    });

    const updated = await prisma.renda.update({
      where: { id },
      data: {
        nome,
        valor_bruto: parseFloat(valor_bruto),
        valor_liquido: parseFloat(valor_liquido),
        is_clt,
        dependentes,
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

// POST /api/rendas/adicionar-13-automatico
// Adiciona as 2 parcelas do 13º salário automaticamente
router.post('/adicionar-13-automatico', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { salarioBase, mes1Parcela, mes2Parcela, dependentes = 0 } = req.body;

    if (!salarioBase || !mes1Parcela || !mes2Parcela) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const base = parseFloat(salarioBase);
    const dep = parseInt(dependentes) || 0;

    // Funções de cálculo (mesmo do frontend)
    const calcularINSS = (bruto: number): number => {
      const faixas = [
        { limite: 1621.0, aliquota: 0.075 },
        { limite: 2902.84, aliquota: 0.09 },
        { limite: 4354.27, aliquota: 0.12 },
        { limite: 8475.55, aliquota: 0.14 },
      ];

      let inss = 0;
      let baseAnterior = 0;

      for (const faixa of faixas) {
        if (bruto <= faixa.limite) {
          inss += (bruto - baseAnterior) * faixa.aliquota;
          return Math.min(inss, 908.86);
        }
        inss += (faixa.limite - baseAnterior) * faixa.aliquota;
        baseAnterior = faixa.limite;
      }

      inss += (bruto - baseAnterior) * 0.14;
      return Math.min(inss, 908.86);
    };

    const calcularIRRF = (bruto: number, dependentes: number = 0): number => {
      if (bruto <= 5000) {
        return 0;
      }

      const inss = calcularINSS(bruto);
      const deducaoPorDependente = 189.59 * dependentes;
      const baseIRRF = bruto - inss - deducaoPorDependente;

      let irrf = 0;

      if (baseIRRF <= 2428.80) {
        irrf = 0;
      } else if (baseIRRF <= 2826.65) {
        irrf = (baseIRRF * 0.075) - 182.16;
      } else if (baseIRRF <= 3751.05) {
        irrf = (baseIRRF * 0.15) - 394.16;
      } else if (baseIRRF <= 4664.68) {
        irrf = (baseIRRF * 0.225) - 675.49;
      } else {
        irrf = (baseIRRF * 0.275) - 908.73;
      }

      return Math.max(0, irrf);
    };

    // 1ª Parcela (50%, sem desconto)
    const valor1 = base / 2;
    const liquido1 = valor1;

    const mesAno1 = `${new Date().getFullYear()}-${String(mes1Parcela).padStart(2, '0')}`;

    const renda1 = await prisma.renda.create({
      data: {
        userId,
        nome: '🎁 13º Salário - 1ª Parcela',
        valor_bruto: valor1,
        valor_liquido: liquido1,
        is_clt: true,
        dependentes: dep,
        mes_ano: mesAno1,
      },
    });

    // 2ª Parcela (50%, com descontos)
    const valor2 = base / 2;
    const inss2 = calcularINSS(base);
    const irrf2 = calcularIRRF(base, dep);
    const liquido2 = valor2 - inss2 - irrf2;

    const mesAno2 = `${new Date().getFullYear()}-${String(mes2Parcela).padStart(2, '0')}`;

    const renda2 = await prisma.renda.create({
      data: {
        userId,
        nome: '🎁 13º Salário - 2ª Parcela',
        valor_bruto: valor2,
        valor_liquido: liquido2,
        is_clt: true,
        dependentes: dep,
        mes_ano: mesAno2,
      },
    });

    res.status(201).json({
      success: true,
      message: '13º salário adicionado com sucesso!',
      parcelas: [renda1, renda2],
    });
  } catch (error) {
    console.error('Add 13º error:', error);
    res.status(500).json({ error: 'Failed to add 13º' });
  }
});

export default router;
