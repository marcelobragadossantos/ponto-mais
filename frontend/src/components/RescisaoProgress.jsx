import React, { useState, useEffect } from 'react'
import { FiUser, FiCheckCircle, FiXCircle, FiClock } from 'react-icons/fi'
import axios from 'axios'
import { API_URL } from '../config'

const RescisaoProgress = ({ isProcessing }) => {
  const [collaborators, setCollaborators] = useState([])
  const [currentTask, setCurrentTask] = useState(null)
  const [currentAction, setCurrentAction] = useState('')

  useEffect(() => {
    // Carrega colaboradores do arquivo quando disponível
    loadCollaborators()
  }, [])

  useEffect(() => {
    if (isProcessing) {
      const interval = setInterval(async () => {
        try {
          const response = await axios.get(`${API_URL}/api/queue/status`)
          const task = response.data.current_task
          
          if (task && task.type === 'rescisao') {
            setCurrentTask(task)
          }
          
          // Atualiza progresso dos colaboradores baseado nos logs
          await updateProgressFromLogs()
        } catch (error) {
          console.error('Erro ao buscar status:', error)
        }
      }, 1500) // Atualiza a cada 1.5 segundos para ser mais responsivo
      
      return () => clearInterval(interval)
    }
  }, [isProcessing])

  const loadCollaborators = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/rescisao/collaborators`)
      const collabs = response.data.collaborators || []
      
      setCollaborators(collabs.map(c => ({
        ...c,
        processados: 0,
        erros: []
      })))
    } catch (error) {
      console.error('Erro ao carregar colaboradores:', error)
    }
  }

  const updateProgressFromLogs = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/logs`)
      const logs = response.data.logs || []
      
      // Atualiza ação atual (último log de info relevante)
      const recentLogs = logs.slice(-20) // Pega os últimos 20 logs
      const actionLog = [...recentLogs].reverse().find(log => 
        log.level === 'info' && (
          log.message.includes('🌐') || 
          log.message.includes('⏳') || 
          log.message.includes('✅') || 
          log.message.includes('📌') || 
          log.message.includes('📅') || 
          log.message.includes('👤') || 
          log.message.includes('🔍') || 
          log.message.includes('👁️') || 
          log.message.includes('📥')
        )
      )
      
      if (actionLog) {
        setCurrentAction(actionLog.message)
      }
      
      // Analisa logs para atualizar progresso
      const updated = collaborators.map(collab => {
        // Busca logs de meses concluídos: "RESCISAO_MES_CONCLUIDO:NOME:1/3"
        const mesLogs = logs.filter(log => 
          log.message.includes('RESCISAO_MES_CONCLUIDO:') && 
          log.message.includes(collab.nome)
        )
        
        // Conta quantos meses foram processados
        let processados = 0
        if (mesLogs.length > 0) {
          // Pega o último log para saber o progresso atual
          const ultimoLog = mesLogs[mesLogs.length - 1]
          const match = ultimoLog.message.match(/(\d+)\/(\d+)/)
          if (match) {
            processados = parseInt(match[1])
          }
        }
        
        // Busca logs de erro
        const errorLogs = logs.filter(log => 
          log.level === 'error' && 
          log.message.includes(collab.nome) &&
          log.message.includes('Erro ao processar mês')
        )
        
        const erros = errorLogs.map(log => {
          const match = log.message.match(/mês (\d+)/)
          return match ? parseInt(match[1]) : 0
        }).filter(n => n > 0)
        
        // Só atualiza se houve mudança
        if (collab.processados !== processados || JSON.stringify(collab.erros) !== JSON.stringify(erros)) {
          return {
            ...collab,
            processados,
            erros
          }
        }
        return collab
      })
      
      // Só atualiza state se houve mudança real
      if (JSON.stringify(updated) !== JSON.stringify(collaborators)) {
        setCollaborators(updated)
      }
    } catch (error) {
      console.error('Erro ao atualizar progresso:', error)
    }
  }

  const getProgress = (collab) => {
    return Math.round((collab.processados / collab.meses) * 100)
  }

  const getStatusIcon = (index, collab) => {
    if (collab.erros.includes(index + 1)) {
      return <span className="text-2xl">❌</span>
    }
    if (index < collab.processados) {
      return <span className="text-2xl">✅</span>
    }
    return <span className="text-2xl text-gray-300">⚪</span>
  }

  if (collaborators.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center py-8 text-gray-500">
          <FiUser size={48} className="mx-auto mb-4 opacity-50" />
          <p>Nenhum colaborador carregado</p>
          <p className="text-sm mt-2">Faça upload do arquivo Nomes.xlsx</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <FiUser className="mr-2" size={20} />
        Progresso por Colaborador ({collaborators.length})
      </h3>

      {/* Linha de Detalhes do Processamento */}
      {isProcessing && currentAction && (
        <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            </div>
            <p className="ml-3 text-sm text-blue-900 font-medium">
              {currentAction}
            </p>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {collaborators.map((collab, idx) => {
          const progress = getProgress(collab)
          const hasErrors = collab.erros.length > 0
          const isComplete = progress === 100
          const isProcessing = progress > 0 && progress < 100

          return (
            <div 
              key={idx} 
              className="border-2 rounded-lg p-4 transition-all hover:shadow-md"
              style={{
                borderColor: hasErrors ? '#ef4444' : isComplete ? '#10b981' : '#e5e7eb'
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <span className="font-medium text-gray-900 mr-2">
                    {idx + 1}. {collab.nome}
                  </span>
                  {isProcessing && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      <FiClock className="mr-1" size={12} />
                      Em andamento
                    </span>
                  )}
                </div>
                <span className="text-lg font-bold text-gray-700">
                  {progress}%
                </span>
              </div>

              {/* Barra de Progresso */}
              <div className="w-full bg-gray-200 rounded-full h-4 mb-3">
                <div 
                  className={`h-4 rounded-full transition-all duration-300 ${
                    hasErrors ? 'bg-red-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Meses */}
              <div className="flex flex-wrap gap-2 mb-3">
                {Array.from({ length: collab.meses }, (_, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <div className="w-10 h-10 border-2 border-gray-300 rounded flex items-center justify-center text-sm font-medium">
                      {i + 1}
                    </div>
                    <div className="mt-1">
                      {getStatusIcon(i, collab)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Status */}
              <div className="flex items-center justify-between text-sm pt-3 border-t border-gray-200">
                <span className="text-gray-600">
                  {collab.meses} mês(es) • {collab.processados} processado(s)
                </span>
                
                {hasErrors && (
                  <span className="text-red-600 font-medium flex items-center">
                    <FiXCircle className="mr-1" size={16} />
                    {collab.erros.length} erro(s) - Mês {collab.erros.join(', ')}
                  </span>
                )}
                {isComplete && !hasErrors && (
                  <span className="text-green-600 font-medium flex items-center">
                    <FiCheckCircle className="mr-1" size={16} />
                    Concluído
                  </span>
                )}
                {isProcessing && (
                  <span className="text-blue-600 font-medium">
                    Em andamento...
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default RescisaoProgress
