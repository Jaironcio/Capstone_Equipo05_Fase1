// ==================== SIDEBAR DINÁMICO ====================
function initSidebar() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        // Si no hay usuario, redirigir al login
        window.location.href = 'index.html';
        return;
    }

    const permisos = getUserPermissions();
    if (!permisos) {
        console.error('No se pudieron cargar los permisos');
        return;
    }

    // Actualizar info de usuario
    const roleElement = document.getElementById('sidebarUserRole');
    const nameElement = document.getElementById('sidebarUserName');
    
    if (roleElement) roleElement.textContent = currentUser.role;
    if (nameElement) nameElement.textContent = `@${currentUser.username}`;

    // Generar menú según permisos
    const sidebarNav = document.getElementById('sidebarNav');
    if (sidebarNav) {
        sidebarNav.innerHTML = generarMenuSegunRol(permisos, currentUser.role);
    }

    // Actualizar saldo de compañía si el rol puede verlo
    if (permisos.canViewFinanzas) {
        actualizarSaldoCompania();
        actualizarBadgeDeudores();
    }

    console.log('✅ Sidebar inicializado para:', currentUser.role);
}

function actualizarBadgeDeudores() {
    const badge = document.getElementById('badgeDeudoresSidebar');
    if (!badge) return;

    // Calcular deudores (lógica similar a sistema.js)
    const bomberos = storage.getBomberos();
    const pagosCuotas = storage.getPagosCuotas();
    const pagosBeneficios = storage.getPagosBeneficios();
    const beneficios = storage.getBeneficios();

    const hoy = new Date();
    const mesActual = hoy.getMonth() + 1;
    const anioActual = hoy.getFullYear();

    const deudores = new Set();

    // Deudores de cuotas
    bomberos.forEach(bombero => {
        // Verificar si está exento de cuotas
        const categoria = Utils.calcularCategoriaBombero(bombero.fechaIngreso);
        const esHonorario = categoria.categoria && categoria.categoria.toLowerCase().includes('honorario');
        const esInsigne25 = categoria.categoria && categoria.categoria.toLowerCase().includes('insigne') && categoria.categoria.includes('25');
        const esMartir = bombero.estadoBombero === 'martir';
        
        // Si está exento, no verificar deudas
        if (esHonorario || esInsigne25 || esMartir) {
            return;
        }
        
        for (let mes = 1; mes <= mesActual; mes++) {
            const pagado = pagosCuotas.some(p => 
                p.bomberoId == bombero.id && 
                p.mes == mes && 
                p.anio == anioActual
            );
            if (!pagado) {
                deudores.add(bombero.id);
                break;
            }
        }
    });

    // Deudores de beneficios
    const beneficiosActivos = beneficios.filter(b => b.estado === 'activo');
    beneficiosActivos.forEach(beneficio => {
        bomberos.forEach(bombero => {
            const pago = pagosBeneficios.find(p => 
                p.bomberoId == bombero.id && 
                p.beneficioId === beneficio.id
            );
            const montoEsperado = beneficio.cantidadTarjetas * beneficio.precioTarjeta;
            const montoPagado = pago ? pago.montoPagado : 0;
            if (montoPagado < montoEsperado) {
                deudores.add(bombero.id);
            }
        });
    });

    const totalDeudores = deudores.size;
    
    if (totalDeudores > 0) {
        badge.textContent = totalDeudores;
        badge.style.display = 'inline-block';
    } else {
        badge.style.display = 'none';
    }
}

function mostrarNotificacionDeudores() {
    // Llamar a la función de sistema.js si existe
    if (typeof sistemaBomberos !== 'undefined' && typeof sistemaBomberos.toggleNotificacionDeudores === 'function') {
        sistemaBomberos.toggleNotificacionDeudores();
    } else {
        // Si no estamos en sistema.html, redirigir
        localStorage.setItem('mostrarDeudoresAlCargar', 'true');
        window.location.href = 'sistema.html';
    }
}

