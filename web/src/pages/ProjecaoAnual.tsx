import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useQuery } from '@tanstack/react-query'
import { LogOut, User, Sun, Moon, ArrowLeft, TrendingUp, TrendingDown, DollarSign, AlertCircle } from 'lucide-react'
import { rendasAPI, gastosFixosAPI, dividasAPI, gastosVariaveisAPI, investimentosAPI } from '../services/api'
import Logo from '../components/Logo'
import Navbar from '../components/Navbar'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function ProjecaoAnual() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [isDark, setIsDarkState] = useState(() => {
    const saved = localStorage.getItem('theme')
    if (saved) return saved === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })
  const [selectedYear] = useState(new Date().getFullYear())

  // Buscar dados de todos os meses do ano
  const mesesDoAno = Array.from({ length: 12 }, (_, i) => {
    const mes = i + 1
    return `${selectedYear}-${String(mes).padStart(2, '0')}`
  })

  const { data: allRendas = [] } = useQuery({
    queryKey: ['rendas-ano', selectedYear],
    queryFn: async () => {
      const results = await Promise.all(
        mesesDoAno.map(mesAno => rendasAPI.getRenda(mesAno).catch(() => []))
      )
      return results.flat()
    },
  })

  const { data: allGastos = [] } = useQuery({
    queryKey: ['gastos-ano', selectedYear],
    queryFn: async () => {
      const results = await Promise.all(
        mesesDoAno.map(mesAno => gastosFixosAPI.getGastos(mesAno).catch(() => []))
      )
      return results.flat()
    },
  })

  const { data: allDividas = [] } = useQuery({
    queryKey: ['dividas-ano', selectedYear],
    queryFn: async () => {
      const results = await Promise.all(
        mesesDoAno.map(mesAno => dividasAPI.getDividas(mesAno).catch(() => []))
      )
      return results.flat()
    },
  })

  const { data: allGastosVariaveis = [] } = useQuery({
    queryKey: ['gastos-variaveis-ano', selectedYear],
    queryFn: async () => {
      const results = await Promise.all(
        mesesDoAno.map(mesAno => gastosVariaveisAPI.getGastos(mesAno).catch(() => []))
      )
      return results.flat()
    },
  })

  const { data: allInvestimentos = [] } = useQuery({
    queryKey: ['investimentos-ano', selectedYear],
    queryFn: async () => {
      const results = await Promise.all(
        mesesDoAno.map(mesAno =>
          investimentosAPI.getInvestimentos(mesAno)
            .then(response => Array.isArray(response.data) ? response.data : [])
            .catch(error => {
              console.log('Erro ao buscar investimentos de', mesAno, error)
              return []
            })
        )
      )
      const flatted = results.flat()
      console.log('Todos investimentos carregados:', flatted)
      return flatted
    },
  })

  // Consolidação de dados
  const consolidacao = useMemo(() => {
    const rendaLiquidaTotal = (allRendas as any).reduce((sum: number, r: any) => sum + (parseFloat(r.valor_liquido) || 0), 0)
    const gastosFixosTotal = (allGastos as any).reduce((sum: number, g: any) => sum + (parseFloat(g.valor) || 0), 0)
    const gastosVariaveisTotal = (allGastosVariaveis as any).reduce((sum: number, g: any) => sum + (parseFloat(g.valor) || 0), 0)
    const dividasTotal = (allDividas as any).reduce((sum: number, d: any) => {
      const parcela = parseFloat(d.parcela) || 0
      const parcelasPagas = d.parcelas_pagas || 0
      const parcelasTotal = d.parcelas_totais || 1
      const saldoDevedor = (parcelasTotal - parcelasPagas) * parcela
      return sum + saldoDevedor
    }, 0)
    const investimentosTotal = (allInvestimentos as any).reduce((sum: number, inv: any) => sum + (parseFloat(inv.valor) || 0), 0)

    const duvidasQuitadas = (allDividas as any).filter((d: any) => d.quitado || d.parcelas_pagas >= d.parcelas_totais).length
    const duvidasAberta = (allDividas as any).filter((d: any) => !d.quitado && d.parcelas_pagas < d.parcelas_totais).length

    const totalGastos = gastosFixosTotal + gastosVariaveisTotal + dividasTotal
    const saldo = rendaLiquidaTotal - totalGastos

    return {
      rendaLiquidaTotal,
      gastosFixosTotal,
      gastosVariaveisTotal,
      dividasTotal,
      investimentosTotal,
      duvidasQuitadas,
      duvidasAberta,
      totalGastos,
      saldo,
    }
  }, [allRendas, allGastos, allGastosVariaveis, allDividas, allInvestimentos])

  // Dados por mês com saldo acumulado
  const dadosPorMes = useMemo(() => {
    const dados: any[] = []
    let saldoAcumulado = 0

    mesesDoAno.forEach((mesAno, index) => {
      const [year, month] = mesAno.split('-')
      const mesNum = parseInt(month)
      const nomesMeses = [
        'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
      ]

      const rendaMes = (allRendas as any)
        .filter((r: any) => r.mes_ano === mesAno)
        .reduce((sum: number, r: any) => sum + (parseFloat(r.valor_liquido) || 0), 0)

      const gastoFixoMes = (allGastos as any)
        .filter((g: any) => g.mes_ano === mesAno)
        .reduce((sum: number, g: any) => sum + (parseFloat(g.valor) || 0), 0)

      const gastoVariavelMes = (allGastosVariaveis as any)
        .filter((g: any) => g.mes_ano === mesAno)
        .reduce((sum: number, g: any) => sum + (parseFloat(g.valor) || 0), 0)

      const dividaMes = (allDividas as any)
        .filter((d: any) => d.mes_ano === mesAno)
        .reduce((sum: number, d: any) => {
          const parcela = parseFloat(d.parcela) || 0
          const parcelasPagas = d.parcelas_pagas || 0
          const parcelasTotal = d.parcelas_totais || 1
          const saldoDevedor = (parcelasTotal - parcelasPagas) * parcela
          return sum + saldoDevedor
        }, 0)

      const investimentoMes = (allInvestimentos as any)
        .filter((i: any) => i.mes_ano === mesAno)
        .reduce((sum: number, i: any) => sum + (parseFloat(i.valor) || 0), 0)

      const totalGastoMes = gastoFixoMes + gastoVariavelMes + dividaMes
      // Sobra Final = Renda - Gastos Fixos - Gastos Variáveis - Dívidas - Investimentos
      const sobraFinalMes = rendaMes - totalGastoMes - investimentoMes

      // Acumula a sobra para o próximo mês
      saldoAcumulado += sobraFinalMes

      const dataPoint = {
        mes: nomesMeses[mesNum - 1],
        Renda: Math.round(rendaMes),
        'Gastos Fixos': Math.round(gastoFixoMes),
        'Gastos Variáveis': Math.round(gastoVariavelMes),
        Dívidas: Math.round(dividaMes),
        Investimentos: Math.round(investimentoMes),
        'Saldo Acumulado': Math.round(saldoAcumulado),
      }

      // Debug log
      if (rendaMes > 0 || sobraFinalMes !== 0) {
        console.log(`[${nomesMeses[mesNum - 1]}] Renda: ${rendaMes.toFixed(2)}, Gastos: ${totalGastoMes.toFixed(2)}, Investimentos: ${investimentoMes.toFixed(2)}, Sobra: ${sobraFinalMes.toFixed(2)}, Acumulado: ${saldoAcumulado.toFixed(2)}`)
      }

      dados.push(dataPoint)
    })

    console.log('Dados por mês completo:', dados)
    return dados
  }, [allRendas, allGastos, allGastosVariaveis, allDividas, allInvestimentos, mesesDoAno])

  // Dados para gráfico de pizza
  const dadosPizza = useMemo(() => {
    return [
      { name: 'Gastos Fixos', value: Math.round(consolidacao.gastosFixosTotal) },
      { name: 'Gastos Variáveis', value: Math.round(consolidacao.gastosVariaveisTotal) },
      { name: 'Dívidas', value: Math.round(consolidacao.dividasTotal) },
    ].filter(item => item.value > 0)
  }, [consolidacao])

  const COLORS = ['#f97316', '#ec4899', '#8b5cf6']

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const toggleDarkMode = () => {
    const newValue = !isDark
    setIsDarkState(newValue)
    const root = document.documentElement
    if (newValue) {
      root.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      root.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }

  const Card = ({ label, value, icon: Icon, color = 'orange' }: any) => {
    const colorClass = {
      orange: 'text-orange-400',
      green: 'text-green-400',
      red: 'text-red-400',
      blue: 'text-blue-400',
      purple: 'text-purple-400',
    }[color]

    return (
      <div className={`${isDark ? 'bg-dark-800' : 'bg-white'} rounded-lg p-6 shadow-lg`}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>{label}</p>
            <p className={`text-3xl font-bold ${colorClass}`}>{formatCurrency(value)}</p>
          </div>
          <div className={`p-3 rounded-lg ${isDark ? 'bg-dark-700' : 'bg-gray-100'}`}>
            <Icon className={`w-6 h-6 ${colorClass}`} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={isDark ? 'dark' : ''}>
      <div className={`min-h-screen ${isDark ? 'bg-dark-900' : 'bg-gray-50'}`}>
        <Navbar isDark={isDark} toggleDarkMode={toggleDarkMode} userName={user?.nome || 'Usuário'} onLogout={handleLogout} trialEndsAt={user?.trialEndsAt} />

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Cards de Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <Card
              label="Renda Líquida Total"
              value={consolidacao.rendaLiquidaTotal}
              icon={TrendingUp}
              color="green"
            />
            <Card
              label="Gastos Fixos"
              value={consolidacao.gastosFixosTotal}
              icon={DollarSign}
              color="orange"
            />
            <Card
              label="Gastos Variáveis"
              value={consolidacao.gastosVariaveisTotal}
              icon={TrendingDown}
              color="red"
            />
            <Card
              label="Total Investido"
              value={consolidacao.investimentosTotal}
              icon={TrendingUp}
              color="purple"
            />
            <Card
              label="Saldo Final"
              value={consolidacao.saldo}
              icon={DollarSign}
              color={consolidacao.saldo >= 0 ? 'green' : 'red'}
            />
          </div>

          {/* Resumo Dívidas */}
          <div className={`${isDark ? 'bg-dark-800' : 'bg-white'} rounded-lg p-6 shadow-lg mb-8`}>
            <h2 className={`text-xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>📊 Resumo de Dívidas</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-2`}>Saldo Devedor Total</p>
                <p className={`text-3xl font-bold text-red-400`}>{formatCurrency(consolidacao.dividasTotal)}</p>
              </div>
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-2`}>Dívidas Quitadas</p>
                <p className={`text-3xl font-bold text-green-400`}>{consolidacao.duvidasQuitadas}</p>
              </div>
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-2`}>Dívidas em Aberto</p>
                <p className={`text-3xl font-bold text-orange-400`}>{consolidacao.duvidasAberta}</p>
              </div>
            </div>
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Gráfico de Barras - Mensual */}
            <div className={`${isDark ? 'bg-dark-800' : 'bg-white'} rounded-lg p-6 shadow-lg`}>
              <h2 className={`text-xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>📈 Fluxo Mensal</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dadosPorMes}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#404854' : '#e5e7eb'} />
                  <XAxis dataKey="mes" stroke={isDark ? '#9ca3af' : '#6b7280'} />
                  <YAxis stroke={isDark ? '#9ca3af' : '#6b7280'} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#1f2937' : '#ffffff',
                      border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                      borderRadius: '8px',
                      color: isDark ? '#f3f4f6' : '#111827',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="Renda" fill="#22c55e" />
                  <Bar dataKey="Gastos Fixos" fill="#f97316" />
                  <Bar dataKey="Gastos Variáveis" fill="#ec4899" />
                  <Bar dataKey="Investimentos" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Gráfico de Pizza - Distribuição */}
            <div className={`${isDark ? 'bg-dark-800' : 'bg-white'} rounded-lg p-6 shadow-lg`}>
              <h2 className={`text-xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>🍰 Distribuição de Gastos</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={dadosPizza}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {dadosPizza.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => formatCurrency(value as number)}
                    contentStyle={{
                      backgroundColor: isDark ? '#1f2937' : '#ffffff',
                      border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                      borderRadius: '8px',
                      color: isDark ? '#f3f4f6' : '#111827',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gráfico de Linha - Saldo Acumulado */}
          <div className={`${isDark ? 'bg-dark-800' : 'bg-white'} rounded-lg p-6 shadow-lg`}>
            <h2 className={`text-xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>📊 Evolução do Saldo</h2>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={dadosPorMes}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#404854' : '#e5e7eb'} />
                <XAxis dataKey="mes" stroke={isDark ? '#9ca3af' : '#6b7280'} />
                <YAxis stroke={isDark ? '#9ca3af' : '#6b7280'} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#1f2937' : '#ffffff',
                    border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                    borderRadius: '8px',
                    color: isDark ? '#f3f4f6' : '#111827',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="Renda"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={{ fill: '#22c55e', r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="Saldo Acumulado"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Alertas */}
          {consolidacao.saldo < 0 && (
            <div className={`${isDark ? 'bg-red-900 border-red-700' : 'bg-red-50 border-red-200'} border rounded-lg p-4 mt-8 flex items-start gap-4`}>
              <AlertCircle className={`w-6 h-6 ${isDark ? 'text-red-400' : 'text-red-600'} flex-shrink-0 mt-0.5`} />
              <div>
                <p className={`font-semibold ${isDark ? 'text-red-200' : 'text-red-800'}`}>⚠️ Saldo Negativo</p>
                <p className={`text-sm ${isDark ? 'text-red-300' : 'text-red-700'}`}>
                  Seus gastos ultrapassaram sua renda em {formatCurrency(Math.abs(consolidacao.saldo))}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
