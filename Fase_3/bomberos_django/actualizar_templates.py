#!/usr/bin/env python
"""
Script para actualizar todos los templates HTML del p6p para usar Django static tags
"""
import os
import re

def actualizar_template(filepath):
    """Actualiza un archivo HTML para usar {% load static %} y {% static %}"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Si ya tiene {% load static %}, no hacer nada
    if '{% load static %}' in content:
        print(f"OK - {filepath} ya esta actualizado")
        return
    
    # Agregar {% load static %} al inicio
    if content.startswith('<!DOCTYPE'):
        content = '{% load static %}\n' + content
    else:
        content = '{% load static %}\n' + content
    
    # Reemplazar rutas de CSS
    content = re.sub(r'href="css/', r'href="{% static \'css/', content)
    content = re.sub(r'\.css"', r'.css\' %}"', content)
    
    # Reemplazar rutas de JS
    content = re.sub(r'src="js/', r'src="{% static \'js/', content)
    content = re.sub(r'\.js"', r'.js\' %}"', content)
    
    # Guardar
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"ACTUALIZADO - {filepath}")

def main():
    templates_dir = 'templates'
    
    # Recorrer todos los archivos HTML
    for root, dirs, files in os.walk(templates_dir):
        for file in files:
            if file.endswith('.html'):
                filepath = os.path.join(root, file)
                try:
                    actualizar_template(filepath)
                except Exception as e:
                    print(f"ERROR en {filepath}: {e}")
    
    print("\nTodos los templates actualizados!")

if __name__ == '__main__':
    main()
