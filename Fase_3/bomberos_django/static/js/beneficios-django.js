// ==================== SISTEMA BENEFICIOS DJANGO - COMPLETO ====================
const API_BASE = '/api/voluntarios';

class SistemaBeneficiosDjango {
    constructor() {
        this.beneficios = [];
        this.asignaciones = [];
        this.logoBase64 = null;
        this.estadisticas = {
            activos: 0,
            esperado: 0,
            recaudado: 0,
            deudores: 0
        };
        this.init();
    }

    async init() {
        console.log('[BENEFICIOS DJANGO] Inicializando...');
        await this.cargarLogo();
        await this.cargarDatos();
        this.renderizarEstadisticas();
        this.renderizarBeneficios();
    }

    async cargarLogo() {
        try {
            const response = await fetch(`${API_BASE}/logo-simple/`);
            if (response.ok) {
                const data = await response.json();
                if (data.tiene_logo) {
                    this.logoBase64 = data.logo;
                    console.log('[LOGO] Cargado exitosamente');
                }
            }
        } catch (error) {
            console.error('[ERROR] Cargar logo:', error);
        }
    }

    async cargarDatos() {
        try {
            // Cargar todos los beneficios
            const respBeneficios = await fetch(`${API_BASE}/beneficios/`);
            if (respBeneficios.ok) {
                this.beneficios = await respBeneficios.json();
                console.log('[BENEFICIOS] Cargados desde Django:', this.beneficios.length);
            }
            
            // Cargar todas las asignaciones
            const respAsignaciones = await fetch(`${API_BASE}/asignaciones-beneficios/`);
            if (respAsignaciones.ok) {
                this.asignaciones = await respAsignaciones.json();
                console.log('[ASIGNACIONES] Cargadas:', this.asignaciones.length);
            }
            
            // Calcular estadísticas
            this.calcularEstadisticas();
            
        } catch (error) {
            console.error('[ERROR] Cargar datos:', error);
            // Mostrar datos de prueba si falla
            this.mostrarNotificacion('Cargando beneficios...', 'info');
        }
    }

    calcularEstadisticas() {
        // Beneficios activos
        this.estadisticas.activos = this.beneficios.filter(b => b.estado === 'activo').length;
        
        // Total esperado y recaudado
        this.estadisticas.esperado = 0;
        this.estadisticas.recaudado = 0;
        this.estadisticas.deudores = 0;
        
        this.asignaciones.forEach(asig => {
            this.estadisticas.esperado += parseFloat(asig.monto_total || 0);
            this.estadisticas.recaudado += parseFloat(asig.monto_pagado || 0);
            if (asig.estado_pago === 'pendiente' || asig.estado_pago === 'parcial') {
                this.estadisticas.deudores++;
            }
        });
    }

    renderizarEstadisticas() {
        // Beneficios activos
        const elemActivos = document.getElementById('totalBeneficiosActivos');
        if (elemActivos) elemActivos.textContent = this.estadisticas.activos;
        
        // Total esperado
        const elemEsperado = document.getElementById('totalEsperado');
        if (elemEsperado) elemEsperado.textContent = `$${this.formatearMonto(this.estadisticas.esperado)}`;
        
        // Total recaudado
        const elemRecaudado = document.getElementById('totalRecaudado');
        if (elemRecaudado) elemRecaudado.textContent = `$${this.formatearMonto(this.estadisticas.recaudado)}`;
        
        // Deudores
        const elemDeudores = document.getElementById('totalDeudores');
        if (elemDeudores) elemDeudores.textContent = this.estadisticas.deudores;
        
        // Eficiencia
        const eficiencia = this.estadisticas.esperado > 0 
            ? Math.round((this.estadisticas.recaudado / this.estadisticas.esperado) * 100)
            : 0;
        const elemEficiencia = document.getElementById('eficienciaGeneral');
        if (elemEficiencia) elemEficiencia.textContent = `${eficiencia}%`;
        
        // Porcentajes
        const elemPorcRecaudado = document.getElementById('porcentajeRecaudado');
        if (elemPorcRecaudado) elemPorcRecaudado.textContent = `${eficiencia}%`;
        
        const elemPorcDeudores = document.getElementById('porcentajeDeudores');
        if (elemPorcDeudores) {
            const totalAsig = this.asignaciones.length;
            const porcDeudores = totalAsig > 0 ? Math.round((this.estadisticas.deudores / totalAsig) * 100) : 0;
            elemPorcDeudores.textContent = `${porcDeudores}%`;
        }
    }

