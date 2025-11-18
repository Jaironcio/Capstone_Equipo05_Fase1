import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from voluntarios.models import Voluntario, Beneficio, AsignacionBeneficio, ConfiguracionCuotas
from django.utils import timezone
from decimal import Decimal
from datetime import timedelta

print("=" * 80)
print("TEST COMPLETO: SISTEMA BENEFICIOS")
print("=" * 80)

# 1. Verificar voluntarios
print("\n[1] VERIFICANDO VOLUNTARIOS")
cristian = Voluntario.objects.filter(nombre__icontains='cristian', apellido_paterno__icontains='vera').first()
juan = Voluntario.objects.filter(nombre__icontains='juan', apellido_paterno__icontains='monje').first()

if cristian:
    print(f"  [OK] Cristian Vera (ID: {cristian.id})")
else:
    print("  [ERROR] Cristian Vera NO encontrado")

if juan:
    print(f"  [OK] Juan Monje (ID: {juan.id})")
else:
    print("  [ERROR] Juan Monje NO encontrado")

# 2. Crear o verificar beneficio de prueba
print("\n[2] CREANDO BENEFICIO DE PRUEBA")
beneficio, created = Beneficio.objects.get_or_create(
    nombre="Curanto Diciembre 2025",
    defaults={
        'descripcion': 'Curanto de fin de año para recaudar fondos',
        'fecha_evento': timezone.now().date() + timedelta(days=30),
        'tarjetas_voluntarios': 8,
        'tarjetas_honorarios_cia': 5,
        'tarjetas_honorarios_cuerpo': 3,
        'tarjetas_insignes': 2,
        'precio_por_tarjeta': Decimal('8000.00'),
        'precio_tarjeta_extra': Decimal('8000.00'),
        'estado': 'activo'
    }
)

if created:
    print(f"  [OK] Beneficio creado: {beneficio.nombre}")
else:
    print(f"  [INFO] Beneficio ya existe: {beneficio.nombre}")

print(f"     Precio tarjeta: ${beneficio.precio_por_tarjeta}")
print(f"     Fecha evento: {beneficio.fecha_evento}")

# 3. Crear asignaciones para los voluntarios
print("\n[3] CREANDO ASIGNACIONES")

if cristian:
    asig_cristian, created = AsignacionBeneficio.objects.get_or_create(
        beneficio=beneficio,
        voluntario=cristian,
        defaults={
            'tarjetas_asignadas': 8,
            'monto_total': Decimal('8000.00') * 8,  # 8 x 8000 = 64000
            'monto_pendiente': Decimal('8000.00') * 8,
            'estado_pago': 'pendiente'
        }
    )
    if created:
        print(f"  [OK] Asignacion creada para Cristian Vera")
        print(f"     Tarjetas: {asig_cristian.tarjetas_asignadas}")
        print(f"     Monto total: ${asig_cristian.monto_total}")
    else:
        print(f"  [INFO] Asignacion ya existe para Cristian Vera")
        print(f"     Tarjetas: {asig_cristian.tarjetas_asignadas}")
        print(f"     Vendidas: {asig_cristian.tarjetas_vendidas}")
        print(f"     Disponibles: {asig_cristian.tarjetas_disponibles}")
        print(f"     Pagado: ${asig_cristian.monto_pagado}")
        print(f"     Pendiente: ${asig_cristian.monto_pendiente}")
        print(f"     Estado: {asig_cristian.estado_pago}")

if juan:
    asig_juan, created = AsignacionBeneficio.objects.get_or_create(
        beneficio=beneficio,
        voluntario=juan,
        defaults={
            'tarjetas_asignadas': 8,
            'monto_total': Decimal('8000.00') * 8,
            'monto_pendiente': Decimal('8000.00') * 8,
            'estado_pago': 'pendiente'
        }
    )
    if created:
        print(f"  [OK] Asignacion creada para Juan Monje")
        print(f"     Tarjetas: {asig_juan.tarjetas_asignadas}")
        print(f"     Monto total: ${asig_juan.monto_total}")
    else:
        print(f"  [INFO] Asignacion ya existe para Juan Monje")

# 4. URLs para probar
print("\n" + "=" * 80)
print("URLS PARA PROBAR EN EL NAVEGADOR")
print("=" * 80)

if cristian:
    print(f"""
1. PERFIL DE CRISTIAN:
   http://127.0.0.1:8000/sistema.html
   Buscar: Cristian Vera
   Click en boton "Beneficios"

2. PAGAR BENEFICIO (DIRECTO):
   http://127.0.0.1:8000/pagar-beneficio.html?id={cristian.id}

3. ENDPOINT API (ver en navegador):
   http://127.0.0.1:8000/api/voluntarios/{cristian.id}/beneficios-asignados-simple/
    """)

if juan:
    print(f"""
4. PAGAR BENEFICIO JUAN:
   http://127.0.0.1:8000/pagar-beneficio.html?id={juan.id}
    """)

print("=" * 80)
print("CHECKLIST DE PRUEBAS")
print("=" * 80)
print("""
[ ] 1. Abrir perfil de Cristian Vera
[ ] 2. Click en boton "Beneficios"
[ ] 3. Ver beneficio "Curanto Diciembre 2025"
[ ] 4. Ver: 8 asignadas, 0 vendidas, 8 disponibles
[ ] 5. Ver: Deuda $64.000
[ ] 6. Click en "PAGAR"
[ ] 7. Ingresar 3 tarjetas
[ ] 8. Ver monto calculado: $24.000
[ ] 9. Registrar pago
[ ] 10. Ver actualizacion: 3 vendidas, 5 disponibles
[ ] 11. Ver: Pagado $24.000, Pendiente $40.000
[ ] 12. Estado cambia a "Parcial"
[ ] 13. Resumen muestra: 1 beneficio pendiente, deuda $40.000
""")

print("=" * 80)
print("LISTO PARA PROBAR!")
print("=" * 80)
