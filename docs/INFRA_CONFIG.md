# Configuração de Infraestrutura

## 📋 Visão Geral

Este documento descreve todas as configurações de infraestrutura, variáveis de ambiente, portas e dependências externas.

## 🌐 Portas e Serviços

| Serviço | Porta | Protocolo | Uso |
|---------|-------|-----------|-----|
| **Backend API** | 8000 | HTTP | API REST |
| **Frontend Dev** | 5173 | HTTP | Vite dev server |
| **Frontend Prod** | 4173 | HTTP | Vite preview |

## 🔧 Variáveis de Ambiente

### Frontend

#### Arquivo: `frontend/.env`
```env
# URL da API Backend
VITE_API_URL=http://localhost:8000

# Ambiente
VITE_ENV=development
```

#### Variáveis Disponíveis

| Variável | Tipo | Padrão | Descrição |
|----------|------|--------|-----------|
| `VITE_API_URL` | string | `http://localhost:8000` | URL base da API |
| `VITE_ENV` | string | `development` | Ambiente de execução |

#### Build vs Runtime

| Fase | Variáveis | Uso |
|------|-----------|-----|
| **Build Time** | `VITE_*` | Injetadas no bundle durante build |
| **Runtime** | Nenhuma | Todas são build-time no Vite |

### Backend

#### Arquivo: `backend/Config/config.json`
```json
{
  "pontomais": {
    "auth": {
      "username": "seu_email@example.com",
      "password": "sua_senha"
    },
    "reports_url": "https://app2.pontomais.com.br/relatorios",
    "destine": "C:\\Relatorios"
  },
  "rescisao_pasta": "C:\\Rescisoes"
}
```

#### Configurações Disponíveis

| Configuração | Tipo | Obrigatório | Descrição |
|--------------|------|-------------|-----------|
| `pontomais.auth.username` | string | Sim | Email de login |
| `pontomais.auth.password` | string | Sim | Senha de login |
| `pontomais.reports_url` | string | Sim | URL da página de relatórios |
| `pontomais.destine` | string | Sim | Pasta de destino dos relatórios |
| `rescisao_pasta` | string | Não | Pasta de rescisões |

#### Arquivo: `backend/Config/estrutura_colunas.json`
```json
{
  "Absenteísmo": ["Nome", "Equipe", "Previsto", ...],
  "Auditoria": ["Nome", "Data", "Ocorrência", ...],
  ...
}
```

## 🐳 Docker (Futuro)

### Dockerfile - Backend
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Instalar Chrome e dependências
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    unzip \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list \
    && apt-get update \
    && apt-get install -y google-chrome-stable \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Dockerfile - Frontend
```dockerfile
FROM node:18-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### docker-compose.yml
```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    volumes:
      - ./backend/Config:/app/Config
      - ./backend/uploads:/app/uploads
      - relatorios:/relatorios
      - rescisoes:/rescisoes
    environment:
      - PYTHONUNBUFFERED=1
    restart: unless-stopped

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    environment:
      - VITE_API_URL=http://backend:8000
    restart: unless-stopped

volumes:
  relatorios:
  rescisoes:
```

## 🔌 Serviços Externos

### PontoMais

| Propriedade | Valor |
|-------------|-------|
| **URL Base** | https://app2.pontomais.com.br |
| **Login** | https://app2.pontomais.com.br/login |
| **Relatórios** | https://app2.pontomais.com.br/relatorios |
| **Controle de Ponto** | https://app2.pontomais.com.br/controle-de-ponto/colaboradores/lista |
| **Autenticação** | Form-based (username/password) |
| **Sessão** | Cookie-based |

### Chrome WebDriver

| Propriedade | Valor |
|-------------|-------|
| **Gerenciador** | webdriver-manager |
| **Versão** | Automática (compatível com Chrome instalado) |
| **Download** | Automático na primeira execução |
| **Localização** | Cache do webdriver-manager |

## 📁 Estrutura de Diretórios

### Diretórios de Dados

| Diretório | Propósito | Criação |
|-----------|-----------|---------|
| `backend/Config/` | Configurações | Automática |
| `backend/uploads/` | Uploads temporários | Automática |
| `backend/.venv/` | Ambiente virtual Python | Manual |
| `frontend/node_modules/` | Dependências npm | Automática (npm install) |
| `{destine}/` | Relatórios baixados | Configurável |
| `{rescisao_pasta}/` | PDFs de rescisão | Configurável |

### Diretórios Temporários

| Diretório | Propósito | Limpeza |
|-----------|-----------|---------|
| `C:\temp_rels\` | Downloads temporários do Selenium | Manual |
| `backend/__pycache__/` | Cache Python | Automática |
| `frontend/dist/` | Build de produção | npm run build |

## 🔒 Segurança

### Credenciais

| Item | Armazenamento | Exposição |
|------|---------------|-----------|
| **Senha PontoMais** | `Config/config.json` | Nunca em logs/API |
| **Configurações** | Arquivo local | Não versionado (.gitignore) |

### CORS

```python
# Backend - main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Desenvolvimento local
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Produção:** Restringir `allow_origins` para domínios específicos.

### Arquivos Sensíveis (.gitignore)

```
# Backend
backend/.venv/
backend/venv/
backend/__pycache__/
backend/Config/config.json
backend/uploads/

# Frontend
frontend/node_modules/
frontend/dist/
frontend/.env
frontend/.env.local

# Temporários
C:/temp_rels/
```

## 🚀 Scripts de Inicialização

### Windows - start.bat
```batch
@echo off
echo ========================================
echo  PontoMais Bot - Iniciando Sistema
echo ========================================

REM Iniciar Backend
echo.
echo [1/2] Iniciando Backend...
start "Backend" cmd /k "cd backend && venv\Scripts\activate && python main.py"

REM Aguardar backend iniciar
timeout /t 5 /nobreak > nul

REM Iniciar Frontend
echo.
echo [2/2] Iniciando Frontend...
start "Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo  Sistema iniciado com sucesso!
echo  Backend: http://localhost:8000
echo  Frontend: http://localhost:5173
echo ========================================
```

### Linux/Mac - start.sh
```bash
#!/bin/bash

echo "========================================"
echo " PontoMais Bot - Iniciando Sistema"
echo "========================================"

# Iniciar Backend
echo ""
echo "[1/2] Iniciando Backend..."
cd backend
source venv/bin/activate
python main.py &
BACKEND_PID=$!

# Aguardar backend iniciar
sleep 5

# Iniciar Frontend
echo ""
echo "[2/2] Iniciando Frontend..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo ""
echo "========================================"
echo " Sistema iniciado com sucesso!"
echo " Backend: http://localhost:8000"
echo " Frontend: http://localhost:5173"
echo "========================================"
echo ""
echo "Pressione Ctrl+C para parar"

# Aguardar interrupção
trap "kill $BACKEND_PID $FRONTEND_PID" EXIT
wait
```

## 📊 Monitoramento e Logs

### Logs do Backend

| Tipo | Localização | Formato |
|------|-------------|---------|
| **Console** | stdout | Texto colorido (colorama) |
| **API Logs** | Fila em memória | JSON |
| **Uvicorn** | stdout | Formato padrão |

### Logs do Frontend

| Tipo | Localização | Formato |
|------|-------------|---------|
| **Console** | Browser DevTools | console.log |
| **Toasts** | UI | react-toastify |
| **Erros** | Browser DevTools | console.error |

### Acesso aos Logs

```bash
# Backend - Ver logs em tempo real
cd backend
python main.py

# Frontend - Ver logs do build
cd frontend
npm run dev

# API - Endpoint de logs
curl http://localhost:8000/api/logs
```

## 🔧 Configuração de Desenvolvimento

### VS Code - settings.json
```json
{
  "python.defaultInterpreterPath": "${workspaceFolder}/backend/venv/Scripts/python.exe",
  "python.linting.enabled": true,
  "python.linting.pylintEnabled": false,
  "python.linting.flake8Enabled": true,
  "python.formatting.provider": "black",
  "editor.formatOnSave": true,
  "files.exclude": {
    "**/__pycache__": true,
    "**/.venv": true,
    "**/node_modules": true
  }
}
```

