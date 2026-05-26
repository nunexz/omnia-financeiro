import { useState, useMemo } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { dividasAPI } from '../services/api'
import { X, Calendar, TrendingUp, CheckCircle2 } from 'lucide-react'

interface ModalGerenciarDividaProps {
  isOpen: boolean
  onClose: () => void
  mesAno: string
  divida: any
}

export default function ModalGerenciarDivida({ isOpen, onClose, mesAno, divida }: ModalGerenciarDividaProps) {
  const [acaoSelecionada, setAcaoSelecionada] = useState<'pagamento' | 'antecipacao' | null>(null)
  const [parcelasAntecipadas, setParcelasAntecipadas] = useState(1)
  const queryClient = useQueryClient()

  if (!isOpen || !divida) return null

  const parcelasRestantes = divida.parcelas_totais - divida.parcelas_pagas
  const dataTermino = useMemo(() => {
    const hoje = new Date()
    const mesAtual = hoje.getMonth()
    const anoAtual = hoje.getFullYear()
    const data = new Date(anoAtual, mesAtual + parcelasRestantes, 1)
    return data.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  }, [parcelasRestantes])

  // Mutation para marcar como pago
  const marcarPagoMutation = useMutation({
    mutationFn: () => dividasAPI.marcarPago(divida.id, !divida.pago),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', mesAno] })
      queryClient.invalidateQueries({ queryKey: ['dividas', mesAno] })
      onClose()
    },
  })

  // Mutation para antecipação
  const antecipacaoMutation = useMutation({
    mutationFn: () => dividasAPI.registrarAntecipacao(divida.id, parcelasAntecipadas),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', mesAno] })
      queryClient.invalidateQueries({ queryKey: ['dividas', mesAno] })
      setAcaoSelecionada(null)
      onClose()
    },
  })

  // Mutation para quitar
  const quitarMutation = useMutation({
    mutationFn: () => dividasAPI.quitarDivida(divida.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', mesAno] })
      queryClient.invalidateQueries({ queryKey: ['dividas', mesAno] })
      onClose()
    },
  })

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow-lg dark:shadow-dark-lg p-6 w-full max-w-md mx-4 border border-gray-200 dark:border-dark-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{divida.nome}</h2>
          <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Informações Principais */}
        <div className="space-y-3 mb-6 p-4 bg-gray-50 dark:bg-dark-700 rounded-lg">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Parcela Mensal:</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              R$ {parseFloat(divida.parcela).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Saldo Devedor:</span>
            <span className="font-semibold text-red-600 dark:text-red-400">
              R$ {divida.saldo_devedor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">Parcelas Pagas:</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {divida.parcelas_pagas} de {divida.parcelas_totais}
            </span>
          </div>

          {parcelasRestantes > 0 && (
            <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-dark-600">
              <span className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Término previsto:
              </span>
              <span className="font-semibold text-gray-900 dark:text-white capitalize">{dataTermino}</span>
            </div>
          )}

          {divida.quitado && (
            <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-dark-600 text-green-600 dark:text-green-400">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-semibold">Dívida Quitada!</span>
            </div>
          )}
        </div>

        {/* Status Pagamento do Mês */}
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={divida.pago}
              onChange={() => marcarPagoMutation.mutate()}
              disabled={marcarPagoMutation.isPending}
              className="w-5 h-5 text-primary-600 rounded"
            />
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {divida.pago ? '✓ Paga neste mês' : '○ Não paga neste mês'}
            </span>
          </label>
        </div>

        {/* Ações */}
        {!divida.quitado && parcelasRestantes > 0 && (
          <div className="space-y-3 mb-6">
            {acaoSelecionada === null ? (
              <>
                <button
                  onClick={() => setAcaoSelecionada('antecipacao')}
                  className="w-full px-4 py-2 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-200 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-800 transition flex items-center justify-center gap-2 font-medium"
                >
                  <TrendingUp className="w-4 h-4" />
                  Registrar Antecipação
                </button>
                <button
                  onClick={() => quitarMutation.mutate()}
                  disabled={quitarMutation.isPending}
                  className="w-full px-4 py-2 bg-green-600 dark:bg-green-700 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-800 disabled:opacity-50 transition font-medium"
                >
                  {quitarMutation.isPending ? 'Quitando...' : 'Quitar Completo'}
                </button>
              </>
            ) : (
              <div className="space-y-3 p-3 bg-gray-50 dark:bg-dark-700 rounded-lg">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Quantas parcelas você quer antecipar?
                </p>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    max={parcelasRestantes}
                    value={parcelasAntecipadas}
                    onChange={(e) => setParcelasAntecipadas(parseInt(e.target.value) || 1)}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-dark-600 rounded bg-white dark:bg-dark-800 text-gray-900 dark:text-white"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                    de {parcelasRestantes}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total: R$ {(parcelasAntecipadas * parseFloat(divida.parcela)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setAcaoSelecionada(null)}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-dark-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-dark-700 text-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => antecipacaoMutation.mutate()}
                    disabled={antecipacaoMutation.isPending}
                    className="flex-1 px-3 py-2 bg-orange-600 dark:bg-orange-700 text-white rounded hover:bg-orange-700 dark:hover:bg-orange-800 disabled:opacity-50 text-sm"
                  >
                    {antecipacaoMutation.isPending ? 'Registrando...' : 'Confirmar'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Botão Fechar */}
        <button
          onClick={onClose}
          className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 transition font-medium"
        >
          Fechar
        </button>
      </div>
    </div>
  )
}
