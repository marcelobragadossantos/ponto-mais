import pandas as pd
import os

# Teste de leitura de um arquivo CSV específico
filepath = r"C:\Users\HiperFarma\Downloads\Documents\Relatório\Colaboradores\Pontomais_-_Colaboradores.csv"

print(f"Testando leitura de: {filepath}")
print(f"Arquivo existe: {os.path.exists(filepath)}")
print(f"Tamanho: {os.path.getsize(filepath)} bytes")
print()

encodings = ['utf-8', 'latin-1', 'iso-8859-1', 'cp1252', 'utf-8-sig']
separators = [',', ';', '\t']

for encoding in encodings:
    for sep in separators:
        try:
            # Tenta ler apenas as primeiras linhas
            df = pd.read_csv(filepath, encoding=encoding, sep=sep, nrows=5)
            
            if len(df.columns) > 1:
                print(f"✓ SUCESSO com encoding={encoding}, sep='{sep}'")
                print(f"  Colunas ({len(df.columns)}): {list(df.columns)}")
                print(f"  Primeiras linhas:")
                print(df.head(2))
                print()
                break
        except Exception as e:
            print(f"✗ Falhou com encoding={encoding}, sep='{sep}': {str(e)[:50]}")
    else:
        continue
    break

# Tenta ler o arquivo completo com a melhor configuração
print("\n" + "="*80)
print("Tentando ler arquivo completo pulando linhas de cabeçalho...")

# Tenta com diferentes números de linhas puladas
for skiprows in [0, 1, 2, 3, 4]:
    try:
        df = pd.read_csv(filepath, encoding='utf-8', sep=',', skiprows=skiprows, nrows=5)
        if len(df.columns) > 1:
            print(f"\n✓ SUCESSO pulando {skiprows} linhas")
            print(f"Total de colunas: {len(df.columns)}")
            print(f"Colunas: {list(df.columns)}")
            print(f"\nPrimeiras 3 linhas:")
            print(df.head(3))
            
            # Agora lê o arquivo completo
            df_full = pd.read_csv(filepath, encoding='utf-8', sep=',', skiprows=skiprows)
            print(f"\nArquivo completo: {len(df_full)} linhas")
            break
    except Exception as e:
        print(f"✗ Falhou pulando {skiprows} linhas: {str(e)[:80]}")
