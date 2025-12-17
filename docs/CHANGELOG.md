# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

## [2.1.0] - 2024-12-01

### Adicionado
- ✨ **Integração com Google Drive via Service Account**
  - Upload automático de relatórios para Google Drive
  - Criação automática de estrutura de pastas no Drive
  - Suporte a relatórios e rescisões
  - Configuração via arquivo .env (sem interface de usuário)
  - Ativação automática quando credenciais estão configuradas
  - Arquivo de exemplo para credenciais (google_service_account.json.example)
  - Novo serviço `google_drive_service.py` com métodos:
    - `authenticate()`: Autenticação com service account
    - `upload_file()`: Upload de arquivos
    - `create_folder()`: Criação de pastas
    - `get_or_create_folder()`: Busca ou cria pasta
    - `delete_file()`: Remoção de arquivos duplicados
  - Variáveis de ambiente no .env:
    - `GOOGLE_DRIVE_FOLDER_ID`: ID da pasta raiz no Drive
    - `GOOGLE_SERVICE_ACCOUNT_PATH`: Caminho do arquivo de credenciais
  - Upload sempre ativo quando configurado (não é opcional para o usuário)

### Modificado
- 🔄 **Limpeza Automática de Nomes de Arquivos**
  - Remove IDs gerados pelo PontoMais dos nomes de arquivos
  - Padrão removido: `_-_[hash]` antes da extensão
  - Exemplo: `Relatorio_(01.10.2025_-_31.10.2025)_-_b6426913.csv` → `Relatorio_(01.10.2025_-_31.10.2025).csv`
  - Aplicado a todos os relatórios e rescisões
  - Método `_clean_filename()` no bot_service.py
- 🔄 **Fluxo de Upload Otimizado**
  - Upload para Google Drive ocorre ANTES de mover para pasta local
  - Garante backup na nuvem mesmo se houver erro no salvamento local
  - Estrutura de pastas replicada no Drive
  - Rescisões organizadas em: `Rescisão / Nome do Funcionário / arquivos.pdf`
  - Relatórios organizados em: `Nome do Relatório / arquivos.csv`
- 🔄 **Bot Service Atualizado**
  - Novo parâmetro `google_drive_config` no construtor
  - Inicialização automática do GoogleDriveService se configurado
  - Logs informativos sobre status do Google Drive
  - Tratamento de erros não-bloqueante (continua se Drive falhar)
- 🔄 **Task Processor Atualizado**
  - Carrega configuração do Google Drive antes de iniciar bot
  - Passa configuração para bot em relatórios e rescisões
- 🔄 **Config Service Atualizado**
  - Novos métodos:
    - `get_google_drive_config()`: Retorna configuração do Drive
    - `update_google_drive_config()`: Atualiza configuração no .env

- 🔄 **Dependências Atualizadas**
  - Adicionadas bibliotecas Google:
    - `google-auth==2.25.2`
    - `google-auth-oauthlib==1.2.0`
    - `google-auth-httplib2==0.2.0`
    - `google-api-python-client==2.111.0`

### Corrigido
- 🐛 Arquivos duplicados com IDs diferentes do PontoMais
- 🐛 Nomes de arquivos inconsistentes entre downloads
- 🐛 Falta de backup automático em nuvem

### Segurança
- 🔒 Arquivo de credenciais adicionado ao .gitignore
- 🔒 Credenciais nunca commitadas no repositório
- 🔒 Arquivo de exemplo sem dados sensíveis
- 🔒 Permissões limitadas da service account (apenas drive.file)

## [2.0.1] - 2024-11-28

### Adicionado
- ✨ **Linha de Detalhes em Tempo Real na Rescisão**
  - Linha única abaixo da barra de progresso mostrando ação atual do bot
  - Exibe mensagens como "🌐 Navegando para página...", "📅 Preenchendo período...", "👤 Preenchendo nome...", etc.
  - Atualização automática a cada 1.5 segundos
  - Animação de loading enquanto processa
  - Integrado no componente `RescisaoProgress`
