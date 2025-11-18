import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from voluntarios.models import Voluntario, EstadoCuotasBombero, ConfiguracionCuotas, CicloCuotas
from voluntarios.utils_tesoreria import obtener_precio_cuota

print("=" * 80)
print("PRUEBAS FINALES - SISTEMA ESTUDIANTE")
print("=" * 80)

# 1. Configuración de cuotas
print("\n[1] CONFIGURACION DE CUOTAS")
config = ConfiguracionCuotas.objects.first()
print(f"  Precio Regular: ${config.precio_regular}")
print(f"  Precio Estudiante: ${config.precio_estudiante}")

# 2. Ciclo activo
print("\n[2] CICLO ACTIVO")
ciclo = CicloCuotas.objects.filter(activo=True).first()
if ciclo:
    print(f"  Ciclo: {ciclo.anio}")
    print(f"  Activo: {ciclo.activo}")
else:
    print("  [ERROR] No hay ciclo activo")

# 3. Voluntario de prueba
print("\n[3] VOLUNTARIO DE PRUEBA")
voluntario = Voluntario.objects.get(id=7)
print(f"  ID: {voluntario.id}")
print(f"  Nombre: {voluntario.nombre} {voluntario.apellido_paterno}")

# 4. Estado de cuotas
print("\n[4] ESTADO DE CUOTAS")
estado, created = EstadoCuotasBombero.objects.get_or_create(voluntario=voluntario)
print(f"  Es estudiante: {estado.es_estudiante}")
print(f"  Cuotas desactivadas: {estado.cuotas_desactivadas}")
if estado.es_estudiante:
    print(f"  Fecha activacion: {estado.fecha_activacion_estudiante}")
    print(f"  Observaciones: {estado.observaciones_estudiante}")

# 5. Precio que se cobra
print("\n[5] PRECIO QUE SE LE COBRA")
precio = obtener_precio_cuota(voluntario)
print(f"  Precio actual: ${precio}")
if estado.es_estudiante:
    print(f"  ✅ Correcto - Cobra precio ESTUDIANTE")
else:
    print(f"  ℹ️  Cobra precio REGULAR (no es estudiante)")

print("\n" + "=" * 80)
print("ENDPOINTS A PROBAR")
print("=" * 80)
print(f"""
1. VER ESTADO:
   GET http://127.0.0.1:8000/api/voluntarios/7/estado-cuotas-simple/
   
2. ACTIVAR ESTUDIANTE:
   POST http://127.0.0.1:8000/api/voluntarios/7/activar-estudiante-simple/
   Body: FormData con certificado + ciclo_id + mes_inicio
   
3. CUOTAS DEL VOLUNTARIO:
   http://127.0.0.1:8000/cuotas-beneficios.html?id=7
   
4. PERFIL DEL VOLUNTARIO:
   http://127.0.0.1:8000/sistema.html (buscar a Juan Monje)
""")

print("=" * 80)
print("CHECKLIST MANUAL")
print("=" * 80)
print("""
□ 1. CTRL + F5 en perfil del voluntario
□ 2. Click "ACTIVAR ESTUDIANTE"
□ 3. Modal SIN campo "Año"
□ 4. Subir certificado PDF
□ 5. Seleccionar mes de inicio
□ 6. Click "ACTIVAR ESTUDIANTE"
□ 7. Ver mensaje de éxito
□ 8. Botón cambia a "👨‍🎓 Estudiante"
□ 9. Ir a Cuotas
□ 10. Select muestra SOLO "Cuota Estudiante"
□ 11. Select está deshabilitado
□ 12. Generar PDF muestra precio estudiante
""")
print("=" * 80)
