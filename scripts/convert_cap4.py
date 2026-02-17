import re
import os

def escape_latex(text):
    """Escapes special LaTeX characters in text mode."""
    replacements = {
        '\\': r'\textbackslash{}', # Handle backslash first
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
    # Use a regex to replace all at once to avoid double escaping
    # We need to be careful with order, but regex OR is greedy.
    # Backslash must be escaped first if we iterated, but regex sub handles it if mapped correctly.
    
    # Sort keys by length desc to match longest first if needed (not needed for single chars)
    keys = sorted(replacements.keys(), key=len, reverse=True)
    pattern = re.compile('|'.join(re.escape(key) for key in keys))
    return pattern.sub(lambda m: replacements[m.group(0)], text)

def parse_markdown_table(table_lines):
    """Converts a list of markdown table lines to a LaTeX tabular environment."""
    if not table_lines:
        return ""
    
    headers = [h.strip() for h in table_lines[0].strip('|').split('|')]
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
    latex.append(r"\end{table}")
    
    return "\n".join(latex)

def process_inline_formatting(text):
    placeholders = []
    
    def store_placeholder(match, type_):
        content = match.group(1)
        pid = f"XYZPH{len(placeholders)}END"
        placeholders.append({'id': pid, 'content': content, 'type': type_})
        return pid

    # Code `...`
    text = re.sub(r'`([^`]*)`', lambda m: store_placeholder(m, 'code'), text)
    
    # Bold **...**
    text = re.sub(r'\*\*([^*]*)\*\*', lambda m: store_placeholder(m, 'bold'), text)
    
    # Italic *...*
    text = re.sub(r'\*([^*]*)\*', lambda m: store_placeholder(m, 'italic'), text)
    
    # Escape the rest
    text = escape_latex(text)
    
    # Restore in reverse order to handle nesting (inner placeholders are created first)
    for p in reversed(placeholders):
        pid = p['id']
        content = p['content']
        type_ = p['type']
        
        if type_ == 'code':
            # Code inside texttt should be escaped too
            safe_content = escape_latex(content) 
            replacement = r'\texttt{' + safe_content + '}'
        elif type_ == 'bold':
            replacement = r'\textbf{' + escape_latex(content) + '}'
        elif type_ == 'italic':
            replacement = r'\textit{' + escape_latex(content) + '}'
            
        text = text.replace(pid, replacement)
        
    return text

def convert_md_to_tex(input_path, output_path):
    with open(input_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    tex_lines = []
    in_code_block = False
    in_table = False
    table_buffer = []
    in_list = False
    list_type = None 

    i = 0
    while i < len(lines):
        line = lines[i].rstrip()
        
        # CODE BLOCKS
        if line.startswith('```'):
            if in_code_block:
                tex_lines.append(r"\end{minted}")
                in_code_block = False
            else:
                lang = line.strip('`').strip()
                if not lang: lang = "text"
                tex_lines.append(r"\begin{minted}{" + lang + "}")
                in_code_block = True
            i += 1
            continue
            
        if in_code_block:
            tex_lines.append(line)
            i += 1
            continue

        # TABLES
        if line.strip().startswith('|'):
            if in_list:
                tex_lines.append(r"\end{" + list_type + "}")
                in_list = False
            
            in_table = True
            table_buffer.append(line)
            i += 1
            continue
        elif in_table:
            tex_lines.append(parse_markdown_table(table_buffer))
            table_buffer = []
            in_table = False
        
        # HEADERS
        header_match = re.match(r'^(#+)\s+(.*)', line)
        if header_match:
            if in_list:
                tex_lines.append(r"\end{" + list_type + "}")
                in_list = False
            
            level = len(header_match.group(1))
            text = escape_latex(header_match.group(2))
            if level == 1:
                tex_lines.append(r"\chapter{" + text + "}")
            elif level == 2:
                tex_lines.append(r"\section{" + text + "}")
            elif level == 3:
                tex_lines.append(r"\subsection{" + text + "}")
            elif level == 4:
                tex_lines.append(r"\subsubsection{" + text + "}")
            else:
                tex_lines.append(r"\paragraph{" + text + "}")
            i += 1
            continue

        # LISTS
        is_unordered = re.match(r'^\s*[\*\-]\s+(.*)', line)
        is_ordered = re.match(r'^\s*\d+\.\s+(.*)', line)
        
        if is_unordered or is_ordered:
            new_list_type = 'itemize' if is_unordered else 'enumerate'
            item_text = is_unordered.group(1) if is_unordered else is_ordered.group(1)
            
            if not in_list:
                tex_lines.append(r"\begin{" + new_list_type + "}")
                in_list = True
                list_type = new_list_type
            elif list_type != new_list_type:
                tex_lines.append(r"\end{" + list_type + "}")
                tex_lines.append(r"\begin{" + new_list_type + "}")
                list_type = new_list_type
            
            processed_text = process_inline_formatting(item_text)
            tex_lines.append(r"\item " + processed_text)
            i += 1
            continue
        
        # BLOCKQUOTES / FIGURES / CAPTIONS
        if line.startswith('>'):
            if in_list:
                tex_lines.append(r"\end{" + list_type + "}")
                in_list = False

            content = line.lstrip('> ').strip()
            if content.startswith('**[Figura') or content.startswith('**[Tabla'):
                caption_match = re.match(r'\*\*\[(.*?): (.*?)\]\*\*', content)
                if caption_match:
                    label_type = caption_match.group(1) 
                    caption_text = caption_match.group(2)
                    
                    env_type = "figure" if "Figura" in label_type else "table"
                    tex_lines.append(r"\begin{" + env_type + "}[H]")
                    tex_lines.append(r"\centering")
                    tex_lines.append(r"% \includegraphics[width=0.8\textwidth]{placeholder.png}")
                    tex_lines.append(r"\caption{" + escape_latex(caption_text) + "}")
                    label_safe = label_type.replace(' ', '_').lower()
                    tex_lines.append(r"\label{" + escape_latex(label_safe) + "}")
                    tex_lines.append(r"\end{" + env_type + "}")
                else:
                    tex_lines.append(r"\begin{quote}")
                    tex_lines.append(process_inline_formatting(content))
                    tex_lines.append(r"\end{quote}")
            elif content.startswith('*Sugerencia'):
                tex_lines.append(r"\textit{" + process_inline_formatting(content) + "}")
            else:
                 tex_lines.append(r"\begin{quote}")
                 tex_lines.append(process_inline_formatting(content))
                 tex_lines.append(r"\end{quote}")
            i += 1
            continue

        # NORMAL TEXT
        if line.strip() == "":
            if in_list:
                # Keep list open on empty line
                tex_lines.append("")
            else:
                tex_lines.append("") 
        else:
            processed = process_inline_formatting(line)
            # If in list, append to last item or just output?
            # Standard latex: text after item is part of item.
            tex_lines.append(processed)
        
        i += 1
    
    if in_list:
         tex_lines.append(r"\end{" + list_type + "}")

    with open(output_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(tex_lines))

if __name__ == "__main__":
    md_file = r"c:\Proyectos\asistente-preparacion-pmp\docs\informe_final\CAPITULO-4.md"
    tex_file = r"c:\Proyectos\asistente-preparacion-pmp\docs\informe_final\CAPITULO-4.tex"
    print(f"Converting {md_file} to {tex_file}...")
    convert_md_to_tex(md_file, tex_file)
    print("Done.")