- ✨ **Gerenciamento Avançado da Fila de Trabalho**
  - Botões para mover itens para cima/baixo na fila
  - Botão para excluir item individual da fila
  - Numeração visual em cards (item em andamento = 1, próximos = 2, 3, 4...)
  - Itens concluídos exibem ✓ (verde) ou ✗ (vermelho) ao invés de número
  - Cores diferenciadas por status (azul=processando, verde=concluído, vermelho=erro)
  - Reordenação automática ao remover itens

### Modificado
- 🔄 **Bot Service** - Logs detalhados enviados para frontend
  - Adicionado callback de log no construtor do `PontoMaisBot`
  - Método `_log()` para enviar logs em tempo real
  - Todos os prints importantes agora são enviados via callback
  - Logs de navegação, preenchimento de campos, downloads, etc.
- 🔄 **Rescisão - Feedback Visual Melhorado**
  - Progresso por colaborador atualizado em tempo real
  - Cada mês concluído aparece imediatamente no frontend
  - Linha de detalhes mostra exatamente o que o bot está fazendo
  - Atualização mais responsiva (1.5s)
- 🔄 **Task Processor** - Callback de log passado para o bot
  - Bot agora recebe função de log do task processor
  - Logs sincronizados entre backend e frontend

### Corrigido
- 🐛 Progresso de rescisão não atualizava em tempo real no frontend
- 🐛 Usuário não via o que o bot estava fazendo durante o processamento
- 🐛 Falta de feedback visual detalhado nas operações
- 🐛 **Persistência de Estado na Rescisão** - Processo desaparecia ao trocar de aba
  - Estado agora é salvo no localStorage
  - Ao voltar para aba de Rescisão, processo em andamento é restaurado
  - Progresso e status continuam visíveis mesmo após navegação
  - Limpeza automática do localStorage quando processo termina

## [2.0.0] - 2024-11-26

### Adicionado
- ✨ **Nova Aba: Agendamentos** - Sistema completo de múltiplos agendamentos
  - Suporte a frequências: Diário, Semanal, Mensal
  - Ativar/Desativar agendamentos individualmente
  - Editar e excluir agendamentos
  - Sincronização automática com backend
- ✨ **Sistema de Fila Unificada** - Todas as tarefas em uma única fila
  - Processamento sequencial (FIFO)
  - Status em tempo real
  - Filtros por status
  - Limpeza de tarefas concluídas
- ✨ **Progresso Detalhado de Rescisão** - Acompanhamento mês a mês
  - Barra de progresso por colaborador
  - Status visual por mês (✅❌⏳⚪)
  - Contador de erros
  - Resumo geral
- ✨ **Logs em Tempo Real** - Modal de logs acessível pelo footer
  - Atualização automática em background
  - Filtros por tipo (Info, Sucesso, Avisos, Erros)
  - Download e limpeza de logs
  - Sem duplicação de logs
- ✨ **Dashboard Renovado**
  - Resumo da fila de trabalho
  - Lista de agendamentos ativos
  - Ações rápidas reorganizadas
  - Status do sistema no header

### Modificado
- 🔄 **Configurações Reorganizadas** - Colunas integrada em Configurações
  - Duas abas: Configurações Gerais e Colunas dos Relatórios
- 🔄 **Rescisão Melhorada**
  - Instruções em popup (ícone ℹ️)
  - Remoção automática de ID dos arquivos PDF
  - Validação de formato de datas
- 🔄 **Menu de Navegação Atualizado**
  - Dashboard
  - Relatórios (com botão Agendar)
  - Fila de Trabalho
  - Agendamentos (novo)
  - Rescisão
  - Configurações

### Corrigido
- 🐛 Erro de login no processamento de relatórios
- 🐛 Conversão incorreta de datas no arquivo Excel
- 🐛 Duplicação de logs no sistema
- 🐛 Erro 500 no endpoint /api/queue/status
- 🐛 Argumentos incorretos no método download_report
- 🐛 Modal de agendamento não fechava corretamente

