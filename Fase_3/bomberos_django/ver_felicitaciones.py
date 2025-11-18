"""
Script para ver las felicitaciones de un voluntario en la base de datos
"""
import os
import sys

# Agregar el directorio actual al path
sys.path.insert(0, os.path.dirname(__file__))
os.chdir(os.path.dirname(__file__))

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bomberos_django.settings')

import django
django.setup()

from voluntarios.models import Felicitacion, Voluntario

print("\n" + "="*80)
print("🏆 FELICITACIONES REGISTRADAS EN LA BASE DE DATOS")
print("="*80 + "\n")

# Contar total
total = Felicitacion.objects.count()
print(f"📊 Total de felicitaciones: {total}\n")

if total == 0:
    print("❌ No hay felicitaciones registradas")
else:
    # Mostrar todas las felicitaciones
    felicitaciones = Felicitacion.objects.all().select_related('voluntario', 'created_by')
    
    for i, fel in enumerate(felicitaciones, 1):
        print(f"{'─'*80}")
        print(f"🏅 FELICITACIÓN #{i}")
        print(f"{'─'*80}")
        print(f"  ID: {fel.id}")
        print(f"  Voluntario: {fel.voluntario.nombre} {fel.voluntario.apellido_paterno}")
        print(f"  Clave: {fel.voluntario.clave_bombero}")
        print(f"  Tipo: {fel.get_tipo_felicitacion_display()}")
        if fel.nombre_felicitacion:
            print(f"  Nombre personalizado: {fel.nombre_felicitacion}")
        print(f"  Fecha felicitación: {fel.fecha_felicitacion}")
        print(f"  Oficio N°: {fel.oficio_numero}")
        if fel.fecha_oficio:
            print(f"  Fecha oficio: {fel.fecha_oficio}")
        if fel.compania_otorgante:
            print(f"  Compañía: {fel.compania_otorgante}")
        if fel.autoridad_otorgante:
            print(f"  Autoridad: {fel.autoridad_otorgante}")
        print(f"  Motivo: {fel.motivo[:100]}{'...' if len(fel.motivo) > 100 else ''}")
        print(f"  Documento: {'Sí' if fel.documento_felicitacion else 'No'}")
        print(f"  Registrado por: {fel.created_by.username if fel.created_by else 'N/A'}")
        print(f"  Fecha registro: {fel.created_at.strftime('%d/%m/%Y %H:%M')}")
        print()

print("\n" + "="*80)
print("💡 INFORMACIÓN:")
print("="*80)
print("  📂 Tabla en BD: voluntarios_felicitacion")
print("  🔑 Campos principales:")
print("     - id: ID de la felicitación")
print("     - voluntario_id: ID del voluntario (FK a voluntarios_voluntario)")
print("     - tipo_felicitacion: destacado, merito, valor, servicio, antiguedad, otra")
print("     - nombre_felicitacion: nombre personalizado (solo si tipo = 'otra')")
print("     - fecha_felicitacion: fecha de la felicitación")
print("     - oficio_numero: número de documento")
print("     - motivo: descripción del mérito")
print("     - created_at: fecha de registro en el sistema")
print("     - created_by_id: ID del usuario que registró (FK a auth_user)")
print("="*80 + "\n")
