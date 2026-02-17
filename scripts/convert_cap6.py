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

def convert_md_to_tex(input_file, output_file):
    with open(input_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    tex_lines = []
    in_itemize = False
    in_enumerate = False
    
    for line in lines:
        line = line.rstrip()
        
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
    
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write("\n".join(tex_lines))
        
    print(f"Done. Converted {input_file} to {output_file}")

if __name__ == "__main__":
    convert_md_to_tex(
        r"c:\Proyectos\asistente-preparacion-pmp\docs\informe_final\CAPITULO-6.md",
        r"c:\Proyectos\asistente-preparacion-pmp\docs\informe_final\CAPITULO-6.tex"
    )
