import schedule
import time
import threading
import json
from datetime import datetime, timedelta
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

class SchedulerService:
    def __init__(self, queue_manager):
        self.queue_manager = queue_manager
        self.running = False
        self.thread = None
        self.schedules_file = Path("Config/schedules.json")
        
    def load_schedules(self):
        """Carrega agendamentos do arquivo"""
        try:
            if self.schedules_file.exists():
                with open(self.schedules_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            return []
        except Exception as e:
            logger.error(f"Erro ao carregar agendamentos: {e}")
            return []
    
    def should_run_today(self, schedule_config):
        """Verifica se o agendamento deve rodar hoje"""
        today = datetime.now()
        frequency = schedule_config.get('frequency', 'daily')
        
        if frequency == 'daily':
            return True
        elif frequency == 'weekly':
            days = schedule_config.get('days', [])
            # weekday() retorna 0=segunda, mas o frontend usa 0=domingo
            # Converter: domingo(0) -> 6, segunda(1) -> 0, etc
            current_day = (today.weekday() + 1) % 7
            return current_day in days
        elif frequency == 'monthly':
            day_of_month = schedule_config.get('dayOfMonth', 1)
            return today.day == day_of_month
        
        return False
    
    def execute_schedule(self, schedule_config):
        """Executa um agendamento"""
        try:
            if not schedule_config.get('enabled', False):
                return
            
            if not self.should_run_today(schedule_config):
                return
            
            logger.info(f"Executando agendamento: {schedule_config.get('name')}")
            
            # Mapeamento de ID para nome do relatório
            report_map = {
                1: "Absenteísmo",
                2: "Auditoria",
                3: "Banco de horas",
                4: "Jornada (espelho ponto)",
                5: "Faltas",
                6: "Solicitações",
                7: "Afastamentos e férias",
                8: "Assinaturas",
                9: "Colaboradores",
                10: "Turnos",
                11: "Colaboradores Trainee"
            }
            
            # Relatórios de banco de dados
            db_reports = {11}
            
            reports = schedule_config.get('reports', [])
            date_mode = schedule_config.get('dateMode', 'current_month')
            
            # Calcula período de datas
            today = datetime.now()
            if date_mode == 'current_month':
                start_date = today.replace(day=1).strftime('%d/%m/%Y')
                # Último dia do mês
                if today.month == 12:
                    end_date = today.replace(day=31).strftime('%d/%m/%Y')
                else:
                    next_month = today.replace(month=today.month + 1, day=1)
                    end_date = (next_month - timedelta(days=1)).strftime('%d/%m/%Y')
            elif date_mode == 'previous_month':
                if today.month == 1:
                    prev_month = today.replace(year=today.year - 1, month=12, day=1)
                else:
                    prev_month = today.replace(month=today.month - 1, day=1)
                start_date = prev_month.strftime('%d/%m/%Y')
                end_date = (today.replace(day=1) - timedelta(days=1)).strftime('%d/%m/%Y')
            else:
                start_date = today.replace(month=1, day=1).strftime('%d/%m/%Y')
                end_date = today.strftime('%d/%m/%Y')
            
            # Relatórios que não precisam de período
            no_date_reports = {9, 10}  # Colaboradores e Turnos
            
            # Adiciona cada relatório à fila
            for report_id in reports:
                report_name = report_map.get(report_id, str(report_id))
                
                # Verifica se é relatório de banco de dados
                if report_id in db_reports:
                    task_data = {
                        'query_type': 'trainees',
                        'scheduled': True,
                        'schedule_name': schedule_config.get('name')
                    }
                    self.queue_manager.add_task('db_query', task_data)
                    logger.info(f"Consulta BD '{report_name}' adicionada à fila (agendado)")
                else:
                    task_data = {
                        'report_name': report_name,
                        'scheduled': True,
                        'schedule_name': schedule_config.get('name')
                    }
                    
                    # Adiciona date_ranges apenas se o relatório precisar
                    if report_id not in no_date_reports:
                        task_data['date_ranges'] = [{'start_date': start_date, 'end_date': end_date}]
                    
                    self.queue_manager.add_task('report', task_data)
                    logger.info(f"Relatório '{report_name}' adicionado à fila (agendado)")
                
        except Exception as e:
            logger.error(f"Erro ao executar agendamento: {e}")
    
    def setup_schedules(self):
        """Configura todos os agendamentos"""
        schedule.clear()
        schedules = self.load_schedules()
        
        logger.info(f"Configurando {len(schedules)} agendamento(s)")
        
        for idx, schedule_config in enumerate(schedules):
            if schedule_config.get('enabled', False):
                time_str = schedule_config.get('time', '15:00')
                frequency = schedule_config.get('frequency', 'daily')
                
                # Configura o job
                job = schedule.every().day.at(time_str).do(
                    self.execute_schedule, 
                    schedule_config
                )
                
                logger.info(f"✓ Agendamento {idx+1}: '{schedule_config.get('name')}' às {time_str} ({frequency})")
                logger.info(f"  Próxima execução: {job.next_run}")
            else:
                logger.info(f"✗ Agendamento {idx+1}: '{schedule_config.get('name')}' (desativado)")
        
        logger.info(f"Total de jobs ativos: {len(schedule.get_jobs())}")
    
    def run(self):
        """Loop principal do scheduler"""
        self.running = True
        self.setup_schedules()  # Configura agendamentos uma vez no início
        logger.info("Scheduler iniciado")
        
        while self.running:
            try:
                schedule.run_pending()
                time.sleep(60)  # Verifica a cada minuto
            except Exception as e:
                logger.error(f"Erro no scheduler: {e}")
                time.sleep(60)
    
    def start(self):
        """Inicia o scheduler em thread separada"""
        if self.thread is None or not self.thread.is_alive():
            self.thread = threading.Thread(target=self.run, daemon=True)
            self.thread.start()
            logger.info("Thread do scheduler iniciada")
    
    def stop(self):
        """Para o scheduler"""
        self.running = False
        if self.thread:
            self.thread.join(timeout=5)
        logger.info("Scheduler parado")
