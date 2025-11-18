import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from voluntarios.models import CicloCuotas, ConfiguracionCuotas
from datetime import date

print("=" * 80)
print("LIMPIEZA DE CICLOS - SOLO 2025")
print("=" * 80)

# Paso 1: Ver ciclos actuales
print("\n[PASO 1] Ciclos actuales...")
ciclos_actuales = CicloCuotas.objects.all()
for c in ciclos_actuales:
    estado = "ACTIVO" if c.activo else "Inactivo"
    print(f"  - Ciclo {c.anio} ({estado})")

# Paso 2: Eliminar todos los ciclos
print("\n[PASO 2] Eliminando todos los ciclos...")
count = CicloCuotas.objects.all().delete()[0]
print(f"  [OK] {count} ciclo(s) eliminado(s)")

# Paso 3: Crear ciclo 2025
print("\n[PASO 3] Creando ciclo 2025...")

# Obtener precios de configuración
config = ConfiguracionCuotas.objects.first()
if not config:
    config = ConfiguracionCuotas.objects.create(
        precio_regular=6000,
        precio_estudiante=4000
    )

ciclo_2025 = CicloCuotas.objects.create(
    anio=2025,
    fecha_inicio=date(2025, 1, 1),
    fecha_fin=date(2025, 12, 31),
    activo=True,
    precio_cuota_regular=config.precio_regular,
    precio_cuota_estudiante=config.precio_estudiante,
    observaciones='Ciclo principal 2025'
)

print(f"  [OK] Ciclo 2025 creado:")
print(f"    - Año: {ciclo_2025.anio}")
print(f"    - Estado: {'ACTIVO' if ciclo_2025.activo else 'Inactivo'}")
print(f"    - Fechas: {ciclo_2025.fecha_inicio} / {ciclo_2025.fecha_fin}")
print(f"    - Precio Regular: ${ciclo_2025.precio_cuota_regular}")
print(f"    - Precio Estudiante: ${ciclo_2025.precio_cuota_estudiante}")

print("\n" + "=" * 80)
print("CICLOS LIMPIADOS - SOLO QUEDA 2025")
print("=" * 80)
print("""
Ahora puedes:
1. Ver ciclos en: http://127.0.0.1:8000/admin-ciclos-cuotas.html
2. Registrar pagos en: http://127.0.0.1:8000/cuotas-beneficios.html?id=<ID>

IMPORTANTE: Presiona CTRL + F5 en ambas páginas para actualizar
""")
print("=" * 80)
