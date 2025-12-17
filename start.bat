@echo off
echo ========================================
echo PontoMais Bot - Iniciando Aplicacao
echo ========================================
echo.

REM Verifica se Python esta instalado
python --version >nul 2>&1
if errorlevel 1 (
    echo ERRO: Python nao encontrado!
    echo Por favor, instale o Python 3.8 ou superior
    pause
    exit /b 1
)

REM Verifica se Node.js esta instalado
node --version >nul 2>&1
if errorlevel 1 (
    echo ERRO: Node.js nao encontrado!
    echo Por favor, instale o Node.js 16 ou superior
    pause
    exit /b 1
)

echo [1/4] Verificando dependencias do backend...
cd backend
if not exist "venv" (
    echo Criando ambiente virtual Python...
    python -m venv venv
)

echo Ativando ambiente virtual...
call venv\Scripts\activate.bat

echo Instalando dependencias Python...
pip install -r requirements.txt --quiet

echo.
echo [2/4] Iniciando backend...
start "PontoMais Backend" cmd /k "cd /d %CD% && venv\Scripts\activate.bat && python main.py"

cd ..

echo.
echo [3/4] Verificando dependencias do frontend...
cd frontend
if not exist "node_modules" (
    echo Instalando dependencias Node.js...
    call npm install
)

echo.
echo [4/4] Iniciando frontend...
start "PontoMais Frontend" cmd /k "cd /d %CD% && npm run dev"

cd ..

echo.
echo ========================================
echo Aplicacao iniciada com sucesso!
echo ========================================
echo.
echo Backend: http://localhost:9000
echo Frontend: http://localhost:3002
echo.
echo Pressione qualquer tecla para abrir o navegador...
pause >nul

start http://localhost:3002

echo.
echo Para encerrar, feche as janelas do backend e frontend
echo.
