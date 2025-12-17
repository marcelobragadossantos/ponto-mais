import React from 'react'
import { FiX, FiInfo } from 'react-icons/fi'

const InstructionsModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block w-full max-w-2xl my-8 overflow-hidden text-left align-middle transition-all transform bg-white rounded-lg shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-blue-50">
            <div className="flex items-center">
              <FiInfo className="mr-2 text-blue-600" size={24} />
              <h3 className="text-lg font-semibold text-blue-900">
                Instruções - Processo de Rescisão
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <FiX size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-6 space-y-6">
            {/* Passo 1 */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-900 mb-2">
                📋 Passo 1: Preparar Arquivo
              </h4>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• Crie um arquivo Excel chamado <strong>"Nomes.xlsx"</strong></li>
                <li>• O arquivo deve conter as colunas: <strong>Nome</strong>, <strong>Admissão</strong>, <strong>Demissão</strong></li>
                <li>• Formato das datas: DD/MM/AAAA (ex: 15/03/2023)</li>
              </ul>
            </div>

            {/* Passo 2 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">
                📤 Passo 2: Upload do Arquivo
              </h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Clique em "Escolher Arquivo" e selecione o Nomes.xlsx</li>
                <li>• Clique em "Enviar Arquivo"</li>
                <li>• O sistema validará automaticamente o formato</li>
              </ul>
            </div>

            {/* Passo 3 */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-2">
                🚀 Passo 3: Iniciar Processamento
              </h4>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• Clique em "Iniciar Processo"</li>
                <li>• O processo será adicionado à fila de trabalho</li>
                <li>• Acompanhe o progresso em tempo real</li>
                <li>• Cada colaborador terá seus relatórios mensais processados</li>
              </ul>
            </div>

            {/* Exemplo de Arquivo */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">
                📄 Exemplo de Arquivo Nomes.xlsx
              </h4>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-gray-700">Nome</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-700">Admissão</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-700">Demissão</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="px-3 py-2 text-gray-900">João Victor Silva</td>
                      <td className="px-3 py-2 text-gray-600">15/01/2023</td>
                      <td className="px-3 py-2 text-gray-600">30/06/2023</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-2 text-gray-900">Maria Santos</td>
                      <td className="px-3 py-2 text-gray-600">10/03/2022</td>
                      <td className="px-3 py-2 text-gray-600">15/12/2023</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Observações */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-semibold text-red-900 mb-2">
                ⚠️ Observações Importantes
              </h4>
              <ul className="text-sm text-red-800 space-y-1">
                <li>• O processo pode demorar vários minutos dependendo da quantidade</li>
                <li>• Não feche o navegador durante o processamento</li>
                <li>• Cada colaborador terá relatórios gerados para todos os meses entre admissão e demissão</li>
                <li>• Erros específicos serão mostrados nos logs do sistema</li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end px-6 py-4 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Entendi
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InstructionsModal
