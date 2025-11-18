// ==================== SISTEMA DE SANCIONES ====================
class SistemaSanciones {
    constructor() {
        this.bomberoActual = null;
        this.sanciones = [];
        this.init();
    }

    async init() {
        // Verificar autenticación
        if (!checkAuth()) {
            window.location.href = 'index.html';
            return;
        }

        // Verificar permisos
        const permisos = getUserPermissions();
        if (!permisos || !permisos.canViewSanciones) {
            Utils.mostrarNotificacion('No tienes permisos para acceder a este módulo', 'error');
            setTimeout(() => window.location.href = 'sistema.html', 2000);
            return;
        }

        // Cargar datos del bombero
        await this.cargarBomberoActual();
        
        // Cargar sanciones
        this.sanciones = storage.getSanciones();
        
        // Configurar interfaz
        this.configurarInterfaz();
        
        // Renderizar sanciones
        this.renderizarSanciones();
        
        // Mostrar logo de compañía si existe
        this.mostrarLogoGuardado();
    }

    mostrarLogoGuardado() {
        const logoCompania = localStorage.getItem('logoCompania');
        if (logoCompania) {
            const preview = document.getElementById('previewLogoCompania');
            const img = document.getElementById('imgPreviewLogo');
            img.src = logoCompania;
            preview.style.display = 'block';
        }
    }

    async cargarBomberoActual() {
        const bomberoId = localStorage.getItem('bomberoSancionActual');
        if (!bomberoId) {
            Utils.mostrarNotificacion('No se ha seleccionado ningún bombero', 'error');
            setTimeout(() => this.volverAlSistema(), 2000);
            return;
        }

        const bomberos = storage.getBomberos();
        // Convertir a número para comparación exacta
        this.bomberoActual = bomberos.find(b => b.id === parseInt(bomberoId));
        
        if (!this.bomberoActual) {
            Utils.mostrarNotificacion('Bombero no encontrado', 'error');
            setTimeout(() => this.volverAlSistema(), 2000);
            return;
        }

        this.mostrarInfoBombero();
    }

    mostrarInfoBombero() {
        const contenedor = document.getElementById('bomberoDatosSanciones');
        const antiguedad = Utils.calcularAntiguedadDetallada(this.bomberoActual.fechaIngreso);
        const estadoBadge = Utils.obtenerBadgeEstado(this.bomberoActual.estadoBombero);
        
        // Verificar si puede ser sancionado
        const validacion = Utils.puedeSerSancionado(this.bomberoActual);
        if (!validacion.puede) {
            contenedor.innerHTML = `
                <div style="background: #fee2e2; border-left: 4px solid #dc2626; padding: 20px; border-radius: 8px;">
                    <h3 style="color: #dc2626; margin-top: 0;">⚠️ No se pueden registrar sanciones</h3>
                    <p style="color: #991b1b; margin: 10px 0; font-size: 16px;">${validacion.mensaje}</p>
                    <p style="color: #666; margin: 0;">Solo se puede consultar el historial de sanciones de este voluntario.</p>
                </div>
            `;
            
            // Deshabilitar formulario
            const formulario = document.getElementById('formSancion');
            if (formulario) {
                const inputs = formulario.querySelectorAll('input, select, textarea, button[type="submit"]');
                inputs.forEach(input => {
                    input.disabled = true;
                    input.style.opacity = '0.5';
                });
            }
            return;
        }
        
        contenedor.innerHTML = `
            <div><strong>Nombre:</strong> <span>${Utils.obtenerNombreCompleto(this.bomberoActual)}</span></div>
            <div><strong>Clave:</strong> <span>${this.bomberoActual.claveBombero}</span></div>
            <div><strong>RUN:</strong> <span>${this.bomberoActual.rut}</span></div>
            <div><strong>Compañía:</strong> <span>${this.bomberoActual.compania}</span></div>
            <div><strong>Estado:</strong> <span style="font-weight: bold;">${estadoBadge}</span></div>
            <div><strong>Antigüedad:</strong> <span>${antiguedad.años} años, ${antiguedad.meses} meses</span></div>
            <div><strong>Fecha Ingreso:</strong> <span>${Utils.formatearFecha(this.bomberoActual.fechaIngreso)}</span></div>
        `;

        document.getElementById('bomberoSancionId').value = this.bomberoActual.id;
    }

