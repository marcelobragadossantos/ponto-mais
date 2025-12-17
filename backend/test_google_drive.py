#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Script de teste para verificar configuração do Google Drive
"""

import os
from dotenv import load_dotenv
from google_drive_service import GoogleDriveService

def test_google_drive():
    """Testa configuração do Google Drive"""
    
    print("\n" + "="*60)
    print("🧪 TESTE DE CONFIGURAÇÃO DO GOOGLE DRIVE")
    print("="*60 + "\n")
    
    # Carrega .env
    load_dotenv()
    
    # 1. Verifica variáveis de ambiente
    print("📋 Verificando variáveis de ambiente...")
    folder_id = os.getenv("GOOGLE_DRIVE_FOLDER_ID", "")
    service_account_path = os.getenv("GOOGLE_SERVICE_ACCOUNT_PATH", "Config/google_service_account.json")
    
    if not folder_id:
        print("❌ GOOGLE_DRIVE_FOLDER_ID não configurado no .env")
        return False
    else:
        print(f"✅ GOOGLE_DRIVE_FOLDER_ID: {folder_id}")
    
    # 2. Verifica arquivo de credenciais
    print(f"\n📋 Verificando arquivo de credenciais...")
    if not os.path.exists(service_account_path):
        print(f"❌ Arquivo não encontrado: {service_account_path}")
        return False
    else:
        print(f"✅ Arquivo encontrado: {service_account_path}")
    
    # 3. Tenta autenticar
    print(f"\n📋 Testando autenticação...")
    try:
        drive_service = GoogleDriveService(service_account_path)
        print("✅ Autenticação bem-sucedida")
    except Exception as e:
        print(f"❌ Erro na autenticação: {str(e)}")
        return False
    
    # 4. Verifica acesso à pasta
    print(f"\n📋 Verificando acesso à pasta raiz...")
    try:
        if drive_service.verify_folder_access(folder_id):
            print("✅ Pasta acessível")
            
            # Tenta obter informações da pasta
            folder_info = drive_service.service.files().get(
                fileId=folder_id, 
                fields='id, name, owners',
                supportsAllDrives=True
            ).execute()
            
            print(f"\n📁 Informações da pasta:")
            print(f"   Nome: {folder_info.get('name')}")
            print(f"   ID: {folder_info.get('id')}")
            
            owners = folder_info.get('owners', [])
            if owners:
                print(f"   Proprietário: {owners[0].get('emailAddress', 'N/A')}")
        else:
            print("❌ Pasta não acessível")
            print("\n🔧 Possíveis soluções:")
            print("   1. Verifique se o ID da pasta está correto")
            print("   2. Abra o arquivo google_service_account.json")
            print("   3. Copie o 'client_email'")
            print("   4. Compartilhe a pasta do Drive com este email")
            print("   5. Dê permissão de 'Editor'")
            return False
    except Exception as e:
        print(f"❌ Erro ao verificar pasta: {str(e)}")
        return False
    
    # 5. Testa criação de pasta
    print(f"\n📋 Testando criação de pasta...")
    try:
        test_folder_id = drive_service.get_or_create_folder("_TESTE_PONTOMAIS", folder_id)
        print(f"✅ Pasta de teste criada/encontrada (ID: {test_folder_id})")
        
        # Remove pasta de teste
        print(f"🗑️  Removendo pasta de teste...")
        drive_service.delete_file(test_folder_id)
        print("✅ Pasta de teste removida")
    except Exception as e:
        print(f"❌ Erro ao testar criação de pasta: {str(e)}")
        return False
    
    # 6. Lista arquivos na pasta (primeiros 5)
    print(f"\n📋 Listando arquivos na pasta...")
    try:
        files = drive_service.list_files(folder_id, max_results=5)
        if files:
            print(f"✅ Encontrados {len(files)} arquivo(s):")
            for file in files:
                print(f"   - {file.get('name')} ({file.get('mimeType')})")
        else:
            print("ℹ️  Pasta vazia (sem arquivos)")
    except Exception as e:
        print(f"⚠️  Erro ao listar arquivos: {str(e)}")
    
    print("\n" + "="*60)
    print("✅ TODOS OS TESTES PASSARAM!")
    print("="*60)
    print("\n🎉 Google Drive está configurado corretamente!")
    print("   Os relatórios serão enviados automaticamente para o Drive.\n")
    
    return True

if __name__ == "__main__":
    try:
        success = test_google_drive()
        exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n⚠️  Teste interrompido pelo usuário")
        exit(1)
    except Exception as e:
        print(f"\n\n❌ Erro inesperado: {str(e)}")
        import traceback
        traceback.print_exc()
        exit(1)
