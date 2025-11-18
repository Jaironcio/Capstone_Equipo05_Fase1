import os
import sys
import django

sys.stdout.reconfigure(encoding='utf-8')

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from voluntarios.models import Voluntario

# Buscar a Cristian Vera
cristian = Voluntario.objects.filter(
    nombre__icontains='cristian',
    apellido_paterno__icontains='vera'
).first()

if cristian:
    print(f"ENCONTRADO: {cristian.nombre} {cristian.apellido_paterno} {cristian.apellido_materno}")
    print(f"Estado actual: {cristian.estado_bombero}")
    
    # Cambiar a activo
    cristian.estado_bombero = 'activo'
    cristian.antiguedad_congelada = False
    cristian.fecha_congelamiento = None
    cristian.save()
    
    print(f"OK CAMBIADO A: {cristian.estado_bombero}")
    print(f"ID: {cristian.id}")
else:
    print("ERROR: No se encontro a Cristian Vera")
