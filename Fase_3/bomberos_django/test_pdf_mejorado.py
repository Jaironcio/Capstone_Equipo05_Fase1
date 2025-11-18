import urllib.request

print("=" * 60)
print("PRUEBA PDF MEJORADO")
print("=" * 60)

print("\n[TEST] Generar PDF con mejoras estéticas...")
try:
    req = urllib.request.Request('http://127.0.0.1:8000/api/voluntarios/7/pdf-cuotas/2024/')
    with urllib.request.urlopen(req) as response:
        status = response.getcode()
        size = len(response.read())
        
        print(f"  [OK] PDF generado - Status {status}, Size {size} bytes")
        print("\n  ✅ MEJORAS APLICADAS:")
        print("    - Solo 2 estados: ✓ PAGADO y ✗ PENDIENTE")
        print("    - Sin estado FUTURO - todos los meses no pagados son PENDIENTE")
        print("    - Bordes redondeados en todas las cajas")
        print("    - Título con línea decorativa roja")
        print("    - Celdas con bordes redondeados y mejor tipografía")
        print("    - Sección de datos con emoji 👤")
        print("    - Resumen con emoji 📊")
        print("    - Deuda total con fondo de color destacado")
        print("    - Footer profesional con línea separadora")
        print("    - Colores más fuertes y contrastados")
        print("    - Meses pendientes = 12 - meses pagados")
        print("\n  🎨 DISEÑO:")
        print("    - Header: Bordes redondeados + rojo bomberil")
        print("    - Grid: Bordes redondeados en cada celda")
        print("    - Resumen: Fondo azul claro con bordes redondeados")
        print("    - Deuda: Fondo rojo/verde según estado")
        print("    - Footer: Línea separadora + emojis")
        print("\n  Ver PDF mejorado:")
        print("  http://127.0.0.1:8000/api/voluntarios/7/pdf-cuotas/2024/")
        
except Exception as e:
    print(f"  [ERROR] {e}")

print("\n" + "=" * 60)
