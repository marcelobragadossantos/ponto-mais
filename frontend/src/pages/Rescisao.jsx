import React, { useState, useEffect } from 'react'
import { FiUpload, FiPlay, FiDownload, FiAlertCircle, FiInfo } from 'react-icons/fi'
import { toast } from 'react-toastify'
import { uploadNomesFile, processRescisao, getDownloadStatus } from '../services/api'
import InstructionsModal from '../components/InstructionsModal'
import RescisaoProgress from '../components/RescisaoProgress'
import axios from 'axios'
import { API_URL } from '../config'

const Rescisao = () => {
  const [file, setFile] = useState(null)
  const [uploaded, setUploaded] = useState(() => {
    // Verifica se há arquivo enviado no localStorage
    return localStorage.getItem('rescisao_uploaded') === 'true'
  })
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(null)
  const [showInstructions, setShowInstructions] = useState(false)
  const [currentTaskId, setCurrentTaskId] = useState(() => {
    // Recupera taskId do localStorage se existir
    return localStorage.getItem('rescisao_task_id') || null
  })

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.xlsx')) {
        toast.error('Arquivo deve ser .xlsx')
        return
      }
      setFile(selectedFile)
      setUploaded(false)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      toast.error('Selecione um arquivo')
      return
    }

    try {
      await uploadNomesFile(file)
      toast.success('Arquivo enviado com sucesso!')
      setUploaded(true)
      localStorage.setItem('rescisao_uploaded', 'true')
    } catch (error) {
      toast.error('Erro ao enviar arquivo')
    }
  }

  const handleProcess = async () => {
    if (!uploaded) {
      toast.error('Envie o arquivo Nomes.xlsx primeiro')
      return
    }

    try {
      setProcessing(true)
      const response = await processRescisao()
      const taskId = response.data.task_id
      setCurrentTaskId(taskId)
      localStorage.setItem('rescisao_task_id', taskId)
      localStorage.setItem('rescisao_processing', 'true')
      toast.info('Processo iniciado...')

      // Poll for status
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await getDownloadStatus(taskId)
          const status = statusResponse.data

          setProgress(status)

          if (status.status === 'concluido' || status.status === 'completed') {
            clearInterval(pollInterval)
            toast.success('Processo concluído!')
            setProcessing(false)
            setProgress(null)
            localStorage.removeItem('rescisao_task_id')
            localStorage.removeItem('rescisao_processing')
            localStorage.removeItem('rescisao_uploaded')
          } else if (status.status === 'erro' || status.status === 'error') {
            clearInterval(pollInterval)
            toast.error(`Erro: ${status.message}`)
            setProcessing(false)
            setProgress(null)
            localStorage.removeItem('rescisao_task_id')
            localStorage.removeItem('rescisao_processing')
          }
        } catch (error) {
          clearInterval(pollInterval)
          setProcessing(false)
          setProgress(null)
        }
      }, 3000)

    } catch (error) {
      toast.error('Erro ao iniciar processo')
      setProcessing(false)
      localStorage.removeItem('rescisao_processing')
    }
  }

  // Verifica se há processo em andamento ao carregar a página
  useEffect(() => {
    const checkOngoingProcess = async () => {
      const isProcessing = localStorage.getItem('rescisao_processing') === 'true'
      const taskId = localStorage.getItem('rescisao_task_id')
      
      if (isProcessing && taskId) {
        try {
          // Verifica se a tarefa ainda está ativa
          const response = await axios.get(`${API_URL}/api/queue/status`)
          const currentTask = response.data.current_task
          
          // Verifica se a tarefa atual é de rescisão
          if (currentTask && currentTask.type === 'rescisao' && currentTask.id === taskId) {
            setProcessing(true)
            setCurrentTaskId(taskId)
            
            // Inicia polling
            const pollInterval = setInterval(async () => {
              try {
                const statusResponse = await getDownloadStatus(taskId)
                const status = statusResponse.data

                setProgress(status)

                if (status.status === 'concluido' || status.status === 'completed') {
                  clearInterval(pollInterval)
                  toast.success('Processo concluído!')
                  setProcessing(false)
                  setProgress(null)
                  localStorage.removeItem('rescisao_task_id')
                  localStorage.removeItem('rescisao_processing')
                  localStorage.removeItem('rescisao_uploaded')
                } else if (status.status === 'erro' || status.status === 'error') {
                  clearInterval(pollInterval)
                  toast.error(`Erro: ${status.message}`)
                  setProcessing(false)
                  setProgress(null)
                  localStorage.removeItem('rescisao_task_id')
                  localStorage.removeItem('rescisao_processing')
                }
              } catch (error) {
                clearInterval(pollInterval)
                setProcessing(false)
                setProgress(null)
              }
            }, 3000)
          } else {
            // Tarefa não está mais ativa, limpa localStorage
            localStorage.removeItem('rescisao_task_id')
            localStorage.removeItem('rescisao_processing')
          }
        } catch (error) {
          console.error('Erro ao verificar processo em andamento:', error)
          localStorage.removeItem('rescisao_task_id')
          localStorage.removeItem('rescisao_processing')
        }
      }
    }
    
    checkOngoingProcess()
  }, [])

  const downloadTemplate = () => {
    // Create a simple template
    const template = `Nome,Admissão,Demissão
João Silva,01/01/2020,31/12/2023
Maria Santos,15/03/2021,28/02/2024`

    const blob = new Blob([template], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'Nomes_Template.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
    
    toast.info('Template baixado! Converta para .xlsx')
  }

  return (
    <div className="space-y-6">
      {/* Header com botão de instruções */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Processo de Rescisão
            </h2>
            <p className="text-gray-600">
              Faça upload do arquivo Nomes.xlsx e processe as rescisões automaticamente
            </p>
          </div>
          <button
            onClick={() => setShowInstructions(true)}
            className="flex items-center px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
            title="Ver instruções detalhadas"
          >
            <FiInfo className="mr-2" size={18} />
            Instruções
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            1. Upload do Arquivo
          </h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Arquivo Nomes.xlsx
            </label>
            <input
              type="file"
              accept=".xlsx"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-primary-50 file:text-primary-700
                hover:file:bg-primary-100
                cursor-pointer"
            />
          </div>

          {file && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>Arquivo selecionado:</strong> {file.name}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Tamanho: {(file.size / 1024).toFixed(2)} KB
              </p>
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={!file || uploaded}
            className={`
              w-full flex items-center justify-center px-6 py-3 rounded-lg font-medium
              ${!file || uploaded
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-primary-600 text-white hover:bg-primary-700'
              }
            `}
          >
            <FiUpload className="mr-2" />
            {uploaded ? 'Arquivo Enviado ✓' : 'Enviar Arquivo'}
          </button>

          <button
            onClick={downloadTemplate}
            className="w-full mt-3 flex items-center justify-center px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            <FiDownload className="mr-2" />
            Baixar Template
          </button>
        </div>

        {/* Process Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            2. Processar Rescisões
          </h2>

          <div className="mb-6">
            <div className="flex items-start p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <FiAlertCircle className="text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">Atenção:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Certifique-se de que o arquivo está correto</li>
                  <li>O processo pode levar vários minutos</li>
                  <li>Não feche esta página durante o processo</li>
                </ul>
              </div>
            </div>
          </div>

          {progress && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-900">
                  {progress.message}
                </span>
                <span className="text-sm text-blue-700">
                  {progress.progress}%
                </span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress.progress}%` }}
                />
              </div>
            </div>
          )}

          <button
            onClick={handleProcess}
            disabled={!uploaded || processing}
            className={`
              w-full flex items-center justify-center px-6 py-3 rounded-lg font-medium
              ${!uploaded || processing
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
              }
            `}
          >
            <FiPlay className="mr-2" />
            {processing ? 'Processando...' : 'Iniciar Processo'}
          </button>
        </div>
      </div>

      {/* Progresso dos Colaboradores */}
      {uploaded && (
        <RescisaoProgress isProcessing={processing} />
      )}

      {/* Modal de Instruções */}
      <InstructionsModal 
        isOpen={showInstructions} 
        onClose={() => setShowInstructions(false)} 
      />
    </div>
  )
}

export default Rescisao
