import re
import os

def process_inline_formatting(text):
    # Bold: **text** -> \textbf{text}
    text = re.sub(r'\*\*(.*?)\*\*', r'\\textbf{\1}', text)
    # Italic: *text* -> \textit{text}
    text = re.sub(r'\*(.*?)\*', r'\\textit{\1}', text)
    # Code: `text` -> \texttt{text}
    text = re.sub(r'`(.*?)`', r'\\texttt{\1}', text)
    # Checkbox [x] -> \textbf{[x]}
    text = text.replace('[x]', r'\textbf{[x]}')
    text = text.replace('[ ]', r'\textbf{[ ]}')
    # Symbols
    text = text.replace('✅', r'\checkmark')
    text = text.replace('⚠️', r'!')
    return text

def convert_table(table_block):
    lines = table_block.strip().split('\n')
    if len(lines) < 3:
        return table_block # Not a valid table

    # Parse header
    header = lines[0].strip('|').split('|')
    header = [process_inline_formatting(h.strip()) for h in header if h.strip()]
    
    # Parse body
    body_rows = []
    for line in lines[2:]:
        row = line.strip().strip('|').split('|')
        row = [process_inline_formatting(c.strip()) for c in row] # Keep empty cells
        body_rows.append(row)

    # Determine columns and definition
    num_cols = len(header)
    header_text = "".join(header).lower()

    if "tarea crítica" in header_text: # Fase 1 (4 cols)
        col_def = '|l|X|X|l|'
        caption = "Protocolo de Observación (Onboarding)"
        label = "tab:onboarding"
    elif "id" in header_text and "modo ia" in header_text: # Fase 2 (5 cols)
        # ID | Tarea | Modo | Objetivo | Resultado
        col_def = '|l|p{4cm}|l|X|p{4cm}|'
        caption = "Tareas de Estudio Dirigido"
        label = "tab:tareas_estudio"
    elif "métrica" in header_text: # Rendimiento (5 cols)
        # Métrica | Definición | Obj | Obt | Estado
        col_def = '|l|X|l|l|l|'
        caption = "Métricas de Rendimiento"
        label = "tab:rendimiento"
    elif "control de seguridad" in header_text: # Seguridad (4 cols)
        # ID | Control | Método | Resultado
        col_def = '|l|l|X|l|'
        caption = "Checklist de Seguridad (OWASP Top 10 LLM)"
        label = "tab:seguridad"
    elif "heurística" in header_text: # Usabilidad (3 cols)
        # Heurística | Observación | Cumplimiento
        col_def = '|l|X|l|'
        caption = "Evaluación Heurística de Usabilidad"
        label = "tab:usabilidad"
    else:
        # Fallback
        col_def = '|' + 'l|' * (num_cols - 1) + 'X|'
        caption = "Tabla de Evaluación"
        label = "tab:eval"
    
    latex = []
    latex.append(r'\begin{table}[h]')
    latex.append(r'\centering')
    latex.append(r'\begin{tabularx}{\textwidth}{' + col_def + '}')
    latex.append(r'\hline')
    
    # Header row
    latex.append(' & '.join([r'\textbf{' + h + '}' for h in header]) + r' \\')
    latex.append(r'\hline')
    
    # Body rows
    for row in body_rows:
        # Ensure row has same number of cols
        if len(row) < num_cols:
            row += [''] * (num_cols - len(row))
        elif len(row) > num_cols:
            row = row[:num_cols]
            
        latex.append(' & '.join(row) + r' \\')
        latex.append(r'\hline')
        
    latex.append(r'\end{tabularx}')
    latex.append(r'\caption{' + caption + '}')
    latex.append(r'\label{' + label + '}')
    latex.append(r'\end{table}')
    
    return '\n'.join(latex)

def markdown_to_latex(content):
    lines = content.split('\n')
    latex_lines = []
    in_list = False
    in_quote = False
    in_table = False
    table_buffer = []

    for line in lines:
        stripped = line.strip()
        
        # Handle Tables
        if stripped.startswith('|'):
            in_table = True
            table_buffer.append(line)
            continue
        elif in_table:
            in_table = False
            latex_lines.append(convert_table('\n'.join(table_buffer)))
            table_buffer = []

        # Handle Blockquotes
        if stripped.startswith('> '):
            if not in_quote:
                latex_lines.append(r'\begin{quote}')
                in_quote = True
            quote_content = stripped[2:].strip()
            # Handle prompt/result format in quotes
            if quote_content.startswith('**Prompt:**'):
                quote_content = r'\textbf{Prompt:} ' + quote_content[11:].strip()
            elif quote_content.startswith('**Resultado Esperado:**'):
                quote_content = r'\textbf{Resultado Esperado:} ' + quote_content[23:].strip()
                
            latex_lines.append(process_inline_formatting(quote_content))
            continue
        elif in_quote:
            # End quote if line doesn't start with >
            latex_lines.append(r'\end{quote}')
            in_quote = False

        # Handle Headers
        if line.startswith('# '):
            latex_lines.append(r'\chapter{' + line[2:].strip() + '}')
            continue
        elif line.startswith('## '):
            latex_lines.append(r'\section{' + line[3:].strip() + '}')
            continue
        elif line.startswith('### '):
            latex_lines.append(r'\subsection{' + line[4:].strip() + '}')
            continue
        elif line.startswith('#### '):
            latex_lines.append(r'\subsubsection{' + line[5:].strip() + '}')
            continue

        # Handle Lists
        is_list_item = stripped.startswith('* ') or stripped.startswith('- ')
        is_enum_item = re.match(r'^\d+\.\s', stripped)

        if is_list_item or is_enum_item:
            if not in_list:
                latex_lines.append(r'\begin{itemize}' if is_list_item else r'\begin{enumerate}')
                in_list = True
            
            item_content = re.sub(r'^[\*\-]\s+', '', stripped) if is_list_item else re.sub(r'^\d+\.\s+', '', stripped)
            item_content = process_inline_formatting(item_content)
            latex_lines.append(r'\item ' + item_content)
            continue
        
        if in_list and not (is_list_item or is_enum_item) and stripped:
             # End list
             prev_env = r'\end{itemize}' # default assumption
             # Scan backwards (simple heuristic)
             for l in reversed(latex_lines):
                 if r'\begin{itemize}' in l: break
                 if r'\begin{enumerate}' in l: 
                     prev_env = r'\end{enumerate}'
                     break
             latex_lines.append(prev_env)
             in_list = False

        # Regular text
        if stripped:
            latex_lines.append(process_inline_formatting(stripped))
        else:
            latex_lines.append('')

    # Close any open environments
    if in_list:
         prev_env = r'\end{itemize}'
         for l in reversed(latex_lines):
             if r'\begin{itemize}' in l: break
             if r'\begin{enumerate}' in l: 
                 prev_env = r'\end{enumerate}'
                 break
         latex_lines.append(prev_env)
    
    if in_quote:
        latex_lines.append(r'\end{quote}')
    
    if in_table:
        latex_lines.append(convert_table('\n'.join(table_buffer)))

    return '\n'.join(latex_lines)

def main():
    input_path = r'c:\Proyectos\asistente-preparacion-pmp\docs\informe_final\ANEXO-C.md'
    output_path = r'c:\Proyectos\asistente-preparacion-pmp\docs\informe_final\ANEXO-C.tex'
    
    try:
        with open(input_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        latex_content = markdown_to_latex(content)
        
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(latex_content)
            
        print(f"Successfully converted {input_path} to {output_path}")
        
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    main()
