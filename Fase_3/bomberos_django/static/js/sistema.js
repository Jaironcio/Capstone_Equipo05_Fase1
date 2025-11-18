// ==================== SISTEMA PRINCIPAL DE BOMBEROS ====================
class SistemaBomberos {
    constructor() {
        this.bomberos = [];
        this.terminoBusqueda = '';
        this.filtroEstado = 'todos'; // Filtro de estado
        this.paginationBomberos = null;
        this.init();
    }

    aplicarPermisosUI() {
        const permisos = getUserPermissions();
        if (!permisos) return;
        
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        const formContainer = document.querySelector('.form-container');
        const registrosButtons = document.querySelector('.registros-buttons');
        
        // Mostrar mensaje de bienvenida para todos
        if (formContainer && currentUser) {
            const mensaje = document.createElement('div');
            mensaje.className = 'info-solo-lectura mensaje-bienvenida';
            mensaje.innerHTML = `<h3>Bienvenido ${currentUser.role}</h3>`;
            mensaje.style.cssText = `
                background: linear-gradient(135deg, rgba(33, 150, 243, 0.1) 0%, rgba(25, 118, 210, 0.15) 100%);
                border: 2px solid rgba(33, 150, 243, 0.3);
                border-radius: 15px;
                padding: 20px;
                margin-bottom: 20px;
                text-align: center;
                animation: fadeIn 0.5s ease-in;
                transition: opacity 0.5s ease-out;
            `;
            formContainer.insertBefore(mensaje, formContainer.firstChild);
            
            // Desaparecer después de 4 segundos
            setTimeout(() => {
                mensaje.style.opacity = '0';
                setTimeout(() => mensaje.remove(), 500);
            }, 4000);
        }
        
        // Ocultar botón de crear voluntario si no tiene permisos
        if (!permisos.canCreate) {
            // Buscar el botón por atributo onclick
            const btnCrear = document.querySelector('button[onclick*="irACrear"]');
            if (btnCrear && btnCrear.parentElement) {
                btnCrear.parentElement.style.display = 'none';
            }
        }
        
        if (!permisos.canEdit) {
            if (formContainer) {
                const allElements = formContainer.querySelectorAll('form, .buttons, .modo-edicion');
                allElements.forEach(el => el.style.display = 'none');
            }
            
            if (registrosButtons) {
                registrosButtons.style.display = 'none';
            }
        }
    }

    async init() {
        if (!checkAuth()) {
            window.location.href = 'index.html';
            return;
        }

        this.inicializarContadores();
        await this.cargarDatos();
        this.migrarEstadosBomberos(); // NUEVO: Migrar bomberos sin campo estadoBombero
        this.configurarInterfaz();
        this.renderizarBomberos();
        this.mostrarInfoUsuario();
        this.aplicarPermisosUI();
        await this.calcularYMostrarDeudores();
        this.mostrarSaldoEnHeader();
        
        // Inicializar sidebar después de cargar todo
        if (typeof initSidebar === 'function') {
            initSidebar();
        }
        
        // Verificar si se debe generar PDF automáticamente
        if (localStorage.getItem('generarPDFAlCargar') === 'true') {
            localStorage.removeItem('generarPDFAlCargar');
            setTimeout(() => {
                this.generarPDFConsultaVoluntarios();
            }, 500);
        }
        
        // Verificar si se debe mostrar notificación de deudores
        if (localStorage.getItem('mostrarDeudoresAlCargar') === 'true') {
            localStorage.removeItem('mostrarDeudoresAlCargar');
            setTimeout(() => {
                this.toggleNotificacionDeudores();
            }, 500);
        }
    }

    inicializarContadores() {
        window.idCounter = 1;
        window.sancionIdCounter = 1;
        window.cargoIdCounter = 1;
        window.felicitacionIdCounter = 1;
        window.uniformeIdCounter = 1;
        
        console.log('✅ Contadores inicializados:', {
            idCounter: window.idCounter,
            sancionIdCounter: window.sancionIdCounter,
            cargoIdCounter: window.cargoIdCounter,
            felicitacionIdCounter: window.felicitacionIdCounter,
            uniformeIdCounter: window.uniformeIdCounter
        });
    }

    async cargarDatos() {
        this.bomberos = storage.getBomberos();
        
        // ORDENAR POR ANTIGÜEDAD: fecha de ingreso más antigua primero
        this.bomberos.sort((a, b) => {
            const fechaA = new Date(a.fechaIngreso);
            const fechaB = new Date(b.fechaIngreso);
            return fechaA - fechaB; // Más antiguo primero
        });
        
        // Asignar número de posición por antigüedad a cada bombero
        this.bomberos.forEach((b, index) => {
            b.posicionPorAntiguedad = index + 1;
        });
        
        console.log('📊 Datos cargados y ordenados por antigüedad:', this.bomberos.length, 'voluntarios');
    }


    guardarDatos() {
        storage.saveBomberos(this.bomberos);
        console.log('💾 Datos guardados');
    }

    // ==================== MIGRACIÓN DE ESTADOS ====================
    migrarEstadosBomberos() {
        let cambios = 0;
        this.bomberos.forEach(bombero => {
            if (!bombero.estadoBombero) {
                bombero.estadoBombero = 'activo'; // Por defecto, todos son activos
                cambios++;
            }
        });
        
        if (cambios > 0) {
            this.guardarDatos();
            console.log(`✅ Migración completada: ${cambios} bomberos actualizados con estado 'activo'`);
        }
    }

    configurarInterfaz() {
        document.getElementById('buscadorBomberos').addEventListener('input', (e) => {
            this.terminoBusqueda = e.target.value.toLowerCase();
            this.renderizarBomberos();
        });

        // Configurar botones de filtro de estado
        const botonesFilter = document.querySelectorAll('.btn-filtro-estado');
        botonesFilter.forEach(btn => {
            btn.addEventListener('click', () => {
                // Remover clase active de todos
                botonesFilter.forEach(b => {
                    b.classList.remove('active');
                    const estado = b.dataset.estado;
                    const colors = {
                        'todos': '#4caf50',
                        'activo': '#4caf50',
                        'renunciado': '#f59e0b',
                        'separado': '#ef4444',
                        'expulsado': '#dc2626',
                        'martir': '#9c27b0',
                        'fallecido': '#6b7280'
                    };
                    const color = colors[estado] || '#4caf50';
                    b.style.background = 'white';
                    b.style.color = color;
                });
                
                // Agregar clase active al botón clickeado
                btn.classList.add('active');
                const estado = btn.dataset.estado;
                const colors = {
                    'todos': '#4caf50',
                    'activo': '#4caf50',
                    'renunciado': '#f59e0b',
                    'separado': '#ef4444',
                    'expulsado': '#dc2626',
                    'martir': '#9c27b0',
                    'fallecido': '#6b7280'
                };
                const color = colors[estado] || '#4caf50';
                btn.style.background = color;
                btn.style.color = 'white';
                
                // Aplicar filtro
                this.filtroEstado = btn.dataset.estado;
                this.renderizarBomberos();
            });
        });

        document.getElementById('logoutBtn').addEventListener('click', () => {
            logout();
        });
    }

    mostrarInfoUsuario() {
        const userRoleInfo = document.getElementById('userRoleInfo');
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        
        if (currentUser) {
            userRoleInfo.textContent = `${currentUser.role}: ${currentUser.username}`;
            
            const btnBeneficios = document.getElementById('btnBeneficios');
            if (btnBeneficios && (currentUser.role === 'Director' || currentUser.role === 'Super Administrador' || currentUser.role === 'Tesorero')) {
                btnBeneficios.style.display = 'inline-block';
                btnBeneficios.onclick = () => {
                    this.verBeneficios();
                };
            }
            
            if (currentUser.role === 'Tesorero') {
                this.mostrarSaldoEnHeader();
                
                const btnFinanzas = document.getElementById('btnFinanzas');
                if (btnFinanzas) {
                    btnFinanzas.style.display = 'inline-block';
                    btnFinanzas.onclick = () => {
                        window.location.href = 'finanzas.html';
                    };
                }
                
                const btnDeudores = document.getElementById('btnDeudores');
                if (btnDeudores) {
                    btnDeudores.style.display = 'inline-block';
                    btnDeudores.onclick = () => {
                        this.toggleNotificacionDeudores();
                    };
                }
            }
            
            // Botones de Asistencia (visibles para todos)
            const btnRegistroAsistencia = document.getElementById('btnRegistroAsistencia');
            if (btnRegistroAsistencia) {
                btnRegistroAsistencia.style.display = 'inline-block';
                btnRegistroAsistencia.onclick = () => {
                    this.verRegistroAsistencia();
                };
            }
            
            const btnHistorialAsistencias = document.getElementById('btnHistorialAsistencias');
            if (btnHistorialAsistencias) {
                btnHistorialAsistencias.style.display = 'inline-block';
                btnHistorialAsistencias.onclick = () => {
                    this.verHistorialAsistencias();
                };
            }
            
            // Botón Listado de Sanciones
            const btnListadoSanciones = document.getElementById('btnListadoSanciones');
            if (btnListadoSanciones) {
                btnListadoSanciones.style.display = 'inline-block';
                btnListadoSanciones.onclick = () => {
                    window.location.href = 'listado-sanciones.html';
                };
            }
        }
    }

    mostrarSaldoEnHeader() {
        const saldoDiv = document.getElementById('saldoCompaniaHeader');
        const saldoMonto = document.getElementById('saldoMontoHeader');
        const saldoSidebar = document.getElementById('saldoSidebar');
        
        if (saldoDiv && saldoMonto) {
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
            
            saldoMonto.textContent = saldoFormateado;
            
            if (saldo < 0) {
                saldoMonto.style.color = '#f44336';
            } else if (saldo === 0) {
                saldoMonto.style.color = '#ff9800';
            } else {
                saldoMonto.style.color = '#4caf50';
            }
            
            saldoDiv.style.display = 'flex';
            
            // Actualizar también en el sidebar
            if (saldoSidebar) {
                saldoSidebar.textContent = saldoFormateado;
            }
        }
    }

