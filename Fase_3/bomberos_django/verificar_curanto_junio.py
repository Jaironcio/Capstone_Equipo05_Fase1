import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from voluntarios.models import Beneficio, AsignacionBeneficio

print("="*80)
print("BUSCANDO 'curanto junio' EN DJANGO")
print("="*80)

# Buscar beneficio exacto
beneficio = Beneficio.objects.filter(nombre__icontains='curanto').filter(nombre__icontains='junio').first()

if beneficio:
    print(f"\n[SI EXISTE EN DJANGO]")
    print(f"  ID: {beneficio.id}")
    print(f"  Nombre: {beneficio.nombre}")
    print(f"  Fecha: {beneficio.fecha_evento}")
    print(f"  Precio: ${beneficio.precio_por_tarjeta}")
    
    asignaciones = AsignacionBeneficio.objects.filter(beneficio=beneficio)
    print(f"  Asignaciones: {asignaciones.count()}")
    print(f"  Deudores: {asignaciones.filter(estado_pago='pendiente').count()}")
else:
    print(f"\n[NO EXISTE EN DJANGO]")
    print("  El beneficio 'curanto junio' NO esta en la base de datos")
    print("  Esta guardado en localStorage (navegador)")
    
# Listar TODOS los beneficios en Django
print(f"\n[BENEFICIOS EN DJANGO]")
todos = Beneficio.objects.all()
print(f"  Total: {todos.count()}")
for b in todos:
    asig_count = AsignacionBeneficio.objects.filter(beneficio=b).count()
    print(f"  - {b.nombre} ({b.fecha_evento}) - {asig_count} asignaciones")

print("\n" + "="*80)
print("CONCLUSION:")
print("="*80)
if not beneficio:
    print("""
El beneficio 'curanto junio' que ves en la imagen:
- Esta en localStorage (navegador)
- NO esta en Django
- Por eso muestra 0 deudores

Para que funcione con Django, debes:
1. Crear el beneficio usando el endpoint POST /api/voluntarios/crear-beneficio-simple/
2. O modificar beneficios.js para que guarde en Django
    """)
print("="*80)
