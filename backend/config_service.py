import json
import os
from pathlib import Path
from dotenv import load_dotenv

class ConfigService:
    def __init__(self):
        # Carrega variáveis de ambiente
        load_dotenv()
        
        self.config_dir = Path("Config")
        self.config_path = self.config_dir / "config.json"
        self.colunas_path = self.config_dir / "estrutura_colunas.json"
        
        # Ensure config directory exists
        self.config_dir.mkdir(exist_ok=True)
        
        # Initialize default configs if they don't exist
        self._init_default_config()
        self._init_default_columns()
    
    def _init_default_config(self):
        """Inicializa configuração padrão"""
        if not self.config_path.exists():
            default_config = {
                "pontomais": {
                    "reports_url": "https://app2.pontomais.com.br/relatorios",
                    "destine": ""
                },
                "rescisao_pasta": ""
            }
            with open(self.config_path, 'w', encoding='utf-8') as f:
                json.dump(default_config, f, indent=4)
    
    def _init_default_columns(self):
        """Inicializa estrutura de colunas padrão"""
        if not self.colunas_path.exists():
            default_columns = {
                "Absenteísmo": ["Nome", "Equipe", "Previsto", "Ausência", "Presença", "ABS"],
                "Auditoria": ["Nome", "Data", "Ocorrência", "Valor"],
                "Banco de horas": ["Nome", "Equipe", "Data", "Saldo de B. H."],
                "Jornada (espelho ponto)": [
                    "Data", "Nome", "Cargo", "Equipe", "Turno", "Pontos",
                    "Totais da jornada", "Total de H. extras", "Saldo", "Motivo/Observação"
                ],
                "Faltas": ["Nome", "Equipe", "Data", "Motivo"],
                "Solicitações": [
                    "Nome", "Cargo", "Equipe", "Data", "Pontos", "Status",
                    "Tipo de solicitação", "Quem aprovou/reprovou", "Data da criação",
                    "Data da alteração", "Observação", "Motivo", "É atestado?",
                    "CID", "Motivo da reprovação"
                ],
                "Afastamentos e férias": [
                    "Nome", "Equipe", "Data inicial", "Data final",
                    "Observação", "Quant. de dias", "É atestado?"
                ],
                "Assinaturas": ["Nome", "Equipe", "Assinado?", "Data da assinatura"],
                "Colaboradores": [
                    "Nome", "PIS", "Cargo", "Equipe", "Turno", "CPF",
                    "E-mail", "Centro de custo", "Data de admissão"
                ],
                "Turnos": [
                    "Código", "Descrição", "Dia", "Horários", "Ignora feriados",
                    "Intervalo flexível", "Intervalo pré-assinalado", "Intervalos principal",
                    "Jornada flexível", "Limite de horas extras", "Marcação por exceção",
                    "Status", "Tipo", "Tolerância em jornada flexível", "Turno avançado",
                    "Virada do turno", "Marcação por exceção"
                ]
            }
            with open(self.colunas_path, 'w', encoding='utf-8') as f:
                json.dump(default_columns, f, indent=4, ensure_ascii=False)
    
    def load_config(self):
        """Carrega configuração com credenciais do .env"""
        try:
            with open(self.config_path, 'r', encoding='utf-8') as f:
                config = json.load(f)
            
            # Injeta credenciais do .env
            if "pontomais" not in config:
                config["pontomais"] = {}
            
            config["pontomais"]["auth"] = {
                "username": os.getenv("PONTOMAIS_USERNAME", ""),
                "password": os.getenv("PONTOMAIS_PASSWORD", "")
            }
            
            return config
        except Exception as e:
            raise Exception(f"Erro ao carregar configuração: {str(e)}")
    
    def save_config(self, config):
        """Salva configuração"""
        try:
            with open(self.config_path, 'w', encoding='utf-8') as f:
                json.dump(config, f, indent=4)
        except Exception as e:
            raise Exception(f"Erro ao salvar configuração: {str(e)}")
    
    def load_columns(self):
        """Carrega estrutura de colunas"""
        try:
            with open(self.colunas_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            raise Exception(f"Erro ao carregar colunas: {str(e)}")
    
    def save_columns(self, columns):
        """Salva estrutura de colunas"""
        try:
            with open(self.colunas_path, 'w', encoding='utf-8') as f:
                json.dump(columns, f, indent=4, ensure_ascii=False)
        except Exception as e:
            raise Exception(f"Erro ao salvar colunas: {str(e)}")
    
    def update_login(self, username, password):
        """Atualiza credenciais no arquivo .env"""
        env_path = Path(".env")
        
        # Lê o .env atual ou cria novo
        env_lines = []
        if env_path.exists():
            with open(env_path, 'r', encoding='utf-8') as f:
                env_lines = f.readlines()
        
        # Atualiza ou adiciona as credenciais
        username_found = False
        password_found = False
        
        for i, line in enumerate(env_lines):
            if line.startswith("PONTOMAIS_USERNAME="):
                env_lines[i] = f"PONTOMAIS_USERNAME={username}\n"
                username_found = True
            elif line.startswith("PONTOMAIS_PASSWORD="):
                env_lines[i] = f"PONTOMAIS_PASSWORD={password}\n"
                password_found = True
        
        if not username_found:
            env_lines.append(f"PONTOMAIS_USERNAME={username}\n")
        if not password_found:
            env_lines.append(f"PONTOMAIS_PASSWORD={password}\n")
        
        # Salva o .env
        with open(env_path, 'w', encoding='utf-8') as f:
            f.writelines(env_lines)
        
        # Recarrega variáveis de ambiente
        load_dotenv(override=True)
    
    def update_destination(self, path):
        """Atualiza pasta de destino"""
        # Validate path
        os.makedirs(path, exist_ok=True)
        
        config = self.load_config()
        if "pontomais" not in config:
            config["pontomais"] = {}
        
        config["pontomais"]["destine"] = path
        self.save_config(config)
    
    def update_rescisao_path(self, path):
        """Atualiza pasta de rescisão"""
        # Validate path
        os.makedirs(path, exist_ok=True)
        
        config = self.load_config()
        config["rescisao_pasta"] = path
        self.save_config(config)
    
    def update_columns(self, report_name, columns):
        """Atualiza colunas de um relatório"""
        all_columns = self.load_columns()
        all_columns[report_name] = columns
        self.save_columns(all_columns)
    
    def get_google_drive_config(self):
        """Retorna configurações do Google Drive do .env"""
        folder_id = os.getenv("GOOGLE_DRIVE_FOLDER_ID", "")
        service_account_path = os.getenv("GOOGLE_SERVICE_ACCOUNT_PATH", "Config/google_service_account.json")
        
        # Verifica se está configurado (tem folder_id e arquivo existe)
        enabled = bool(folder_id and os.path.exists(service_account_path))
        
        return {
            "enabled": enabled,
            "folder_id": folder_id,
            "service_account_path": service_account_path
        }
