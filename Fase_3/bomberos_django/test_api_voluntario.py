import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test import Client

client = Client()

print("="*80)
print("PROBANDO API VOLUNTARIO")
print("="*80)

# Obtener un voluntario
response = client.get('/api/voluntarios/2/')
print(f"\nGET /api/voluntarios/2/")
print(f"Status: {response.status_code}")

if response.status_code == 200:
    data = json.loads(response.content)
    print("\nCAMPOS DISPONIBLES:")
    for key, value in data.items():
        print(f"  {key}: {value}")
else:
    print(f"ERROR: {response.content}")

print("\n" + "="*80)