    // ==================== REDIRIGIR A CREAR VOLUNTARIO ====================
    irACrear() {
        Utils.mostrarNotificacion('Redirigiendo a crear nuevo voluntario...', 'info');
        setTimeout(() => {
            window.location.href = 'crear-bombero.html';
        }, 800);
    }

renderizarBomberos() {
    // IMPORTANTE: this.bomberos ya está ordenado por antigüedad
    
    // Filtrar bomberos por búsqueda
    let bomberosFiltrados = this.terminoBusqueda ? 
        Utils.filtrarBomberos(this.bomberos, this.terminoBusqueda) : 
        this.bomberos;
    
    // Filtrar por estado
    if (this.filtroEstado !== 'todos') {
        bomberosFiltrados = bomberosFiltrados.filter(b => {
            const estadoBombero = b.estadoBombero || 'activo';
            return estadoBombero === this.filtroEstado;
        });
    }
    
    // Aplicar paginación
    const bomberosToShow = this.paginationBomberos ? 
        this.paginationBomberos.getCurrentPageItems() : 
        bomberosFiltrados;

    const listaBomberos = document.getElementById('listaBomberos');
    
    // Actualizar contador
    const totalElement = document.getElementById('totalBomberos');
    if (totalElement) {
        totalElement.textContent = `Total de bomberos registrados: ${this.bomberos.length}`;
    }
    
    if (bomberosToShow.length === 0) {
        listaBomberos.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #999;">
                <h3>No se encontraron bomberos</h3>
                <p>Intenta con otro término de búsqueda</p>
            </div>
        `;
        return;
    }

    const permisos = getUserPermissions();
    const puedeEditar = permisos && permisos.canEdit;
    const puedeEliminar = permisos && permisos.canDelete;
    const puedeVerCargos = permisos && permisos.canViewCargos;
    const puedeVerSanciones = permisos && permisos.canViewSanciones;

    listaBomberos.innerHTML = bomberosToShow.map((bombero, index) => {
        const nombreCompleto = Utils.obtenerNombreCompleto(bombero);
        const antiguedad = Utils.calcularAntiguedadDetallada(bombero.fechaIngreso);
        const edad = Utils.calcularEdad(bombero.fechaNacimiento);
        const categoria = Utils.calcularCategoriaBombero(bombero.fechaIngreso);
        
        // Usar la posición asignada al cargar los datos
        const posicionPorAntiguedad = bombero.posicionPorAntiguedad || (index + 1);
        
        // Estado del bombero
        const estadoBombero = bombero.estadoBombero || 'activo';
        const estadoInfo = {
            'activo': { icono: '✅', texto: 'ACTIVO', color: '#4caf50', bgColor: '#e8f5e9', borderColor: '#4caf50', cardBg: '#ffffff' },
            'inactivo': { icono: '⚠️', texto: 'INACTIVO', color: '#ff9800', bgColor: '#fff3e0', borderColor: '#ff9800', cardBg: '#fffbf0' },
            'renunciado': { icono: '🔄', texto: 'RENUNCIADO', color: '#f59e0b', bgColor: '#fef3c7', borderColor: '#f59e0b', cardBg: '#fffbeb' },
            'separado': { icono: '⏸️', texto: 'SEPARADO', color: '#ef4444', bgColor: '#fee2e2', borderColor: '#ef4444', cardBg: '#fef2f2' },
            'expulsado': { icono: '❌', texto: 'EXPULSADO', color: '#dc2626', bgColor: '#fecaca', borderColor: '#dc2626', cardBg: '#fee2e2' },
            'martir': { icono: '🕊️', texto: 'MÁRTIR', color: '#9c27b0', bgColor: '#f3e5f5', borderColor: '#9c27b0', cardBg: '#faf5ff' },
            'fallecido': { icono: '☠️', texto: 'FALLECIDO', color: '#6b7280', bgColor: '#f3f4f6', borderColor: '#6b7280', cardBg: '#f9fafb' }
        };
        const estado = estadoInfo[estadoBombero] || estadoInfo['activo'];
        
        // Verificar si puede reintegrarse
        const validacionReintegracion = Utils.puedeReintegrarse(bombero);
        const puedeReintegrarse = validacionReintegracion.puede;
        
        // NUEVO: Verificar si las cuotas están activas para este bombero
        const tieneCuotasActivas = bombero.cuotasActivas !== false;
        const categoriaTexto = categoria.categoria || categoria;
        const esHonorarioCompania = categoriaTexto === 'Voluntario Honorario de Compañía';
        const esHonorarioCuerpo = categoriaTexto === 'Voluntario Honorario del Cuerpo';
        const esInsigne = categoriaTexto === 'Voluntario Insigne de Chile';
        const esMartir = estadoBombero === 'martir';
        
        // Considerar exento si es: Honorario de Compañía (20-24), Honorario del Cuerpo (25-49), Insigne (50+) o Mártir
        const esExento = esHonorarioCompania || esHonorarioCuerpo || esInsigne || esMartir;
        
        // Ocultar botón de cuotas si es exento Y no tiene cuotas activadas
        const mostrarBotonCuotas = !(esExento && !tieneCuotasActivas);

        return `
            <div class="bombero-card" style="background-color: ${estado.cardBg}; border-left: 4px solid ${estado.borderColor};">
                <!-- Número por antigüedad -->
                <div class="bombero-numero">#${posicionPorAntiguedad}</div>
                
                <!-- Foto izquierda -->
                <div class="bombero-foto-wrapper">
                    ${bombero.foto ? `
                        <img src="${bombero.foto}" alt="${nombreCompleto}" class="bombero-foto" style="${estadoBombero !== 'activo' ? 'filter: grayscale(50%);' : ''}">
                    ` : `
                        <div class="bombero-sin-foto">Sin foto</div>
                    `}
                </div>
                
                <!-- Contenido -->
                <div class="bombero-contenido">
                    <!-- Header: Nombre + Botones -->
                    <div class="bombero-top">
                        <div>
                            <h2 class="bombero-nombre">${nombreCompleto} 
                                <span style="display: inline-block; background: ${estado.bgColor}; color: ${estado.color}; padding: 4px 12px; border-radius: 20px; font-size: 0.7rem; font-weight: 700; margin-left: 10px;">
                                    ${estado.icono} ${estado.texto}
                                </span>
                            </h2>
                            <p class="bombero-clave">Clave: ${bombero.claveBombero} | RUN: ${bombero.rut}</p>
                        </div>
                        
                        <div class="bombero-botones">
                            ${permisos && permisos.canGeneratePDFFicha ? `<button class="btn btn-pdf-ficha" onclick="sistemaBomberos.generarFichaPersonalPDF(${bombero.id})">📄 Ficha PDF</button>` : ''}
                            ${permisos && permisos.canViewFinanzas && mostrarBotonCuotas ? `<button class="btn btn-cuotas" onclick="sistemaBomberos.verCuotas(${bombero.id})">💳 Cuotas</button>` : ''}
                            ${permisos && permisos.canViewFinanzas && !esMartir ? `<button class="btn btn-beneficios" onclick="sistemaBomberos.verPagarBeneficios(${bombero.id})">🎫 Beneficios</button>` : ''}
                            ${permisos && permisos.canViewFinanzas && permisos.canEditFinanzas && !esMartir ? `<button class="btn btn-pdf" onclick="sistemaBomberos.generarPDFDeudasBombero(${bombero.id})">📄 PDF Deudas</button>` : ''}
                            <button class="btn btn-asistencias" onclick="verReporteAsistencias(${bombero.id})" style="background: linear-gradient(135deg, #3498db 0%, #2980b9 100%); color: white;">📊 Asistencias</button>
                            ${puedeEditar ? `<button class="btn btn-editar" onclick="sistemaBomberos.editarBombero(${bombero.id})">Editar</button>` : ''}
                            ${puedeReintegrarse && puedeEditar ? `<button class="btn btn-success" onclick="sistemaBomberos.iniciarReintegracion(${bombero.id})" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);">🔄 Reintegrar</button>` : ''}
                            ${puedeEliminar ? `<button class="btn ${estadoBombero === 'activo' ? 'btn-warning' : 'btn-success'}" onclick="sistemaBomberos.cambiarEstadoBombero(${bombero.id})">${estadoBombero === 'activo' ? '⚠️ Inactivar' : '✅ Activar'}</button>` : ''}
                            ${puedeVerCargos ? `<button class="btn btn-cargos" onclick="sistemaBomberos.verCargos(${bombero.id})">Cargos</button>` : ''}
                            ${puedeVerSanciones ? `<button class="btn btn-sanciones" onclick="sistemaBomberos.verSanciones(${bombero.id})">${permisos.canOnlySuspensions ? 'Suspensiones' : 'Sanciones'}</button>` : ''}
                            ${permisos && permisos.canViewFelicitaciones ? `<button class="btn btn-felicitaciones" onclick="sistemaBomberos.verFelicitaciones(${bombero.id})">🏆 Felicitaciones</button>` : ''}
                            ${permisos && permisos.canViewUniformes ? `<button class="btn btn-uniformes" onclick="sistemaBomberos.verUniformes(${bombero.id})">👔 Uniformes</button>` : ''}
                            ${permisos && permisos.canViewTablaUniformes ? `<button class="btn btn-tabla-uniformes" onclick="window.location.href='tabla-uniformes-voluntario.html?id=${bombero.id}'" title="Ver tabla de todos los uniformes del voluntario">📋 Tabla Uniformes</button>` : ''}
                            ${esExento && permisos && permisos.canEditFinanzas ? `<button class="btn ${tieneCuotasActivas ? 'btn-warning' : 'btn-success'}" onclick="sistemaBomberos.toggleCuotasActivas(${bombero.id})" title="${tieneCuotasActivas ? 'Desactivar' : 'Activar'} cuotas para este voluntario">${tieneCuotasActivas ? '🚫 Desactivar Cuotas' : '✅ Activar Cuotas'}</button>` : ''}
                            ${permisos && permisos.canEditFinanzas && !esMartir ? `<button class="btn ${bombero.esEstudiante ? 'btn-info' : 'btn-success'}" onclick="sistemaBomberos.${bombero.esEstudiante ? 'verCertificadoEstudiante' : 'activarEstudiante'}(${bombero.id})" title="${bombero.esEstudiante ? 'Ver certificado y gestionar' : 'Activar estado estudiante'}">${bombero.esEstudiante ? '👨‍🎓 Estudiante' : '➕ Activar Estudiante'}</button>` : ''}
                        </div>
                    </div>
                    
                    <!-- Edad y Antigüedad -->
                    <div class="bombero-edad-antiguedad">
                        <strong>Edad:</strong> ${edad} años
                        <span class="separador">|</span>
                        <strong>Antigüedad:</strong> ${antiguedad.años} años, ${antiguedad.meses} meses, ${antiguedad.dias} días
                    </div>
                    
                    <!-- Badge Categoría -->
<div class="categoria-box" style="border-left-color: ${categoria.color}; background-color: ${categoria.color}10; display: block; width: 100%; max-width: 400px;">                        ${categoria.icono} ${categoria.categoria}
                    </div>
                    
                    <!-- Grid Info -->
                    <div class="info-grid">
                        <div class="info-col">
                            <span class="info-label">Profesión:</span>
                            <span class="info-value">${bombero.profesion || 'N/A'}</span>
                        </div>
                        <div class="info-col">
                            <span class="info-label">Domicilio:</span>
                            <span class="info-value">${bombero.domicilio || 'N/A'}</span>
                        </div>
                        <div class="info-col">
                            <span class="info-label">Registro Nacional:</span>
                            <span class="info-value">${bombero.nroRegistro || 'N/A'}</span>
                        </div>
                        <div class="info-col">
                            <span class="info-label">Compañía:</span>
                            <span class="info-value">${bombero.compania || 'N/A'}</span>
                        </div>
                        <div class="info-col">
                            <span class="info-label">Grupo Sanguíneo:</span>
                            <span class="info-value">${bombero.grupoSanguineo || 'N/A'}</span>
                        </div>
                        <div class="info-col">
                            <span class="info-label">Fecha Ingreso:</span>
                            <span class="info-value">${Utils.formatearFecha(bombero.fechaIngreso)}</span>
                        </div>
                        <div class="info-col">
                            <span class="info-label">Teléfono:</span>
                            <span class="info-value">${bombero.telefono || 'N/A'}</span>
                        </div>
                        <div class="info-col">
                            <span class="info-label">Email:</span>
                            <span class="info-value">${bombero.email || 'N/A'}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    if (this.paginationBomberos) {
        this.paginationBomberos.renderControls('paginationControlsBomberos', 'sistemaBomberos.cambiarPagina');
    }
}

    cambiarPaginaBomberos(pageNumber) {
        if (this.paginationBomberos.goToPage(pageNumber)) {
            this.renderizarBomberos();
            document.getElementById('listaBomberos').scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }


async cambiarEstadoBombero(id) {
    // Convertir a número para comparación exacta
    const bombero = this.bomberos.find(b => b.id === parseInt(id));
    if (!bombero) return;

    const estadoActual = bombero.estadoBombero || 'activo';
    let nuevoEstado = '';
    let confirmacionMsg = '';
    
    if (estadoActual === 'activo') {
        confirmacionMsg = `¿Desea cambiar el estado del voluntario <strong>${Utils.obtenerNombreCompleto(bombero)}</strong> a INACTIVO?<br><br>Este voluntario ya no aparecerá como activo en el sistema.`;
        nuevoEstado = 'inactivo';
    } else if (estadoActual === 'inactivo') {
        confirmacionMsg = `¿Desea cambiar el estado del voluntario <strong>${Utils.obtenerNombreCompleto(bombero)}</strong> a ACTIVO?<br><br>Este voluntario volverá a estar activo en el sistema.`;
        nuevoEstado = 'activo';
    } else if (estadoActual === 'martir') {
        Utils.mostrarNotificacion('No se puede cambiar el estado de un mártir', 'warning');
        return;
    }

    const confirmado = await Utils.confirmarAccion(confirmacionMsg);

    if (confirmado) {
        bombero.estadoBombero = nuevoEstado;
        bombero.fechaCambioEstado = new Date().toISOString();
        this.guardarDatos();
        this.renderizarBomberos();
        Utils.mostrarNotificacion(`Estado cambiado a: ${nuevoEstado.toUpperCase()}`, 'success');
    }
}

    async toggleCuotasActivas(id) {
        // Convertir a número para comparación exacta
        const bombero = this.bomberos.find(b => b.id === parseInt(id));
        if (!bombero) return;

        const categoria = Utils.calcularCategoriaBombero(bombero.fechaIngreso);
        const categoriaTexto = categoria.categoria || categoria;
        const estadoActual = bombero.cuotasActivas !== false; // Por defecto true
        const nuevoEstado = !estadoActual;
        
        const accion = nuevoEstado ? 'ACTIVAR' : 'DESACTIVAR';
        const confirmacionMsg = `¿Desea ${accion} las cuotas sociales para <strong>${Utils.obtenerNombreCompleto(bombero)}</strong>?<br><br>` +
            `Categoría: <strong>${categoriaTexto}</strong><br><br>` +
            (nuevoEstado ? 
                '✅ Si activa las cuotas, este voluntario <strong>deberá pagar cuotas mensuales</strong> y aparecerá como deudor si no las paga.' :
                '🚫 Si desactiva las cuotas, este voluntario <strong>NO deberá pagar cuotas mensuales</strong> y no aparecerá como deudor.');

        const confirmado = await Utils.confirmarAccion(confirmacionMsg);

        if (confirmado) {
            bombero.cuotasActivas = nuevoEstado;
            bombero.fechaCambioCuotas = new Date().toISOString();
            this.guardarDatos();
            this.renderizarBomberos();
            Utils.mostrarNotificacion(
                `Cuotas ${nuevoEstado ? 'ACTIVADAS' : 'DESACTIVADAS'} para ${Utils.obtenerNombreCompleto(bombero)}`, 
                'success'
            );
        }
    }

    // ==================== GESTIÓN DE ESTUDIANTES ====================
    async activarEstudiante(id) {
        const bombero = this.bomberos.find(b => b.id === parseInt(id));
        if (!bombero) return;

        const nombreCompleto = Utils.obtenerNombreCompleto(bombero);
        const anioActual = new Date().getFullYear();
        const mesActual = new Date().getMonth() + 1;

        const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

        const modalHTML = `
            <div class="modal-overlay" id="modalEstudiante" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.7); display: flex; align-items: center; justify-content: center; z-index: 99999;">
                <div class="modal-content" style="background: white; border-radius: 15px; max-width: 600px; width: 90%; max-height: 90vh; overflow-y: auto; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);">
                    <div class="modal-header" style="padding: 20px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
                        <h3 style="margin: 0;">👨‍🎓 Activar Estado Estudiante</h3>
                        <button class="modal-close" onclick="document.getElementById('modalEstudiante').remove()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #999;">✖</button>
                    </div>
                    <div class="modal-body" style="padding: 20px;">
                        <p><strong>Voluntario:</strong> ${nombreCompleto}</p>
                        <p><strong>Clave:</strong> ${bombero.claveBombero}</p>
                        <hr style="margin: 15px 0;">
                        
                        <form id="formActivarEstudiante">
                            <div class="form-group">
                                <label class="required">Certificado de Alumno Regular:</label>
                                <input type="file" 
                                       id="certificadoEstudiante" 
                                       accept=".pdf,.jpg,.jpeg,.png" 
                                       required
                                       onchange="sistemaBomberos.previsualizarCertificado(this)">
                                <small class="form-help">PDF o imagen (máx 5MB)</small>
                                <div id="previewCertificado" style="margin-top: 10px;"></div>
                            </div>

                            <div class="form-row">
                                <div class="form-group">
                                    <label class="required">Aplicar desde Mes:</label>
                                    <select id="mesInicioEstudiante" required>
                                        ${meses.map((m, i) => `<option value="${i + 1}" ${i + 1 === mesActual ? 'selected' : ''}>${m}</option>`).join('')}
                                    </select>
                                </div>

                                <div class="form-group" style="display: none;">
                                    <input type="hidden" id="anioInicioEstudiante" value="${anioActual}">
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label>Observaciones:</label>
                                <textarea id="observacionesEstudiante" rows="3" placeholder="Observaciones adicionales (opcional)"></textarea>
                            </div>

                            <div class="info-box info-info">
                                <p><strong>ℹ️ Importante:</strong></p>
                                <p>Los meses anteriores a la fecha seleccionada se cobrarán a precio regular.</p>
                                <p>Desde el mes seleccionado en adelante, se aplicará el precio estudiante.</p>
                            </div>

                            <div class="form-actions">
                                <button type="button" class="btn btn-secondary" 
                                        onclick="document.getElementById('modalEstudiante').remove()">
                                    Cancelar
                                </button>
                                <button type="submit" class="btn btn-success">
                                    ✅ Activar Estudiante
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        document.getElementById('formActivarEstudiante').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.guardarActivacionEstudiante(bombero);
        });
    }

    previsualizarCertificado(input) {
        const preview = document.getElementById('previewCertificado');
        preview.innerHTML = '';
        
        if (input.files && input.files[0]) {
            const file = input.files[0];
            const fileSize = (file.size / 1024 / 1024).toFixed(2);
            
            if (fileSize > 5) {
                Utils.mostrarNotificacion('El archivo no debe superar los 5MB', 'error');
                input.value = '';
                return;
            }
            
            const fileName = file.name;
            const fileType = file.type;
            
            preview.innerHTML = `
                <div style="padding: 10px; background: #e8f5e9; border-radius: 5px; display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 24px;">${fileType.includes('pdf') ? '📄' : '🖼️'}</span>
                    <div style="flex: 1;">
                        <strong>${fileName}</strong><br>
                        <small>${fileSize} MB</small>
                    </div>
                </div>
            `;
        }
    }

    async guardarActivacionEstudiante(bombero) {
        const inputCertificado = document.getElementById('certificadoEstudiante');
        const mesInicio = parseInt(document.getElementById('mesInicioEstudiante').value);
        const anioInicio = parseInt(document.getElementById('anioInicioEstudiante').value);

        if (!inputCertificado.files || !inputCertificado.files[0]) {
            Utils.mostrarNotificacion('Debe seleccionar un certificado', 'error');
            return;
        }

        try {
            const archivo = inputCertificado.files[0];
            const certificadoBase64 = await Utils.leerArchivoComoBase64(archivo);

            bombero.esEstudiante = true;
            bombero.certificadoEstudiante = certificadoBase64;
            bombero.nombreCertificadoEstudiante = archivo.name;
            bombero.mesInicioEstudiante = mesInicio;
            bombero.anioInicioEstudiante = anioInicio;
            bombero.fechaActivacionEstudiante = new Date().toISOString();

            this.guardarDatos();
            this.renderizarBomberos();

            document.getElementById('modalEstudiante').remove();

            const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                          'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
            
            Utils.mostrarNotificacion(
                `✅ Estado estudiante activado desde ${meses[mesInicio - 1]} ${anioInicio}`, 
                'success'
            );
        } catch (error) {
            Utils.mostrarNotificacion('Error al procesar certificado: ' + error.message, 'error');
        }
    }

    async verCertificadoEstudiante(id) {
        const bombero = this.bomberos.find(b => b.id === parseInt(id));
        if (!bombero || !bombero.esEstudiante) return;

        const nombreCompleto = Utils.obtenerNombreCompleto(bombero);
        const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

        const modalHTML = `
            <div class="modal-overlay" id="modalVerEstudiante" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.7); display: flex; align-items: center; justify-content: center; z-index: 99999;">
                <div class="modal-content" style="background: white; border-radius: 15px; max-width: 700px; width: 90%; max-height: 90vh; overflow-y: auto; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);">
                    <div class="modal-header" style="padding: 20px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
                        <h3 style="margin: 0;">👨‍🎓 Información de Estudiante</h3>
                        <button class="modal-close" onclick="document.getElementById('modalVerEstudiante').remove()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #999;">✖</button>
                    </div>
                    <div class="modal-body" style="padding: 20px;">
                        <p><strong>Voluntario:</strong> ${nombreCompleto}</p>
                        <p><strong>Clave:</strong> ${bombero.claveBombero}</p>
                        <p><strong>Aplicando precio estudiante desde:</strong> ${meses[bombero.mesInicioEstudiante - 1]} ${bombero.anioInicioEstudiante}</p>
                        <p><strong>Fecha de activación:</strong> ${Utils.formatearFecha(bombero.fechaActivacionEstudiante)}</p>
                        <hr style="margin: 15px 0;">
                        
                        <h4>📄 Certificado:</h4>
                        <div style="margin: 15px 0;">
                            ${bombero.certificadoEstudiante.startsWith('data:application/pdf') ? `
                                <iframe src="${bombero.certificadoEstudiante}" 
                                        style="width: 100%; height: 400px; border: 1px solid #ddd; border-radius: 5px;">
                                </iframe>
                            ` : `
                                <img src="${bombero.certificadoEstudiante}" 
                                     style="max-width: 100%; height: auto; border: 1px solid #ddd; border-radius: 5px;"
                                     alt="Certificado">
                            `}
                        </div>
                        <p><strong>Nombre archivo:</strong> ${bombero.nombreCertificadoEstudiante}</p>

                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary" 
                                    onclick="document.getElementById('modalVerEstudiante').remove()">
                                Cerrar
                            </button>
                            <button type="button" class="btn btn-primary" 
                                    onclick="sistemaBomberos.descargarCertificado(${bombero.id})">
                                💾 Descargar
                            </button>
                            <button type="button" class="btn btn-warning" 
                                    onclick="sistemaBomberos.desactivarEstudiante(${bombero.id})">
                                ❌ Desactivar Estudiante
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    descargarCertificado(id) {
        const bombero = this.bomberos.find(b => b.id === parseInt(id));
        if (!bombero || !bombero.certificadoEstudiante) return;

        const link = document.createElement('a');
        link.href = bombero.certificadoEstudiante;
        link.download = bombero.nombreCertificadoEstudiante || 'certificado_estudiante.pdf';
        link.click();
        
        Utils.mostrarNotificacion('Certificado descargado', 'success');
    }

    async desactivarEstudiante(id) {
        const bombero = this.bomberos.find(b => b.id === parseInt(id));
        if (!bombero) return;

        const confirmado = await Utils.confirmarAccion(
            `¿Está seguro de desactivar el estado estudiante de <strong>${Utils.obtenerNombreCompleto(bombero)}</strong>?<br><br>` +
            `Se volverá a aplicar el precio regular de cuotas.`
        );

        if (confirmado) {
            bombero.esEstudiante = false;
            bombero.fechaDesactivacionEstudiante = new Date().toISOString();
            // Mantener el certificado por historial, pero marcar como inactivo
            
            this.guardarDatos();
            this.renderizarBomberos();
            
            const modal = document.getElementById('modalVerEstudiante');
            if (modal) modal.remove();
            
            Utils.mostrarNotificacion('Estado estudiante desactivado', 'success');
        }
    }

    editarBombero(id) {
        // Convertir a número para comparación exacta
        const bombero = this.bomberos.find(b => b.id === parseInt(id));
        if (!bombero) {
            Utils.mostrarNotificacion('Bombero no encontrado', 'error');
            return;
        }

        localStorage.setItem('bomberoEditarActual', id);
        Utils.mostrarNotificacion('Redirigiendo a editar voluntario...', 'info');
        setTimeout(() => {
            window.location.href = 'editar-bombero.html';
        }, 800);
    }

    verSanciones(id) {
        Utils.mostrarNotificacion('Redirigiendo a sanciones...', 'info');
        localStorage.setItem('bomberoSancionActual', id);
        setTimeout(() => window.location.href = 'sanciones.html', 1000);
    }

    verFelicitaciones(id) {
        Utils.mostrarNotificacion('Redirigiendo a felicitaciones...', 'info');
        localStorage.setItem('bomberoFelicitacionActual', id);
        setTimeout(() => window.location.href = 'felicitaciones.html', 1000);
    }

    verUniformes(id) {
        Utils.mostrarNotificacion('Redirigiendo a uniformes...', 'info');
        localStorage.setItem('bomberoUniformeActual', id);
        setTimeout(() => window.location.href = 'uniformes.html', 1000);
    }

    verCargos(id) {
        Utils.mostrarNotificacion('Redirigiendo a cargos...', 'info');
        localStorage.setItem('bomberoCargoActual', id);
        setTimeout(() => window.location.href = 'cargos.html', 1000);
    }

    iniciarReintegracion(id) {
        Utils.mostrarNotificacion('Iniciando proceso de reintegración...', 'info');
        localStorage.setItem('voluntarioReintegracionId', id);
        setTimeout(() => window.location.href = 'reintegracion-voluntario.html', 1000);
    }

    verCuotas(id) {
        Utils.mostrarNotificacion('Redirigiendo a cuotas y beneficios...', 'info');
        localStorage.setItem('bomberoCuotasActual', id);
        setTimeout(() => window.location.href = 'cuotas-beneficios.html', 1000);
    }

    verRegistroAsistencia() {
        Utils.mostrarNotificacion('Seleccione el tipo de asistencia...', 'info');
        setTimeout(() => window.location.href = 'tipos-asistencia.html', 800);
    }

    verHistorialAsistencias() {
        Utils.mostrarNotificacion('Redirigiendo a historial de asistencias...', 'info');
        setTimeout(() => window.location.href = 'historial-asistencias.html', 800);
    }

    async generarFichaPersonalPDF(id) {
        // Convertir a número para comparación exacta
        const bombero = this.bomberos.find(b => b.id === parseInt(id));
        
        if (!bombero) {
            Utils.mostrarNotificacion('Bombero no encontrado', 'error');
            return;
        }

        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.width;
            const pageHeight = doc.internal.pageSize.height;
            const margin = 20;
            let yPos = 20;

            // Obtener logo de compañía
            const logoCompania = localStorage.getItem('logoCompania');

            // ENCABEZADO con fondo negro
            doc.setFillColor(0, 0, 0); // Negro
            doc.rect(0, 0, pageWidth, 60, 'F');

            // FOTO DEL VOLUNTARIO (izquierda)
            if (bombero.foto) {
                try {
                    doc.addImage(bombero.foto, 'JPEG', 12, 10, 40, 40);
                } catch (error) {
                    console.warn('No se pudo cargar la foto del voluntario');
                }
            }

            // LOGO DE LA COMPAÑÍA (derecha)
            if (logoCompania) {
                try {
                    doc.addImage(logoCompania, 'PNG', pageWidth - 52, 10, 40, 40);
                } catch (error) {
                    console.warn('No se pudo cargar el logo de la compañía');
                }
            }

            // Título principal (centro)
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(24);
            doc.setFont(undefined, 'bold');
            doc.text('FICHA PERSONAL', pageWidth / 2, 25, { align: 'center' });
            
            // Subtítulo
            doc.setFontSize(14);
            doc.setFont(undefined, 'normal');
            doc.text('Voluntario Bombero', pageWidth / 2, 35, { align: 'center' });
            
            // Fecha de emisión
            doc.setFontSize(10);
            doc.text(new Date().toLocaleDateString('es-CL', { 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
            }), pageWidth / 2, 48, { align: 'center' });

            yPos = 70;

            // DATOS PERSONALES
            doc.setTextColor(0, 0, 0);
            doc.setFillColor(196, 30, 58);
            doc.rect(margin, yPos, pageWidth - 2 * margin, 10, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            doc.text('DATOS PERSONALES', pageWidth / 2, yPos + 7, { align: 'center' });
            
            yPos += 18;
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(11);
            doc.setFont(undefined, 'normal');

            // Nombre completo
            const nombreCompleto = Utils.obtenerNombreCompleto(bombero);
            doc.setFont(undefined, 'bold');
            doc.text('Nombre Completo:', margin, yPos);
            doc.setFont(undefined, 'normal');
            doc.text(nombreCompleto, margin + 50, yPos);
            yPos += 7;

            // RUN
            doc.setFont(undefined, 'bold');
            doc.text('RUN:', margin, yPos);
            doc.setFont(undefined, 'normal');
            doc.text(bombero.rut || 'N/A', margin + 50, yPos);
            yPos += 7;

            // Fecha de Nacimiento y Edad
            const edad = Utils.calcularEdad(bombero.fechaNacimiento);
            doc.setFont(undefined, 'bold');
            doc.text('Fecha de Nacimiento:', margin, yPos);
            doc.setFont(undefined, 'normal');
            doc.text(`${Utils.formatearFecha(bombero.fechaNacimiento)} (${edad} años)`, margin + 50, yPos);
            yPos += 7;

            // Sexo
            if (bombero.sexo) {
                doc.setFont(undefined, 'bold');
                doc.text('Sexo:', margin, yPos);
                doc.setFont(undefined, 'normal');
                doc.text(bombero.sexo, margin + 50, yPos);
                yPos += 7;
            }

            // Estado Civil
            if (bombero.estadoCivil) {
                doc.setFont(undefined, 'bold');
                doc.text('Estado Civil:', margin, yPos);
                doc.setFont(undefined, 'normal');
                doc.text(bombero.estadoCivil, margin + 50, yPos);
                yPos += 7;
            }

            // Profesión
            doc.setFont(undefined, 'bold');
            doc.text('Profesión:', margin, yPos);
            doc.setFont(undefined, 'normal');
            doc.text(bombero.profesion || 'N/A', margin + 50, yPos);
            yPos += 7;

            // Grupo Sanguíneo
            doc.setFont(undefined, 'bold');
            doc.text('Grupo Sanguíneo:', margin, yPos);
            doc.setFont(undefined, 'normal');
            doc.text(bombero.grupoSanguineo || 'N/A', margin + 50, yPos);
            yPos += 7;

            // Padrino 1
            if (bombero.nombrePrimerPadrino) {
                doc.setFont(undefined, 'bold');
                doc.text('Primer Padrino:', margin, yPos);
                doc.setFont(undefined, 'normal');
                doc.text(bombero.nombrePrimerPadrino, margin + 50, yPos);
                yPos += 7;
            }

            // Padrino 2
            if (bombero.nombreSegundoPadrino) {
                doc.setFont(undefined, 'bold');
                doc.text('Segundo Padrino:', margin, yPos);
                doc.setFont(undefined, 'normal');
                doc.text(bombero.nombreSegundoPadrino, margin + 50, yPos);
                yPos += 7;
            }

            yPos += 3;

            // DATOS DE CONTACTO
            doc.setFillColor(25, 118, 210); // Azul
            doc.rect(margin, yPos, pageWidth - 2 * margin, 10, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            doc.text('DATOS DE CONTACTO', pageWidth / 2, yPos + 7, { align: 'center' });
            
            yPos += 18;
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(11);
            doc.setFont(undefined, 'normal');

            // Domicilio
            doc.setFont(undefined, 'bold');
            doc.text('Domicilio:', margin, yPos);
            doc.setFont(undefined, 'normal');
            const domicilio = bombero.domicilio || 'N/A';
            const domicilioLines = doc.splitTextToSize(domicilio, pageWidth - margin - 60);
            doc.text(domicilioLines, margin + 50, yPos);
            yPos += (domicilioLines.length * 7);

            // Teléfono
            doc.setFont(undefined, 'bold');
            doc.text('Teléfono:', margin, yPos);
            doc.setFont(undefined, 'normal');
            doc.text(bombero.telefono || 'N/A', margin + 50, yPos);
            yPos += 7;

            // Email
            doc.setFont(undefined, 'bold');
            doc.text('Email:', margin, yPos);
            doc.setFont(undefined, 'normal');
            doc.text(bombero.email || 'N/A', margin + 50, yPos);
            yPos += 10;

            // DATOS INSTITUCIONALES
            doc.setFillColor(196, 30, 58);
            doc.rect(margin, yPos, pageWidth - 2 * margin, 10, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            doc.text('DATOS INSTITUCIONALES', pageWidth / 2, yPos + 7, { align: 'center' });
            
            yPos += 18;
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(11);
            doc.setFont(undefined, 'normal');

            // Clave Bombero
            doc.setFont(undefined, 'bold');
            doc.text('Clave Bombero:', margin, yPos);
            doc.setFont(undefined, 'normal');
            doc.text(bombero.claveBombero, margin + 50, yPos);
            yPos += 7;

            // Número de Registro
            doc.setFont(undefined, 'bold');
            doc.text('N° Registro Nacional:', margin, yPos);
            doc.setFont(undefined, 'normal');
            doc.text(bombero.nroRegistro || 'N/A', margin + 50, yPos);
            yPos += 7;

            // Compañía
            doc.setFont(undefined, 'bold');
            doc.text('Compañía:', margin, yPos);
            doc.setFont(undefined, 'normal');
            doc.text(bombero.compania || 'N/A', margin + 50, yPos);
            yPos += 7;

            // Fecha de Ingreso
            doc.setFont(undefined, 'bold');
            doc.text('Fecha de Ingreso:', margin, yPos);
            doc.setFont(undefined, 'normal');
            doc.text(Utils.formatearFecha(bombero.fechaIngreso), margin + 50, yPos);
            yPos += 7;

            // Antigüedad
            const antiguedad = Utils.calcularAntiguedadDetallada(bombero.fechaIngreso);
            doc.setFont(undefined, 'bold');
            doc.text('Antigüedad:', margin, yPos);
            doc.setFont(undefined, 'normal');
            doc.text(`${antiguedad.años} años, ${antiguedad.meses} meses, ${antiguedad.dias} días`, margin + 50, yPos);
            yPos += 7;

            // Categoría
            const categoria = Utils.calcularCategoriaBombero(bombero.fechaIngreso);
            doc.setFont(undefined, 'bold');
            doc.text('Categoría:', margin, yPos);
            doc.setFont(undefined, 'normal');
            doc.text(categoria.categoria, margin + 50, yPos);
            yPos += 7;

            // Estado
            const estadoBombero = bombero.estadoBombero || 'activo';
            doc.setFont(undefined, 'bold');
            doc.text('Estado:', margin, yPos);
            doc.setFont(undefined, 'normal');
            doc.text(estadoBombero.toUpperCase(), margin + 50, yPos);
            yPos += 15;

            // FOOTER
            doc.setFontSize(9);
            doc.setFont(undefined, 'italic');
            doc.setTextColor(120, 120, 120);
            doc.text('Este documento certifica los datos personales e institucionales del voluntario', pageWidth / 2, pageHeight - 20, { align: 'center' });
            doc.text('registrados en el sistema del Cuerpo de Bomberos', pageWidth / 2, pageHeight - 15, { align: 'center' });
            doc.setFont(undefined, 'normal');
            doc.text(`Generado el ${new Date().toLocaleDateString('es-CL')}`, pageWidth / 2, pageHeight - 10, { align: 'center' });

            // Guardar PDF
            doc.save(`Ficha_Personal_${bombero.claveBombero}_${new Date().toISOString().split('T')[0]}.pdf`);
            Utils.mostrarNotificacion('Ficha personal generada exitosamente', 'success');
        } catch (error) {
            console.error('Error al generar PDF:', error);
            Utils.mostrarNotificacion('Error al generar la ficha personal: ' + error.message, 'error');
        }
    }

    async toggleDatosEjemplo() {
        const tieneEjemplos = storage.tieneEjemplosActivos();
        
        if (tieneEjemplos) {
            const confirmado = await Utils.confirmarAccion(
                '¿Está seguro de eliminar TODOS los datos de ejemplo? ' +
                'Esto removerá 6 bomberos, 12 sanciones y 18 cargos de ejemplo.'
            );
            
            if (confirmado) {
                const resultado = storage.eliminarEjemplos();
                
                this.bomberos = storage.getBomberos();
                this.terminoBusqueda = '';
                document.getElementById('buscadorBomberos').value = '';
                this.renderizarBomberos();
                
                Utils.mostrarNotificacion(
                    `Ejemplos eliminados: ${resultado.bomberosEliminados} bomberos, ` +
                    `${resultado.sancionesEliminadas} sanciones, ` +
                    `${resultado.cargosEliminados} cargos`,
                    'success'
                );
            }
        } else {
            const confirmado = await Utils.confirmarAccion(
                '¿Cargar datos de ejemplo completos? ' +
                'Esto incluirá 6 bomberos con diferentes categorías, ' +
                '12 sanciones disciplinarias y 18 cargos históricos.'
            );
            
            if (confirmado) {
                const resultado = storage.cargarEjemplosCompletos();
                
                this.bomberos = storage.getBomberos();
                this.renderizarBomberos();
                
                Utils.mostrarNotificacion(
                    `Ejemplos cargados: ${resultado.bomberos} bomberos, ` +
                    `${resultado.sanciones} sanciones, ` +
                    `${resultado.cargos} cargos`,
                    'success'
                );
            }
        }
    }

    toggleInfoCategorias() {
        const info = document.getElementById('infoCategorias');
        info.style.display = info.style.display === 'none' ? 'block' : 'none';
    }

    verBeneficios() {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        const puedeVer = currentUser.role === 'Director' || 
                         currentUser.role === 'Super Administrador' || 
                         currentUser.role === 'Tesorero';
        
        if (puedeVer) {
            window.location.href = 'beneficios.html';
        } else {
            Utils.mostrarNotificacion('No tienes permisos para acceder a esta sección', 'error');
        }
    }

    verPagarBeneficios(id) {
        Utils.mostrarNotificacion('Redirigiendo a pago de beneficios...', 'info');
        localStorage.setItem('bomberoPagarBeneficioActual', id);
        setTimeout(() => window.location.href = 'pagar-beneficio.html', 1000);
    }

    async generarPDFDeudasBombero(bomberoId) {
        // Convertir a número para comparación exacta
        const bombero = this.bomberos.find(b => b.id === parseInt(bomberoId));
        if (!bombero) {
            Utils.mostrarNotificacion('Bombero no encontrado', 'error');
            return;
        }

        try {
            Utils.mostrarNotificacion('Generando PDF de deudas...', 'info');
            
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.width;
            let yPos = 20;

            const pagosCuotas = storage.getPagosCuotas();
            const asignaciones = storage.getAsignacionesBeneficios();
            const beneficios = storage.getBeneficios();
            
            const hoy = new Date();
            const mesActual = hoy.getMonth() + 1;
            const anioActual = hoy.getFullYear();

            // Calcular deudas de cuotas
            const deudaCuotasData = [];
            let totalDeudaCuotas = 0;
            
            // Obtener precios configurados
            const configCuotas = localStorage.getItem('configuracionCuotas');
            const precioRegular = configCuotas ? JSON.parse(configCuotas).precioRegular : 5000;
            const precioEstudiante = configCuotas ? JSON.parse(configCuotas).precioEstudiante : 3000;
            
            // Verificar si el voluntario está exento de cuotas
            const tieneCuotasActivas = bombero.cuotasActivas !== false;
            const categoria = Utils.calcularCategoriaBombero(bombero.fechaIngreso);
            const categoriaTexto = categoria.categoria || categoria;
            const esHonorarioCompania = categoriaTexto === 'Voluntario Honorario de Compañía';
            const esHonorarioCuerpo = categoriaTexto === 'Voluntario Honorario del Cuerpo';
            const esInsigne = categoriaTexto === 'Voluntario Insigne de Chile';
            const esMartir = bombero.estadoBombero === 'martir';
            
            // Solo calcular deudas si NO está exento o si tiene cuotas activadas
            const debeCalcularCuotas = !((esHonorarioCompania || esHonorarioCuerpo || esInsigne || esMartir) && !tieneCuotasActivas);
            
            if (debeCalcularCuotas) {
                const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                             'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
                
                for (let mes = 1; mes <= mesActual; mes++) {
                    const pagado = pagosCuotas.find(p => 
                        p.bomberoId == bombero.id && 
                        p.mes == mes && 
                        p.anio == anioActual
                    );
                    if (!pagado) {
                        // Determinar precio según si es estudiante y la fecha
                        let precio = precioRegular;
                        let tipoTexto = 'Regular';
                        
                        if (bombero.esEstudiante && bombero.mesInicioEstudiante && bombero.anioInicioEstudiante) {
                            const fechaMes = anioActual * 12 + mes;
                            const fechaInicioEstudiante = bombero.anioInicioEstudiante * 12 + bombero.mesInicioEstudiante;
                            
                            if (fechaMes >= fechaInicioEstudiante) {
                                precio = precioEstudiante;
                                tipoTexto = 'Estudiante';
                            }
                        }
                        
                        deudaCuotasData.push({
                            mes: meses[mes - 1],
                            anio: anioActual,
                            monto: precio,
                            tipo: tipoTexto
                        });
                        totalDeudaCuotas += precio;
                    }
                }
            }

            // Calcular deudas de beneficios (solo si NO es mártir)
            const deudaBeneficiosData = [];
            let totalDeudaBeneficios = 0;
            
            if (!esMartir) {
                // Buscar asignaciones de este bombero
                const asignacionesBombero = asignaciones.filter(a => a.bomberoId == bombero.id);
                
                asignacionesBombero.forEach(asignacion => {
                    const beneficio = beneficios.find(b => b.id === asignacion.beneficioId);
                    if (!beneficio || beneficio.estado !== 'activo') return;
                    
                    // Solo considerar pendientes o parciales
                    if (asignacion.estadoPago === 'pendiente' || asignacion.estadoPago === 'parcial') {
                        const montoPendiente = asignacion.montoEsperado - asignacion.montoPagado;
                        
                        if (montoPendiente > 0) {
                            deudaBeneficiosData.push({
                                nombre: beneficio.nombre,
                                montoPendiente: montoPendiente,
                                montoEsperado: asignacion.montoEsperado,
                                montoPagado: asignacion.montoPagado,
                                fechaLimite: beneficio.fechaLimiteRendicion,
                                vencido: new Date(beneficio.fechaLimiteRendicion) < hoy
                            });
                            totalDeudaBeneficios += montoPendiente;
                        }
                    }
                });
            }

            const deudaTotal = totalDeudaCuotas + totalDeudaBeneficios;

            // Logo
            const logoCompania = localStorage.getItem('logoCompania');
            if (logoCompania) {
                try {
                    doc.addImage(logoCompania, 'PNG', 15, 10, 25, 25);
                } catch (error) {
                    console.warn('Error al cargar logo:', error);
                }
            }

            // Encabezado
            doc.setFontSize(18);
            doc.setFont(undefined, 'bold');
            doc.text('INFORME DE DEUDAS', pageWidth / 2, yPos, { align: 'center' });
            
            yPos += 10;
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            doc.text(`Fecha: ${new Date().toLocaleDateString('es-CL')}`, pageWidth / 2, yPos, { align: 'center' });

            // Datos del voluntario
            yPos += 15;
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.text('DATOS DEL VOLUNTARIO', 15, yPos);
            
            yPos += 8;
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            doc.text(`Nombre: ${Utils.obtenerNombreCompleto(bombero)}`, 15, yPos);
            yPos += 6;
            doc.text(`Clave: ${bombero.claveBombero}`, 15, yPos);
            yPos += 6;
            doc.text(`RUT: ${bombero.rut}`, 15, yPos);
            yPos += 6;
            doc.text(`Compañía: ${bombero.compania}`, 15, yPos);

            // Resumen de deudas
            yPos += 12;
            doc.setFillColor(240, 240, 240);
            doc.rect(15, yPos, pageWidth - 30, 35, 'F');
            
            yPos += 8;
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.text('RESUMEN DE DEUDAS', 20, yPos);
            
            yPos += 8;
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            const formatMonto = (monto) => new Intl.NumberFormat('es-CL', {
                style: 'currency',
                currency: 'CLP',
                minimumFractionDigits: 0
            }).format(monto);
            
            doc.text(`Deuda en Cuotas: ${formatMonto(totalDeudaCuotas)} (${deudaCuotasData.length} meses)`, 20, yPos);
            yPos += 6;
            doc.text(`Deuda en Beneficios: ${formatMonto(totalDeudaBeneficios)} (${deudaBeneficiosData.length} beneficios)`, 20, yPos);
            
            yPos += 8;
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            if (deudaTotal > 0) {
                doc.setTextColor(244, 67, 54); // Rojo
            } else {
                doc.setTextColor(76, 175, 80); // Verde
            }
            doc.text(`TOTAL ADEUDADO: ${formatMonto(deudaTotal)}`, 20, yPos);
            doc.setTextColor(0, 0, 0);

            // Detalle de cuotas
            if (deudaCuotasData.length > 0) {
                yPos += 15;
                doc.setFontSize(12);
                doc.setFont(undefined, 'bold');
                doc.text('CUOTAS PENDIENTES', 15, yPos);
                
                yPos += 5;
                const cuotasData = deudaCuotasData.map(d => [
                    d.mes,
                    d.anio,
                    d.tipo,
                    formatMonto(d.monto)
                ]);

                doc.autoTable({
                    startY: yPos,
                    head: [['Mes', 'Año', 'Tipo', 'Monto']],
                    body: cuotasData,
                    theme: 'grid',
                    headStyles: { fillColor: [255, 152, 0], fontSize: 10 },
                    bodyStyles: { fontSize: 9 },
                    columnStyles: {
                        2: { 
                            halign: 'center',
                            cellWidth: 30,
                            fontStyle: 'bold'
                        },
                        3: { 
                            halign: 'right',
                            fontStyle: 'bold'
                        }
                    },
                    didParseCell: function(data) {
                        if (data.section === 'body' && data.column.index === 2) {
                            if (data.cell.raw === 'Estudiante') {
                                data.cell.styles.textColor = [33, 150, 243]; // Azul para estudiante
                            }
                        }
                    },
                    margin: { left: 15, right: 15 }
                });

                yPos = doc.lastAutoTable.finalY + 10;
            }

            // Detalle de beneficios
            if (deudaBeneficiosData.length > 0) {
                if (yPos > 220) {
                    doc.addPage();
                    yPos = 20;
                }

                doc.setFontSize(12);
                doc.setFont(undefined, 'bold');
                doc.text('BENEFICIOS PENDIENTES', 15, yPos);
                
                yPos += 5;
                const beneficiosData = deudaBeneficiosData.map(d => [
                    d.nombre,
                    formatMonto(d.montoEsperado),
                    formatMonto(d.montoPagado),
                    formatMonto(d.montoPendiente),
                    Utils.formatearFecha(d.fechaLimite),
                    d.vencido ? 'VENCIDO' : 'Vigente'
                ]);

                doc.autoTable({
                    startY: yPos,
                    head: [['Beneficio', 'Monto Esperado', 'Pagado', 'Deuda', 'Fecha Límite', 'Estado']],
                    body: beneficiosData,
                    theme: 'grid',
                    headStyles: { fillColor: [33, 150, 243], fontSize: 9 },
                    bodyStyles: { fontSize: 9 },
                    margin: { left: 15, right: 15 },
                    columnStyles: {
                        0: { cellWidth: 50 },
                        1: { cellWidth: 30, halign: 'right' },
                        2: { cellWidth: 25, halign: 'right' },
                        3: { cellWidth: 25, halign: 'right', fontStyle: 'bold' },
                        4: { cellWidth: 28 },
                        5: { 
                            cellWidth: 22,
                            fontStyle: 'bold',
                            halign: 'center'
                        }
                    },
                    didParseCell: function(data) {
                        if (data.section === 'body' && data.column.index === 5) {
                            if (data.cell.raw === 'VENCIDO') {
                                data.cell.styles.textColor = [244, 67, 54];
                            } else {
                                data.cell.styles.textColor = [76, 175, 80];
                            }
                        }
                    }
                });
            }

            // Footer
            yPos = doc.internal.pageSize.height - 20;
            doc.setFontSize(8);
            doc.setTextColor(128, 128, 128);
            doc.text('Este documento es un informe generado automáticamente por el Sistema SEIS', pageWidth / 2, yPos, { align: 'center' });

            // Guardar
            const nombreArchivo = `Informe_Deudas_${bombero.claveBombero}_${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(nombreArchivo);

            Utils.mostrarNotificacion('✅ PDF de deudas generado exitosamente', 'success');
        } catch (error) {
            console.error('Error al generar PDF:', error);
            Utils.mostrarNotificacion('❌ Error al generar PDF: ' + error.message, 'error');
        }
    }

    async calcularYMostrarDeudores() {
        const pagosCuotas = storage.getPagosCuotas();
        const hoy = new Date();
        const mesActual = hoy.getMonth() + 1;
        const anioActual = hoy.getFullYear();
        
        let deudoresCuotas = [];
        
        this.bomberos.forEach(bombero => {
            // VALIDAR SI PUEDE PAGAR CUOTAS (categoría + estado)
            const categoria = Utils.calcularCategoriaBombero(bombero.fechaIngreso);
            const categoriaTexto = categoria.categoria || categoria;
            const esHonorarioCompania = categoriaTexto === 'Voluntario Honorario de Compañía';
            const esHonorarioCuerpo = categoriaTexto === 'Voluntario Honorario del Cuerpo';
            const esInsigne = categoriaTexto === 'Voluntario Insigne de Chile';
            
            // Exentos por categoría
            if (esHonorarioCompania || esHonorarioCuerpo || esInsigne) {
                return;
            }
            
            // Validar por estado del voluntario
            const validacionEstado = Utils.puedePagarCuotas(bombero);
            if (!validacionEstado.puede) {
                return; // No puede pagar (renunciado, separado, expulsado, mártir, fallecido)
            }
            
            // NUEVO: Verificar si las cuotas están activas para este bombero
            const tieneCuotasActivas = bombero.cuotasActivas !== false; // Por defecto true
            if (!tieneCuotasActivas) {
                return;
            }
            
            let mesesPendientes = 0;
            let deudaCuotas = 0;
            
            // Obtener precios configurados
            const configCuotas = localStorage.getItem('configuracionCuotas');
            const precioRegular = configCuotas ? JSON.parse(configCuotas).precioRegular : 5000;
            const precioEstudiante = configCuotas ? JSON.parse(configCuotas).precioEstudiante : 3000;
            
            for (let mes = 1; mes <= mesActual; mes++) {
                const pagado = pagosCuotas.find(p => 
                    p.bomberoId == bombero.id && 
                    p.mes == mes && 
                    p.anio == anioActual
                );
                
                if (!pagado) {
                    // Determinar precio según si es estudiante y la fecha
                    let precio = precioRegular;
                    
                    if (bombero.esEstudiante && bombero.mesInicioEstudiante && bombero.anioInicioEstudiante) {
                        // Comparar mes/año actual con mes/año inicio estudiante
                        const fechaMes = anioActual * 12 + mes;
                        const fechaInicioEstudiante = bombero.anioInicioEstudiante * 12 + bombero.mesInicioEstudiante;
                        
                        if (fechaMes >= fechaInicioEstudiante) {
                            precio = precioEstudiante;
                        }
                    }
                    
                    mesesPendientes++;
                    deudaCuotas += precio;
                }
            }
            
            if (mesesPendientes > 0) {
                deudoresCuotas.push({
                    bombero: bombero,
                    tipo: 'Cuota Social',
                    mesesPendientes: mesesPendientes,
                    deuda: deudaCuotas
                });
            }
        });
        
        const asignaciones = storage.getAsignacionesBeneficios();
        const beneficios = storage.getBeneficios();
        
        let deudoresBeneficios = [];
        
        asignaciones.forEach(asignacion => {
            const beneficio = beneficios.find(b => b.id === asignacion.beneficioId);
            if (!beneficio || beneficio.estado !== 'activo') return;
            
            if (asignacion.estadoPago === 'pendiente' || asignacion.estadoPago === 'parcial') {
                const bombero = this.bomberos.find(b => b.id === parseInt(asignacion.bomberoId));
                if (bombero) {
                    // EXCLUIR MÁRTIRES: Los mártires NO deben tener beneficios ni deudas en tesorería
                    const esMartir = bombero.estadoBombero === 'martir';
                    if (esMartir) {
                        return; // Saltar este bombero
                    }
                    
                    const deuda = asignacion.montoEsperado - asignacion.montoPagado;
                    deudoresBeneficios.push({
                        bombero: bombero,
                        tipo: 'Beneficio',
                        nombreBeneficio: beneficio.nombre,
                        deuda: deuda,
                        vencido: new Date(beneficio.fechaLimiteRendicion) < hoy
                    });
                }
            }
        });
        
        const totalDeudores = deudoresCuotas.length + deudoresBeneficios.length;
        
        const cantidadElement = document.getElementById('cantidadDeudores');
        if (cantidadElement) {
            cantidadElement.textContent = totalDeudores;
            
            const btnDeudores = document.getElementById('btnDeudores');
            if (btnDeudores) {
                if (totalDeudores > 0) {
                    btnDeudores.classList.add('tiene-deudores');
                } else {
                    btnDeudores.classList.remove('tiene-deudores');
                }
            }
        }
        
        window.deudoresData = { deudoresCuotas, deudoresBeneficios };
    }

    toggleNotificacionDeudores() {
        const notifExistente = document.querySelector('.notificacion-deudores');
        
        if (notifExistente) {
            notifExistente.style.animation = 'slideOutRight 0.4s ease-in';
            setTimeout(() => notifExistente.remove(), 400);
            return;
        }
        
        const { deudoresCuotas, deudoresBeneficios } = window.deudoresData || { deudoresCuotas: [], deudoresBeneficios: [] };
        const totalDeudores = deudoresCuotas.length + deudoresBeneficios.length;
        
        if (totalDeudores === 0) {
            Utils.mostrarNotificacion('No hay deudores en el sistema', 'success');
            return;
        }
        
        this.mostrarNotificacionDeudores(totalDeudores, deudoresCuotas, deudoresBeneficios);
    }

    mostrarNotificacionDeudores(total, deudoresCuotas, deudoresBeneficios) {
        const notificacion = document.createElement('div');
        notificacion.className = 'notificacion-deudores';
        
        const totalDeudaCuotas = deudoresCuotas.reduce((sum, d) => sum + d.deuda, 0);
        const totalDeudaBeneficios = deudoresBeneficios.reduce((sum, d) => sum + d.deuda, 0);
        const totalGeneral = totalDeudaCuotas + totalDeudaBeneficios;
        
        notificacion.innerHTML = `
            <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); backdrop-filter: blur(4px); z-index: 10000; display: flex; align-items: center; justify-content: center; animation: fadeIn 0.3s ease;">
                <div style="background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%); border-radius: 20px; box-shadow: 0 20px 60px rgba(0,0,0,0.5); max-width: 600px; width: 90%; max-height: 90vh; overflow-y: auto; position: relative; animation: slideInDown 0.4s ease;">
                    
                    <button onclick="this.closest('.notificacion-deudores').remove()" style="position: absolute; top: 15px; right: 15px; background: rgba(255,255,255,0.2); border: none; color: white; font-size: 24px; width: 40px; height: 40px; border-radius: 50%; cursor: pointer; transition: all 0.3s; z-index: 10;">✕</button>
                    
                    <!-- Header -->
                    <div style="background: rgba(255,255,255,0.1); padding: 30px; border-bottom: 2px solid rgba(255,255,255,0.2);">
                        <div style="display: flex; align-items: center; gap: 20px;">
                            <div style="font-size: 60px; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));">⚠️</div>
                            <div>
                                <h3 style="margin: 0; color: white; font-size: 28px; font-weight: 700;">Deudores Detectados</h3>
                                <p style="margin: 5px 0 0 0; color: rgba(255,255,255,0.8); font-size: 14px;">Se requiere revisión de pagos pendientes</p>
                            </div>
                        </div>
                    </div>

                    <!-- Stats -->
                    <div style="display: grid; grid-template-columns: 1fr auto 1fr; gap: 20px; padding: 30px; background: rgba(255,255,255,0.05);">
                        <div style="text-align: center;">
                            <div style="color: rgba(255,255,255,0.7); font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Total Deudores</div>
                            <div style="color: #ff5252; font-size: 48px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">${total}</div>
                            <div style="color: rgba(255,255,255,0.6); font-size: 11px; margin-top: 5px;">voluntarios con deudas</div>
                        </div>
                        
                        <div style="width: 2px; background: linear-gradient(to bottom, transparent, rgba(255,255,255,0.3), transparent);"></div>
                        
                        <div style="text-align: center;">
                            <div style="color: rgba(255,255,255,0.7); font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">Total Adeudado</div>
                            <div style="color: #ffd700; font-size: 32px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">${this.formatearMonto(totalGeneral)}</div>
                            <div style="color: rgba(255,255,255,0.6); font-size: 11px; margin-top: 5px;">suma de todas las deudas</div>
                        </div>
                    </div>

                    <!-- Detalle -->
                    <div style="padding: 30px;">
                        <div style="background: rgba(255,255,255,0.1); border-radius: 15px; padding: 20px; margin-bottom: 15px; border-left: 4px solid #ff9800;">
                            <div style="display: flex; align-items: center; gap: 15px;">
                                <div style="font-size: 40px;">💳</div>
                                <div style="flex: 1;">
                                    <div style="color: white; font-size: 16px; font-weight: 600; margin-bottom: 8px;">Cuotas Sociales</div>
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <span style="color: rgba(255,255,255,0.8); font-size: 14px;">${deudoresCuotas.length} deudores</span>
                                        <span style="color: #ff9800; font-size: 20px; font-weight: 700;">${this.formatearMonto(totalDeudaCuotas)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div style="background: rgba(255,255,255,0.1); border-radius: 15px; padding: 20px; border-left: 4px solid #2196f3;">
                            <div style="display: flex; align-items: center; gap: 15px;">
                                <div style="font-size: 40px;">🎫</div>
                                <div style="flex: 1;">
                                    <div style="color: white; font-size: 16px; font-weight: 600; margin-bottom: 8px;">Beneficios</div>
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <span style="color: rgba(255,255,255,0.8); font-size: 14px;">${deudoresBeneficios.length} deudores</span>
                                        <span style="color: #2196f3; font-size: 20px; font-weight: 700;">${this.formatearMonto(totalDeudaBeneficios)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div style="padding: 30px; border-top: 2px solid rgba(255,255,255,0.1);">
                        <button onclick="sistemaBomberos.generarPDFDeudores()" style="width: 100%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border: none; color: white; padding: 18px; border-radius: 12px; font-size: 16px; font-weight: 600; cursor: pointer; transition: all 0.3s; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4); display: flex; align-items: center; justify-content: center; gap: 10px;">
                            <span style="font-size: 24px;">📄</span>
                            <span>Generar Reporte PDF Completo</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(notificacion);
    }
    async exportarExcel() {
    if (this.bomberos.length === 0) {
        Utils.mostrarNotificacion('No hay bomberos para exportar', 'error');
        return;
    }

    try {
        const datosExcel = this.bomberos.map((bombero, index) => {
            const nombreCompleto = Utils.obtenerNombreCompleto(bombero);
            const antiguedad = Utils.calcularAntiguedadDetallada(bombero.fechaIngreso);
            const edad = Utils.calcularEdad(bombero.fechaNacimiento);
            const categoria = Utils.calcularCategoriaBombero(bombero.fechaIngreso);

            return {
                'N°': index + 1,
                'Clave': bombero.claveBombero,
                'Nombre': nombreCompleto,
                'RUT': bombero.rut,
                'Edad': edad,
                'Fecha Nacimiento': Utils.formatearFecha(bombero.fechaNacimiento),
                'Profesión': bombero.profesion,
                'Domicilio': bombero.domicilio,
                'N° Registro': bombero.nroRegistro,
                'Fecha Ingreso': Utils.formatearFecha(bombero.fechaIngreso),
                'Antigüedad (años)': antiguedad.años,
                'Compañía': bombero.compania,
                'Categoría': categoria.categoria,
                'Grupo Sanguíneo': bombero.grupoSanguineo,
                'Teléfono': bombero.telefono,
                'Email': bombero.email
            };
        });

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(datosExcel);
        
        // Ajustar ancho de columnas
        const columnWidths = [
            { wch: 5 },  // N°
            { wch: 10 }, // Clave
            { wch: 35 }, // Nombre
            { wch: 15 }, // RUT
            { wch: 8 },  // Edad
            { wch: 15 }, // Fecha Nac
            { wch: 25 }, // Profesión
            { wch: 35 }, // Domicilio
            { wch: 15 }, // N° Registro
            { wch: 15 }, // Fecha Ingreso
            { wch: 15 }, // Antigüedad
            { wch: 20 }, // Compañía
            { wch: 35 }, // Categoría
            { wch: 15 }, // Grupo Sang
            { wch: 15 }, // Teléfono
            { wch: 30 }  // Email
        ];
        ws['!cols'] = columnWidths;

        XLSX.utils.book_append_sheet(wb, ws, 'Bomberos');
        XLSX.writeFile(wb, `Listado_Bomberos_${new Date().toISOString().split('T')[0]}.xlsx`);

        Utils.mostrarNotificacion('Excel exportado exitosamente', 'success');
    } catch (error) {
        console.error('Error al exportar:', error);
        Utils.mostrarNotificacion('Error al exportar: ' + error.message, 'error');
    }
}

    async generarPDFDeudores() {
        if (typeof window.jspdf === 'undefined') {
            Utils.mostrarNotificacion('Cargando librería PDF...', 'info');
            
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            document.head.appendChild(script);
            
            script.onload = () => {
                const scriptAutoTable = document.createElement('script');
                scriptAutoTable.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js';
                document.head.appendChild(scriptAutoTable);
                scriptAutoTable.onload = () => this.generarPDFDeudoresReal();
            };
            return;
        }
        
        this.generarPDFDeudoresReal();
    }

    generarPDFDeudoresReal() {
        const { deudoresCuotas, deudoresBeneficios } = window.deudoresData || { deudoresCuotas: [], deudoresBeneficios: [] };
        
        if (deudoresCuotas.length === 0 && deudoresBeneficios.length === 0) {
            Utils.mostrarNotificacion('No hay deudores registrados', 'info');
            return;
        }
        
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.width;
            let yPos = 20;

            // Logo
            const logoCompania = localStorage.getItem('logoCompania');
            if (logoCompania) {
                try {
                    doc.addImage(logoCompania, 'PNG', 15, 10, 25, 25);
                } catch (error) {
                    console.warn('Error al cargar logo:', error);
                }
            }

            // Encabezado
            doc.setFontSize(18);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(211, 47, 47);
            doc.text('REPORTE DE DEUDORES', pageWidth / 2, yPos, { align: 'center' });
            
            yPos += 10;
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            doc.setTextColor(100);
            doc.text(`Fecha de Generación: ${new Date().toLocaleDateString('es-CL')}`, pageWidth / 2, yPos, { align: 'center' });

            // Resumen general
            yPos += 15;
            const totalDeudaCuotas = deudoresCuotas.reduce((sum, d) => sum + d.deuda, 0);
            const totalDeudaBeneficios = deudoresBeneficios.reduce((sum, d) => sum + d.deuda, 0);
            const totalGeneral = totalDeudaCuotas + totalDeudaBeneficios;
            const totalDeudores = deudoresCuotas.length + deudoresBeneficios.length;

            doc.setFillColor(240, 240, 240);
            doc.rect(15, yPos, pageWidth - 30, 30, 'F');
            
            yPos += 8;
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(0);
            doc.text('RESUMEN GENERAL', 20, yPos);
            
            yPos += 8;
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            doc.text(`Total de Deudores: ${totalDeudores}`, 20, yPos);
            doc.text(`Deuda Total: ${this.formatearMonto(totalGeneral)}`, pageWidth - 75, yPos);
            
            yPos += 20;
            
            if (deudoresCuotas.length > 0) {
                doc.setFontSize(13);
                doc.setTextColor(156, 39, 176);
                doc.text('DEUDORES DE CUOTAS SOCIALES', 20, yPos);
                yPos += 5;
                
                const datosCuotas = deudoresCuotas.map(d => [
                    d.bombero.claveBombero,
                    Utils.obtenerNombreCompleto(d.bombero),
                    d.mesesPendientes,
                    this.formatearMonto(d.deuda)
                ]);
                
                doc.autoTable({
                    head: [['Clave', 'Nombre', 'Meses Pendientes', 'Deuda']],
                    body: datosCuotas,
                    startY: yPos,
                    headStyles: { 
                        fillColor: [156, 39, 176],
                        textColor: 255,
                        fontStyle: 'bold',
                        fontSize: 10
                    },
                    bodyStyles: {
                        fontSize: 9,
                        cellPadding: 4, // MÁS ESPACIO entre filas
                        lineWidth: 0.1,
                        lineColor: [200, 200, 200]
                    },
                    alternateRowStyles: {
                        fillColor: [250, 250, 250] // Filas alternadas para mejor lectura
                    },
                    margin: { left: 20, right: 20 },
                    theme: 'grid' // Grilla completa para mejor organización
                });
                
                yPos = doc.lastAutoTable.finalY + 15;
            }
            
            if (deudoresBeneficios.length > 0) {
                const deudoresPorBeneficio = {};
                
                deudoresBeneficios.forEach(d => {
                    if (!deudoresPorBeneficio[d.nombreBeneficio]) {
                        deudoresPorBeneficio[d.nombreBeneficio] = [];
                    }
                    deudoresPorBeneficio[d.nombreBeneficio].push(d);
                });
                
                Object.keys(deudoresPorBeneficio).forEach((nombreBeneficio) => {
                    const deudores = deudoresPorBeneficio[nombreBeneficio];
                    
                    if (yPos > 250) {
                        doc.addPage();
                        yPos = 20;
                    }
                    
                    doc.setFontSize(13);
                    doc.setTextColor(255, 152, 0);
                    doc.text(`DEUDORES DE: ${nombreBeneficio.toUpperCase()}`, 20, yPos);
                    yPos += 3;
                    
                    doc.setFontSize(10);
                    doc.setTextColor(100);
                    doc.text(`Total de deudores: ${deudores.length}`, 20, yPos);
                    yPos += 2;
                    
                    const datosDeudores = deudores.map(d => [
                        d.bombero.claveBombero,
                        Utils.obtenerNombreCompleto(d.bombero),
                        d.bombero.compania,
                        this.formatearMonto(d.deuda),
                        d.vencido ? 'VENCIDO' : 'Pendiente'
                    ]);
                    
                    doc.autoTable({
                        head: [['Clave', 'Nombre', 'Compañía', 'Deuda', 'Estado']],
                        body: datosDeudores,
                        startY: yPos,
                        headStyles: { 
                            fillColor: [255, 152, 0],
                            textColor: 255,
                            fontStyle: 'bold',
                            fontSize: 10
                        },
                        bodyStyles: {
                            fontSize: 9,
                            cellPadding: 4, // MÁS ESPACIO entre filas
                            lineWidth: 0.1,
                            lineColor: [200, 200, 200]
                        },
                        alternateRowStyles: {
                            fillColor: [255, 248, 225] // Filas alternadas (color naranja claro)
                        },
                        columnStyles: {
                            4: { 
                                textColor: function(data) {
                                    return data.cell.text[0] === 'VENCIDO' ? [244, 67, 54] : [100, 100, 100];
                                },
                                fontStyle: 'bold'
                            }
                        },
                        margin: { left: 20, right: 20 },
                        theme: 'grid' // Grilla completa
                    });
                    
                    yPos = doc.lastAutoTable.finalY + 12;
                    
                    const subtotal = deudores.reduce((sum, d) => sum + d.deuda, 0);
                    doc.setFontSize(10);
                    doc.setTextColor(0);
                    doc.text(`Subtotal ${nombreBeneficio}: ${this.formatearMonto(subtotal)}`, 20, yPos);
                    yPos += 15;
                });
            }
            
            if (yPos > 240) {
                doc.addPage();
                yPos = 20;
            }
            
            // Resumen detallado final
            doc.setFillColor(240, 248, 255);
            doc.rect(15, yPos, pageWidth - 30, 45, 'F');
            
            yPos += 8;
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(0);
            doc.text('RESUMEN DETALLADO', 20, yPos);
            
            yPos += 10;
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            doc.setTextColor(100);
            doc.text(`Deudores de Cuotas Sociales:`, 25, yPos);
            doc.setTextColor(0);
            doc.text(`${deudoresCuotas.length}`, pageWidth - 70, yPos);
            
            yPos += 6;
            doc.setTextColor(100);
            doc.text(`Deuda Total en Cuotas:`, 25, yPos);
            doc.setTextColor(255, 152, 0);
            doc.setFont(undefined, 'bold');
            doc.text(`${this.formatearMonto(totalDeudaCuotas)}`, pageWidth - 70, yPos);
            
            yPos += 10;
            doc.setFont(undefined, 'normal');
            doc.setTextColor(100);
            doc.text(`Deudores de Beneficios:`, 25, yPos);
            doc.setTextColor(0);
            doc.text(`${deudoresBeneficios.length}`, pageWidth - 70, yPos);
            
            yPos += 6;
            doc.setTextColor(100);
            doc.text(`Deuda Total en Beneficios:`, 25, yPos);
            doc.setTextColor(33, 150, 243);
            doc.setFont(undefined, 'bold');
            doc.text(`${this.formatearMonto(totalDeudaBeneficios)}`, pageWidth - 70, yPos);
            
            yPos += 10;
            doc.setDrawColor(200);
            doc.line(20, yPos, pageWidth - 20, yPos);
            yPos += 8;
            
            doc.setFontSize(13);
            doc.setTextColor(244, 67, 54);
            doc.setFont(undefined, 'bold');
            doc.text(`DEUDA TOTAL GENERAL:`, 25, yPos);
            doc.text(`${this.formatearMonto(totalGeneral)}`, pageWidth - 70, yPos);
            
            const pageCount = doc.internal.getNumberOfPages();
            for(let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(100);
                doc.setFont(undefined, 'normal');
                doc.text(
                    `Página ${i} de ${pageCount} | Generado por Sistema SEIS`,
                    105, 
                    doc.internal.pageSize.height - 10,
                    { align: 'center' }
                );
            }
            
            doc.save(`Reporte_Deudores_${new Date().toISOString().split('T')[0]}.pdf`);
            Utils.mostrarNotificacion('PDF de deudores generado exitosamente', 'success');
            
        } catch (error) {
            console.error('Error al generar PDF:', error);
            Utils.mostrarNotificacion('Error al generar PDF: ' + error.message, 'error');
        }
    }

    formatearMonto(monto) {
        return new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: 'CLP',
            minimumFractionDigits: 0
        }).format(monto);
    }


    // ==================== MÉTODO PARA CARGAR LOGO ====================
async cargarLogoCompania(input) {
    if (!input.files || !input.files[0]) return;
    
    const file = input.files[0];
    
    // Validar tamaño (máximo 2MB)
    if (file.size > 2 * 1024 * 1024) {
        Utils.mostrarNotificacion('El logo no debe superar 2MB', 'error');
        input.value = '';
        return;
    }
    
    // Validar tipo
    if (!file.type.startsWith('image/')) {
        Utils.mostrarNotificacion('Solo se permiten archivos de imagen', 'error');
        input.value = '';
        return;
    }
    
    try {
        // Leer imagen como Base64
        const logoBase64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => reject('Error al leer el logo');
            reader.readAsDataURL(file);
        });
        
        // Guardar en localStorage
        localStorage.setItem('logoCompania', logoBase64);
        
        Utils.mostrarNotificacion('Logo de la compañía cargado exitosamente', 'success');
        
        // Previsualizar (opcional)
        console.log('✅ Logo guardado, tamaño:', (logoBase64.length / 1024).toFixed(2), 'KB');
        
    } catch (error) {
        console.error('Error al cargar logo:', error);
        Utils.mostrarNotificacion('Error al cargar el logo', 'error');
    }
}
async generarPDFConsultaVoluntarios() {
    if (this.bomberos.length === 0) {
        Utils.mostrarNotificacion('No hay bomberos para exportar', 'error');
        return;
    }

    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('landscape');
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;
        const margin = 15;

        // ==================== HEADER NEGRO (MÁS COMPACTO) ====================
        doc.setFillColor(0, 0, 0);
        doc.rect(0, 0, pageWidth, 38, 'F'); // Reducido de 45 a 38

        // Logo (si existe)
        const logoCompania = localStorage.getItem('logoCompania');
        if (logoCompania) {
            try {
                doc.addImage(logoCompania, 'PNG', margin, 5, 28, 28); // Más pequeño
            } catch (error) {
                console.warn('Error al cargar logo:', error);
            }
        }

        // Texto IZQUIERDA del header (más compacto)
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(15);
        doc.setFont(undefined, 'bold');
        doc.text('CUERPO DE BOMBEROS', 48, 12);
        
        doc.setFontSize(13);
        doc.text('PUERTO MONTT', 48, 20);
        
        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');
        doc.text('PUERTO MONTT de Junio 1865', 48, 27);

        // Texto CENTRO del header (más compacto)
        doc.setFontSize(15);
        doc.setFont(undefined, 'bold');
        doc.text('Listado de Voluntarios', pageWidth / 2, 16, { align: 'center' });
        
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text('Ordenados por Antigüedad', pageWidth / 2, 24, { align: 'center' });

        // Texto DERECHA del header (más compacto)
        const ahora = new Date();
        const fecha = ahora.toLocaleDateString('es-CL', { 
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        const hora = ahora.toLocaleTimeString('es-CL', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
        
        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');
        doc.text(`Fecha: ${fecha}`, pageWidth - margin, 14, { align: 'right' });
        doc.text(`Hora: ${hora}`, pageWidth - margin, 21, { align: 'right' });

        // ==================== TABLA (MÁS COMPACTA) ====================
        let yPos = 45; // Reducido de 55 a 45
        doc.setTextColor(0, 0, 0);

        // Texto "Descendente" (más cerca)
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.text('Descendente', margin, yPos);
        yPos += 6; // Reducido de 10 a 6

        // Ordenar por antigüedad DESCENDENTE
        const bomberosOrdenados = [...this.bomberos].sort((a, b) => {
            const fechaA = new Date(a.fechaIngreso);
            const fechaB = new Date(b.fechaIngreso);
            return fechaA - fechaB;
        });

        // ENCABEZADOS DE TABLA (MÁS COMPACTOS)
        const headerY = yPos;
        doc.setDrawColor(0);
        doc.setLineWidth(0.5);
        doc.line(margin, headerY, pageWidth - margin, headerY);
        
        yPos += 5; // Reducido de 7 a 5
        
        // Headers
        doc.setFontSize(8);
        doc.setFont(undefined, 'bold');
        doc.text('Nº', margin + 2, yPos);
        doc.text('Rut', 22, yPos);
        doc.text('Nombres', 52, yPos);
        doc.text('Clave del', 135, yPos);
        doc.text('Bombero', 135, yPos + 3);
        doc.text('Compañía', 160, yPos);
        doc.text('Antigüedad', 195, yPos);
        doc.text('Fecha', 253, yPos);
        doc.text('Ingreso', 253, yPos + 3);
        
        yPos += 4; // Reducido de 5 a 4
        doc.line(margin, yPos, pageWidth - margin, yPos);
        yPos += 4; // Reducido de 6 a 4

        // ==================== FILAS DE DATOS (MÁS COMPACTAS) ====================
        doc.setFont(undefined, 'normal');
        doc.setFontSize(8);

        bomberosOrdenados.forEach((bombero, index) => {
            // Verificar si necesitamos nueva página
            if (yPos > pageHeight - 20) {
                doc.addPage();
                yPos = 15;
                
                // Repetir encabezados
                doc.setDrawColor(0);
                doc.setLineWidth(0.5);
                doc.line(margin, yPos, pageWidth - margin, yPos);
                yPos += 5;
                
                doc.setFont(undefined, 'bold');
                doc.setFontSize(8);
                doc.text('Nº', margin + 2, yPos);
                doc.text('Rut', 22, yPos);
                doc.text('Nombres', 52, yPos);
                doc.text('Clave del', 135, yPos);
                doc.text('Bombero', 135, yPos + 3);
                doc.text('Compañía', 160, yPos);
                doc.text('Antigüedad', 195, yPos);
                doc.text('Fecha', 253, yPos);
                doc.text('Ingreso', 253, yPos + 3);
                
                yPos += 4;
                doc.line(margin, yPos, pageWidth - margin, yPos);
                yPos += 4;
                
                doc.setFont(undefined, 'normal');
                doc.setFontSize(8);
            }

            // Datos del bombero
            const nombreCompleto = Utils.obtenerNombreCompleto(bombero).toUpperCase();
            const antiguedad = Utils.calcularAntiguedadDetallada(bombero.fechaIngreso);
            const claveBombero = bombero.claveBombero || 'N/A';
            const compania = bombero.compania || 'N/A';
            const fechaIngreso = bombero.fechaIngreso ? 
                new Date(bombero.fechaIngreso + 'T00:00:00').toLocaleDateString('es-CL', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                }) : 'N/A';
            
            // Formato antigüedad: "3 Años - 09 Meses - 24 Días"
            const antiguedadTexto = `${antiguedad.años} Años - ${String(antiguedad.meses).padStart(2, '0')} Meses - ${String(antiguedad.dias).padStart(2, '0')} Días`;

            // Imprimir fila
            doc.text(String(index + 1), margin + 2, yPos);
            doc.text(bombero.rut || 'N/A', 22, yPos);
            
            // Nombre más largo permitido
            const nombreMostrar = nombreCompleto.length > 50 ? 
                nombreCompleto.substring(0, 47) + '...' : 
                nombreCompleto;
            doc.text(nombreMostrar, 52, yPos);
            
            doc.text(claveBombero, 140, yPos, { align: 'center' });
            
            // Compañía
            const companiaMostrar = compania.length > 22 ? 
                compania.substring(0, 19) + '...' : 
                compania;
            doc.text(companiaMostrar, 160, yPos);
            
            doc.text(antiguedadTexto, 195, yPos);
            doc.text(fechaIngreso, 258, yPos, { align: 'center' });
            
            yPos += 5; // Reducido de 6 a 5
            
            // Línea horizontal más fina
            doc.setDrawColor(230);
            doc.setLineWidth(0.1);
            doc.line(margin, yPos - 1, pageWidth - margin, yPos - 1);
        });

        // ==================== PIE DE PÁGINA ====================
        const totalPages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(7);
            doc.setTextColor(150);
            doc.setFont(undefined, 'normal');
            doc.text(
                `Sistema SEIS - Proyecto de Gestión Bomberil | Página ${i} de ${totalPages}`,
                pageWidth / 2,
                pageHeight - 6,
                { align: 'center' }
            );
        }

        // ==================== GUARDAR PDF ====================
        const nombreArchivo = `Listado_Voluntarios_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(nombreArchivo);
        
        Utils.mostrarNotificacion('PDF generado exitosamente', 'success');
        
    } catch (error) {
        console.error('❌ ERROR al generar PDF:', error);
        Utils.mostrarNotificacion('Error al generar PDF: ' + error.message, 'error');
    }
}




} // Fin de la clase SistemaBomberos

// Inicializar sistema
document.addEventListener('DOMContentLoaded', () => {
    window.sistemaBomberos = new SistemaBomberos();
});