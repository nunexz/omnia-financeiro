import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

interface ModalConfiguracao13Props {
  isOpen: boolean
  onClose: () => void
  isDark: boolean
  onSave: (mes1: number, mes2: number) => void
}

const MESES = [
  { num: 1, nome: 'Janeiro' },
  { num: 2, nome: 'Fevereiro' },
  { num: 3, nome: 'Março' },
  { num: 4, nome: 'Abril' },
  { num: 5, nome: 'Maio' },
  { num: 6, nome: 'Junho' },
  { num: 7, nome: 'Julho' },
  { num: 8, nome: 'Agosto' },
  { num: 9, nome: 'Setembro' },
  { num: 10, nome: 'Outubro' },
  { num: 11, nome: 'Novembro' },
  { num: 12, nome: 'Dezembro' },
]

export default function ModalConfiguracao13({ isOpen, onClose, isDark, onSave }: ModalConfiguracao13Props) {
  const [mes1Parcela, setMes1Parcela] = useState(11) // Novembro por padrão
  const [mes2Parcela, setMes2Parcela] = useState(12) // Dezembro por padrão

  useEffect(() => {
    // Carregar configurações salvas do localStorage
    const saved1 = localStorage.getItem('13_mes1')
    const saved2 = localStorage.getItem('13_mes2')
    if (saved1) setMes1Parcela(parseInt(saved1))
    if (saved2) setMes2Parcela(parseInt(saved2))
  }, [])

  const handleSave = () => {
    localStorage.setItem('13_mes1', mes1Parcela.toString())
    localStorage.setItem('13_mes2', mes2Parcela.toString())
    onSave(mes1Parcela, mes2Parcela)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`${isDark ? 'bg-dark-800' : 'bg-white'} rounded-lg p-8 max-w-md w-full mx-4`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            ⚙️ Configurar 13º Salário
          </h2>
          <button onClick={onClose} className={`${isDark ? 'hover:bg-dark-700' : 'hover:bg-gray-100'} p-2 rounded-lg`}>
            <X size={20} />
          </button>
        </div>

        <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Informe em quais meses você recebe as parcelas do 13º salário:
        </p>

        <div className="space-y-6">
          <div>
            <label className={`block text-sm font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              📅 Mês da 1ª Parcela
            </label>
            <select
              value={mes1Parcela}
              onChange={(e) => setMes1Parcela(parseInt(e.target.value))}
              className={`w-full px-4 py-2 rounded-lg border ${
                isDark ? 'bg-dark-700 border-dark-600 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'
              }`}
            >
              {MESES.map((mes) => (
                <option key={mes.num} value={mes.num}>
                  {mes.nome} (50% do 13º)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={`block text-sm font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              📅 Mês da 2ª Parcela
            </label>
            <select
              value={mes2Parcela}
              onChange={(e) => setMes2Parcela(parseInt(e.target.value))}
              className={`w-full px-4 py-2 rounded-lg border ${
                isDark ? 'bg-dark-700 border-dark-600 text-white' : 'bg-gray-100 border-gray-300 text-gray-900'
              }`}
            >
              {MESES.map((mes) => (
                <option key={mes.num} value={mes.num}>
                  {mes.nome} (50% + descontos)
                </option>
              ))}
            </select>
          </div>

          <div className={`${isDark ? 'bg-dark-700' : 'bg-blue-50'} p-4 rounded-lg text-sm`}>
            <p className={isDark ? 'text-blue-300' : 'text-blue-700'}>
              💡 Padrão: 1ª em <strong>{MESES[10].nome}</strong> e 2ª em <strong>{MESES[11].nome}</strong>
            </p>
          </div>
        </div>

        <div className="flex gap-4 mt-8">
          <button
            onClick={onClose}
            className={`flex-1 px-4 py-2 rounded-lg font-semibold transition ${
              isDark ? 'bg-dark-700 hover:bg-dark-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  )
}
