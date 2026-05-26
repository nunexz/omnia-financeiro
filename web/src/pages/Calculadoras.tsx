import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { LogOut, User, Sun, Moon, Calculator, ArrowLeft } from 'lucide-react'
import Logo from '../components/Logo'
import Navbar from '../components/Navbar'

const calcularINSS = (bruto: number): number => {
  const faixas = [
    { limite: 1621.0, aliquota: 0.075 },
    { limite: 2902.84, aliquota: 0.09 },
    { limite: 4354.27, aliquota: 0.12 },
    { limite: 8475.55, aliquota: 0.14 },
  ]

  let inss = 0
  let baseAnterior = 0

  for (const faixa of faixas) {
    if (bruto <= faixa.limite) {
      inss += (bruto - baseAnterior) * faixa.aliquota
      return Math.min(inss, 908.86)
    }
    inss += (faixa.limite - baseAnterior) * faixa.aliquota
    baseAnterior = faixa.limite
  }

  inss += (bruto - baseAnterior) * 0.14
  return Math.min(inss, 908.86)
}

const calcularIRRF = (bruto: number, dependentes: number = 0): number => {
  if (bruto <= 5000) {
    return 0
  }

  const inss = calcularINSS(bruto)
  const deducaoPorDependente = 189.59 * dependentes
  const baseIRRF = bruto - inss - deducaoPorDependente

  let irrf = 0

  if (baseIRRF <= 2428.80) {
    irrf = 0
  } else if (baseIRRF <= 2826.65) {
    irrf = (baseIRRF * 0.075) - 182.16
  } else if (baseIRRF <= 3751.05) {
    irrf = (baseIRRF * 0.15) - 394.16
  } else if (baseIRRF <= 4664.68) {
    irrf = (baseIRRF * 0.225) - 675.49
  } else {
    irrf = (baseIRRF * 0.275) - 908.73
  }

  return Math.max(0, irrf)
}

