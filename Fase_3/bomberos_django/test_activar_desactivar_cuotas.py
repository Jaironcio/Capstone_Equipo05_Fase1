import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from voluntarios.models import Voluntario, EstadoCuotasBombero

print("=" * 80)
print("TEST: ACTIVAR/DESACTIVAR CUOTAS")
print("=" * 80)

# Paso 1: Seleccionar voluntario
print("\n[PASO 1] Seleccionar voluntario Juan Monje...")
voluntario = Voluntario.objects.get(id=7)
print(f"  [OK] {voluntario.nombre} {voluntario.apellido_paterno} (ID: {voluntario.id})")

# Paso 2: Ver estado actual
print("\n[PASO 2] Ver estado actual de cuotas...")
estado, created = EstadoCuotasBombero.objects.get_or_create(voluntario=voluntario)
if created:
    print("  [INFO] Estado creado (nuevo)")
else:
    print("  [INFO] Estado existente")

print(f"  - Cuotas desactivadas: {estado.cuotas_desactivadas}")
print(f"  - Motivo: {estado.motivo_desactivacion or 'N/A'}")
print(f"  - Es estudiante: {estado.es_estudiante}")

# Paso 3: Verificar endpoint
print("\n[PASO 3] Probar endpoints...")
print(f"  GET: /api/voluntarios/{voluntario.id}/estado-cuotas-simple/")
print(f"  POST: /api/voluntarios/{voluntario.id}/estado-cuotas-simple/")

print("\n" + "=" * 80)
print("INSTRUCCIONES DE PRUEBA MANUAL")
print("=" * 80)
print(f"""
1. ABRIR CUOTAS DEL VOLUNTARIO:
   URL: http://127.0.0.1:8000/cuotas-beneficios.html?id=7
   CTRL + F5 para recargar

2. VERIFICAR BOTON VISIBLE:
   Deberia aparecer un boton:
   - Si cuotas ACTIVAS: "Desactivar Cuotas" (amarillo/warning)
   - Si cuotas DESACTIVADAS: "Reactivar Cuotas" (verde/success)

3. PROBAR DESACTIVAR:
   a) Click en "Desactivar Cuotas"
   b) Ingresar motivo (ej: "Honorario Compania")
   c) Confirmar
   d) Verificar mensaje de exito
   e) El boton debe cambiar a "Reactivar Cuotas"
   f) Debe aparecer mensaje amarillo: "CUOTAS DESACTIVADAS"

4. PROBAR REACTIVAR:
   a) Click en "Reactivar Cuotas"
   b) Confirmar
   c) Verificar mensaje de exito
   d) El boton debe cambiar a "Desactivar Cuotas"
   e) El mensaje amarillo debe desaparecer

5. VERIFICAR EN CONSOLA:
   - Abrir DevTools (F12)
   - Ver Console
   - Debe mostrar: "Estado de cuotas: {{...}}"

Estado actual del voluntario:
  - ID: {voluntario.id}
  - Nombre: {voluntario.nombre} {voluntario.apellido_paterno}
  - Cuotas desactivadas: {estado.cuotas_desactivadas}
""")
print("=" * 80)
