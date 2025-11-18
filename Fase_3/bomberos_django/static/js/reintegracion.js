class SistemaReintegracion {
    constructor() {
        this.voluntario = null;
        this.init();
    }

    async init() {
        await this.cargarVoluntario();
        this.configurarFormulario();
        this.establecerFechaActual();
        this.configurarCalculoAntiguedad();
    }

    async cargarVoluntario() {
        const voluntarioId = localStorage.getItem('voluntarioReintegracionId');
        if (!voluntarioId) {
            Utils.mostrarNotificacion('No se seleccionó ningún voluntario', 'error');
            setTimeout(() => this.volver(), 2000);
            return;
        }

        const bomberos = storage.getBomberos();
        this.voluntario = bomberos.find(b => b.id === parseInt(voluntarioId));

        if (!this.voluntario) {
            Utils.mostrarNotificacion('Voluntario no encontrado', 'error');
            setTimeout(() => this.volver(), 2000);
            return;
        }

        // Validar que pueda reintegrarse
        const validacion = Utils.puedeReintegrarse(this.voluntario);
        if (!validacion.puede) {
            Utils.mostrarNotificacion(validacion.mensaje, 'error');
            setTimeout(() => this.volver(), 2000);
            return;
        }

        this.mostrarInfoVoluntario();
        this.mostrarValidacionPeriodo();
    }

    mostrarInfoVoluntario() {
        const contenedor = document.getElementById('infoVoluntario');
        const estadoBadge = Utils.obtenerBadgeEstado(this.voluntario.estadoBombero);
        
        let fechaEstado = '';
        let tiempoTranscurrido = '';
        
        if (this.voluntario.estadoBombero === 'renunciado' && this.voluntario.fechaRenuncia) {
            fechaEstado = this.voluntario.fechaRenuncia;
            tiempoTranscurrido = this.calcularTiempoTranscurrido(fechaEstado);
        } else if (this.voluntario.estadoBombero === 'separado' && this.voluntario.fechaSeparacion) {
            fechaEstado = this.voluntario.fechaSeparacion;
            tiempoTranscurrido = this.calcularTiempoTranscurrido(fechaEstado);
        }

        contenedor.innerHTML = `
            <div class="info-row">
                <div class="info-item">
                    <strong>Nombre Completo:</strong>
                    <span>${Utils.obtenerNombreCompleto(this.voluntario)}</span>
                </div>
                <div class="info-item">
                    <strong>Clave:</strong>
                    <span>${this.voluntario.claveBombero}</span>
                </div>
                <div class="info-item">
                    <strong>RUT:</strong>
                    <span>${this.voluntario.rut}</span>
                </div>
            </div>
            <div class="info-row">
                <div class="info-item">
                    <strong>Estado Actual:</strong>
                    <span>${estadoBadge}</span>
                </div>
                <div class="info-item">
                    <strong>Fecha de ${this.voluntario.estadoBombero === 'renunciado' ? 'Renuncia' : 'Separación'}:</strong>
                    <span>${fechaEstado ? Utils.formatearFecha(fechaEstado) : 'N/A'}</span>
                </div>
                <div class="info-item">
                    <strong>Tiempo Transcurrido:</strong>
                    <span>${tiempoTranscurrido}</span>
                </div>
            </div>
        `;
    }

    mostrarValidacionPeriodo() {
        const contenedor = document.getElementById('validacionPeriodo');
        const estado = this.voluntario.estadoBombero;
        
        let fechaEstado = '';
        let periodoMinimo = 0;
        
        if (estado === 'renunciado') {
            fechaEstado = this.voluntario.fechaRenuncia;
            periodoMinimo = 0; // Sin periodo mínimo para renunciados
        } else if (estado === 'separado') {
            fechaEstado = this.voluntario.fechaSeparacion;
            // Para separados, deben cumplir el periodo completo
            periodoMinimo = this.voluntario.aniosSeparacion * 12 || 12;
        }

        if (!fechaEstado) {
            contenedor.innerHTML = `
                <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <p style="margin: 0; color: #92400e; font-size: 0.95rem;">
                        ⚠️ <strong>Advertencia:</strong> No se encontró fecha de ${estado === 'renunciado' ? 'renuncia' : 'separación'}. 
                        Por favor, verifique los datos del voluntario.
                    </p>
                </div>
            `;
            return;
        }

        const mesesTranscurridos = this.calcularMesesDesde(fechaEstado);
        
        // Para renunciados, siempre pueden reintegrarse (sin periodo mínimo)
        if (estado === 'renunciado') {
            contenedor.innerHTML = `
                <div style="background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); border-left: 5px solid #10b981; padding: 20px; border-radius: 12px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);">
                    <p style="margin: 0; color: #065f46; font-size: 1rem; font-weight: 600;">
                        ✅ <strong>Puede Reintegrarse Inmediatamente</strong>
                    </p>
                    <p style="margin: 10px 0 0 0; color: #047857; font-size: 0.9rem;">
                        Los voluntarios renunciados no tienen periodo mínimo de espera. Han transcurrido ${this.calcularTiempoTranscurrido(fechaEstado)} desde la renuncia.
                    </p>
                </div>
            `;
            return;
        }
        
        // Para separados, validar periodo
        const cumplePeriodo = mesesTranscurridos >= periodoMinimo;

        if (cumplePeriodo) {
            contenedor.innerHTML = `
                <div style="background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); border-left: 5px solid #10b981; padding: 20px; border-radius: 12px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);">
                    <p style="margin: 0; color: #065f46; font-size: 1rem; font-weight: 600;">
                        ✅ <strong>Periodo Cumplido</strong>
                    </p>
                    <p style="margin: 10px 0 0 0; color: #047857; font-size: 0.9rem;">
                        Han transcurrido ${mesesTranscurridos} meses desde la separación (mínimo requerido: ${periodoMinimo} meses). Puede proceder con la reintegración.
                    </p>
                </div>
            `;
        } else {
            const mesesFaltantes = periodoMinimo - mesesTranscurridos;
            contenedor.innerHTML = `
                <div style="background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); border-left: 5px solid #ef4444; padding: 20px; border-radius: 12px; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);">
                    <p style="margin: 0; color: #991b1b; font-size: 1rem; font-weight: 600;">
                        ❌ <strong>Periodo Incompleto</strong>
                    </p>
                    <p style="margin: 10px 0 0 0; color: #991b1b; font-size: 0.9rem;">
                        Han transcurrido ${mesesTranscurridos} meses desde la separación. Faltan ${mesesFaltantes} meses para cumplir el periodo obligatorio de ${periodoMinimo} meses.
                    </p>
                    <p style="margin: 10px 0 0 0; color: #7f1d1d; font-size: 0.85rem; background: rgba(255,255,255,0.5); padding: 8px; border-radius: 6px;">
                        📅 Fecha estimada de disponibilidad: <strong>${this.calcularFechaDisponible(fechaEstado, periodoMinimo)}</strong>
                    </p>
                </div>
            `;
        }
    }

    calcularTiempoTranscurrido(fechaDesde) {
        if (!fechaDesde) return 'N/A';
        
        const desde = new Date(fechaDesde + 'T00:00:00');
        const ahora = new Date();
        
        let años = ahora.getFullYear() - desde.getFullYear();
        let meses = ahora.getMonth() - desde.getMonth();
        
        if (meses < 0) {
            años--;
            meses += 12;
        }
        
        if (años === 0) {
            return `${meses} ${meses === 1 ? 'mes' : 'meses'}`;
        } else if (meses === 0) {
            return `${años} ${años === 1 ? 'año' : 'años'}`;
        } else {
            return `${años} ${años === 1 ? 'año' : 'años'}, ${meses} ${meses === 1 ? 'mes' : 'meses'}`;
        }
    }

    calcularMesesDesde(fechaDesde) {
        if (!fechaDesde) return 0;
        
        const desde = new Date(fechaDesde + 'T00:00:00');
        const ahora = new Date();
        
        const años = ahora.getFullYear() - desde.getFullYear();
        const meses = ahora.getMonth() - desde.getMonth();
        
        return años * 12 + meses;
    }

    calcularFechaDisponible(fechaDesde, mesesMinimos) {
        if (!fechaDesde) return 'N/A';
        
        const fecha = new Date(fechaDesde + 'T00:00:00');
        fecha.setMonth(fecha.getMonth() + mesesMinimos);
        
        return Utils.formatearFecha(fecha.toISOString().split('T')[0]);
    }

    establecerFechaActual() {
        const hoy = new Date().toISOString().split('T')[0];
        document.getElementById('fechaReintegracion').value = hoy;
    }

    configurarCalculoAntiguedad() {
        const fechaInput = document.getElementById('fechaReintegracion');
        const contenedor = document.getElementById('nuevaAntiguedadCalculada');
        
        // Obtener antigüedad congelada (hasta la fecha de renuncia/separación)
        const fechaIngresoOriginal = this.voluntario.fechaIngreso;
        const fechaCongelamiento = this.voluntario.fechaCongelamiento || 
                                    this.voluntario.fechaRenuncia || 
                                    this.voluntario.fechaSeparacion || 
                                    this.voluntario.fechaExpulsion;
        
        const actualizarAntiguedad = () => {
            const fechaReintegracion = fechaInput.value;
            if (!fechaReintegracion) {
                contenedor.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <span style="font-size: 2rem;">🔄</span>
                        <div>
                            <p style="margin: 0; font-weight: 600; color: #0c4a6e;">Antigüedad Continuará desde donde quedó</p>
                            <p style="margin: 5px 0 0 0; font-size: 0.85rem; color: #0369a1;">La antigüedad congelada se reactivará y seguirá sumando desde la fecha de reintegración</p>
                        </div>
                    </div>
                `;
                return;
            }

            const hoy = new Date();
            const fecha = new Date(fechaReintegracion + 'T00:00:00');
            
            if (fecha > hoy) {
                contenedor.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <span style="font-size: 2rem;">⚠️</span>
                        <div>
                            <p style="margin: 0; font-weight: 600;">La fecha no puede ser futura</p>
                        </div>
                    </div>
                `;
                contenedor.style.background = 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)';
                contenedor.style.borderColor = '#ef4444';
                contenedor.style.color = '#991b1b';
                return;
            }
            
            // Calcular antigüedad congelada (desde ingreso hasta congelamiento)
            const antiguedadCongelada = fechaCongelamiento ? 
                Utils.calcularAntiguedadDetallada(fechaIngresoOriginal, fechaCongelamiento) :
                Utils.calcularAntiguedadDetallada(fechaIngresoOriginal);
            
            // Calcular tiempo desde reintegración hasta hoy
            const tiempoDesdeReintegracion = Utils.calcularAntiguedadDetallada(fechaReintegracion);
            
            // Sumar ambos periodos
            const totalDias = (antiguedadCongelada.años * 365 + antiguedadCongelada.meses * 30 + antiguedadCongelada.dias) +
                             (tiempoDesdeReintegracion.años * 365 + tiempoDesdeReintegracion.meses * 30 + tiempoDesdeReintegracion.dias);
            
            const añosTotal = Math.floor(totalDias / 365);
            const mesesTotal = Math.floor((totalDias % 365) / 30);
            const diasTotal = Math.floor((totalDias % 365) % 30);
            
            const diasDesdeReintegracion = Math.floor((hoy - fecha) / (1000 * 60 * 60 * 24));
            
            if (diasDesdeReintegracion === 0) {
                contenedor.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <span style="font-size: 2rem;">✨</span>
                        <div style="flex: 1;">
                            <p style="margin: 0; font-weight: 600; color: #065f46;">Antigüedad se reactivará HOY</p>
                            <div style="margin-top: 10px; padding: 12px; background: rgba(255,255,255,0.7); border-radius: 8px;">
                                <p style="margin: 0; font-size: 0.85rem; color: #047857;">
                                    📊 <strong>Antigüedad congelada:</strong> ${antiguedadCongelada.años} años, ${antiguedadCongelada.meses} meses, ${antiguedadCongelada.dias} días
                                </p>
                                <p style="margin: 5px 0 0 0; font-size: 0.85rem; color: #047857;">
                                    ➕ <strong>Desde hoy:</strong> Continuará sumando
                                </p>
                            </div>
                        </div>
                    </div>
                `;
            } else {
                contenedor.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <span style="font-size: 2rem;">📊</span>
                        <div style="flex: 1;">
                            <p style="margin: 0; font-weight: 600; color: #065f46; font-size: 1.05rem;">
                                Antigüedad Total: ${añosTotal} años, ${mesesTotal} meses, ${diasTotal} días
                            </p>
                            <div style="margin-top: 10px; padding: 12px; background: rgba(255,255,255,0.7); border-radius: 8px; border-left: 3px solid #10b981;">
                                <p style="margin: 0; font-size: 0.85rem; color: #047857;">
                                    🔒 <strong>Periodo congelado:</strong> ${antiguedadCongelada.años} años, ${antiguedadCongelada.meses} meses, ${antiguedadCongelada.dias} días
                                </p>
                                <p style="margin: 5px 0 0 0; font-size: 0.85rem; color: #047857;">
                                    🔄 <strong>Desde reintegración:</strong> ${tiempoDesdeReintegracion.años} años, ${tiempoDesdeReintegracion.meses} meses, ${tiempoDesdeReintegracion.dias} días
                                </p>
                            </div>
                        </div>
                    </div>
                `;
            }
            
            contenedor.style.background = 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)';
            contenedor.style.borderColor = '#10b981';
            contenedor.style.color = '#065f46';
        };

        // Actualizar al cambiar fecha
        fechaInput.addEventListener('change', actualizarAntiguedad);
        
        // Actualizar inicialmente
        actualizarAntiguedad();
    }

    configurarFormulario() {
        document.getElementById('formReintegracion').addEventListener('submit', (e) => {
            e.preventDefault();
            this.procesarReintegracion(e);
        });

        document.getElementById('bomberoId').value = this.voluntario.id;
    }

    async procesarReintegracion(event) {
        const formData = new FormData(event.target);
        const datos = Object.fromEntries(formData);

        // Validaciones básicas
        if (!datos.padrino1.trim() || !datos.padrino2.trim()) {
            Utils.mostrarNotificacion('Debe especificar los nombres de los dos padrinos', 'error');
            return;
        }

        if (!datos.fechaReintegracion) {
            Utils.mostrarNotificacion('Debe especificar la fecha de reintegración', 'error');
            return;
        }

        try {
            await this.guardarReintegracion(datos);
            Utils.mostrarNotificacion('✅ Reintegración procesada exitosamente', 'success');
            setTimeout(() => {
                window.location.href = 'sistema.html';
            }, 2000);
        } catch (error) {
            Utils.mostrarNotificacion('Error: ' + error.message, 'error');
        }
    }

    async guardarReintegracion(datos) {
        const bomberos = storage.getBomberos();
        const index = bomberos.findIndex(b => b.id === this.voluntario.id);

        if (index === -1) {
            throw new Error('Voluntario no encontrado');
        }

        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        const estadoAnterior = this.voluntario.estadoBombero;

        // Actualizar voluntario (mantener fechaIngreso original, solo descongelar)
        bomberos[index] = {
            ...bomberos[index],
            estadoBombero: 'activo',
            antiguedadCongelada: false,
            fechaDescongelamiento: datos.fechaReintegracion, // Fecha en que se reintegra
            // fechaIngreso se mantiene igual (no se reinicia)
            historialEstados: [
                ...(bomberos[index].historialEstados || []),
                {
                    estadoAnterior: estadoAnterior,
                    estadoNuevo: 'activo',
                    fecha: new Date().toISOString(),
                    motivo: 'Reintegración formal',
                    registradoPor: currentUser ? currentUser.username : 'sistema'
                }
            ],
            historialReintegraciones: [
                ...(bomberos[index].historialReintegraciones || []),
                {
                    fechaReintegracion: datos.fechaReintegracion,
                    estadoAnterior: estadoAnterior,
                    nombrePadrino1: datos.padrino1.trim(),
                    nombrePadrino2: datos.padrino2.trim(),
                    observaciones: datos.observaciones?.trim() || '',
                    registradoPor: currentUser ? currentUser.username : 'sistema',
                    fechaRegistro: new Date().toISOString()
                }
            ]
        };

        storage.saveBomberos(bomberos);
    }

    volver() {
        window.location.href = 'sistema.html';
    }
}

// Inicializar
const reintegracionSistema = new SistemaReintegracion();
