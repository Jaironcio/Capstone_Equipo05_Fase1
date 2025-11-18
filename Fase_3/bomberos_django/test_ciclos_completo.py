import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from voluntarios.models import Voluntario, CicloCuotas, PagoCuota, ConfiguracionCuotas
from decimal import Decimal
from datetime import date
import random

print("=" * 80)
print("PRUEBA COMPLETA: CICLOS Y PAGOS DE CUOTAS")
print("=" * 80)

# Paso 1: Configurar precios
print("\n[PASO 1] Configurar precios de cuotas...")
config, created = ConfiguracionCuotas.objects.get_or_create(
    id=1,
    defaults={
        'precio_regular': Decimal('6000'),
        'precio_estudiante': Decimal('4000')
    }
)
if not created:
    config.precio_regular = Decimal('6000')
    config.precio_estudiante = Decimal('4000')
    config.save()
print(f"  [OK] Precios: Regular ${config.precio_regular} / Estudiante ${config.precio_estudiante}")

# Paso 2: Eliminar datos anteriores
print("\n[PASO 2] Limpiar datos anteriores...")
PagoCuota.objects.filter(anio__in=[2025, 2026]).delete()
CicloCuotas.objects.filter(anio__in=[2025, 2026]).delete()
print("  [OK] Datos limpiados")

# Paso 3: Crear ciclos 2025 y 2026
print("\n[PASO 3] Crear ciclos de prueba...")

ciclo_2025 = CicloCuotas.objects.create(
    anio=2025,
    fecha_inicio=date(2025, 1, 1),
    fecha_fin=date(2025, 12, 31),
    activo=True,
    precio_cuota_regular=config.precio_regular,
    precio_cuota_estudiante=config.precio_estudiante,
    observaciones='Ciclo de prueba 2025'
)
print(f"  [OK] Ciclo 2025 creado (ACTIVO)")

ciclo_2026 = CicloCuotas.objects.create(
    anio=2026,
    fecha_inicio=date(2026, 1, 1),
    fecha_fin=date(2026, 12, 31),
    activo=False,
    precio_cuota_regular=config.precio_regular,
    precio_cuota_estudiante=config.precio_estudiante,
    observaciones='Ciclo de prueba 2026'
)
print(f"  [OK] Ciclo 2026 creado (INACTIVO)")

# Paso 4: Obtener voluntarios para pruebas
print("\n[PASO 4] Seleccionar voluntarios para pruebas...")
voluntarios = list(Voluntario.objects.all().order_by('id')[:3])  # Primeros 3 voluntarios

if len(voluntarios) < 3:
    print(f"  [ERROR] Se necesitan al menos 3 voluntarios. Solo hay {len(voluntarios)}")
    exit(1)

print(f"  [OK] Seleccionados {len(voluntarios)} voluntarios:")
for v in voluntarios:
    print(f"    - {v.nombre} {v.apellido_paterno} ({v.clave_bombero})")

# Paso 5: Generar pagos para ciclo 2025
print("\n[PASO 5] Generar pagos de prueba para ciclo 2025...")
total_pagos_2025 = 0
monto_total_2025 = Decimal('0')

# Voluntario 1: Paga todos los meses (1-12)
for mes in range(1, 13):
    pago = PagoCuota.objects.create(
        voluntario=voluntarios[0],
        mes=mes,
        anio=2025,
        monto_pagado=config.precio_regular,
        fecha_pago=date(2025, mes, 15),
        metodo_pago='Efectivo'
    )
    total_pagos_2025 += 1
    monto_total_2025 += pago.monto_pagado

print(f"  [OK] {voluntarios[0].clave_bombero}: 12 meses pagados (AL DÍA)")

# Voluntario 2: Paga solo 6 meses (1-6)
for mes in range(1, 7):
    pago = PagoCuota.objects.create(
        voluntario=voluntarios[1],
        mes=mes,
        anio=2025,
        monto_pagado=config.precio_regular,
        fecha_pago=date(2025, mes, 15),
        metodo_pago='Transferencia'
    )
    total_pagos_2025 += 1
    monto_total_2025 += pago.monto_pagado

