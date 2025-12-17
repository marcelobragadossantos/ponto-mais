import React, { useState, useEffect } from 'react'
import { FiX, FiClock, FiCalendar } from 'react-icons/fi'
import { toast } from 'react-toastify'
import { listReports } from '../services/api'

const ScheduleModal = ({ isOpen, onClose, initialSchedule = null, onSave }) => {
  const [schedule, setSchedule] = useState({
    enabled: true,
    time: '15:00',
    frequency: 'daily', // daily, weekly, monthly
    days: [1, 2, 3, 4, 5], // Para weekly
    dayOfMonth: 1, // Para monthly
    dateMode: 'current_month',
    reports: []
  })
  const [availableReports, setAvailableReports] = useState([])

  const daysOfWeek = [
    { value: 0, label: 'Dom' },
    { value: 1, label: 'Seg' },
    { value: 2, label: 'Ter' },
    { value: 3, label: 'Qua' },
    { value: 4, label: 'Qui' },
    { value: 5, label: 'Sex' },
    { value: 6, label: 'Sáb' },
  ]

  useEffect(() => {
    if (isOpen) {
      loadReports()
      if (initialSchedule) {
        setSchedule(initialSchedule)
      }
    }
  }, [isOpen, initialSchedule])

  const loadReports = async () => {
    try {
      const response = await listReports()
      setAvailableReports(response.data.reports || [])
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error)
    }
  }

  if (!isOpen) return null

  const toggleDay = (day) => {
    const currentDays = schedule?.days || []
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day]
    setSchedule({ ...schedule, days: newDays })
  }

  const toggleReport = (reportId) => {
    const currentReports = schedule?.reports || []
    const newReports = currentReports.includes(reportId)
      ? currentReports.filter(id => id !== reportId)
      : [...currentReports, reportId]
    setSchedule({ ...schedule, reports: newReports })
  }

  const handleSave = () => {
    if (schedule.reports.length === 0) {
      toast.error('Selecione pelo menos um relatório')
      return
    }
    
    if (onSave) {
      onSave(schedule)
    } else {
      localStorage.setItem('reportSchedule', JSON.stringify(schedule))
      toast.success('Agendamento salvo com sucesso!')
    }
    onClose()
  }

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleOverlayClick}
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Configurar Agendamento
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Ativar/Desativar */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              Ativar Agendamento
            </label>
            <input
              type="checkbox"
              checked={schedule?.enabled || false}
              onChange={(e) => setSchedule({ ...schedule, enabled: e.target.checked })}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
          </div>

          {/* Frequência */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Frequência
            </label>
            <select
              value={schedule?.frequency || 'daily'}
              onChange={(e) => setSchedule({ ...schedule, frequency: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="daily">Diário</option>
              <option value="weekly">Semanal</option>
              <option value="monthly">Mensal</option>
            </select>
          </div>

          {/* Horário */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FiClock className="inline mr-2" />
              Horário de Execução
            </label>
            <input
              type="time"
              value={schedule?.time || '15:00'}
              onChange={(e) => setSchedule({ ...schedule, time: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Dias da Semana (apenas para semanal) */}
          {schedule?.frequency === 'weekly' && (
            <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FiCalendar className="inline mr-2" />
              Dias da Semana
            </label>
            <div className="grid grid-cols-7 gap-2">
              {daysOfWeek.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleDay(day.value)}
                  className={`
                    px-2 py-2 text-xs font-medium rounded-lg transition-colors
                    ${(schedule?.days || []).includes(day.value)
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }
                  `}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>
          )}

          {/* Dia do Mês (apenas para mensal) */}
          {schedule?.frequency === 'monthly' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dia do Mês
              </label>
              <input
                type="number"
                min="1"
                max="28"
                value={schedule?.dayOfMonth || 1}
                onChange={(e) => setSchedule({ ...schedule, dayOfMonth: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <p className="mt-1 text-xs text-gray-500">
                Dia 1 a 28 (para garantir que existe em todos os meses)
              </p>
            </div>
          )}

          {/* Modo de Data */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Período de Datas
            </label>
            <select
              value={schedule?.dateMode || 'current_month'}
              onChange={(e) => setSchedule({ ...schedule, dateMode: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="current_month">Mês Atual</option>
              <option value="previous_month">Mês Anterior</option>
              <option value="current_year">Ano Atual</option>
            </select>
          </div>

          {/* Seleção de Relatórios */}
          {availableReports && availableReports.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Relatórios para Agendar
              </label>
              <div className="max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-3 space-y-2">
                {availableReports.map((report) => (
                  <label
                    key={report.id}
                    className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={(schedule?.reports || []).includes(report.id)}
                      onChange={() => toggleReport(report.id)}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-900">
                      {report.name}
                    </span>
                  </label>
                ))}
              </div>
              <p className="mt-2 text-xs text-gray-500">
                {(schedule?.reports || []).length} relatório(s) selecionado(s)
              </p>
            </div>
          )}

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Resumo</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>
                • Status: <strong>{schedule?.enabled ? 'Ativo ✅' : 'Inativo ❌'}</strong>
              </li>
              <li>
                • Horário: <strong>{schedule?.time || '15:00'}</strong>
              </li>
              <li>
                • Dias: <strong>
                  {(schedule?.days || []).length === 0 ? 'Nenhum' : 
                   (schedule?.days || []).length === 7 ? 'Todos os dias' :
                   (schedule?.days || []).map(d => daysOfWeek[d].label).join(', ')}
                </strong>
              </li>
              <li>
                • Período: <strong>
                  {schedule?.dateMode === 'current_month' && 'Mês Atual'}
                  {schedule?.dateMode === 'previous_month' && 'Mês Anterior'}
                  {schedule?.dateMode === 'current_year' && 'Ano Atual'}
                </strong>
              </li>
              <li>
                • Relatórios: <strong>{(schedule?.reports || []).length} selecionado(s)</strong>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Salvar Agendamento
          </button>
        </div>
      </div>
    </div>
  )
}

export default ScheduleModal
