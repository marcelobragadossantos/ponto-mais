import pandas as pd
import re
import io

# ==============================================================================
# 1. CONFIGURAÇÃO E FUNÇÕES DE LIMPEZA
# ==============================================================================

files = {
    'COLAB': 'Pontomais_-_Colaboradores.csv',
    'JORNADA': 'Pontomais_-_Jornada_(01.10.2025_-_31.10.2025)_-_97131212.csv',
    'BANCO': 'Pontomais_-_Banco_de_horas_(01.10.2025_-_31.10.2025)_-_ed8e17d4.csv',
    'FALTAS': 'Pontomais_-_Faltas_(01.10.2025_-_31.10.2025)_-_d87bb261.csv',
    'AUDIT': 'Pontomais_-_Auditoria_(01.10.2025_-_31.10.2025)_-_b6426913.csv',
    'SOLICIT': 'Pontomais_-_Solicitações_(01.10.2025_-_31.10.2025)_-_a1f5977f.csv',
    'ABSENT': 'Pontomais_-_Absenteísmo_(01.10.2025_-_31.10.2025)_-_b3f13f8c.csv',
    'ASSIN': 'Pontomais_-_Assinaturas_(01.10.2025_-_31.10.2025).csv',
    'AFAST': 'Pontomais_-_Afastamentos_e_férias.csv'
}

def clean_cpf(val):
    if pd.isna(val): return None
    s = re.sub(r'[^0-9]', '', str(val))
    return s if s else None

def clean_date(val):
    if pd.isna(val) or str(val).strip() == '': return pd.NaT
    s = str(val).strip().replace('"', '').replace("'", "")
    if ',' in s: s = s.split(',')[-1].strip()
    try: return pd.to_datetime(s, dayfirst=True)
    except: return pd.NaT

def is_valid_row(nome):
    """Remove linhas de totais, resumos ou lixo"""
    if pd.isna(nome): return False
    s = str(nome).strip().upper()
    if any(x in s for x in ['RESUMO', 'TOTAL', 'SISTEMA']): return False
    if re.match(r'^[\d\.,]+$', str(nome)): return False # Remove IDs numéricos soltos
    return True

def get_header(path, keywords):
    """Encontra a linha correta do cabeçalho"""
    keywords = [k.upper() for k in keywords]
    with open(path, 'r', encoding='utf-8', errors='ignore') as f:
        for i, line in enumerate(f):
            if i > 50: break
            line_u = line.upper()
            sep = ';' if ';' in line else ','
            cols = [c.strip().replace('"','') for c in line_u.split(sep)]
            if sum(1 for k in keywords if any(k in c for c in cols)) >= len(keywords):
                return i, sep
    return 0, ','

def load_and_clean(key, path, keywords, date_col_candidates=None):
    print(f"Lendo {key}...")
    idx, sep = get_header(path, keywords)
    try:
        df = pd.read_csv(path, skiprows=idx, sep=sep, on_bad_lines='skip', engine='python')
        df.columns = [c.strip().upper() for c in df.columns]
        
        # Padronizar NOME
        if 'COLABORADOR' in df.columns: df.rename(columns={'COLABORADOR': 'NOME'}, inplace=True)
        if 'NOME' in df.columns:
            df = df[df['NOME'].apply(is_valid_row)].copy()
            df['NOME'] = df['NOME'].str.strip()
        
        # Padronizar DATA
        if date_col_candidates:
            found_date = False
            for cand in date_col_candidates:
                if cand in df.columns:
                    df['DATA'] = df[cand].apply(clean_date)
                    found_date = True
                    break
            if found_date:
                df = df.dropna(subset=['DATA'])
    
        return df
    except Exception as e:
        print(f"Erro em {key}: {e}")
        return pd.DataFrame()

# ==============================================================================
# 2. CARGA DA BASE DE COLABORADORES (MAPA CPF)
# ==============================================================================
df_colab = load_and_clean('COLAB', files['COLAB'], ['NOME', 'CPF'])
df_colab['CPF'] = df_colab['CPF'].apply(clean_cpf)
mapa_cpf = df_colab.set_index('NOME')['CPF'].to_dict()
# Mapa reverso para preencher nomes se tivermos só CPF (raro, mas útil)
mapa_equipe = df_colab.set_index('NOME')['EQUIPE'].to_dict()

# ==============================================================================
# GRUPO 1: RELATÓRIO OPERACIONAL DIÁRIO (Timeline dia a dia)
# JORNADA + BANCO + FALTAS + AUDITORIA
# ==============================================================================
print("\n--- Gerando Relatório Operacional Diário ---")

# Carregar arquivos diários
df_jornada = load_and_clean('JORNADA', files['JORNADA'], ['NOME', 'DATA'], ['DATA'])
df_banco = load_and_clean('BANCO', files['BANCO'], ['NOME', 'DATA'], ['DATA'])
df_faltas = load_and_clean('FALTAS', files['FALTAS'], ['NOME', 'DATA'], ['DATA'])
df_audit = load_and_clean('AUDIT', files['AUDIT'], ['NOME', 'DATA'], ['DATA'])

