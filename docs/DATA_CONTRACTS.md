# Contratos de Dados

## 📋 Visão Geral

Este documento define todos os contratos de dados, schemas, DTOs e interfaces do sistema.

## 🔙 Backend - API Contracts

### Modelos Pydantic

#### LoginCredentials
```python
{
  "username": "string",  # Email do usuário
  "password": "string"   # Senha
}
```

#### DateRange
```python
{
  "start_date": "string",  # Formato: DD/MM/YYYY
  "end_date": "string"     # Formato: DD/MM/YYYY
}
```

#### ReportRequest
```python
{
  "report_name": "string",           # Nome do relatório
  "date_ranges": [DateRange] | null  # Lista de períodos ou null
}
```

#### ColumnConfig
```python
{
  "report_name": "string",  # Nome do relatório
  "columns": ["string"]     # Lista de nomes de colunas
}
```

#### DestinationPath
```python
{
  "path": "string"  # Caminho absoluto da pasta
}
```

#### RescisaoPath
```python
{
  "path": "string"  # Caminho absoluto da pasta
}
```

#### BIMergeRequest
```python
{
  "selected_files": ["string"] | null  # Lista de nomes de arquivos ou null (todos)
}
```

### Endpoints da API

#### GET /
```json
Response 200:
{
  "message": "PontoMais Bot API",
  "version": "1.0.5"
}
```

#### GET /api/config
```json
Response 200:
{
  "pontomais": {
    "auth": {
      "username": "string",
      "password": "***"  // Mascarado por segurança
    },
    "reports_url": "string",
    "destine": "string"
  },
  "rescisao_pasta": "string"
}
```

#### POST /api/config/login
```json
Request:
{
  "username": "string",
  "password": "string"
}

Response 200:
{
  "message": "Credenciais atualizadas com sucesso"
}
```

#### POST /api/config/destination
```json
Request:
{
  "path": "string"
}

Response 200:
{
  "message": "Pasta de destino atualizada com sucesso"
}
```

#### POST /api/config/rescisao-path
```json
Request:
{
  "path": "string"
}

Response 200:
{
  "message": "Pasta de rescisão atualizada com sucesso"
}
```

#### GET /api/columns
```json
Response 200:
{
  "Absenteísmo": ["Nome", "Equipe", "Previsto", ...],
  "Auditoria": ["Nome", "Data", "Ocorrência", ...],
  ...
}
```

#### GET /api/columns/{report_name}
```json
Response 200:
{
  "report_name": "string",
  "columns": ["string"]
}
```

#### POST /api/columns
```json
Request:
{
  "report_name": "string",
  "columns": ["string"]
}

Response 200:
{
  "message": "Colunas atualizadas com sucesso"
}
```

#### POST /api/reports/download
```json
Request:
{
  "report_name": "string",
  "date_ranges": [
    {
      "start_date": "DD/MM/YYYY",
      "end_date": "DD/MM/YYYY"
    }
  ] | null
}

Response 200:
{
  "task_id": "string",
  "message": "Download iniciado"
}
```

#### GET /api/reports/status/{task_id}
```json
Response 200:
{
  "status": "iniciando" | "processando" | "concluido" | "erro",
  "progress": 0-100,
  "message": "string",
  "report_name": "string"
}

Response 404:
{
  "detail": "Task não encontrada"
}
```

#### GET /api/reports/list
```json
Response 200:
{
  "reports": [
    {
      "id": 1,
      "name": "Absenteísmo",
      "requires_date": true
    },
    ...
  ]
}
```

#### POST /api/rescisao/upload
```json
Request: multipart/form-data
{
  "file": File  // Arquivo .xlsx
}

Response 200:
{
  "message": "Arquivo enviado com sucesso"
}

Response 400:
{
  "detail": "Arquivo deve ser .xlsx"
}
```

#### POST /api/rescisao/process
```json
Response 200:
{
  "task_id": "string",
  "message": "Processo iniciado"
}
```

