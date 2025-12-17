import { useState, useEffect } from 'react'
import { FiRefreshCw, FiClock, FiCheckCircle, FiXCircle, FiLoader, FiCalendar } from 'react-icons/fi'
import { toast } from 'react-toastify'
import axios from 'axios'
import { API_URL } from '../config'
import ScheduleModal from '../components/ScheduleModal'

const Queue = () => {
  const [currentTask, setCurrentTask] = useState(null)
  const [queueItems, setQueueItems] = useState([])
  const [allTasks, setAllTasks] = useState([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('all') // all, pending, processing, completed, error
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [schedule, setSchedule] = useState({
    enabled: false,
    time: '15:00',
    days: [1, 2, 3, 4, 5],
    dateMode: 'current_month',
    reports: []
  })

  useEffect(() => {
    loadQueueStatus()
    
    // Carrega agendamento salvo
    const savedSchedule = localStorage.getItem('pontomais_schedule')
    if (savedSchedule) {
      try {
        setSchedule(JSON.parse(savedSchedule))
      } catch (e) {
        console.error('Erro ao carregar agendamento:', e)
      }
    }
    
    // Polling para atualizar status
    const interval = setInterval(loadQueueStatus, 3000)
    return () => clearInterval(interval)
  }, [])

  // Salva agendamento quando muda
  useEffect(() => {
    if (schedule.enabled !== undefined) {
      localStorage.setItem('pontomais_schedule', JSON.stringify(schedule))
    }
  }, [schedule])

  const loadQueueStatus = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/queue/all`)
      setAllTasks(response.data.tasks || [])
      
      // Separa tarefa atual e fila
      const current = response.data.tasks.find(t => t.status === 'processing')
      const pending = response.data.tasks.filter(t => t.status === 'pending')
      
      setCurrentTask(current)
      setQueueItems(pending)
    } catch (error) {
      console.error('Erro ao carregar fila:', error)
    }
  }

  const clearCompleted = async () => {
    try {
      setLoading(true)
      await axios.delete(`${API_URL}/api/queue/clear`)
      toast.success('Tarefas concluídas removidas')
      loadQueueStatus()
    } catch (error) {
      toast.error('Erro ao limpar tarefas')
    } finally {
      setLoading(false)
    }
  }

  const moveTaskUp = (index) => {
    // TODO: Implementar API para reordenar fila
    toast.info('Funcionalidade em desenvolvimento')
  }

  const moveTaskDown = (index) => {
    // TODO: Implementar API para reordenar fila
    toast.info('Funcionalidade em desenvolvimento')
  }

  const deleteTask = async (taskId) => {
    if (!window.confirm('Excluir esta tarefa da fila?')) return
    try {
      await axios.delete(`${API_URL}/api/queue/task/${taskId}`)
      toast.success('Tarefa removida')
      loadQueueStatus()
    } catch (error) {
      toast.error('Erro ao remover tarefa')
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'processing':
        return <FiLoader className="animate-spin text-blue-600" size={20} />
      case 'completed':
        return <FiCheckCircle className="text-green-600" size={20} />
      case 'error':
        return <FiXCircle className="text-red-600" size={20} />
      case 'pending':
        return <FiClock className="text-yellow-600" size={20} />
      default:
        return <FiClock className="text-gray-400" size={20} />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'processing':
        return 'bg-blue-50 border-blue-200'
      case 'completed':
        return 'bg-green-50 border-green-200'
      case 'error':
        return 'bg-red-50 border-red-200'
      case 'pending':
        return 'bg-yellow-50 border-yellow-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const getTaskTypeName = (type) => {
    switch (type) {
      case 'report':
        return 'Relatório'
      case 'rescisao':
        return 'Rescisão'
      case 'db_query':
        return 'Consulta BD'
      case 'queue_batch':
        return 'Lote'
      default:
        return type
    }
  }

  const filteredTasks = allTasks.filter(task => {
    if (filter === 'all') return true
    return task.status === filter
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Fila de Trabalho</h2>
            <p className="mt-1 text-sm text-gray-600">
              Acompanhe todas as tarefas em processamento
            </p>
          </div>
          <div className="flex items-center space-x-3">

            <button
              onClick={loadQueueStatus}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              <FiRefreshCw className={`mr-2 ${loading ? 'animate-spin' : ''}`} size={18} />
              Atualizar
            </button>
            <button
              onClick={clearCompleted}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
            >
              Limpar Concluídas
            </button>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Todas ({allTasks.length})
          </button>
          <button
            onClick={() => setFilter('processing')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'processing'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Em Processamento
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'pending'
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Aguardando ({queueItems.length})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'completed'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Concluídas
          </button>
          <button
            onClick={() => setFilter('error')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'error'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Com Erro
          </button>
        </div>
      </div>

      {/* Tarefa Atual */}
      {currentTask && (
        <div className="bg-white rounded-lg shadow-sm border-2 border-blue-500 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FiLoader className="animate-spin mr-2 text-blue-600" size={20} />
            Processando Agora
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                {currentTask.type === 'db_query' 
                  ? (currentTask.result?.query_type || 'Colaboradores Trainee')
                  : `${getTaskTypeName(currentTask.type)}${currentTask.data?.report_name ? `: ${currentTask.data.report_name}` : ''}`
                }
              </span>
              <span className="text-sm text-gray-600">{currentTask.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${currentTask.progress}%` }}
              />
            </div>
            <p className="text-sm text-gray-600">{currentTask.message}</p>
          </div>
        </div>
      )}

      {/* Lista de Tarefas */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {filter === 'all' ? 'Todas as Tarefas' : 
           filter === 'pending' ? 'Fila de Espera' :
           filter === 'processing' ? 'Em Processamento' :
           filter === 'completed' ? 'Concluídas' : 'Com Erro'}
        </h3>

        {filteredTasks.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <FiClock size={48} className="mx-auto mb-4 opacity-50" />
            <p>Nenhuma tarefa {filter !== 'all' && `com status "${filter}"`}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTasks.map((task, index) => {
              const isPending = task.status === 'pending'
              const isProcessing = task.status === 'processing'
              const isCompleted = task.status === 'completed'
              const isError = task.status === 'error'
              
              // Calcula número da fila (ordem decrescente - primeiro = maior número)
              let queueNumber = null
              if (isProcessing) {
                queueNumber = 1
              } else if (isPending) {
                const pendingTasks = filteredTasks.filter(t => t.status === 'pending')
                const pendingIndex = pendingTasks.findIndex(t => t.id === task.id)
                queueNumber = pendingTasks.length - pendingIndex + 1
              }
              
              return (
              <div
                key={task.id}
                className={`border-2 rounded-lg p-4 ${getStatusColor(task.status)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    {/* Número ou Ícone */}
                    {queueNumber ? (
                      <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${
                        isProcessing ? 'bg-blue-500' : 'bg-yellow-500'
                      }`}>
                        <span className="text-2xl font-bold text-white">{queueNumber}</span>
                      </div>
                    ) : (
                      getStatusIcon(task.status)
                    )}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-gray-900">
                          {task.type === 'db_query'
                            ? (task.result?.query_type || 'Colaboradores Trainee')
                            : `${getTaskTypeName(task.type)}${task.data?.report_name ? `: ${task.data.report_name}` : ''}`
                          }
                        </span>
                      </div>
                      
                      {/* Timestamps */}
                      <div className="text-xs text-gray-500 mb-2">
                        📅 Inclusão: {new Date(task.created_at).toLocaleString('pt-BR')}
                        {task.started_at && (
                          <> | ▶️ Início: {new Date(task.started_at).toLocaleString('pt-BR')}</>
                        )}
                        {task.completed_at && (() => {
                          const seconds = Math.round((new Date(task.completed_at) - new Date(task.started_at)) / 1000)
                          const h = Math.floor(seconds / 3600)
                          const m = Math.floor((seconds % 3600) / 60)
                          const s = seconds % 60
                          const time = h > 0 ? `${h}h ${m}m ${s}s` : m > 0 ? `${m}m ${s}s` : `${s}s`
                          return <> | {task.status === 'completed' ? '✅' : '❌'} Tempo de processamento: {time}</>
                        })()}
                      </div>
                      
                      <p className="text-sm text-gray-600">{task.message}</p>
                      {task.status === 'processing' && (
                        <div className="mt-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{ width: `${task.progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                      {task.error && (
                        <p className="text-sm text-red-600 mt-2">Erro: {task.error}</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Botões de Ação - APENAS para pendentes */}
                  {isPending && (
                    <div className="flex items-center gap-1 ml-3">
                      <button
                        onClick={() => moveTaskUp(index)}
                        disabled={index === 0}
                        className="p-2 text-gray-700 hover:bg-yellow-100 rounded disabled:opacity-30"
                        title="Mover para cima"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => moveTaskDown(index)}
                        disabled={index === filteredTasks.length - 1}
                        className="p-2 text-gray-700 hover:bg-yellow-100 rounded disabled:opacity-30"
                        title="Mover para baixo"
                      >
                        ↓
                      </button>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded ml-1"
                        title="Excluir"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )})}
          </div>
        )}
      </div>

      {/* Modal de Agendamento */}
      <ScheduleModal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        schedule={schedule}
        onSave={(newSchedule) => {
          setSchedule(newSchedule)
          setShowScheduleModal(false)
          toast.success(newSchedule.enabled ? 'Agendamento ativado!' : 'Agendamento desativado')
        }}
      />
    </div>
  )
}

export default Queue
