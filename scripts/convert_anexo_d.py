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
    text = text.replace('🔒', r'\faLock') # Requires fontawesome
    text = text.replace('🎓', r'\faGraduationCap')
    text = text.replace('🧠', r'\faBrain')
    text = text.replace('👶', r'\faChild')
    text = text.replace('🍼', r'\faChild')
    text = text.replace('⚖️', r'\faBalanceScale')
    text = text.replace('💼', r'\faBriefcase')
    text = text.replace('📚', r'\faBook')
    text = text.replace('🎭', r'\faExclamationTriangle')
    text = text.replace('🛠️', r'\faWrench')
    text = text.replace('📝', r'\faPencilSquareO')
    text = text.replace('🥊', r'\faGavel')
    text = text.replace('🧮', r'\faCalculator')
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

    if "modo" in header_text and "icono" in header_text:
        col_def = '|l|c|X|'
        caption = "Modos de Conversación Disponibles"
        label = "tab:modos_chat"
    else:
        # Fallback
        col_def = '|' + 'l|' * (num_cols - 1) + 'X|'
        caption = "Tabla"
        label = "tab:default"
    
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

def close_list_if_open(latex_lines, in_list):
    if in_list:
        # Find the last opened list environment to close it correctly
        # This is a simplified approach assuming we close the most recent one
        # A more robust stack-based approach would be better for nested lists, 
        # but for this file depth=2 is max usually.
        
        # We search backwards for the last begin
        last_begin_itemize = -1
        last_begin_enumerate = -1
        
        for i in range(len(latex_lines) - 1, -1, -1):
            if r'\begin{itemize}' in latex_lines[i]:
                last_begin_itemize = i
                break
        
        for i in range(len(latex_lines) - 1, -1, -1):
            if r'\begin{enumerate}' in latex_lines[i]:
                last_begin_enumerate = i
                break
        
        # If we found an itemize that is more recent (higher index) than enumerate, close itemize
        if last_begin_itemize > last_begin_enumerate:
             latex_lines.append(r'\end{itemize}')
        elif last_begin_enumerate > last_begin_itemize:
             latex_lines.append(r'\end{enumerate}')
        else:
             # Default fallback if somehow lost
             latex_lines.append(r'\end{itemize}')
             
        return False
    return in_list

def markdown_to_latex(content):
    lines = content.split('\n')
    latex_lines = []
    in_list = False
    current_list_type = None  # 'itemize' or 'enumerate'
    in_quote = False
    in_table = False
    table_buffer = []

    for line in lines:
        stripped = line.strip()
        
        # Handle Tables
        if stripped.startswith('|'):
            in_list = close_list_if_open(latex_lines, in_list)
            in_table = True
            table_buffer.append(line)
            continue
        elif in_table:
            in_table = False
            latex_lines.append(convert_table('\n'.join(table_buffer)))
            table_buffer = []

        # Handle Blockquotes
        if stripped.startswith('> '):
            in_list = close_list_if_open(latex_lines, in_list)
            if not in_quote:
                latex_lines.append(r'\begin{quote}')
                in_quote = True
            quote_content = stripped[2:].strip()
            latex_lines.append(process_inline_formatting(quote_content))
            continue
        elif in_quote:
            latex_lines.append(r'\end{quote}')
            in_quote = False

        # Handle Headers
        if line.startswith('#'):
            in_list = close_list_if_open(latex_lines, in_list)
            if line.startswith('# '):
                latex_lines.append(r'\chapter{' + line[2:].strip() + '}')
            elif line.startswith('## '):
                latex_lines.append(r'\section{' + line[3:].strip() + '}')
            elif line.startswith('### '):
                latex_lines.append(r'\subsection{' + line[4:].strip() + '}')
            elif line.startswith('#### '):
                latex_lines.append(r'\subsubsection{' + line[5:].strip() + '}')
            continue

        # Handle Lists
        is_list_item = stripped.startswith('* ') or stripped.startswith('- ')
        is_enum_item = re.match(r'^\d+\.\s', stripped)

        if is_list_item or is_enum_item:
            new_list_type = 'itemize' if is_list_item else 'enumerate'
            
            # Switch list type if needed
            if in_list and current_list_type != new_list_type:
                in_list = close_list_if_open(latex_lines, in_list)
            
            if not in_list:
                latex_lines.append(r'\begin{itemize}' if is_list_item else r'\begin{enumerate}')
                current_list_type = new_list_type
                in_list = True
            
            item_content = re.sub(r'^[\*\-]\s+', '', stripped) if is_list_item else re.sub(r'^\d+\.\s+', '', stripped)
            item_content = process_inline_formatting(item_content)
            latex_lines.append(r'\item ' + item_content)
            continue
        
        # If we are in a list but the line is empty or text, we might need to close it
        # BUT, sometimes text is a continuation of the bullet.
        # For this specific document, blank lines usually mean end of list.
        if in_list and not (is_list_item or is_enum_item):
             if not stripped: # Empty line
                 in_list = close_list_if_open(latex_lines, in_list)
             else:
                 # It's text. In standard markdown this might be continuation.
                 # But in our simple parser, we'll treat it as new paragraph and close list to be safe
                 # OR we can append it to previous item. 
                 # Let's close it to avoid formatting errors.
                 in_list = close_list_if_open(latex_lines, in_list)
                 latex_lines.append(process_inline_formatting(stripped))
             continue

        # Regular text
        if stripped:
            latex_lines.append(process_inline_formatting(stripped))
        else:
            latex_lines.append('')

    # Final cleanup
    in_list = close_list_if_open(latex_lines, in_list)
    
    if in_quote:
        latex_lines.append(r'\end{quote}')
    
    if in_table:
        latex_lines.append(convert_table('\n'.join(table_buffer)))

    return '\n'.join(latex_lines)

def main():
    input_path = r'c:\Proyectos\asistente-preparacion-pmp\docs\informe_final\ANEXO-D.md'
    output_path = r'c:\Proyectos\asistente-preparacion-pmp\docs\informe_final\ANEXO-D.tex'
    
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
