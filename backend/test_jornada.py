import pandas as pd
import os

# Teste com arquivo de Jornada
filepath = r"Q:\DEPARTAMENTO PESSOAL\PONTO ELETRONICO\BASE BI - PONTO ELETRONICO\Jornada (espelho ponto)\Pontomais_-_Jornada_(01.01.2024_-_31.01.2024)_-_b308a790.csv"

print(f"Testando: {os.path.basename(filepath)}")
print(f"Existe: {os.path.exists(filepath)}")
print()

if not os.path.exists(filepath):
    print("ERRO: Arquivo não encontrado!")
    exit()

# Tenta ler com diferentes configurações
for skip in [0, 1, 2, 3]:
    print(f"\n{'='*80}")
    print(f"Tentando com skiprows={skip}")
    print('='*80)
    
    try:
        df = pd.read_csv(filepath, encoding='utf-8', sep=',', skiprows=skip, nrows=10)
        
        print(f"✓ Lido com sucesso!")
        print(f"  Linhas: {len(df)}")
        print(f"  Colunas ({len(df.columns)}): {list(df.columns)}")
        print(f"\n  Primeiras 3 linhas:")
        print(df.head(3))
        
        # Verifica coluna Nome
        if 'Nome' in df.columns:
            print(f"\n  Valores únicos em 'Nome' (primeiros 10):")
            print(df['Nome'].unique()[:10])
        
        # Tenta ler arquivo completo
        df_full = pd.read_csv(filepath, encoding='utf-8', sep=',', skiprows=skip)
        print(f"\n  Arquivo completo: {len(df_full)} linhas")
        
        # Aplica filtros
        if 'Nome' in df_full.columns:
            original_len = len(df_full)
            df_filtered = df_full[~df_full['Nome'].astype(str).str.strip().str.upper().isin(['RESUMO', 'TOTAL'])]
            df_filtered = df_filtered[~df_filtered['Nome'].astype(str).str.strip().str.match(r'^\d+$', na=False)]
            df_filtered = df_filtered[df_filtered['Nome'].notna()]
            df_filtered = df_filtered[df_filtered['Nome'].astype(str).str.strip() != '']
            
            print(f"\n  Após filtros: {len(df_filtered)} linhas (removidas {original_len - len(df_filtered)})")
            
            if len(df_filtered) > 0:
                print(f"  ✓ DataFrame válido após filtros!")
                print(f"  Primeiros nomes: {df_filtered['Nome'].head(5).tolist()}")
            else:
                print(f"  ✗ DataFrame vazio após filtros!")
                print(f"  Valores únicos em Nome antes do filtro:")
                print(df_full['Nome'].value_counts().head(20))
        
        break
        
    except Exception as e:
        print(f"✗ Erro: {str(e)[:200]}")
