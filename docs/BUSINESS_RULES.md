# Regras de Negócio

## 📋 Visão Geral

Este documento define as regras de negócio, fluxos e responsabilidades do sistema PontoMais Bot.

## 🎯 Domínios Principais

### 1. Autenticação e Sessão

| Regra | Descrição |
|-------|-----------|
| **BR-001** | Credenciais devem ser configuradas antes de qualquer operação |
| **BR-002** | Login é realizado uma vez por sessão de download |
| **BR-003** | Sessão expira após inatividade (gerenciada pelo PontoMais) |
| **BR-004** | Credenciais são armazenadas localmente em `Config/config.json` |

### 2. Download de Relatórios

| Regra | Descrição |
|-------|-----------|
| **BR-010** | Relatórios com data requerem período (início e fim) |
| **BR-011** | Relatórios sem data são baixados sem período |
| **BR-012** | Períodos longos são divididos automaticamente por mês |
| **BR-013** | Arquivos são salvos em `{pasta_destino}/{nome_relatorio}/` |
| **BR-014** | Formato padrão de download é CSV |
| **BR-015** | Colunas podem ser personalizadas por relatório |

**Relatórios Disponíveis:**
- Absenteísmo (requer data)
- Auditoria (requer data)
- Banco de horas (requer data)
- Jornada/Espelho ponto (requer data)
- Faltas (requer data)
- Solicitações (requer data)
- Afastamentos e férias (requer data)
- Assinaturas (requer data)
- Colaboradores (sem data)
- Turnos (sem data)

### 3. Fila de Trabalho

| Regra | Descrição |
|-------|-----------|
| **BR-020** | Fila é persistida em localStorage |
| **BR-021** | Itens podem ser reordenados antes do processamento |
| **BR-022** | Processamento é sequencial (um por vez) |
| **BR-023** | Itens concluídos são removidos automaticamente |
| **BR-024** | Erros não interrompem a fila (continua próximo item) |
| **BR-025** | Progresso é atualizado a cada 2 segundos via polling |

### 4. Agendamento Automático

| Regra | Descrição |
|-------|-----------|
| **BR-030** | Agendamento verifica execução a cada 1 minuto |
| **BR-031** | Executa apenas nos dias da semana configurados |
| **BR-032** | Executa apenas no horário exato configurado |
| **BR-033** | Não executa se já houver processamento em andamento |
| **BR-034** | Previne execuções duplicadas no mesmo minuto |
| **BR-035** | Datas são calculadas automaticamente baseadas no modo |

**Modos de Data:**
- **Mês Atual**: Primeiro ao último dia do mês corrente
- **Mês Anterior**: Primeiro ao último dia do mês passado
- **Ano Atual**: 01/01 a 31/12 do ano corrente

| Regra | Descrição |
|-------|-----------|
| **BR-036** | Relatórios selecionados são adicionados à fila automaticamente |
| **BR-037** | Relatórios com data são divididos por mês automaticamente |
| **BR-038** | Configuração é salva em localStorage |

### 5. Processamento de Rescisões

| Regra | Descrição |
|-------|-----------|
| **BR-040** | Requer arquivo Nomes.xlsx com colunas: Nome, Admissão, Demissão |
| **BR-041** | Formato de data: DD/MM/AAAA |
| **BR-042** | Gera um PDF por mês entre admissão e demissão |
| **BR-043** | PDFs são organizados por pasta do colaborador |
| **BR-044** | Caminho: `{pasta_rescisao}/{nome_colaborador}/relatorio_MM_AAAA.pdf` |
| **BR-045** | Dados incompletos são ignorados com log de erro |
| **BR-046** | Processo continua mesmo com erros individuais |

**Fluxo de Rescisão:**
```
1. Upload Nomes.xlsx
2. Validação de colunas e dados
3. Para cada colaborador:
   a. Calcular meses entre admissão e demissão
   b. Para cada mês:
      - Navegar para controle de ponto
      - Clicar na aba Rescisão
      - Preencher período do mês
      - Buscar colaborador por nome
      - Selecionar colaborador
      - Baixar PDF
      - Salvar em pasta do colaborador
```

