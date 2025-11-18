import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

print("="*80)
print("VERIFICANDO DATOS PARA PAGAR-BENEFICIO.HTML")
print("="*80)

from voluntarios.models import Voluntario, AsignacionBeneficio

# Voluntario ID 6
cristian = Voluntario.objects.filter(id=6).first()
if cristian:
    print(f"\n[VOLUNTARIO ID 6]")
    print(f"  Nombre: {cristian.nombre} {cristian.apellido_paterno}")
    print(f"  RUT: {cristian.rut}")
    print(f"  Clave: {cristian.clave_bombero}")
    
    # Beneficios asignados
    asignaciones = AsignacionBeneficio.objects.filter(
        voluntario=cristian,
        beneficio__estado='activo'
    ).select_related('beneficio')
    
    print(f"\n[BENEFICIOS ASIGNADOS]")
    print(f"  Total: {asignaciones.count()}")
    
    for asig in asignaciones:
        print(f"\n  - {asig.beneficio.nombre}")
        print(f"    Asignadas: {asig.tarjetas_asignadas}")
        print(f"    Vendidas: {asig.tarjetas_vendidas}")
        print(f"    Disponibles: {asig.tarjetas_disponibles}")
        print(f"    Deuda: ${asig.monto_pendiente}")
        print(f"    Estado: {asig.estado_pago}")

print("\n" + "="*80)
print("URL PARA PROBAR:")
print("="*80)
print("http://127.0.0.1:8000/pagar-beneficio.html?id=6")
print("\nSi no muestra beneficios:")
print("1. Abrir DevTools (F12)")
print("2. Ver tab Console")
print("3. Ver errores en Network")
print("="*80)
