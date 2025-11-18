import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from voluntarios.models import Voluntario, EstadoCuotasBombero, CicloCuotas
from django.utils import timezone

print("=" * 80)
print("ACTIVAR CRISTIAN VERA COMO ESTUDIANTE")
print("=" * 80)

# Obtener Cristian
voluntario = Voluntario.objects.filter(nombre__icontains='cristian', apellido_paterno__icontains='vera').first()

if voluntario:
    print(f"\n[VOLUNTARIO] {voluntario.nombre} {voluntario.apellido_paterno} (ID: {voluntario.id})")
    
    # Obtener ciclo activo
    ciclo = CicloCuotas.objects.filter(activo=True).first()
    print(f"[CICLO ACTIVO] {ciclo.anio if ciclo else 'Ninguno'}")
    
    # Obtener o crear estado
    estado, created = EstadoCuotasBombero.objects.get_or_create(voluntario=voluntario)
    
    print(f"\n[ANTES]")
    print(f"  Es estudiante: {estado.es_estudiante}")
    
    # Activar como estudiante
    estado.es_estudiante = True
    estado.fecha_activacion_estudiante = timezone.now()
    estado.observaciones_estudiante = f"Estudiante de Ingenieria - Ciclo {ciclo.anio if ciclo else 2025} desde mes 11 (Noviembre)"
    estado.save()
    
    print(f"\n[DESPUES]")
    print(f"  Es estudiante: {estado.es_estudiante}")
    print(f"  Fecha activacion: {estado.fecha_activacion_estudiante}")
    print(f"  Observaciones: {estado.observaciones_estudiante}")
    
    print(f"\n[OK] Cristian Vera activado como ESTUDIANTE")
    
    print(f"\n" + "=" * 80)
    print("AHORA PRUEBA:")
    print("=" * 80)
    print(f"""
1. CTRL + F5 en el navegador

2. IR A PERFIL:
   http://127.0.0.1:8000/sistema.html
   Buscar: Cristian Vera
   Deberia ver: Boton "Estudiante" (azul)

3. IR A CUOTAS:
   http://127.0.0.1:8000/cuotas-beneficios.html?id={voluntario.id}
   Deberia ver:
   - TAG "ESTUDIANTE" (verde)
   - Select solo "Cuota Estudiante - $2.000"
   - Select DESHABILITADO

4. VER PDF:
   http://127.0.0.1:8000/api/voluntarios/{voluntario.id}/pdf-cuotas/2025/
   Deberia mostrar:
   - Valor Cuota: $2.000
   - Deuda: $0 (ya pago todos los meses)

5. ENDPOINT:
   http://127.0.0.1:8000/api/voluntarios/{voluntario.id}/estado-cuotas-simple/
   Deberia retornar: es_estudiante: true
    """)
    
else:
    print("\n[ERROR] No se encontro a Cristian Vera")

print("=" * 80)
