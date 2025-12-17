import threading
import queue
import json
import uuid
from datetime import datetime
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

class QueueManager:
    """Gerenciador de fila de tarefas com processamento assíncrono"""
    
    def __init__(self):
        self.task_queue = queue.Queue()
        self.current_task = None
        self.task_history = []
        self.tasks_status = {}  # task_id -> status
        self.worker_thread = None
        self.is_running = False
        self.lock = threading.Lock()
        
        # Callback para processar tarefas
        self.task_processor = None
        
    def set_task_processor(self, processor):
        """Define a função que processará as tarefas"""
        self.task_processor = processor
        
    def add_task(self, task_type, task_data, priority=0):
        """
        Adiciona tarefa à fila
        
        Args:
            task_type: 'report', 'rescisao', 'queue_batch'
            task_data: Dados específicos da tarefa
            priority: Prioridade (0 = normal, 1 = alta)
        
        Returns:
            task_id: ID único da tarefa
        """
        task_id = str(uuid.uuid4())
        
        task = {
            'id': task_id,
            'type': task_type,
            'data': task_data,
            'status': 'pending',
            'progress': 0,
            'message': 'Aguardando processamento',
            'created_at': datetime.now().isoformat(),
            'started_at': None,
            'completed_at': None,
            'error': None,
            'priority': priority,
            'result': None
        }
        
        with self.lock:
            self.tasks_status[task_id] = task
            self.task_queue.put((priority, task))
        
        logger.info(f"Tarefa adicionada à fila: {task_id} ({task_type})")
        
        return task_id
    
    def get_task_status(self, task_id):
        """Retorna status de uma tarefa específica"""
        with self.lock:
            return self.tasks_status.get(task_id)
    
    def get_queue_size(self):
        """Retorna tamanho da fila"""
        return self.task_queue.qsize()
    
    def get_queue_items(self):
        """Retorna lista de itens na fila"""
        with self.lock:
            pending = [t for t in self.tasks_status.values() if t['status'] == 'pending']
            return sorted(pending, key=lambda x: (x['priority'], x['created_at']), reverse=True)
    
    def get_current_task(self):
        """Retorna tarefa atual sendo processada"""
        with self.lock:
            return self.current_task
    
    def get_all_tasks(self):
        """Retorna todas as tarefas (histórico + fila + atual)"""
        with self.lock:
            all_tasks = list(self.tasks_status.values())
            return sorted(all_tasks, key=lambda x: x['created_at'], reverse=True)
    
    def update_task_progress(self, task_id, progress, message=None):
        """Atualiza progresso de uma tarefa"""
        with self.lock:
            if task_id in self.tasks_status:
                self.tasks_status[task_id]['progress'] = progress
                if message:
                    self.tasks_status[task_id]['message'] = message
                logger.info(f"Tarefa {task_id}: {progress}% - {message}")
    
    def start_worker(self):
        """Inicia worker thread para processar fila"""
        if not self.is_running:
            self.is_running = True
            self.worker_thread = threading.Thread(target=self._process_queue, daemon=True)
            self.worker_thread.start()
            logger.info("Worker thread iniciado")
    
    def stop_worker(self):
        """Para worker thread"""
        self.is_running = False
        if self.worker_thread:
            self.worker_thread.join(timeout=5)
        logger.info("Worker thread parado")
    
    def _process_queue(self):
        """Processa fila em background (roda em thread separada)"""
        logger.info("Iniciando processamento da fila")
        
        while self.is_running:
            try:
                # Pega próxima tarefa (timeout para permitir parada)
                priority, task = self.task_queue.get(timeout=1)
                
                with self.lock:
                    self.current_task = task
                    task['status'] = 'processing'
                    task['started_at'] = datetime.now().isoformat()
                
                logger.info(f"Processando tarefa: {task['id']} ({task['type']})")
                
                try:
                    # Executa tarefa
                    if self.task_processor:
                        result = self.task_processor(task)
                        
                        with self.lock:
                            task['status'] = 'completed'
                            task['progress'] = 100
                            task['message'] = 'Concluído com sucesso'
                            task['completed_at'] = datetime.now().isoformat()
                            task['result'] = result
                        
                        logger.info(f"Tarefa concluída: {task['id']}")
                    else:
                        raise Exception("Task processor não configurado")
                        
                except Exception as e:
                    logger.error(f"Erro ao processar tarefa {task['id']}: {str(e)}")
                    
                    with self.lock:
                        task['status'] = 'error'
                        task['message'] = f'Erro: {str(e)}'
                        task['error'] = str(e)
                        task['completed_at'] = datetime.now().isoformat()
                
                finally:
                    with self.lock:
                        self.current_task = None
                        self.task_history.append(task)
                        # Mantém apenas últimas 100 tarefas no histórico
                        if len(self.task_history) > 100:
                            self.task_history.pop(0)
                    
                    self.task_queue.task_done()
                    
            except queue.Empty:
                # Timeout - continua loop
                continue
            except Exception as e:
                logger.error(f"Erro no worker thread: {str(e)}")
                continue
        
        logger.info("Worker thread finalizado")
    
    def clear_completed_tasks(self):
        """Remove tarefas concluídas do histórico"""
        with self.lock:
            self.tasks_status = {
                k: v for k, v in self.tasks_status.items() 
                if v['status'] in ['pending', 'processing']
            }
            self.task_history = []
        logger.info("Tarefas concluídas removidas")

# Instância global
queue_manager = QueueManager()
