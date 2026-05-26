import { Router, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate } from '../middlewares/auth'

const router = Router()
const prisma = new PrismaClient()

// POST /api/copy-data/from-previous-month
router.post('/from-previous-month', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!
    const { mesAno } = req.body

    if (!mesAno) {
      return res.status(400).json({ error: 'mesAno is required' })
    }

    const [year, month] = mesAno.split('-')
    const currentMonth = parseInt(month)
    const currentYear = parseInt(year)

    // Calcular mês anterior
    let prevMonth = currentMonth - 1
    let prevYear = currentYear
    if (prevMonth === 0) {
      prevMonth = 12
      prevYear = currentYear - 1
    }

    const prevMesAno = `${prevYear}-${String(prevMonth).padStart(2, '0')}`

    // Deletar dados existentes do mês atual (para evitar duplicação)
    try {
      // Deletar DescontoRenda relacionados a Rendas do mês atual
      const rendasDoMes = await prisma.renda.findMany({
        where: { userId, mes_ano: mesAno },
      })

      for (const renda of rendasDoMes) {
        await prisma.descontoRenda.deleteMany({
          where: { rendaId: renda.id },
        })
      }

      // Deletar dados do mês atual
      await prisma.renda.deleteMany({ where: { userId, mes_ano: mesAno } })
      await prisma.gastoFixo.deleteMany({ where: { userId, mes_ano: mesAno } })
      await prisma.divida.deleteMany({ where: { userId, mes_ano: mesAno } })
      await prisma.investimento.deleteMany({ where: { userId, mes_ano: mesAno } })
    } catch (deleteError) {
      console.log('Aviso ao deletar dados antigos:', deleteError)
      // Continuar mesmo se houver erro ao deletar
    }

    // Copiar Rendas
    const rendas = await prisma.renda.findMany({
      where: { userId, mes_ano: prevMesAno },
      include: { outros_descontos: true },
    })

    let rendadCopied = 0
    for (const renda of rendas) {
      try {
        await prisma.renda.create({
          data: {
            userId,
            nome: renda.nome,
            valor_bruto: renda.valor_bruto,
            valor_liquido: renda.valor_liquido,
            is_clt: renda.is_clt,
            dependentes: renda.dependentes,
            mes_ano: mesAno,
            pago: false,
            outros_descontos: renda.outros_descontos.length > 0
              ? {
                  createMany: {
                    data: renda.outros_descontos.map((d) => ({
                      desc: d.desc,
                      valor: d.valor,
                    })),
                  },
                }
              : undefined,
          },
        })
        rendadCopied++
      } catch (e) {
        console.log('Erro ao copiar renda:', e)
      }
    }

    // Copiar Gastos Fixos
    const gastos = await prisma.gastoFixo.findMany({
      where: { userId, mes_ano: prevMesAno },
    })

    let gastosCopied = 0
    for (const gasto of gastos) {
      try {
        await prisma.gastoFixo.create({
          data: {
            userId,
            nome: gasto.nome,
            valor: gasto.valor,
            vencimento: gasto.vencimento,
            mes_ano: mesAno,
            pago: false,
          },
        })
        gastosCopied++
      } catch (e) {
        console.log('Erro ao copiar gasto:', e)
      }
    }

    // Copiar Dívidas
    const dividas = await prisma.divida.findMany({
      where: { userId, mes_ano: prevMesAno },
    })

    let dividasCopied = 0
    for (const divida of dividas) {
      try {
        await prisma.divida.create({
          data: {
            userId,
            nome: divida.nome,
            parcela: divida.parcela,
            vencimento: divida.vencimento,
            parcelas_pagas: 0,
            parcelas_totais: divida.parcelas_totais,
            mes_ano: mesAno,
            pago: false,
          },
        })
        dividasCopied++
      } catch (e) {
        console.log('Erro ao copiar dívida:', e)
      }
    }

    // Copiar Investimentos
    const investimentos = await prisma.investimento.findMany({
      where: { userId, mes_ano: prevMesAno },
    })

    let investimentosCopied = 0
    for (const investimento of investimentos) {
      try {
        await prisma.investimento.create({
          data: {
            userId,
            nome: investimento.nome,
            valor: investimento.valor,
            mes_ano: mesAno,
          },
        })
        investimentosCopied++
      } catch (e) {
        console.log('Erro ao copiar investimento:', e)
      }
    }

    res.json({
      success: true,
      message: `Dados copiados de ${prevMesAno}`,
      copied: {
        rendas: rendadCopied,
        gastos: gastosCopied,
        dividas: dividasCopied,
        investimentos: investimentosCopied,
      },
    })
  } catch (error) {
    console.error('Copy data error:', error)
    res.status(500).json({ error: 'Failed to copy data', details: String(error) })
  }
})

// DELETE /api/copy-data/clear-month
router.delete('/clear-month', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!
    const { mesAno } = req.body

    if (!mesAno) {
      return res.status(400).json({ error: 'mesAno is required' })
    }

    // Deletar DescontoRenda relacionados a Rendas do mês
    const rendasDoMes = await prisma.renda.findMany({
      where: { userId, mes_ano: mesAno },
    })

    for (const renda of rendasDoMes) {
      await prisma.descontoRenda.deleteMany({
        where: { rendaId: renda.id },
      })
    }

    // Deletar todos os dados do mês
    const deletedRendas = await prisma.renda.deleteMany({ where: { userId, mes_ano: mesAno } })
    const deletedGastos = await prisma.gastoFixo.deleteMany({ where: { userId, mes_ano: mesAno } })
    const deletedDividas = await prisma.divida.deleteMany({ where: { userId, mes_ano: mesAno } })
    const deletedInvestimentos = await prisma.investimento.deleteMany({ where: { userId, mes_ano: mesAno } })

    res.json({
      success: true,
      message: `Dados de ${mesAno} foram apagados`,
      deleted: {
        rendas: deletedRendas.count,
        gastos: deletedGastos.count,
        dividas: deletedDividas.count,
        investimentos: deletedInvestimentos.count,
      },
    })
  } catch (error) {
    console.error('Clear month error:', error)
    res.status(500).json({ error: 'Failed to clear month data', details: String(error) })
  }
})

export default router
