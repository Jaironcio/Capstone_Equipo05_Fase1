// ==================== SIDEBAR DINÁMICO - VERSION DJANGO ====================
async function initSidebar() {
    console.log('[SIDEBAR] Iniciando...');
    
    // Obtener usuario desde localStorage
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser && !window.currentUser) {
        window.currentUser = JSON.parse(storedUser);
    }
    
    // Si no hay usuario, mostrar mensaje pero no redirigir
    if (!window.currentUser) {
        console.error('[SIDEBAR] No hay usuario - sidebar sin inicializar');
        return;
    }
    
    console.log('[SIDEBAR] Usuario:', window.currentUser.username);

    // Actualizar logo de compañía si existe
    const logoCompania = localStorage.getItem('logoCompania');
    const sidebarLogo = document.querySelector('.sidebar-logo');
    if (logoCompania && sidebarLogo) {
        sidebarLogo.innerHTML = `<img src="${logoCompania}" alt="Logo" style="width: 70%; height: 70%; object-fit: contain; border-radius: 8px; margin: auto;">`;
    }

    // Actualizar info de usuario en sidebar
    const roleElement = document.getElementById('sidebarUserRole');
    const nameElement = document.getElementById('sidebarUserName');
    
    if (roleElement) roleElement.textContent = window.currentUser.role;
    if (nameElement) nameElement.textContent = `@${window.currentUser.username}`;

    // Generar menú según rol
    const sidebarNav = document.getElementById('sidebarNav');
    if (sidebarNav) {
        sidebarNav.innerHTML = generarMenuSegunRol(window.currentUser.role);
    }

    console.log('[SIDEBAR] Inicializado para:', window.currentUser.role);
}

