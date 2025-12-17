import React, { useState, useEffect } from 'react'
import { FiPlus, FiEdit2, FiTrash2, FiClock, FiCalendar, FiToggleLeft, FiToggleRight } from 'react-icons/fi'
import { toast } from 'react-toastify'
import { listReports } from '../services/api'
import axios from 'axios'
import { API_URL } from '../config'

const Schedules = () => {
  const [schedules, setSchedules] = useState([])
  const [availableReports, setAvailableReports] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingIndex, setEditingIndex] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    enabled: true,
    time: '15:00',
    frequency: 'daily',
    days: [1, 2, 3, 4, 5],
    dayOfMonth: 1,
    dateMode: 'current_month',
    reports: []
  })

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
    loadSchedules()
    loadReports()
  }, [])

  const loadSchedules = () => {
    const saved = localStorage.getItem('reportSchedules')
    if (saved) {
      setSchedules(JSON.parse(saved))
    }
  }

  const loadReports = async () => {
    try {
      const response = await listReports()
      setAvailableReports(response.data.reports || [])
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error)
    }
  }

  const saveSchedules = async (newSchedules) => {
    localStorage.setItem('reportSchedules', JSON.stringify(newSchedules))
    setSchedules(newSchedules)
    
    // Sincroniza com backend
    try {
      await axios.post(`${API_URL}/api/schedules/sync`, { schedules: newSchedules })
    } catch (error) {
      console.error('Erro ao sincronizar agendamentos:', error)
      toast.warning('Agendamentos salvos localmente, mas não sincronizados com o servidor')
    }
  }

  const handleAddNew = () => {
    setFormData({
      name: '',
      enabled: true,
      time: '15:00',
      frequency: 'daily',
      days: [1, 2, 3, 4, 5],
      dayOfMonth: 1,
      dateMode: 'current_month',
      reports: []
    })
    setEditingIndex(null)
    setShowForm(true)
  }

  const handleEdit = (schedule, index) => {
    setFormData(schedule)
    setEditingIndex(index)
    setShowForm(true)
  }

  const handleDelete = (index) => {
    if (confirm('Deseja realmente excluir este agendamento?')) {
      const newSchedules = schedules.filter((_, i) => i !== index)
      saveSchedules(newSchedules)
      toast.success('Agendamento excluído')
    }
  }

  const handleToggleEnabled = (index) => {
    const newSchedules = [...schedules]
    newSchedules[index].enabled = !newSchedules[index].enabled
    saveSchedules(newSchedules)
    toast.success(newSchedules[index].enabled ? 'Agendamento ativado' : 'Agendamento desativado')
  }

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast.error('Digite um nome para o agendamento')
      return
    }
    if (formData.reports.length === 0) {
      toast.error('Selecione pelo menos um relatório')
      return
    }

    let newSchedules
    if (editingIndex !== null) {
      newSchedules = [...schedules]
      newSchedules[editingIndex] = formData
      toast.success('Agendamento atualizado')
    } else {
      newSchedules = [...schedules, formData]
      toast.success('Agendamento criado')
    }

    saveSchedules(newSchedules)
    setShowForm(false)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingIndex(null)
  }

  const toggleDay = (day) => {
    const currentDays = formData.days || []
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day]
    setFormData({ ...formData, days: newDays })
  }

  const toggleReport = (reportId) => {
    const currentReports = formData.reports || []
    const newReports = currentReports.includes(reportId)
      ? currentReports.filter(id => id !== reportId)
      : [...currentReports, reportId]
    setFormData({ ...formData, reports: newReports })
  }

  const getFrequencyLabel = (frequency) => {
    switch(frequency) {
      case 'daily': return 'Diário'
      case 'weekly': return 'Semanal'
      case 'monthly': return 'Mensal'
      default: return frequency
    }
  }

  const getScheduleDescription = (schedule) => {
    let desc = `${schedule.time} - `
    if (schedule.frequency === 'daily') {
      desc += 'Todos os dias'
    } else if (schedule.frequency === 'weekly') {
      const days = schedule.days.map(d => daysOfWeek[d].label).join(', ')
      desc += days
    } else if (schedule.frequency === 'monthly') {
      desc += `Dia ${schedule.dayOfMonth} de cada mês`
    }
    return desc
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Agendamentos
            </h2>
            <p className="text-gray-600">
              Configure execuções automáticas de relatórios
            </p>
          </div>
          <button
            onClick={handleAddNew}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <FiPlus className="mr-2" size={18} />
            Novo Agendamento
          </button>
        </div>
      </div>

      {/* Lista de Agendamentos */}
      {!showForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Agendamentos Configurados ({schedules.length})
          </h3>

          {schedules.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FiCalendar size={48} className="mx-auto mb-4 opacity-50" />
              <p>Nenhum agendamento configurado</p>
              <p className="text-sm mt-2">Clique em "Novo Agendamento" para começar</p>
            </div>
          ) : (
            <div className="space-y-3">
              {schedules.map((schedule, index) => (
                <div 
                  key={index}
                  className={`border-2 rounded-lg p-4 transition-all ${
                    schedule.enabled ? 'border-green-200 bg-green-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h4 className="text-lg font-semibold text-gray-900">
                          {schedule.name}
                        </h4>
                        <span className={`ml-3 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          schedule.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {getFrequencyLabel(schedule.frequency)}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">
                        <FiClock className="inline mr-1" size={14} />
                        {getScheduleDescription(schedule)}
                      </p>

                      <p className="text-sm text-gray-600">
                        {schedule.reports.length} relatório(s) selecionado(s)
                      </p>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleToggleEnabled(index)}
                        className={`p-2 rounded-lg transition-colors ${
                          schedule.enabled 
                            ? 'text-green-600 hover:bg-green-100' 
                            : 'text-gray-400 hover:bg-gray-100'
                        }`}
                        title={schedule.enabled ? 'Desativar' : 'Ativar'}
                      >
                        {schedule.enabled ? <FiToggleRight size={24} /> : <FiToggleLeft size={24} />}
                      </button>
                      <button
                        onClick={() => handleEdit(schedule, index)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <FiEdit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Formulário */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            {editingIndex !== null ? 'Editar Agendamento' : 'Novo Agendamento'}
          </h3>

          <div className="space-y-4">
            {/* Nome */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome do Agendamento *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Relatórios Diários"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Frequência */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Frequência
                </label>
                <select
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
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
                  Horário
                </label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Dias da Semana (semanal) */}
            {formData.frequency === 'weekly' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dias da Semana
                </label>
                <div className="grid grid-cols-7 gap-2">
                  {daysOfWeek.map((day) => (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleDay(day.value)}
                      className={`px-2 py-2 text-sm font-medium rounded-lg transition-colors ${
                        formData.days.includes(day.value)
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Dia do Mês (mensal) */}
            {formData.frequency === 'monthly' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dia do Mês
                </label>
                <input
                  type="number"
                  min="1"
                  max="28"
                  value={formData.dayOfMonth}
                  onChange={(e) => setFormData({ ...formData, dayOfMonth: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Dia 1 a 28 (para garantir que existe em todos os meses)
                </p>
              </div>
            )}

            {/* Período de Datas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Período de Datas
              </label>
              <select
                value={formData.dateMode}
                onChange={(e) => setFormData({ ...formData, dateMode: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="current_month">Mês Atual</option>
                <option value="previous_month">Mês Anterior</option>
                <option value="current_year">Ano Atual</option>
              </select>
            </div>

            {/* Relatórios */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Relatórios para Agendar *
              </label>
              <div className="max-h-64 overflow-y-auto border border-gray-300 rounded-lg p-3 space-y-2">
                {availableReports.map((report) => (
                  <label
                    key={report.id}
                    className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.reports.includes(report.id)}
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
                {formData.reports.length} relatório(s) selecionado(s)
              </p>
            </div>
          </div>

          {/* Botões */}
          <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              {editingIndex !== null ? 'Atualizar' : 'Criar'} Agendamento
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Schedules
