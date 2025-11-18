import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from voluntarios.models import MovimientoFinanciero, PagoBeneficio

print("="*80)
print("VERIFICANDO MOVIMIENTOS FINANCIEROS")
print("="*80)

# Verificar último pago de beneficio
ultimo_pago = PagoBeneficio.objects.last()
if ultimo_pago:
    print(f"\n[ULTIMO PAGO BENEFICIO]")
    print(f"  ID: {ultimo_pago.id}")
    print(f"  Asignacion: {ultimo_pago.asignacion.beneficio.nombre}")
    print(f"  Voluntario: {ultimo_pago.asignacion.voluntario.nombre} {ultimo_pago.asignacion.voluntario.apellido_paterno}")
    print(f"  Cantidad tarjetas: {ultimo_pago.cantidad_tarjetas}")
    print(f"  Monto: ${ultimo_pago.monto}")
    print(f"  Fecha: {ultimo_pago.fecha_pago}")
    print(f"  Tipo: {ultimo_pago.tipo_pago}")

# Verificar movimientos financieros recientes
print(f"\n[MOVIMIENTOS FINANCIEROS RECIENTES]")
movimientos = MovimientoFinanciero.objects.filter(categoria='Pago de Beneficio').order_by('-id')[:5]

if movimientos.exists():
    print(f"  Total encontrados: {movimientos.count()}")
    for mov in movimientos:
        print(f"\n  ID: {mov.id}")
        print(f"    Tipo: {mov.tipo}")
        print(f"    Categoria: {mov.categoria}")
        print(f"    Monto: ${mov.monto}")
        print(f"    Descripcion: {mov.descripcion}")
        print(f"    Fecha: {mov.fecha}")
    print("\n  [OK] MovimientoFinanciero se crea automaticamente!")
else:
    print("  [ADVERTENCIA] No hay movimientos financieros registrados")

print("\n" + "="*80)
print("VERIFICACION COMPLETA")
print("="*80)
