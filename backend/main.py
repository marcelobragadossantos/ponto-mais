import os
import sys
import logging
import warnings
from fastapi import FastAPI, HTTPException, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse
from pydantic import BaseModel
from typing import Optional, List, Dict
import json
import uvicorn
from datetime import datetime, timedelta
import asyncio
from pathlib import Path
import queue as queue_module
import threading
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
import time

# Configurações de Avisos
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
logging.getLogger('tensorflow').setLevel(logging.ERROR)
warnings.filterwarnings('ignore', category=UserWarning)
warnings.filterwarnings('ignore', category=DeprecationWarning)
warnings.filterwarnings('ignore', category=FutureWarning)

from bot_service import PontoMaisBot, ReportStatus
from config_service import ConfigService
from file_service import FileService
from bi_service import BIService
from queue_manager import queue_manager
from task_processor import TaskProcessor
from scheduler_service import SchedulerService

app = FastAPI(title="PontoMais Bot API", version="1.0.6")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global state for tracking downloads (legacy - será removido)
download_status = {}

# Global logs - mantém histórico de logs
logs_history = []
MAX_LOGS = 1000  # Máximo de logs mantidos em memória

class LogCapture:
    """Captura prints e adiciona aos logs"""
    def __init__(self, original_stdout):
        self.original_stdout = original_stdout
        
    def write(self, message):
        # Escreve no stdout original
        self.original_stdout.write(message)
        self.original_stdout.flush()
        
        # Adiciona aos logs se não for requisição API
        message = message.strip()
        if message and not message.startswith('INFO:') and 'HTTP' not in message:
            # Detecta nível do log
            level = 'info'
            if '❌' in message or 'Erro' in message or 'ERROR' in message:
                level = 'error'
            elif '✅' in message or 'sucesso' in message.lower():
                level = 'success'
            elif '⚠️' in message or 'Aviso' in message:
                level = 'warning'
            
            add_log(level, message)
    
    def flush(self):
        self.original_stdout.flush()
    
    def isatty(self):
        return self.original_stdout.isatty()

def add_log(level: str, message: str):
    """Adiciona log ao histórico"""
    log_entry = {
        "timestamp": datetime.now().isoformat(),
        "level": level,
        "message": message
    }
    
    logs_history.append(log_entry)
    
    # Limita tamanho do histórico
    if len(logs_history) > MAX_LOGS:
        logs_history.pop(0)

# Redireciona stdout para capturar prints
sys.stdout = LogCapture(sys.stdout)

# Services
config_service = ConfigService()
file_service = FileService()
bi_service = BIService(config_service=config_service)

# Task Processor e Queue Manager
task_processor = TaskProcessor(config_service, file_service, queue_manager, log_callback=add_log)
queue_manager.set_task_processor(task_processor.process_task)
queue_manager.start_worker()

# Scheduler Service
scheduler_service = SchedulerService(queue_manager)
scheduler_service.start()

# Models
class LoginCredentials(BaseModel):
    username: str
    password: str

class DateRange(BaseModel):
    start_date: str
    end_date: str

class ReportRequest(BaseModel):
    report_name: str
    date_ranges: Optional[List[DateRange]] = None

class ColumnConfig(BaseModel):
    report_name: str
    columns: List[str]

class DestinationPath(BaseModel):
    path: str

class RescisaoPath(BaseModel):
    path: str

@app.get("/")
async def root():
    return {"message": "PontoMais Bot API", "version": "1.0.5"}

