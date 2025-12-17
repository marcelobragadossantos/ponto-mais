import os
import pandas as pd
from pathlib import Path

class FileService:
    def __init__(self):
        self.upload_dir = Path("uploads")
        self.upload_dir.mkdir(exist_ok=True)
        self.nomes_file = self.upload_dir / "Nomes.xlsx"
    
    def save_nomes_file(self, content):
        """Salva arquivo Nomes.xlsx"""
        try:
            with open(self.nomes_file, 'wb') as f:
                f.write(content)
        except Exception as e:
            raise Exception(f"Erro ao salvar arquivo: {str(e)}")
    
    def load_nomes_file(self):
        """Carrega arquivo Nomes.xlsx e retorna DataFrame"""
        try:
            if not self.nomes_file.exists():
                raise FileNotFoundError("Arquivo Nomes.xlsx não encontrado")
            
            # Lê Excel sem converter datas automaticamente
            df = pd.read_excel(self.nomes_file, dtype={'Nome': str, 'Admissão': str, 'Demissão': str})
            
            # Validate columns
            required_columns = ["Nome", "Admissão", "Demissão"]
            if not all(col in df.columns for col in required_columns):
                raise ValueError(f"Colunas esperadas: {', '.join(required_columns)}")
            
            # Converte datas para string no formato DD/MM/AAAA se necessário
            for col in ['Admissão', 'Demissão']:
                df[col] = df[col].apply(lambda x: self._format_date(x))
            
            return df
        except Exception as e:
            raise Exception(f"Erro ao carregar arquivo: {str(e)}")
    
    def _format_date(self, date_value):
        """Formata data para DD/MM/AAAA"""
        if pd.isna(date_value):
            return None
        
        # Se já é string no formato correto, retorna
        date_str = str(date_value).strip()
        if '/' in date_str and len(date_str) == 10:
            return date_str
        
        # Se é Timestamp ou datetime, converte
        try:
            if isinstance(date_value, pd.Timestamp):
                return date_value.strftime('%d/%m/%Y')
            
            # Tenta parsear como datetime
            from datetime import datetime
            if ' ' in date_str:  # Formato: 2025-01-01 00:00:00
                dt = datetime.strptime(date_str.split()[0], '%Y-%m-%d')
                return dt.strftime('%d/%m/%Y')
            elif '-' in date_str:  # Formato: 2025-01-01
                dt = datetime.strptime(date_str, '%Y-%m-%d')
                return dt.strftime('%d/%m/%Y')
        except:
            pass
        
        return date_str
    
    def nomes_file_exists(self):
        """Verifica se arquivo Nomes.xlsx existe"""
        return self.nomes_file.exists()
