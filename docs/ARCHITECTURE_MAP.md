# Mapa de Arquitetura

## 📋 Visão Geral

Sistema fullstack com arquitetura cliente-servidor, utilizando React no frontend e FastAPI no backend com automação Selenium.

## 🏗️ Arquitetura Geral

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                            │
│                      React + Vite                           │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  Pages   │  │Components│  │ Services │  │  Utils   │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
│       │             │              │              │        │
│       └─────────────┴──────────────┴──────────────┘        │
│                         │                                   │
│                    HTTP/REST                                │
└─────────────────────────┼───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                         BACKEND                             │
│                    FastAPI + Uvicorn                        │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │   API    │  │ Services │  │   Bot    │  │  Config  │  │
│  │ Endpoints│  │  Layer   │  │ Selenium │  │  Files   │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
│       │             │              │              │        │
│       └─────────────┴──────────────┴──────────────┘        │
│                         │                                   │
│                    Web Scraping                             │
└─────────────────────────┼───────────────────────────────────┘
                          │
                          ▼
                  ┌───────────────┐
                  │   PontoMais   │
                  │   Web App     │
                  └───────────────┘
```

## 📁 Estrutura de Pastas

### Root
```
/
├── backend/              # Aplicação Python/FastAPI
├── frontend/             # Aplicação React/Vite
├── .vscode/              # Configurações do VS Code
├── start.bat             # Script de inicialização (Windows)
├── README.md             # Documentação principal
├── BUSINESS_RULES.md     # Regras de negócio
├── DATA_CONTRACTS.md     # Contratos de dados
├── ARCHITECTURE_MAP.md   # Este arquivo
├── INFRA_CONFIG.md       # Configuração de infraestrutura
├── CHANGELOG.md          # Histórico de mudanças
└── LICENSE.md            # Licença do projeto
```

### Backend (`/backend`)
```
backend/
├── __pycache__/          # Cache Python (ignorado)
├── .venv/                # Ambiente virtual Python
├── venv/                 # Ambiente virtual alternativo
├── Config/               # Arquivos de configuração
│   ├── config.json       # Credenciais e caminhos
│   └── estrutura_colunas.json  # Colunas dos relatórios
├── uploads/              # Arquivos temporários de upload
│   └── Nomes.xlsx        # Arquivo de rescisões
├── main.py               # Ponto de entrada da API
├── bot_service.py        # Serviço de automação Selenium
├── config_service.py     # Serviço de configuração
├── file_service.py       # Serviço de arquivos
├── bi_service.py         # Serviço de consolidação BI
└── requirements.txt      # Dependências Python
```

**Responsabilidades:**

| Arquivo | Responsabilidade |
|---------|------------------|
| `main.py` | API endpoints, rotas, background tasks |
| `bot_service.py` | Automação Selenium, navegação, downloads |
| `config_service.py` | Leitura/escrita de configurações |
| `file_service.py` | Manipulação de arquivos Excel |
| `bi_service.py` | Consolidação de relatórios CSV |

### Frontend (`/frontend`)
```
frontend/
├── node_modules/         # Dependências npm (ignorado)
├── src/
│   ├── components/       # Componentes reutilizáveis
│   │   ├── DatePicker.jsx
│   │   ├── Layout.jsx
│   │   ├── Navbar.jsx
│   │   └── ScheduleModal.jsx
│   ├── pages/            # Páginas da aplicação
│   │   ├── Dashboard.jsx
│   │   ├── Reports.jsx
│   │   ├── Queue.jsx
│   │   ├── Rescisao.jsx
│   │   ├── BaseBI.jsx
│   │   ├── Settings.jsx
│   │   ├── Columns.jsx
│   │   └── Logs.jsx
│   ├── services/         # Serviços de API
│   │   └── api.js
│   ├── App.jsx           # Componente raiz
│   └── main.jsx          # Ponto de entrada
├── index.html            # HTML base
├── package.json          # Dependências npm
├── vite.config.js        # Configuração Vite
├── tailwind.config.js    # Configuração TailwindCSS
└── postcss.config.js     # Configuração PostCSS
```

**Responsabilidades:**

| Arquivo/Pasta | Responsabilidade |
|---------------|------------------|
| `pages/` | Páginas completas da aplicação |
| `components/` | Componentes reutilizáveis |
| `services/api.js` | Comunicação com backend |
| `App.jsx` | Roteamento e layout principal |

## 🎨 Frontend - Arquitetura de Componentes

### Hierarquia de Componentes

```
App
├── Layout
│   ├── Navbar
│   └── {children}
│       ├── Dashboard
│       ├── Reports
│       │   └── DatePicker
│       ├── Queue
│       │   ├── DatePicker
│       │   └── ScheduleModal
│       ├── Rescisao
│       ├── Settings
│       ├── Columns
│       └── Logs
```

### Gestão de Estado

| Tipo | Tecnologia | Uso |
|------|------------|-----|
| **Local** | useState | Estado de componente |
| **Persistente** | localStorage | Fila, agendamento |
| **Servidor** | Polling | Status de downloads |
| **Global** | React Context | Não utilizado (não necessário) |

### Padrões de Componentes

#### 1. Pages (Páginas)
- Componentes de nível superior
- Gerenciam estado da página
- Fazem chamadas à API
- Compostos por múltiplos componentes

#### 2. Components (Componentes)
- Reutilizáveis
- Recebem props
- Sem lógica de negócio complexa
- Focados em UI

#### 3. Services (Serviços)
- Funções puras
- Comunicação com API
- Sem estado
- Retornam Promises

### Fluxo de Dados

```
User Interaction
      ↓
   Component
      ↓
   API Service
      ↓
   Backend API
      ↓
   Response
      ↓
   Update State
      ↓
   Re-render
