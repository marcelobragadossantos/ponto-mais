# Guia de Configuração - Google Drive Integration

Este guia explica como configurar a integração com Google Drive usando Service Account.

## 📋 Pré-requisitos

- Conta Google (Gmail)
- Acesso ao Google Cloud Console
- Permissões para criar projetos no Google Cloud

## 🚀 Passo a Passo

### 1. Criar Projeto no Google Cloud Console

1. Acesse: https://console.cloud.google.com/
2. Clique em "Select a project" no topo
3. Clique em "NEW PROJECT"
4. Preencha:
   - **Project name**: "Pontomais Bot" (ou qualquer nome)
   - **Location**: Deixe como está
5. Clique em "CREATE"
6. Aguarde a criação do projeto

### 2. Ativar Google Drive API

1. No menu lateral, vá em: **APIs & Services** → **Library**
2. Na busca, digite: "Google Drive API"
3. Clique no resultado "Google Drive API"
4. Clique no botão **"ENABLE"**
5. Aguarde a ativação (alguns segundos)

### 3. Criar Service Account

1. No menu lateral, vá em: **APIs & Services** → **Credentials**
2. Clique em **"+ CREATE CREDENTIALS"** no topo
3. Selecione **"Service Account"**
4. Preencha:
   - **Service account name**: "Pontomais Bot"
   - **Service account ID**: (gerado automaticamente)
   - **Description**: "Service account para upload de relatórios"
5. Clique em **"CREATE AND CONTINUE"**
6. Pule as permissões opcionais (clique em **"CONTINUE"**)
7. Pule o acesso de usuários (clique em **"DONE"**)

### 4. Gerar Chave JSON

1. Na lista de Service Accounts, clique na que você acabou de criar
2. Vá na aba **"KEYS"**
3. Clique em **"ADD KEY"** → **"Create new key"**
4. Selecione tipo **"JSON"**
5. Clique em **"CREATE"**
6. Um arquivo JSON será baixado automaticamente
7. **IMPORTANTE**: Guarde este arquivo com segurança!

### 5. Configurar no Projeto

1. Renomeie o arquivo baixado para: `google_service_account.json`
2. Mova o arquivo para: `backend/Config/google_service_account.json`
3. **NUNCA** commite este arquivo no Git (já está no .gitignore)

### 6. Configurar Google Drive

1. Abra o arquivo JSON que você baixou
2. Procure pela linha: `"client_email": "..."`
3. Copie o email completo (algo como: `pontomais-bot@seu-projeto.iam.gserviceaccount.com`)
4. Abra seu Google Drive: https://drive.google.com
5. Crie uma pasta para os relatórios (ex: "Relatórios Pontomais")
6. Clique com botão direito na pasta → **"Compartilhar"**
7. Cole o email da service account
8. Dê permissão de **"Editor"**
9. **DESMARQUE** a opção "Notificar pessoas"
10. Clique em **"Compartilhar"**

### 7. Obter ID da Pasta

1. Abra a pasta no Google Drive
2. Olhe a URL no navegador:
   ```
   https://drive.google.com/drive/folders/1ABC123xyz...
   ```
3. Copie a parte após `/folders/` (ex: `1ABC123xyz...`)
4. Este é o **ID da pasta**

### 8. Configurar no Sistema

1. Abra o arquivo `backend/.env`
2. Localize a seção **Google Drive Integration**
3. Preencha o **ID da pasta** em `GOOGLE_DRIVE_FOLDER_ID=`
4. Salve o arquivo
5. Reinicie o backend se estiver rodando

Exemplo:
```env
# Google Drive Integration (Automático se configurado)
GOOGLE_DRIVE_FOLDER_ID=1ABC123xyz...
GOOGLE_SERVICE_ACCOUNT_PATH=Config/google_service_account.json
```

### 9. Testar Configuração

**Opção 1: Script de Teste (Recomendado)**

Execute o script de teste para verificar se tudo está configurado corretamente:

```bash
cd backend
python test_google_drive.py
```

O script irá:
- ✅ Verificar variáveis de ambiente
- ✅ Verificar arquivo de credenciais
- ✅ Testar autenticação
- ✅ Verificar acesso à pasta
- ✅ Testar criação de pastas
- ✅ Listar arquivos existentes

Se todos os testes passarem, você verá: `✅ TODOS OS TESTES PASSARAM!`

**Opção 2: Teste Real**

