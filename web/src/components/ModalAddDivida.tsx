import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { dividasAPI } from '../services/api'
import { X } from 'lucide-react'

interface ModalAddDividaProps {
  isOpen: boolean
  onClose: () => void
  mesAno: string
}

export default function ModalAddDivida({ isOpen, onClose, mesAno }: ModalAddDividaProps) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm()
  const [loading, setLoading] = useState(false)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (data: any) =>
      dividasAPI.createDivida({
        ...data,
        parcela: parseFloat(data.parcela),
        vencimento: parseInt(data.vencimento),
        parcelas_pagas: parseInt(data.parcelas_pagas),
        parcelas_totais: parseInt(data.parcelas_totais),
        mes_ano: mesAno,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', mesAno] })
      queryClient.invalidateQueries({ queryKey: ['dividas', mesAno] })
      reset()
      onClose()
    },
  })

  const onSubmit = async (data: any) => {
    setLoading(true)
    try {
      await mutation.mutateAsync(data)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow-lg dark:shadow-dark-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-dark-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Adicionar Dívida</h2>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nome da Dívida
            </label>
            <input
              type="text"
              {...register('nome', { required: 'Nome é obrigatório' })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-600 dark:focus:ring-primary-500 focus:border-transparent"
              placeholder="Ex: Financiamento"
            />
            {errors.nome && (
              <span className="text-red-600 dark:text-red-400 text-sm">{String(errors.nome.message)}</span>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Valor da Parcela (R$)
            </label>
            <input
              type="number"
              step="0.01"
              {...register('parcela', { required: 'Valor é obrigatório' })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-600 dark:focus:ring-primary-500 focus:border-transparent"
              placeholder="0.00"
            />
            {errors.parcela && (
              <span className="text-red-600 dark:text-red-400 text-sm">{String(errors.parcela.message)}</span>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Dia do Vencimento (1-31)
            </label>
            <input
              type="number"
              min="1"
              max="31"
              {...register('vencimento', { required: 'Vencimento é obrigatório' })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-600 dark:focus:ring-primary-500 focus:border-transparent"
              placeholder="10"
            />
            {errors.vencimento && (
              <span className="text-red-600 dark:text-red-400 text-sm">{String(errors.vencimento.message)}</span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Parcelas Pagas
              </label>
              <input
                type="number"
                min="0"
                {...register('parcelas_pagas', { required: true })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-600 dark:focus:ring-primary-500 focus:border-transparent"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Total de Parcelas
              </label>
              <input
                type="number"
                min="1"
                {...register('parcelas_totais', { required: 'Total é obrigatório' })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-600 dark:focus:ring-primary-500 focus:border-transparent"
                placeholder="12"
              />
              {errors.parcelas_totais && (
                <span className="text-red-600 dark:text-red-400 text-sm">{String(errors.parcelas_totais.message)}</span>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-dark-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-primary-600 dark:bg-primary-500 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 disabled:opacity-50 transition"
            >
              {loading ? 'Adicionando...' : 'Adicionar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
