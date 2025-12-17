import os
import re
from pathlib import Path
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
from googleapiclient.errors import HttpError

class GoogleDriveService:
    """Serviço para upload de arquivos no Google Drive usando Service Account"""
    
    def __init__(self, service_account_path=None):
        """
        Inicializa o serviço do Google Drive
        
        Args:
            service_account_path: Caminho para o arquivo JSON da service account
        """
        self.service = None
        self.credentials = None
        self.service_account_path = service_account_path
        
        if service_account_path and os.path.exists(service_account_path):
            self.authenticate(service_account_path)
    
    def authenticate(self, service_account_path):
        """
        Autentica usando service account
        
        Args:
            service_account_path: Caminho para o arquivo JSON da service account
        """
        try:
            # Usa escopo completo do Drive para acessar pastas compartilhadas
            SCOPES = ['https://www.googleapis.com/auth/drive']
            
            self.credentials = service_account.Credentials.from_service_account_file(
                service_account_path,
                scopes=SCOPES
            )
            
            self.service = build('drive', 'v3', credentials=self.credentials)
            self.service_account_path = service_account_path
            
            print("GOOGLE DRIVE API - ✅ Autenticação Google Drive realizada com sucesso")
            return True
        except Exception as e:
            print(f"GOOGLE DRIVE API - ❌ Erro ao autenticar Google Drive: {str(e)}")
            raise Exception(f"Erro ao autenticar Google Drive: {str(e)}")
    
    def create_folder(self, folder_name, parent_folder_id=None):
        """
        Cria uma pasta no Google Drive
        
        Args:
            folder_name: Nome da pasta
            parent_folder_id: ID da pasta pai (opcional)
        
        Returns:
            ID da pasta criada
        """
        try:
            file_metadata = {
                'name': folder_name,
                'mimeType': 'application/vnd.google-apps.folder'
            }
            
            if parent_folder_id:
                file_metadata['parents'] = [parent_folder_id]
            
            folder = self.service.files().create(
                body=file_metadata,
                fields='id, name',
                supportsAllDrives=True
            ).execute()
            
            print(f"GOOGLE DRIVE API - 📁 Pasta criada no Drive: {folder_name} (ID: {folder.get('id')})")
            return folder.get('id')
        except HttpError as e:
            print(f"GOOGLE DRIVE API - ❌ Erro ao criar pasta {folder_name}: {str(e)}")
            raise
    
    def verify_folder_access(self, folder_id):
        """
        Verifica se a pasta existe e está acessível
        
        Args:
            folder_id: ID da pasta
        
        Returns:
            True se acessível, False caso contrário
        """
        try:
            self.service.files().get(
                fileId=folder_id, 
                fields='id, name',
                supportsAllDrives=True
            ).execute()
            return True
        except HttpError as e:
            if e.resp.status == 404:
                print(f"GOOGLE DRIVE API - ❌ Pasta não encontrada (ID: {folder_id})")
                print(f"   Verifique se o ID está correto e se a pasta foi compartilhada com a service account")
            else:
                print(f"GOOGLE DRIVE API - ❌ Erro ao acessar pasta: {str(e)}")
            return False
    
    def find_folder(self, folder_name, parent_folder_id=None):
        """
        Busca uma pasta pelo nome
        
        Args:
            folder_name: Nome da pasta
            parent_folder_id: ID da pasta pai (opcional)
        
        Returns:
            ID da pasta encontrada ou None
        """
        try:
            query = f"name='{folder_name}' and mimeType='application/vnd.google-apps.folder' and trashed=false"
            
            if parent_folder_id:
                query += f" and '{parent_folder_id}' in parents"
            
            results = self.service.files().list(
                q=query,
                spaces='drive',
                fields='files(id, name)',
                supportsAllDrives=True,
                includeItemsFromAllDrives=True
            ).execute()
            
            items = results.get('files', [])
            
            if items:
                return items[0]['id']
            return None
        except HttpError as e:
            print(f"GOOGLE DRIVE API - ❌ Erro ao buscar pasta {folder_name}: {str(e)}")
            return None
    
    def get_or_create_folder(self, folder_name, parent_folder_id=None):
        """
        Busca uma pasta ou cria se não existir
        
        Args:
            folder_name: Nome da pasta
            parent_folder_id: ID da pasta pai (opcional)
        
        Returns:
            ID da pasta
        """
        # Se tem parent_folder_id, verifica se ele existe primeiro
        if parent_folder_id:
            if not self.verify_folder_access(parent_folder_id):
                raise Exception(f"GOOGLE DRIVE API - Pasta pai não acessível (ID: {parent_folder_id}). Verifique se foi compartilhada com a service account.")
        
        folder_id = self.find_folder(folder_name, parent_folder_id)
        
        if folder_id:
            print(f"GOOGLE DRIVE API - 📁 Pasta já existe no Drive: {folder_name}")
            return folder_id
        
        return self.create_folder(folder_name, parent_folder_id)
    
    def upload_file(self, local_path, drive_folder_id, filename=None):
        """
        Faz upload ou atualização de um arquivo no Google Drive.
        Se o arquivo já existir, atualiza o conteúdo (mantendo o ID).
        Se não existir, cria um novo.
        """
        try:
            if not os.path.exists(local_path):
                raise FileNotFoundError(f"Arquivo não encontrado: {local_path}")
            
            # Define nome do arquivo
            if not filename:
                filename = os.path.basename(local_path)
            
            filename = self._clean_filename(filename)
            mimetype = self._get_mimetype(filename)
            
            # Tenta encontrar se o arquivo JÁ EXISTE na pasta
            existing_file_id = self._find_file_in_folder(filename, drive_folder_id)

            media = MediaFileUpload(local_path, mimetype=mimetype, resumable=True)

            if existing_file_id:
                # --- CENÁRIO 1: ARQUIVO EXISTE -> FAZ UPDATE ---
                print(f"GOOGLE DRIVE API - 🔄 Arquivo já existe (ID: {existing_file_id}). Atualizando conteúdo...")
                
                # No update não precisamos passar 'parents' no body, apenas se quisermos mover o arquivo
                file = self.service.files().update(
                    fileId=existing_file_id,
                    media_body=media,
                    fields='id, name, webViewLink',
                    supportsAllDrives=True
                ).execute()
                
                print(f"GOOGLE DRIVE API - ✅ Atualização concluída: {filename}")
                
            else:
                # --- CENÁRIO 2: ARQUIVO NÃO EXISTE -> FAZ CREATE ---
                print(f"GOOGLE DRIVE API - 🆕 Arquivo não encontrado. Criando novo arquivo...")
                
                file_metadata = {
                    'name': filename,
                    'parents': [drive_folder_id]
                }
                
                file = self.service.files().create(
                    body=file_metadata,
                    media_body=media,
                    fields='id, name, webViewLink',
                    supportsAllDrives=True
                ).execute()
                
                print(f"GOOGLE DRIVE API - ✅ Upload concluído: {filename}")

            return file

        except Exception as e:
            print(f"GOOGLE DRIVE API - ❌ Erro ao processar arquivo {local_path}: {str(e)}")
            raise
    
    def _clean_filename(self, filename):
        """
        Remove ID do nome do arquivo
        Exemplo: "Pontomais_-_Auditoria_(01.10.2025_-_31.10.2025)_-_b6426913.csv"
        Vira: "Pontomais_-_Auditoria_(01.10.2025_-_31.10.2025).csv"
        
        Args:
            filename: Nome do arquivo
        
        Returns:
            Nome limpo
        """
        # Padrão: )_-_[ID].extensão
        # Remove tudo entre o último ")" e a extensão se houver padrão _-_[hash]
        pattern = r'\)_-_[a-f0-9]+(\.[a-zA-Z0-9]+)$'
        cleaned = re.sub(pattern, r')\1', filename)
        
        return cleaned
    
    def _find_file_in_folder(self, filename, folder_id):
        """
        Busca arquivo pelo nome em uma pasta específica
        
        Args:
            filename: Nome do arquivo
            folder_id: ID da pasta
        
        Returns:
            ID do arquivo ou None
        """
        try:
            query = f"name='{filename}' and '{folder_id}' in parents and trashed=false"
            
            results = self.service.files().list(
                q=query,
                spaces='drive',
                fields='files(id, name)',
                supportsAllDrives=True,
                includeItemsFromAllDrives=True
            ).execute()
            
            items = results.get('files', [])
            
            if items:
                return items[0]['id']
            return None
        except Exception as e:
            print(f"GOOGLE DRIVE API - ❌ Erro ao buscar arquivo {filename}: {str(e)}")
            return None
    
    def _find_all_files_in_folder(self, filename, folder_id):
        """
        Busca TODOS os arquivos com o mesmo nome em uma pasta
        
        Args:
            filename: Nome do arquivo
            folder_id: ID da pasta
        
        Returns:
            Lista de IDs dos arquivos encontrados
        """
        try:
            query = f"name='{filename}' and '{folder_id}' in parents and trashed=false"
            
            results = self.service.files().list(
                q=query,
                spaces='drive',
                fields='files(id, name)',
                supportsAllDrives=True,
                includeItemsFromAllDrives=True
            ).execute()
            
            items = results.get('files', [])
            return [item['id'] for item in items]
        except Exception as e:
            print(f"GOOGLE DRIVE API - ❌ Erro ao buscar arquivos {filename}: {str(e)}")
            return []
    
    def delete_file(self, file_id):
        """
        Remove um arquivo do Google Drive
        
        Args:
            file_id: ID do arquivo
        """
        try:
            self.service.files().delete(
                fileId=file_id,
                supportsAllDrives=True
            ).execute()
            print(f"GOOGLE DRIVE API - 🗑️  Arquivo removido do Drive (ID: {file_id})")
        except HttpError as e:
            print(f"GOOGLE DRIVE API - ❌ Erro ao remover arquivo: {str(e)}")
    
    def _get_mimetype(self, filename):
        """
        Retorna mimetype baseado na extensão do arquivo
        
        Args:
            filename: Nome do arquivo
        
        Returns:
            Mimetype
        """
        extension = filename.lower().split('.')[-1]
        
        mimetypes = {
            'csv': 'text/csv',
            'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'xls': 'application/vnd.ms-excel',
            'pdf': 'application/pdf',
            'txt': 'text/plain',
            'json': 'application/json'
        }
        
        return mimetypes.get(extension, 'application/octet-stream')
    
    def list_files(self, folder_id, max_results=100):
        """
        Lista arquivos em uma pasta
        
        Args:
            folder_id: ID da pasta
            max_results: Número máximo de resultados
        
        Returns:
            Lista de arquivos
        """
        try:
            query = f"'{folder_id}' in parents and trashed=false"
            
            results = self.service.files().list(
                q=query,
                pageSize=max_results,
                fields='files(id, name, mimeType, createdTime, size)',
                supportsAllDrives=True,
                includeItemsFromAllDrives=True
            ).execute()
            
            return results.get('files', [])
        except HttpError as e:
            print(f"GOOGLE DRIVE API - ❌ Erro ao listar arquivos: {str(e)}")
            return []
    
    def is_authenticated(self):
        """Verifica se está autenticado"""
        return self.service is not None
