// ==================== SISTEMA DE AUTENTICACIÓN ====================
// Sistema de permisos detallado por rol
const permissions = {
    'Ayudante': { 
        canEdit: false,
        canDelete: false,
        canCreate: false,
        canViewVoluntarios: false,
        canEditVoluntarios: false,
        canActivateVoluntarios: false,
        canViewCargos: false,
        canEditCargos: false,
        canViewSanciones: false,
        canEditSanciones: false,
        canOnlySuspensions: false,
        canViewFelicitaciones: false,
        canEditFelicitaciones: false,
        canViewAsistencia: true,
        canEditAsistencia: true,
        canViewHistorialAsistencia: true,
        canViewRanking: true,
        canViewFinanzas: false,
        canEditFinanzas: false,
        canViewUniformes: true,
        canEditUniformes: true,
        canViewTablaUniformes: true,
        canGeneratePDFFicha: false,
        canGeneratePDFVoluntarios: true,
        canUploadLogos: false,
        canViewAdminModules: false
    },
    'Capitán': { 
        canEdit: false,
        canDelete: false,
        canCreate: false,
        canViewVoluntarios: true,
        canEditVoluntarios: false,
        canActivateVoluntarios: false,
        canViewCargos: false,
        canEditCargos: false,
        canViewSanciones: true,
        canEditSanciones: true,
        canOnlySuspensions: true,
        canViewFelicitaciones: false,
        canEditFelicitaciones: false,
        canViewAsistencia: true,
        canEditAsistencia: true,
        canViewHistorialAsistencia: true,
        canViewRanking: true,
        canViewFinanzas: false,
        canEditFinanzas: false,
        canViewUniformes: true,
        canEditUniformes: true,
        canViewTablaUniformes: true,
        canGeneratePDFFicha: false,
        canGeneratePDFVoluntarios: true,
        canUploadLogos: false,
        canViewAdminModules: false
    },
    'Secretario': { 
        canEdit: true,
        canDelete: true,
        canCreate: true,
        canViewVoluntarios: true,
        canEditVoluntarios: true,
        canActivateVoluntarios: true,
        canViewCargos: true,
        canEditCargos: true,
        canViewSanciones: true,
        canEditSanciones: true,
        canOnlySuspensions: false,
        canViewFelicitaciones: true,
        canEditFelicitaciones: true,
        canViewAsistencia: false,
        canEditAsistencia: false,
        canViewHistorialAsistencia: false,
        canViewRanking: false,
        canViewFinanzas: false,
        canEditFinanzas: false,
        canViewUniformes: false,
        canEditUniformes: false,
        canViewTablaUniformes: true,
        canGeneratePDFFicha: true,
        canGeneratePDFVoluntarios: true,
        canUploadLogos: true,
        canViewAdminModules: false
    },
    'Tesorero': { 
        canEdit: false,
        canDelete: false,
        canCreate: false,
        canViewVoluntarios: true,
        canEditVoluntarios: false,
        canActivateVoluntarios: false,
        canViewCargos: false,
        canEditCargos: false,
        canViewSanciones: false,
        canEditSanciones: false,
        canOnlySuspensions: false,
        canViewFelicitaciones: false,
        canEditFelicitaciones: false,
        canViewAsistencia: false,
        canEditAsistencia: false,
        canViewHistorialAsistencia: false,
        canViewRanking: false,
        canViewFinanzas: true,
        canEditFinanzas: true,
        canViewUniformes: true,
        canEditUniformes: true,
        canViewTablaUniformes: false,
        canGeneratePDFFicha: false,
        canGeneratePDFVoluntarios: false,
        canUploadLogos: false,
        canViewAdminModules: false
    },
    'Director': { 
        canEdit: true,
        canDelete: true,
        canCreate: true,
        canViewVoluntarios: true,
        canEditVoluntarios: true,
        canActivateVoluntarios: true,
        canViewCargos: true,
        canEditCargos: true,
        canViewSanciones: true,
        canEditSanciones: true,
        canOnlySuspensions: false,
        canViewFelicitaciones: true,
        canEditFelicitaciones: true,
        canViewAsistencia: true,
        canEditAsistencia: false,
        canViewHistorialAsistencia: true,
        canViewRanking: true,
        canViewFinanzas: true,
        canEditFinanzas: false,
        canViewUniformes: true,
        canEditUniformes: true,
        canViewTablaUniformes: true,
        canGeneratePDFFicha: true,
        canGeneratePDFVoluntarios: true,
        canUploadLogos: true,
        canViewAdminModules: false
    },
    'Super Administrador': { 
        canEdit: true,
        canDelete: true,
        canCreate: true,
        canViewVoluntarios: true,
        canEditVoluntarios: true,
        canActivateVoluntarios: true,
        canViewCargos: true,
        canEditCargos: true,
        canViewSanciones: true,
        canEditSanciones: true,
        canOnlySuspensions: false,
        canViewFelicitaciones: true,
        canEditFelicitaciones: true,
        canViewAsistencia: true,
        canEditAsistencia: true,
        canViewHistorialAsistencia: true,
        canViewRanking: true,
        canViewFinanzas: true,
        canEditFinanzas: true,
        canViewUniformes: true,
        canEditUniformes: true,
        canViewTablaUniformes: true,
        canGeneratePDFFicha: true,
        canGeneratePDFVoluntarios: true,
        canUploadLogos: true,
        canViewAdminModules: true
    }
};

