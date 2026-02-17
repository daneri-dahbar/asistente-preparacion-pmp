import re
import os

def process_inline_formatting(text):
    # Bold: **text** -> \textbf{text}
    text = re.sub(r'\*\*(.*?)\*\*', r'\\textbf{\1}', text)
    # Italic: *text* -> \textit{text}
    text = re.sub(r'\*(.*?)\*', r'\\textit{\1}', text)
    # Code: `text` -> \texttt{text}
    text = re.sub(r'`(.*?)`', r'\\texttt{\1}', text)
    return text

def convert_table(table_block):
    lines = table_block.strip().split('\n')
    if len(lines) < 3:
        return table_block

    # Parse header
    header = lines[0].strip('|').split('|')
    header = [process_inline_formatting(h.strip()) for h in header if h.strip()]
    
    # Parse body
    body_rows = []
    for line in lines[2:]:
        # Split by pipe but handle empty cells carefully
        raw_cells = line.strip().strip('|').split('|')
        row = [process_inline_formatting(c.strip()) for c in raw_cells]
        body_rows.append(row)

    num_cols = len(header)
    header_text = "".join(header).lower()
    
    # Heuristics for column widths
    if num_cols == 5:
         # Roadmap: Sprint | Fechas | Foco | Epicas | Estado
         # | l | l | X | l | l |
         col_def = '|l|l|X|l|l|'
    elif num_cols == 4:
         # Backlog: ID | Historia | Prioridad | Estimación
         # | l | X | l | l |
         col_def = '|l|X|l|l|'
    elif num_cols == 3:
         col_def = '|l|X|l|'
    else:
         col_def = '|' + 'l|' * (num_cols - 1) + 'X|'
    
    latex = []
    latex.append(r'\begin{table}[h]')
    latex.append(r'\centering')
    latex.append(r'\begin{tabularx}{\textwidth}{' + col_def + '}')
    latex.append(r'\hline')
    
    # Header
    latex.append(' & '.join([r'\textbf{' + h + '}' for h in header]) + r' \\')
    latex.append(r'\hline')
    
    # Body
    for row in body_rows:
        if len(row) < num_cols:
            row += [''] * (num_cols - len(row))
        elif len(row) > num_cols:
            row = row[:num_cols]
        latex.append(' & '.join(row) + r' \\')
        latex.append(r'\hline')
        
    latex.append(r'\end{tabularx}')
    # Add caption based on content context if possible, otherwise generic
    if "sprint" in header_text and "fechas" in header_text:
        latex.append(r'\caption{Cronograma de Alto Nivel del Proyecto}')
    elif "historia" in header_text and "estimación" in header_text:
        latex.append(r'\caption{Backlog del Sprint}')
    latex.append(r'\end{table}')
    
    return '\n'.join(latex)

def markdown_to_latex(content):
    lines = content.split('\n')
    latex_lines = []
    in_list = False
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
        
        if is_list_item:
            if not in_list:
                latex_lines.append(r'\begin{itemize}')
                in_list = True
            
            item_content = re.sub(r'^[\*\-]\s+', '', stripped)
            item_content = process_inline_formatting(item_content)
            latex_lines.append(r'\item ' + item_content)
            continue
        
        if in_list and not is_list_item and stripped:
             latex_lines.append(r'\end{itemize}') 
             in_list = False

        if in_list and not stripped:
            if in_list:
                 latex_lines.append(r'\end{itemize}')
                 in_list = False

        # Regular text
        if stripped:
            latex_lines.append(process_inline_formatting(stripped))
        else:
            latex_lines.append('')

    if in_list:
         latex_lines.append(r'\end{itemize}')

    if in_table: # flush pending table at end of file
        latex_lines.append(convert_table('\n'.join(table_buffer)))

    return '\n'.join(latex_lines)

def main():
    input_path = r'c:\Proyectos\asistente-preparacion-pmp\docs\informe_final\ANEXO-B.md'
    output_path = r'c:\Proyectos\asistente-preparacion-pmp\docs\informe_final\ANEXO-B.tex'
    
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
