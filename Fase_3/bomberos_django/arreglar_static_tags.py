#!/usr/bin/env python
"""
Script para arreglar los tags {% static %} en todos los templates
Quita los backslashes que están de más
"""
import os
import re

def arreglar_template(filepath):
    """Arregla los tags static en un HTML"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Reemplazar {% static \'...\' %} por {% static '...' %}
    content = re.sub(r"{%\s*static\s*\\'(.+?)\\'\s*%}", r"{% static '\1' %}", content)
    
    # Guardar
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"ARREGLADO - {filepath}")

def main():
    templates_dir = 'templates'
    
    # Recorrer todos los archivos HTML
    for root, dirs, files in os.walk(templates_dir):
        for file in files:
            if file.endswith('.html'):
                filepath = os.path.join(root, file)
                try:
                    arreglar_template(filepath)
                except Exception as e:
                    print(f"ERROR en {filepath}: {e}")
    
    print("\nTodos los templates arreglados!")

if __name__ == '__main__':
    main()