print(f"  [OK] {voluntarios[1].clave_bombero}: 6 meses pagados (DEUDOR)")

# Voluntario 3: Paga solo 3 meses aleatorios
meses_pagados = random.sample(range(1, 13), 3)
for mes in meses_pagados:
    pago = PagoCuota.objects.create(
        voluntario=voluntarios[2],
        mes=mes,
        anio=2025,
        monto_pagado=config.precio_estudiante,  # Estudiante
        fecha_pago=date(2025, mes, 15),
        metodo_pago='Efectivo'
    )
    total_pagos_2025 += 1
    monto_total_2025 += pago.monto_pagado

print(f"  [OK] {voluntarios[2].clave_bombero}: 3 meses pagados (ESTUDIANTE, DEUDOR)")

print(f"\n  [RESUMEN 2025] Total pagos: {total_pagos_2025} | Recaudado: ${monto_total_2025}")

# Paso 6: Generar pagos para ciclo 2026
print("\n[PASO 6] Generar pagos de prueba para ciclo 2026...")
total_pagos_2026 = 0
monto_total_2026 = Decimal('0')

# Solo el voluntario 1 paga algo en 2026 (2 meses)
for mes in range(1, 3):
    pago = PagoCuota.objects.create(
        voluntario=voluntarios[0],
        mes=mes,
        anio=2026,
        monto_pagado=config.precio_regular,
        fecha_pago=date(2026, mes, 15),
        metodo_pago='Efectivo'
    )
    total_pagos_2026 += 1
    monto_total_2026 += pago.monto_pagado

print(f"  [OK] {voluntarios[0].clave_bombero}: 2 meses pagados en 2026")
print(f"\n  [RESUMEN 2026] Total pagos: {total_pagos_2026} | Recaudado: ${monto_total_2026}")

# Paso 7: Mostrar estado final
print("\n" + "=" * 80)
print("ESTADO FINAL DE LOS CICLOS")
print("=" * 80)

print("\nCICLO 2025 (ACTIVO):")
print(f"  - Pagos totales: {total_pagos_2025}")
print(f"  - Monto recaudado: ${monto_total_2025}")
print(f"  - Estado: {'ACTIVO' if ciclo_2025.activo else 'Inactivo'}")

print("\nCICLO 2026 (INACTIVO):")
print(f"  - Pagos totales: {total_pagos_2026}")
print(f"  - Monto recaudado: ${monto_total_2026}")
print(f"  - Estado: {'ACTIVO' if ciclo_2026.activo else 'Inactivo'}")

print("\n" + "=" * 80)
print("PRUEBAS MANUALES A REALIZAR")
print("=" * 80)
print("""
1. Ve a: http://127.0.0.1:8000/admin-ciclos-cuotas.html
2. Deberías ver:
   - Ciclo 2025: ACTIVO con fechas 01/01/2025 - 31/12/2025
   - Ciclo 2026: INACTIVO con fechas 01/01/2026 - 31/12/2026

3. Prueba CERRAR el ciclo 2025:
   - Click en "CERRAR CICLO" del 2025
   - Debería cambiar a estado CERRADO

4. Prueba ACTIVAR el ciclo 2026:
   - Click en "ACTIVAR CICLO" del 2026
   - Debería cambiar a estado ACTIVO
   - El 2025 debería desactivarse automáticamente

5. Prueba REABRIR el ciclo 2025:
   - Click en "REABRIR CICLO" del 2025
   - Debería poder volver a abrirse

6. Verifica los PDFs:
   - Ve a cuotas del voluntario {0} (clave: {1})
   - Genera PDF 2025: Debería mostrar todos los meses PAGADOS
   - Genera PDF 2026: Debería mostrar solo 2 meses PAGADOS

""".format(voluntarios[0].id, voluntarios[0].clave_bombero))

print("=" * 80)
print("DATOS DE PRUEBA GENERADOS EXITOSAMENTE")
print("=" * 80)
