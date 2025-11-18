import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from voluntarios.models import PagoCuota, MovimientoFinanciero

print("=" * 80)
print("REINICIAR CICLO 2025 - ELIMINAR TODOS LOS PAGOS")
print("=" * 80)

# Paso 1: Ver pagos actuales del 2025
print("\n[PASO 1] Contar pagos del 2025...")
pagos_2025 = PagoCuota.objects.filter(anio=2025)
count_pagos = pagos_2025.count()
print(f"  [INFO] Pagos encontrados: {count_pagos}")

if count_pagos > 0:
    print("\n  Detalle de pagos a eliminar:")
    for pago in pagos_2025[:10]:  # Mostrar primeros 10
        print(f"    - Voluntario ID {pago.voluntario_id}: Mes {pago.mes}, ${pago.monto_pagado}")
    
    if count_pagos > 10:
        print(f"    ... y {count_pagos - 10} pagos más")

# Paso 2: Ver movimientos financieros relacionados
print("\n[PASO 2] Contar movimientos financieros de cuotas 2025...")
movimientos_2025 = MovimientoFinanciero.objects.filter(
    pago_cuota__anio=2025
)
count_movimientos = movimientos_2025.count()
print(f"  [INFO] Movimientos encontrados: {count_movimientos}")

# Paso 3: Eliminar movimientos financieros
if count_movimientos > 0:
    print("\n[PASO 3] Eliminando movimientos financieros...")
    deleted_mov = movimientos_2025.delete()
    print(f"  [OK] {deleted_mov[0]} movimiento(s) eliminado(s)")

# Paso 4: Eliminar pagos
if count_pagos > 0:
    print("\n[PASO 4] Eliminando pagos del 2025...")
    deleted_pagos = pagos_2025.delete()
    print(f"  [OK] {deleted_pagos[0]} pago(s) eliminado(s)")
else:
    print("\n[PASO 4] No hay pagos para eliminar")

# Paso 5: Verificar limpieza
print("\n[PASO 5] Verificar limpieza...")
pagos_restantes = PagoCuota.objects.filter(anio=2025).count()
movimientos_restantes = MovimientoFinanciero.objects.filter(
    pago_cuota__anio=2025
).count()

if pagos_restantes == 0 and movimientos_restantes == 0:
    print("  [OK] Ciclo 2025 limpiado completamente")
    print(f"    - Pagos: {pagos_restantes}")
    print(f"    - Movimientos: {movimientos_restantes}")
else:
    print("  [ERROR] Aún quedan registros:")
    print(f"    - Pagos: {pagos_restantes}")
    print(f"    - Movimientos: {movimientos_restantes}")

print("\n" + "=" * 80)
print("CICLO 2025 REINICIADO")
print("=" * 80)
print("""
El ciclo 2025 ahora está en CERO:
- Sin pagos registrados
- Sin movimientos financieros
- Todos los meses disponibles para pagar

Puedes empezar las pruebas:
1. Ve a: http://127.0.0.1:8000/cuotas-beneficios.html?id=<ID>
2. CTRL + F5 para actualizar
3. Todos los meses deberían estar en ROJO (pendientes)
4. Todos los checkboxes deberían estar habilitados
""")
print("=" * 80)
