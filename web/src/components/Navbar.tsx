import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, X, LogOut, Sun, Moon, TrendingUp, Calculator, User } from 'lucide-react'
import Logo from './Logo'

interface NavbarProps {
  isDark: boolean
  toggleDarkMode: () => void
  userName: string
  onLogout: () => void
}

interface NavbarPropsExtended extends NavbarProps {
  trialEndsAt?: string | null
}

export default function Navbar({ isDark, toggleDarkMode, userName, onLogout, trialEndsAt }: NavbarPropsExtended) {
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleNavigation = (path: string) => {
    navigate(path)
    setIsMenuOpen(false)
  }

  const getTrialInfo = () => {
    if (!trialEndsAt) return null
    const trialDate = new Date(trialEndsAt)
    const today = new Date()
    const daysLeft = Math.ceil((trialDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (daysLeft <= 0) return null

    return {
      daysLeft,
      color: daysLeft <= 3 ? 'red' : daysLeft <= 7 ? 'yellow' : 'green'
    }
  }

  const trialInfo = getTrialInfo()

  return (
    <nav className={`${isDark ? 'bg-dark-800 border-dark-700' : 'bg-white'} shadow-sm border-b sticky top-0 z-50`}>
      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Desktop View */}
        <div className="hidden md:flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleNavigation('/dashboard')}>
            <Logo clickable={true} />
            <h1 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Controle financeiro
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {trialInfo && (
              <button
                onClick={() => handleNavigation('/dashboard')}
                className={`text-xs font-semibold px-3 py-1 rounded-full transition cursor-pointer ${
                  trialInfo.color === 'red'
                    ? isDark ? 'bg-red-900 text-red-200 hover:bg-red-800' : 'bg-red-100 text-red-800 hover:bg-red-200'
                    : trialInfo.color === 'yellow'
                    ? isDark ? 'bg-yellow-900 text-yellow-200 hover:bg-yellow-800' : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                    : isDark ? 'bg-green-900 text-green-200 hover:bg-green-800' : 'bg-green-100 text-green-800 hover:bg-green-200'
                }`}
                title="Trial: clique para ver detalhes"
              >
                📅 Trial: {trialInfo.daysLeft} dia{trialInfo.daysLeft !== 1 ? 's' : ''}
              </button>
            )}
            <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              {userName}
            </span>
            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-lg transition ${isDark ? 'hover:bg-dark-700 text-yellow-400' : 'hover:bg-gray-100 text-gray-600'}`}
              title="Alternar tema"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              onClick={() => handleNavigation('/projcao-anual')}
              className={`p-2 rounded-lg transition ${isDark ? 'hover:bg-dark-700 text-purple-400' : 'hover:bg-gray-100 text-purple-600'}`}
              title="Projeção Anual"
            >
              <TrendingUp size={18} />
            </button>
            <button
              onClick={() => handleNavigation('/calculadoras')}
              className={`p-2 rounded-lg transition ${isDark ? 'hover:bg-dark-700 text-green-400' : 'hover:bg-gray-100 text-green-600'}`}
              title="Calculadoras"
            >
              <Calculator size={18} />
            </button>
            <button
              onClick={() => handleNavigation('/profile')}
              className={`p-2 rounded-lg transition ${isDark ? 'hover:bg-dark-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
              title="Perfil"
            >
              <User size={18} />
            </button>
            <button
              onClick={onLogout}
              className={`p-2 rounded-lg transition ${isDark ? 'hover:bg-dark-700 text-red-400' : 'hover:bg-red-50 text-red-600'}`}
              title="Sair"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>

        {/* Mobile View */}
        <div className="flex md:hidden justify-between items-center">
          <div className="flex items-center gap-1 cursor-pointer" onClick={() => handleNavigation('/dashboard')}>
            <Logo clickable={true} />
            <h1 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              CF
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded-lg transition ${isDark ? 'hover:bg-dark-700 text-yellow-400' : 'hover:bg-gray-100 text-gray-600'}`}
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`p-2 rounded-lg transition ${isDark ? 'hover:bg-dark-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
            >
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className={`md:hidden mt-4 pt-4 border-t ${isDark ? 'border-dark-700' : 'border-gray-200'}`}>
            <div className="flex flex-col gap-2">
              {trialInfo && (
                <div className={`text-xs font-semibold px-3 py-2 rounded mb-2 text-center ${
                  trialInfo.color === 'red'
                    ? isDark ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800'
                    : trialInfo.color === 'yellow'
                    ? isDark ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-800'
                    : isDark ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'
                }`}>
                  📅 Trial: {trialInfo.daysLeft} dia{trialInfo.daysLeft !== 1 ? 's' : ''} restante{trialInfo.daysLeft !== 1 ? 's' : ''}
                </div>
              )}
              <button
                onClick={() => handleNavigation('/projcao-anual')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                  isDark ? 'hover:bg-dark-700 text-purple-400' : 'hover:bg-gray-100 text-purple-600'
                }`}
              >
                <TrendingUp size={18} />
                <span className="text-sm">Projeção</span>
              </button>
              <button
                onClick={() => handleNavigation('/calculadoras')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                  isDark ? 'hover:bg-dark-700 text-green-400' : 'hover:bg-gray-100 text-green-600'
                }`}
              >
                <Calculator size={18} />
                <span className="text-sm">Calculadoras</span>
              </button>
              <button
                onClick={() => handleNavigation('/profile')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                  isDark ? 'hover:bg-dark-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <User size={18} />
                <span className="text-sm">Perfil</span>
              </button>
              <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} px-4 py-2`}>
                {userName}
              </div>
              <button
                onClick={onLogout}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                  isDark ? 'hover:bg-dark-700 text-red-400' : 'hover:bg-red-50 text-red-600'
                }`}
              >
                <LogOut size={18} />
                <span className="text-sm">Sair</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