    configurarInterfaz() {
        // Verificar permisos para restricción de tipos de sanción
        const permisos = getUserPermissions();
        if (permisos && permisos.canOnlySuspensions) {
            // Capitán: solo puede ver suspensiones
            const selectTipo = document.getElementById('tipoSancion');
            
            // Cambiar el HTML a solo Suspensión
            selectTipo.innerHTML = `
                <option value="suspension" selected>⏸️ Suspensión</option>
            `;
            
            // NO usar disabled, usar pointer-events para evitar clics
            // Los campos disabled NO envían datos en FormData
            selectTipo.style.backgroundColor = '#f5f5f5';
            selectTipo.style.pointerEvents = 'none';
            selectTipo.style.cursor = 'not-allowed';
            
            // Asegurar que el valor esté seleccionado
            selectTipo.value = 'suspension';
            
            // Pre-llenar "Capitanía" como compañía responsable
            const companiaAutoridad = document.getElementById('companiaAutoridad');
            if (companiaAutoridad) {
                companiaAutoridad.value = 'Capitanía';
                companiaAutoridad.readOnly = true;
                companiaAutoridad.style.backgroundColor = '#f5f5f5';
            }
            
            // Restringir autoridad sancionatoria solo a Capitanía
            const selectAutoridad = document.getElementById('autoridadSancionatoria');
            if (selectAutoridad) {
                selectAutoridad.innerHTML = `
                    <option value="Capitanía" selected>Capitanía</option>
                `;
                // NO usar disabled para que envíe el valor en FormData
                selectAutoridad.style.backgroundColor = '#f5f5f5';
                selectAutoridad.style.pointerEvents = 'none';
                selectAutoridad.style.cursor = 'not-allowed';
                selectAutoridad.value = 'Capitanía';
            }
            
            Utils.mostrarNotificacion('Como Capitán, solo puede registrar Suspensiones de categoría Capitanía', 'info');
        }

        // Configurar formulario
        document.getElementById('formSancion').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.manejarSubmitFormulario(e);
        });

        // Configurar fecha de oficio automática
        const hoy = new Date().toISOString().split('T')[0];
        document.getElementById('fechaOficio').value = hoy;

        // Configurar cambios en selector de tipo de sanción
        document.getElementById('tipoSancion').addEventListener('change', () => {
            this.actualizarEstiloTipoSancion();
        });

        // Configurar cambio en días de sanción
        document.getElementById('diasSancion').addEventListener('input', () => {
            this.calcularFechaTermino();
        });

        // Configurar cambio en fecha de inicio
        document.getElementById('fechaDesde').addEventListener('change', () => {
            this.calcularFechaTermino();
        });

        // Configurar previsualización de archivo
        document.getElementById('documentoOficio').addEventListener('change', (e) => {
            this.previsualizarArchivo(e.target);
        });
    }

    actualizarEstiloTipoSancion() {
        const select = document.getElementById('tipoSancion');
        const valor = select.value;
        
        // Resetear estilos
        select.className = 'tipo-sancion-select';
        
        // Aplicar estilo según el tipo
        if (valor === 'renuncia') {
            select.classList.add('tipo-renuncia');
        } else if (valor === 'suspension') {
            select.classList.add('tipo-suspension');
        } else if (valor === 'separacion') {
            select.classList.add('tipo-separacion');
        } else if (valor === 'expulsion') {
            select.classList.add('tipo-expulsion');
        }
        
        // OCULTAR/MOSTRAR CAMPOS SEGÚN TIPO DE SANCIÓN
        this.controlarCamposSegunTipo(valor);
    }
    
    controlarCamposSegunTipo(tipoSancion) {
        // Elementos a controlar
        const companiaAutoridad = document.querySelector('[for="companiaAutoridad"]')?.parentElement;
        const autoridadSancionatoria = document.getElementById('grupo-autoridadSancionatoria');
        const diasSancion = document.querySelector('[for="diasSancion"]')?.parentElement;
        const fechaHasta = document.querySelector('[for="fechaHasta"]')?.parentElement;
        const fechaOficio = document.querySelector('[for="fechaOficio"]')?.parentElement;
        
        if (tipoSancion === 'renuncia') {
            // RENUNCIA: Solo fecha inicio, identificador oficio, motivo y adjuntar carta
            if (companiaAutoridad) companiaAutoridad.style.display = 'none';
            if (autoridadSancionatoria) autoridadSancionatoria.style.display = 'none';
            if (diasSancion) diasSancion.style.display = 'none';
            if (fechaHasta) fechaHasta.style.display = 'none';
            if (fechaOficio) fechaOficio.style.display = 'none';
            
            // Cambiar labels específicos para renuncia
            const labelFechaDesde = document.querySelector('[for="fechaDesde"]');
            if (labelFechaDesde) {
                labelFechaDesde.textContent = 'Fecha de Renuncia';
            }
            
            const labelOficioNumero = document.querySelector('[for="oficioNumero"]');
            if (labelOficioNumero) {
                labelOficioNumero.textContent = 'Identificador del Oficio';
            }
            
            const labelDoc = document.querySelector('[for="documentoOficio"]');
            if (labelDoc) {
                labelDoc.textContent = '📎 Adjuntar Oficio y Carta de Renuncia';
            }
            
            const labelMotivo = document.querySelector('[for="motivo"]');
            if (labelMotivo) {
                labelMotivo.textContent = 'Detalle de la Renuncia';
            }
            
        } else {
            // OTROS TIPOS: Mostrar todos los campos
            if (companiaAutoridad) companiaAutoridad.style.display = 'block';
            if (autoridadSancionatoria) autoridadSancionatoria.style.display = 'block';
            if (diasSancion) diasSancion.style.display = 'block';
            if (fechaHasta) fechaHasta.style.display = 'block';
            if (fechaOficio) fechaOficio.style.display = 'block';
            
            // Restaurar labels originales
            const labelFechaDesde = document.querySelector('[for="fechaDesde"]');
            if (labelFechaDesde) {
                labelFechaDesde.textContent = 'Fecha de Inicio';
            }
            
            const labelOficioNumero = document.querySelector('[for="oficioNumero"]');
            if (labelOficioNumero) {
                labelOficioNumero.textContent = 'Identificador del Oficio';
            }
            
            const labelDoc = document.querySelector('[for="documentoOficio"]');
            if (labelDoc) {
                labelDoc.textContent = '📎 Adjuntar Documento del Oficio';
            }
            
            const labelMotivo = document.querySelector('[for="motivo"]');
            if (labelMotivo) {
                labelMotivo.textContent = 'Descripción del Motivo';
            }
        }
    }

    async previsualizarArchivo(input) {
        const preview = document.getElementById('previewDocumento');
        const previewImage = document.getElementById('previewImageDocumento');
        const previewFileName = document.getElementById('previewFileNameDocumento');

        if (input.files && input.files[0]) {
            const file = input.files[0];
            
            // Validar tamaño
            if (file.size > 10 * 1024 * 1024) { // 10MB
                Utils.mostrarNotificacion('El archivo no debe superar los 10MB', 'error');
                input.value = '';
                return;
            }

            preview.style.display = 'block';
            
            // Mostrar previsualización según tipo de archivo
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    previewImage.src = e.target.result;
                    previewImage.style.display = 'block';
                };
                reader.readAsDataURL(file);
                previewFileName.textContent = file.name;
            } else {
                previewImage.style.display = 'none';
                previewFileName.textContent = `📄 ${file.name}`;
            }
        } else {
            preview.style.display = 'none';
        }
    }

    calcularFechaTermino() {
        const fechaDesde = document.getElementById('fechaDesde').value;
        const diasSancion = document.getElementById('diasSancion').value;
        const fechaHasta = document.getElementById('fechaHasta');

        if (fechaDesde && diasSancion && diasSancion > 0) {
            const fechaInicio = new Date(fechaDesde + 'T00:00:00');
            fechaInicio.setDate(fechaInicio.getDate() + parseInt(diasSancion));
            
            const year = fechaInicio.getFullYear();
            const month = String(fechaInicio.getMonth() + 1).padStart(2, '0');
            const day = String(fechaInicio.getDate()).padStart(2, '0');
            
            fechaHasta.value = `${year}-${month}-${day}`;
        }
    }

 async manejarSubmitFormulario(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const datos = Object.fromEntries(formData);
    
    console.log('📝 Datos de sanción capturados:', datos);
    
    // Validar campos obligatorios
    if (!datos.bomberoSancionId) {
        Utils.mostrarNotificacion('Error: No se ha seleccionado un bombero', 'error');
        return;
    }
    
    if (!datos.tipoSancion) {
        Utils.mostrarNotificacion('Debe seleccionar el tipo de sanción', 'error');
        return;
    }
    
    if (!datos.fechaDesde) {
        Utils.mostrarNotificacion('Debe ingresar la fecha de inicio', 'error');
        return;
    }
    
    if (!datos.oficioNumero) {
        Utils.mostrarNotificacion('Debe ingresar el número de oficio', 'error');
        return;
    }
    
    if (!datos.motivo) {
        Utils.mostrarNotificacion('Debe describir el motivo de la sanción', 'error');
        return;
    }

    try {
        await this.guardarSancion(datos);
        this.limpiarFormulario();
        this.renderizarSanciones();
        Utils.mostrarNotificacion('✅ Sanción registrada exitosamente', 'success');
    } catch (error) {
        console.error('❌ Error al registrar sanción:', error);
        Utils.mostrarNotificacion('Error al registrar sanción: ' + error.message, 'error');
    }
}
    validarDatosSancion(datos) {
        const errores = [];
        
        if (!datos.tipoSancion) {
            errores.push('Debe seleccionar el tipo de sanción');
        }
        
        if (!datos.fechaDesde) {
            errores.push('Debe ingresar la fecha de inicio');
        }
        
        if (!datos.oficioNumero || !datos.oficioNumero.trim()) {
            errores.push('Debe ingresar el identificador del oficio');
        }
        
        if (!datos.motivo || !datos.motivo.trim()) {
            errores.push('Debe describir el motivo de la sanción');
        }

        if (datos.fechaDesde && datos.fechaHasta) {
            if (new Date(datos.fechaDesde) > new Date(datos.fechaHasta)) {
                errores.push('La fecha de término debe ser posterior a la fecha de inicio');
            }
        }

        return errores;
    }

    async guardarSancion(datos) {
        // Procesar documento adjunto si existe
        let documentoData = null;
        let documentoNombreOriginal = null;
        const archivoInput = document.getElementById('documentoOficio');
        
        if (archivoInput.files && archivoInput.files[0]) {
            const archivo = archivoInput.files[0];
            documentoData = await Utils.leerArchivoComoBase64(archivo);
            documentoNombreOriginal = archivo.name;
        }

        const sancionData = {
            id: window.sancionIdCounter++,
            bomberoId: parseInt(datos.bomberoSancionId),
            tipoSancion: datos.tipoSancion,
            companiaAutoridad: datos.companiaAutoridad || null,
            autoridadSancionatoria: datos.autoridadSancionatoria || null,
            fechaDesde: datos.fechaDesde,
            fechaHasta: datos.fechaHasta || null,
            diasSancion: datos.diasSancion ? parseInt(datos.diasSancion) : null,
            oficioNumero: datos.oficioNumero,
            fechaOficio: datos.fechaOficio,
            motivo: datos.motivo,
            documentoOficio: documentoData,
            documentoNombreOriginal: documentoNombreOriginal,
            registradoPor: JSON.parse(localStorage.getItem('currentUser')).username,
            fechaRegistro: new Date().toISOString()
        };

        this.sanciones.push(sancionData);
        
        // CAMBIAR ESTADO DEL VOLUNTARIO AUTOMÁTICAMENTE SEGÚN TIPO DE SANCIÓN
        await this.actualizarEstadoBomberoSegunSancion(datos.tipoSancion, datos);
        
        this.guardarDatos();
    }

    async actualizarEstadoBomberoSegunSancion(tipoSancion, datos) {
        const bomberos = storage.getBomberos();
        const bomberoIndex = bomberos.findIndex(b => b.id === parseInt(datos.bomberoSancionId));
        
        if (bomberoIndex === -1) {
            console.error('❌ Bombero no encontrado');
            return;
        }
        
        const bombero = bomberos[bomberoIndex];
        let estadoAnterior = bombero.estadoBombero || 'activo';
        let cambioEstado = false;
        
        switch(tipoSancion) {
            case 'renuncia':
                bombero.estadoBombero = 'renunciado';
                bombero.fechaRenuncia = datos.fechaDesde;
                bombero.motivoRenuncia = datos.motivo;
                cambioEstado = true;
                console.log('🔄 Estado cambiado a: RENUNCIADO');
                break;
                
            case 'separacion':
                bombero.estadoBombero = 'separado';
                bombero.fechaSeparacion = datos.fechaDesde;
                
                // Calcular años de separación desde diasSancion o fechas
                if (datos.diasSancion) {
                    const anios = Math.ceil(datos.diasSancion / 365);
                    bombero.aniosSeparacion = anios;
                } else if (datos.fechaHasta) {
                    const fechaInicio = new Date(datos.fechaDesde);
                    const fechaFin = new Date(datos.fechaHasta);
                    const diffDias = Math.ceil((fechaFin - fechaInicio) / (1000 * 60 * 60 * 24));
                    const anios = Math.ceil(diffDias / 365);
                    bombero.aniosSeparacion = anios;
                } else {
                    bombero.aniosSeparacion = 1; // Por defecto 1 año
                }
                
                // Calcular fecha fin
                const fechaSeparacion = new Date(datos.fechaDesde);
                fechaSeparacion.setFullYear(fechaSeparacion.getFullYear() + bombero.aniosSeparacion);
                bombero.fechaFinSeparacion = fechaSeparacion.toISOString().split('T')[0];
                
                cambioEstado = true;
                console.log(`⏸️ Estado cambiado a: SEPARADO (${bombero.aniosSeparacion} años hasta ${bombero.fechaFinSeparacion})`);
                break;
                
            case 'expulsion':
                bombero.estadoBombero = 'expulsado';
                bombero.fechaExpulsion = datos.fechaDesde;
                bombero.motivoExpulsion = datos.motivo;
                cambioEstado = true;
                console.log('❌ Estado cambiado a: EXPULSADO');
                break;
                
            default:
                // Suspensión no cambia el estado
                console.log('⏸️ Suspensión registrada - sin cambio de estado');
                break;
        }
        
        if (cambioEstado) {
            // Guardar historial de cambio de estado
            if (!bombero.historialEstados) {
                bombero.historialEstados = [];
            }
            
            bombero.historialEstados.push({
                estadoAnterior: estadoAnterior,
                estadoNuevo: bombero.estadoBombero,
                fecha: new Date().toISOString(),
                motivo: `Sanción: ${tipoSancion}`,
                sancionId: window.sancionIdCounter - 1, // ID de la sanción recién creada
                registradoPor: JSON.parse(localStorage.getItem('currentUser')).username
            });
            
            // Congelar antigüedad
            if (!bombero.antiguedadCongelada) {
                bombero.antiguedadCongelada = true;
                bombero.fechaCongelamiento = datos.fechaDesde;
            }
            
            // Guardar cambios en bomberos
            storage.saveBomberos(bomberos);
            
            // Actualizar bombero actual en memoria
            this.bomberoActual = bombero;
            
            Utils.mostrarNotificacion(`✅ Estado del voluntario cambiado a: ${Utils.obtenerBadgeEstado(bombero.estadoBombero)}`, 'success', 7000);
        }
    }

   guardarDatos() {
    storage.saveSanciones(this.sanciones);
    
    // SIEMPRE guardar los contadores también
    storage.saveCounters({
        bomberoId: window.idCounter,
        sancionId: window.sancionIdCounter,
        cargoId: window.cargoIdCounter
    });
    
    console.log('💾 Datos y contadores guardados');
}
// FUNCIÓN DE EMERGENCIA - Corrige IDs duplicados
repararIDsDuplicados() {
    console.log('🔧 REPARANDO IDs DUPLICADOS...');
    
    let maxId = 0;
    
    // Encontrar el ID máximo actual
    this.bomberos.forEach(bombero => {
        if (bombero.id > maxId) {
            maxId = bombero.id;
        }
    });
    
    console.log('📊 ID máximo encontrado:', maxId);
    
    // Reparar IDs duplicados
    const idsUsados = new Set();
    let cambios = 0;
    
    this.bomberos.forEach(bombero => {
        if (idsUsados.has(bombero.id)) {
            // ID duplicado encontrado - asignar nuevo ID
            const nuevoId = ++maxId;
            console.log(`🔄 Cambiando ID ${bombero.id} → ${nuevoId} para: ${Utils.obtenerNombreCompleto(bombero)}`);
            bombero.id = nuevoId;
            cambios++;
        }
        idsUsados.add(bombero.id);
    });
    
    if (cambios > 0) {
        // Actualizar contador global
        window.idCounter = maxId + 1;
        
        this.guardarDatos();
        this.renderizarBomberos();
        
        Utils.mostrarNotificacion(`✅ Reparados ${cambios} IDs duplicados`, 'success');
    } else {
        Utils.mostrarNotificacion('✅ No se encontraron IDs duplicados', 'info');
    }
    
    return cambios;
}

    renderizarSanciones() {
        const lista = document.getElementById('listaSanciones');
        const total = document.getElementById('totalSanciones');
        
        const sancionesBombero = this.sanciones.filter(s => s.bomberoId == this.bomberoActual.id);
        const sancionesOrdenadas = sancionesBombero.sort((a, b) => 
            new Date(b.fechaRegistro) - new Date(a.fechaRegistro)
        );
        
        total.textContent = sancionesBombero.length;

        if (sancionesBombero.length === 0) {
            lista.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">No hay sanciones registradas para este bombero</p>';
            return;
        }

        lista.innerHTML = sancionesOrdenadas.map(sancion => this.generarHTMLSancion(sancion)).join('');
    }

    generarHTMLSancion(sancion) {
        const iconos = {
            'renuncia': '📝',
            'suspension': '⏸️',
            'separacion': '↗️',
            'expulsion': '❌'
        };

        const colores = {
            'renuncia': '#2196f3',
            'suspension': '#ff9800',
            'separacion': '#9c27b0',
            'expulsion': '#f44336'
        };

        const tipoTexto = sancion.tipoSancion.charAt(0).toUpperCase() + sancion.tipoSancion.slice(1);
        const icono = iconos[sancion.tipoSancion] || '📋';
        const color = colores[sancion.tipoSancion] || '#666';
        
        return `
            <div class="item-card sancion-card" style="border-left-color: ${color};">
                <div class="item-header">
                    <div class="item-tipo" style="color: ${color};">
                        ${icono} ${tipoTexto}
                    </div>
                    <div class="item-fecha">
                        Registrado: ${Utils.formatearFecha(sancion.fechaRegistro)}
                    </div>
                </div>
                <div class="item-info">
                    <div><strong>Fecha de inicio:</strong> <span>${Utils.formatearFecha(sancion.fechaDesde)}</span></div>
                    
                    ${sancion.fechaHasta ? `
                        <div><strong>Fecha de término:</strong> <span>${Utils.formatearFecha(sancion.fechaHasta)}</span></div>
                    ` : '<div><strong>Estado:</strong> <span style="color: #f44336; font-weight: bold;">Indefinida</span></div>'}
                    
                    ${sancion.diasSancion ? `
                        <div><strong>Duración:</strong> <span>${sancion.diasSancion} días</span></div>
                    ` : ''}
                    
                    ${sancion.companiaAutoridad ? `
                        <div><strong>Compañía responsable:</strong> <span>${sancion.companiaAutoridad}</span></div>
                    ` : ''}
                    
                    ${sancion.autoridadSancionatoria ? `
                        <div><strong>Autoridad sancionatoria:</strong> <span>${sancion.autoridadSancionatoria}</span></div>
                    ` : ''}
                    
                    <div><strong>Oficio N°:</strong> <span>${sancion.oficioNumero}</span></div>
                    <div><strong>Fecha del oficio:</strong> <span>${Utils.formatearFecha(sancion.fechaOficio)}</span></div>
                    
                    ${sancion.documentoOficio ? `
                        <div class="full-width" style="margin-top: 10px;">
                            <strong>📎 Documento adjunto:</strong>
                            <a href="${sancion.documentoOficio}" 
                               target="_blank" 
                               download="${sancion.documentoNombreOriginal}"
                               class="documento-link"
                               style="display: inline-block; margin-top: 5px; padding: 8px 15px; background: ${color}; color: white; border-radius: 5px; text-decoration: none; transition: all 0.3s;">
                                📄 Ver/Descargar ${sancion.documentoNombreOriginal}
                            </a>
                        </div>
                    ` : ''}
                    
                    <div class="full-width" style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #e0e0e0;">
                        <strong>Motivo:</strong><br>
                        <span style="white-space: pre-wrap;">${sancion.motivo}</span>
                    </div>
                    
                    <div style="margin-top: 10px; font-size: 0.85rem; color: #999;">
                        <strong>Registrado por:</strong> ${sancion.registradoPor}
                    </div>
                </div>
            </div>
        `;
    }

 limpiarFormulario() {
    document.getElementById('formSancion').reset();
    
    // Restaurar fecha de oficio a hoy
    const hoy = new Date().toISOString().split('T')[0];
    document.getElementById('fechaOficio').value = hoy;
    
    // Restaurar ID del bombero
    document.getElementById('bomberoSancionId').value = this.bomberoActual.id;
    
    // Limpiar previsualización de archivo
    const preview = document.getElementById('documentoPreview');
    if (preview) {
        preview.innerHTML = '';
    }
    
    // Actualizar estilo del selector
    this.actualizarEstiloTipoSancion();
}

    async cargarLogoCompania(input) {
        if (input.files && input.files[0]) {
            const file = input.files[0];
            
            // Validar tamaño (máx 2MB para logo)
            if (file.size > 2 * 1024 * 1024) {
                Utils.mostrarNotificacion('El logo no debe superar 2MB', 'error');
                input.value = '';
                return;
            }

            // Validar que sea imagen
            if (!file.type.startsWith('image/')) {
                Utils.mostrarNotificacion('El archivo debe ser una imagen', 'error');
                input.value = '';
                return;
            }

            try {
                const logoBase64 = await Utils.leerArchivoComoBase64(file);
                localStorage.setItem('logoCompania', logoBase64);
                
                // Mostrar preview
                const preview = document.getElementById('previewLogoCompania');
                const img = document.getElementById('imgPreviewLogo');
                img.src = logoBase64;
                preview.style.display = 'block';
                
                Utils.mostrarNotificacion('Logo de compañía guardado exitosamente', 'success');
            } catch (error) {
                Utils.mostrarNotificacion('Error al cargar el logo: ' + error.message, 'error');
            }
        }
    }

    verLogoActual() {
        const logoCompania = localStorage.getItem('logoCompania');
        
        if (!logoCompania) {
            Utils.mostrarNotificacion('No hay logo de compañía guardado', 'info');
            return;
        }

        const preview = document.getElementById('previewLogoCompania');
        const img = document.getElementById('imgPreviewLogo');
        img.src = logoCompania;
        preview.style.display = 'block';
        
        Utils.mostrarNotificacion('Mostrando logo actual', 'success');
    }

    async exportarExcel() {
        if (!this.bomberoActual) {
            Utils.mostrarNotificacion('Error: No hay un bombero seleccionado', 'error');
            return;
        }

        const sancionesBombero = this.sanciones.filter(s => s.bomberoId == this.bomberoActual.id);
        
        if (sancionesBombero.length === 0) {
            Utils.mostrarNotificacion('No hay sanciones registradas para exportar', 'error');
            return;
        }

        try {
            const datosExcel = sancionesBombero.map((sancion, index) => ({
                'N°': index + 1,
                'Bombero': Utils.obtenerNombreCompleto(this.bomberoActual),
                'Clave': this.bomberoActual.claveBombero,
                'RUN': this.bomberoActual.rut,
                'Tipo de Sanción': sancion.tipoSancion.charAt(0).toUpperCase() + sancion.tipoSancion.slice(1),
                'Fecha Inicio': Utils.formatearFecha(sancion.fechaDesde),
                'Fecha Término': sancion.fechaHasta ? Utils.formatearFecha(sancion.fechaHasta) : 'Indefinida',
                'Días': sancion.diasSancion || 'N/A',
                'Compañía': sancion.companiaAutoridad || 'N/A',
                'Autoridad': sancion.autoridadSancionatoria || 'N/A',
                'Oficio N°': sancion.oficioNumero,
                'Fecha Oficio': Utils.formatearFecha(sancion.fechaOficio),
                'Motivo': sancion.motivo,
                'Tiene Documento': sancion.documentoOficio ? 'Sí' : 'No',
                'Registrado por': sancion.registradoPor,
                'Fecha Registro': Utils.formatearFecha(sancion.fechaRegistro)
            }));

            await Utils.exportarAExcel(
                datosExcel,
                `Sanciones_${this.bomberoActual.claveBombero}_${new Date().toISOString().split('T')[0]}.xlsx`,
                'Sanciones'
            );

            Utils.mostrarNotificacion('Excel de sanciones descargado exitosamente', 'success');
        } catch (error) {
            Utils.mostrarNotificacion('Error al generar Excel: ' + error.message, 'error');
        }
    }

    async generarPDF() {
        if (!this.bomberoActual) {
            Utils.mostrarNotificacion('Error: No hay un bombero seleccionado', 'error');
            return;
        }

        const sancionesBombero = this.sanciones.filter(s => s.bomberoId == this.bomberoActual.id);
        
        if (sancionesBombero.length === 0) {
            Utils.mostrarNotificacion('No hay sanciones registradas para generar PDF', 'error');
            return;
        }

        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.width;
            const pageHeight = doc.internal.pageSize.height;
            const margin = 20;
            let yPos = 20;
            let currentPage = 1;

            // Obtener logo de compañía
            const logoCompania = localStorage.getItem('logoCompania');

            // Función para agregar encabezado
            const addHeader = () => {
                // Fondo negro para el encabezado
                doc.setFillColor(0, 0, 0);
                doc.rect(0, 0, pageWidth, 55, 'F');
                
                // FOTO DEL VOLUNTARIO (izquierda) - Tamaño reducido
                if (this.bomberoActual.foto) {
                    try {
                        // Foto más pequeña: 28x28mm
                        doc.addImage(this.bomberoActual.foto, 'JPEG', 12, 13, 28, 28);
                    } catch (error) {
                        console.warn('No se pudo cargar la foto del voluntario');
                    }
                }
                
                // LOGO DE LA COMPAÑÍA (derecha) - Tamaño reducido
                if (logoCompania) {
                    try {
                        // Logo más pequeño: 28x28mm
                        doc.addImage(logoCompania, 'PNG', pageWidth - 40, 13, 28, 28);
                    } catch (error) {
                        console.warn('No se pudo cargar el logo de la compañía');
                    }
                }
                
                // Título principal (centro)
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(22);
                doc.setFont(undefined, 'bold');
                doc.text('CERTIFICADO DE SANCIONES', pageWidth / 2, 22, { align: 'center' });
                
                // Subtítulo
                doc.setFontSize(13);
                doc.setFont(undefined, 'normal');
                doc.text('Cuerpo de Bomberos', pageWidth / 2, 33, { align: 'center' });
                
                // Fecha
                doc.setFontSize(10);
                doc.text(new Date().toLocaleDateString('es-CL', { 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric' 
                }), pageWidth / 2, 45, { align: 'center' });
                
                return 65;
            };

            // Función para agregar footer
            const addFooter = (pageNum, totalPages) => {
                doc.setFontSize(9);
                doc.setFont(undefined, 'italic');
                doc.setTextColor(120, 120, 120);
                doc.text('Este certificado acredita las sanciones disciplinarias registradas del voluntario', pageWidth / 2, pageHeight - 15, { align: 'center' });
                doc.text('en el Cuerpo de Bomberos', pageWidth / 2, pageHeight - 10, { align: 'center' });
                doc.setFont(undefined, 'normal');
                doc.text(`Página ${pageNum} de ${totalPages}`, pageWidth / 2, pageHeight - 5, { align: 'center' });
            };

            // Calcular páginas necesarias
            const itemsPerPage = 4; // Sanciones por página
            const totalPages = Math.ceil(sancionesBombero.length / itemsPerPage) || 1;

            // Primera página - Encabezado y datos del bombero
            yPos = addHeader();
            
            // DATOS DEL VOLUNTARIO
            doc.setTextColor(0, 0, 0);
            
            // Título de sección con fondo
            yPos += 10;
            doc.setFillColor(196, 30, 58); // Rojo bomberos
            doc.rect(margin, yPos, pageWidth - 2 * margin, 10, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            doc.text('DATOS DEL VOLUNTARIO', pageWidth / 2, yPos + 7, { align: 'center' });
            
            yPos += 20;
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(11);
            doc.setFont(undefined, 'normal');
            
            // Datos centrados
            const antiguedad = Utils.calcularAntiguedadDetallada(this.bomberoActual.fechaIngreso);
            doc.text(`Nombre: ${Utils.obtenerNombreCompleto(this.bomberoActual)}`, pageWidth / 2, yPos, { align: 'center' });
            yPos += 6;
            doc.text(`Clave Bombero: ${this.bomberoActual.claveBombero}`, pageWidth / 2, yPos, { align: 'center' });
            yPos += 6;
            doc.text(`N° Registro: ${this.bomberoActual.nroRegistro || 'N/A'}`, pageWidth / 2, yPos, { align: 'center' });
            yPos += 6;
            doc.text(`RUN: ${this.bomberoActual.rut}`, pageWidth / 2, yPos, { align: 'center' });
            yPos += 6;
            doc.text(`Compañía: ${this.bomberoActual.compania}`, pageWidth / 2, yPos, { align: 'center' });
            
            yPos += 15;

            // SANCIONES DISCIPLINARIAS
            doc.setFillColor(196, 30, 58);
            doc.rect(margin, yPos, pageWidth - 2 * margin, 10, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            doc.text('SANCIONES DISCIPLINARIAS REGISTRADAS', pageWidth / 2, yPos + 7, { align: 'center' });
            
            yPos += 18;
            doc.setTextColor(0, 0, 0);

            // Listado de sanciones
            sancionesBombero.forEach((sancion, index) => {
                // Verificar si necesitamos nueva página
                if (yPos > pageHeight - 60) {
                    addFooter(currentPage, totalPages);
                    doc.addPage();
                    currentPage++;
                    yPos = addHeader();
                    yPos += 10;
                }

                const tipoTexto = sancion.tipoSancion.charAt(0).toUpperCase() + sancion.tipoSancion.slice(1);
                const año = new Date(sancion.fechaDesde).getFullYear();

                // Barra roja lateral (como en el certificado de cargos)
                doc.setFillColor(196, 30, 58);
                doc.rect(margin, yPos - 3, 4, 22, 'F');

                // Número y título de la sanción
                doc.setFontSize(12);
                doc.setFont(undefined, 'bold');
                doc.text(`${index + 1}. ${tipoTexto} (${año})`, margin + 8, yPos + 3);

                yPos += 8;
                doc.setFontSize(10);
                doc.setFont(undefined, 'normal');
                
                // Fechas
                let textoFechas = `Desde: ${Utils.formatearFecha(sancion.fechaDesde)}`;
                if (sancion.fechaHasta) {
                    textoFechas += ` | Hasta: ${Utils.formatearFecha(sancion.fechaHasta)}`;
                } else {
                    textoFechas += ` | Estado: Indefinida`;
                }
                doc.text(textoFechas, margin + 8, yPos);
                yPos += 5;

                // Oficio
                doc.text(`Oficio N°: ${sancion.oficioNumero}`, margin + 8, yPos);
                yPos += 5;

                // Autoridad si existe
                if (sancion.autoridadSancionatoria) {
                    doc.text(`Autoridad: ${sancion.autoridadSancionatoria}`, margin + 8, yPos);
                    yPos += 5;
                }

                // Observaciones/Motivo (truncado)
                if (sancion.motivo) {
                    const motivoCorto = sancion.motivo.length > 80 
                        ? sancion.motivo.substring(0, 80) + '...' 
                        : sancion.motivo;
                    doc.text(`Obs: ${motivoCorto}`, margin + 8, yPos);
                    yPos += 5;
                }

                yPos += 8; // Espaciado entre sanciones
            });

            // Footer de la última página
            addFooter(currentPage, totalPages);

            doc.save(`Certificado_Sanciones_${this.bomberoActual.claveBombero}_${new Date().toISOString().split('T')[0]}.pdf`);
            Utils.mostrarNotificacion('PDF generado exitosamente', 'success');
        } catch (error) {
            console.error('Error:', error);
            Utils.mostrarNotificacion('Error al generar PDF: ' + error.message, 'error');
        }
    }

    volverAlSistema() {
        localStorage.removeItem('bomberoSancionActual');
        window.location.href = 'sistema.html';
    }
}

// Inicializar sistema cuando se cargue la página
document.addEventListener('DOMContentLoaded', () => {
    window.sancionesSistema = new SistemaSanciones();
});