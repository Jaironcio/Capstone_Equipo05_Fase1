"""
Script para asignar cargos a voluntarios de ejemplo
Crea oficiales de compañía y deja otros como voluntarios normales
"""
import os
import django
from datetime import date

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from voluntarios.models import Voluntario, Cargo

# Cargos a asignar (basados en la Sexta Compañía)
cargos_asignar = [
    {
        'rut': '2.835.043-0',  # Héctor Guillermo Oñederra (40 años - Honorario Cuerpo)
        'tipo_cargo': 'compania',
        'nombre_cargo': 'Capitán',
        'anio': 2024,
        'fecha_inicio': date(2024, 1, 1),
        'fecha_fin': None,
        'observaciones': 'Capitán de la Sexta Compañía'
    },
    {
        'rut': '14.225.847-K',  # Martin Andres Ruiz (27 años - Honorario Cuerpo)
        'tipo_cargo': 'compania',
        'nombre_cargo': 'Director',
        'anio': 2024,
        'fecha_inicio': date(2024, 1, 1),
        'fecha_fin': None,
        'observaciones': 'Director de la Sexta Compañía'
    },
    {
        'rut': '18.036.532-8',  # Guillermo Ruiz (21 años - Honorario Compañía)
        'tipo_cargo': 'compania',
        'nombre_cargo': 'Secretario',
        'anio': 2024,
        'fecha_inicio': date(2024, 1, 1),
        'fecha_fin': None,
        'observaciones': 'Secretario de la Sexta Compañía'
    },
    {
        'rut': '9.607.570-2',  # Baldovino Alejandro Ruiz (22 años - Honorario Compañía)
        'tipo_cargo': 'compania',
        'nombre_cargo': 'Tesorero',
        'anio': 2024,
        'fecha_inicio': date(2024, 1, 1),
        'fecha_fin': None,
        'observaciones': 'Tesorero de la Sexta Compañía'
    },
    {
        'rut': '3.768.935-7',  # Juan Aurelio Ruiz (52 años - Insigne)
        'tipo_cargo': 'confianza',
        'nombre_cargo': 'Decano',
        'anio': 2024,
        'fecha_inicio': date(2024, 1, 1),
        'fecha_fin': None,
        'observaciones': 'Decano de la Sexta Compañía - Cargo de confianza'
    },
    {
        'rut': '6.079.968-7',  # Roger Gerardo Oñederra (7 años - Voluntario)
        'tipo_cargo': 'compania',
        'nombre_cargo': 'Ayudante',
        'anio': 2024,
        'fecha_inicio': date(2024, 1, 1),
        'fecha_fin': None,
        'observaciones': 'Ayudante de la Sexta Compañía'
    }
]

def asignar_cargos():
    print("=" * 80)
    print("ASIGNANDO CARGOS A VOLUNTARIOS DE LA SEXTA COMPANIA")
    print("=" * 80)
    
    creados = 0
    errores = 0
    
    for data in cargos_asignar:
        rut = data.pop('rut')
        
        try:
            # Buscar voluntario por RUT
            voluntario = Voluntario.objects.get(rut=rut)
            
            # Verificar si ya tiene este cargo activo
            cargo_existente = Cargo.objects.filter(
                voluntario=voluntario,
                nombre_cargo=data['nombre_cargo'],
                fecha_fin__isnull=True
            ).exists()
            
            if cargo_existente:
                print(f"[X] {voluntario.nombre} {voluntario.apellido_paterno} ya tiene el cargo de {data['nombre_cargo']}")
                errores += 1
                continue
            
            # Crear cargo
            cargo = Cargo.objects.create(
                voluntario=voluntario,
                **data
            )
            
            nombre_completo = f"{voluntario.nombre} {voluntario.apellido_paterno} {voluntario.apellido_materno}".strip()
            print(f"[OK] {nombre_completo}")
            print(f"     Cargo: {data['nombre_cargo']} ({data['tipo_cargo']})")
            print(f"     Desde: {data['fecha_inicio']}")
            print()
            
            creados += 1
            
        except Voluntario.DoesNotExist:
            print(f"[ERROR] No se encontro voluntario con RUT: {rut}")
            errores += 1
        except Exception as e:
            print(f"[ERROR] Error al crear cargo para RUT {rut}: {str(e)}")
            errores += 1
    
    print("=" * 80)
    print("RESUMEN:")
    print(f"[OK] Cargos asignados: {creados}")
    print(f"[X] Errores: {errores}")
    print("=" * 80)
    
    # Resumen de oficiales
    print("\nOFICIALES DE COMPANIA:")
    oficiales = Cargo.objects.filter(
        tipo_cargo='compania',
        fecha_fin__isnull=True
    ).select_related('voluntario')
    
    for cargo in oficiales:
        vol = cargo.voluntario
        nombre = f"{vol.nombre} {vol.apellido_paterno}".strip()
        print(f"   {cargo.nombre_cargo}: {nombre} (Clave: {vol.clave_bombero})")
    
    # Resumen de cargos de confianza
    print("\nCARGOS DE CONFIANZA:")
    confianza = Cargo.objects.filter(
        tipo_cargo='confianza',
        fecha_fin__isnull=True
    ).select_related('voluntario')
    
    for cargo in confianza:
        vol = cargo.voluntario
        nombre = f"{vol.nombre} {vol.apellido_paterno}".strip()
        print(f"   {cargo.nombre_cargo}: {nombre} (Clave: {vol.clave_bombero})")
    
    # Voluntarios sin cargo (para asistencias normales)
    print("\nVOLUNTARIOS SIN CARGO (Aparecen como voluntarios normales):")
    sin_cargo = Voluntario.objects.filter(
        estado_bombero='activo'
    ).exclude(
        cargos__fecha_fin__isnull=True
    )
    
    for vol in sin_cargo:
        nombre = f"{vol.nombre} {vol.apellido_paterno}".strip()
        # Calcular categoría
        if vol.fecha_ingreso:
            antiguedad = (date.today() - vol.fecha_ingreso).days // 365
            if antiguedad < 20:
                categoria = "Voluntario"
            elif antiguedad < 25:
                categoria = "Honorario Compania"
            elif antiguedad < 50:
                categoria = "Honorario Cuerpo"
            else:
                categoria = "Insigne"
        else:
            categoria = "Voluntario"
        
        print(f"   {nombre} (Clave: {vol.clave_bombero}) - {categoria}")

if __name__ == '__main__':
    asignar_cargos()