#### GET /api/logs
```json
Response 200:
{
  "logs": [
    {
      "timestamp": "ISO 8601",
      "level": "info" | "success" | "error",
      "message": "string"
    }
  ]
}
```

#### GET /api/bi/files
```json
Response 200:
{
  "files": [
    {
      "filename": "string",
      "path": "string",
      "size": "string"  # Formato: "XX.XX KB"
    }
  ],
  "total": "number"
}
```

#### POST /api/bi/merge
```json
Request:
{
  "selected_files": ["string"] | null
}

Response 200:
{
  "success": true,
  "records": "number",      # Total de registros únicos
  "columns": "number",      # Total de colunas
  "output_file": "string",  # Nome do arquivo gerado
  "message": "string"
}

Response 200 (sem dados):
{
  "success": false,
  "message": "string"
}
```

#### GET /api/bi/download/{filename}
```
Response 200: File (text/csv)
Response 404: Arquivo não encontrado
```

## 🎨 Frontend - TypeScript Interfaces

### Estado da Aplicação

#### Report
```typescript
interface Report {
  id: number
  name: string
  requires_date: boolean
}
```

#### QueueItem
```typescript
interface QueueItem {
  id: number
  order: number
  report: Report
  startDate: string | null  // DD/MM/YYYY
  endDate: string | null    // DD/MM/YYYY
  status: 'pending' | 'processing' | 'completed' | 'error'
  progress?: number  // 0-100
}
```

#### Schedule
```typescript
interface Schedule {
  enabled: boolean
  time: string  // HH:MM
  days: number[]  // 0-6 (Domingo-Sábado)
  dateMode: 'current_month' | 'previous_month' | 'current_year'
  reports: number[]  // IDs dos relatórios
}
```

#### Progress
```typescript
interface Progress {
  current: number
  total: number
  percentage: number
  message: string
  itemProgress: number
}
```

#### DownloadStatus
```typescript
interface DownloadStatus {
  status: 'iniciando' | 'processando' | 'concluido' | 'erro'
  progress: number
  message: string
  report_name: string
}
```

#### Config
```typescript
interface Config {
  pontomais: {
    auth: {
      username: string
      password: string
    }
    reports_url: string
    destine: string
  }
  rescisao_pasta: string
}
```

#### LogEntry
```typescript
interface LogEntry {
  timestamp: string  // ISO 8601
  level: 'info' | 'success' | 'error'
  message: string
}
```

### Respostas da API

#### ApiResponse<T>
```typescript
interface ApiResponse<T> {
  data: T
  status: number
  statusText: string
}
```

#### ErrorResponse
```typescript
interface ErrorResponse {
  detail: string
}
```

## 📁 Arquivos de Configuração

### Config/config.json
```json
{
  "pontomais": {
    "auth": {
      "username": "email@example.com",
      "password": "senha123"
    },
    "reports_url": "https://app2.pontomais.com.br/relatorios",
    "destine": "C:\\Relatorios"
  },
  "rescisao_pasta": "C:\\Rescisoes"
}
```

### Config/estrutura_colunas.json
```json
{
  "Absenteísmo": [
    "Nome",
    "Equipe",
    "Previsto",
    "Ausência",
    "Presença",
    "ABS"
  ],
  "Auditoria": [
    "Nome",
    "Data",
    "Ocorrência",
    "Valor"
  ],
  ...
}
```

### uploads/Nomes.xlsx
```
Estrutura esperada:
| Nome          | Admissão   | Demissão   |
|---------------|------------|------------|
| João Silva    | 01/01/2020 | 31/12/2023 |
| Maria Santos  | 15/03/2021 | 28/02/2024 |
```

## 💾 LocalStorage

### pontomais_queue
```json
[
  {
    "id": 1234567890,
    "order": 1,
    "report": {
      "id": 1,
      "name": "Absenteísmo",
      "requires_date": true
    },
    "startDate": "01/12/2025",
    "endDate": "31/12/2025",
    "status": "pending",
    "progress": 0
  }
]
```