```

## 🔙 Backend - Arquitetura em Camadas

### Camadas Lógicas

```
┌─────────────────────────────────────┐
│         API Layer (main.py)         │
│  - Endpoints                        │
│  - Request/Response handling        │
│  - Background tasks                 │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│      Service Layer (services)       │
│  - config_service.py                │
│  - file_service.py                  │
│  - bot_service.py                   │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│      External Layer (Selenium)      │
│  - Web scraping                     │
│  - Browser automation               │
└─────────────────────────────────────┘
```

### Padrões Utilizados

#### 1. Service Pattern
- Lógica de negócio separada dos endpoints
- Serviços reutilizáveis
- Injeção de dependências simples

#### 2. Background Tasks
- Processamento assíncrono
- Não bloqueia requisições
- Status via polling

#### 3. Configuration as Code
- Configurações em JSON
- Validação na leitura
- Defaults automáticos

### Fluxo de Requisição

```
HTTP Request
      ↓
FastAPI Endpoint
      ↓
Validation (Pydantic)
      ↓
Service Layer
      ↓
Bot Service (Selenium)
      ↓
External System
      ↓
Response Processing
      ↓
HTTP Response
```

## 🔄 Padrões de Comunicação

### Frontend → Backend

| Padrão | Uso | Exemplo |
|--------|-----|---------|
| **REST API** | Operações CRUD | POST /api/config/login |
| **Polling** | Status de tasks | GET /api/reports/status/{id} |
| **File Upload** | Upload de arquivos | POST /api/rescisao/upload |

### Backend → PontoMais

| Padrão | Uso | Tecnologia |
|--------|-----|------------|
| **Web Scraping** | Automação de navegação | Selenium WebDriver |
| **Form Submission** | Preenchimento de formulários | Selenium Actions |
| **File Download** | Download de relatórios | Browser download |

## 📦 Módulos e Dependências

### Frontend

```
react (UI)
  ├── react-router-dom (Navegação)
  ├── react-icons (Ícones)
  └── react-toastify (Notificações)

axios (HTTP Client)

date-fns (Datas)

tailwindcss (Styling)
  ├── autoprefixer
  └── postcss

vite (Build Tool)
  └── @vitejs/plugin-react
```

### Backend

```
fastapi (API Framework)
  ├── uvicorn (ASGI Server)
  ├── pydantic (Validação)
  └── python-multipart (Upload)

