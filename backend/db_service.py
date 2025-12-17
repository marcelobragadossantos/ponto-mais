import os
import urllib.parse
import pandas as pd
from sqlalchemy import create_engine, text
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

class DBService:
    """Serviço para consultas ao banco de dados PostgreSQL"""
    
    def __init__(self):
        self.engine = None
    
    def conectar_banco(self):
        """Cria e retorna uma engine de conexão com o banco de dados."""
        DB_CONF = {
            'database': os.getenv('DB_DATABASE', ''),
            'user': os.getenv('DB_USER', ''),
            'password': os.getenv('DB_PASSWORD', ''),
            'host': os.getenv('DB_HOST', ''),
            'port': os.getenv('DB_PORT', '5432')
        }
        
        try:
            password_encoded = urllib.parse.quote_plus(DB_CONF['password'])
            connection_string = (
                f"postgresql://{DB_CONF['user']}:{password_encoded}"
                f"@{DB_CONF['host']}:{DB_CONF['port']}/{DB_CONF['database']}"
            )
            
            self.engine = create_engine(connection_string)
            
            # Testa a conexão
            with self.engine.connect() as connection:
                print("✅ Conexão com o banco de dados estabelecida com sucesso.")
            
            return self.engine
        except Exception as e:
            print(f"❌ Falha ao conectar ao banco de dados: {e}")
            return None
    
    def consultar_trainees(self):
        """Executa consulta de colaboradores trainee"""
        if not self.engine:
            if not self.conectar_banco():
                raise Exception("Não foi possível conectar ao banco de dados")
        
        query = text("""
        SELECT 
            u.login,
            u.apelido,
            p.cpf,
            un.codigo,
            un.nome as "Loja Cadastro",
            string_agg(gu.nome, ', ') AS NomeGrupos
        FROM usuarioparticipantegrupousuario upg
        LEFT JOIN usuario u ON u.id = upg.usuarioid 
        LEFT JOIN grupousuario gu ON upg.grupousuarioid = gu.id
        LEFT JOIN unidadenegocio un ON un.id = u.unidadenegocioid
        LEFT JOIN pessoa p ON u.pessoaid = p.id
        WHERE u.status = 'A'
        AND gu.nome ILIKE '%trainee%'
        AND un.nome <> 'ESC'
        GROUP BY u.login, u.apelido, un.nome, p.cpf, un.codigo
        """)
        
        try:
            with self.engine.connect() as connection:
                df = pd.read_sql(query, connection)
            print(f"✅ Consulta executada: {len(df)} registros encontrados")
            return df
        except Exception as e:
            print(f"❌ Erro ao executar consulta: {e}")
            raise
    
    def exportar_trainees(self, destino_base):
        """Exporta consulta de trainees para CSV"""
        try:
            # Executa consulta
            df = self.consultar_trainees()
            
            # Define pasta de destino
            pasta_destino = Path(destino_base) / "Colaboradores trainee"
            pasta_destino.mkdir(parents=True, exist_ok=True)
            
            # Define caminho do arquivo
            arquivo_saida = pasta_destino / "Consulta_trainee.csv"
            
            # Exporta para CSV
            df.to_csv(arquivo_saida, index=False, encoding='utf-8-sig', sep=';')
            
            print(f"✅ Arquivo exportado: {arquivo_saida}")
            return str(arquivo_saida)
        except Exception as e:
            print(f"❌ Erro ao exportar trainees: {e}")
            raise
    
    def close(self):
        """Fecha conexão com o banco"""
        if self.engine:
            self.engine.dispose()
            print("🔌 Conexão com banco de dados fechada")