### 6. Base BI - Consolidação de Dados

| Regra | Descrição |
|-------|-----------|
| **BR-050** | Busca arquivos recursivamente em todas as subpastas da pasta raiz |
| **BR-051** | Suporta formatos CSV, XLSX e XLS |
| **BR-052** | CPF é a chave primária para mesclagem de dados |
| **BR-053** | Quando CPF não existe, usa Nome+Equipe como chave alternativa |
| **BR-054** | Suporta múltiplos encodings (UTF-8, Latin-1, ISO-8859-1, CP1252) |
| **BR-055** | Suporta separadores vírgula (,) e ponto-e-vírgula (;) |
| **BR-056** | Pula automaticamente cabeçalhos de relatórios do PontoMais |
| **BR-057** | Colunas são prefixadas com pasta e nome do arquivo fonte |
| **BR-058** | Rastreia arquivos fonte com caminho completo em `_source_files` |
| **BR-059** | Arquivo consolidado é salvo na pasta raiz como `base_bi_consolidada.csv` |
| **BR-060** | Registros sem CPF e sem Nome+Equipe são ignorados |
| **BR-061** | Linhas com Nome = "Resumo" ou "Total" são ignoradas |
| **BR-062** | Linhas com Nome contendo apenas números são ignoradas |
| **BR-063** | Todas as colunas de data são unificadas em coluna "Data" |
| **BR-064** | Formato de data reconhecido: "Dia, DD/MM/AAAA" (ex: "Seg, 01/09/2021") |
| **BR-065** | Valores em branco são preenchidos com dados do mesmo CPF |
| **BR-066** | Se CPF não existe, usa Nome+Equipe para preenchimento |
| **BR-067** | Preenchimento usa primeiro valor não-vazio encontrado no grupo |

**Fluxo de Consolidação:**
```
1. Obter pasta raiz da configuração (pontomais.destine)
2. Buscar recursivamente arquivos CSV/XLSX/XLS em todas as subpastas
3. Listar arquivos com pasta de origem
4. Selecionar arquivos para consolidar (ou todos)
5. Para cada arquivo:
   a. Detectar formato (CSV ou Excel)
   b. Detectar encoding e separador (se CSV)
   c. Pular cabeçalhos de relatório
   d. Normalizar nomes de colunas
   e. Para cada linha:
      - Extrair CPF (se existir)
      - Criar chave: CPF ou Nome+Equipe
      - Mesclar dados na base consolidada
      - Registrar arquivo fonte com caminho
6. Exportar base consolidada na pasta raiz
7. Disponibilizar para download
```

### 7. Configuração de Colunas

| Regra | Descrição |
|-------|-----------|
| **BR-050** | Cada relatório tem conjunto padrão de colunas |
| **BR-051** | Colunas podem ser personalizadas por relatório |
| **BR-052** | Configuração é salva em `Config/estrutura_colunas.json` |
| **BR-053** | Colunas não encontradas são ignoradas silenciosamente |

### 7. Logs e Auditoria

| Regra | Descrição |
|-------|-----------|
| **BR-060** | Todas operações geram logs |
| **BR-061** | Logs incluem timestamp, nível e mensagem |
| **BR-062** | Níveis: info, success, error |
| **BR-063** | Logs são mantidos em memória (fila) |
| **BR-064** | Frontend consulta logs via polling |

## 🔄 Fluxos Principais

### Fluxo 1: Download Manual de Relatório

```
1. Usuário seleciona relatório
2. Se requer data: preenche período
3. Clica em "Baixar"
4. Sistema:
   - Valida dados
   - Cria task_id
   - Inicia background task
   - Retorna task_id
5. Background task:
   - Inicializa bot Selenium
   - Faz login
   - Navega para relatórios
   - Seleciona relatório
   - Define período (se aplicável)
   - Seleciona colunas
   - Baixa CSV
   - Move para pasta destino
   - Fecha navegador
6. Frontend:
   - Polling a cada 2s
   - Atualiza progresso
   - Mostra conclusão/erro
```