function generarMenuSegunRol(role) {
    const menuItems = [];

    // GESTIÓN (para todos los que pueden ver voluntarios)
    if (['Director', 'Secretario', 'Tesorero', 'Capitán', 'Ayudante', 'Super Administrador'].includes(role)) {
        menuItems.push({
            titulo: 'GESTIÓN',
            items: [
                { icono: '👥', texto: 'Voluntarios', url: '/sistema.html' }
            ]
        });
    }

    // VOLUNTARIOS (solo para quienes pueden crear/editar)
    if (['Director', 'Secretario', 'Super Administrador'].includes(role)) {
        menuItems[0].items.push(
            { icono: '📋', texto: 'Cargos', url: '/cargos.html' },
            { icono: '⚖️', texto: 'Sanciones', url: '/listado-sanciones.html' },
            { icono: '🏆', texto: 'Felicitaciones', url: '/felicitaciones.html' }
        );
    }

    // ASISTENCIA (para todos EXCEPTO Tesorero)
    if (role !== 'Tesorero') {
        const asistenciaItems = [];
        
        // Registrar asistencia (SOLO Capitán y Ayudante)
        if (['Capitán', 'Ayudante'].includes(role)) {
            asistenciaItems.push(
                { icono: '✅', texto: 'Registrar Asistencia', url: '/tipos-asistencia.html' }
            );
        }
        
        // Historial (para todos los roles excepto Tesorero)
        asistenciaItems.push(
            { icono: '📊', texto: 'Historial', url: '/historial-asistencias.html' }
        );
        
        // Detalle Emergencias (SOLO Capitán y Ayudante)
        if (['Capitán', 'Ayudante'].includes(role)) {
            asistenciaItems.push(
                { icono: '🚒', texto: 'Detalle Emergencias', url: '/historial-emergencias.html' }
            );
        }
        
        // Ciclos de Asistencia (solo Director, Secretario y Super Admin)
        if (['Director', 'Secretario', 'Super Administrador'].includes(role)) {
            asistenciaItems.push(
                { icono: '🔄', texto: 'Ciclos de Asistencia', url: '/admin-ciclos.html' }
            );
        }
        
        menuItems.push({
            titulo: 'ASISTENCIA',
            items: asistenciaItems
        });
    }

    // OPERACIONES (para quienes pueden registrar)
    if (['Director', 'Secretario', 'Super Administrador', 'Capitán'].includes(role)) {
        menuItems.push({
            titulo: 'OPERACIONES',
            items: [
                { icono: '👔', texto: 'Uniformes', url: '/uniformes.html' }
            ]
        });
    }

    // FINANZAS (solo Tesorero, Director y Super Admin)
    if (['Tesorero', 'Director', 'Super Administrador'].includes(role)) {
        menuItems.push({
            titulo: 'FINANZAS',
            items: [
                { icono: '💰', texto: 'Finanzas', url: '/finanzas.html' },
                { icono: '🎫', texto: 'Beneficios', url: '/beneficios.html' },
                { icono: '⚙️', texto: 'Configurar Cuotas', url: '/configurar-cuotas.html' },
                { icono: '📅', texto: 'Ciclos de Cuotas', url: '/admin-ciclos-cuotas.html' }
            ],
            // Solo para Tesorero: widgets de saldo y deudores
            widgetSaldo: role === 'Tesorero',
            badgeDeudores: role === 'Tesorero'
        });
    }

    // PDF VOLUNTARIOS (para Ayudante y Capitán también)
    if (['Director', 'Secretario', 'Super Administrador', 'Capitán', 'Ayudante'].includes(role)) {
        menuItems.push({
            titulo: 'PDF VOLUNTARIOS',
            items: [
                { 
                    icono: '📄', 
                    texto: 'PDF Voluntarios (Antigüedad)', 
                    url: '#',
                    onclick: 'generarPDFDesdeMenu()'
                }
            ]
        });
    }

    // CONFIGURACIÓN (para todos)
    menuItems.push({
        titulo: 'CONFIGURACIÓN',
        items: [
            { 
                icono: '🏢', 
                texto: 'Logo Compañía (PDFs)', 
                url: '#',
                onclick: 'abrirModalLogoCompania()'
            }
        ]
    });

    // Generar HTML con estilos inline como fallback
    let html = '';
    menuItems.forEach(seccion => {
        html += `
            <div class="sidebar-section" style="margin-bottom: 20px;">
                <div class="sidebar-section-title" style="padding: 15px 20px 8px; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 1px; opacity: 0.6; font-weight: 600; color: rgba(255, 255, 255, 0.7);">
                    ${seccion.titulo}
                </div>
                
                ${/* Widget de Saldo (solo Tesorero) */ ''}
                ${seccion.widgetSaldo ? `
                    <div style="margin: 15px 20px; padding: 20px; background: rgba(255,255,255,0.1); border-radius: 12px; border-left: 4px solid #fbbf24;">
                        <div style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px; color: rgba(255,255,255,0.7); margin-bottom: 8px; font-weight: 600;">
                            SALDO COMPAÑÍA
                        </div>
                        <div id="sidebarSaldoCompania" style="font-size: 2rem; font-weight: 700; color: #fbbf24; text-shadow: 0 2px 8px rgba(251, 191, 36, 0.3);">
                            $0
                        </div>
                    </div>
                ` : ''}
                
                ${/* Badge de Deudores (solo Tesorero) */ ''}
                ${seccion.badgeDeudores ? `
                    <div style="margin: 15px 20px; padding: 15px 20px; background: rgba(239, 68, 68, 0.15); border-radius: 10px; border-left: 4px solid #ef4444; display: flex; align-items: center; justify-content: space-between;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <span style="font-size: 1.3rem;">🔔</span>
                            <span style="font-size: 0.9rem; font-weight: 600; color: white;">Notificación Deudores</span>
                        </div>
                        <div id="sidebarBadgeDeudores" style="background: #ef4444; color: white; padding: 4px 12px; border-radius: 20px; font-weight: 700; font-size: 0.9rem; min-width: 30px; text-align: center; box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);">
                            0
                        </div>
                    </div>
                ` : ''}
                
                ${seccion.items.map(item => `
                    <a href="${item.url}" 
                       class="sidebar-link" 
                       style="display: flex; align-items: center; padding: 12px 20px; color: white !important; text-decoration: none; transition: all 0.3s ease; cursor: pointer; border-left: 3px solid transparent;"
                       ${item.onclick ? `onclick="${item.onclick}; return false;"` : ''}
                       onmouseover="this.style.background='rgba(255,255,255,0.15)'; this.style.borderLeftColor='#fff';"
                       onmouseout="this.style.background='transparent'; this.style.borderLeftColor='transparent';">
                        <span class="sidebar-icon" style="font-size: 1.3rem; margin-right: 12px; min-width: 28px; text-align: center;">${item.icono}</span>
                        <span class="sidebar-text" style="font-size: 0.9rem; font-weight: 500; color: white;">${item.texto}</span>
                    </a>
                `).join('')}
            </div>
        `;
    });

    return html;
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('collapsed');
    }
}

function generarPDFDesdeMenu() {
    console.log('[PDF] Generando PDF de voluntarios...');
    // Esta función será implementada cuando migremos los PDFs
    alert('Función PDF en desarrollo - será migrada próximamente');
}

