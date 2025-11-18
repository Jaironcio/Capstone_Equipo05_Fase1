import os
import django
from datetime import date

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from voluntarios.models import Voluntario

v = Voluntario.objects.get(id=7)

print("\n" + "="*60)
print("VERIFICACION DE ANTIGUEDAD CONGELADA")
print("="*60)

print(f"\nVoluntario: {v.nombre_completo()}")
print(f"Estado: {v.estado_bombero}")
print(f"Antiguedad congelada: {v.antiguedad_congelada}")

print(f"\nFECHAS:")
print(f"  - Fecha de ingreso: {v.fecha_ingreso}")
print(f"  - Fecha de congelamiento: {v.fecha_congelamiento}")
print(f"  - Fecha de renuncia: {v.fecha_renuncia}")
print(f"  - Hoy: {date.today()}")

print(f"\nCALCULO DE ANTIGUEDAD:")
ant = v.antiguedad_detallada()
print(f"  - Antiguedad calculada: {ant['años']} años, {ant['meses']} meses, {ant['dias']} dias")

# Verificación manual
print(f"\nVERIFICACION MANUAL:")
print(f"  Desde: 2000-09-01")
print(f"  Hasta: 2025-01-01 (congelada)")
print(f"  Resultado esperado: 24 años, 4 meses, 0 dias")
print(f"  Resultado obtenido: {ant['años']} años, {ant['meses']} meses, {ant['dias']} dias")

if ant['años'] == 24 and ant['meses'] == 4:
    print(f"\n[OK] CORRECTO! La antiguedad esta congelada correctamente.")
    print(f"     La antiguedad NO avanza desde {v.fecha_congelamiento}")
else:
    print(f"\n[ERROR] La antiguedad no coincide")

# Mostrar qué pasaría si NO estuviera congelada
print(f"\nSi NO estuviera congelada (hasta hoy {date.today()}):")
años_hoy = date.today().year - v.fecha_ingreso.year
meses_hoy = date.today().month - v.fecha_ingreso.month
if meses_hoy < 0:
    años_hoy -= 1
    meses_hoy += 12
print(f"   Seria: {años_hoy} años, {meses_hoy} meses")
print(f"   Pero esta congelada, asi que se queda en: {ant['años']} años, {ant['meses']} meses")

print("\n" + "="*60)
