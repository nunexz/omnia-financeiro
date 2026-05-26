import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { rendasAPI } from '../services/api'
import { X, ChevronDown, Plus, Trash2 } from 'lucide-react'

interface ModalEditRendaProps {
  isOpen: boolean
  onClose: () => void
  mesAno: string
  renda: any
}

interface Desconto {
  id: string
  desc: string
  valor: number
}

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

export default function ModalEditRenda({ isOpen, onClose, mesAno, renda }: ModalEditRendaProps) {
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm()
  const [showBreakdown, setShowBreakdown] = useState(false)
  const [descontos, setDescontos] = useState<Desconto[]>([])
  const [novoDesconto, setNovoDesconto] = useState({ desc: '', valor: '' })
  const queryClient = useQueryClient()

  const valorBruto = parseFloat(watch('valor_bruto') || '0')
  const isCLT = watch('is_clt') === 'true'
  const dependentes = parseInt(watch('dependentes') || '0')
  const totalDescontosAdicionais = descontos.reduce((acc, d) => acc + d.valor, 0)

  const cálculos = useMemo(() => {
    if (!isCLT) {
      return {
        inss: 0,
        irrf: 0,
        outrosDescontos: totalDescontosAdicionais,
        total: totalDescontosAdicionais,
        líquido: valorBruto - totalDescontosAdicionais,
      }
    }

    const inss = calcularINSS(valorBruto)
    const irrf = calcularIRRF(valorBruto, dependentes || 0)
    const totalDescontos = inss + irrf + totalDescontosAdicionais
    const líquido = valorBruto - totalDescontos

    return {
      inss,
      irrf,
      outrosDescontos: totalDescontosAdicionais,
      total: totalDescontos,
      líquido: Math.max(0, líquido),
    }
  }, [valorBruto, isCLT, dependentes, totalDescontosAdicionais])

  const adicionarDesconto = () => {
    if (novoDesconto.desc && novoDesconto.valor) {
      setDescontos([
        ...descontos,
        {
          id: Date.now().toString(),
          desc: novoDesconto.desc,
          valor: parseFloat(novoDesconto.valor),
        },
      ])
      setNovoDesconto({ desc: '', valor: '' })
    }
  }

  const removerDesconto = (id: string) => {
    setDescontos(descontos.filter(d => d.id !== id))
  }

  useEffect(() => {
    if (renda && isOpen) {
      reset({
        nome: renda.nome,
        valor_bruto: renda.valor_bruto,
        is_clt: renda.is_clt ? 'true' : 'false',
        dependentes: renda.dependentes || 0,
      })
      // Carregar descontos existentes
      if (renda.outros_descontos && Array.isArray(renda.outros_descontos)) {
        setDescontos(renda.outros_descontos.map((d: any) => ({
          id: d.id || Date.now().toString(),
          desc: d.desc,
          valor: typeof d.valor === 'number' ? d.valor : parseFloat(d.valor),
        })))
      } else {
        setDescontos([])
      }
      setNovoDesconto({ desc: '', valor: '' })
    }
  }, [renda, isOpen, reset])

  const mutation = useMutation({
    mutationFn: (data: any) =>
      rendasAPI.updateRenda(renda.id, {
        nome: data.nome,
        valor_bruto: parseFloat(data.valor_bruto),
        valor_liquido: cálculos.líquido,
        dependentes: parseInt(data.dependentes),
        is_clt: data.is_clt === 'true',
        outros_descontos: descontos.length > 0 ? descontos.map(d => ({ desc: d.desc, valor: d.valor })) : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', mesAno] })
      queryClient.invalidateQueries({ queryKey: ['rendas', mesAno] })
      onClose()
    },
  })

  const onSubmit = async (data: any) => {
    await mutation.mutateAsync(data)
  }

  if (!isOpen || !renda) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow-lg dark:shadow-dark-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-dark-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Editar Renda</h2>
          <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome da Renda</label>
            <input
              type="text"
              {...register('nome', { required: 'Nome é obrigatório' })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-600 dark:focus:ring-primary-500 focus:border-transparent"
            />
            {errors.nome && <span className="text-red-600 dark:text-red-400 text-sm">{String(errors.nome.message)}</span>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo de Renda</label>
            <select
              {...register('is_clt')}
              className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-600 dark:focus:ring-primary-500 focus:border-transparent"
            >
              <option value="true">CLT (com INSS/IRRF)</option>
              <option value="false">PJ/Autônomo (sem INSS/IRRF)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Salário Bruto (R$)</label>
            <input
              type="number"
              step="0.01"
              {...register('valor_bruto', { required: 'Valor bruto é obrigatório' })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-600 dark:focus:ring-primary-500 focus:border-transparent"
            />
            {errors.valor_bruto && <span className="text-red-600 dark:text-red-400 text-sm">{String(errors.valor_bruto.message)}</span>}
          </div>

          {isCLT && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Número de Dependentes</label>
              <input
                type="number"
                min="0"
                {...register('dependentes')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-600 dark:focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          )}

          {/* Descontos Adicionais */}
          <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descontos Adicionais</label>
              {descontos.length > 0 && (
                <span className="text-xs bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 px-2 py-1 rounded">
                  {descontos.length} desconto{descontos.length > 1 ? 's' : ''}
                </span>
              )}
            </div>

            {descontos.map((desconto) => (
              <div key={desconto.id} className="flex items-center justify-between bg-white dark:bg-dark-800 p-2 rounded">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{desconto.desc}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">R$ {desconto.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removerDesconto(desconto.id)}
                  className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 ml-2"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}

            <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-dark-600">
              <input
                type="text"
                placeholder="Ex: Vale refeição"
                value={novoDesconto.desc}
                onChange={(e) => setNovoDesconto({ ...novoDesconto, desc: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-dark-600 rounded bg-white dark:bg-dark-800 text-gray-900 dark:text-white"
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.01"
                  placeholder="Valor"
                  value={novoDesconto.valor}
                  onChange={(e) => setNovoDesconto({ ...novoDesconto, valor: e.target.value })}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-dark-600 rounded bg-white dark:bg-dark-800 text-gray-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={adicionarDesconto}
                  className="px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded text-sm flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Breakdown */}
          <div className="bg-gray-50 dark:bg-dark-700 rounded-lg p-3 space-y-2">
            <button
              type="button"
              onClick={() => setShowBreakdown(!showBreakdown)}
              className="w-full flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
            >
              <span>Discriminação de Descontos</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showBreakdown ? 'rotate-180' : ''}`} />
            </button>

            {showBreakdown && (
              <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-dark-600">
                <div className="flex justify-between">
                  <span>Salário Bruto:</span>
                  <span className="text-gray-900 dark:text-white">R$ {valorBruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
                {isCLT && cálculos.inss > 0 && (
                  <div className="flex justify-between">
                    <span>INSS:</span>
                    <span className="text-red-600 dark:text-red-400">-R$ {cálculos.inss.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                {isCLT && cálculos.irrf > 0 && (
                  <div className="flex justify-between">
                    <span>IRRF:</span>
                    <span className="text-red-600 dark:text-red-400">-R$ {cálculos.irrf.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                {cálculos.outrosDescontos > 0 && (
                  <div className="flex justify-between">
                    <span>Outros Descontos:</span>
                    <span className="text-red-600 dark:text-red-400">-R$ {cálculos.outrosDescontos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div className="border-t border-gray-200 dark:border-dark-600 pt-1 flex justify-between font-semibold text-gray-900 dark:text-white">
                  <span>Líquido:</span>
                  <span className="text-green-600 dark:text-green-400">R$ {cálculos.líquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            )}

            <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-dark-600">
              <span className="font-medium text-gray-900 dark:text-white">Líquido:</span>
              <span className="font-semibold text-green-600 dark:text-green-400">
                R$ {cálculos.líquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
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
              disabled={mutation.isPending}
              className="flex-1 px-4 py-2 bg-primary-600 dark:bg-primary-500 text-white rounded-lg hover:bg-primary-700 dark:hover:bg-primary-600 disabled:opacity-50 transition"
            >
              {mutation.isPending ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
