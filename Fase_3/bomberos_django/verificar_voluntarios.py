"""
Verificar que los voluntarios tengan las fechas correctas
"""
import os
import django
from datetime import date

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from voluntarios.models import Voluntario

print("=" * 80)
print("VERIFICANDO VOLUNTARIOS ACTIVOS")
print("=" * 80)

# Los 3 voluntarios específicos
voluntarios_verificar = [
    ('6.882.268-5', 'Luis Fernando Oñederra', 'Insigne', 52),
    ('3.768.935-7', 'Juan Aurelio Ruiz', 'Honorario Cuerpo', 30),
    ('18.036.532-8', 'Guillermo Ruiz', 'Honorario Compañía', 22),
]

print("\nVERIFICANDO VOLUNTARIOS ESPECIFICOS:")
print("-" * 80)

for rut, nombre_esperado, categoria_esperada, anios_esperados in voluntarios_verificar:
    try:
        vol = Voluntario.objects.get(rut=rut)
        nombre = f"{vol.nombre} {vol.apellido_paterno}".strip()
        
        if vol.fecha_ingreso:
            antiguedad = (date.today() - vol.fecha_ingreso).days // 365
            
            if antiguedad < 20:
                categoria = 'Voluntario'
            elif antiguedad < 25:
                categoria = 'Honorario Compañía'
            elif antiguedad < 50:
                categoria = 'Honorario Cuerpo'
            else:
                categoria = 'Insigne'
            
            print(f"\n{nombre}:")
            print(f"  RUT: {rut}")
            print(f"  Clave: {vol.clave_bombero}")
            print(f"  Fecha ingreso: {vol.fecha_ingreso}")
            print(f"  Antigüedad: {antiguedad} años")
            print(f"  Categoría: {categoria}")
            print(f"  Estado: {vol.estado_bombero}")
            
            if categoria == categoria_esperada:
                print(f"  [OK] Categoria correcta!")
            else:
                print(f"  [ERROR] Deberia ser {categoria_esperada}")
        else:
            print(f"\n{nombre}: [ERROR] No tiene fecha de ingreso")
            
    except Voluntario.DoesNotExist:
        print(f"\n[ERROR] No existe voluntario con RUT {rut}")

print("\n" + "=" * 80)
print("TODOS LOS VOLUNTARIOS ACTIVOS POR CATEGORIA:")
print("=" * 80)

activos = Voluntario.objects.filter(estado_bombero='activo').order_by('-fecha_ingreso')

categorias = {
    'Insigne': [],
    'Honorario Cuerpo': [],
    'Honorario Compañía': [],
    'Voluntario': []
}

for vol in activos:
    if vol.fecha_ingreso:
        antiguedad = (date.today() - vol.fecha_ingreso).days // 365
        
        if antiguedad < 20:
            cat = 'Voluntario'
        elif antiguedad < 25:
            cat = 'Honorario Compañía'
        elif antiguedad < 50:
            cat = 'Honorario Cuerpo'
        else:
            cat = 'Insigne'
        
        nombre = f"{vol.nombre} {vol.apellido_paterno}".strip()
        categorias[cat].append(f"{nombre} (Clave: {vol.clave_bombero}, {antiguedad} años)")

for cat in ['Insigne', 'Honorario Cuerpo', 'Honorario Compañía', 'Voluntario']:
    print(f"\n{cat.upper()}:")
    if categorias[cat]:
        for v in categorias[cat]:
            print(f"  - {v}")
    else:
        print(f"  (vacio)")
