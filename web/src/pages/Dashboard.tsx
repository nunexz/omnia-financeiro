import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { LogOut, User, Sun, Moon, Plus, Trash2, Edit2, Settings, FileJson, Calculator, TrendingUp, X } from 'lucide-react'
import { rendasAPI, gastosFixosAPI, dividasAPI, gastosVariaveisAPI, investimentosAPI, copyDataAPI } from '../services/api'
import Logo from '../components/Logo'
import MonthYearPicker from '../components/MonthYearPicker'
import ModalAddRenda from '../components/ModalAddRenda'
import ModalEditRenda from '../components/ModalEditRenda'
import ModalAddGastoFixo from '../components/ModalAddGastoFixo'
import ModalEditGastoFixo from '../components/ModalEditGastoFixo'
import ModalAddDivida from '../components/ModalAddDivida'
import ModalEditDivida from '../components/ModalEditDivida'
import ModalGerenciarDivida from '../components/ModalGerenciarDivida'
import ModalAddGastoVariavel from '../components/ModalAddGastoVariavel'
import ModalEditGastoVariavel from '../components/ModalEditGastoVariavel'
import ModalExportImport from '../components/ModalExportImport'
import ModalConfiguracao13 from '../components/ModalConfiguracao13'
import ModalAddInvestimento from '../components/ModalAddInvestimento'
import ModalEditInvestimento from '../components/ModalEditInvestimento'
import Navbar from '../components/Navbar'

