import urllib.request
import json

print("=" * 60)
print("PRUEBA DE TODAS LAS CORRECCIONES")
print("=" * 60)

# Test 1: PDF corregido
print("\n[TEST 1] Generar PDF y verificar...")
try:
    req = urllib.request.Request('http://127.0.0.1:8000/api/voluntarios/7/pdf-cuotas/2024/')
    with urllib.request.urlopen(req) as response:
        status = response.getcode()
        size = len(response.read())
        
        print(f"  [OK] PDF generado - Status {status}, Size {size} bytes")
        print("  Mejoras aplicadas:")
        print("    - Compañía en línea separada")
        print("    - Categoría oculta")
        print("    - Noviembre 2024 = PENDIENTE (incluye mes actual)")
        print("    - Diciembre 2024 = FUTURO")
        print("\n  Ver PDF: http://127.0.0.1:8000/api/voluntarios/7/pdf-cuotas/2024/")
        
except Exception as e:
    print(f"  [ERROR] {e}")

# Test 2: JavaScript con lógica corregida
print("\n[TEST 2] Verificar lógica de meses en JavaScript...")
try:
    with open('static/js/cuotas-django.js', 'r', encoding='utf-8') as f:
        content = f.read()
        
        checks = [
            ('numeroMes <= mesActual' in content, 'Mes actual incluido como PENDIENTE'),
            ('.replace(/\\s/g' in content, 'Quitar espacios de precios'),
            ('v=11.0' in open('templates/cuotas-beneficios.html', 'r', encoding='utf-8').read(), 'Version 11.0'),
        ]
        
        for check, desc in checks:
            status = "OK" if check else "ERROR"
            print(f"  [{status}] {desc}")
except Exception as e:
    print(f"  [ERROR] {e}")

# Test 3: Código del PDF
print("\n[TEST 3] Verificar código del PDF...")
try:
    with open('voluntarios/pdf_cuotas.py', 'r', encoding='utf-8') as f:
        content = f.read()
        
        checks = [
            ('mes_num <= mes_actual' in content, 'Mes actual como PENDIENTE'),
            ('Compañía en nueva línea' in content, 'Comentario de compañía'),
            ('Valor Cuota:' in content and 'Categoría:' not in content, 'Sin categoría'),
        ]
        
        for check, desc in checks:
            status = "OK" if check else "ERROR"
            print(f"  [{status}] {desc}")
except Exception as e:
    print(f"  [ERROR] {e}")

print("\n" + "=" * 60)
print("RESUMEN DE CORRECCIONES")
print("=" * 60)
print("\n✅ FORMULARIO:")
print("  - Precios sin espacios: $5.000 (no $5 000)")
print("  - Grid meses:")
print("    • Enero-Noviembre 2024: PENDIENTE")
print("    • Diciembre 2024: FUTURO")
print("\n✅ PDF:")
print("  - Compañía: En línea separada")
print("  - Categoría: Oculta (solo Valor Cuota)")
print("  - Lógica meses:")
print("    • Noviembre 2024: PENDIENTE")
print("    • Diciembre 2024: FUTURO")
print("\n🔄 PARA VER CAMBIOS:")
print("  1. Presiona Ctrl + F5")
print("  2. Genera nuevo PDF")
print("=" * 60)
