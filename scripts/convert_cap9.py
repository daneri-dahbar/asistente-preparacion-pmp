import re
import os

def process_inline_formatting(text):
    # Bold: **text** -> \textbf{text}
    text = re.sub(r'\*\*(.*?)\*\*', r'\\textbf{\1}', text)
    # Italic: *text* -> \textit{text}
    text = re.sub(r'\*(.*?)\*', r'\\textit{\1}', text)
    return text

def convert_table(table_block):
    lines = table_block.strip().split('\n')
    if len(lines) < 3:
        return table_block # Not a valid table

    # Parse header
    header = lines[0].strip('|').split('|')
    header = [process_inline_formatting(h.strip()) for h in header]
    
    # Parse alignment (skip lines[1])
    
    # Parse body
    body_rows = []
    for line in lines[2:]:
        row = line.strip('|').split('|')
        row = [process_inline_formatting(c.strip()) for c in row]
        body_rows.append(row)

    # Generate LaTeX
    num_cols = len(header)
    col_def = '|' + 'p{4cm}|' * (num_cols - 1) + 'X|' # Use tabularx for the last column to fill width
    
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
        latex.append(' & '.join(row) + r' \\')
        latex.append(r'\hline')
        
    latex.append(r'\end{tabularx}')
    latex.append(r'\caption{Verificación de cumplimiento de objetivos}')
    latex.append(r'\label{tab:objetivos}')
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
             # Check if it's a continuation of the list item or a new paragraph
             # Simple heuristic: if it's indented, maybe continuation. If blank line before, end list.
             # For now, let's assume non-list line ends list
             latex_lines.append(r'\end{itemize}' if latex_lines[-1].startswith(r'\item') and not re.match(r'^\d', latex_lines[-1]) else r'\end{enumerate}') # simplistic check
             in_list = False

        if in_list and not stripped:
            # Blank line inside list usually implies end of list item or list, 
            # but in simple markdown to latex, often blank line breaks list
            if in_list:
                 # Check previous line to decide environment
                 prev_env = r'\end{itemize}' # default
                 # Scan backwards to find start
                 for l in reversed(latex_lines):
                     if r'\begin{itemize}' in l:
                         prev_env = r'\end{itemize}'
                         break
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

    if in_list:
         # Check previous line to decide environment
         prev_env = r'\end{itemize}' # default
         # Scan backwards to find start
         for l in reversed(latex_lines):
             if r'\begin{itemize}' in l:
                 prev_env = r'\end{itemize}'
                 break
             if r'\begin{enumerate}' in l:
                 prev_env = r'\end{enumerate}'
                 break
         latex_lines.append(prev_env)

    return '\n'.join(latex_lines)

def main():
    input_path = r'c:\Proyectos\asistente-preparacion-pmp\docs\informe_final\CAPITULO-9.md'
    output_path = r'c:\Proyectos\asistente-preparacion-pmp\docs\informe_final\CAPITULO-9.tex'
    
    try:
        with open(input_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        latex_content = markdown_to_latex(content)
        
        # Add necessary preamble if this were a standalone file, but it's a chapter
        # So we just write the content
        
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(latex_content)
            
        print(f"Successfully converted {input_path} to {output_path}")
        
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    main()