function actualizarSaldoCompania() {
    const saldoSidebar = document.getElementById('saldoSidebar');
    if (!saldoSidebar) return;

    const movimientos = storage.getMovimientosFinancieros();
    
    const ingresos = movimientos
        .filter(m => m.tipo === 'ingreso')
        .reduce((sum, m) => sum + parseFloat(m.monto), 0);
    
    const egresos = movimientos
        .filter(m => m.tipo === 'egreso')
        .reduce((sum, m) => sum + parseFloat(m.monto), 0);
    
    const saldo = ingresos - egresos;
    
    const saldoFormateado = new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        minimumFractionDigits: 0
    }).format(saldo);
    
    saldoSidebar.textContent = saldoFormateado;
    
    // Cambiar color según saldo
    if (saldo < 0) {
        saldoSidebar.style.color = '#f44336';
    } else if (saldo === 0) {
        saldoSidebar.style.color = '#ff9800';
    } else {
        saldoSidebar.style.color = '#4caf50';
    }
}

function generarMenuSegunRol(permisos, role) {
    let menuHTML = '';

    // SALDO Y NOTIFICACIONES (solo para Tesorero)
    if (permisos.canViewFinanzas && permisos.canEditFinanzas) {
        menuHTML += `
            <div class="sidebar-section-title">Finanzas</div>
            <div style="padding: 15px; background: rgba(76, 175, 80, 0.1); margin: 5px 15px; border-radius: 8px; border-left: 3px solid #4caf50;">
                <div style="font-size: 0.75rem; color: rgba(255,255,255,0.7); margin-bottom: 4px;">SALDO COMPAÑÍA</div>
                <div style="font-size: 1.3rem; font-weight: 700; color: #4caf50;" id="saldoSidebar">$0</div>
            </div>
            
            <a href="javascript:void(0)" class="sidebar-nav-item" onclick="mostrarNotificacionDeudores()" style="position: relative;">
                <span class="sidebar-nav-item-icon">🔔</span>
                <span class="sidebar-nav-item-text">Notificación Deudores</span>
                <span id="badgeDeudoresSidebar" style="position: absolute; right: 15px; top: 50%; transform: translateY(-50%); background: #f44336; color: white; border-radius: 12px; padding: 2px 8px; font-size: 0.75rem; font-weight: 700; display: none;">0</span>
            </a>
        `;
    }

    // MÓDULO VOLUNTARIOS
    if (permisos.canViewVoluntarios) {
        menuHTML += `
            <div class="sidebar-section-title">Gestión</div>
            <a href="sistema.html" class="sidebar-nav-item">
                <span class="sidebar-nav-item-icon">👥</span>
                <span class="sidebar-nav-item-text">Voluntarios</span>
            </a>
        `;
    }

    // MÓDULO CARGOS
    if (permisos.canViewCargos) {
        menuHTML += `
            <a href="javascript:void(0)" class="sidebar-nav-item" onclick="alert('Seleccione un voluntario desde la lista para gestionar sus cargos')">
                <span class="sidebar-nav-item-icon">📋</span>
                <span class="sidebar-nav-item-text">Cargos</span>
            </a>
        `;
    }

    // MÓDULO SANCIONES (aparece solo si no está en Asistencia)
    if (permisos.canViewSanciones && !permisos.canEditAsistencia) {
        const textoSanciones = permisos.canOnlySuspensions ? 'Suspensiones' : 'Sanciones';
        menuHTML += `
            <a href="javascript:void(0)" class="sidebar-nav-item" onclick="alert('Seleccione un voluntario desde la lista para gestionar ${textoSanciones.toLowerCase()}')">
                <span class="sidebar-nav-item-icon">⚖️</span>
                <span class="sidebar-nav-item-text">${textoSanciones}</span>
            </a>
        `;
    }

    // MÓDULO FELICITACIONES
    if (permisos.canViewFelicitaciones) {
        menuHTML += `
            <a href="javascript:void(0)" class="sidebar-nav-item" onclick="alert('Seleccione un voluntario desde la lista para gestionar felicitaciones')">
                <span class="sidebar-nav-item-icon">🏆</span>
                <span class="sidebar-nav-item-text">Felicitaciones</span>
            </a>
        `;
    }

    // SECCIÓN ASISTENCIA
    if (permisos.canViewAsistencia || permisos.canEditAsistencia) {
        if (!menuHTML.includes('sidebar-section-title')) {
            menuHTML += `<div class="sidebar-section-title">Asistencia</div>`;
        }
        
        if (permisos.canEditAsistencia) {
            menuHTML += `
                <a href="tipos-asistencia.html" class="sidebar-nav-item">
                    <span class="sidebar-nav-item-icon">📋</span>
                    <span class="sidebar-nav-item-text">Registrar Asistencia</span>
                </a>
            `;
        }
        
        if (permisos.canViewHistorialAsistencia) {
            menuHTML += `
                <a href="historial-asistencias.html" class="sidebar-nav-item">
                    <span class="sidebar-nav-item-icon">📊</span>
                    <span class="sidebar-nav-item-text">Historial</span>
                </a>
                <a href="historial-emergencias.html" class="sidebar-nav-item">
                    <span class="sidebar-nav-item-icon">🚨</span>
                    <span class="sidebar-nav-item-text">Detalle Emergencias</span>
                </a>
            `;
        }
        
        // PDF Voluntarios para Capitán, Ayudante y otros roles con permiso
        if (permisos.canGeneratePDFVoluntarios) {
            menuHTML += `
                <a href="javascript:void(0)" class="sidebar-nav-item" onclick="generarPDFVoluntariosAntiguedad()">
                    <span class="sidebar-nav-item-icon">📄</span>
                    <span class="sidebar-nav-item-text">PDF Voluntarios (Antigüedad)</span>
                </a>
            `;
        }
    }
    
    // MÓDULO UNIFORMES (no mostrar para Capitán, accede desde tarjetas)
    if (permisos.canViewUniformes && !permisos.canEditAsistencia) {
        if (!menuHTML.includes('Asistencia')) {
            menuHTML += `<div class="sidebar-section-title">Operaciones</div>`;
        }
        menuHTML += `
            <a href="uniformes.html" class="sidebar-nav-item">
                <span class="sidebar-nav-item-icon">👔</span>
                <span class="sidebar-nav-item-text">Uniformes</span>
            </a>
        `;
    }

    // SECCIÓN FINANZAS  
    if (permisos.canViewFinanzas) {
        if (!menuHTML.includes('sidebar-section-title')) {
            menuHTML += `<div class="sidebar-section-title">Finanzas</div>`;
        }
        
        menuHTML += `
            <a href="finanzas.html" class="sidebar-nav-item">
                <span class="sidebar-nav-item-icon">💰</span>
                <span class="sidebar-nav-item-text">Finanzas</span>
            </a>
        `;
        
        if (permisos.canEditFinanzas) {
            menuHTML += `
                <a href="beneficios.html" class="sidebar-nav-item">
                    <span class="sidebar-nav-item-icon">🎪</span>
                    <span class="sidebar-nav-item-text">Beneficios</span>
                </a>
                <a href="configurar-cuotas.html" class="sidebar-nav-item">
                    <span class="sidebar-nav-item-icon">⚙️</span>
                    <span class="sidebar-nav-item-text">Configurar Cuotas</span>
                </a>
            `;
        }
    }

    // SECCIÓN ADMIN (Solo Super Admin)
    if (permisos.canViewAdminModules) {
        menuHTML += `
            <div class="sidebar-section-title">Administración</div>
            <a href="admin-ciclos.html" class="sidebar-nav-item">
                <span class="sidebar-nav-item-icon">⚙️</span>
                <span class="sidebar-nav-item-text">Admin Ciclos</span>
            </a>
            <a href="generar-datos-prueba.html" class="sidebar-nav-item">
                <span class="sidebar-nav-item-icon">🔧</span>
                <span class="sidebar-nav-item-text">Datos Prueba</span>
            </a>
            <a href="limpiar-datos.html" class="sidebar-nav-item">
                <span class="sidebar-nav-item-icon">🗑️</span>
                <span class="sidebar-nav-item-text">Limpiar Datos</span>
            </a>
        `;
    }

    // SECCIÓN CONFIGURACIÓN (Para todos)
    menuHTML += `
        <div class="sidebar-section-title">Configuración</div>
        <a href="javascript:void(0)" class="sidebar-nav-item" onclick="abrirModalLogoCompania()">
            <span class="sidebar-nav-item-icon">🏢</span>
            <span class="sidebar-nav-item-text">Logo Compañía (PDFs)</span>
        </a>
    `;

    return menuHTML;
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('show');
}