# Preparar merges
dfs_diarios = [
    (df_jornada, ''), 
    (df_banco, 'BH'), 
    (df_faltas, 'FALTA'), 
    (df_audit, 'AUDIT')
]

# Base principal é a Jornada (costuma ser a mais completa em dias)
df_daily = df_jornada.copy()

# Loop de Merge
for df_temp, suffix in dfs_diarios[1:]:
    cols_to_use = ['DATA', 'NOME'] + [c for c in df_temp.columns if c not in ['DATA', 'NOME', 'EQUIPE', 'CPF']]
    df_part = df_temp[cols_to_use].copy()
    
    # Renomear colunas para evitar colisão (exceto chaves)
    if suffix:
        rename_map = {c: f"{c}_{suffix}" for c in df_part.columns if c not in ['DATA', 'NOME']}
        df_part.rename(columns=rename_map, inplace=True)
    
    df_daily = pd.merge(df_daily, df_part, on=['NOME', 'DATA'], how='outer')

# Enriquecer com CPF e Equipe
df_daily['CPF'] = df_daily['NOME'].map(mapa_cpf)
df_daily['EQUIPE_CADASTRO'] = df_daily['NOME'].map(mapa_equipe)
df_daily.sort_values(by=['NOME', 'DATA'], inplace=True)

# Organizar colunas (Colocar chaves na frente)
cols = ['DATA', 'CPF', 'NOME', 'EQUIPE_CADASTRO']
others = [c for c in df_daily.columns if c not in cols]
df_daily = df_daily[cols + others]

df_daily.to_csv('1_Relatorio_Diario_Operacional.csv', index=False, encoding='utf-8-sig')
print("Salvo: 1_Relatorio_Diario_Operacional.csv")


# ==============================================================================
# GRUPO 2: RELATÓRIO DE SOLICITAÇÕES (Auditoria de Ajustes)
# SOLICITACOES
# ==============================================================================
print("\n--- Gerando Relatório de Solicitações ---")
df_solic = load_and_clean('SOLICIT', files['SOLICIT'], ['NOME', 'TIPO'], ['DATA'])

if not df_solic.empty:
    df_solic['CPF'] = df_solic['NOME'].map(mapa_cpf)
    
    # Seleção de colunas mais importantes
    cols_priority = ['DATA', 'CPF', 'NOME', 'TIPO DE SOLICITAÇÃO', 'STATUS', 'QUEM APROVOU/REPROVOU', 'MOTIVO', 'OBSERVAÇÃO']
    # Pega as que existem no dataframe
    final_cols = [c for c in cols_priority if c in df_solic.columns]
    # Adiciona o resto
    final_cols += [c for c in df_solic.columns if c not in final_cols]
    
    df_solic[final_cols].to_csv('2_Relatorio_Ajustes_Solicitacoes.csv', index=False, encoding='utf-8-sig')
    print("Salvo: 2_Relatorio_Ajustes_Solicitacoes.csv")

# ==============================================================================
# GRUPO 3: RELATÓRIO GERENCIAL DE RH (Visão Colaborador)
# COLABORADORES + ABSENTEISMO + ASSINATURAS + (Resumo de Afastamentos)
# ==============================================================================
print("\n--- Gerando Relatório Gerencial RH ---")

# Base: Colaboradores
df_mgr = df_colab.copy()

# 1. Absenteísmo (Resumo %)
df_absent = load_and_clean('ABSENT', files['ABSENT'], ['NOME', 'ABS'])
if not df_absent.empty:
    df_absent = df_absent[['NOME', 'ABS', 'PREVISTO', 'AUSÊNCIA']].rename(columns={'ABS': 'TAXA_ABSENTEISMO'})
    df_mgr = pd.merge(df_mgr, df_absent, on='NOME', how='left')

# 2. Assinaturas (Status)
df_assin = load_and_clean('ASSIN', files['ASSIN'], ['COLABORADOR', 'ASSINADO'])
if not df_assin.empty:
    df_assin = df_assin[['NOME', 'ASSINADO?', 'DATA DA ASSINATURA']].rename(columns={'ASSINADO?': 'PONTO_ASSINADO'})
    df_mgr = pd.merge(df_mgr, df_assin, on='NOME', how='left')

# 3. Afastamentos (Flag: Tem afastamento no período?)
# Como afastamento é data, vamos apenas ver se existe registro na tabela de nomes
df_afast = load_and_clean('AFAST', files['AFAST'], ['NOME', 'DATA DE INÍCIO'])
if not df_afast.empty:
    # Agrupar notas de afastamento por pessoa
    resumo_afast = df_afast.groupby('NOME')['NOTAS'].apply(lambda x: ' | '.join(x.dropna().unique())).reset_index()
    resumo_afast.rename(columns={'NOTAS': 'HISTORICO_AFASTAMENTOS'}, inplace=True)
    df_mgr = pd.merge(df_mgr, resumo_afast, on='NOME', how='left')

df_mgr.to_csv('3_Relatorio_Gerencial_RH.csv', index=False, encoding='utf-8-sig')
print("Salvo: 3_Relatorio_Gerencial_RH.csv")