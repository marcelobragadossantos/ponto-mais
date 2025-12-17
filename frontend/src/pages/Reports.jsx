import React, { useState, useEffect } from 'react'
import { FiDownload, FiCalendar, FiAlertCircle, FiClock } from 'react-icons/fi'
import { toast } from 'react-toastify'
import { listReports, downloadReport, getDownloadStatus } from '../services/api'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import DatePicker from '../components/DatePicker'
import ScheduleModal from '../components/ScheduleModal'
import axios from 'axios'
import { API_URL } from '../config'

const Reports = () => {
  const [reports, setReports] = useState([])
  const [selectedReport, setSelectedReport] = useState(null)
  const [dateRanges, setDateRanges] = useState([{ start_date: '', end_date: '' }])
  const [downloading, setDownloading] = useState(false)
  const [progress, setProgress] = useState(null)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [scheduleActive, setScheduleActive] = useState(false)

  useEffect(() => {
    loadReports()
    checkScheduleStatus()
  }, [])

  const checkScheduleStatus = () => {
    const schedule = localStorage.getItem('reportSchedule')
    if (schedule) {
      const scheduleData = JSON.parse(schedule)
      setScheduleActive(scheduleData.enabled || false)
    }
  }

  const loadReports = async () => {
    try {
      const response = await listReports()
      setReports(response.data.reports)
    } catch (error) {
      toast.error('Erro ao carregar relatórios')
    }
  }

  const handleReportSelect = (report) => {
    setSelectedReport(report)
    if (!report.requires_date) {
      setDateRanges([])
    } else {
      // Set default to current month
      const now = new Date()
      const start = format(startOfMonth(now), 'dd/MM/yyyy')
      const end = format(endOfMonth(now), 'dd/MM/yyyy')
      setDateRanges([{ start_date: start, end_date: end }])
    }
  }

  const addDateRange = () => {
    setDateRanges([...dateRanges, { start_date: '', end_date: '' }])
  }

  const removeDateRange = (index) => {
    setDateRanges(dateRanges.filter((_, i) => i !== index))
  }

  const updateDateRange = (index, field, value) => {
    const newRanges = [...dateRanges]
    newRanges[index][field] = value
    setDateRanges(newRanges)
  }

  const handleDownload = async () => {
    if (!selectedReport) {
      toast.error('Selecione um relatório')
      return
    }

    if (selectedReport.requires_date && dateRanges.some(r => !r.start_date || !r.end_date)) {
      toast.error('Preencha todas as datas')
      return
    }

    try {
      setDownloading(true)
      
      let response
      // Verifica se é relatório de banco de dados
      if (selectedReport.type === 'database') {
        response = await axios.post(`${API_URL}/api/reports/database`)
      } else {
        response = await downloadReport(
          selectedReport.name,
          selectedReport.requires_date ? dateRanges : null
        )
      }

      const taskId = response.data.task_id
      
      // Mostra mensagem apropriada baseado na fila
      if (response.data.processing_immediately) {
        toast.success(selectedReport.type === 'database' ? 'Processando consulta...' : 'Processando relatório...')
      } else {
        toast.info(`${selectedReport.type === 'database' ? 'Consulta' : 'Relatório'} adicionado à fila. Posição: ${response.data.queue_position}`, {
          autoClose: 5000
        })
      }

      // Poll for status
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await getDownloadStatus(taskId)
          const status = statusResponse.data

          setProgress(status)

          if (status.status === 'completed' || status.status === 'concluido') {
            clearInterval(pollInterval)
            toast.success('Relatório concluído!')
            setDownloading(false)
            setProgress(null)
          } else if (status.status === 'error' || status.status === 'erro') {
            clearInterval(pollInterval)
            toast.error(`Erro: ${status.message}`)
            setDownloading(false)
            setProgress(null)
          }
        } catch (error) {
          clearInterval(pollInterval)
          setDownloading(false)
          setProgress(null)
        }
      }, 2000)

    } catch (error) {
      toast.error('Erro ao iniciar download')
      setDownloading(false)
    }
  }

  const generateMonthRanges = () => {
    const startMonth = prompt('Mês/Ano inicial (MM/YYYY):')
    const endMonth = prompt('Mês/Ano final (MM/YYYY):')

    if (!startMonth || !endMonth) return

    try {
      const [startM, startY] = startMonth.split('/').map(Number)
      const [endM, endY] = endMonth.split('/').map(Number)

      const ranges = []
      let currentDate = new Date(startY, startM - 1, 1)
      const endDate = new Date(endY, endM - 1, 1)

      while (currentDate <= endDate) {
        const start = format(startOfMonth(currentDate), 'dd/MM/yyyy')
        const end = format(endOfMonth(currentDate), 'dd/MM/yyyy')
        ranges.push({ start_date: start, end_date: end })

        currentDate.setMonth(currentDate.getMonth() + 1)
      }

      setDateRanges(ranges)
      toast.success(`${ranges.length} períodos gerados`)
    } catch (error) {
      toast.error('Formato inválido. Use MM/YYYY')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header com Agendamento */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Relatórios
            </h2>
            <p className="text-gray-600">
              Baixe relatórios do PontoMais ou configure agendamento automático
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Report List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Selecione o Relatório
              </h2>
            </div>
            <div className="p-2">
              {reports.map((report) => (
                <button
                  key={report.id}
                  onClick={() => handleReportSelect(report)}
                  className={`
                    w-full text-left px-4 py-3 rounded-lg mb-2 transition-colors
                    ${selectedReport?.id === report.id
                      ? 'bg-primary-50 text-primary-700 font-medium'
                      : 'hover:bg-gray-50 text-gray-700'
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <span>{report.name}</span>
                    <div className="flex items-center gap-2">
                      {report.type === 'database' && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          BD
                        </span>
                      )}
                      {!report.requires_date && (
                        <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                          Sem data
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Configuration */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {!selectedReport ? (
              <div className="text-center py-12 text-gray-500">
                <FiAlertCircle size={48} className="mx-auto mb-4 text-gray-400" />
                <p>Selecione um relatório para configurar</p>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  {selectedReport.name}
                </h2>

                {selectedReport.requires_date && (
                  <>
                    <div className="mb-4 flex items-center justify-between">
                      <label className="block text-sm font-medium text-gray-700">
                        Períodos de Data
                      </label>
                      <button
                        onClick={generateMonthRanges}
                        className="text-sm text-primary-600 hover:text-primary-700"
                      >
                        Gerar múltiplos meses
                      </button>
                    </div>

                    <div className="space-y-4 mb-6">
                      {dateRanges.map((range, index) => (
                        <div key={index} className="flex items-center gap-4">
                          <div className="flex-1">
                            <DatePicker
                              label="Data Inicial"
                              value={range.start_date}
                              onChange={(value) => updateDateRange(index, 'start_date', value)}
                              placeholder="DD/MM/AAAA"
                            />
                          </div>
                          <div className="flex-1">
                            <DatePicker
                              label="Data Final"
                              value={range.end_date}
                              onChange={(value) => updateDateRange(index, 'end_date', value)}
                              placeholder="DD/MM/AAAA"
                            />
                          </div>
                          {dateRanges.length > 1 && (
                            <button
                              onClick={() => removeDateRange(index)}
                              className="mt-5 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              Remover
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={addDateRange}
                      className="mb-6 text-sm text-primary-600 hover:text-primary-700"
                    >
                      + Adicionar período
                    </button>
                  </>
                )}

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
                  onClick={handleDownload}
                  disabled={downloading}
                  className={`
                    w-full flex items-center justify-center px-6 py-3 rounded-lg font-medium
                    ${downloading
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-primary-600 text-white hover:bg-primary-700'
                    }
                  `}
                >
                  <FiDownload className="mr-2" />
                  {downloading ? 'Baixando...' : 'Baixar Relatório'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Agendamento */}
      <ScheduleModal
        isOpen={showScheduleModal}
        onClose={() => {
          setShowScheduleModal(false)
          checkScheduleStatus()
        }}
      />
    </div>
  )
}

export default Reports
