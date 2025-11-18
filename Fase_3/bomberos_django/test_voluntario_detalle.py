import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from voluntarios.models import Voluntario
from voluntarios.serializers import VoluntarioSerializer

print("="*80)
print("PROBANDO CAMPOS DE VOLUNTARIO")
print("="*80)

# Obtener el primer voluntario activo
voluntario = Voluntario.objects.filter(estado_bombero='activo').first()

if voluntario:
    print(f"\n[VOLUNTARIO ENCONTRADO]")
    print(f"ID: {voluntario.id}")
    print(f"Nombre (modelo): {voluntario.nombre}")
    print(f"Apellido Paterno (modelo): {voluntario.apellido_paterno}")
    print(f"Clave Bombero (modelo): {voluntario.clave_bombero}")
    print(f"RUT (modelo): {voluntario.rut}")
    
    # Serializar
    serializer = VoluntarioSerializer(voluntario)
    data = serializer.data
    
    print(f"\n[CAMPOS EN EL SERIALIZER]")
    print("Campos relacionados con nombre:")
    for key in data.keys():
        if 'nombre' in key.lower() or 'apellido' in key.lower():
            print(f"  {key}: {data[key]}")
    
    print("\nCampos relacionados con clave:")
    for key in data.keys():
        if 'clave' in key.lower() or 'numero' in key.lower():
            print(f"  {key}: {data[key]}")
    
    print("\nCampos relacionados con RUT:")
    for key in data.keys():
        if 'rut' in key.lower() or 'run' in key.lower():
            print(f"  {key}: {data[key]}")
    
    print("\n[TODOS LOS CAMPOS]")
    for key in sorted(data.keys()):
        valor = str(data[key])[:50]  # Primeros 50 caracteres
        print(f"  {key}: {valor}")
else:
    print("[ERROR] No hay voluntarios activos")

print("\n" + "="*80)