    renderizarBeneficios() {
        const container = document.getElementById('listaBeneficios');
        if (!container) return;
        
        if (this.beneficios.length === 0) {
            container.innerHTML = `
                <div style="padding: 40px; text-align: center; background: white; border-radius: 8px;">
                    <h3 style="color: #666;">📋 No hay beneficios registrados</h3>
                    <p style="color: #999;">Crea tu primer beneficio usando el formulario de arriba</p>
                </div>
            `;
            return;
        }
        
        let html = '';
        this.beneficios.forEach(beneficio => {
            // Obtener asignaciones de este beneficio
            const asigBeneficio = this.asignaciones.filter(a => a.beneficio === beneficio.id);
            const totalAsignados = asigBeneficio.length;
            const totalPagados = asigBeneficio.filter(a => a.estado_pago === 'completo').length;
            const totalDeudores = asigBeneficio.filter(a => a.estado_pago === 'pendiente' || a.estado_pago === 'parcial').length;
            const eficiencia = totalAsignados > 0 ? Math.round((totalPagados / totalAsignados) * 100) : 0;
            
            const estadoClass = beneficio.estado === 'activo' ? 'activo' : 'cerrado';
            const estadoBadge = beneficio.estado === 'activo' ? '<span class="badge-activo">Activo</span>' : '<span class="badge-cerrado">Cerrado</span>';
            
            html += `
                <div class="beneficio-card ${estadoClass}" style="background: white; padding: 20px; margin: 15px 0; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <div class="beneficio-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px;">
                        <h3 style="margin: 0; color: #333;">${beneficio.nombre}</h3>
                        ${estadoBadge}
                    </div>
                    
                    <div class="beneficio-body">
                        <div class="stats-grid" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 15px 0; text-align: center;">
                            <div style="padding: 15px; background: #e3f2fd; border-radius: 8px;">
                                <div style="font-size: 24px; font-weight: bold; color: #1976d2;">${totalAsignados}</div>
                                <div style="font-size: 12px; color: #666; margin-top: 5px;">ASIGNADOS</div>
                            </div>
                            <div style="padding: 15px; background: #e8f5e9; border-radius: 8px;">
                                <div style="font-size: 24px; font-weight: bold; color: #388e3c;">${totalPagados}</div>
                                <div style="font-size: 12px; color: #666; margin-top: 5px;">PAGADOS</div>
                            </div>
                            <div style="padding: 15px; background: #ffebee; border-radius: 8px;">
                                <div style="font-size: 24px; font-weight: bold; color: #d32f2f;">${totalDeudores}</div>
                                <div style="font-size: 12px; color: #666; margin-top: 5px;">DEUDORES</div>
                            </div>
                            <div style="padding: 15px; background: #fff3e0; border-radius: 8px;">
                                <div style="font-size: 24px; font-weight: bold; color: #f57c00;">${eficiencia}%</div>
                                <div style="font-size: 12px; color: #666; margin-top: 5px;">EFICIENCIA</div>
                            </div>
                        </div>
                        
                        <div class="beneficio-info" style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin: 15px 0; font-size: 13px;">
                            <div style="padding: 8px; background: #f8f9fa; border-radius: 4px;">
                                <strong>📅 Fecha:</strong> ${this.formatearFecha(beneficio.fecha_evento)}
                            </div>
                            <div style="padding: 8px; background: #f8f9fa; border-radius: 4px;">
                                <strong>💰 Precio:</strong> $${this.formatearMonto(beneficio.precio_por_tarjeta)}/tarjeta
                            </div>
                            <div style="padding: 8px; background: #f8f9fa; border-radius: 4px;">
                                <strong>🎫 Tarjetas:</strong> V:${beneficio.tarjetas_voluntarios} H:${beneficio.tarjetas_honorarios_cia} I:${beneficio.tarjetas_insignes}
                            </div>
                        </div>
                        
                        <div style="display: flex; gap: 10px; margin-top: 15px;">
                            <button class="btn btn-danger" onclick="beneficiosSistema.verDeudores(${beneficio.id})" style="flex: 1; padding: 10px; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; border: none; border-radius: 6px; cursor: pointer;">
                                ⚠️ DEUDORES (${totalDeudores})
                            </button>
                            ${beneficio.estado === 'activo' ? `
                                <button class="btn btn-secondary" onclick="beneficiosSistema.cerrarBeneficio(${beneficio.id})" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 6px; cursor: pointer;">
                                    🔒 CERRAR
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
        
        // Actualizar contador
        const elemMostrados = document.getElementById('totalBeneficiosMostrados');
        const elemTotal = document.getElementById('totalBeneficios');
        if (elemMostrados) elemMostrados.textContent = this.beneficios.length;
        if (elemTotal) elemTotal.textContent = this.beneficios.length;
    }

    async crearBeneficio(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        
        const payload = {
            nombre: formData.get('nombreBeneficio'),
            descripcion: formData.get('descripcionBeneficio') || '',
            fecha_evento: formData.get('fechaEvento'),
            precio_tarjeta: parseInt(formData.get('precioTarjeta')),
            tarjetas_voluntarios: parseInt(formData.get('tarjetasVoluntarios')),
            tarjetas_honorarios_cia: parseInt(formData.get('tarjetasHonorariosCia')),
            tarjetas_honorarios_cuerpo: parseInt(formData.get('tarjetasHonorariosCuerpo')),
            tarjetas_insignes: parseInt(formData.get('tarjetasInsignes'))
        };

        try {
            this.mostrarNotificacion('Creando beneficio...', 'info');
            
            const response = await fetch(`${API_BASE}/crear-beneficio-simple/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Error al crear beneficio');
            }

            const result = await response.json();
            
            this.mostrarNotificacion(`✅ ${result.mensaje}<br><strong>Asignaciones creadas: ${result.asignaciones_creadas}</strong>`, 'success');
            
            event.target.reset();
            
            await this.cargarDatos();
            this.renderizarEstadisticas();
            this.renderizarBeneficios();
            
        } catch (error) {
            this.mostrarNotificacion(`❌ Error: ${error.message}`, 'error');
        }
    }

    async verDeudores(beneficioId) {
        // Obtener deudores de este beneficio
        const deudores = this.asignaciones.filter(a => 
            a.beneficio === beneficioId && 
            (a.estado_pago === 'pendiente' || a.estado_pago === 'parcial')
        );
        
        if (deudores.length === 0) {
            this.mostrarNotificacion('✅ No hay deudores en este beneficio', 'success');
            return;
        }
        
        // Obtener nombre del beneficio
        const beneficio = this.beneficios.find(b => b.id === beneficioId);
        const nombreBeneficio = beneficio ? beneficio.nombre : 'Beneficio';
        
        // Calcular total de deuda
        const totalDeuda = deudores.reduce((sum, d) => sum + parseFloat(d.monto_pendiente), 0);
        
        // Crear modal hermoso
        this.mostrarModalDeudores(nombreBeneficio, deudores, totalDeuda);
    }

    mostrarModalDeudores(nombreBeneficio, deudores, totalDeuda) {
        let paginaActual = 1;
        const deudoresPorPagina = 10;
        const totalPaginas = Math.ceil(deudores.length / deudoresPorPagina);
        
        // Crear overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            animation: fadeIn 0.3s ease;
        `;
        
        // Crear modal
        const modal = document.createElement('div');
        modal.style.cssText = `
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 20px;
            padding: 30px;
            max-width: 800px;
            width: 90%;
            max-height: 85vh;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
            animation: slideDown 0.3s ease;
            color: white;
            overflow-y: auto;
        `;
        
        // Header
        const header = `
            <div style="text-align: center; margin-bottom: 25px; border-bottom: 2px solid rgba(255,255,255,0.3); padding-bottom: 20px;">
                <h2 style="margin: 0; font-size: 28px; font-weight: 700;">⚠️ LISTA DE DEUDORES</h2>
                <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">${nombreBeneficio}</p>
            </div>
        `;
        
        // Stats
        const stats = `
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 25px;">
                <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 12px; text-align: center;">
                    <div style="font-size: 32px; font-weight: bold;">${deudores.length}</div>
                    <div style="font-size: 12px; opacity: 0.9; margin-top: 5px;">DEUDORES</div>
                </div>
                <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 12px; text-align: center;">
                    <div style="font-size: 32px; font-weight: bold;">$${this.formatearMonto(totalDeuda)}</div>
                    <div style="font-size: 12px; opacity: 0.9; margin-top: 5px;">TOTAL ADEUDADO</div>
                </div>
                <div style="background: rgba(255,255,255,0.2); padding: 15px; border-radius: 12px; text-align: center;">
                    <div style="font-size: 32px; font-weight: bold;">$${this.formatearMonto(totalDeuda / deudores.length)}</div>
                    <div style="font-size: 12px; opacity: 0.9; margin-top: 5px;">PROMEDIO</div>
                </div>
            </div>
        `;
        
        // Función para renderizar tabla con paginación
        const renderTabla = (pagina) => {
            const inicio = (pagina - 1) * deudoresPorPagina;
            const fin = inicio + deudoresPorPagina;
            const deudoresPagina = deudores.slice(inicio, fin);
            
            let listaHTML = `
                <div style="background: white; border-radius: 15px; padding: 20px;">
                    <table style="width: 100%; border-collapse: collapse; color: #333;">
                        <thead style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
                            <tr>
                                <th style="padding: 12px; text-align: left; font-size: 13px; border-radius: 8px 0 0 0;">#</th>
                                <th style="padding: 12px; text-align: left; font-size: 13px;">BOMBERO</th>
                                <th style="padding: 12px; text-align: center; font-size: 13px;">TARJETAS</th>
                                <th style="padding: 12px; text-align: right; font-size: 13px; border-radius: 0 8px 0 0;">DEUDA</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            deudoresPagina.forEach((deudor, index) => {
                const numeroGlobal = inicio + index + 1;
                const bgColor = index % 2 === 0 ? '#f8f9fa' : 'white';
                listaHTML += `
                    <tr style="background: ${bgColor}; border-bottom: 1px solid #eee;">
                        <td style="padding: 15px; font-weight: bold; color: #667eea;">${numeroGlobal}</td>
                        <td style="padding: 15px;">
                            <div style="font-weight: 600; color: #333;">${deudor.voluntario_nombre}</div>
                            <div style="font-size: 11px; color: #999; margin-top: 3px;">
                                ${deudor.tarjetas_vendidas}/${deudor.tarjetas_asignadas} vendidas
                            </div>
                        </td>
                        <td style="padding: 15px; text-align: center;">
                            <span style="background: #e3f2fd; color: #1976d2; padding: 5px 12px; border-radius: 20px; font-weight: 600; font-size: 13px;">
                                ${deudor.tarjetas_asignadas}
                            </span>
                        </td>
                        <td style="padding: 15px; text-align: right; font-size: 16px; font-weight: bold; color: #d32f2f;">
                            $${this.formatearMonto(deudor.monto_pendiente)}
                        </td>
                    </tr>
                `;
            });
            
            listaHTML += `
                        </tbody>
                    </table>
                </div>
            `;
            
            // Paginación
            if (totalPaginas > 1) {
                listaHTML += `
                    <div style="display: flex; justify-content: center; gap: 8px; margin-top: 20px; flex-wrap: wrap;">
                `;
                
                for (let i = 1; i <= totalPaginas; i++) {
                    const isActive = i === pagina;
                    listaHTML += `
                        <button onclick="cambiarPagina(${i})" 
                                style="background: ${isActive ? 'white' : 'rgba(255,255,255,0.3)'}; 
                                       color: ${isActive ? '#667eea' : 'white'}; 
                                       border: ${isActive ? '2px solid white' : 'none'}; 
                                       padding: 10px 16px; 
                                       border-radius: 8px; 
                                       font-size: 14px; 
                                       font-weight: ${isActive ? 'bold' : 'normal'}; 
                                       cursor: pointer; 
                                       min-width: 45px;
                                       transition: all 0.3s;"
                                onmouseover="if(${!isActive}) this.style.background='rgba(255,255,255,0.5)'"
                                onmouseout="if(${!isActive}) this.style.background='rgba(255,255,255,0.3)'">
                            ${i}
                        </button>
                    `;
                }
                
                listaHTML += `
                        <div style="color: white; padding: 10px; font-size: 13px; align-self: center;">
                            Página ${pagina} de ${totalPaginas}
                        </div>
                    </div>
                `;
            }
            
            return listaHTML;
        };
        
        // Botones footer
        const footer = `
            <div style="display: flex; gap: 15px; justify-content: center; margin-top: 25px;">
                <button onclick="exportarPDF()" 
                        style="background: #4CAF50; color: white; border: none; padding: 15px 35px; 
                               border-radius: 30px; font-size: 16px; font-weight: 700; cursor: pointer; 
                               box-shadow: 0 4px 15px rgba(0,0,0,0.2); transition: all 0.3s;"
                        onmouseover="this.style.transform='scale(1.05)'"
                        onmouseout="this.style.transform='scale(1)'">
                    📄 EXPORTAR PDF
                </button>
                <button onclick="this.closest('.modal-overlay').remove()" 
                        style="background: white; color: #667eea; border: none; padding: 15px 40px; 
                               border-radius: 30px; font-size: 16px; font-weight: 700; cursor: pointer; 
                               box-shadow: 0 4px 15px rgba(0,0,0,0.2); transition: all 0.3s;"
                        onmouseover="this.style.transform='scale(1.05)'"
                        onmouseout="this.style.transform='scale(1)'">
                    ✓ CERRAR
                </button>
            </div>
        `;
        
        modal.innerHTML = header + stats + renderTabla(paginaActual) + footer;
        overlay.appendChild(modal);
        overlay.className = 'modal-overlay';
        
        // Función global para cambiar página
        window.cambiarPagina = (pagina) => {
            paginaActual = pagina;
            const tablaContainer = modal.querySelector('div[style*="background: white"]').parentElement;
            tablaContainer.innerHTML = renderTabla(pagina) + footer;
        };
        
        // Función global para exportar PDF
        window.exportarPDF = () => {
            this.generarPDFDeudores(nombreBeneficio, deudores, totalDeuda);
        };
        
        // Click fuera del modal para cerrar
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.remove();
                delete window.cambiarPagina;
                delete window.exportarPDF;
            }
        });
        
        // ESC para cerrar
        document.addEventListener('keydown', function closeOnEsc(e) {
            if (e.key === 'Escape') {
                overlay.remove();
                delete window.cambiarPagina;
                delete window.exportarPDF;
                document.removeEventListener('keydown', closeOnEsc);
            }
        });
        
        document.body.appendChild(overlay);
        
        // Agregar animaciones CSS
        if (!document.getElementById('modal-animations')) {
            const style = document.createElement('style');
            style.id = 'modal-animations';
            style.textContent = `
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideDown {
                    from { 
                        opacity: 0;
                        transform: translateY(-50px);
                    }
                    to { 
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    async cerrarBeneficio(beneficioId) {
        if (!confirm('¿Cerrar este beneficio? Ya no se podrán hacer cambios.')) return;
        
        try {
            const response = await fetch(`${API_BASE}/beneficios/${beneficioId}/cerrar/`, {
                method: 'POST'
            });
            
            if (response.ok) {
                this.mostrarNotificacion('✅ Beneficio cerrado', 'success');
                await this.cargarDatos();
                this.renderizarBeneficios();
            }
        } catch (error) {
            this.mostrarNotificacion(`❌ Error: ${error.message}`, 'error');
        }
    }

    formatearFecha(fecha) {
        return new Date(fecha).toLocaleDateString('es-CL');
    }

    formatearMonto(monto) {
        return new Intl.NumberFormat('es-CL').format(Math.round(monto));
    }

    mostrarNotificacion(mensaje, tipo) {
        const div = document.getElementById('mensajeBeneficios');
        if (div) {
            div.innerHTML = mensaje;
            div.className = `mensaje-global ${tipo === 'success' ? 'success' : tipo === 'error' ? 'error' : 'info'}`;
            div.style.display = 'block';
            div.style.padding = '15px';
            div.style.marginBottom = '20px';
            div.style.borderRadius = '8px';
            div.style.backgroundColor = tipo === 'success' ? '#d4edda' : tipo === 'error' ? '#f8d7da' : '#d1ecf1';
            div.style.color = tipo === 'success' ? '#155724' : tipo === 'error' ? '#721c24' : '#0c5460';
            
            if (tipo !== 'info') {
                setTimeout(() => {
                    div.style.display = 'none';
                }, 5000);
            }
        }
    }

    limpiarFormulario() {
        document.getElementById('formCrearBeneficio').reset();
    }

    volverAlSistema() {
        window.location.href = 'sistema.html';
    }

    // Métodos stub para evitar errores
    aplicarFiltros() {
        console.log('Filtros no implementados aún');
    }

    exportarExcel() {
        console.log('Exportar Excel no implementado aún');
    }

    verLogAuditoriaBeneficios() {
        console.log('Log auditoría no implementado aún');
    }

    generarPDFDeudores(nombreBeneficio, deudores, totalDeuda) {
        // Usar jsPDF (debe estar cargado en el HTML)
        if (typeof window.jspdf === 'undefined') {
            alert('❌ Error: jsPDF no está cargado. Recarga la página (CTRL+F5)');
            return;
        }
        
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // HEADER PROFESIONAL
        // Franja amarilla superior
        doc.setFillColor(255, 193, 7);
        doc.rect(0, 0, 210, 8, 'F');
        
        // Franja roja
        doc.setFillColor(211, 47, 47);
        doc.rect(0, 8, 210, 35, 'F');
        
        // Logo de la compañía
        if (this.logoBase64) {
            try {
                const logoImg = new Image();
                logoImg.src = this.logoBase64;
                doc.addImage(logoImg, 'PNG', 10, 10, 30, 30);
            } catch (error) {
                console.error('Error al agregar logo:', error);
                // Fallback: círculo con número
                doc.setFillColor(255, 255, 255);
                doc.circle(25, 25, 12, 'F');
                doc.setTextColor(211, 47, 47);
                doc.setFontSize(18);
                doc.setFont(undefined, 'bold');
                doc.text('6', 25, 28, { align: 'center' });
            }
        } else {
            // Fallback: círculo con número
            doc.setFillColor(255, 255, 255);
            doc.circle(25, 25, 12, 'F');
            doc.setTextColor(211, 47, 47);
            doc.setFontSize(18);
            doc.setFont(undefined, 'bold');
            doc.text('6', 25, 28, { align: 'center' });
        }
        
        // Título principal
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont(undefined, 'bold');
        doc.text('LISTA DE DEUDORES', 105, 22, { align: 'center' });
        
        // Nombre del beneficio
        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');
        doc.text(nombreBeneficio, 105, 32, { align: 'center' });
        
        // Fecha de generación
        doc.setFontSize(9);
        const fechaHoy = new Date().toLocaleDateString('es-CL', { 
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        doc.text(`Fecha: ${fechaHoy}`, 105, 39, { align: 'center' });
        
        // RESUMEN DE DEUDAS (sin emojis)
        doc.setTextColor(0, 0, 0);
        let y = 50;
        
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('RESUMEN DE DEUDAS', 15, y);
        
        y += 8;
        doc.setFillColor(245, 245, 245);
        doc.roundedRect(15, y, 180, 25, 2, 2, 'F');
        
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(80, 80, 80);
        
        y += 8;
        doc.text(`Total de Deudores: ${deudores.length}`, 20, y);
        
        y += 7;
        doc.text(`Total Adeudado: $${this.formatearMonto(totalDeuda)}`, 20, y);
        
        y += 7;
        doc.text(`Promedio por Deudor: $${this.formatearMonto(totalDeuda / deudores.length)}`, 20, y);
        
        // LISTA DE DEUDORES (sin emojis)
        y += 10;
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('DETALLE DE DEUDORES', 15, y);
        
        y += 5;
        
        // Header tabla - Naranja
        doc.setFillColor(255, 152, 0);
        doc.rect(15, y, 180, 8, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFont(undefined, 'bold');
        doc.setFontSize(9);
        doc.text('#', 20, y + 5.5);
        doc.text('BOMBERO', 40, y + 5.5);
        doc.text('TARJETAS', 130, y + 5.5, { align: 'center' });
        doc.text('MONTO', 170, y + 5.5, { align: 'center' });
        
        y += 8;
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(9);
        
        // Filas limpias y profesionales
        deudores.forEach((deudor, index) => {
            if (y > 270) {
                doc.addPage();
                y = 20;
                
                // Re-dibujar header en nueva página
                doc.setFillColor(255, 152, 0);
                doc.rect(15, y, 180, 8, 'F');
                doc.setTextColor(255, 255, 255);
                doc.setFont(undefined, 'bold');
                doc.text('#', 20, y + 5.5);
                doc.text('BOMBERO', 40, y + 5.5);
                doc.text('TARJETAS', 130, y + 5.5, { align: 'center' });
                doc.text('MONTO', 170, y + 5.5, { align: 'center' });
                y += 8;
                doc.setTextColor(0, 0, 0);
            }
            
            // Filas alternadas simples
            const bgColor = index % 2 === 0 ? [250, 250, 250] : [255, 255, 255];
            doc.setFillColor(...bgColor);
            doc.rect(15, y, 180, 10, 'F');
            
            // Línea separadora
            doc.setDrawColor(220, 220, 220);
            doc.setLineWidth(0.1);
            doc.line(15, y, 195, y);
            
            doc.setFont(undefined, 'normal');
            doc.setFontSize(9);
            
            // Número
            doc.setTextColor(100, 100, 100);
            doc.text(`${index + 1}`, 20, y + 6.5);
            
            // Nombre
            doc.setTextColor(0, 0, 0);
            doc.text(deudor.voluntario_nombre.substring(0, 40), 40, y + 6.5);
            
            // Tarjetas
            doc.setTextColor(0, 0, 0);
            doc.text(`${deudor.tarjetas_asignadas}`, 130, y + 6.5, { align: 'center' });
            
            // Deuda en rojo
            doc.setFont(undefined, 'bold');
            doc.setTextColor(211, 47, 47);
            doc.text(`$${this.formatearMonto(deudor.monto_pendiente)}`, 170, y + 6.5, { align: 'center' });
            
            y += 10;
        });
        
        // FOOTER PROFESIONAL
        const totalPages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            
            // Línea separadora
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.3);
            doc.line(15, 285, 195, 285);
            
            // Texto del footer
            doc.setFontSize(8);
            doc.setTextColor(100, 100, 100);
            doc.setFont(undefined, 'normal');
            doc.text('Sexta Compania De Bomberos de Puerto Montt', 20, 290);
            
            doc.setTextColor(100, 100, 100);
            doc.text(`Pagina ${i} de ${totalPages}`, 105, 290, { align: 'center' });
            
            const fecha = new Date().toLocaleDateString('es-CL');
            doc.text(fecha, 190, 290, { align: 'right' });
        }
        
        // Descargar
        const fecha = new Date().toISOString().split('T')[0];
        doc.save(`deudores-${nombreBeneficio.replace(/\s+/g, '-')}-${fecha}.pdf`);
        
        this.mostrarNotificacion('✅ PDF generado exitosamente', 'success');
    }
}

// Inicializar
let beneficiosSistema;
document.addEventListener('DOMContentLoaded', () => {
    console.log('[BENEFICIOS DJANGO] DOM Cargado');
    beneficiosSistema = new SistemaBeneficiosDjango();
    
    const form = document.getElementById('formCrearBeneficio');
    if (form) {
        form.addEventListener('submit', (e) => beneficiosSistema.crearBeneficio(e));
        console.log('[FORM] Listener agregado');
    }
});
