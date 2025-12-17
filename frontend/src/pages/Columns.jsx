import React, { useState, useEffect } from 'react'
import { FiPlus, FiTrash2, FiEdit2, FiSave } from 'react-icons/fi'
import { toast } from 'react-toastify'
import { getColumns, updateColumns, listReports } from '../services/api'

const Columns = () => {
  const [reports, setReports] = useState([])
  const [selectedReport, setSelectedReport] = useState(null)
  const [columns, setColumns] = useState([])
  const [editingIndex, setEditingIndex] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [newColumn, setNewColumn] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadReports()
  }, [])

  const loadReports = async () => {
    try {
      const response = await listReports()
      setReports(response.data.reports)
    } catch (error) {
      toast.error('Erro ao carregar relatórios')
    }
  }

  const loadColumns = async (reportName) => {
    try {
      const response = await getColumns()
      setColumns(response.data[reportName] || [])
    } catch (error) {
      toast.error('Erro ao carregar colunas')
    }
  }

  const handleReportSelect = (report) => {
    setSelectedReport(report)
    loadColumns(report.name)
    setEditingIndex(null)
    setNewColumn('')
  }

  const handleAddColumn = () => {
    if (!newColumn.trim()) {
      toast.error('Digite o nome da coluna')
      return
    }

    if (columns.includes(newColumn.trim())) {
      toast.error('Esta coluna já existe')
      return
    }

    setColumns([...columns, newColumn.trim()])
    setNewColumn('')
  }

  const handleRemoveColumn = (index) => {
    setColumns(columns.filter((_, i) => i !== index))
  }

  const handleEditColumn = (index) => {
    setEditingIndex(index)
    setEditValue(columns[index])
  }

  const handleSaveEdit = (index) => {
    if (!editValue.trim()) {
      toast.error('Nome da coluna não pode estar vazio')
      return
    }

    const newColumns = [...columns]
    newColumns[index] = editValue.trim()
    setColumns(newColumns)
    setEditingIndex(null)
    setEditValue('')
  }

  const handleCancelEdit = () => {
    setEditingIndex(null)
    setEditValue('')
  }

  const handleSaveColumns = async () => {
    if (!selectedReport) return

    try {
      setLoading(true)
      await updateColumns(selectedReport.name, columns)
      toast.success('Colunas salvas com sucesso!')
    } catch (error) {
      toast.error('Erro ao salvar colunas')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Report List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Relatórios
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
                  {report.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Column Editor */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {!selectedReport ? (
              <div className="text-center py-12 text-gray-500">
                <p>Selecione um relatório para editar as colunas</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {selectedReport.name}
                  </h2>
                  <button
                    onClick={handleSaveColumns}
                    disabled={loading}
                    className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300"
                  >
                    <FiSave className="mr-2" />
                    Salvar
                  </button>
                </div>

                {/* Add Column */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adicionar Nova Coluna
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newColumn}
                      onChange={(e) => setNewColumn(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddColumn()}
                      placeholder="Nome da coluna"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    <button
                      onClick={handleAddColumn}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      <FiPlus size={20} />
                    </button>
                  </div>
                </div>

                {/* Column List */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Colunas Configuradas ({columns.length})
                  </label>
                  {columns.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                      <p>Nenhuma coluna configurada</p>
                      <p className="text-sm mt-1">Adicione colunas acima</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {columns.map((column, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                        >
                          {editingIndex === index ? (
                            <>
                              <input
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit(index)}
                                className="flex-1 px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                autoFocus
                              />
                              <button
                                onClick={() => handleSaveEdit(index)}
                                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                              >
                                Salvar
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                              >
                                Cancelar
                              </button>
                            </>
                          ) : (
                            <>
                              <span className="flex-1 text-gray-900">{column}</span>
                              <button
                                onClick={() => handleEditColumn(index)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                              >
                                <FiEdit2 size={16} />
                              </button>
                              <button
                                onClick={() => handleRemoveColumn(index)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded"
                              >
                                <FiTrash2 size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    💡 <strong>Dica:</strong> Os nomes das colunas devem corresponder exatamente 
                    aos nomes exibidos no sistema PontoMais.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Columns
