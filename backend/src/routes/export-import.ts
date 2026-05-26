import { Router, Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate } from '../middlewares/auth'

const router = Router()
const prisma = new PrismaClient()

// GET /api/export/json?mes-ano=2026-05
router.get('/json', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!
    const { mesAno } = req.query

    if (!mesAno || typeof mesAno !== 'string') {
      return res.status(400).json({ error: 'mes-ano parameter is required' })
    }

    const nextMonthYear = new Date(new Date(`${mesAno}-01`).setMonth(new Date(`${mesAno}-01`).getMonth() + 1))
    const endDate = new Date(nextMonthYear.getFullYear(), nextMonthYear.getMonth(), 1)
    const startDate = new Date(`${mesAno}-01`)

    const [rendas, gastos, dividas, gastosVariaveis] = await Promise.all([
      prisma.renda.findMany({
        where: {
          userId,
          mes_ano: mesAno,
        },
        include: { outros_descontos: true },
      }),
      prisma.gastoFixo.findMany({
        where: {
          userId,
          mes_ano: mesAno,
        },
      }),
      prisma.divida.findMany({
        where: {
          userId,
          mes_ano: mesAno,
        },
      }),
      prisma.gastoVariavel.findMany({
        where: {
          userId,
          data: {
            gte: startDate,
            lt: endDate,
          },
        },
      }),
    ])

    const exportData = {
      mesAno,
      exportDate: new Date().toISOString(),
      data: {
        rendas: rendas.map((r) => ({
          id: r.id,
          nome: r.nome,
          valor_bruto: r.valor_bruto.toString(),
          valor_liquido: r.valor_liquido.toString(),
          is_clt: r.is_clt,
          dependentes: r.dependentes,
          outros_descontos: r.outros_descontos.map((d) => ({
            desc: d.desc,
            valor: d.valor.toString(),
          })),
        })),
        gastos: gastos.map((g) => ({
          id: g.id,
          nome: g.nome,
          valor: g.valor.toString(),
          vencimento: g.vencimento,
          pago: g.pago,
        })),
        dividas: dividas.map((d) => ({
          id: d.id,
          nome: d.nome,
          parcela: d.parcela.toString(),
          vencimento: d.vencimento,
          parcelas_pagas: d.parcelas_pagas,
          parcelas_totais: d.parcelas_totais,
          pago: d.pago,
        })),
        gastosVariaveis: gastosVariaveis.map((gv) => ({
          id: gv.id,
          descricao: gv.descricao,
          valor: gv.valor.toString(),
          categoria: gv.categoria,
          data: gv.data.toISOString(),
          obs: gv.obs,
        })),
      },
    }

    res.json(exportData)
  } catch (error) {
    console.error('Export error:', error)
    res.status(500).json({ error: 'Failed to export data' })
  }
})

// POST /api/import/json
router.post('/json', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!
    const { data, mesAno } = req.body

    if (!data || !mesAno) {
      return res.status(400).json({ error: 'data and mesAno are required' })
    }

    const importedData = {
      rendas: 0,
      gastos: 0,
      dividas: 0,
      gastosVariaveis: 0,
    }

    // Import Rendas
    if (data.rendas && Array.isArray(data.rendas)) {
      for (const renda of data.rendas) {
        try {
          const created = await prisma.renda.create({
            data: {
              userId,
              nome: renda.nome || 'Sem nome',
              valor_bruto: parseFloat(renda.valor_bruto) || 0,
              valor_liquido: parseFloat(renda.valor_liquido) || 0,
              is_clt: renda.is_clt || false,
              dependentes: parseInt(renda.dependentes) || 0,
              mes_ano: mesAno,
              pago: renda.pago || false,
            },
          })

          // Import outros_descontos
          if (renda.outros_descontos && Array.isArray(renda.outros_descontos)) {
            for (const desconto of renda.outros_descontos) {
              try {
                await prisma.descontoRenda.create({
                  data: {
                    rendaId: created.id,
                    desc: desconto.desc || 'Desconto',
                    valor: parseFloat(desconto.valor) || 0,
                  },
                })
              } catch (err) {
                console.error('Error importing desconto:', err)
              }
            }
          }

          importedData.rendas++
        } catch (err) {
          console.error('Error importing renda:', err)
        }
      }
    }

    // Import Gastos Fixos
    if (data.gastos && Array.isArray(data.gastos)) {
      for (const gasto of data.gastos) {
        try {
          await prisma.gastoFixo.create({
            data: {
              userId,
              nome: gasto.nome || 'Gasto sem nome',
              valor: parseFloat(gasto.valor) || 0,
              vencimento: parseInt(gasto.vencimento) || 1,
              mes_ano: mesAno,
              pago: gasto.pago || false,
            },
          })
          importedData.gastos++
        } catch (err) {
          console.error('Error importing gasto:', err)
        }
      }
    }

    // Import Dívidas
    if (data.dividas && Array.isArray(data.dividas)) {
      for (const divida of data.dividas) {
        try {
          await prisma.divida.create({
            data: {
              userId,
              nome: divida.nome || 'Dívida sem nome',
              parcela: parseFloat(divida.parcela) || 0,
              vencimento: parseInt(divida.vencimento) || 1,
              parcelas_pagas: parseInt(divida.parcelas_pagas) || 0,
              parcelas_totais: parseInt(divida.parcelas_totais) || 1,
              mes_ano: mesAno,
              pago: divida.pago || false,
            },
          })
          importedData.dividas++
        } catch (err) {
          console.error('Error importing divida:', err)
        }
      }
    }

    // Import Gastos Variáveis
    if (data.gastosVariaveis && Array.isArray(data.gastosVariaveis)) {
      for (const gv of data.gastosVariaveis) {
        try {
          await prisma.gastoVariavel.create({
            data: {
              userId,
              descricao: gv.descricao || 'Gasto variável',
              valor: parseFloat(gv.valor) || 0,
              categoria: gv.categoria || 'Outros',
              data: new Date(gv.data) || new Date(),
              obs: gv.obs || null,
            },
          })
          importedData.gastosVariaveis++
        } catch (err) {
          console.error('Error importing gastoVariavel:', err)
        }
      }
    }

    res.json({
      success: true,
      message: 'Data imported successfully',
      imported: importedData,
    })
  } catch (error) {
    console.error('Import error:', error)
    res.status(500).json({ error: 'Failed to import data' })
  }
})

export default router