// ==================== CONFIGURACIÓN LOGO COMPAÑÍA ====================
function abrirModalLogoCompania() {
    // Crear modal con gestor de logos
    const modalHTML = `
        <div id="modalLogoCompania" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); z-index: 10000; display: flex; align-items: center; justify-content: center; overflow-y: auto; backdrop-filter: blur(5px);">
            <div style="background: linear-gradient(to bottom, #ffffff 0%, #f9fafb 100%); padding: 35px; border-radius: 20px; max-width: 900px; width: 90%; max-height: 90vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.4); margin: 20px; border: 1px solid rgba(255,255,255,0.8);">
                <!-- Header -->
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; padding-bottom: 20px; border-bottom: 3px solid #e5e7eb;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="background: linear-gradient(135deg, #3b82f6, #2563eb); width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem;">
                            🏢
                        </div>
                        <h2 style="margin: 0; color: #1f2937; font-size: 1.7rem; font-weight: 700;">Gestión de Logos</h2>
                    </div>
                    <button onclick="cerrarModalLogoCompania()" style="background: #f3f4f6; border: none; font-size: 1.8rem; cursor: pointer; color: #6b7280; padding: 8px 12px; line-height: 1; border-radius: 8px; transition: all 0.3s; hover: background: #e5e7eb;" onmouseover="this.style.background='#e5e7eb'" onmouseout="this.style.background='#f3f4f6'">&times;</button>
                </div>
                
                <!-- Info -->
                <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-left: 4px solid #3b82f6; padding: 16px 20px; border-radius: 12px; margin-bottom: 25px;">
                    <div style="display: flex; align-items: start; gap: 12px;">
                        <span style="font-size: 1.3rem;">ℹ️</span>
                        <div>
                            <strong style="color: #1e40af; display: block; margin-bottom: 4px;">Contextos de uso:</strong>
                            <p style="color: #1e3a8a; margin: 0; font-size: 0.9em; line-height: 1.5;">
                                📄 <strong>PDFs:</strong> Documentos oficiales y certificados<br>
                                📋 <strong>Asistencias:</strong> Headers de formularios de registro<br>
                                📁 <strong>Sidebar:</strong> Menú lateral del sistema
                            </p>
                        </div>
                    </div>
                </div>
                
                <!-- Botón para subir -->
                <div style="margin-bottom: 30px; text-align: center;">
                    <button id="btnSubirLogoNuevo" style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; border: none; padding: 16px 32px; border-radius: 12px; cursor: pointer; font-weight: 600; font-size: 1.05em; box-shadow: 0 4px 16px rgba(59, 130, 246, 0.4); transition: all 0.3s; transform: translateY(0);" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(59, 130, 246, 0.5)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 16px rgba(59, 130, 246, 0.4)'">
                        ➕ Subir Nuevo Logo
                    </button>
                    <input type="file" id="inputLogoNuevo" accept="image/*" style="display: none;">
                    <p style="margin-top: 10px; font-size: 0.85em; color: #6b7280;">Formatos: PNG, JPG, SVG • Tamaño máximo: 2MB</p>
                </div>
                
                <!-- Lista de logos -->
                <div id="listaLogos" style="margin-top: 25px;">
                    <div style="text-align: center; padding: 50px; color: #9ca3af;">
                        <div style="font-size: 3.5em; margin-bottom: 15px; animation: pulse 1.5s infinite;">⏳</div>
                        <p style="font-size: 1.1em; font-weight: 500;">Cargando logos...</p>
                    </div>
                </div>
                
                <!-- Footer -->
                <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb;">
                    <button onclick="cerrarModalLogoCompania()" style="background: linear-gradient(135deg, #10b981, #059669); color: white; border: none; padding: 12px 28px; border-radius: 10px; cursor: pointer; font-weight: 600; font-size: 1em; box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3); transition: all 0.3s;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(16, 185, 129, 0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(16, 185, 129, 0.3)'">
                        ✓ Cerrar
                    </button>
                </div>
            </div>
        </div>
        <style>
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }
        </style>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Cargar el script del gestor si no está cargado
    if (typeof GestorLogos === 'undefined') {
        const script = document.createElement('script');
        script.src = '/static/js/gestor-logos.js?v=2.0';
        script.onload = () => {
            window.inicializarGestorLogos();
        };
        document.head.appendChild(script);
    } else {
        window.inicializarGestorLogos();
    }
}

function cerrarModalLogoCompania() {
    const modal = document.getElementById('modalLogoCompania');
    if (modal) {
        modal.remove();
    }
}

function cargarLogoCompania(input) {
    if (input.files && input.files[0]) {
        const file = input.files[0];
        
        // Validar tamaño (máx 2MB)
        if (file.size > 2 * 1024 * 1024) {
            alert('⚠️ El archivo es demasiado grande. Máximo 2MB.');
            input.value = '';
            return;
        }
        
        // Validar tipo
        if (!file.type.startsWith('image/')) {
            alert('⚠️ Por favor seleccione una imagen válida.');
            input.value = '';
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            // Guardar en localStorage
            localStorage.setItem('logoCompania', e.target.result);
            
            // Actualizar logo en sidebar
            const sidebarLogo = document.querySelector('.sidebar-logo');
            if (sidebarLogo) {
                sidebarLogo.innerHTML = `<img src="${e.target.result}" alt="Logo" style="width: 70%; height: 70%; object-fit: contain; border-radius: 8px; margin: auto;">`;
            }
            
            // Actualizar preview
            const preview = document.getElementById('previewLogoCompania');
            if (preview) {
                preview.innerHTML = `<img src="${e.target.result}" style="max-width: 100%; max-height: 200px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);" alt="Logo">`;
            }
            
            // Mostrar notificación
            mostrarNotificacionModal('✅ Logo guardado correctamente', 'success');
            
            // Actualizar botones
            setTimeout(() => {
                cerrarModalLogoCompania();
                abrirModalLogoCompania(); // Reabrir para mostrar botón eliminar
            }, 500);
        };
        reader.readAsDataURL(file);
    }
}

function eliminarLogoCompania() {
    if (confirm('¿Está seguro de eliminar el logo de la compañía?')) {
        localStorage.removeItem('logoCompania');
        mostrarNotificacionModal('🗑️ Logo eliminado', 'info');
        
        // Restaurar emoji en sidebar
        const sidebarLogo = document.querySelector('.sidebar-logo');
        if (sidebarLogo) {
            sidebarLogo.innerHTML = '🚒';
        }
        
        // Actualizar preview
        const preview = document.getElementById('previewLogoCompania');
        if (preview) {
            preview.innerHTML = `<span style="color: #9ca3af;">Sin logo configurado</span>`;
        }
        
        setTimeout(() => {
            cerrarModalLogoCompania();
        }, 500);
    }
}

function mostrarNotificacionModal(mensaje, tipo) {
    const color = tipo === 'success' ? '#10b981' : tipo === 'error' ? '#ef4444' : '#3b82f6';
    const notif = document.createElement('div');
    notif.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${color};
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 11000;
        font-weight: 500;
        animation: slideIn 0.3s ease;
    `;
    notif.textContent = mensaje;
    document.body.appendChild(notif);
    
    setTimeout(() => notif.remove(), 3000);
}