### Removido
- ❌ Aba "Base BI" (funcionalidade descontinuada)
- ❌ Aba "Colunas" do menu principal (movida para Configurações)
- ❌ Cards de estatísticas redundantes no Dashboard

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

---

## [1.0.6] - 2024-11-24

### ✨ Adicionado
- **Base BI**: Nova funcionalidade para consolidação de relatórios
  - Novo serviço backend `bi_service.py` para mesclagem de dados
  - Busca recursiva em todas as subpastas da pasta raiz configurada
  - Suporte a múltiplos formatos: CSV, XLSX, XLS
  - Endpoints REST: `/api/bi/files`, `/api/bi/merge`, `/api/bi/download/{filename}`
  - Componente frontend `BaseBI.jsx` com interface intuitiva
  - Exibição da pasta de origem de cada arquivo
  - Mesclagem inteligente usando CPF como chave primária
  - Chave alternativa Nome+Equipe quando CPF não existe
  - Seleção múltipla de arquivos para consolidação
  - Exportação de base única consolidada na pasta raiz
  - Tratamento robusto de diferentes encodings e separadores CSV
  - Leitura de arquivos Excel (xlsx, xls)
  - Pula automaticamente cabeçalhos de relatórios do PontoMais
  - Rastreamento de arquivos fonte com caminho completo
  - Colunas prefixadas com pasta e arquivo para evitar conflitos
  - Interface com estatísticas (registros únicos, colunas, arquivo gerado)
  - Download direto da base consolidada
  - **Filtro de dados inválidos**: Remove linhas "Resumo", "Total" e valores numéricos
  - **Unificação de datas**: Todas as colunas de data consolidadas em coluna única "Data"
  - **Preenchimento inteligente**: Preenche valores em branco usando dados do mesmo CPF/Nome+Equipe

### 📝 Atualizado
- Adicionada rota `/base-bi` no App.jsx
- Adicionado link "Base BI" no menu de navegação (Layout.jsx)
- Atualizada documentação README.md com nova funcionalidade
- Versão do sistema atualizada para 1.0.6

---

## [1.0.5] - 2024-11-24

### 🔧 Corrigido
- **Fila de Trabalho**: Corrigido erro crítico que deixava a tela em branco
  - Reescrito componente Queue.jsx do zero
  - Removidas dependências circulares em useEffect
  - Simplificado agendamento automático
  - Adicionadas validações de segurança
- **ScheduleModal**: Corrigido erro ao abrir modal de agendamento
  - Reescrito componente ScheduleModal.jsx
  - Adicionadas validações para availableReports
  - Valores padrão para prevenir undefined
  - Verificações antes de operações em arrays
- **Rescisão**: Corrigido fluxo de navegação
  - Removida navegação duplicada do main.py
  - Navegação agora ocorre apenas no bot_service.py
  - Adicionados delays apropriados após login
  - Convertidas funções async para síncronas (Selenium é síncrono)
- **Imports**: Adicionados imports faltantes (By, EC, time) no main.py
- **Processamento de Fila**: Restaurada funcionalidade de processar fila
  - Botão "Processar Fila" agora aparece corretamente
  - Status visuais (Pendente/Processando/Concluído/Erro)
  - Desabilita remoção durante processamento

### ✨ Melhorado
- **Agendamento Automático**: Sistema completamente refatorado
  - Seleção de relatórios diretamente no modal de agendamento
  - Datas calculadas automaticamente (Mês Atual/Anterior/Ano)
  - Removido modo "custom" que causava confusão
  - Prevenção de execuções duplicadas
  - Banner informativo quando agendamento está ativo
  - Execução automática no horário configurado
  - Criação automática de fila com relatórios selecionados
- **Logs**: Logs mais detalhados em cada etapa do processo
- **Tratamento de Erros**: Adicionado traceback completo em erros

