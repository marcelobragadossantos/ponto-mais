import React, { useState, useEffect } from 'react'
import { FiX, FiClock, FiPlus, FiEdit2, FiTrash2, FiCalendar } from 'react-icons/fi'
import { toast } from 'react-toastify'
import ScheduleModal from './ScheduleModal'

const ScheduleListModal = ({ isOpen, onClose }) => {
  const [schedules, setSchedules] = useState([])
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState(null)

  useEffect(() => {
    if (isOpen) {
      loadSchedules()
    }
  }, [isOpen])

  const loadSchedules = () => {
    const saved = localStorage.getItem('reportSchedules')
    if (saved) {
      setSchedules(JSON.parse(saved))
    }
  }

  const saveSchedules = (newSchedules) => {
    localStorage.setItem('reportSchedules', JSON.stringify(newSchedules))
    setSchedules(newSchedules)
  }

  const handleAddSchedule = () => {
    setEditingSchedule(null)
    setShowScheduleModal(true)
  }

  const handleEditSchedule = (schedule, index) => {
    setEditingSchedule({ ...schedule, index })
    setShowScheduleModal(true)
  }

  const handleDeleteSchedule = (index) => {
    if (confirm('Deseja realmente excluir este agendamento?')) {
      const newSchedules = schedules.filter((_, i) => i !== index)
      saveSchedules(newSchedules)
      toast.success('Agendamento excluído')
    }
  }

  const handleSaveSchedule = (schedule) => {
    let newSchedules
    if (editingSchedule && editingSchedule.index !== undefined) {
      // Editando
      newSchedules = [...schedules]
      newSchedules[editingSchedule.index] = schedule
    } else {
      // Novo
      newSchedules = [...schedules, schedule]
    }
    saveSchedules(newSchedules)
    setShowScheduleModal(false)
    toast.success('Agendamento salvo!')
  }

  const getFrequencyLabel = (schedule) => {
    if (schedule.frequency === 'daily') return 'Diário'
    if (schedule.frequency === 'weekly') return 'Semanal'
    if (schedule.frequency === 'monthly') return 'Mensal'
    return 'Personalizado'
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
          {/* Overlay */}
          <div 
            className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
            onClick={onClose}
          />

          {/* Modal */}
          <div className="inline-block w-full max-w-4xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white rounded-lg shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-primary-50">
              <h3 className="text-lg font-semibold text-primary-900 flex items-center">
                <FiCalendar className="mr-2" size={20} />
                Gerenciar Agendamentos
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FiX size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-600">
                  {schedules.length} agendamento(s) configurado(s)
                </p>
                <button
                  onClick={handleAddSchedule}
                  className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <FiPlus className="mr-2" size={18} />
                  Novo Agendamento
                </button>
              </div>

              {schedules.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FiClock size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Nenhum agendamento configurado</p>
                  <p className="text-sm mt-2">Clique em "Novo Agendamento" para começar</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {schedules.map((schedule, index) => (
                    <div 
                      key={index}
                      className="border-2 rounded-lg p-4 hover:border-primary-300 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              schedule.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {schedule.enabled ? '✓ Ativo' : '○ Inativo'}
                            </span>
                            <span className="ml-2 text-sm font-medium text-gray-900">
                              {getFrequencyLabel(schedule)}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Horário:</span>
                              <span className="ml-2 font-medium">{schedule.time}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Relatórios:</span>
                              <span className="ml-2 font-medium">{schedule.reports?.length || 0}</span>
                            </div>
                          </div>

                          {schedule.frequency === 'weekly' && schedule.days && (
                            <div className="mt-2 text-sm">
                              <span className="text-gray-600">Dias:</span>
                              <span className="ml-2">
                                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
                                  .filter((_, i) => schedule.days.includes(i))
                                  .join(', ')}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => handleEditSchedule(schedule, index)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <FiEdit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteSchedule(index)}
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

            {/* Footer */}
            <div className="flex items-center justify-end px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Agendamento */}
      {showScheduleModal && (
        <ScheduleModal
          isOpen={showScheduleModal}
          onClose={() => setShowScheduleModal(false)}
          initialSchedule={editingSchedule}
          onSave={handleSaveSchedule}
        />
      )}
    </>
  )
}

export default ScheduleListModal