### Fluxo 2: Processamento de Fila

```
1. Usuário adiciona itens à fila
2. Clica em "Processar Fila"
3. Sistema:
   - Para cada item na fila:
     a. Atualiza status para "processing"
     b. Chama API de download
     c. Polling de status
     d. Atualiza progresso individual
     e. Marca como "completed" ou "error"
   - Atualiza progresso geral
4. Mostra resumo final
```

### Fluxo 3: Agendamento Automático

```
1. Usuário configura agendamento:
   - Ativa agendamento
   - Define horário
   - Seleciona dias da semana
   - Escolhe modo de data
   - Seleciona relatórios
2. Sistema salva configuração
3. A cada minuto:
   - Verifica se está ativo
   - Verifica dia da semana
   - Verifica horário
   - Verifica se já executou
4. Se todas condições OK:
   - Calcula datas baseado no modo
   - Cria fila com relatórios selecionados
   - Divide por mês se necessário
   - Adiciona à fila existente
   - Processa automaticamente
```

### Fluxo 4: Processamento de Rescisão

```
1. Usuário faz upload de Nomes.xlsx
2. Clica em "Iniciar Processo"
3. Sistema:
   - Valida arquivo
   - Carrega dados
   - Inicializa bot
   - Faz login
   - Para cada colaborador:
     a. Valida dados
     b. Calcula meses
     c. Para cada mês:
        - Navega para controle de ponto
        - Acessa aba Rescisão
        - Preenche dados
        - Baixa PDF
        - Salva em pasta
   - Fecha navegador
4. Mostra conclusão
```

## ⚠️ Regras de Validação

### Validação de Dados

| Campo | Regras |
|-------|--------|
| **Email** | Formato válido de email |
| **Senha** | Não vazio |
| **Data** | Formato DD/MM/AAAA |
| **Período** | Data inicial ≤ Data final |
| **Pasta** | Caminho válido e acessível |
| **Arquivo Excel** | Extensão .xlsx, colunas obrigatórias |

### Validação de Estado

| Condição | Ação |
|----------|------|
| **Sem credenciais** | Bloqueia downloads, mostra aviso |
| **Sem pasta destino** | Bloqueia downloads, mostra aviso |
| **Processamento ativo** | Desabilita novos processamentos |
| **Fila vazia** | Desabilita botão "Processar" |
| **Agendamento sem relatórios** | Não executa |

## 🎯 Responsabilidades por Camada

### Frontend
- Validação de entrada do usuário
- Gerenciamento de estado local (fila, agendamento)
- Polling de status
- Exibição de progresso e notificações
- Persistência em localStorage

### Backend
- Autenticação no PontoMais
- Automação de navegação (Selenium)
- Download e processamento de arquivos
- Gerenciamento de tasks em background
- Logs e auditoria

### Bot Service
- Controle do navegador
- Interação com elementos da página
- Download de arquivos
- Movimentação de arquivos
- Tratamento de erros de navegação

## 📊 Métricas e Limites

| Métrica | Valor |
|---------|-------|
| **Timeout de navegação** | 10 segundos |
| **Intervalo de polling** | 2-3 segundos |
| **Delay entre downloads** | 2 segundos |
| **Delay pós-login** | 3 segundos |
| **Delay pós-navegação** | 2-3 segundos |
| **Verificação de agendamento** | 60 segundos |
| **Timeout de download** | 300 segundos (5 min) |

## 🔐 Segurança

| Regra | Descrição |
|-------|-----------|
| **SEC-001** | Senhas não são expostas em logs |
| **SEC-002** | Senhas não são retornadas pela API |
| **SEC-003** | Configurações são armazenadas localmente |
| **SEC-004** | Sem autenticação externa (sistema local) |
| **SEC-005** | CORS aberto (uso local) |