@app.get("/api/config")
async def get_config():
    """Retorna a configuração atual (sem credenciais)"""
    try:
        config = config_service.load_config()
        # Remove credenciais por segurança
        if "pontomais" in config:
            config["pontomais"].pop("auth", None)
        return config
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/config/login")
async def update_login(credentials: LoginCredentials):
    """Atualiza credenciais de login"""
    try:
        config_service.update_login(credentials.username, credentials.password)
        return {"message": "Credenciais atualizadas com sucesso"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/config/destination")
async def update_destination(destination: DestinationPath):
    """Atualiza pasta de destino"""
    try:
        config_service.update_destination(destination.path)
        return {"message": "Pasta de destino atualizada com sucesso"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/config/rescisao-path")
async def update_rescisao_path(rescisao: RescisaoPath):
    """Atualiza pasta de rescisão"""
    try:
        config_service.update_rescisao_path(rescisao.path)
        return {"message": "Pasta de rescisão atualizada com sucesso"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/columns")
async def get_columns():
    """Retorna configuração de colunas"""
    try:
        return config_service.load_columns()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/columns/{report_name}")
async def get_report_columns(report_name: str):
    """Retorna colunas de um relatório específico"""
    try:
        columns = config_service.load_columns()
        return {"report_name": report_name, "columns": columns.get(report_name, [])}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/columns")
async def update_columns(column_config: ColumnConfig):
    """Atualiza colunas de um relatório"""
    try:
        config_service.update_columns(column_config.report_name, column_config.columns)
        return {"message": "Colunas atualizadas com sucesso"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/reports/download")
async def download_report(request: ReportRequest):
    """Adiciona relatório à fila de processamento"""
    try:
        # Adiciona à fila
        task_id = queue_manager.add_task('report', {
            'report_name': request.report_name,
            'date_ranges': [
                {'start_date': dr.start_date, 'end_date': dr.end_date} 
                for dr in request.date_ranges
            ] if request.date_ranges else None
        })
        
        queue_size = queue_manager.get_queue_size()
        current_task = queue_manager.get_current_task()
        
        # Se não há tarefa sendo processada e fila está vazia, executa imediatamente
        if not current_task and queue_size == 1:
            add_log("info", f"SISTEMA - Processando relatório imediatamente: {request.report_name}")
            message = "Processando relatório..."
        else:
            add_log("info", f"SISTEMA - Relatório adicionado à fila: {request.report_name} (posição {queue_size})")
            message = f"Relatório adicionado à fila. Posição: {queue_size}"
        
        return {
            "task_id": task_id,
            "message": message,
            "queue_position": queue_size,
            "processing_immediately": not current_task and queue_size == 1
        }
    except Exception as e:
        add_log("error", f"SISTEMA - Erro ao adicionar relatório à fila: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/reports/status/{task_id}")
async def get_download_status(task_id: str):
    """Retorna status de uma tarefa (novo sistema de fila)"""
    task = queue_manager.get_task_status(task_id)
    if not task:
        # Fallback para sistema antigo
        if task_id in download_status:
            return download_status[task_id]
        raise HTTPException(status_code=404, detail="Tarefa não encontrada")
    
    return {
        "status": task['status'],
        "progress": task['progress'],
        "message": task['message'],
        "error": task.get('error')
    }

@app.post("/api/rescisao/upload")
async def upload_nomes_file(file: UploadFile = File(...)):
    """Upload do arquivo Nomes.xlsx"""
    try:
        if not file.filename.endswith('.xlsx'):
            raise HTTPException(status_code=400, detail="Arquivo deve ser .xlsx")
        
        content = await file.read()
        file_service.save_nomes_file(content)
        
        return {"message": "Arquivo enviado com sucesso"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class SchedulesSync(BaseModel):
    schedules: List[dict]

@app.post("/api/schedules/sync")
async def sync_schedules(request: SchedulesSync):
    """Sincroniza agendamentos do frontend com o backend"""
    try:
        import json
        from pathlib import Path
        
        schedules = request.schedules
        
        schedules_file = Path("Config/schedules.json")
        schedules_file.parent.mkdir(exist_ok=True)
        
        with open(schedules_file, 'w', encoding='utf-8') as f:
            json.dump(schedules, f, indent=2, ensure_ascii=False)
        
        # Recarrega agendamentos no scheduler
        scheduler_service.setup_schedules()
        
        return {"message": "Agendamentos sincronizados", "count": len(schedules)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/rescisao/collaborators")
async def get_collaborators():
    """Retorna lista de colaboradores do arquivo Nomes.xlsx"""
    try:
        if not file_service.nomes_file_exists():
            return {"collaborators": []}
        
        df = file_service.load_nomes_file()
        collaborators = []
        
        for _, row in df.iterrows():
            from datetime import datetime
            nome = str(row['Nome']).strip()
            admissao = str(row['Admissão']).strip()
            demissao = str(row['Demissão']).strip()
            
            # Calcula número de meses
            try:
                data_adm = datetime.strptime(admissao, "%d/%m/%Y")
                data_dem = datetime.strptime(demissao, "%d/%m/%Y")
                
                meses = 0
                atual = data_adm.replace(day=1)
                fim = data_dem.replace(day=1)
                
                while atual <= fim:
                    meses += 1
                    if atual.month == 12:
                        atual = datetime(atual.year + 1, 1, 1)
                    else:
                        atual = datetime(atual.year, atual.month + 1, 1)
                
                collaborators.append({
                    'nome': nome,
                    'admissao': admissao,
                    'demissao': demissao,
                    'meses': meses
                })
            except:
                pass
        
        return {"collaborators": collaborators}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/rescisao/process")
async def process_rescisao_employee():
    """Adiciona rescisão à fila de processamento"""
    try:
        # Adiciona à fila
        task_id = queue_manager.add_task('rescisao', {})
        
        queue_size = queue_manager.get_queue_size()
        current_task = queue_manager.get_current_task()
        
        # Se não há tarefa sendo processada e fila está vazia, executa imediatamente
        if not current_task and queue_size == 1:
            add_log("info", "Processando rescisão imediatamente")
            message = "Processando rescisão..."
        else:
            add_log("info", f"Rescisão adicionada à fila (posição {queue_size})")
            message = f"Rescisão adicionada à fila. Posição: {queue_size}"
        
        return {
            "task_id": task_id,
            "message": message,
            "queue_position": queue_size,
            "processing_immediately": not current_task and queue_size == 1
        }
    except Exception as e:
        add_log("error", f"Erro ao adicionar rescisão à fila: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/reports/list")
async def list_reports():
    """Lista relatórios disponíveis"""
    add_log("info", "Lista de relatórios solicitada")
    return {
        "reports": [
            {"id": 1, "name": "Absenteísmo", "requires_date": True, "type": "scraping"},
            {"id": 2, "name": "Auditoria", "requires_date": True, "type": "scraping"},
            {"id": 3, "name": "Banco de horas", "requires_date": True, "type": "scraping"},
            {"id": 4, "name": "Jornada (espelho ponto)", "requires_date": True, "type": "scraping"},
            {"id": 5, "name": "Faltas", "requires_date": True, "type": "scraping"},
            {"id": 6, "name": "Solicitações", "requires_date": True, "type": "scraping"},
            {"id": 7, "name": "Afastamentos e férias", "requires_date": True, "type": "scraping"},
            {"id": 8, "name": "Assinaturas", "requires_date": True, "type": "scraping"},
            {"id": 9, "name": "Colaboradores", "requires_date": False, "type": "scraping"},
            {"id": 10, "name": "Turnos", "requires_date": False, "type": "scraping"},
            {"id": 11, "name": "Colaboradores Trainee", "requires_date": False, "type": "database"},
        ]
    }

@app.post("/api/reports/database")
async def download_database_report():
    """Adiciona consulta ao banco à fila de processamento"""
    try:
        task_id = queue_manager.add_task('db_query', {'query_type': 'trainees'})
        
        queue_size = queue_manager.get_queue_size()
        current_task = queue_manager.get_current_task()
        
        if not current_task and queue_size == 1:
            add_log("info", "Processando consulta ao banco imediatamente")
            message = "Processando consulta..."
        else:
            add_log("info", f"Consulta adicionada à fila (posição {queue_size})")
            message = f"Consulta adicionada à fila. Posição: {queue_size}"
        
        return {
            "task_id": task_id,
            "message": message,
            "queue_position": queue_size,
            "processing_immediately": not current_task and queue_size == 1
        }
    except Exception as e:
        add_log("error", f"Erro ao adicionar consulta à fila: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/logs")
async def get_logs():
    """Retorna histórico de logs"""
    return {"logs": logs_history}

# ===== QUEUE MANAGEMENT ENDPOINTS =====

@app.get("/api/queue/status")
async def get_queue_status():
    """Retorna status completo da fila"""
    try:
        current = queue_manager.get_current_task()
        queue_items = queue_manager.get_queue_items()
        
        return {
            "current_task": current,
            "queue_size": len(queue_items),
            "queue_items": queue_items
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/queue/all")
async def get_all_tasks():
    """Retorna todas as tarefas (histórico + fila + atual)"""
    try:
        tasks = queue_manager.get_all_tasks()
        return {"tasks": tasks, "total": len(tasks)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/queue/task/{task_id}")
async def get_task_details(task_id: str):
    """Retorna detalhes de uma tarefa específica"""
    task = queue_manager.get_task_status(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Tarefa não encontrada")
    return task

@app.delete("/api/queue/clear")
async def clear_completed_tasks():
    """Remove tarefas concluídas do histórico"""
    try:
        queue_manager.clear_completed_tasks()
        add_log("info", "Tarefas concluídas removidas")
        return {"message": "Tarefas concluídas removidas"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ===== BASE BI ENDPOINTS =====

class BIMergeRequest(BaseModel):
    selected_files: Optional[List[Dict]] = None

@app.get("/api/bi/files")
async def get_bi_files():
    """Lista arquivos CSV/Excel em todas as subpastas da pasta raiz"""
    try:
        files = bi_service.get_available_files()
        return {"files": files, "total": len(files)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/bi/merge")
async def merge_bi_data(request: BIMergeRequest):
    """Mescla arquivos CSV/Excel selecionados em uma base consolidada"""
    try:
        add_log("info", "Iniciando mesclagem de dados para Base BI")
        
        # Callback para reportar progresso
        def progress_callback(message):
            add_log("info", message)
        
        # Realiza a mesclagem com callback de progresso
        df = bi_service.merge_reports(request.selected_files, progress_callback=progress_callback)
        
        if df.empty:
            add_log("warning", "Nenhum dado foi consolidado")
            return {"success": False, "message": "Nenhum dado encontrado para consolidar"}
        
        add_log("info", "Exportando base consolidada...")
        
        # Exporta para CSV
        output_path = bi_service.export_merged_data(df)
        
        add_log("success", f"✓ Base BI consolidada: {len(df)} registros únicos, {len(df.columns)} colunas")
        add_log("success", f"✓ Arquivo salvo em: {output_path}")
        
        return {
            "success": True,
            "records": len(df),
            "columns": len(df.columns),
            "output_file": os.path.basename(output_path),
            "full_path": output_path,
            "message": f"Base consolidada com sucesso: {len(df)} registros"
        }
    except Exception as e:
        add_log("error", f"✗ Erro ao mesclar dados: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/bi/download/{filename}")
async def download_bi_file(filename: str):
    """Download do arquivo consolidado da Base BI"""
    try:
        # Busca o arquivo na pasta raiz configurada
        config = config_service.load_config()
        root_folder = config.get("pontomais", {}).get("destine", "arquivos_baixados")
        filepath = os.path.join(root_folder, filename)
        
        if not os.path.exists(filepath):
            raise HTTPException(status_code=404, detail="Arquivo não encontrado")
        
        return FileResponse(
            filepath,
            media_type="text/csv",
            filename=filename
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    # 0.0.0.0 permite acesso de outras máquinas na rede local
    uvicorn.run(app, host="0.0.0.0", port=8000)
