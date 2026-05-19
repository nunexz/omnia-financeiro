import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { LogOut, User } from 'lucide-react'

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const formatMonth = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-primary">Omnia</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-700">Bem-vindo, {user?.nome}!</span>
            <button
              onClick={() => navigate('/profile')}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
              title="Perfil"
            >
              <User className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-red-50 rounded-lg transition"
              title="Sair"
            >
              <LogOut className="w-5 h-5 text-red-600" />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Visão Mensal
          </h2>
          <p className="text-gray-600">
            Selecione o mês e ano para visualizar
          </p>
        </div>

        {/* Month Selector */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() =>
                setCurrentMonth(
                  new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
                )
              }
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              ← Anterior
            </button>
            <span className="text-xl font-semibold text-gray-900 min-w-fit">
              {formatMonth(currentMonth)}
            </span>
            <button
              onClick={() =>
                setCurrentMonth(
                  new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
                )
              }
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              Próximo →
            </button>
          </div>
        </div>

        {/* Dashboard Cards - Coming Soon */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm mb-2">Renda Líquida</p>
            <p className="text-3xl font-bold text-gray-900">R$ 0,00</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm mb-2">Gastos + Dívidas</p>
            <p className="text-3xl font-bold text-red-600">R$ 0,00</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm mb-2">Para Investir</p>
            <p className="text-3xl font-bold text-blue-600">R$ 0,00</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-sm mb-2">Sobra Final</p>
            <p className="text-3xl font-bold text-green-600">R$ 0,00</p>
          </div>
        </div>

        {/* Tabs - Coming Soon */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200 flex overflow-x-auto">
            {[
              'Transações',
              'Gastos do Dia',
              'Dívidas',
              'Investimentos',
              'Débitos',
            ].map((tab) => (
              <button
                key={tab}
                className="flex-1 px-4 py-4 text-center text-gray-700 hover:text-primary border-b-2 border-transparent hover:border-primary transition whitespace-nowrap"
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="p-6 text-center text-gray-500">
            <p>Conteúdo das abas em desenvolvimento...</p>
          </div>
        </div>
      </div>
    </div>
  )
}
