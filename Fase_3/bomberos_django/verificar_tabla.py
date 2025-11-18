import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bomberos_django.settings')
django.setup()

from django.db import connection

# Verificar columnas de la tabla felicitacion
with connection.cursor() as cursor:
    cursor.execute("PRAGMA table_info(voluntarios_felicitacion);")
    columns = cursor.fetchall()
    print("\n===== COLUMNAS DE voluntarios_felicitacion =====")
    for col in columns:
        print(f"  - {col[1]} ({col[2]})")
    
    # Contar registros
    cursor.execute("SELECT COUNT(*) FROM voluntarios_felicitacion;")
    count = cursor.fetchone()[0]
    print(f"\nTotal de registros: {count}")