// ==================== ACTUALIZAR WIDGETS TESORERO ====================

async function actualizarSaldoSidebar() {
    const saldoElement = document.getElementById('sidebarSaldoCompania');
    if (!saldoElement) return;
    
    try {
        console.log('[SIDEBAR] 💰 Consultando saldo...');
        const response = await fetch('/api/movimientos-financieros/', {
            credentials: 'include'
        });
        
        if (!response.ok) throw new Error('API error');
        
        const data = await response.json();
        const movimientos = data.results || [];
        
        let totalIngresos = 0;
        let totalEgresos = 0;
        
        movimientos.forEach(m => {
            const monto = parseFloat(m.monto) || 0;
            if (m.tipo === 'ingreso') totalIngresos += monto;
            else if (m.tipo === 'egreso') totalEgresos += monto;
        });
        
        const saldo = totalIngresos - totalEgresos;
        saldoElement.textContent = `$${saldo.toLocaleString('es-CL')}`;
        
        // Color según saldo
        if (saldo < 0) saldoElement.style.color = '#ef4444';
        else if (saldo === 0) saldoElement.style.color = '#9ca3af';
        else saldoElement.style.color = '#fbbf24';
        
        console.log('[SIDEBAR] ✅ Saldo: $' + saldo.toLocaleString('es-CL'));
    } catch (error) {
        console.error('[SIDEBAR] ❌ Error al actualizar saldo:', error);
        saldoElement.textContent = '$0';
    }
}

async function actualizarDeudoresSidebar() {
    const badgeElement = document.getElementById('sidebarBadgeDeudores');
    if (!badgeElement) return;
    
    try {
        // Por ahora dejar en 0, se puede conectar a la API de deudores después
        badgeElement.textContent = '0';
        console.log('[SIDEBAR] ✅ Badge deudores actualizado');
    } catch (error) {
        console.error('[SIDEBAR] ❌ Error al actualizar deudores:', error);
        badgeElement.textContent = '0';
    }
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initSidebar();
        // Actualizar widgets después de cargar sidebar
        setTimeout(() => {
            actualizarSaldoSidebar();
            actualizarDeudoresSidebar();
        }, 500);
    });
} else {
    // Si ya está cargado, ejecutar inmediatamente
    setTimeout(() => {
        initSidebar();
        setTimeout(() => {
            actualizarSaldoSidebar();
            actualizarDeudoresSidebar();
        }, 500);
    }, 100);
}

// Actualizar cada 30 segundos
setInterval(() => {
    actualizarSaldoSidebar();
    actualizarDeudoresSidebar();
}, 30000);
