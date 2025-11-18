import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from voluntarios.models import Beneficio, AsignacionBeneficio, Voluntario

print("="*80)
print("VERIFICANDO BENEFICIO 'curanto junio'")
print("="*80)

# Buscar el beneficio
beneficio = Beneficio.objects.filter(nombre__icontains='curanto').filter(nombre__icontains='junio').first()

if beneficio:
    print(f"\n[BENEFICIO ENCONTRADO]")
    print(f"  ID: {beneficio.id}")
    print(f"  Nombre: {beneficio.nombre}")
    print(f"  Fecha evento: {beneficio.fecha_evento}")
    print(f"  Precio tarjeta: ${beneficio.precio_por_tarjeta}")
    print(f"  Estado: {beneficio.estado}")
    
    # Verificar asignaciones
    asignaciones = AsignacionBeneficio.objects.filter(beneficio=beneficio)
    print(f"\n[ASIGNACIONES CREADAS]")
    print(f"  Total: {asignaciones.count()}")
    
    if asignaciones.count() == 0:
        print("  [ERROR] NO SE CREARON ASIGNACIONES AUTOMATICAMENTE")
        print("  Esto significa que beneficios.js NO esta usando Django")
        
        # Contar voluntarios activos
        voluntarios_activos = Voluntario.objects.filter(estado__in=['activo', 'honorario', 'insigne'])
        print(f"\n[VOLUNTARIOS QUE DEBERIAN TENER ASIGNACION]")
        print(f"  Total voluntarios activos: {voluntarios_activos.count()}")
        
        print(f"\n[SOLUCION]")
        print("  1. Necesitas crear endpoint POST /api/crear-beneficio-django/")
        print("  2. Que cree el beneficio Y las asignaciones automaticamente")
        print("  3. Cambiar beneficios.js por beneficios-django.js")
    else:
        print(f"\n  Primeras 5 asignaciones:")
        for asig in asignaciones[:5]:
            print(f"    - {asig.voluntario.nombre}: {asig.tarjetas_asignadas} tarjetas, ${asig.monto_total}")
else:
    print("\n[NO ENCONTRADO]")
    print("  El beneficio 'curanto junio' NO existe en Django")
    print("  Esto confirma que beneficios.js usa localStorage (P6P)")
    
print("\n" + "="*80)
