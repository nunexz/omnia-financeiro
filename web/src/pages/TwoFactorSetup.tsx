import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authAPI } from '../services/api'
import QRCode from 'qrcode.react'
import { Copy, Check } from 'lucide-react'

export default function TwoFactorSetup() {
  const navigate = useNavigate()
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const setupTwoFactor = async () => {
      try {
        const response = await authAPI.setup2FA()
        const { secret: qrCodeValue, secret: secretValue } = response.data
        setQrCode(qrCodeValue)
        setSecret(secretValue)
      } catch (err: any) {
        setError(err.response?.data?.error || 'Erro ao configurar 2FA')
      } finally {
        setLoading(false)
      }
    }

    setupTwoFactor()
  }, [])

  const copyToClipboard = () => {
    if (secret) {
      navigator.clipboard.writeText(secret)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleSkip = () => {
    navigate('/dashboard')
  }

  const handleSetupComplete = () => {
    navigate('/2fa-verify')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
        <div className="text-white text-xl">Gerando código QR...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-secondary flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Autenticação de Dois Fatores
        </h2>
        <p className="text-gray-600 mb-6">
          Escaneie o código QR com seu autenticador (Google Authenticator, Microsoft Authenticator, etc)
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        {qrCode && (
          <div className="bg-gray-50 p-4 rounded-lg mb-6 flex justify-center">
            <QRCode value={qrCode} size={200} />
          </div>
        )}

        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <p className="text-sm text-gray-600 mb-2">Chave de backup (guarde em segurança):</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-white p-2 rounded font-mono text-sm break-all">
              {secret}
            </code>
            <button
              onClick={copyToClipboard}
              className="p-2 hover:bg-gray-200 rounded transition"
              title="Copiar"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4 text-gray-600" />
              )}
            </button>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleSkip}
            className="flex-1 bg-gray-200 text-gray-700 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 transition"
          >
            Pular por enquanto
          </button>
          <button
            onClick={handleSetupComplete}
            className="flex-1 bg-primary text-white font-semibold py-2 px-4 rounded-lg hover:bg-yellow-500 transition"
          >
            Próximo
          </button>
        </div>
      </div>
    </div>
  )
}
