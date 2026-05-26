import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { gastosFixosAPI } from '../services/api'
import { X } from 'lucide-react'

interface ModalAddGastoFixoProps {
  isOpen: boolean
  onClose: () => void
  mesAno: string
}

export default function ModalAddGastoFixo({ isOpen, onClose, mesAno }: ModalAddGastoFixoProps) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm()
  const [loading, setLoading] = useState(false)
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (data: any) =>
      gastosFixosAPI.createGasto({
        ...data,
        valor: parseFloat(data.valor),
        vencimento: parseInt(data.vencimento),
        mes_ano: mesAno,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', mesAno] })
      queryClient.invalidateQueries({ queryKey: ['gastos-fixos', mesAno] })
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
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow-lg dark:shadow-dark-lg p-6 w-full max-w-md mx-4 border border-gray-200 dark:border-dark-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Adicionar Gasto Fixo</h2>
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
              Nome do Gasto
            </label>
            <input
              type="text"
              {...register('nome', { required: 'Nome é obrigatório' })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-600 dark:focus:ring-primary-500 focus:border-transparent"
              placeholder="Ex: Aluguel"
            />
            {errors.nome && (
              <span className="text-red-600 dark:text-red-400 text-sm">{String(errors.nome.message)}</span>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Valor (R$)
            </label>
            <input
              type="number"
              step="0.01"
              {...register('valor', { required: 'Valor é obrigatório' })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-600 dark:focus:ring-primary-500 focus:border-transparent"
              placeholder="0.00"
            />
            {errors.valor && (
              <span className="text-red-600 dark:text-red-400 text-sm">{String(errors.valor.message)}</span>
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
              className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 transition"
            >
              {loading ? 'Adicionando...' : 'Adicionar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
