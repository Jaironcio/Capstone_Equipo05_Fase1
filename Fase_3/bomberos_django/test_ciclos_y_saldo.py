import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from voluntarios.models import Voluntario, CicloCuotas, PagoCuota, MovimientoFinanciero
from django.db.models import Sum
from decimal import Decimal
from datetime import date

print("=" * 80)
print("PRUEBA COMPLETA: CICLOS, PAGOS Y SALDO")
print("=" * 80)

# Paso 1: Ver ciclo activo
print("\n[PASO 1] Ver ciclo activo...")
ciclo_activo = CicloCuotas.objects.filter(activo=True).first()
if ciclo_activo:
    print(f"  [OK] Ciclo activo: {ciclo_activo.anio}")
else:
    print(f"  [ERROR] No hay ciclo activo!")
    exit(1)

# Paso 2: Seleccionar voluntario
print("\n[PASO 2] Seleccionar voluntario de prueba...")
voluntario = Voluntario.objects.first()
if not voluntario:
    print(f"  [ERROR] No hay voluntarios en la BD")
    exit(1)
print(f"  [OK] Voluntario: {voluntario.nombre} {voluntario.apellido_paterno} (ID: {voluntario.id})")

# Paso 3: Ver saldo actual
print("\n[PASO 3] Ver saldo actual de la compañía...")
ingresos = MovimientoFinanciero.objects.filter(tipo='ingreso').aggregate(total=Sum('monto'))['total'] or Decimal('0')
egresos = MovimientoFinanciero.objects.filter(tipo='egreso').aggregate(total=Sum('monto'))['total'] or Decimal('0')
saldo_actual = ingresos - egresos
print(f"  Ingresos: ${ingresos}")
print(f"  Egresos: ${egresos}")
print(f"  Saldo: ${saldo_actual}")

# Paso 4: Ver pagos del voluntario en ciclo activo
print(f"\n[PASO 4] Ver pagos del voluntario en ciclo {ciclo_activo.anio}...")
pagos_actuales = PagoCuota.objects.filter(
    voluntario=voluntario,
    anio=ciclo_activo.anio
).count()
print(f"  [INFO] Pagos registrados: {pagos_actuales}")

# Paso 5: Registrar un pago de prueba
print(f"\n[PASO 5] Registrar pago de prueba para mes 1...")
try:
    # Verificar si ya existe
    pago_existe = PagoCuota.objects.filter(
        voluntario=voluntario,
        mes=1,
        anio=ciclo_activo.anio
    ).exists()
    
    if pago_existe:
        print(f"  [INFO] El pago del mes 1 ya existe, probando con mes 2...")
        mes_prueba = 2
    else:
        mes_prueba = 1
    
    pago_prueba = PagoCuota.objects.create(
        voluntario=voluntario,
        mes=mes_prueba,
        anio=ciclo_activo.anio,
        monto_pagado=Decimal('6000'),
        fecha_pago=date.today(),
        metodo_pago='Efectivo',
        observaciones='Pago de prueba automático'
    )
    
    # Crear movimiento financiero
    movimiento = MovimientoFinanciero.objects.create(
        tipo='ingreso',
        categoria='cuota',
        monto=Decimal('6000'),
        fecha=date.today(),
        descripcion=f"Cuota social {mes_prueba}/{ciclo_activo.anio} - {voluntario.nombre} {voluntario.apellido_paterno}",
        pago_cuota=pago_prueba
    )
    
    print(f"  [OK] Pago registrado: Mes {mes_prueba}, Monto: $6.000")
    print(f"  [OK] Movimiento financiero creado: ID {movimiento.id}")
    
except Exception as e:
    print(f"  [ERROR] {e}")

# Paso 6: Verificar nuevo saldo
print("\n[PASO 6] Verificar nuevo saldo...")
ingresos = MovimientoFinanciero.objects.filter(tipo='ingreso').aggregate(total=Sum('monto'))['total'] or Decimal('0')
egresos = MovimientoFinanciero.objects.filter(tipo='egreso').aggregate(total=Sum('monto'))['total'] or Decimal('0')
saldo_nuevo = ingresos - egresos
print(f"  Ingresos: ${ingresos}")
print(f"  Egresos: ${egresos}")
print(f"  Saldo: ${saldo_nuevo}")

if saldo_nuevo > saldo_actual:
    diferencia = saldo_nuevo - saldo_actual
    print(f"  [OK] El saldo aumentó en ${diferencia}")
else:
    print(f"  [INFO] El saldo no cambió (posiblemente el pago ya existía)")

# Paso 7: Ver pagos actualizados
print(f"\n[PASO 7] Ver pagos actualizados del voluntario...")
pagos_finales = PagoCuota.objects.filter(
    voluntario=voluntario,
    anio=ciclo_activo.anio
)
print(f"  [INFO] Total pagos: {pagos_finales.count()}")
for p in pagos_finales:
    print(f"    - Mes {p.mes}: ${p.monto_pagado} ({p.fecha_pago})")

print("\n" + "=" * 80)
print("INSTRUCCIONES DE PRUEBA MANUAL")
print("=" * 80)
print(f"""
1. Abre el navegador y ve a:
   http://127.0.0.1:8000/cuotas-beneficios.html?id={voluntario.id}
   
2. PRESIONA CTRL + F5 para forzar recarga del cache

3. Verifica que:
   a) El año mostrado es {ciclo_activo.anio} (ciclo activo)
   b) Los meses ya pagados están en VERDE
   c) Los meses no pagados están en ROJO
   d) Los checkboxes de meses pagados están DESHABILITADOS

4. Verifica el saldo en el sidebar:
   - Debería mostrar ${saldo_nuevo}
   - Si registras un nuevo pago, el saldo debe aumentar

5. Prueba cambiar de ciclo:
   a) Ve a http://127.0.0.1:8000/admin-ciclos-cuotas.html
   b) Cierra el ciclo {ciclo_activo.anio}
   c) Activa otro ciclo (ej: 2026)
   d) Vuelve a cuotas del voluntario
   e) PRESIONA CTRL + F5
   f) Verifica que:
      - El año cambió al nuevo ciclo
      - Los checkboxes se reiniciaron
      - Los colores se actualizaron

""")

print("=" * 80)
print("PRUEBA COMPLETADA")
print("=" * 80)
