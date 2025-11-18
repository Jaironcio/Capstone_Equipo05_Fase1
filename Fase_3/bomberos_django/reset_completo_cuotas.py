import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from voluntarios.models import CicloCuotas, PagoCuota, MovimientoFinanciero, ConfiguracionCuotas
from datetime import date

print("=" * 80)
print("RESET COMPLETO - EMPEZAR DE CERO")
print("=" * 80)

# Paso 1: Eliminar todos los movimientos financieros de cuotas
print("\n[PASO 1] Eliminando movimientos financieros de cuotas...")
movimientos = MovimientoFinanciero.objects.filter(categoria='cuota')
count_mov = movimientos.count()
if count_mov > 0:
    movimientos.delete()
    print(f"  [OK] {count_mov} movimiento(s) eliminado(s)")
else:
    print("  [INFO] No hay movimientos de cuotas")

# Paso 2: Eliminar todos los pagos de cuotas
print("\n[PASO 2] Eliminando TODOS los pagos de cuotas...")
pagos = PagoCuota.objects.all()
count_pagos = pagos.count()
if count_pagos > 0:
    pagos.delete()
    print(f"  [OK] {count_pagos} pago(s) eliminado(s)")
else:
    print("  [INFO] No hay pagos")

# Paso 3: Eliminar todos los ciclos
print("\n[PASO 3] Eliminando TODOS los ciclos...")
ciclos = CicloCuotas.objects.all()
count_ciclos = ciclos.count()
if count_ciclos > 0:
    ciclos.delete()
    print(f"  [OK] {count_ciclos} ciclo(s) eliminado(s)")
else:
    print("  [INFO] No hay ciclos")

# Paso 4: Asegurar que existe configuración
print("\n[PASO 4] Verificar configuración de cuotas...")
config = ConfiguracionCuotas.objects.first()
if not config:
    config = ConfiguracionCuotas.objects.create(
        precio_regular=6000,
        precio_estudiante=4000
    )
    print(f"  [OK] Configuración creada:")
else:
    print(f"  [OK] Configuración existente:")

print(f"    - Precio Regular: ${config.precio_regular}")
print(f"    - Precio Estudiante: ${config.precio_estudiante}")

# Paso 5: Crear ciclo 2025 limpio
print("\n[PASO 5] Creando ciclo 2025 limpio...")
ciclo_2025 = CicloCuotas.objects.create(
    anio=2025,
    fecha_inicio=date(2025, 1, 1),
    fecha_fin=date(2025, 12, 31),
    activo=True,
    precio_cuota_regular=config.precio_regular,
    precio_cuota_estudiante=config.precio_estudiante,
    observaciones='Ciclo 2025 - Limpio para pruebas'
)

print(f"  [OK] Ciclo 2025 creado:")
print(f"    - Año: {ciclo_2025.anio}")
print(f"    - Estado: {'ACTIVO' if ciclo_2025.activo else 'Inactivo'}")
print(f"    - Fechas: {ciclo_2025.fecha_inicio} / {ciclo_2025.fecha_fin}")
print(f"    - Precio Regular: ${ciclo_2025.precio_cuota_regular}")
print(f"    - Precio Estudiante: ${ciclo_2025.precio_cuota_estudiante}")

# Paso 6: Verificación final
print("\n[PASO 6] Verificación final...")
print(f"  - Total ciclos: {CicloCuotas.objects.count()}")
print(f"  - Total pagos: {PagoCuota.objects.count()}")
print(f"  - Total movimientos cuotas: {MovimientoFinanciero.objects.filter(categoria='cuota').count()}")

print("\n" + "=" * 80)
print("SISTEMA COMPLETAMENTE LIMPIO")
print("=" * 80)
print("""
✅ Estado actual:
  - 1 ciclo: 2025 (ACTIVO)
  - 0 pagos registrados
  - 0 movimientos financieros de cuotas
  - Precios configurados: $6.000 / $4.000

🚀 Listo para empezar las pruebas:

1. Panel de Ciclos:
   http://127.0.0.1:8000/admin-ciclos-cuotas.html
   - CTRL + F5
   - Deberías ver solo el ciclo 2025

2. Cuotas de Voluntario:
   http://127.0.0.1:8000/cuotas-beneficios.html?id=7
   - CTRL + F5
   - Año: 2025
   - Todos los meses en ROJO (pendientes)
   - Sin pagos en el historial

3. Registrar primer pago:
   - Selecciona un mes
   - Elige tipo de cuota
   - Registra el pago
   - Verifica que el mes cambia a VERDE
   - Verifica que el saldo aumenta

4. Crear ciclo 2026:
   - En admin-ciclos-cuotas.html
   - Click "Nuevo Ciclo"
   - Año: 2026
   - Guardar (sin ingresar precios)
   - Verificar que toma los precios de configuración

¡TODO LIMPIO Y LISTO! 🎯
""")
print("=" * 80)
