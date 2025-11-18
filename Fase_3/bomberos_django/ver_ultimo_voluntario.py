#!/usr/bin/env python
"""Script para ver el último voluntario creado"""
import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(__file__))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from voluntarios.models import Voluntario

voluntarios = Voluntario.objects.all().order_by('-created_at')

if voluntarios.exists():
    v = voluntarios.first()
    print(f"\n[INFO] Último voluntario creado:")
    print(f"  ID: {v.id}")
    print(f"  Nombre: {v.nombre} {v.apellido_paterno} {v.apellido_materno}")
    print(f"  Clave: {v.clave_bombero}")
    print(f"  RUT: {v.rut}")
    print(f"  Fecha Nacimiento: {v.fecha_nacimiento}")
    print(f"  Fecha Ingreso: {v.fecha_ingreso}")
    print(f"  Grupo Sanguíneo: {v.grupo_sanguineo}")
    print(f"  Nro Registro: {v.nro_registro}")
    print(f"  Profesión: {v.profesion}")
    print(f"  Compañía: {v.compania}")
    print(f"  Estado: {v.estado_bombero}")
    print(f"  Foto: {v.foto}")
    print(f"  Padrino 1: {v.nombre_primer_padrino}")
    print(f"  Padrino 2: {v.nombre_segundo_padrino}")
    
    if v.fecha_nacimiento:
        print(f"\n  Edad: {v.edad()} años")
    else:
        print(f"\n  Edad: NO SE PUEDE CALCULAR (fecha_nacimiento es None)")
    
    if v.fecha_ingreso:
        ant = v.antiguedad_detallada()
        print(f"  Antigüedad: {ant['años']} años, {ant['meses']} meses, {ant['dias']} días")
    else:
        print(f"  Antigüedad: NO SE PUEDE CALCULAR (fecha_ingreso es None)")
    
else:
    print("[INFO] No hay voluntarios en la base de datos")
