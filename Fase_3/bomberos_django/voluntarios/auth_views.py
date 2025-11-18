"""
Vistas de autenticación - Migrado desde auth.js del p6p
"""
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User, Group
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
import json
from datetime import datetime
from .permissions import obtener_permisos_usuario, RolBomberos


# Usuarios por defecto del p6p
USUARIOS_DEFAULT = {
    'director': {'password': 'dir2024', 'role': 'Director'},
    'secretario': {'password': 'sec2024', 'role': 'Secretario'},
    'tesorero': {'password': 'tes2024', 'role': 'Tesorero'},
    'capitan': {'password': 'cap2024', 'role': 'Capitán'},
    'ayudante': {'password': 'ayu2024', 'role': 'Ayudante'},
    'superadmin': {'password': 'admin2024', 'role': 'Super Admin'},
}


def crear_usuarios_default():
    """Crea los usuarios por defecto del p6p si no existen"""
    for username, data in USUARIOS_DEFAULT.items():
        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                'is_staff': username == 'superadmin',
                'is_superuser': username == 'superadmin',
            }
        )
        
        if created:
            user.set_password(data['password'])
            user.save()
            
            # Asignar grupo/rol
            group, _ = Group.objects.get_or_create(name=data['role'])
            user.groups.add(group)
            
            print(f"✓ Usuario creado: {username} ({data['role']})")


@csrf_exempt
@require_http_methods(["POST"])
def login_view(request):
    """
    API de login - Compatible con auth.js del p6p
    
    POST /api/auth/login/
    Body: {"username": "...", "password": "..."}
    
    Response: {
        "success": true,
        "user": {
            "username": "...",
            "role": "...",
            "loginTime": "...",
            "permissions": {...}
        }
    }
    """
    try:
        data = json.loads(request.body)
        username = data.get('username', '').strip().lower()
        password = data.get('password', '')
        
        # Intentar autenticar
        user = authenticate(request, username=username, password=password)
        
        if user is not None:
            # Login exitoso
            login(request, user)
            
            # FORZAR que se guarde la sesión
            request.session.modified = True
            request.session.save()
            
            print(f"[LOGIN] Exitoso: {username}")
            print(f"[SESSION] Key: {request.session.session_key}")
            print(f"[SESSION] Saved: {request.session.session_key is not None}")
            print(f"[USER] Autenticado: {request.user.is_authenticated}")
            print(f"[COOKIES] Will set sessionid cookie")
            
            # Obtener permisos
            permisos_data = obtener_permisos_usuario(user)
            
            # Preparar respuesta (formato p6p)
            response_data = {
                'success': True,
                'user': {
                    'username': username,
                    'role': permisos_data.get('rol', 'Usuario'),
                    'loginTime': datetime.now().isoformat(),
                    'permissions': permisos_data.get('permisos', {})
                },
                'message': f'¡Bienvenido, {permisos_data.get("rol", "Usuario")}!'
            }
            
            response = JsonResponse(response_data)
            
            # IMPORTANTE: Asegurar que la cookie de sesión se envíe
            if request.session.session_key:
                response.set_cookie(
                    'sessionid',
                    request.session.session_key,
                    max_age=86400,  # 24 horas
                    httponly=True,
                    samesite='Lax',
                    secure=False  # False para localhost HTTP
                )
                print(f"[RESPONSE] Cookie sessionid seteada: {request.session.session_key[:10]}...")
            
            print("[RESPONSE] Enviando respuesta de login")
            return response
        else:
            # Login fallido
            return JsonResponse({
                'success': False,
                'error': 'Usuario o contraseña incorrectos'
            }, status=401)
            
    except json.JSONDecodeError:
        return JsonResponse({
            'success': False,
            'error': 'Datos inválidos'
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


@csrf_exempt
@require_http_methods(["POST", "GET"])
def logout_view(request):
    """
    API de logout - Compatible con auth.js del p6p
    
    POST /api/auth/logout/
    
    Response: {"success": true}
    """
    logout(request)
    return JsonResponse({
        'success': True,
        'message': 'Sesión cerrada correctamente'
    })


@csrf_exempt
@require_http_methods(["GET"])
def check_auth_view(request):
    """
    Verifica si el usuario está autenticado
    
    GET /api/auth/check/
    
    Response: {
        "authenticated": true/false,
        "user": {...} o null
    }
    """
    print(f"[CHECK_AUTH] Usuario: {request.user}, Autenticado: {request.user.is_authenticated}")
    
    if request.user.is_authenticated:
        permisos_data = obtener_permisos_usuario(request.user)
        
        print(f"[AUTH] Usuario autenticado: {request.user.username}, Rol: {permisos_data.get('rol')}")
        
        return JsonResponse({
            'authenticated': True,
            'user': {
                'username': request.user.username,
                'role': permisos_data.get('rol', 'Usuario'),
                'permissions': permisos_data.get('permisos', {})
            }
        })
    else:
        print("[AUTH] Usuario NO autenticado")
        return JsonResponse({
            'authenticated': False,
            'user': None
        })


@require_http_methods(["GET"])
def get_permissions_view(request):
    """
    Obtiene los permisos del usuario actual
    
    GET /api/auth/permissions/
    
    Response: {
        "role": "...",
        "permissions": {...}
    }
    """
    if not request.user.is_authenticated:
        return JsonResponse({
            'error': 'No autenticado'
        }, status=401)
    
    permisos_data = obtener_permisos_usuario(request.user)
    
    return JsonResponse(permisos_data)


@require_http_methods(["GET"])
def list_users_view(request):
    """
    Lista todos los usuarios disponibles (solo para desarrollo)
    
    GET /api/auth/users/
    """
    if not request.user.is_authenticated or not request.user.is_superuser:
        return JsonResponse({
            'error': 'No autorizado'
        }, status=403)
    
    users_list = []
    for username, data in USUARIOS_DEFAULT.items():
        users_list.append({
            'username': username,
            'password': data['password'],  # Solo para desarrollo
            'role': data['role']
        })
    
    return JsonResponse({
        'users': users_list
    })
