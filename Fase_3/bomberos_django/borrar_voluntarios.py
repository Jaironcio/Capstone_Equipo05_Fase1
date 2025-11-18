#!/usr/bin/env python
"""Script para borrar todos los voluntarios de la base de datos"""
import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(__file__))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from voluntarios.models import Voluntario

# Borrar todos los voluntarios
count = Voluntario.objects.count()
print(f"[INFO] Voluntarios actuales: {count}")

if count > 0:
    Voluntario.objects.all().delete()
    print(f"[SUCCESS] {count} voluntarios eliminados")
else:
    print("[INFO] No hay voluntarios para eliminar")

# Verificar
count_after = Voluntario.objects.count()
print(f"[INFO] Voluntarios restantes: {count_after}")
