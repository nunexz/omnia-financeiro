import { useState } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'

interface MonthYearPickerProps {
  currentMonth: Date
  onMonthChange: (date: Date) => void
  isDark: boolean
}

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

export default function MonthYearPicker({ currentMonth, onMonthChange, isDark }: MonthYearPickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(currentMonth.getMonth())
  const [selectedYear, setSelectedYear] = useState(currentMonth.getFullYear())

  const currentYear = new Date().getFullYear()
  const yearOptions = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i)

  const handleConfirm = () => {
    const newDate = new Date(selectedYear, selectedMonth, 1)
    onMonthChange(newDate)
    setIsOpen(false)
  }

  const handleCancel = () => {
    setSelectedMonth(currentMonth.getMonth())
    setSelectedYear(currentMonth.getFullYear())
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`px-4 py-2 rounded-lg font-semibold transition flex items-center gap-2 ${
          isDark
            ? 'bg-dark-700 hover:bg-dark-600 text-white border border-dark-600'
            : 'bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-300'
        }`}
      >
        📅 {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        <ChevronDown size={16} />
      </button>

      {isOpen && (
        <div
          className={`absolute top-full left-0 mt-2 p-4 rounded-lg shadow-lg z-50 w-72 ${
            isDark ? 'bg-dark-800 border border-dark-700' : 'bg-white border border-gray-200'
          }`}
        >
          <div className="space-y-4">
            {/* Mês */}
            <div>
              <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Mês
              </label>
              <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                {MONTHS.map((month, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedMonth(index)}
                    className={`py-2 px-3 rounded text-sm font-medium transition ${
                      selectedMonth === index
                        ? 'bg-orange-500 text-white'
                        : isDark
                        ? 'bg-dark-700 text-gray-300 hover:bg-dark-600'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {month.substring(0, 3)}
                  </button>
                ))}
              </div>
            </div>

            {/* Ano */}
            <div>
              <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Ano
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                {yearOptions.map((year) => (
                  <button
                    key={year}
                    onClick={() => setSelectedYear(year)}
                    className={`py-2 px-3 rounded text-sm font-medium transition ${
                      selectedYear === year
                        ? 'bg-orange-500 text-white'
                        : isDark
                        ? 'bg-dark-700 text-gray-300 hover:bg-dark-600'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-2 pt-4 border-t border-dark-700">
              <button
                onClick={handleCancel}
                className={`flex-1 py-2 rounded-lg font-semibold transition ${
                  isDark
                    ? 'bg-dark-700 hover:bg-dark-600 text-gray-300'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 py-2 rounded-lg font-semibold bg-orange-500 hover:bg-orange-600 text-white transition"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
