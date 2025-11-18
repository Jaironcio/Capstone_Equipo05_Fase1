import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.urls import get_resolver

def check_urls():
    resolver = get_resolver()
    
    print("URLs que contienen 'cuotas' o 'pagos':\n")
    for pattern in resolver.url_patterns:
        pattern_str = str(pattern.pattern)
        if 'cuotas' in pattern_str.lower() or 'pagos' in pattern_str.lower():
            print(f"  {pattern_str}")
            
            # Si es un include, mostrar sub-patterns
            if hasattr(pattern, 'url_patterns'):
                for sub in pattern.url_patterns:
                    sub_str = str(sub.pattern)
                    if 'cuotas' in sub_str.lower() or 'pagos' in sub_str.lower():
                        print(f"    -> {sub_str}")
    
    print("\n" + "="*50)
    print("TODAS las rutas de la API:")
    print("="*50)
    for pattern in resolver.url_patterns:
        pattern_str = str(pattern.pattern)
        if 'api' in pattern_str.lower():
            print(f"\n{pattern_str}")
            if hasattr(pattern, 'url_patterns'):
                for sub in pattern.url_patterns:
                    print(f"  -> {str(sub.pattern)}")

if __name__ == '__main__':
    check_urls()
