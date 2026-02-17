import re
import os

def escape_latex(text):
    """Escapes special LaTeX characters in text mode."""
    replacements = {
        '\\': r'\textbackslash{}',
        '&': r'\&',
        '%': r'\%',
        '$': r'\$',
        '#': r'\#',
        '_': r'\_',
        '{': r'\{',
        '}': r'\}',
        '~': r'\textasciitilde{}',
        '^': r'\textasciicircum{}',
    }
    keys = sorted(replacements.keys(), key=len, reverse=True)
    pattern = re.compile('|'.join(re.escape(key) for key in keys))
    return pattern.sub(lambda m: replacements[m.group(0)], text)

def process_inline_formatting(text):
    placeholders = []
    
    def store_placeholder(match, type_):
        content = match.group(1)
        pid = f"XYZPH{len(placeholders)}END"
        placeholders.append({'id': pid, 'content': content, 'type': type_})
        return pid

    # Order matters: code, then bold, then italic
    text = re.sub(r'`([^`]*)`', lambda m: store_placeholder(m, 'code'), text)
    text = re.sub(r'\*\*([^*]*)\*\*', lambda m: store_placeholder(m, 'bold'), text)
    text = re.sub(r'\*([^*]*)\*', lambda m: store_placeholder(m, 'italic'), text)
    
    text = escape_latex(text)
    
    for p in reversed(placeholders):
        pid = p['id']
        content = p['content']
        type_ = p['type']
        
        if type_ == 'code':
            safe_content = escape_latex(content) 
            replacement = r'\texttt{' + safe_content + '}'
        elif type_ == 'bold':
            replacement = r'\textbf{' + escape_latex(content) + '}'
        elif type_ == 'italic':
            replacement = r'\textit{' + escape_latex(content) + '}'
            
        text = text.replace(pid, replacement)
        
    return text

def parse_markdown_table(table_lines):
    """Converts a list of markdown table lines to a LaTeX tabular environment."""
    if not table_lines:
        return ""
    
    headers = [h.strip() for h in table_lines[0].strip('|').split('|')]
    # Skip separator line (table_lines[1])
    rows = []
    for line in table_lines[2:]:
        row = [cell.strip() for cell in line.strip('|').split('|')]
        rows.append(row)
        
    num_cols = len(headers)
    
    latex = []
    latex.append(r"\begin{table}[H]")
    latex.append(r"\centering")
    latex.append(r"\small")
    
    latex.append(r"\begin{tabular}{" + "l" * num_cols + "}") 
    latex.append(r"\hline")
    
    # Header
    latex.append(" & ".join([r"\textbf{" + process_inline_formatting(h) + "}" for h in headers]) + r" \\")
    latex.append(r"\hline")
    
    # Rows
    for row in rows:
        while len(row) < num_cols:
            row.append("")
        escaped_row = [process_inline_formatting(cell) for cell in row]
        latex.append(" & ".join(escaped_row) + r" \\")
        latex.append(r"\hline")
        
    latex.append(r"\end{tabular}")
    latex.append(r"\caption{Cumplimiento de Objetivos}") # Hardcoded caption for this specific table
    latex.append(r"\label{tabla:objetivos}")
    latex.append(r"\end{table}")
    
    return "\n".join(latex)

def convert_md_to_tex(input_file, output_file):
    with open(input_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    tex_lines = []
    in_itemize = False
    in_enumerate = False
    in_table = False
    table_buffer = []
    
    for line in lines:
        line = line.rstrip()
        
        # Table detection
        if line.strip().startswith('|'):
            if not in_table:
                in_table = True
                table_buffer = []
                # Close lists if open
                if in_itemize: tex_lines.append(r"\end{itemize}"); in_itemize = False
                if in_enumerate: tex_lines.append(r"\end{enumerate}"); in_enumerate = False
            table_buffer.append(line)
            continue
        elif in_table:
            # Table ended
            in_table = False
            tex_lines.append(parse_markdown_table(table_buffer))
            table_buffer = []
        
        # Headers
        if line.startswith('# '):
            if in_itemize: tex_lines.append(r"\end{itemize}"); in_itemize = False
            if in_enumerate: tex_lines.append(r"\end{enumerate}"); in_enumerate = False
            tex_lines.append(r"\chapter{" + process_inline_formatting(line[2:]) + "}")
        elif line.startswith('## '):
            if in_itemize: tex_lines.append(r"\end{itemize}"); in_itemize = False
            if in_enumerate: tex_lines.append(r"\end{enumerate}"); in_enumerate = False
            tex_lines.append(r"\section{" + process_inline_formatting(line[3:]) + "}")
        elif line.startswith('### '):
            if in_itemize: tex_lines.append(r"\end{itemize}"); in_itemize = False
            if in_enumerate: tex_lines.append(r"\end{enumerate}"); in_enumerate = False
            tex_lines.append(r"\subsection{" + process_inline_formatting(line[4:]) + "}")
        elif line.startswith('#### '):
            if in_itemize: tex_lines.append(r"\end{itemize}"); in_itemize = False
            if in_enumerate: tex_lines.append(r"\end{enumerate}"); in_enumerate = False
            tex_lines.append(r"\subsubsection{" + process_inline_formatting(line[5:]) + "}")
            
        # Lists
        elif line.strip().startswith('* ') or line.strip().startswith('- '):
            if not in_itemize:
                if in_enumerate: tex_lines.append(r"\end{enumerate}"); in_enumerate = False
                tex_lines.append(r"\begin{itemize}")
                in_itemize = True
            content = line.strip()[2:]
            tex_lines.append(r"\item " + process_inline_formatting(content))
        elif re.match(r'^\d+\.', line.strip()):
            if not in_enumerate:
                if in_itemize: tex_lines.append(r"\end{itemize}"); in_itemize = False
                tex_lines.append(r"\begin{enumerate}")
                in_enumerate = True
            content = re.sub(r'^\d+\.\s*', '', line.strip())
            tex_lines.append(r"\item " + process_inline_formatting(content))
            
        # Empty lines / Paragraphs
        elif not line.strip():
            if in_itemize: tex_lines.append(r"\end{itemize}"); in_itemize = False
            if in_enumerate: tex_lines.append(r"\end{enumerate}"); in_enumerate = False
            tex_lines.append("")
        else:
            # Regular paragraph
            if in_itemize: tex_lines.append(r"\end{itemize}"); in_itemize = False
            if in_enumerate: tex_lines.append(r"\end{enumerate}"); in_enumerate = False
            tex_lines.append(process_inline_formatting(line))

    if in_itemize: tex_lines.append(r"\end{itemize}")
    if in_enumerate: tex_lines.append(r"\end{enumerate}")
    if in_table: tex_lines.append(parse_markdown_table(table_buffer))
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write("\n".join(tex_lines))
        
    print(f"Done. Converted {input_file} to {output_file}")

if __name__ == "__main__":
    convert_md_to_tex(
        r"c:\Proyectos\asistente-preparacion-pmp\docs\informe_final\CAPITULO-7.md",
        r"c:\Proyectos\asistente-preparacion-pmp\docs\informe_final\CAPITULO-7.tex"
    )