### pontomais_schedule
```json
{
  "enabled": true,
  "time": "15:00",
  "days": [1, 2, 3, 4, 5],
  "dateMode": "current_month",
  "reports": [1, 2, 3, 4, 5]
}
```

## 🔄 Fluxo de Dados

### Download de Relatório

```
Frontend                    Backend                     PontoMais
   │                           │                            │
   ├─ POST /api/reports/download                           │
   │  {report_name, dates}     │                            │
   │                           │                            │
   │  ← task_id                │                            │
   │                           │                            │
   ├─ GET /api/reports/status  │                            │
   │  (polling a cada 2s)      │                            │
   │                           │                            │
   │  ← {status, progress}     │                            │
   │                           │                            │
   │                           ├─ Login ──────────────────→ │
   │                           │                            │
   │                           ├─ Navigate to reports ────→ │
   │                           │                            │
   │                           ├─ Select report ──────────→ │
   │                           │                            │
   │                           ├─ Download CSV ───────────→ │
   │                           │                            │
   │                           │ ← CSV file ────────────────┤
   │                           │                            │
   │  ← {status: "concluido"}  │                            │
   │                           │                            │
```

### Processamento de Rescisão

```
Frontend                    Backend                     PontoMais
   │                           │                            │
   ├─ POST /api/rescisao/upload                            │
   │  (Nomes.xlsx)             │                            │
   │                           │                            │
   │  ← success                │                            │
   │                           │                            │
   ├─ POST /api/rescisao/process                           │
   │                           │                            │
   │  ← task_id                │                            │
   │                           │                            │
   ├─ GET /api/reports/status  │                            │
   │  (polling)                │                            │
   │                           │                            │
   │  ← {status, progress}     │                            │
   │                           │                            │
   │                           ├─ Login ──────────────────→ │
   │                           │                            │
   │                           │ Para cada colaborador:     │
   │                           │   Para cada mês:           │
   │                           ├─ Navigate ───────────────→ │
   │                           ├─ Fill form ──────────────→ │
   │                           ├─ Download PDF ───────────→ │
   │                           │ ← PDF ─────────────────────┤
   │                           │                            │
   │  ← {status: "concluido"}  │                            │
   │                           │                            │
```

## 📊 Estrutura de Arquivos Gerados

### Relatórios
```
{pasta_destino}/
├── Absenteísmo/
│   ├── Pontomais_-_Absenteísmo_(01-12-2025_-_31-12-2025).csv
│   └── Pontomais_-_Absenteísmo_(01-11-2025_-_30-11-2025).csv
├── Auditoria/
│   └── Pontomais_-_Auditoria_(01-12-2025_-_31-12-2025).csv
└── Colaboradores/
    └── Pontomais_-_Colaboradores.csv
```

### Rescisões
```
{pasta_rescisao}/
├── João Silva/
│   ├── relatorio_01_2020.pdf
│   ├── relatorio_02_2020.pdf
│   └── ...
└── Maria Santos/
    ├── relatorio_03_2021.pdf
    └── ...
```

## 🔍 Validações de Dados

### Validações de Entrada

| Campo | Validação | Mensagem de Erro |
|-------|-----------|------------------|
| Email | Formato válido | "Email inválido" |
| Senha | Não vazio | "Senha obrigatória" |
| Data | DD/MM/AAAA | "Formato de data inválido" |
| Período | start ≤ end | "Data inicial deve ser menor que final" |
| Arquivo | .xlsx | "Arquivo deve ser .xlsx" |
| Pasta | Caminho válido | "Caminho inválido" |

### Validações de Estado

| Estado | Validação | Ação |
|--------|-----------|------|
| Sem credenciais | username && password | Bloqueia downloads |
| Sem pasta destino | destine != "" | Bloqueia downloads |
| Processando | processing == true | Desabilita botões |
| Fila vazia | queue.length == 0 | Desabilita "Processar" |
