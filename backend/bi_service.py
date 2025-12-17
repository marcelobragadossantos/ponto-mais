import os
import pandas as pd
import glob
import re
from pathlib import Path
from typing import List, Dict, Optional
import logging

logger = logging.getLogger(__name__)

class BIService:
    """Serviço para consolidação de dados de múltiplos relatórios CSV/Excel"""
    
    def __init__(self, config_service=None):
        self.config_service = config_service
        self._root_folder = None
    
    def _get_root_folder(self) -> str:
        """Obtém a pasta raiz configurada pelo usuário"""
        if self._root_folder:
            return self._root_folder
            
        if self.config_service:
            try:
                config = self.config_service.load_config()
                destine = config.get("pontomais", {}).get("destine", "")
                if destine and os.path.exists(destine):
                    self._root_folder = destine
                    return destine
            except Exception as e:
                logger.warning(f"Erro ao carregar pasta de destino: {str(e)}")
        
        # Fallback para pasta padrão
        self._root_folder = "arquivos_baixados"
        return self._root_folder
        
    def _normalize_column_names(self, df: pd.DataFrame) -> pd.DataFrame:
        """Normaliza nomes de colunas removendo espaços e caracteres especiais"""
        df.columns = df.columns.str.strip()
        return df
    
    def _extract_cpf(self, text: str) -> str:
        """Extrai CPF de texto formatado"""
        if pd.isna(text):
            return None
        text = str(text).strip()
        # Remove formatação do CPF
        cpf = ''.join(filter(str.isdigit, text))
        return cpf if len(cpf) == 11 else None
    
    def _create_composite_key(self, row: pd.Series) -> str:
        """Cria chave composta NOME+EQUIPE quando CPF não existe"""
        nome = str(row.get('Nome', '')).strip().upper()
        equipe = str(row.get('Equipe', '')).strip().upper()
        return f"{nome}|{equipe}" if nome and equipe else None
    
    def _fill_missing_values(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Preenche valores em branco com dados de outras linhas do mesmo CPF/Nome+Equipe.
        Para cada grupo (CPF ou Nome+Equipe), preenche valores vazios com valores não-vazios.
        """
        if df.empty:
            return df
        
        # Cria cópia para não modificar o original
        df_filled = df.copy()
        
        # Agrupa por CPF (quando existe e não é nulo)
        if 'CPF' in df_filled.columns:
            # Para cada CPF único
            for cpf in df_filled['CPF'].dropna().unique():
                if not cpf or cpf == '':
                    continue
                
                # Pega todas as linhas com esse CPF
                mask = df_filled['CPF'] == cpf
                group = df_filled[mask]
                
                if len(group) > 1:
                    # Para cada coluna, preenche valores vazios com o primeiro valor não-vazio do grupo
                    for col in df_filled.columns:
                        if col in ['CPF', '_source_files']:
                            continue
                        
                        # Pega o primeiro valor não-vazio
                        non_empty = group[col].dropna()
                        non_empty = non_empty[non_empty != '']
                        
                        if len(non_empty) > 0:
                            fill_value = non_empty.iloc[0]
                            # Preenche valores vazios neste grupo
                            df_filled.loc[mask, col] = df_filled.loc[mask, col].fillna(fill_value)
                            df_filled.loc[mask & (df_filled[col] == ''), col] = fill_value
        
        # Agrupa por Nome+Equipe (para registros sem CPF)
        if 'Nome' in df_filled.columns and 'Equipe' in df_filled.columns:
            # Cria chave temporária
            df_filled['_temp_key'] = df_filled['Nome'].astype(str) + '|' + df_filled['Equipe'].astype(str)
            
            for key in df_filled['_temp_key'].unique():
                if not key or key == '|':
                    continue
                
                mask = df_filled['_temp_key'] == key
                group = df_filled[mask]
                
                if len(group) > 1:
                    for col in df_filled.columns:
                        if col in ['Nome', 'Equipe', 'CPF', '_source_files', '_temp_key']:
                            continue
                        
                        non_empty = group[col].dropna()
                        non_empty = non_empty[non_empty != '']
                        
                        if len(non_empty) > 0:
                            fill_value = non_empty.iloc[0]
                            df_filled.loc[mask, col] = df_filled.loc[mask, col].fillna(fill_value)
                            df_filled.loc[mask & (df_filled[col] == ''), col] = fill_value
            
            # Remove chave temporária
            df_filled = df_filled.drop(columns=['_temp_key'])
        
        return df_filled
    
    def _read_file_safe(self, filepath: str) -> pd.DataFrame:
        """Lê CSV ou Excel com tratamento de erros e diferentes encodings"""
        file_ext = os.path.splitext(filepath)[1].lower()
        filename = os.path.basename(filepath).upper()
        
        # Verifica se arquivo é muito pequeno (provavelmente vazio)
        file_size = os.path.getsize(filepath)
        if file_size < 200:  # Menos de 200 bytes
            logger.warning(f"Arquivo muito pequeno ({file_size} bytes), provavelmente vazio: {os.path.basename(filepath)}")
            return pd.DataFrame()
        
        # Define skiprows específico por tipo de relatório
        # Alguns relatórios têm cabeçalhos em linhas diferentes
        skiprows_hint = None
        if 'ABSENTEISMO' in filename or 'ABSENTEÍSMO' in filename:
            skiprows_hint = 4  # Linha 5
        elif 'ASSINATURA' in filename:
            skiprows_hint = 4  # Linha 5
        
        # Tenta ler Excel
        if file_ext in ['.xlsx', '.xls']:
            try:
                df = pd.read_excel(filepath)
                if len(df) > 0:
                    # Pula linhas de cabeçalho de relatório
                    if 'Relatório' in str(df.iloc[0, 0]):
                        for i in range(min(5, len(df))):
                            if 'Nome' in str(df.iloc[i]).upper() or 'CPF' in str(df.iloc[i]).upper():
                                df = pd.read_excel(filepath, skiprows=i)
                                break
                    logger.info(f"Excel lido com sucesso: {os.path.basename(filepath)} ({len(df)} linhas)")
                    return self._normalize_column_names(df)
            except Exception as e:
                logger.warning(f"Erro ao ler Excel {filepath}: {str(e)}")
                return pd.DataFrame()
        
        # Tenta ler CSV
        encodings = ['utf-8', 'latin-1', 'iso-8859-1', 'cp1252', 'utf-8-sig']
        separators = [',', ';', '\t']
        
        last_error = None
        for encoding in encodings:
            for sep in separators:
                try:
                    # Tenta diferentes números de linhas para pular (cabeçalhos do PontoMais)
                    # Se temos uma dica específica, tenta ela primeiro
                    skip_attempts = [skiprows_hint] if skiprows_hint is not None else []
                    skip_attempts.extend([0, 1, 2, 3, 4, 5])
                    # Remove duplicatas mantendo ordem
                    skip_attempts = list(dict.fromkeys(skip_attempts))
                    
                    for skip in skip_attempts:
                        try:
                            # Tenta ler o arquivo (compatível com pandas antigo e novo)
                            try:
                                df = pd.read_csv(filepath, encoding=encoding, sep=sep, skiprows=skip, on_bad_lines='skip', low_memory=False)
                            except TypeError:
                                # Versão antiga do pandas usa error_bad_lines
                                try:
                                    df = pd.read_csv(filepath, encoding=encoding, sep=sep, skiprows=skip, error_bad_lines=False, low_memory=False)
                                except TypeError:
                                    df = pd.read_csv(filepath, encoding=encoding, sep=sep, skiprows=skip, error_bad_lines=False)
                            
                            # Verifica se leitura foi bem-sucedida
                            if len(df) == 0:
                                continue
                            
                            # Se tem apenas 1 coluna, provavelmente o separador está errado
                            if len(df.columns) == 1:
                                continue
                            
                            # Tratamento especial para relatório de Jornada (formato diferente)
                            # Formato: primeira coluna é "Colaborador" e segunda é o nome do colaborador
                            if len(df.columns) == 2 and 'Colaborador' in str(df.columns[0]):
                                # Este é um relatório de Jornada com formato especial
                                # A primeira linha contém os nomes reais das colunas
                                if len(df) > 0:
                                    # Usa a primeira linha como cabeçalho
                                    new_header = df.iloc[0]
                                    df = df[1:]
                                    df.columns = new_header
                                    df = df.reset_index(drop=True)
                            
                            # Verifica se tem colunas esperadas (Nome, CPF, Equipe, Data, Cargo, etc)
                            cols_upper = [str(c).upper() for c in df.columns]
                            cols_str = ' '.join(cols_upper)
                            
                            # Lista de palavras-chave que indicam um relatório válido
                            valid_keywords = ['NOME', 'CPF', 'EQUIPE', 'DATA', 'CARGO', 'COLABORADOR', 
                                            'TURNO', 'PIS', 'ADMISSAO', 'ADMISSÃO', 'DEMISSAO', 'DEMISSÃO',
                                            'FALTA', 'AUSENCIA', 'AUSÊNCIA', 'JORNADA', 'PONTO', 'HORA']
                            
                            has_valid_cols = any(keyword in cols_str for keyword in valid_keywords)
                            
                            if has_valid_cols and len(df) > 0 and len(df.columns) > 1:
                                logger.info(f"CSV lido com sucesso: {os.path.basename(filepath)} ({len(df)} linhas, {len(df.columns)} colunas, encoding={encoding}, sep='{sep}', skiprows={skip})")
                                return self._normalize_column_names(df)
                            elif len(df) > 0 and len(df.columns) > 1:
                                # Se tem dados mas não tem palavras-chave, ainda assim tenta processar
                                logger.warning(f"Arquivo sem colunas esperadas, mas processando mesmo assim: {os.path.basename(filepath)}")
                                return self._normalize_column_names(df)
                        
                        except Exception:
                            continue
                        
                except Exception as e:
                    last_error = str(e)
                    continue
        
        logger.warning(f"Não foi possível ler o arquivo: {filepath} (último erro: {last_error})")
        return pd.DataFrame()
    
    def get_available_files(self) -> List[Dict[str, str]]:
        """Lista todos os arquivos CSV/Excel em todas as subpastas da pasta raiz"""
        root_folder = self._get_root_folder()
        
        if not os.path.exists(root_folder):
            logger.warning(f"Pasta raiz não existe: {root_folder}")
            return []
        
        files = []
        extensions = ['*.csv', '*.xlsx', '*.xls']
        
        # Busca recursivamente em todas as subpastas
        for ext in extensions:
            pattern = os.path.join(root_folder, '**', ext)
            for filepath in glob.glob(pattern, recursive=True):
                try:
                    filename = os.path.basename(filepath)
                    relative_path = os.path.relpath(filepath, root_folder)
                    size = os.path.getsize(filepath)
                    
                    files.append({
                        'filename': filename,
                        'relative_path': relative_path,
                        'full_path': filepath,
                        'folder': os.path.dirname(relative_path),
                        'size': f"{size / 1024:.2f} KB"
                    })
                except Exception as e:
                    logger.warning(f"Erro ao processar arquivo {filepath}: {str(e)}")
                    continue
        
        return sorted(files, key=lambda x: (x['folder'], x['filename']))
    
    def _merge_files_from_same_folder(self, files: List[Dict[str, str]], folder: str) -> pd.DataFrame:
        """
        Mescla arquivos da mesma pasta concatenando verticalmente (append)
        
        Args:
            files: Lista de arquivos da mesma pasta
            folder: Nome da pasta
            
        Returns:
            DataFrame consolidado da pasta
        """
        root_folder = self._get_root_folder()
        dfs = []
        
        logger.info(f"Mesclando {len(files)} arquivos da pasta '{folder}'...")
        
        for file_info in files:
            filepath = file_info.get('full_path') or os.path.join(root_folder, file_info.get('relative_path', ''))
            
            if not os.path.exists(filepath):
                logger.warning(f"Arquivo não encontrado: {filepath}")
                continue
            
            try:
                df = self._read_file_safe(filepath)
                
                if df.empty:
                    logger.warning(f"DataFrame vazio: {file_info.get('filename')}")
                    continue
                
                # Adiciona coluna com nome do arquivo fonte
                df['_arquivo_fonte'] = file_info.get('filename')
                
                dfs.append(df)
                logger.info(f"  ✓ {file_info.get('filename')}: {len(df)} linhas")
                
            except Exception as e:
                logger.error(f"Erro ao ler {filepath}: {str(e)}")
                continue
        
        if not dfs:
            logger.warning(f"Nenhum arquivo válido na pasta '{folder}'")
            return pd.DataFrame()
        
        # Concatena todos os DataFrames verticalmente
        merged_df = pd.concat(dfs, ignore_index=True, sort=False)
        logger.info(f"Pasta '{folder}' consolidada: {len(merged_df)} linhas totais")
        
        return merged_df
    
    def merge_reports(self, selected_files: List[Dict[str, str]] = None, progress_callback=None) -> pd.DataFrame:
        """
        Mescla múltiplos relatórios CSV/Excel em uma base única
        
        Args:
            selected_files: Lista de dicionários com informações dos arquivos.
                          Se None, processa todos os arquivos disponíveis.
            progress_callback: Função callback para reportar progresso (0-100)
        
        Returns:
            DataFrame consolidado com todos os dados mesclados
        """
        root_folder = self._get_root_folder()
        
        if selected_files is None:
            # Processa todos os arquivos disponíveis
            selected_files = self.get_available_files()
        
        if not selected_files:
            logger.warning("Nenhum arquivo encontrado para processar")
            return pd.DataFrame()
        
        # Agrupa arquivos por pasta
        files_by_folder = {}
        for file_info in selected_files:
            folder = file_info.get('folder', 'root')
            if folder not in files_by_folder:
                files_by_folder[folder] = []
            files_by_folder[folder].append(file_info)
        
        logger.info(f"Total de pastas a processar: {len(files_by_folder)}")
        
        # ETAPA 1: Mescla arquivos dentro de cada pasta
        merged_by_folder = {}
        total_folders = len(files_by_folder)
        
        for idx, (folder, files) in enumerate(files_by_folder.items()):
            if progress_callback:
                progress_callback(f"Mesclando pasta {idx+1}/{total_folders}: {folder}")
            
            merged_df = self._merge_files_from_same_folder(files, folder)
            if not merged_df.empty:
                merged_by_folder[folder] = merged_df
        
        if not merged_by_folder:
            logger.warning("Nenhuma pasta gerou dados válidos")
            return pd.DataFrame()
        
        logger.info(f"Pastas consolidadas: {len(merged_by_folder)}")
        
        # ETAPA 2: Mescla dados de diferentes pastas por CPF/Nome+Equipe
        # Dicionário para armazenar dados consolidados
        # Chave: CPF ou NOME|EQUIPE
        consolidated_data = {}
        
        folder_idx = 0
        for folder, df in merged_by_folder.items():
            folder_idx += 1
            
            if progress_callback:
                progress_callback(f"Consolidando pasta {folder_idx}/{total_folders}: {folder}")
            
            logger.info(f"Processando pasta consolidada: {folder} ({len(df)} linhas)")
            
            # Identifica colunas disponíveis
            has_cpf = 'CPF' in df.columns
            has_nome = 'Nome' in df.columns
            has_equipe = 'Equipe' in df.columns
            
            # Filtra linhas inválidas (Resumo, Total, valores numéricos no Nome)
            if has_nome:
                original_len = len(df)
                # Remove linhas com valores específicos de resumo
                df = df[~df['Nome'].astype(str).str.strip().str.upper().isin(['RESUMO', 'TOTAL'])]
                # Remove linhas onde Nome é apenas números (ex: "123")
                df = df[~df['Nome'].astype(str).str.strip().str.match(r'^\d+$', na=False)]
                # Remove linhas completamente vazias no Nome
                df = df[df['Nome'].notna()]
                df = df[df['Nome'].astype(str).str.strip() != '']
                
                filtered_count = original_len - len(df)
                if filtered_count > 0:
                    logger.info(f"Filtradas {filtered_count} linhas inválidas (Resumo/Total/vazias)")
            
            processed_rows = 0
            skipped_rows = 0
            
            for idx, row in df.iterrows():
                    key = None
                    
                    # Prioriza CPF como chave
                    if has_cpf:
                        cpf = self._extract_cpf(row.get('CPF'))
                        if cpf:
                            key = f"CPF:{cpf}"
                    
                    # Se não tem CPF, usa NOME+EQUIPE
                    if not key and has_nome and has_equipe:
                        composite = self._create_composite_key(row)
                        if composite:
                            key = f"COMP:{composite}"
                    
                    if not key:
                        skipped_rows += 1
                        continue
                    
                    processed_rows += 1
                    
                    # Inicializa registro se não existe
                    if key not in consolidated_data:
                        consolidated_data[key] = {
                            'CPF': self._extract_cpf(row.get('CPF')) if has_cpf else None,
                            'Nome': row.get('Nome', ''),
                            'Equipe': row.get('Equipe', ''),
                            '_source_files': []
                        }
                    
                    # Adiciona informação da fonte (nome da pasta)
                    source_label = folder if folder != 'root' else 'Raiz'
                    if source_label not in consolidated_data[key]['_source_files']:
                        consolidated_data[key]['_source_files'].append(source_label)
                    
                    # Adiciona nome do arquivo fonte na coluna da pasta
                    if folder and folder != 'root':
                        folder_col = f"Arquivo_{folder}"
                        arquivo_fonte = row.get('_arquivo_fonte', '')
                        if folder_col not in consolidated_data[key]:
                            consolidated_data[key][folder_col] = set()
                        if arquivo_fonte:
                            consolidated_data[key][folder_col].add(arquivo_fonte)
                    
                    # Mescla dados de todas as colunas
                    for col in df.columns:
                        if col in ['Nome', 'Equipe', 'CPF', '_arquivo_fonte']:
                            continue
                        
                        value = row.get(col)
                        
                        # Pula valores vazios
                        if pd.isna(value) or value == '':
                            continue
                        
                        # Detecta se é coluna de data (formato: "Dia, DD/MM/AAAA")
                        is_date_col = False
                        if isinstance(value, str):
                            # Verifica padrão de data do PontoMais
                            date_pattern = r'^(Seg|Ter|Qua|Qui|Sex|Sáb|Sab|Dom),?\s*\d{2}/\d{2}/\d{4}'
                            if re.match(date_pattern, value):
                                is_date_col = True
                        
                        # Se é coluna de data, unifica em uma única coluna "Data"
                        if is_date_col:
                            col_name = 'Data'
                        else:
                            # Cria nome de coluna único por PASTA (não por arquivo)
                            col_name = f"{col}_{folder}" if folder else col
                        
                        # Armazena o valor (se já existe, mantém o primeiro)
                        if col_name not in consolidated_data[key]:
                            consolidated_data[key][col_name] = value
                
            logger.info(f"Pasta '{folder}' processada: {processed_rows} linhas válidas, {skipped_rows} linhas ignoradas")
        
        # Converte para DataFrame
        if not consolidated_data:
            return pd.DataFrame()
        
        result_df = pd.DataFrame.from_dict(consolidated_data, orient='index')
        
        # Converte lista de arquivos fonte em string
        result_df['_source_files'] = result_df['_source_files'].apply(lambda x: '; '.join(sorted(x)) if isinstance(x, (list, set)) else x)
        
        # Converte sets de arquivos por pasta em strings
        for col in result_df.columns:
            if col.startswith('Arquivo_'):
                result_df[col] = result_df[col].apply(lambda x: '; '.join(sorted(x)) if isinstance(x, (list, set)) else x)
        
        # Preenche valores em branco com dados de outras linhas do mesmo CPF/Nome+Equipe
        logger.info("Preenchendo valores em branco...")
        result_df = self._fill_missing_values(result_df)
        
        # Reorganiza colunas: CPF, Nome, Equipe primeiro, depois Data, depois colunas Arquivo_*
        cols = ['CPF', 'Nome', 'Equipe']
        if 'Data' in result_df.columns:
            cols.append('Data')
        
        # Adiciona colunas de arquivos por pasta (Arquivo_*)
        arquivo_cols = sorted([c for c in result_df.columns if c.startswith('Arquivo_')])
        cols.extend(arquivo_cols)
        
        cols.append('_source_files')
        
        # Outras colunas
        other_cols = [c for c in result_df.columns if c not in cols]
        result_df = result_df[cols + sorted(other_cols)]
        
        logger.info(f"Base consolidada criada: {len(result_df)} registros únicos")
        
        return result_df
    
    def export_merged_data(self, df: pd.DataFrame, output_filename: str = "base_bi_consolidada.csv") -> str:
        """Exporta DataFrame consolidado para CSV na pasta raiz configurada"""
        root_folder = self._get_root_folder()
        output_path = os.path.join(root_folder, output_filename)
        
        # Garante que o diretório existe
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        df.to_csv(output_path, index=False, encoding='utf-8-sig')
        logger.info(f"Base BI exportada: {output_path}")
        return output_path