export default function Dashboard() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, logout } = useAuthStore()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [activeTab, setActiveTab] = useState('rendas')
  const [isDark, setIsDarkState] = useState(() => {
    const saved = localStorage.getItem('theme')
    if (saved) return saved === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  const [isAddRendaOpen, setIsAddRendaOpen] = useState(false)
  const [isEditRendaOpen, setIsEditRendaOpen] = useState(false)
  const [selectedRenda, setSelectedRenda] = useState<any>(null)
  const [isAddGastoOpen, setIsAddGastoOpen] = useState(false)
  const [isEditGastoOpen, setIsEditGastoOpen] = useState(false)
  const [selectedGasto, setSelectedGasto] = useState<any>(null)
  const [isAddDividaOpen, setIsAddDividaOpen] = useState(false)
  const [isEditDividaOpen, setIsEditDividaOpen] = useState(false)
  const [selectedDivida, setSelectedDivida] = useState<any>(null)
  const [gerenciarDividaOpen, setGerenciarDividaOpen] = useState(false)
  const [dividaSelecionada, setDividaSelecionada] = useState<any>(null)

  const [isAddGastoVariavelOpen, setIsAddGastoVariavelOpen] = useState(false)
  const [isEditGastoVariavelOpen, setIsEditGastoVariavelOpen] = useState(false)
  const [selectedGastoVariavel, setSelectedGastoVariavel] = useState<any>(null)

  const [isExportImportOpen, setIsExportImportOpen] = useState(false)
  const [isConfiguracao13Open, setIsConfiguracao13Open] = useState(false)
  const [mes13Parcela1, setMes13Parcela1] = useState(11)
  const [mes13Parcela2, setMes13Parcela2] = useState(12)

  const [isAddInvestimentoOpen, setIsAddInvestimentoOpen] = useState(false)
  const [isEditInvestimentoOpen, setIsEditInvestimentoOpen] = useState(false)
  const [selectedInvestimento, setSelectedInvestimento] = useState<any>(null)

  const [confirmacaoAberta, setConfirmacaoAberta] = useState(false)
  const [tipoConfirmacao, setTipoConfirmacao] = useState<'limpar' | 'copiar'>('limpar')

  const mesAno = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`

  // Gerar lista de meses do ano até o mês atual
  const mesesAteAgora = Array.from({ length: currentMonth.getMonth() + 1 }, (_, i) => {
    const mes = i + 1
    return `${currentMonth.getFullYear()}-${String(mes).padStart(2, '0')}`
  })

  const { data: rendas = [] } = useQuery({
    queryKey: ['rendas', mesAno],
    queryFn: async () => {
      const response = await rendasAPI.getRenda(mesAno)
      return Array.isArray(response.data) ? response.data : []
    },
  })

  const { data: gastos = [] } = useQuery({
    queryKey: ['gastos', mesAno],
    queryFn: async () => {
      const response = await gastosFixosAPI.getGastos(mesAno)
      return Array.isArray(response.data) ? response.data : []
    },
  })

  const { data: dividas = [] } = useQuery({
    queryKey: ['dividas', mesAno],
    queryFn: async () => {
      const response = await dividasAPI.getDividas(mesAno)
      return Array.isArray(response.data) ? response.data : []
    },
  })

  const { data: gastosVariaveis = [] } = useQuery({
    queryKey: ['gastos-variaveis', mesAno],
    queryFn: async () => {
      try {
        const response = await gastosVariaveisAPI.getGastos(mesAno)
        return Array.isArray(response.data) ? response.data : []
      } catch {
        return []
      }
    },
  })

  const { data: investimentos = [] } = useQuery({
    queryKey: ['investimentos', mesAno],
    queryFn: async () => {
      try {
        const response = await investimentosAPI.getInvestimentos(mesAno)
        return Array.isArray(response.data) ? response.data : []
      } catch {
        return []
      }
    },
  })

  // Buscar dados de todos os meses para calcular saldo acumulado
  const { data: todasAsRendas = [] } = useQuery({
    queryKey: ['rendas-ano', mesAno],
    queryFn: async () => {
      const results = await Promise.all(
        mesesAteAgora.map(m => rendasAPI.getRenda(m).catch(() => ({ data: [] })))
      )
      return results.flatMap(r => Array.isArray(r.data) ? r.data : [])
    },
  })

  const { data: todosGastos = [] } = useQuery({
    queryKey: ['gastos-ano', mesAno],
    queryFn: async () => {
      const results = await Promise.all(
        mesesAteAgora.map(m => gastosFixosAPI.getGastos(m).catch(() => ({ data: [] })))
      )
      return results.flatMap(r => Array.isArray(r.data) ? r.data : [])
    },
  })

  const { data: todasDividas = [] } = useQuery({
    queryKey: ['dividas-ano', mesAno],
    queryFn: async () => {
      const results = await Promise.all(
        mesesAteAgora.map(m => dividasAPI.getDividas(m).catch(() => ({ data: [] })))
      )
      return results.flatMap(r => Array.isArray(r.data) ? r.data : [])
    },
  })

  const { data: todosGastosVariaveis = [] } = useQuery({
    queryKey: ['gastos-variaveis-ano', mesAno],
    queryFn: async () => {
      const results = await Promise.all(
        mesesAteAgora.map(m => gastosVariaveisAPI.getGastos(m).catch(() => ({ data: [] })))
      )
      return results.flatMap(r => Array.isArray(r.data) ? r.data : [])
    },
  })

  const { data: todosInvestimentos = [] } = useQuery({
    queryKey: ['investimentos-ano', mesAno],
    queryFn: async () => {
      const results = await Promise.all(
        mesesAteAgora.map(m =>
          investimentosAPI.getInvestimentos(m).then(response => Array.isArray(response.data) ? response.data : []).catch(() => [])
        )
      )
      return results.flatMap(r => r)
    },
  })

  const deleteRendaMutation = useMutation({
    mutationFn: (id: string) => rendasAPI.deleteRenda(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rendas', mesAno] }),
  })

  const deleteGastoMutation = useMutation({
    mutationFn: (id: string) => gastosFixosAPI.deleteGasto(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['gastos', mesAno] }),
  })

  const deleteDividaMutation = useMutation({
    mutationFn: (id: string) => dividasAPI.deleteDivida(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dividas', mesAno] }),
  })

  const deleteGastoVariavelMutation = useMutation({
    mutationFn: (id: string) => gastosVariaveisAPI.deleteGasto(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['gastos-variaveis', mesAno] }),
  })

  const marcarGastoPagoMutation = useMutation({
    mutationFn: (id: string) => {
      const gasto = (gastos as any).find((g: any) => g.id === id)
      return gastosFixosAPI.marcarPago(id, !gasto?.pago)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['gastos', mesAno] }),
  })

  const marcarDividaPagoMutation = useMutation({
    mutationFn: (id: string) => {
      const divida = (dividas as any).find((d: any) => d.id === id)
      return dividasAPI.marcarPago(id, !divida?.pago)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['dividas', mesAno] }),
  })

  const deleteInvestimentoMutation = useMutation({
    mutationFn: (id: string) => investimentosAPI.deleteInvestimento(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['investimentos', mesAno] }),
  })

  const copyDataMutation = useMutation({
    mutationFn: () => copyDataAPI.copyFromPreviousMonth(mesAno),
    onSuccess: () => {
      setConfirmacaoAberta(false)
      queryClient.invalidateQueries({ queryKey: ['rendas', mesAno] })
      queryClient.invalidateQueries({ queryKey: ['gastos', mesAno] })
      queryClient.invalidateQueries({ queryKey: ['dividas', mesAno] })
      queryClient.invalidateQueries({ queryKey: ['investimentos', mesAno] })
    },
  })

  const clearMonthMutation = useMutation({
    mutationFn: () => copyDataAPI.clearMonth(mesAno),
    onSuccess: () => {
      setConfirmacaoAberta(false)
      queryClient.invalidateQueries({ queryKey: ['rendas', mesAno] })
      queryClient.invalidateQueries({ queryKey: ['gastos', mesAno] })
      queryClient.invalidateQueries({ queryKey: ['dividas', mesAno] })
      queryClient.invalidateQueries({ queryKey: ['investimentos', mesAno] })
      queryClient.invalidateQueries({ queryKey: ['gastos-variaveis', mesAno] })
    },
  })

  const adicionar13Mutation = useMutation({
    mutationFn: () => {
      // Calcular salário médio das rendas do mês anterior
      const mesAnterior = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
      const mesAnteriorAno = `${mesAnterior.getFullYear()}-${String(mesAnterior.getMonth() + 1).padStart(2, '0')}`
      const rendadoMesAnterior = rendas.find(r => r.mes_ano === mesAnteriorAno)
      const salarioBase = rendadoMesAnterior ? rendadoMesAnterior.valor_bruto : 0

      return rendasAPI.adicionar13Automatico({
        salarioBase,
        mes1Parcela: mes13Parcela1,
        mes2Parcela: mes13Parcela2,
        dependentes: 0,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rendas', mesAno] })
    },
  })

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

  const formatMonth = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  }

  const formatCurrency = (value: any) => {
    const num = typeof value === 'number' ? value : parseFloat(value)
    if (isNaN(num)) return 'R$ 0,00'
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num)
  }

  const totalRendas = (rendas as any).reduce((sum: number, r: any) => sum + (parseFloat(r.valor_liquido) || 0), 0)
  const totalGastos = (gastos as any).reduce((sum: number, g: any) => sum + (parseFloat(g.valor) || 0), 0)
  const totalGastosVariaveis = (gastosVariaveis as any).reduce((sum: number, g: any) => sum + (parseFloat(g.valor) || 0), 0)
  const totalDividas = (dividas as any).reduce((sum: number, d: any) => sum + (parseFloat(d.parcela) || 0), 0)
  const totalInvestimentos = (investimentos as any).reduce((sum: number, inv: any) => sum + (parseFloat(inv.valor) || 0), 0)
  const sobraFinal = totalRendas - totalGastos - totalGastosVariaveis - totalDividas - totalInvestimentos

  // Calcular saldo acumulado até o mês selecionado
  const saldoAcumulado = useMemo(() => {
    let acumulado = 0

    mesesAteAgora.forEach((m) => {
      const rendaMes = (todasAsRendas as any)
        .filter((r: any) => r.mes_ano === m)
        .reduce((sum: number, r: any) => sum + (parseFloat(r.valor_liquido) || 0), 0)

      const gastoMes = (todosGastos as any)
        .filter((g: any) => g.mes_ano === m)
        .reduce((sum: number, g: any) => sum + (parseFloat(g.valor) || 0), 0)

      const gastoVariavelMes = (todosGastosVariaveis as any)
        .filter((g: any) => g.mes_ano === m)
        .reduce((sum: number, g: any) => sum + (parseFloat(g.valor) || 0), 0)

      const dividaMes = (todasDividas as any)
        .filter((d: any) => d.mes_ano === m)
        .reduce((sum: number, d: any) => sum + (parseFloat(d.parcela) || 0), 0)

      const investimentoMes = (todosInvestimentos as any)
        .filter((i: any) => i.mes_ano === m)
        .reduce((sum: number, i: any) => sum + (parseFloat(i.valor) || 0), 0)

      const sobraMes = rendaMes - gastoMes - gastoVariavelMes - dividaMes - investimentoMes
      acumulado += sobraMes

      if (sobraMes !== 0 || rendaMes > 0) {
        console.log(`[${m}] Renda: ${rendaMes.toFixed(2)}, Gastos: ${(gastoMes + gastoVariavelMes + dividaMes).toFixed(2)}, Investimentos: ${investimentoMes.toFixed(2)}, Sobra: ${sobraMes.toFixed(2)}, Acumulado: ${acumulado.toFixed(2)}`)
      }
    })

    return acumulado
  }, [todasAsRendas, todosGastos, todosGastosVariaveis, todasDividas, todosInvestimentos, mesesAteAgora])

  return (
    <div className={isDark ? 'dark' : ''}>
      <div className={`min-h-screen ${isDark ? 'bg-dark-900' : 'bg-gray-50'}`}>
        {/* Navbar */}
        <Navbar
          isDark={isDark}
          toggleDarkMode={toggleDarkMode}
          userName={user?.nome || 'Usuário'}
          onLogout={handleLogout}
          trialEndsAt={user?.trialEndsAt}
        />

        {/* Backup Button - Mobile friendly */}
        <div className="md:hidden fixed bottom-20 right-4 z-40">
          <button
            onClick={() => setIsExportImportOpen(true)}
            className={`p-3 rounded-full shadow-lg transition ${isDark ? 'bg-blue-900 hover:bg-blue-800 text-blue-200' : 'bg-blue-100 hover:bg-blue-200 text-blue-800'}`}
            title="Backup e Restaurar"
          >
            <FileJson className="w-5 h-5" />
          </button>
        </div>


        {/* Trial Warning */}
        {user?.trialEndsAt && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            {(() => {
              const trialDate = new Date(user.trialEndsAt);
              const today = new Date();
              const daysLeft = Math.ceil((trialDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

              if (daysLeft > 0) {
                return (
                  <div className={`p-4 rounded-lg border ${
                    daysLeft <= 3
                      ? `${isDark ? 'bg-red-950 border-red-800' : 'bg-red-50 border-red-200'}`
                      : `${isDark ? 'bg-yellow-950 border-yellow-800' : 'bg-yellow-50 border-yellow-200'}`
                  }`}>
                    <p className={`font-semibold ${
                      daysLeft <= 3
                        ? isDark ? 'text-red-200' : 'text-red-800'
                        : isDark ? 'text-yellow-200' : 'text-yellow-800'
                    }`}>
                      ⏰ Seu período de teste expira em <strong>{daysLeft} dia{daysLeft !== 1 ? 's' : ''}</strong> ({trialDate.toLocaleDateString('pt-BR')})
                    </p>
                    <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Entre em contato com o administrador para liberar acesso permanente.
                    </p>
                  </div>
                );
              }
              return null;
            })()}
          </div>
        )}

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h2 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>Visão Mensal</h2>
            <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Selecione o mês e ano para visualizar</p>
          </div>

          {/* Month Selector */}
          <div className={`${isDark ? 'bg-dark-800' : 'bg-white'} rounded-lg shadow p-6 mb-8`}>
            <div className="flex items-center gap-4 flex-wrap">
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                className={`px-4 py-2 rounded-lg ${isDark ? 'bg-dark-700 hover:bg-dark-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
              >
                ← Anterior
              </button>
              <span className={`text-xl font-semibold min-w-fit ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {formatMonth(currentMonth)}
              </span>
              <button
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                className={`px-4 py-2 rounded-lg ${isDark ? 'bg-dark-700 hover:bg-dark-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
              >
                Próximo →
              </button>
              <MonthYearPicker currentMonth={currentMonth} onMonthChange={setCurrentMonth} isDark={isDark} />
              <button
                onClick={() => {
                  setTipoConfirmacao('copiar')
                  setConfirmacaoAberta(true)
                }}
                disabled={copyDataMutation.isPending}
                className={`px-4 py-2 rounded-lg transition ml-auto ${isDark ? 'bg-blue-900 hover:bg-blue-800 text-blue-200' : 'bg-blue-100 hover:bg-blue-200 text-blue-800'} disabled:opacity-50`}
                title="Copiar dados do mês anterior"
              >
                {copyDataMutation.isPending ? '⏳ Copiando...' : '📋 Copiar mês anterior'}
              </button>
              <button
                onClick={() => {
                  setTipoConfirmacao('limpar')
                  setConfirmacaoAberta(true)
                }}
                disabled={clearMonthMutation.isPending}
                className={`px-4 py-2 rounded-lg transition ${isDark ? 'bg-red-900 hover:bg-red-800 text-red-200' : 'bg-red-100 hover:bg-red-200 text-red-800'} disabled:opacity-50`}
                title="Apagar todos os dados deste mês"
              >
                {clearMonthMutation.isPending ? '⏳ Apagando...' : '🗑️ Limpar mês'}
              </button>
              {(currentMonth.getMonth() === 10 || currentMonth.getMonth() === 11) && (
                <button
                  onClick={() => setIsConfiguracao13Open(true)}
                  className={`px-4 py-2 rounded-lg transition ${isDark ? 'bg-yellow-900 hover:bg-yellow-800 text-yellow-200' : 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800'}`}
                  title="Adicionar 13º salário automaticamente"
                >
                  🎁 Configurar 13º
                </button>
              )}
            </div>
          </div>

          {/* Dashboard Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className={`${isDark ? 'bg-dark-800' : 'bg-white'} rounded-lg shadow p-6`}>
              <p className={`text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Renda Líquida</p>
              <p className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(totalRendas)}</p>
            </div>
            <div className={`${isDark ? 'bg-dark-800' : 'bg-white'} rounded-lg shadow p-6`}>
              <p className={`text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Gastos + Dívidas</p>
              <p className={`text-3xl font-bold ${isDark ? 'text-red-400' : 'text-red-600'}`}>{formatCurrency(totalGastos + totalGastosVariaveis + totalDividas)}</p>
            </div>
            <div className={`${isDark ? 'bg-dark-800' : 'bg-white'} rounded-lg shadow p-6`}>
              <p className={`text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Total Investido</p>
              <p className={`text-3xl font-bold ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>{formatCurrency(totalInvestimentos)}</p>
            </div>
            <div className={`${isDark ? 'bg-dark-800' : 'bg-white'} rounded-lg shadow p-6`}>
              <p className={`text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Saldo Acumulado</p>
              <p className={`text-3xl font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>{formatCurrency(saldoAcumulado)}</p>
            </div>
          </div>

          {/* Tabs */}
          <div className={`${isDark ? 'bg-dark-800' : 'bg-white'} rounded-lg shadow`}>
            <div className={`border-b ${isDark ? 'border-dark-700' : 'border-gray-200'} flex`}>
              {[
                { id: 'rendas', label: 'Rendas' },
                { id: 'gastos', label: 'Gastos Fixos' },
                { id: 'dividas', label: 'Dívidas' },
                { id: 'gastos-variaveis', label: 'Gastos do Dia' },
                { id: 'investimentos', label: 'Investimentos' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-4 font-medium border-b-2 transition ${
                    activeTab === tab.id
                      ? `border-orange-500 text-orange-500`
                      : `border-transparent ${isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'}`
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-6">
              {activeTab === 'rendas' && (
                <div className="space-y-4">
                  <button
                    onClick={() => setIsAddRendaOpen(true)}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar Renda
                  </button>
                  {rendas.length === 0 ? (
                    <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>Nenhuma renda cadastrada</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className={`border-b ${isDark ? 'border-dark-700' : 'border-gray-200'}`}>
                          <th className={`text-left py-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Nome</th>
                          <th className={`text-right py-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Bruto</th>
                          <th className={`text-right py-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Líquido</th>
                          <th className={`text-center py-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(rendas as any).map((renda: any) => (
                          <tr key={renda.id} className={`border-b ${isDark ? 'border-dark-700' : 'border-gray-200'}`}>
                            <td className={isDark ? 'text-gray-300' : 'text-gray-900'}>{renda.nome}</td>
                            <td className={`text-right ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>{formatCurrency(renda.valor_bruto)}</td>
                            <td className={`text-right font-semibold ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>{formatCurrency(renda.valor_liquido)}</td>
                            <td className="text-center flex gap-2 justify-center">
                              <button
                                onClick={() => {
                                  setSelectedRenda(renda)
                                  setIsEditRendaOpen(true)
                                }}
                                className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900 rounded"
                              >
                                <Edit2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                              </button>
                              <button
                                onClick={() => deleteRendaMutation.mutate(renda.id)}
                                className="p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded"
                              >
                                <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {activeTab === 'gastos' && (
                <div className="space-y-4">
                  <button
                    onClick={() => setIsAddGastoOpen(true)}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar Gasto Fixo
                  </button>
                  {gastos.length === 0 ? (
                    <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>Nenhum gasto fixo cadastrado</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className={`border-b ${isDark ? 'border-dark-700' : 'border-gray-200'}`}>
                          <th className={`text-left py-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Nome</th>
                          <th className={`text-right py-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Valor</th>
                          <th className={`text-center py-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Vencimento</th>
                          <th className={`text-center py-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Status</th>
                          <th className={`text-center py-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(gastos as any).map((gasto: any) => (
                          <tr key={gasto.id} className={`border-b ${isDark ? 'border-dark-700' : 'border-gray-200'}`}>
                            <td className={isDark ? 'text-gray-300' : 'text-gray-900'}>{gasto.nome}</td>
                            <td className={`text-right ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>{formatCurrency(gasto.valor)}</td>
                            <td className={`text-center ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>{gasto.vencimento}º</td>
                            <td className="text-center">
                              <button
                                onClick={() => marcarGastoPagoMutation.mutate(gasto.id)}
                                className={`text-xs px-3 py-1 rounded-full cursor-pointer ${
                                  gasto.pago
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                }`}
                              >
                                {gasto.pago ? '✓ Pago' : '○ Pendente'}
                              </button>
                            </td>
                            <td className="text-center flex gap-2 justify-center">
                              <button
                                onClick={() => {
                                  setSelectedGasto(gasto)
                                  setIsEditGastoOpen(true)
                                }}
                                className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900 rounded"
                              >
                                <Edit2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                              </button>
                              <button
                                onClick={() => deleteGastoMutation.mutate(gasto.id)}
                                className="p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded"
                              >
                                <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {activeTab === 'dividas' && (
                <div className="space-y-4">
                  <button
                    onClick={() => setIsAddDividaOpen(true)}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar Dívida
                  </button>
                  {dividas.length === 0 ? (
                    <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>Nenhuma dívida cadastrada</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className={`border-b ${isDark ? 'border-dark-700' : 'border-gray-200'}`}>
                          <th className={`text-left py-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Nome</th>
                          <th className={`text-right py-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Parcela</th>
                          <th className={`text-right py-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Saldo</th>
                          <th className={`text-center py-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Progresso</th>
                          <th className={`text-center py-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Status</th>
                          <th className={`text-center py-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(dividas as any).map((divida: any) => (
                          <tr key={divida.id} className={`border-b ${isDark ? 'border-dark-700' : 'border-gray-200'}`}>
                            <td className={isDark ? 'text-gray-300' : 'text-gray-900'}>{divida.nome}</td>
                            <td className={`text-right ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>{formatCurrency(divida.parcela)}</td>
                            <td className={`text-right font-semibold ${divida.quitado ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{formatCurrency(divida.saldo_devedor)}</td>
                            <td className={`text-center text-xs ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>{divida.parcelas_pagas}/{divida.parcelas_totais}</td>
                            <td className="text-center">
                              <button
                                onClick={() => marcarDividaPagoMutation.mutate(divida.id)}
                                className={`text-xs px-3 py-1 rounded-full cursor-pointer ${
                                  divida.pago
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                }`}
                              >
                                {divida.pago ? '✓ Pago' : '○ Pendente'}
                              </button>
                            </td>
                            <td className="text-center flex gap-2 justify-center">
                              <button
                                onClick={() => {
                                  setDividaSelecionada(divida)
                                  setGerenciarDividaOpen(true)
                                }}
                                className="p-1 hover:bg-orange-100 dark:hover:bg-orange-900 rounded"
                              >
                                <Settings className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedDivida(divida)
                                  setIsEditDividaOpen(true)
                                }}
                                className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900 rounded"
                              >
                                <Edit2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                              </button>
                              <button
                                onClick={() => deleteDividaMutation.mutate(divida.id)}
                                className="p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded"
                              >
                                <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {activeTab === 'gastos-variaveis' && (
                <div className="space-y-4">
                  <button
                    onClick={() => setIsAddGastoVariavelOpen(true)}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar Gasto
                  </button>
                  {gastosVariaveis.length === 0 ? (
                    <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>Nenhum gasto do dia cadastrado</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className={`border-b ${isDark ? 'border-dark-700' : 'border-gray-200'}`}>
                          <th className={`text-left py-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Descrição</th>
                          <th className={`text-right py-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Valor</th>
                          <th className={`text-left py-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Categoria</th>
                          <th className={`text-center py-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Data</th>
                          <th className={`text-center py-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(gastosVariaveis as any).map((gasto: any) => (
                          <tr key={gasto.id} className={`border-b ${isDark ? 'border-dark-700' : 'border-gray-200'}`}>
                            <td className={isDark ? 'text-gray-300' : 'text-gray-900'}>{gasto.descricao}</td>
                            <td className={`text-right ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>{formatCurrency(gasto.valor)}</td>
                            <td className={`text-left ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>{gasto.categoria}</td>
                            <td className={`text-center ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>
                              {new Date(gasto.data).toLocaleDateString('pt-BR')}
                            </td>
                            <td className="text-center flex gap-2 justify-center">
                              <button
                                onClick={() => {
                                  setSelectedGastoVariavel(gasto)
                                  setIsEditGastoVariavelOpen(true)
                                }}
                                className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900 rounded"
                              >
                                <Edit2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                              </button>
                              <button
                                onClick={() => deleteGastoVariavelMutation.mutate(gasto.id)}
                                className="p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded"
                              >
                                <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}

              {activeTab === 'investimentos' && (
                <div className="space-y-4">
                  <button
                    onClick={() => setIsAddInvestimentoOpen(true)}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar Investimento
                  </button>
                  {investimentos.length === 0 ? (
                    <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>Nenhum investimento cadastrado</p>
                  ) : (
                    <div className="space-y-3">
                      <div className={`${isDark ? 'bg-dark-700' : 'bg-gray-100'} p-4 rounded-lg`}>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Total Investido neste Mês</p>
                        <p className={`text-2xl font-bold ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
                          {formatCurrency((investimentos as any).reduce((sum: number, inv: any) => sum + inv.valor, 0))}
                        </p>
                      </div>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className={`border-b ${isDark ? 'border-dark-700' : 'border-gray-200'}`}>
                            <th className={`text-left py-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Nome</th>
                            <th className={`text-right py-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Valor</th>
                            <th className={`text-left py-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Data</th>
                            <th className={`text-center py-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(investimentos as any).map((investimento: any) => (
                            <tr key={investimento.id} className={`border-b ${isDark ? 'border-dark-700' : 'border-gray-200'}`}>
                              <td className={isDark ? 'text-gray-300' : 'text-gray-900'}>{investimento.nome}</td>
                              <td className={`text-right ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>{formatCurrency(investimento.valor)}</td>
                              <td className={`text-left ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>
                                {new Date(investimento.createdAt).toLocaleDateString('pt-BR')}
                              </td>
                              <td className="text-center flex gap-2 justify-center">
                                <button
                                  onClick={() => {
                                    setSelectedInvestimento(investimento)
                                    setIsEditInvestimentoOpen(true)
                                  }}
                                  className="p-1 hover:bg-blue-100 dark:hover:bg-blue-900 rounded"
                                >
                                  <Edit2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                </button>
                                <button
                                  onClick={() => deleteInvestimentoMutation.mutate(investimento.id)}
                                  className="p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded"
                                >
                                  <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ModalAddRenda isOpen={isAddRendaOpen} onClose={() => setIsAddRendaOpen(false)} mesAno={mesAno} />
      <ModalEditRenda isOpen={isEditRendaOpen} onClose={() => setIsEditRendaOpen(false)} mesAno={mesAno} renda={selectedRenda} />
      <ModalAddGastoFixo isOpen={isAddGastoOpen} onClose={() => setIsAddGastoOpen(false)} mesAno={mesAno} />
      <ModalEditGastoFixo isOpen={isEditGastoOpen} onClose={() => setIsEditGastoOpen(false)} mesAno={mesAno} gasto={selectedGasto} />
      <ModalAddDivida isOpen={isAddDividaOpen} onClose={() => setIsAddDividaOpen(false)} mesAno={mesAno} />
      <ModalEditDivida isOpen={isEditDividaOpen} onClose={() => setIsEditDividaOpen(false)} mesAno={mesAno} divida={selectedDivida} />
      <ModalGerenciarDivida isOpen={gerenciarDividaOpen} onClose={() => setGerenciarDividaOpen(false)} mesAno={mesAno} divida={dividaSelecionada} />
      <ModalAddGastoVariavel isOpen={isAddGastoVariavelOpen} onClose={() => setIsAddGastoVariavelOpen(false)} mesAno={mesAno} />
      <ModalEditGastoVariavel isOpen={isEditGastoVariavelOpen} onClose={() => setIsEditGastoVariavelOpen(false)} mesAno={mesAno} gasto={selectedGastoVariavel} />
      <ModalAddInvestimento isOpen={isAddInvestimentoOpen} onClose={() => setIsAddInvestimentoOpen(false)} mesAno={mesAno} isDark={isDark} sobraFinal={sobraFinal} formatCurrency={formatCurrency} />
      <ModalEditInvestimento isOpen={isEditInvestimentoOpen} onClose={() => setIsEditInvestimentoOpen(false)} mesAno={mesAno} investimento={selectedInvestimento} isDark={isDark} />
      <ModalExportImport isOpen={isExportImportOpen} onClose={() => setIsExportImportOpen(false)} mesAno={mesAno} />
      <ModalConfiguracao13
        isOpen={isConfiguracao13Open}
        onClose={() => setIsConfiguracao13Open(false)}
        isDark={isDark}
        onSave={(mes1, mes2) => {
          setMes13Parcela1(mes1)
          setMes13Parcela2(mes2)
          adicionar13Mutation.mutate()
        }}
      />

      {/* Modal de Confirmação */}
      {confirmacaoAberta && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`${isDark ? 'bg-dark-800 border-dark-700' : 'bg-white'} rounded-lg shadow-xl border max-w-md w-full mx-4`}>
            <div className={`flex justify-between items-center px-6 py-4 border-b ${isDark ? 'border-dark-700' : 'border-gray-200'}`}>
              <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {tipoConfirmacao === 'copiar' ? '📋 Copiar Mês Anterior' : '🗑️ Apagar Dados do Mês'}
              </h2>
              <button onClick={() => setConfirmacaoAberta(false)} className={`p-1 hover:bg-opacity-20 rounded ${isDark ? 'hover:bg-white' : 'hover:bg-gray-200'}`}>
                <X size={20} className={isDark ? 'text-gray-400' : 'text-gray-600'} />
              </button>
            </div>

            <div className="px-6 py-6">
              {tipoConfirmacao === 'copiar' ? (
                <>
                  <p className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Tem certeza?</p>
                  <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
                    Você está prestes a copiar todos os dados do mês anterior para este mês. Dados existentes neste mês serão substituídos.
                  </p>
                </>
              ) : (
                <>
                  <p className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Tem certeza?</p>
                  <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
                    Você está prestes a apagar TODOS os dados de {formatMonth(currentMonth)}. Esta ação não pode ser desfeita!
                  </p>
                </>
              )}
            </div>

            <div className="flex gap-3 px-6 py-4 border-t border-dark-700">
              <button
                onClick={() => setConfirmacaoAberta(false)}
                className={`flex-1 px-4 py-2 rounded-lg font-semibold transition ${isDark ? 'bg-dark-700 text-gray-300 hover:bg-dark-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (tipoConfirmacao === 'copiar') {
                    copyDataMutation.mutate()
                  } else {
                    clearMonthMutation.mutate()
                  }
                }}
                disabled={copyDataMutation.isPending || clearMonthMutation.isPending}
                className={`flex-1 px-4 py-2 rounded-lg font-semibold transition disabled:opacity-50 ${
                  tipoConfirmacao === 'copiar'
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                {copyDataMutation.isPending || clearMonthMutation.isPending ? '⏳ Processando...' : 'Sim, tenho certeza'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
