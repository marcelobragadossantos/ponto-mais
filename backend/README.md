# Backend - PontoMais Bot Web

API REST construída com FastAPI para automação do PontoMais.

## 🚀 Tecnologias

- FastAPI
- Uvicorn
- Selenium WebDriver
- Pandas
- OpenPyXL
- Pydantic

## 📦 Instalação

```bash
pip install -r requirements.txt
```

## ▶️ Executar

```bash
python main.py
```

API disponível em: http://localhost:8000

## 📚 Documentação da API

Acesse a documentação interativa (Swagger):
```
http://localhost:8000/docs
```

Ou a documentação alternativa (ReDoc):
```
http://localhost:8000/redoc
```

## 📁 Estrutura

```
backend/
├── main.py              # API principal
├── bot_service.py       # Serviço Selenium
├── config_service.py    # Gerenciamento de config
├── file_service.py      # Gerenciamento de arquivos
├── requirements.txt     # Dependências
├── Config/              # Arquivos de configuração
│   ├── config.json
│   └── estrutura_colunas.json
└── uploads/             # Arquivos enviados
```

## 🔌 Endpoints Principais

### Configurações
- `GET /api/config` - Obter configuração
- `POST /api/config/login` - Atualizar credenciais
- `POST /api/config/destination` - Atualizar pasta destino

### Colunas
- `GET /api/columns` - Obter todas as colunas
- `GET /api/columns/{report_name}` - Obter colunas de um relatório
- `POST /api/columns` - Atualizar colunas

### Relatórios
- `GET /api/reports/list` - Listar relatórios
- `POST /api/reports/download` - Baixar relatório
- `GET /api/reports/status/{task_id}` - Status do download

### Rescisão
- `POST /api/rescisao/upload` - Upload Nomes.xlsx
- `POST /api/rescisao/process` - Processar rescisões

## 🤖 Selenium

### Configuração
- Chrome em modo headless
- ChromeDriver gerenciado automaticamente
- Download em `C:\temp_rels`

### Funcionalidades
- Login automático
- Navegação por páginas
- Seleção de colunas
- Download de relatórios
- Processamento de rescisões

## 📝 Configuração

### config.json
```json
{
  "pontomais": {
    "auth": {
      "username": "usuario@empresa.com",
      "password": "senha"
    },
    "reports_url": "https://app2.pontomais.com.br/relatorios/baixar",
    "destine": "C:\\Relatorios\\PontoMais"
  },
  "rescisao_pasta": "C:\\Relatorios\\Rescisao"
}
```

### estrutura_colunas.json
```json
{
  "Absenteísmo": ["Nome", "Equipe", "Previsto"],
  "Auditoria": ["Nome", "Data", "Ocorrência"],
  ...
}
```

## 🔒 Segurança

- CORS configurado para aceitar requisições do frontend
- Senha não exposta na API GET
- Validação de dados com Pydantic
- Sanitização de caminhos de arquivo

## 🐛 Debug

### Logs
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

### Selenium
Para ver o navegador (remover headless):
```python
# Em bot_service.py
# Comentar linha:
# chrome_options.add_argument("--headless")
```

## 🧪 Testes

```bash
# Instalar pytest
pip install pytest

# Executar testes
pytest
```

## 📊 Performance

- Processamento assíncrono com BackgroundTasks
- Múltiplos downloads simultâneos suportados
- Timeout configurável

## 🔧 Manutenção

### Atualizar ChromeDriver
```bash
pip install --upgrade webdriver-manager
```

### Limpar cache
```bash
# Windows
del /s /q C:\temp_rels\*
```

## 📚 Documentação

Consulte a documentação completa em:
- `../README.md` - Documentação principal
- `../API_DOCUMENTATION.md` - Documentação detalhada da API
