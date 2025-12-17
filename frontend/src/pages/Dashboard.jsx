import React, { useState, useEffect } from 'react'
import { FiDownload, FiSettings, FiFileText, FiCheckCircle, FiClock, FiList, FiAlertCircle } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { getConfig } from '../services/api'
import axios from 'axios'
import { API_URL } from '../config'

const Dashboard = () => {
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [queueStatus, setQueueStatus] = useState(null)

  useEffect(() => {
    loadConfig()
    loadQueueStatus()
    
    // Atualiza status da fila a cada 3 segundos
    const interval = setInterval(loadQueueStatus, 3000)
    return () => clearInterval(interval)
  }, [])

  const loadConfig = async () => {
    try {
      const response = await getConfig()
      setConfig(response.data)
    } catch (error) {
      console.error('Erro ao carregar configuração:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadQueueStatus = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/queue/status`)
      setQueueStatus(response.data)
    } catch (error) {
      console.error('Erro ao carregar status da fila:', error)
    }
  }

  const isConfigured = config?.pontomais?.destine

  const getTaskTypeLabel = (type) => {
    switch(type) {
      case 'report': return 'Relatório'
      case 'rescisao': return 'Rescisão'
      case 'db_query': return 'Consulta BD'
      default: return type
    }
  }

  const getStatusColor = (status) => {
    switch(status) {
      case 'processing': return 'text-blue-600 bg-blue-50'
      case 'completed': return 'text-green-600 bg-green-50'
      case 'error': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  return (
    <div className="space-y-6">
      {/* Resumo da Fila */}
      {queueStatus && (
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center">
              <FiList className="mr-2" size={24} />
              Fila de Trabalho
            </h2>
            <Link 
              to="/queue"
              className="px-4 py-2 bg-white text-primary-600 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
            >
              Ver Detalhes
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Tarefa Atual */}
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="flex items-center mb-2">
                <FiClock className="mr-2" size={18} />
                <span className="font-medium">Processando</span>
              </div>
              {queueStatus.current_task ? (
                <div>
                  <p className="text-sm opacity-90">
                    {queueStatus.current_task.type === 'db_query'
                      ? 'Colaboradores Trainee'
                      : queueStatus.current_task.data?.report_name || getTaskTypeLabel(queueStatus.current_task.type)
                    }
                  </p>
                  {queueStatus.current_task.progress !== undefined && (
                    <div className="mt-2">
                      <div className="w-full bg-white/20 rounded-full h-2">
                        <div 
                          className="bg-white h-2 rounded-full transition-all"
                          style={{ width: `${queueStatus.current_task.progress}%` }}
                        />
                      </div>
                      <p className="text-xs mt-1 opacity-75">
                        {queueStatus.current_task.progress}%
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm opacity-75">Nenhuma tarefa</p>
              )}
            </div>

            {/* Aguardando */}
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="flex items-center mb-2">
                <FiList className="mr-2" size={18} />
                <span className="font-medium">Na Fila</span>
              </div>
              <p className="text-3xl font-bold">{queueStatus.queue_size || 0}</p>
              <p className="text-xs opacity-75 mt-1">
                {queueStatus.queue_size === 1 ? 'tarefa aguardando' : 'tarefas aguardando'}
              </p>
            </div>

            {/* Próxima Tarefa */}
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="flex items-center mb-2">
                <FiAlertCircle className="mr-2" size={18} />
                <span className="font-medium">Próxima</span>
              </div>
              {queueStatus.queue_items && queueStatus.queue_items.length > 0 ? (
                <div>
                  <p className="text-sm opacity-90">
                    {queueStatus.queue_items[0].type === 'db_query'
                      ? 'Colaboradores Trainee'
                      : queueStatus.queue_items[0].data?.report_name || getTaskTypeLabel(queueStatus.queue_items[0].type)
                    }
                  </p>
                </div>
              ) : (
                <p className="text-sm opacity-75">Fila vazia</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Ações Rápidas</h2>
        
        {!isConfigured && (
          <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg">
            <div className="flex items-start">
              <span className="text-yellow-600 text-xl mr-3">⚠️ Sem resposta do servidor!<br></br>Se o problema persistir, entre em contato com o Administrador do Sistema</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            to="/reports"
            className="flex items-start p-5 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all group"
          >
            <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
              <FiDownload className="text-blue-600" size={24} />
            </div>
            <div className="ml-4">
              <p className="font-semibold text-gray-900 mb-1">Relatórios</p>
              <p className="text-sm text-gray-600">Baixar relatórios</p>
            </div>
          </Link>

          <Link
            to="/queue"
            className="flex items-start p-5 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all group"
          >
            <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center group-hover:bg-purple-200 transition-colors">
              <FiList className="text-purple-600" size={24} />
            </div>
            <div className="ml-4">
              <p className="font-semibold text-gray-900 mb-1">Fila de Trabalho</p>
              <p className="text-sm text-gray-600">Acompanhar tarefas</p>
            </div>
          </Link>

          <Link
            to="/rescisao"
            className="flex items-start p-5 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all group"
          >
            <div className="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center group-hover:bg-orange-200 transition-colors">
              <FiFileText className="text-orange-600" size={24} />
            </div>
            <div className="ml-4">
              <p className="font-semibold text-gray-900 mb-1">Rescisão</p>
              <p className="text-sm text-gray-600">Processar rescisões</p>
            </div>
          </Link>

          <Link
            to="/settings"
            className="flex items-start p-5 border-2 border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all group"
          >
            <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-200 transition-colors">
              <FiSettings className="text-gray-600" size={24} />
            </div>
            <div className="ml-4">
              <p className="font-semibold text-gray-900 mb-1">Configurações</p>
              <p className="text-sm text-gray-600">Credenciais e pastas</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Agendamentos */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <FiClock className="mr-2 text-primary-600" size={20} />
            Agendamentos Ativos
          </h3>
          <Link 
            to="/schedules"
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Ver Todos →
          </Link>
        </div>

        {(() => {
          const saved = localStorage.getItem('reportSchedules')
          const schedules = saved ? JSON.parse(saved) : []
          const activeSchedules = schedules.filter(s => s.enabled)

          if (activeSchedules.length === 0) {
            return (
              <div className="text-center py-8 text-gray-500">
                <FiClock size={40} className="mx-auto mb-3 opacity-50" />
                <p className="text-sm">Nenhum agendamento ativo</p>
                <Link 
                  to="/schedules"
                  className="text-sm text-primary-600 hover:text-primary-700 mt-2 inline-block"
                >
                  Configurar agendamentos
                </Link>
              </div>
            )
          }

          return (
            <div className="space-y-3">
              {activeSchedules.slice(0, 3).map((schedule, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{schedule.name}</p>
                    <p className="text-sm text-gray-600">
                      {schedule.time} • {schedule.reports?.length || 0} relatório(s)
                    </p>
                  </div>
                  <span className="text-green-600 text-sm font-medium">Ativo</span>
                </div>
              ))}
              {activeSchedules.length > 3 && (
                <p className="text-sm text-gray-500 text-center pt-2">
                  +{activeSchedules.length - 3} agendamento(s)
                </p>
              )}
            </div>
          )
        })()}
      </div>
    </div>
  )
}

export default Dashboard