// Función para generar PDF de voluntarios desde el menú
function generarPDFVoluntariosDesdeMenu() {
    if (typeof sistemaBomberos !== 'undefined' && typeof sistemaBomberos.generarPDFConsultaVoluntarios === 'function') {
        sistemaBomberos.generarPDFConsultaVoluntarios();
    } else {
        // Si no está en sistema.html, redirigir
        window.location.href = 'sistema.html';
    }
}

// Función global para generar PDF de voluntarios ordenados por antigüedad
function generarPDFVoluntariosAntiguedad() {
    // Verificar si estamos en sistema.html donde existe sistemaBomberos
    if (typeof sistemaBomberos !== 'undefined') {
        sistemaBomberos.generarPDFConsultaVoluntarios();
    } else {
        // Si no estamos en sistema.html, redirigir primero
        localStorage.setItem('generarPDFAlCargar', 'true');
        window.location.href = 'sistema.html';
    }
}

// ==================== CONFIGURACIÓN LOGO COMPAÑÍA ====================
function abrirModalLogoCompania() {
    // Crear modal dinámicamente
    const modalHTML = `
        <div id="modalLogoCompania" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 10000; display: flex; align-items: center; justify-content: center;">
            <div style="background: white; padding: 30px; border-radius: 15px; max-width: 600px; width: 90%; box-shadow: 0 10px 40px rgba(0,0,0,0.3);">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 15px; border-bottom: 2px solid #e5e7eb;">
                    <h2 style="margin: 0; color: #1f2937; font-size: 1.5rem;">🏢 Configuración Logo Compañía</h2>
                    <button onclick="cerrarModalLogoCompania()" style="background: none; border: none; font-size: 1.8rem; cursor: pointer; color: #6b7280; padding: 0; line-height: 1;">&times;</button>
                </div>
                
                <p style="color: #6b7280; margin-bottom: 20px;">
                    El logo aparecerá en todos los certificados PDF del sistema (fichas, sanciones, etc).
                </p>
                
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 10px; color: #1f2937; font-weight: 500;">
                        Seleccionar Logo:
                    </label>
                    <input type="file" id="inputLogoCompania" accept="image/*" 
                           onchange="cargarLogoCompania(this)"
                           style="display: block; width: 100%; padding: 12px; border: 2px dashed #d1d5db; border-radius: 8px; cursor: pointer; background: #f9fafb;">
                </div>
                
                <div id="previewLogoCompania" style="text-align: center; margin: 20px 0; min-height: 150px; display: flex; align-items: center; justify-content: center; background: #f3f4f6; border-radius: 8px; padding: 20px;">
                    ${localStorage.getItem('logoCompania') ? 
                        `<img src="${localStorage.getItem('logoCompania')}" style="max-width: 100%; max-height: 200px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);" alt="Logo actual">` :
                        `<span style="color: #9ca3af;">Sin logo configurado</span>`
                    }
                </div>
                
                <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 25px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
                    ${localStorage.getItem('logoCompania') ? 
                        `<button onclick="eliminarLogoCompania()" style="background: #ef4444; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: 500; transition: all 0.3s;">
                            🗑️ Eliminar Logo
                        </button>` : ''
                    }
                    <button onclick="cerrarModalLogoCompania()" style="background: #10b981; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: 500; transition: all 0.3s;">
                        ✓ Cerrar
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
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

// ==================== INICIALIZACIÓN ====================
// Inicializar sidebar cuando cargue el DOM
document.addEventListener('DOMContentLoaded', function() {
    // Esperar un poco para que auth.js termine de cargar
    setTimeout(() => {
        if (document.getElementById('sidebar')) {
            initSidebar();
        }
    }, 100);
});
