# PontoMais Bot Web

Sistema automatizado para download de relatórios do PontoMais com interface web e agendamento.

## 🎯 Visão Geral

Aplicação fullstack que automatiza o download de relatórios do sistema PontoMais, incluindo:
- Download manual de relatórios com seleção de período
- Fila de trabalho para processamento em lote
- Agendamento automático de downloads
- Processamento de rescisões com geração de PDFs mensais

## 🛠️ Stack Tecnológica

### Frontend
| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| React | 18.2.0 | UI Framework |
| Vite | 7.2.4 | Build Tool |
| TailwindCSS | 3.3.6 | Styling |
| React Router | 6.20.0 | Navegação |
| Axios | 1.6.2 | HTTP Client |
| React Toastify | 9.1.3 | Notificações |
| date-fns | 2.30.0 | Manipulação de datas |

### Backend
| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| Python | 3.x | Runtime |
| FastAPI | 0.104.1 | API Framework |
| Uvicorn | 0.24.0 | ASGI Server |
| Selenium | 4.15.2 | Web Scraping |
| Pandas | 2.1.3 | Processamento de dados |
| openpyxl | 3.1.2 | Leitura de Excel |

## 📦 Instalação

### Pré-requisitos
- Python 3.8+
- Node.js 16+
- Google Chrome (para Selenium)

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

### Frontend
```bash
cd frontend
npm install
```

## 🚀 Execução

### Desenvolvimento

**Opção 1: Script Automático (Windows)**
```bash
start.bat
```

**Opção 2: Manual**

Terminal 1 - Backend:
```bash
cd backend
venv\Scripts\activate
python main.py
```

Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

### Produção

Backend:
```bash
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000
```

Frontend:
```bash
cd frontend
npm run build
npm run preview
```

## 🌐 Acesso

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## 📋 Configuração Inicial

1. Acesse **Configurações** no menu
2. Configure credenciais do PontoMais
3. Defina pasta de destino para relatórios
4. Defina pasta de rescisão (opcional)
5. Configure colunas dos relatórios (opcional)

## 🔧 Variáveis de Ambiente

### Frontend (.env)
```env
VITE_API_URL=http://localhost:8000
```

### Backend (Config/config.json)
```json
{
  "pontomais": {
    "auth": {
      "username": "seu_email",
      "password": "sua_senha"
    },
    "reports_url": "https://app2.pontomais.com.br/relatorios",
    "destine": "C:\\caminho\\para\\relatorios"
  },
  "rescisao_pasta": "C:\\caminho\\para\\rescisoes"
}
```

## 📚 Funcionalidades

### 1. Dashboard
- Visão geral do sistema
- Estatísticas de uso

### 2. Relatórios
- Download manual de relatórios
- Seleção de período
- Divisão automática por mês

### 3. Fila de Trabalho
- Adicionar múltiplos relatórios
- Reordenar fila
- Processar em lote
- Agendamento automático

### 4. Rescisão
- Upload de arquivo Nomes.xlsx
- Processamento automático
- Geração de PDFs mensais por colaborador

### 5. Base BI
- Consolidação de múltiplos relatórios CSV
- Mesclagem por CPF (chave primária)
- Mesclagem por Nome+Equipe (chave alternativa)
- Exportação de base única consolidada

### 6. Configurações
- Credenciais PontoMais
- Pastas de destino
- Colunas dos relatórios

### 7. Logs
- Visualização de logs em tempo real
- Histórico de operações

## 🧪 Testes

```bash
# Frontend
cd frontend
npm run test

# Backend
cd backend
pytest
```

## 📖 Documentação Adicional

- [BUSINESS_RULES.md](./BUSINESS_RULES.md) - Regras de negócio
- [DATA_CONTRACTS.md](./DATA_CONTRACTS.md) - Contratos de dados
- [ARCHITECTURE_MAP.md](./ARCHITECTURE_MAP.md) - Arquitetura do sistema
- [INFRA_CONFIG.md](./INFRA_CONFIG.md) - Configuração de infraestrutura
- [CHANGELOG.md](./CHANGELOG.md) - Histórico de mudanças

## 🤝 Contribuindo

Veja [CONTRIBUTING.md](./CONTRIBUTING.md) para diretrizes de contribuição.

## 📄 Licença

Este projeto está sob a licença MIT. Veja [LICENSE.md](./LICENSE.md) para detalhes.

## 🆘 Suporte

Para problemas ou dúvidas:
1. Verifique os logs em **Logs** no menu
2. Consulte a documentação técnica
3. Abra uma issue no repositório

## 🔄 Versão

**v1.0.6** - Adicionada funcionalidade Base BI para consolidação de relatórios


---

## 🆕 Novidade - Versão 2.1.0: Integração com Google Drive

O sistema agora suporta upload automático de relatórios para o Google Drive!

### Principais Recursos

- ✅ **Upload Automático**: Todos os relatórios são enviados para o Google Drive
- ✅ **Estrutura de Pastas**: Criação automática de pastas organizadas
- ✅ **Limpeza de Nomes**: Remove IDs gerados pelo PontoMais dos arquivos
- ✅ **Backup Seguro**: Upload ocorre ANTES de salvar localmente
- ✅ **Configuração via .env**: Sem interface de usuário, configuração direta no arquivo
- ✅ **Service Account**: Autenticação automática sem interação humana
- ✅ **Sempre Ativo**: Quando configurado, upload é obrigatório (não opcional)

### Como Configurar

Consulte o guia completo de configuração: **[GOOGLE_DRIVE_SETUP.md](./GOOGLE_DRIVE_SETUP.md)**

Resumo rápido:
1. Crie um projeto no Google Cloud Console
2. Ative a Google Drive API
3. Crie uma Service Account e baixe o JSON
4. Coloque o arquivo em `backend/Config/google_service_account.json`
5. Compartilhe uma pasta do Drive com o email da service account
6. Configure o ID da pasta no arquivo `backend/.env`
7. Reinicie o backend

**Importante**: O upload para o Drive é automático e obrigatório quando configurado. Não há opção para desativar via interface.

### Estrutura no Drive

```
📁 Relatórios Pontomais
├── 📁 Absenteísmo
├── 📁 Auditoria
├── 📁 Colaboradores
├── 📁 Rescisão
│   ├── 📁 João Silva
│   └── 📁 Maria Santos
└── ...
```

---

## 📚 Documentação Completa

- **[GOOGLE_DRIVE_SETUP.md](./GOOGLE_DRIVE_SETUP.md)** - Guia de configuração do Google Drive
- **[CHANGELOG.md](./CHANGELOG.md)** - Histórico de versões
- **[ARCHITECTURE_MAP.md](./ARCHITECTURE_MAP.md)** - Arquitetura do sistema
- **[BUSINESS_RULES.md](./BUSINESS_RULES.md)** - Regras de negócio
- **[DATA_CONTRACTS.md](./DATA_CONTRACTS.md)** - Schemas e interfaces
- **[INFRA_CONFIG.md](./INFRA_CONFIG.md)** - Configuração de infraestrutura