1. Reinicie o backend (se estiver rodando)
2. Vá em **Relatórios** no sistema web
3. Baixe qualquer relatório
4. Verifique os logs - deve aparecer: `☁️ Arquivo enviado para Google Drive`
5. Abra sua pasta no Google Drive
6. Verifique se o arquivo foi criado

**Nota**: O upload para o Drive é automático. Se as credenciais e o ID da pasta estiverem configurados, todos os arquivos serão enviados automaticamente.

## ✅ Estrutura de Pastas no Drive

O sistema cria automaticamente a seguinte estrutura:

```
📁 Relatórios Pontomais (pasta raiz que você criou)
├── 📁 Absenteísmo
│   └── 📄 Pontomais_-_Absenteísmo_(01.10.2025_-_31.10.2025).csv
├── 📁 Auditoria
│   └── 📄 Pontomais_-_Auditoria_(01.10.2025_-_31.10.2025).csv
├── 📁 Colaboradores
│   └── 📄 Pontomais_-_Colaboradores.csv
├── 📁 Rescisão
│   ├── 📁 João Silva
│   │   ├── 📄 Rescisão_(01.01.2025_-_31.01.2025).pdf
│   │   └── 📄 Rescisão_(01.02.2025_-_28.02.2025).pdf
│   └── 📁 Maria Santos
│       └── 📄 Rescisão_(01.01.2025_-_31.01.2025).pdf
└── ...
```

## 🔒 Segurança

### ✅ Boas Práticas

- ✅ Arquivo de credenciais está no .gitignore
- ✅ Nunca compartilhe o arquivo JSON publicamente
- ✅ Não commite o arquivo no Git
- ✅ Mantenha backup seguro do arquivo
- ✅ Use permissões mínimas necessárias

### ❌ Nunca Faça

- ❌ Commitar google_service_account.json no Git
- ❌ Compartilhar o arquivo JSON em chats/emails
- ❌ Dar permissões além de "Editor" na pasta
- ❌ Usar a mesma service account para outros projetos sensíveis

## 🆘 Solução de Problemas

### Erro: "Arquivo de credenciais não encontrado"

**Solução**: Verifique se o arquivo está em `backend/Config/google_service_account.json`

### Erro: "Permissão negada"

**Solução**: 
1. Verifique se compartilhou a pasta com o email da service account
2. Verifique se deu permissão de "Editor"
3. Aguarde alguns minutos (pode demorar para propagar)

### Erro: "Pasta não encontrada" ou "File not found"

**Solução**:
1. Execute o script de teste: `python backend/test_google_drive.py`
2. Verifique se o ID da pasta está correto no .env
3. Copie novamente da URL do Drive
4. Certifique-se de copiar apenas o ID (sem espaços ou caracteres extras)
5. Verifique se compartilhou a pasta com o email correto da service account
6. Aguarde alguns minutos (pode demorar para propagar)

### Arquivos não aparecem no Drive

**Solução**:
1. Verifique os logs do sistema
2. Procure por mensagens de erro do Google Drive
3. Verifique se a integração está ativada nas configurações
4. Teste a conexão fazendo um download manual

### Erro: "API não ativada"

**Solução**:
1. Volte ao Google Cloud Console
2. Vá em APIs & Services → Library
3. Procure "Google Drive API"
4. Clique em "ENABLE"

## 📊 Quotas e Limites

A Google Drive API tem as seguintes quotas (gratuitas):

- **Requisições por 100 segundos**: 20.000
- **Requisições por dia**: 1 bilhão
- **Tamanho de arquivo**: Sem limite prático para CSVs/PDFs

Para o uso típico deste sistema (alguns uploads por dia), você está muito dentro dos limites.

## 🔄 Desativar Integração

Se quiser desativar temporariamente:

1. Abra o arquivo `backend/.env`
2. Remova ou deixe vazio o `GOOGLE_DRIVE_FOLDER_ID=`
3. Salve o arquivo
4. Reinicie o backend

Os arquivos continuarão sendo salvos localmente normalmente.

**Ou** simplesmente remova/renomeie o arquivo `backend/Config/google_service_account.json`

## 📞 Suporte

Se tiver problemas:

1. Verifique os logs do sistema (ícone no footer)
2. Procure por mensagens de erro relacionadas ao Google Drive
3. Consulte a documentação oficial: https://developers.google.com/drive/api/guides/about-sdk

---

**Última atualização**: 01/12/2024