selenium (Web Automation)
  └── webdriver-manager (Driver)

pandas (Data Processing)
  └── openpyxl (Excel)

colorama (Terminal Colors)
```

## 🎯 Responsabilidades por Módulo

### Frontend

#### Dashboard.jsx
- Exibir visão geral
- Estatísticas básicas
- Links rápidos

#### Reports.jsx
- Seleção de relatório
- Configuração de período
- Iniciar download manual
- Exibir progresso

#### Queue.jsx
- Adicionar itens à fila
- Reordenar fila
- Processar fila
- Configurar agendamento
- Exibir progresso

#### Rescisao.jsx
- Upload de arquivo
- Iniciar processamento
- Exibir progresso
- Instruções

#### BaseBI.jsx
- Listar arquivos CSV disponíveis
- Seleção múltipla de arquivos
- Consolidar dados por CPF ou Nome+Equipe
- Exibir estatísticas da consolidação
- Download da base consolidada

#### Settings.jsx
- Configurar credenciais
- Configurar pastas
- Testar conexão

#### Columns.jsx
- Selecionar relatório
- Configurar colunas
- Salvar configuração

#### Logs.jsx
- Exibir logs em tempo real
- Filtrar por nível
- Limpar logs

### Backend

#### main.py
- Definir rotas da API
- Validar requisições
- Gerenciar background tasks
- Retornar respostas
- Logs centralizados

#### bot_service.py
- Inicializar Selenium
- Fazer login
- Navegar páginas
- Preencher formulários
- Baixar arquivos
- Processar rescisões

#### config_service.py
- Carregar configurações
- Salvar configurações
- Validar caminhos
- Defaults automáticos

#### file_service.py
- Salvar uploads
- Carregar Excel
- Validar estrutura
- Processar dados

#### bi_service.py
- Listar arquivos CSV disponíveis
- Ler CSVs com múltiplos encodings
- Normalizar colunas
- Extrair e validar CPF
- Criar chaves compostas (Nome+Equipe)
- Mesclar dados de múltiplos arquivos
- Rastrear arquivos fonte
- Exportar base consolidada

## 🔐 Segurança e Validação

### Frontend
- Validação de formulários
- Sanitização de inputs
- Feedback de erros
- Confirmações de ações destrutivas

### Backend
- Validação com Pydantic
- Tratamento de exceções
- Logs de erros
- Mascaramento de senhas em logs

## 🚀 Fluxo de Deploy

### Desenvolvimento
```
1. Backend: python main.py
2. Frontend: npm run dev
3. Acesso: http://localhost:5173
```

### Produção
```
1. Backend: uvicorn main:app --host 0.0.0.0 --port 8000
2. Frontend: npm run build → npm run preview
3. Acesso: http://localhost:4173
```

## 📊 Métricas de Código

| Métrica | Frontend | Backend |
|---------|----------|---------|
| **Arquivos principais** | 14 | 4 |
| **Componentes** | 11 | - |
| **Endpoints** | - | 15 |
| **Serviços** | 1 | 3 |
| **Linhas de código** | ~2500 | ~1500 |

## 🔍 Pontos de Extensão

### Adicionar Novo Relatório
1. Backend: Adicionar em `list_reports()`
2. Frontend: Automático (lista dinâmica)
3. Config: Adicionar colunas em `estrutura_colunas.json`

### Adicionar Nova Página
1. Criar arquivo em `frontend/src/pages/`
2. Adicionar rota em `App.jsx`
3. Adicionar link em `Navbar.jsx`

### Adicionar Novo Endpoint
1. Criar modelo Pydantic em `main.py`
2. Criar endpoint com decorador `@app`
3. Implementar lógica ou chamar serviço
4. Adicionar função em `frontend/src/services/api.js`

## 🧪 Testabilidade

### Frontend
- Componentes isolados
- Props bem definidas
- Lógica separada de UI
- Serviços mockáveis

### Backend
- Serviços independentes
- Injeção de dependências
- Funções puras quando possível
- Configuração externa