### 📚 Documentação
- **Padrão 5-Docs**: Criada estrutura de documentação otimizada
  - README.md: Contexto, stack e comandos
  - BUSINESS_RULES.md: Regras de negócio e fluxos
  - DATA_CONTRACTS.md: Schemas, DTOs e interfaces
  - ARCHITECTURE_MAP.md: Estrutura e arquitetura
  - INFRA_CONFIG.md: Configuração de infraestrutura
- **Limpeza**: Removidos 20+ arquivos .md redundantes
- **Consolidação**: Toda documentação agora em 5 arquivos principais + CHANGELOG

---

## [1.0.4] - 2024-11-23

### ✨ Adicionado
- **Fila de Trabalho**: Sistema de fila para processamento em lote
  - Adicionar múltiplos relatórios
  - Reordenar itens
  - Processar sequencialmente
  - Persistência em localStorage
- **Agendamento**: Agendamento automático de downloads
  - Configuração de horário e dias da semana
  - Modos de data (Mês Atual/Anterior/Ano)
  - Execução automática
- **Rescisão**: Processamento automatizado de rescisões
  - Upload de arquivo Nomes.xlsx
  - Geração de PDFs mensais por colaborador
  - Organização em pastas por nome

### 🔧 Corrigido
- Divisão automática de períodos longos por mês
- Validação de datas e formatos
- Tratamento de erros em downloads

---

## [1.0.3] - 2024-11-22

### ✨ Adicionado
- **Configuração de Colunas**: Interface para personalizar colunas dos relatórios
- **Logs em Tempo Real**: Visualização de logs do backend no frontend
- **Validações**: Validação de credenciais e pastas antes de downloads

### 🔧 Corrigido
- Seleção de colunas no Selenium
- Conversão de delimitadores em relatórios específicos
- Nomenclatura de arquivos baixados

---

## [1.0.2] - 2024-11-21

### ✨ Adicionado
- **API REST**: Backend completo com FastAPI
  - Endpoints para configuração
  - Endpoints para downloads
  - Background tasks para processamento assíncrono
  - Polling de status
- **Frontend React**: Interface web completa
  - Dashboard
  - Página de relatórios
  - Configurações
  - Design responsivo com TailwindCSS

### 🔧 Melhorado
- Separação de responsabilidades (frontend/backend)
- Arquitetura em camadas
- Gerenciamento de estado
- Feedback visual

---

## [1.0.1] - 2024-11-20

### ✨ Adicionado
- **Bot Service**: Serviço de automação com Selenium
  - Login automático
  - Navegação para relatórios
  - Seleção de colunas
  - Download de arquivos
- **Config Service**: Gerenciamento de configurações
- **File Service**: Manipulação de arquivos

### 🔧 Corrigido
- Timeouts de navegação
- Seleção de elementos dinâmicos
- Download de arquivos

---

## [1.0.0] - 2024-11-19

### 🎉 Lançamento Inicial
- **Automação Básica**: Download manual de relatórios via script Python
- **Selenium**: Automação de navegação no PontoMais
- **Configuração**: Arquivo JSON para credenciais e caminhos
- **Relatórios Suportados**:
  - Absenteísmo
  - Auditoria
  - Banco de horas
  - Jornada (espelho ponto)
  - Faltas
  - Solicitações
  - Afastamentos e férias
  - Assinaturas
  - Colaboradores
  - Turnos

---

## Tipos de Mudanças

- **Adicionado**: para novas funcionalidades
- **Alterado**: para mudanças em funcionalidades existentes
- **Descontinuado**: para funcionalidades que serão removidas
- **Removido**: para funcionalidades removidas
- **Corrigido**: para correções de bugs
- **Segurança**: para vulnerabilidades corrigidas
- **Melhorado**: para melhorias de performance ou UX
- **Documentação**: para mudanças na documentação

---

## Links

- [Repositório](https://github.com/seu-usuario/pontomais-bot)
- [Issues](https://github.com/seu-usuario/pontomais-bot/issues)
- [Documentação](./README.md)
