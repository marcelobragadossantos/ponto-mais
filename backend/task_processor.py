import logging
from bot_service import PontoMaisBot
from config_service import ConfigService
from file_service import FileService
from db_service import DBService

logger = logging.getLogger(__name__)

class TaskProcessor:
    """Processa diferentes tipos de tarefas"""
    
    def __init__(self, config_service, file_service, queue_manager, log_callback=None):
        self.config_service = config_service
        self.file_service = file_service
        self.queue_manager = queue_manager
        self.log_callback = log_callback
    
    def log(self, level, message):
        """Helper para adicionar logs"""
        if self.log_callback:
            self.log_callback(level, message)
        logger.info(message)
        
    def process_task(self, task):
        """
        Processa uma tarefa baseado no tipo
        
        Args:
            task: Dicionário com informações da tarefa
            
        Returns:
            Resultado do processamento
        """
        task_type = task['type']
        task_id = task['id']
        
        logger.info(f"Processando tarefa {task_id} do tipo {task_type}")
        
        if task_type == 'report':
            return self._process_report(task)
        elif task_type == 'rescisao':
            return self._process_rescisao(task)
        elif task_type == 'db_query':
            return self._process_db_query(task)
        elif task_type == 'queue_batch':
            return self._process_queue_batch(task)
        else:
            raise ValueError(f"Tipo de tarefa desconhecido: {task_type}")
    
    def _process_report(self, task):
        """Processa download de relatório"""
        task_id = task['id']
        data = task['data']
        
        report_name = data['report_name']
        date_ranges = data.get('date_ranges')
        
        logger.info(f"Baixando relatório: {report_name}")
        
        # Atualiza progresso
        self.queue_manager.update_task_progress(task_id, 10, "Iniciando bot...")
        
        # Carrega configuração
        config = self.config_service.load_config()
        username = config['pontomais']['auth']['username']
        password = config['pontomais']['auth']['password']
        destine = config['pontomais']['destine']
        
        # Carrega colunas
        columns_config = self.config_service.load_columns()
        columns = columns_config.get(report_name, [])
        
        # Carrega configuração do Google Drive
        google_drive_config = self.config_service.get_google_drive_config()
        
        # Inicializa bot
        bot = PontoMaisBot(config, columns_config, google_drive_config=google_drive_config)
        
        try:
            self.queue_manager.update_task_progress(task_id, 20, "Fazendo login...")
            bot.login()
            
            self.queue_manager.update_task_progress(task_id, 40, "Navegando para relatórios...")
            bot.navigate_to_reports()
            
            self.queue_manager.update_task_progress(task_id, 60, f"Baixando {report_name}...")
            
            # Baixa relatório
            if date_ranges:
                for idx, date_range in enumerate(date_ranges):
                    progress = 60 + (30 * (idx + 1) / len(date_ranges))
                    self.queue_manager.update_task_progress(
                        task_id, 
                        int(progress), 
                        f"Baixando período {idx+1}/{len(date_ranges)}..."
                    )
                    # date_range é um dict com start_date e end_date
                    bot.download_report(
                        report_name, 
                        date_range.get('start_date'), 
                        date_range.get('end_date')
                    )
            else:
                bot.download_report(report_name)
            
            self.queue_manager.update_task_progress(task_id, 100, "Concluído!")
            
            return {
                'success': True,
                'report_name': report_name,
                'periods': len(date_ranges) if date_ranges else 1
            }
            
        finally:
            bot.close()
    
    def _process_rescisao(self, task):
        """Processa rescisões"""
        task_id = task['id']
        
        self.log('info', "Iniciando processamento de rescisões")
        
        self.queue_manager.update_task_progress(task_id, 10, "Carregando arquivo...")
        self.log('info', "Carregando arquivo Nomes.xlsx...")
        
        # Carrega arquivo Nomes.xlsx
        df_nomes = self.file_service.load_nomes_file()
        
        if df_nomes is None or df_nomes.empty:
            error_msg = "Arquivo Nomes.xlsx não encontrado ou vazio"
            self.log('error', error_msg)
            raise Exception(error_msg)
        
        total_colaboradores = len(df_nomes)
        self.log('success', f"Arquivo carregado: {total_colaboradores} colaborador(es) encontrado(s)")
        
        # Carrega configuração
        config = self.config_service.load_config()
        username = config['pontomais']['auth']['username']
        password = config['pontomais']['auth']['password']
        rescisao_pasta = config.get('rescisao_pasta', '')
        
        self.log('info', f"Pasta de rescisão: {rescisao_pasta}")
        
        # Carrega configuração de colunas (não usado em rescisão, mas necessário para o bot)
        colunas_config = config.get('colunas', {})
        
        # Carrega configuração do Google Drive
        google_drive_config = self.config_service.get_google_drive_config()
        
        # Inicializa bot
        self.log('info', "Inicializando bot...")
        bot = PontoMaisBot(config, colunas_config, log_callback=self.log, google_drive_config=google_drive_config)
        
        try:
            self.queue_manager.update_task_progress(task_id, 20, "Fazendo login...")
            self.log('info', "Fazendo login no PontoMais...")
            bot.login()
            self.log('success', "Login realizado com sucesso")
            
            # Processa cada colaborador
            for idx, row in df_nomes.iterrows():
                nome = str(row['Nome']).strip()
                admissao = str(row['Admissão']).strip()
                demissao = str(row['Demissão']).strip()
                
                progress = 20 + (70 * (idx + 1) / total_colaboradores)
                msg = f"Processando {nome} ({idx+1}/{total_colaboradores})..."
                
                self.queue_manager.update_task_progress(
                    task_id,
                    int(progress),
                    msg
                )
                self.log('info', msg)
                self.log('info', f"   📅 Admissão: {admissao} | Demissão: {demissao}")
                
                try:
                    result = bot.process_rescisao_employee(row)
                    if result is False:
                        self.log('warning', f"⚠️ {nome} pulado (dados inválidos)")
                    else:
                        self.log('success', f"✅ {nome} processado com sucesso")
                except Exception as e:
                    self.log('error', f"❌ Erro ao processar {nome}: {str(e)}")
                    import traceback
                    self.log('error', f"   Detalhes: {traceback.format_exc()}")
                    # Continua processando os próximos
            
            self.queue_manager.update_task_progress(task_id, 100, "Todas as rescisões processadas!")
            self.log('success', f"🎉 Processo concluído! {total_colaboradores} colaborador(es) processado(s)")
            
            return {
                'success': True,
                'total_colaboradores': total_colaboradores
            }
            
        except Exception as e:
            self.log('error', f"Erro crítico no processamento: {str(e)}")
            raise
        finally:
            bot.close()
            self.log('info', "Bot encerrado")
    
    def _process_db_query(self, task):
        """Processa consulta ao banco de dados"""
        task_id = task['id']
        data = task['data']
        
        query_type = data.get('query_type', 'trainees')
        
        # Define nome amigável para exibição
        query_names = {
            'trainees': 'Colaboradores Trainee'
        }
        display_name = query_names.get(query_type, query_type)
        
        self.log('info', f"Iniciando consulta: {display_name}")
        self.queue_manager.update_task_progress(task_id, 10, "Conectando ao banco...")
        
        db_service = DBService()
        
        try:
            # Carrega configuração para obter pasta de destino
            config = self.config_service.load_config()
            destino_base = config['pontomais']['destine']
            
            self.queue_manager.update_task_progress(task_id, 30, "Executando consulta...")
            
            if query_type == 'trainees':
                self.log('info', f"Consultando {display_name}...")
                arquivo_saida = db_service.exportar_trainees(destino_base)
                self.log('success', f"✓ {display_name} exportado: {arquivo_saida}")
            else:
                raise ValueError(f"Tipo de consulta desconhecido: {query_type}")
            
            self.queue_manager.update_task_progress(task_id, 100, "Concluído!")
            
            return {
                'success': True,
                'query_type': display_name,
                'output_file': arquivo_saida
            }
        except Exception as e:
            self.log('error', f"Erro na consulta ao banco: {str(e)}")
            raise
        finally:
            db_service.close()
    
    def _process_queue_batch(self, task):
        """Processa lote de itens da fila antiga"""
        task_id = task['id']
        data = task['data']
        
        items = data.get('items', [])
        total = len(items)
        
        logger.info(f"Processando lote de {total} itens")
        
        results = []
        
        for idx, item in enumerate(items):
            progress = (idx + 1) / total * 100
            self.queue_manager.update_task_progress(
                task_id,
                int(progress),
                f"Processando item {idx+1}/{total}..."
            )
            
            # Cria subtarefa para cada item
            subtask_id = self.queue_manager.add_task(
                'report',
                {
                    'report_name': item['reportName'],
                    'date_ranges': item.get('dateRanges')
                }
            )
            
            results.append(subtask_id)
        
        return {
            'success': True,
            'subtasks': results
        }
