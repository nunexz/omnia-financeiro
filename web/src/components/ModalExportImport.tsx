import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Download, Upload } from 'lucide-react'
import { exportImportAPI } from '../services/api'

interface ModalExportImportProps {
  isOpen: boolean
  onClose: () => void
  mesAno: string
}

export default function ModalExportImport({ isOpen, onClose, mesAno }: ModalExportImportProps) {
  const [importLoading, setImportLoading] = useState(false)
  const [importSuccess, setImportSuccess] = useState('')
  const [importError, setImportError] = useState('')
  const queryClient = useQueryClient()

  const exportMutation = useMutation({
    mutationFn: () => exportImportAPI.exportJSON(mesAno),
    onSuccess: (response) => {
      const dataStr = JSON.stringify(response.data, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `omnia-backup-${mesAno}.json`
      link.click()
      URL.revokeObjectURL(url)
    },
    onError: () => {
      setImportError('Erro ao exportar dados')
    },
  })

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setImportLoading(true)
    setImportSuccess('')
    setImportError('')

    try {
      const text = await file.text()
      const jsonData = JSON.parse(text)

      const response = await exportImportAPI.importJSON({
        mesAno,
        data: jsonData.data,
      })

      setImportSuccess(
        `Importado com sucesso! ${response.data.imported.rendas} rendas, ${response.data.imported.gastos} gastos, ${response.data.imported.dividas} dívidas, ${response.data.imported.gastosVariaveis} gastos do dia`
      )

      queryClient.invalidateQueries({ queryKey: ['rendas', mesAno] })
      queryClient.invalidateQueries({ queryKey: ['gastos', mesAno] })
      queryClient.invalidateQueries({ queryKey: ['dividas', mesAno] })
      queryClient.invalidateQueries({ queryKey: ['gastos-variaveis', mesAno] })

      setTimeout(() => {
        onClose()
        setImportSuccess('')
      }, 2000)
    } catch (error) {
      setImportError('Erro ao importar: arquivo JSON inválido')
    } finally {
      setImportLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow-lg p-6 w-full max-w-md mx-4 border border-gray-200 dark:border-dark-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Backup & Restaurar</h2>
          <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
              Exporte seus dados para fazer backup ou importe um arquivo anterior para restaurar.
            </p>
          </div>

          <div className="border-t border-gray-200 dark:border-dark-700 pt-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Exportar Dados</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
              Baixe um arquivo JSON com todos os dados de {mesAno}
            </p>
            <button
              onClick={() => exportMutation.mutate()}
              disabled={exportMutation.isPending}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              {exportMutation.isPending ? 'Exportando...' : 'Baixar Backup'}
            </button>
          </div>

          <div className="border-t border-gray-200 dark:border-dark-700 pt-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Importar Dados</h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
              Restaure dados a partir de um arquivo JSON anterior
            </p>
            <label className="w-full">
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                disabled={importLoading}
                className="hidden"
              />
              <div className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition flex items-center justify-center gap-2 cursor-pointer">
                <Upload className="w-4 h-4" />
                {importLoading ? 'Importando...' : 'Selecionar Arquivo'}
              </div>
            </label>
          </div>

          {importSuccess && (
            <div className="bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-700 text-green-800 dark:text-green-200 px-3 py-2 rounded text-sm">
              ✓ {importSuccess}
            </div>
          )}

          {importError && (
            <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-800 dark:text-red-200 px-3 py-2 rounded text-sm">
              ✗ {importError}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-dark-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 transition"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