export default function Calculadoras() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [isDark, setIsDarkState] = useState(() => {
    const saved = localStorage.getItem('theme')
    if (saved) return saved === 'dark'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })
  const [activeTab, setActiveTab] = useState('salario')

  // Salário Líquido
  const [salarioBruto, setSalarioBruto] = useState('')
  const [dependentes, setDependentes] = useState('0')
  const [isCLT, setIsCLT] = useState(true)

  const salarioLiquido = useMemo(() => {
    const bruto = parseFloat(salarioBruto) || 0
    if (!isCLT) {
      return { bruto, inss: 0, irrf: 0, liquido: bruto }
    }
    const inss = calcularINSS(bruto)
    const irrf = calcularIRRF(bruto, parseInt(dependentes) || 0)
    return { bruto, inss, irrf, liquido: bruto - inss - irrf }
  }, [salarioBruto, dependentes, isCLT])

  // 13º Salário - NOVO COM 2 PARCELAS
  const [salario13, setSalario13] = useState('')
  const [mesesTrabalhados13, setMesesTrabalhados13] = useState('12')
  const [antecipaComFerias13, setAntecipaComFerias13] = useState(false)

  const valor13 = useMemo(() => {
    const salario = parseFloat(salario13) || 0
    const meses = Math.min(parseInt(mesesTrabalhados13) || 12, 12)
    const proporcional = (salario / 12) * meses

    const primeira = proporcional / 2
    const inssTotal = calcularINSS(proporcional)
    const irrfTotal = calcularIRRF(proporcional, 0)

    return {
      proporcional,
      primeira: { valor: primeira, inss: 0, irrf: 0, liquido: primeira },
      segunda: { valor: proporcional / 2, inss: inssTotal, irrf: irrfTotal, liquido: proporcional / 2 - inssTotal - irrfTotal },
      totalBruto: proporcional,
      totalInss: inssTotal,
      totalIrrf: irrfTotal,
      totalLiquido: proporcional - inssTotal - irrfTotal,
      antecipaComFerias: antecipaComFerias13,
    }
  }, [salario13, mesesTrabalhados13, antecipaComFerias13])

  // Férias - NOVO COM DIAS VENDIDOS
  const [salarioFerias, setSalarioFerias] = useState('')
  const [diasVendidos, setDiasVendidos] = useState('0')

  const valorFerias = useMemo(() => {
    const salario = parseFloat(salarioFerias) || 0
    const dias = Math.min(parseInt(diasVendidos) || 0, 10)

    const diasGozados = 30 - dias
    const feriasBrutaGozada = (salario / 30) * diasGozados * (1 + 1/3)
    const feriasVendidas = (salario / 30) * dias * (1 + 1/3)
    const totalBruto = feriasBrutaGozada + feriasVendidas

    const inss = calcularINSS(totalBruto)
    const irrf = calcularIRRF(totalBruto, 0)

    return {
      diasGozados,
      diasVendidos: dias,
      feriasBrutaGozada,
      feriasVendidas,
      totalBruto,
      inss,
      irrf,
      liquido: totalBruto - inss - irrf,
    }
  }, [salarioFerias, diasVendidos])

  // Rescisão - NOVO COM AVISO PRÉVIO E MÚLTIPLOS COMPONENTES
  const [salarioRescisao, setSalarioRescisao] = useState('')
  const [diasTrabalhados, setDiasTrabalhados] = useState('30')
  const [mesesTrabalhados, setMesesTrabalhados] = useState('12')
  const [anosCompletos, setAnosCompletos] = useState('1')
  const [temAvisoPrevio, setTemAvisoPrevio] = useState(true)
  const [avisoPrevioTrabalhado, setAvisoPrevioTrabalhado] = useState(true)
  const [tipoRescisao, setTipoRescisao] = useState('sem-justa-causa') // 'sem-justa-causa' | 'com-acordo'

  const valorRescisao = useMemo(() => {
    const salario = parseFloat(salarioRescisao) || 0
    const dias = parseInt(diasTrabalhados) || 30
    const meses = parseInt(mesesTrabalhados) || 12
    const anos = parseInt(anosCompletos) || 1

    // Saldo de Salário
    const saldoSalario = (salario / 30) * dias

    // Aviso Prévio
    let diasAviso = 30
    if (anos > 1) {
      diasAviso = Math.min(30 + (anos - 1) * 3, 90)
    }
    const avisoPrevio = temAvisoPrevio ? (salario / 30) * diasAviso : 0

    // Férias Vencidas (30 dias) + Proporcionais (baseado em meses)
    const feriasVencidas = salario * (1 + 1/3)
    const feriasProporcional = (salario / 12) * meses * (1 + 1/3)

    // 13º Salário Proporcional
    const decimo13Proporcional = (salario / 12) * meses

    // FGTS (simulado - 40% para demissão, 20% para acordo)
    const fgtsAcumulado = salario * 12 * (meses / 12)
    const multaFGTS = tipoRescisao === 'sem-justa-causa' ? fgtsAcumulado * 0.40 : fgtsAcumulado * 0.20

    // Total Bruto
    const totalBruto = saldoSalario + avisoPrevio + feriasVencidas + feriasProporcional + decimo13Proporcional + multaFGTS

    // Descontos - Apenas em partes não-isentas
    // INSS: sobre saldo + 13º
    const baseInss = saldoSalario + decimo13Proporcional
    const inss = calcularINSS(baseInss)

    // IRRF: sobre saldo + 13º
    const irrf = calcularIRRF(baseInss, 0)

    // As seguintes são isentas:
    // - Aviso Prévio Indenizado
    // - Férias Indenizadas (vencidas + proporcionais com 1/3)
    // - Multa de FGTS (40% ou 20%)

    return {
      saldoSalario,
      avisoPrevio,
      diasAviso,
      avisoPrevioTrabalhado,
      feriasVencidas,
      feriasProporcional,
      decimo13Proporcional,
      multaFGTS,
      fgtsAcumulado,
      tipoRescisao,
      totalBruto,
      inss,
      irrf,
      liquido: totalBruto - inss - irrf,
      observacao: `Aviso Prévio: ${diasAviso} dias | FGTS Multa: ${tipoRescisao === 'sem-justa-causa' ? '40%' : '20%'}`,
    }
  }, [salarioRescisao, diasTrabalhados, mesesTrabalhados, anosCompletos, temAvisoPrevio, avisoPrevioTrabalhado, tipoRescisao])

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

  const ResultCard = ({ label, value, color = 'orange' }: any) => (
    <div className={`p-3 rounded-lg ${isDark ? 'bg-dark-700' : 'bg-gray-100'}`}>
      <p className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-1`}>{label}</p>
      <p className={`text-lg font-bold ${color === 'orange' ? 'text-orange-400' : color === 'red' ? 'text-red-400' : 'text-green-400'}`}>
        {formatCurrency(value)}
      </p>
    </div>
  )

  return (
    <div className={isDark ? 'dark' : ''}>
      <div className={`min-h-screen ${isDark ? 'bg-dark-900' : 'bg-gray-50'}`}>
        <Navbar isDark={isDark} toggleDarkMode={toggleDarkMode} userName={user?.nome || 'Usuário'} onLogout={handleLogout} trialEndsAt={user?.trialEndsAt} />

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Tabs */}
          <div className="flex gap-2 mb-8 flex-wrap">
            {[
              { id: 'salario', label: '💰 Salário Líquido', icon: '💰' },
              { id: 'decimo13', label: '🎁 13º Salário', icon: '🎁' },
              { id: 'ferias', label: '🏖️ Férias', icon: '🏖️' },
              { id: 'rescisao', label: '📋 Rescisão', icon: '📋' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg font-semibold transition ${
                  activeTab === tab.id
                    ? 'bg-orange-500 text-white'
                    : isDark
                    ? 'bg-dark-800 text-gray-300 hover:bg-dark-700'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* SALÁRIO LÍQUIDO */}
          {activeTab === 'salario' && (
            <div className={`${isDark ? 'bg-dark-800' : 'bg-white'} rounded-lg p-8 shadow-lg`}>
              <h2 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>Calculadora de Salário Líquido</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Salário Bruto (R$)
                  </label>
                  <input
                    type="number"
                    value={salarioBruto}
                    onChange={(e) => setSalarioBruto(e.target.value)}
                    placeholder="0.00"
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDark ? 'bg-dark-700 border-dark-600 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Dependentes
                  </label>
                  <input
                    type="number"
                    value={dependentes}
                    onChange={(e) => setDependentes(e.target.value)}
                    min="0"
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDark ? 'bg-dark-700 border-dark-600 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Tipo de Contrato
                  </label>
                  <select
                    value={isCLT ? 'clt' : 'pj'}
                    onChange={(e) => setIsCLT(e.target.value === 'clt')}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDark ? 'bg-dark-700 border-dark-600 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="clt">CLT (Desconto INSS + IRRF)</option>
                    <option value="pj">PJ (Sem Desconto)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <ResultCard label="Bruto" value={salarioLiquido.bruto} />
                <ResultCard label="INSS" value={salarioLiquido.inss} color="red" />
                <ResultCard label="IRRF" value={salarioLiquido.irrf} color="red" />
                <ResultCard label="Líquido" value={salarioLiquido.liquido} color="green" />
              </div>
            </div>
          )}

          {/* 13º SALÁRIO */}
          {activeTab === 'decimo13' && (
            <div className={`${isDark ? 'bg-dark-800' : 'bg-white'} rounded-lg p-8 shadow-lg`}>
              <h2 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>Calculadora de 13º Salário</h2>
              <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                O 13º é dividido em 2 parcelas: 50% até 30 de novembro (sem desconto) e 50% até 20 de dezembro (com INSS e IRRF).
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Salário Mensal (R$)
                  </label>
                  <input
                    type="number"
                    value={salario13}
                    onChange={(e) => setSalario13(e.target.value)}
                    placeholder="0.00"
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDark ? 'bg-dark-700 border-dark-600 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Meses Trabalhados
                  </label>
                  <input
                    type="number"
                    value={mesesTrabalhados13}
                    onChange={(e) => setMesesTrabalhados13(e.target.value)}
                    min="1"
                    max="12"
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDark ? 'bg-dark-700 border-dark-600 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'
                    }`}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={`flex items-center gap-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    <input
                      type="checkbox"
                      checked={antecipaComFerias13}
                      onChange={(e) => setAntecipaComFerias13(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-semibold">Antecipar 1ª Parcela com Férias</span>
                  </label>
                </div>
              </div>

              <div className={`${isDark ? 'bg-dark-700' : 'bg-gray-100'} p-6 rounded-lg mb-8`}>
                <h3 className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Divisão por Parcelas</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-2`}>1ª Parcela (até 30/11)</p>
                    <p className="text-2xl font-bold text-blue-400">{formatCurrency(valor13.primeira.liquido)}</p>
                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'} mt-1`}>Sem desconto</p>
                  </div>
                  <div>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-2`}>2ª Parcela (até 20/12)</p>
                    <p className="text-2xl font-bold text-blue-400">{formatCurrency(valor13.segunda.liquido)}</p>
                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'} mt-1`}>Com INSS e IRRF</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <ResultCard label="Total Bruto" value={valor13.totalBruto} />
                <ResultCard label="INSS" value={valor13.totalInss} color="red" />
                <ResultCard label="IRRF" value={valor13.totalIrrf} color="red" />
                <ResultCard label="Total Líquido" value={valor13.totalLiquido} color="green" />
              </div>
            </div>
          )}

          {/* FÉRIAS */}
          {activeTab === 'ferias' && (
            <div className={`${isDark ? 'bg-dark-800' : 'bg-white'} rounded-lg p-8 shadow-lg`}>
              <h2 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>Calculadora de Férias</h2>
              <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Você tem direito a 30 dias de férias remuneradas. Pode vender até 10 dias (1/3). O valor inclui adicional de 1/3.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Salário Mensal (R$)
                  </label>
                  <input
                    type="number"
                    value={salarioFerias}
                    onChange={(e) => setSalarioFerias(e.target.value)}
                    placeholder="0.00"
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDark ? 'bg-dark-700 border-dark-600 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Dias a Vender (máx. 10)
                  </label>
                  <input
                    type="number"
                    value={diasVendidos}
                    onChange={(e) => setDiasVendidos(e.target.value)}
                    min="0"
                    max="10"
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDark ? 'bg-dark-700 border-dark-600 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'
                    }`}
                  />
                </div>
              </div>

              <div className={`${isDark ? 'bg-dark-700' : 'bg-gray-100'} p-6 rounded-lg mb-8`}>
                <h3 className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Composição</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Dias a Gozar: {valorFerias.diasGozados}</p>
                    <p className={`${isDark ? 'text-blue-400' : 'text-blue-600'} font-semibold`}>{formatCurrency(valorFerias.feriasBrutaGozada)}</p>
                  </div>
                  <div>
                    <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Dias Vendidos: {valorFerias.diasVendidos}</p>
                    <p className={`${isDark ? 'text-orange-400' : 'text-orange-600'} font-semibold`}>{formatCurrency(valorFerias.feriasVendidas)}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <ResultCard label="Total Bruto" value={valorFerias.totalBruto} />
                <ResultCard label="INSS" value={valorFerias.inss} color="red" />
                <ResultCard label="IRRF" value={valorFerias.irrf} color="red" />
                <ResultCard label="Total Líquido" value={valorFerias.liquido} color="green" />
              </div>
            </div>
          )}

          {/* RESCISÃO */}
          {activeTab === 'rescisao' && (
            <div className={`${isDark ? 'bg-dark-800' : 'bg-white'} rounded-lg p-8 shadow-lg`}>
              <h2 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>Calculadora de Rescisão</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Salário Mensal (R$)
                  </label>
                  <input
                    type="number"
                    value={salarioRescisao}
                    onChange={(e) => setSalarioRescisao(e.target.value)}
                    placeholder="0.00"
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDark ? 'bg-dark-700 border-dark-600 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Tipo de Rescisão
                  </label>
                  <select
                    value={tipoRescisao}
                    onChange={(e) => setTipoRescisao(e.target.value as any)}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDark ? 'bg-dark-700 border-dark-600 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'
                    }`}
                  >
                    <option value="sem-justa-causa">Sem Justa Causa (Multa FGTS 40%)</option>
                    <option value="com-acordo">Com Acordo (Multa FGTS 20%)</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Dias Trabalhados no Mês
                  </label>
                  <input
                    type="number"
                    value={diasTrabalhados}
                    onChange={(e) => setDiasTrabalhados(e.target.value)}
                    min="1"
                    max="31"
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDark ? 'bg-dark-700 border-dark-600 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Meses Trabalhados no Ano
                  </label>
                  <input
                    type="number"
                    value={mesesTrabalhados}
                    onChange={(e) => setMesesTrabalhados(e.target.value)}
                    min="1"
                    max="12"
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDark ? 'bg-dark-700 border-dark-600 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Anos Completos de Trabalho
                  </label>
                  <input
                    type="number"
                    value={anosCompletos}
                    onChange={(e) => setAnosCompletos(e.target.value)}
                    min="0"
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDark ? 'bg-dark-700 border-dark-600 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'
                    }`}
                  />
                </div>

                <div>
                  <label className={`flex items-center gap-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    <input
                      type="checkbox"
                      checked={temAvisoPrevio}
                      onChange={(e) => setTemAvisoPrevio(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-semibold">Tem Aviso Prévio?</span>
                  </label>
                </div>

                {temAvisoPrevio && (
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Aviso Prévio
                    </label>
                    <select
                      value={avisoPrevioTrabalhado ? 'trabalhado' : 'indenizado'}
                      onChange={(e) => setAvisoPrevioTrabalhado(e.target.value === 'trabalhado')}
                      className={`w-full px-4 py-2 rounded-lg border ${
                        isDark ? 'bg-dark-700 border-dark-600 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="trabalhado">Trabalhado</option>
                      <option value="indenizado">Indenizado</option>
                    </select>
                  </div>
                )}
              </div>

              <div className={`${isDark ? 'bg-dark-700' : 'bg-gray-100'} p-6 rounded-lg mb-8`}>
                <h3 className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Componentes da Rescisão</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Saldo de Salário</p>
                    <p className="font-semibold text-orange-400">{formatCurrency(valorRescisao.saldoSalario)}</p>
                  </div>
                  <div>
                    <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Aviso Prévio ({valorRescisao.diasAviso}d)</p>
                    <p className="font-semibold text-orange-400">{formatCurrency(valorRescisao.avisoPrevio)}</p>
                  </div>
                  <div>
                    <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Férias Vencidas</p>
                    <p className="font-semibold text-orange-400">{formatCurrency(valorRescisao.feriasVencidas)}</p>
                  </div>
                  <div>
                    <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Férias Proporcionais</p>
                    <p className="font-semibold text-orange-400">{formatCurrency(valorRescisao.feriasProporcional)}</p>
                  </div>
                  <div>
                    <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>13º Proporcional</p>
                    <p className="font-semibold text-orange-400">{formatCurrency(valorRescisao.decimo13Proporcional)}</p>
                  </div>
                  <div>
                    <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Multa FGTS ({tipoRescisao === 'sem-justa-causa' ? '40%' : '20%'})</p>
                    <p className="font-semibold text-orange-400">{formatCurrency(valorRescisao.multaFGTS)}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <ResultCard label="Total Bruto" value={valorRescisao.totalBruto} />
                <ResultCard label="INSS" value={valorRescisao.inss} color="red" />
                <ResultCard label="IRRF" value={valorRescisao.irrf} color="red" />
                <ResultCard label="Total Líquido" value={valorRescisao.liquido} color="green" />
              </div>

              <p className={`text-xs mt-6 ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                ℹ️ {valorRescisao.observacao}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
