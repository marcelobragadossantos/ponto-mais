import React from 'react'
import { FiCalendar } from 'react-icons/fi'

const DatePicker = ({ value, onChange, placeholder = "DD/MM/AAAA", label }) => {
  const handleChange = (e) => {
    const inputValue = e.target.value
    
    // Se o usuário está digitando, permitir
    if (inputValue.length <= 10) {
      onChange(inputValue)
    }
  }

  const handleDateInputChange = (e) => {
    // Quando usar o date picker nativo, converter para DD/MM/YYYY
    const dateValue = e.target.value // YYYY-MM-DD
    if (dateValue) {
      const [year, month, day] = dateValue.split('-')
      onChange(`${day}/${month}/${year}`)
    }
  }

  // Converter DD/MM/YYYY para YYYY-MM-DD para o input date
  const getDateValue = () => {
    if (!value || value.length !== 10) return ''
    const [day, month, year] = value.split('/')
    if (!day || !month || !year) return ''
    return `${year}-${month}-${day}`
  }

  return (
    <div className="relative">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {/* Input de texto visível */}
        <input
          type="text"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          maxLength={10}
        />
        
        {/* Input date invisível sobreposto ao ícone */}
        <div className="absolute right-0 top-0 h-full flex items-center">
          <input
            type="date"
            onChange={handleDateInputChange}
            value={getDateValue()}
            className="absolute right-0 opacity-0 w-10 h-full cursor-pointer"
            title="Selecionar data"
          />
          <FiCalendar 
            className="absolute right-3 text-gray-400 pointer-events-none" 
            size={18}
          />
        </div>
      </div>
    </div>
  )
}

export default DatePicker
