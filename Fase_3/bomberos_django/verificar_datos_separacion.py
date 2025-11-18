import os
import django
from datetime import date

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from voluntarios.models import Voluntario

v = Voluntario.objects.get(id=7)

print("\n" + "="*60)
print("VERIFICACION DE DATOS PARA REINTEGRACION")
print("="*60)

print(f"\nVoluntario ID: {v.id}")
print(f"Nombre: {v.nombre_completo()}")
print(f"Clave: {v.clave_bombero}")
print(f"Estado: {v.estado_bombero}")

print(f"\nFECHAS CRITICAS:")
print(f"  fecha_separacion: {v.fecha_separacion}")
print(f"  fecha_expulsion: {v.fecha_expulsion}")
print(f"  fecha_renuncia: {v.fecha_renuncia}")

if v.fecha_separacion:
    dias_desde_sep = (date.today() - v.fecha_separacion).days
    print(f"\n  Dias desde separacion: {dias_desde_sep}")
    print(f"  Minimo requerido: 365 dias (1 año)")
    print(f"  Puede reintegrarse: {'SI' if dias_desde_sep >= 365 else 'NO'}")
    if dias_desde_sep < 365:
        dias_restantes = 365 - dias_desde_sep
        print(f"  Dias restantes: {dias_restantes}")

print("\n" + "="*60)
