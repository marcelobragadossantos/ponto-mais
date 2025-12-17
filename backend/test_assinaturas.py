import pandas as pd
import os

# Teste com arquivo de Assinaturas
filepath = r"C:\Users\HiperFarma\Downloads\Documents\Relatório\Assinaturas\Pontomais_-_Assinaturas_(01.11.2025_-_30.11.2025).csv"

print(f"Testando: {os.path.basename(filepath)}")
print(f"Existe: {os.path.exists(filepath)}")

if not os.path.exists(filepath):
    print("ERRO: Arquivo não encontrado!")
    exit()

print(f"Tamanho: {os.path.getsize(filepath)} bytes")
print()

# Tenta ler com diferentes configurações
encodings = ['utf-8', 'latin-1', 'iso-8859-1', 'cp1252', 'utf-8-sig']
separators = [',', ';', '\t']

for skip in [0, 1, 2, 3, 4]:
    print(f"\n{'='*80}")
    print(f"Tentando com skiprows={skip}")
    print('='*80)
    
    for encoding in encodings:
        for sep in separators:
            try:
                df = pd.read_csv(filepath, encoding=encoding, sep=sep, skiprows=skip, nrows=5, on_bad_lines='skip')
                
                if len(df) > 0 and len(df.columns) > 1:
                    print(f"\n✓ SUCESSO com encoding={encoding}, sep='{sep}', skiprows={skip}")
                    print(f"  Colunas ({len(df.columns)}): {list(df.columns)}")
                    print(f"  Primeiras 3 linhas:")
                    print(df.head(3))
                    
                    # Tenta ler completo
                    df_full = pd.read_csv(filepath, encoding=encoding, sep=sep, skiprows=skip, on_bad_lines='skip')
                    print(f"\n  Arquivo completo: {len(df_full)} linhas")
                    
                    # Verifica colunas
                    cols_upper = [str(c).upper() for c in df_full.columns]
                    print(f"  Colunas (upper): {cols_upper}")
                    
                    # Verifica se tem Nome
                    if 'Nome' in df_full.columns or 'NOME' in cols_upper:
                        print(f"  ✓ Tem coluna Nome!")
                        if 'Nome' in df_full.columns:
                            print(f"  Primeiros nomes: {df_full['Nome'].head(5).tolist()}")
                    
                    exit()
                    
            except Exception as e:
                continue

print("\n✗ Não foi possível ler o arquivo com nenhuma configuração")