// Función para obtener permisos del usuario actual
function getUserPermissions() {
    if (!currentUser) return null;
    return permissions[currentUser.role] || null;
}
const users = {
    'director': { password: 'dir2024', role: 'Director' },
    'secretario': { password: 'sec2024', role: 'Secretario' },
    'tesorero': { password: 'tes2024', role: 'Tesorero' },
    'capitan': { password: 'cap2024', role: 'Capitán' },
    'ayudante': { password: 'ayu2024', role: 'Ayudante' },
    'superadmin': { password: 'admin2024', role: 'Super Administrador' }
};

let currentUser = null;

// Crear partículas de fondo
function createParticles() {
    const particlesContainer = document.getElementById('particles');
    const particleCount = 20;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 6 + 's';
        particle.style.animationDuration = (Math.random() * 3 + 3) + 's';
        particlesContainer.appendChild(particle);
    }
}

// Verificar autenticación
function checkAuth() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        return true;
    }
    return false;
}

// Redirigir si no está autenticado
function requireAuth() {
    if (!checkAuth()) {
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

// Manejar login
function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value.trim().toLowerCase();
    const password = document.getElementById('password').value;
    const submitBtn = document.getElementById('submitBtn');
    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('successMessage');
    
    // Limpiar mensajes
    errorMessage.classList.remove('show');
    successMessage.classList.remove('show');
    
    // Estado de carga
    submitBtn.classList.add('loading');
    submitBtn.textContent = 'VALIDANDO...';
    
    setTimeout(() => {
        if (users[username] && users[username].password === password) {
            currentUser = { 
                username: username, 
                role: users[username].role,
                loginTime: new Date().toISOString()
            };
            
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            successMessage.textContent = `¡Bienvenido, ${users[username].role}!`;
            successMessage.classList.add('show');
            
            setTimeout(() => {
                window.location.href = 'sistema.html';
            }, 1500);
        } else {
            errorMessage.textContent = 'Usuario o contraseña incorrectos';
            errorMessage.classList.add('show');
            
            document.querySelector('.login-container').style.animation = 'shake 0.5s ease-in-out';
            setTimeout(() => {
                document.querySelector('.login-container').style.animation = '';
            }, 500);
        }
        
        submitBtn.classList.remove('loading');
        submitBtn.textContent = 'INICIAR SESIÓN';
    }, 1500);
}

// Logout
function logout() {
    localStorage.removeItem('currentUser');
    currentUser = null;
    window.location.href = 'index.html';
}

// Inicializar auth
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('loginForm')) {
        createParticles();
        document.getElementById('loginForm').addEventListener('submit', handleLogin);
    }
    
    // Console info
    console.log('=== SISTEMA DE LOGIN ===');
    console.log('Usuarios disponibles:');
    Object.keys(users).forEach(username => {
        console.log(`👤 ${username} | 🔑 ${users[username].password} | 🎭 ${users[username].role}`);
    });
});