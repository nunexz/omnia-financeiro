import { useState } from 'react'
import { X } from 'lucide-react'
import { investimentosAPI } from '../services/api'
import { useMutation, useQueryClient } from '@tanstack/react-query'

interface ModalAddInvestimentoProps {
  isOpen: boolean
  onClose: () => void
  mesAno: string
  isDark: boolean
  sobraFinal?: number
  formatCurrency?: (value: any) => string
}

export default function ModalAddInvestimento({ isOpen, onClose, mesAno, isDark, sobraFinal = 0, formatCurrency }: ModalAddInvestimentoProps) {
  const queryClient = useQueryClient()
  const [nome, setNome] = useState('')
  const [valor, setValor] = useState('')

  const createInvestimentoMutation = useMutation({
    mutationFn: (data: any) => investimentosAPI.addInvestimento(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['investimentos', mesAno] })
      setNome('')
      setValor('')
      onClose()
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome || !valor) {
      alert('Preencha todos os campos')
      return
    }

    createInvestimentoMutation.mutate({
      nome,
      valor: parseFloat(valor),
      mes_ano: mesAno,
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`${isDark ? 'bg-dark-800 border-dark-700' : 'bg-white'} rounded-lg shadow-xl border max-w-md w-full mx-4`}>
        {/* Header */}
        <div className={`flex justify-between items-center px-6 py-4 border-b ${isDark ? 'border-dark-700' : 'border-gray-200'}`}>
          <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Adicionar Investimento</h2>
          <button onClick={onClose} className={`p-1 hover:bg-opacity-20 rounded ${isDark ? 'hover:bg-white' : 'hover:bg-gray-200'}`}>
            <X size={20} className={isDark ? 'text-gray-400' : 'text-gray-600'} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Nome */}
          <div>
            <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>
              Nome do Investimento
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Ações, Fundo, Criptomoeda..."
              className={`w-full px-4 py-2 rounded-lg border transition ${
                isDark
                  ? 'bg-dark-700 border-dark-600 text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-orange-500 focus:outline-none'
              }`}
            />
          </div>

          {/* Disponível para Investir */}
          {sobraFinal > 0 && (
            <div className={`p-3 rounded-lg border ${isDark ? 'bg-purple-900/30 border-purple-700' : 'bg-purple-50 border-purple-200'}`}>
              <p className={`text-sm font-semibold ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>
                💜 Disponível para investir
              </p>
              <p className={`text-2xl font-bold ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
                {formatCurrency ? formatCurrency(sobraFinal) : `R$ ${sobraFinal.toFixed(2)}`}
              </p>
            </div>
          )}

          {/* Valor */}
          <div>
            <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>
              Valor Investido (R$)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max={sobraFinal > 0 ? sobraFinal : undefined}
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="0.00"
              className={`w-full px-4 py-2 rounded-lg border transition ${
                isDark
                  ? 'bg-dark-700 border-dark-600 text-white placeholder-gray-500 focus:border-orange-500 focus:outline-none'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:border-orange-500 focus:outline-none'
              }`}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 mt-6 pt-4">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 px-4 py-2 rounded-lg font-semibold transition ${
                isDark ? 'bg-dark-700 text-gray-300 hover:bg-dark-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createInvestimentoMutation.isPending}
              className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-semibold transition disabled:opacity-50"
            >
              {createInvestimentoMutation.isPending ? '⏳ Adicionando...' : '+ Adicionar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