### VS Code - Extensões Recomendadas
- Python
- Pylance
- ES7+ React/Redux/React-Native snippets
- Tailwind CSS IntelliSense
- ESLint
- Prettier

## 🌍 Variáveis de Sistema

### Windows

```batch
# Adicionar Python ao PATH
set PATH=%PATH%;C:\Python311;C:\Python311\Scripts

# Adicionar Node ao PATH
set PATH=%PATH%;C:\Program Files\nodejs
```

### Linux/Mac

```bash
# .bashrc ou .zshrc
export PATH="$PATH:/usr/local/bin"
export PYTHONPATH="${PYTHONPATH}:/path/to/project/backend"
```

## 📦 Dependências do Sistema

### Windows

| Software | Versão Mínima | Instalação |
|----------|---------------|------------|
| Python | 3.8+ | https://python.org |
| Node.js | 16+ | https://nodejs.org |
| Google Chrome | Latest | https://google.com/chrome |
| Git | 2.x | https://git-scm.com |

### Linux (Ubuntu/Debian)

```bash
# Python
sudo apt update
sudo apt install python3 python3-pip python3-venv

# Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install nodejs

# Chrome
wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
sudo dpkg -i google-chrome-stable_current_amd64.deb
sudo apt --fix-broken install
```

### macOS

```bash
# Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Python
brew install python@3.11

# Node.js
brew install node

# Chrome
brew install --cask google-chrome
```

## 🔄 Backup e Restore

### Arquivos para Backup

```
Config/
├── config.json           # Credenciais e caminhos
└── estrutura_colunas.json  # Configuração de colunas
```

### Script de Backup (Windows)

```batch
@echo off
set BACKUP_DIR=backup_%date:~-4,4%%date:~-10,2%%date:~-7,2%
mkdir %BACKUP_DIR%
xcopy /E /I backend\Config %BACKUP_DIR%\Config
echo Backup criado em %BACKUP_DIR%
```

### Script de Restore (Windows)

```batch
@echo off
set /p BACKUP_DIR="Digite o nome da pasta de backup: "
xcopy /E /I /Y %BACKUP_DIR%\Config backend\Config
echo Configurações restauradas
```

## 🚨 Troubleshooting

### Problemas Comuns

| Problema | Causa | Solução |
|----------|-------|---------|
| **Backend não inicia** | Porta 8000 ocupada | Matar processo ou mudar porta |
| **Frontend não conecta** | URL da API incorreta | Verificar VITE_API_URL |
| **Selenium falha** | Chrome não instalado | Instalar Google Chrome |
| **Download não funciona** | Credenciais inválidas | Verificar config.json |
| **Pasta não encontrada** | Caminho inválido | Criar pasta ou corrigir caminho |

### Comandos de Diagnóstico

```bash
# Verificar porta 8000
netstat -ano | findstr :8000

# Verificar Python
python --version

# Verificar Node
node --version

# Verificar Chrome
reg query "HKEY_CURRENT_USER\Software\Google\Chrome\BLBeacon" /v version

# Testar API
curl http://localhost:8000

# Verificar logs
curl http://localhost:8000/api/logs
```

## 📈 Performance

### Otimizações

| Área | Otimização | Impacto |
|------|------------|---------|
| **Frontend** | Code splitting | Reduz bundle inicial |
| **Backend** | Background tasks | Não bloqueia requisições |
| **Selenium** | Headless mode | Reduz uso de memória |
| **Downloads** | Delays apropriados | Evita rate limiting |

### Limites Recomendados

| Recurso | Limite | Motivo |
|---------|--------|--------|
| **Fila** | 50 itens | Performance do frontend |
| **Polling** | 2-3s | Balancear responsividade e carga |
| **Timeout** | 10s | Evitar travamentos |
| **Concurrent downloads** | 1 | Evitar bloqueio do PontoMais |
