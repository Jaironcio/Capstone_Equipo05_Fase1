/**
 * SISTEMA DE TABLA DE UNIFORMES POR VOLUNTARIO
 * Muestra la posesión de uniformes de cada voluntario
 * Visible para: Director, Capitán, Ayudante, Secretario
 */

class TablaUniformesVoluntario {
    constructor(bomberoId) {
        this.bomberoId = bomberoId;
        this.bombero = null;
        this.todosLosUniformes = [];
    }

    async cargarDatos() {
        // Cargar datos del bombero usando el storage
        let bomberos = [];
        
        // Intentar cargar desde storage global primero
        if (typeof storage !== 'undefined' && storage.getBomberos) {
            bomberos = storage.getBomberos();
            console.log('✅ Datos cargados desde storage.getBomberos()');
        } else {
            // Fallback: intentar desde localStorage directamente
            bomberos = JSON.parse(localStorage.getItem('bomberos') || '[]');
            console.log('⚠️ Datos cargados desde localStorage directo');
        }
        
        console.log('=== DEBUG CARGA DATOS ===');
        console.log('ID recibido:', this.bomberoId, 'Tipo:', typeof this.bomberoId);
        console.log('Total bomberos cargados:', bomberos.length);
        console.log('Primeros 3 IDs de bomberos:', bomberos.slice(0, 3).map(b => ({ id: b.id, tipo: typeof b.id })));
        
        // Convertir bomberoId a número para comparación
        const idBuscado = parseInt(this.bomberoId);
        
        // Buscar con comparación flexible (== en lugar de ===)
        this.bombero = bomberos.find(b => b.id == idBuscado);
        
        if (!this.bombero) {
            console.error('❌ Bombero NO encontrado');
            console.error('ID buscado:', idBuscado);
            console.error('Todos los IDs disponibles:', bomberos.map(b => b.id));
            console.error('¿Algún bombero tiene este ID?', bomberos.some(b => b.id == idBuscado));
            
            if (typeof Utils !== 'undefined' && Utils.mostrarNotificacion) {
                Utils.mostrarNotificacion('Bombero no encontrado (ID: ' + idBuscado + ')', 'error');
            } else {
                alert('Bombero no encontrado (ID: ' + idBuscado + ')');
            }
            return false;
        }
        
        console.log('✅ Bombero encontrado:', this.bombero.primerNombre, this.bombero.primerApellido);

        // Cargar todos los tipos de uniformes
        const uniformesEstructural = JSON.parse(localStorage.getItem('uniformesEstructural') || '[]');
        const uniformesForestal = JSON.parse(localStorage.getItem('uniformesForestal') || '[]');
        const uniformesRescate = JSON.parse(localStorage.getItem('uniformesRescate') || '[]');
        const uniformesHazmat = JSON.parse(localStorage.getItem('uniformesHazmat') || '[]');
        const uniformesTenidaCuartel = JSON.parse(localStorage.getItem('uniformesTenidaCuartel') || '[]');
        const uniformesAccesorios = JSON.parse(localStorage.getItem('uniformesAccesorios') || '[]');
        const uniformesParada = JSON.parse(localStorage.getItem('uniformesParada') || '[]');
        const uniformesUsar = JSON.parse(localStorage.getItem('uniformesUsar') || '[]');
        const uniformesAgreste = JSON.parse(localStorage.getItem('uniformesAgreste') || '[]');
        const uniformesUm6 = JSON.parse(localStorage.getItem('uniformesUm6') || '[]');
        const uniformesGersa = JSON.parse(localStorage.getItem('uniformesGersa') || '[]');

        // Combinar y filtrar por bombero activos
        this.todosLosUniformes = [
            ...uniformesEstructural,
            ...uniformesForestal,
            ...uniformesRescate,
            ...uniformesHazmat,
            ...uniformesTenidaCuartel,
            ...uniformesAccesorios,
            ...uniformesParada,
            ...uniformesUsar,
            ...uniformesAgreste,
            ...uniformesUm6,
            ...uniformesGersa
        ].filter(u => parseInt(u.bomberoId) === idBuscado && u.estado === 'activo');

        return true;
    }

    generarTablaHTML() {
        if (!this.bombero) return '';

        // Obtener nombre completo con fallback
        const nombreCompleto = (typeof Utils !== 'undefined' && Utils.obtenerNombreCompleto) 
            ? Utils.obtenerNombreCompleto(this.bombero)
            : `${this.bombero.primerNombre} ${this.bombero.segundoNombre || ''} ${this.bombero.primerApellido} ${this.bombero.segundoApellido || ''}`.trim();
        
        let html = `
            <div class="modal-overlay" id="modalUniformesVoluntario" style="z-index: 10001;">
                <div class="modal-content" style="max-width: 1200px; max-height: 90vh; overflow-y: auto;">
                    <div class="modal-header" style="background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%); color: white;">
                        <h2 style="margin: 0;">👔 Uniformes de ${nombreCompleto}</h2>
                        <button class="modal-close" onclick="cerrarModalUniformes()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div style="margin-bottom: 20px;">
                            <p><strong>Clave:</strong> ${this.bombero.claveBombero}</p>
                            <p><strong>RUN:</strong> ${this.bombero.rut}</p>
                            <p><strong>Total de uniformes:</strong> ${this.todosLosUniformes.length}</p>
                        </div>`;

        if (this.todosLosUniformes.length === 0) {
            html += `
                        <div style="text-align: center; padding: 40px; background: #f5f5f5; border-radius: 8px; margin: 20px 0;">
                            <h3 style="color: #666;">📋 Sin Uniformes Registrados</h3>
                            <p style="color: #999;">Este voluntario no tiene uniformes asignados actualmente.</p>
                            <p style="color: #999; font-size: 14px; margin-top: 10px;">
                                Las tablas de uniformes aparecerán aquí una vez que se registre la primera entrega.
                            </p>
                        </div>
                        
                        <div style="margin-top: 30px;">
                            <h4 style="color: #666; margin-bottom: 15px;">📦 Tipos de Uniformes Disponibles:</h4>
                            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 15px;">
                                <div style="padding: 15px; background: #fff3e0; border-left: 4px solid #ff9800; border-radius: 4px;">
                                    <strong>🧯 Estructural</strong>
                                    <p style="font-size: 12px; color: #666; margin: 5px 0 0 0;">Jardinera, Chaqueta, Casco</p>
                                </div>
                                <div style="padding: 15px; background: #e8f5e9; border-left: 4px solid #4caf50; border-radius: 4px;">
                                    <strong>🌲 Forestal</strong>
                                    <p style="font-size: 12px; color: #666; margin: 5px 0 0 0;">Similar al estructural</p>
                                </div>
                                <div style="padding: 15px; background: #ffebee; border-left: 4px solid #f44336; border-radius: 4px;">
                                    <strong>🚑 Rescate</strong>
                                    <p style="font-size: 12px; color: #666; margin: 5px 0 0 0;">EPP de rescate</p>
                                </div>
                                <div style="padding: 15px; background: #fffde7; border-left: 4px solid #ffeb3b; border-radius: 4px;">
                                    <strong>☣️ Hazmat</strong>
                                    <p style="font-size: 12px; color: #666; margin: 5px 0 0 0;">Materiales peligrosos</p>
                                </div>
                                <div style="padding: 15px; background: #e3f2fd; border-left: 4px solid #2196f3; border-radius: 4px;">
                                    <strong>🏠 Tenida Cuartel</strong>
                                    <p style="font-size: 12px; color: #666; margin: 5px 0 0 0;">Polera, Polerón, Casaca</p>
                                </div>
                                <div style="padding: 15px; background: #f3e5f5; border-left: 4px solid #9c27b0; border-radius: 4px;">
                                    <strong>🎒 Accesorios</strong>
                                    <p style="font-size: 12px; color: #666; margin: 5px 0 0 0;">Radio, Linterna, Batería</p>
                                </div>
                                <div style="padding: 15px; background: #e8eaf6; border-left: 4px solid #3f51b5; border-radius: 4px;">
                                    <strong>🎖️ Parada</strong>
                                    <p style="font-size: 12px; color: #666; margin: 5px 0 0 0;">Casaca, Pantalón, Cinturón</p>
                                </div>
                                <div style="padding: 15px; background: #fbe9e7; border-left: 4px solid #ff5722; border-radius: 4px;">
                                    <strong>🚨 USAR</strong>
                                    <p style="font-size: 12px; color: #666; margin: 5px 0 0 0;">Urban Search & Rescue</p>
                                </div>
                                <div style="padding: 15px; background: #f1f8e9; border-left: 4px solid #8bc34a; border-radius: 4px;">
                                    <strong>🌾 AGRESTE</strong>
                                    <p style="font-size: 12px; color: #666; margin: 5px 0 0 0;">Materiales peligrosos</p>
                                </div>
                                <div style="padding: 15px; background: #e1f5fe; border-left: 4px solid #0096c7; border-radius: 4px;">
                                    <strong>⚓ UM-6</strong>
                                    <p style="font-size: 12px; color: #666; margin: 5px 0 0 0;">Marítimo, Salvavidas</p>
                                </div>
                                <div style="padding: 15px; background: #e0f7fa; border-left: 4px solid #00bcd4; border-radius: 4px;">
                                    <strong>🤿 GERSA</strong>
                                    <p style="font-size: 12px; color: #666; margin: 5px 0 0 0;">Buceo, Rescate Acuático</p>
                                </div>
                            </div>
                        </div>`;
        } else {
            // Agrupar por tipo
            const porTipo = this.agruparPorTipo();
            
            // Generar tabla para cada tipo
            for (const [tipo, uniformes] of Object.entries(porTipo)) {
                if (uniformes.length > 0) {
                    html += this.generarTablaDeUnTipo(tipo, uniformes);
                }
            }
        }

        html += `
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" onclick="cerrarModalUniformes()">Cerrar</button>
                    </div>
                </div>
            </div>`;

        return html;
    }

    agruparPorTipo() {
        const agrupados = {
            estructural: [],
            forestal: [],
            rescate: [],
            hazmat: [],
            tenidaCuartel: [],
            accesorios: [],
            parada: [],
            usar: [],
            agreste: [],
            um6: [],
            gersa: []
        };

        this.todosLosUniformes.forEach(u => {
            if (agrupados[u.tipoUniforme]) {
                agrupados[u.tipoUniforme].push(u);
            }
        });

        return agrupados;
    }

    generarTablaDeUnTipo(tipo, uniformes) {
        const configs = {
            estructural: { nombre: 'Estructural', emoji: '🧯', color: '#ff9800' },
            forestal: { nombre: 'Forestal', emoji: '🌲', color: '#4caf50' },
            rescate: { nombre: 'Rescate', emoji: '🚑', color: '#f44336' },
            hazmat: { nombre: 'Hazmat', emoji: '☣️', color: '#ffeb3b' },
            tenidaCuartel: { nombre: 'Tenida de Cuartel', emoji: '🏠', color: '#2196f3' },
            accesorios: { nombre: 'Accesorios', emoji: '🎒', color: '#9c27b0' },
            parada: { nombre: 'Parada', emoji: '🎖️', color: '#3f51b5' },
            usar: { nombre: 'USAR', emoji: '🚨', color: '#ff5722' },
            agreste: { nombre: 'AGRESTE', emoji: '🌾', color: '#8bc34a' },
            um6: { nombre: 'UM-6 (Marítimo)', emoji: '⚓', color: '#0096c7' },
            gersa: { nombre: 'GERSA (Buceo)', emoji: '🤿', color: '#00bcd4' }
        };

        const config = configs[tipo] || { nombre: tipo, emoji: '📦', color: '#607d8b' };
        
        let html = `
            <div class="tabla-uniforme-tipo" style="margin-bottom: 30px;">
                <h3 style="background: ${config.color}; color: white; padding: 10px 15px; border-radius: 8px 8px 0 0; margin: 0;">
                    ${config.emoji} EPP - Uniforme ${config.nombre}
                </h3>
                <table class="tabla-uniformes-detalle" style="width: 100%; border-collapse: collapse; border: 2px solid ${config.color};">
                    <thead style="background-color: ${config.color}30;">
                        <tr>`;

        // Encabezados según tipo
        if (tipo === 'estructural' || tipo === 'forestal' || tipo === 'rescate') {
            html += `
                            <th style="padding: 12px; text-align: left; border-bottom: 2px solid ${config.color};">Artículo</th>
                            <th style="padding: 12px; text-align: center; border-bottom: 2px solid ${config.color}; width: 70px;">Unidad</th>
                            <th style="padding: 12px; text-align: center; border-bottom: 2px solid ${config.color}; width: 80px;">Par/Simple</th>
                            <th style="padding: 12px; text-align: left; border-bottom: 2px solid ${config.color};">Marca/Modelo</th>
                            <th style="padding: 12px; text-align: left; border-bottom: 2px solid ${config.color};">N° Serie</th>
                            <th style="padding: 12px; text-align: left; border-bottom: 2px solid ${config.color};">Talla</th>`;
        } else if (tipo === 'accesorios') {
            html += `
                            <th style="padding: 12px; text-align: left; border-bottom: 2px solid ${config.color};">Artículo</th>
                            <th style="padding: 12px; text-align: center; border-bottom: 2px solid ${config.color}; width: 70px;">Unidad</th>
                            <th style="padding: 12px; text-align: center; border-bottom: 2px solid ${config.color}; width: 80px;">Par/Simple</th>
                            <th style="padding: 12px; text-align: left; border-bottom: 2px solid ${config.color};">N° Serie</th>
                            <th style="padding: 12px; text-align: center; border-bottom: 2px solid ${config.color};">-</th>`;
        } else {
            html += `
                            <th style="padding: 12px; text-align: left; border-bottom: 2px solid ${config.color};">Artículo</th>
                            <th style="padding: 12px; text-align: center; border-bottom: 2px solid ${config.color}; width: 70px;">Unidad</th>
                            <th style="padding: 12px; text-align: center; border-bottom: 2px solid ${config.color}; width: 80px;">Par/Simple</th>
                            <th style="padding: 12px; text-align: left; border-bottom: 2px solid ${config.color};">N° Serie</th>
                            <th style="padding: 12px; text-align: left; border-bottom: 2px solid ${config.color};">Talla</th>`;
        }

        html += `
                            <th style="padding: 12px; text-align: center; border-bottom: 2px solid ${config.color}; width: 100px;">Condición</th>
                            <th style="padding: 12px; text-align: center; border-bottom: 2px solid ${config.color}; width: 90px;">Estado</th>
                            <th style="padding: 12px; text-align: center; border-bottom: 2px solid ${config.color}; width: 100px;">F. Entrega</th>
                            <th style="padding: 12px; text-align: left; border-bottom: 2px solid ${config.color}; min-width: 130px;">Observaciones</th>
                        </tr>
                    </thead>
                    <tbody>`;

        // Generar filas según tipo - AHORA CON SISTEMA DE PIEZAS
        uniformes.forEach((uniforme, index) => {
            // Si el uniforme tiene piezas, mostrar cada pieza
            if (uniforme.piezas && uniforme.piezas.length > 0) {
                // ⭐ FILTRAR SOLO PIEZAS ACTIVAS (no devueltas)
                const piezasActivas = uniforme.piezas.filter(p => p.estadoPieza === 'activo');
                
                piezasActivas.forEach((pieza, piezaIndex) => {
                    const bgColor = (index + piezaIndex) % 2 === 0 ? '#ffffff' : '#f9f9f9';
                    html += `<tr style="background-color: ${bgColor};">`;
                    
                    const nombreComponente = pieza.nombrePersonalizado || this.formatComponente(pieza.componente, pieza);
                    const marca = pieza.marca || '-';
                    const serie = pieza.serie || '-';
                    const talla = pieza.talla || '-';
                    const unidad = pieza.unidad || '1';
                    const parSimple = pieza.parSimple || 'Simple';
                    
                    if (tipo === 'accesorios') {
                        html += `
                            <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${nombreComponente}</td>
                            <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; text-align: center;">${unidad}</td>
                            <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; text-align: center;">${parSimple}</td>
                            <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${serie}</td>
                            <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; text-align: center;">-</td>`;
                    } else if (tipo === 'estructural' || tipo === 'forestal' || tipo === 'rescate') {
                        html += `
                            <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${nombreComponente}</td>
                            <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; text-align: center;">${unidad}</td>
                            <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; text-align: center;">${parSimple}</td>
                            <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${marca}</td>
                            <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${serie}</td>
                            <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${talla}</td>`;
                    } else {
                        html += `
                            <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${nombreComponente}</td>
                            <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; text-align: center;">${unidad}</td>
                            <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; text-align: center;">${parSimple}</td>
                            <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${serie}</td>
                            <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${talla}</td>`;
                    }

                    // Condición y Estado de la pieza
                    const condicionClass = this.getCondicionClass(pieza.condicion);
                    const estadoClass = this.getEstadoClass(pieza.estadoFisico);
                    const fechaEntrega = pieza.fechaEntrega ? this.formatFecha(pieza.fechaEntrega) : '-';
                    
                    html += `
                        <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; text-align: center;">
                            <span class="badge-condicion ${condicionClass}">${this.formatCondicion(pieza.condicion)}</span>
                        </td>
                        <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; text-align: center;">
                            <span class="badge-estado ${estadoClass}">${this.formatEstado(pieza.estadoFisico)}</span>
                        </td>
                        <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; text-align: center; font-size: 14px;">
                            ${fechaEntrega}
                        </td>
                        <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; font-size: 13px; color: #555; max-width: 200px; overflow: hidden; text-overflow: ellipsis;">
                            ${piezaIndex === 0 ? (uniforme.observaciones || '-') : '-'}
                        </td>
                    </tr>`;
                });
            } else {
                // Uniformes legacy sin piezas (mostrar mensaje o datos antiguos si existen)
                const bgColor = index % 2 === 0 ? '#ffffff' : '#f9f9f9';
                html += `<tr style="background-color: ${bgColor};">
                    <td colspan="9" style="padding: 10px; border-bottom: 1px solid #e0e0e0; text-align: center; color: #999; font-style: italic;">
                        Uniforme registrado con formato anterior (sin piezas)
                    </td>
                </tr>`;
            }
        });

        html += `
                    </tbody>
                </table>
            </div>`;

        return html;
    }

    getCondicionClass(condicion) {
        const map = {
            'nuevo': 'condicion-nuevo',
            'semi-nuevo': 'condicion-semi-nuevo',
            'usado': 'condicion-usado'
        };
        return map[condicion] || '';
    }

    getEstadoClass(estado) {
        const map = {
            'bueno': 'estado-bueno',
            'regular': 'estado-regular',
            'malo': 'estado-malo',
            'buen_estado': 'estado-bueno',
            'mal_estado': 'estado-malo'
        };
        return map[estado] || '';
    }

    formatCondicion(condicion) {
        const map = {
            'nuevo': 'Nuevo',
            'semi-nuevo': 'Semi-Nuevo',
            'usado': 'Usado'
        };
        return map[condicion] || condicion;
    }

    formatEstado(estado) {
        const map = {
            'bueno': 'Bueno',
            'regular': 'Regular',
            'malo': 'Malo',
            'buen_estado': 'Bueno',
            'mal_estado': 'Malo'
        };
        return map[estado] || estado;
    }

    formatComponente(componente, uniforme = null) {
        if (!componente) return '-';
        
        // Si hay nombre personalizado, usarlo
        if (uniforme && uniforme.nombrePersonalizado) {
            return uniforme.nombrePersonalizado;
        }
        
        // Reemplazar guiones bajos por espacios
        let texto = componente.replace(/_/g, ' ');
        
        // Capitalizar primera letra de cada palabra
        texto = texto.split(' ')
            .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase())
            .join(' ');
        
        return texto;
    }

    formatTipoAccesorio(tipo, uniforme = null) {
        if (!tipo) return '-';
        
        // Si hay nombre personalizado, usarlo
        if (uniforme && uniforme.nombrePersonalizado) {
            return uniforme.nombrePersonalizado;
        }
        
        // Reemplazar guiones bajos por espacios
        let texto = tipo.replace(/_/g, ' ');
        
        // Capitalizar primera letra de cada palabra
        texto = texto.split(' ')
            .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase())
            .join(' ');
        
        return texto;
    }

    formatFecha(fecha) {
        if (!fecha) return '-';
        
        try {
            const date = new Date(fecha);
            const dia = String(date.getDate()).padStart(2, '0');
            const mes = String(date.getMonth() + 1).padStart(2, '0');
            const anio = date.getFullYear();
            
            return `${dia}/${mes}/${anio}`;
        } catch (error) {
            return '-';
        }
    }

    mostrar() {
        // Inyectar estilos si no existen
        if (!document.getElementById('estilos-tabla-uniformes')) {
            const estilos = document.createElement('style');
            estilos.id = 'estilos-tabla-uniformes';
            estilos.textContent = `
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.6);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 10001;
                }
                .modal-content {
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.3);
                    max-width: 1200px;
                    width: 95%;
                    max-height: 90vh;
                    overflow-y: auto;
                }
                .modal-header {
                    padding: 20px;
                    border-radius: 12px 12px 0 0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .modal-close {
                    background: none;
                    border: none;
                    font-size: 32px;
                    color: white;
                    cursor: pointer;
                    line-height: 1;
                    padding: 0;
                    width: 40px;
                    height: 40px;
                }
                .modal-close:hover {
                    transform: scale(1.2);
                }
                .modal-body {
                    padding: 20px;
                }
                .modal-footer {
                    padding: 15px 20px;
                    border-top: 1px solid #e0e0e0;
                    display: flex;
                    justify-content: flex-end;
                }
                .tabla-uniformes-detalle {
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }
                .badge-condicion, .badge-estado {
                    padding: 5px 12px;
                    border-radius: 12px;
                    font-weight: bold;
                    font-size: 12px;
                    display: inline-block;
                }
                .condicion-nuevo {
                    background-color: #4caf50;
                    color: white;
                }
                .condicion-semi-nuevo {
                    background-color: #ff9800;
                    color: white;
                }
                .condicion-usado {
                    background-color: #f44336;
                    color: white;
                }
                .estado-bueno {
                    background-color: #8bc34a;
                    color: white;
                }
                .estado-regular {
                    background-color: #ffc107;
                    color: white;
                }
                .estado-malo {
                    background-color: #d32f2f;
                    color: white;
                }
            `;
            document.head.appendChild(estilos);
        }

        // Inyectar HTML
        const modalHTML = this.generarTablaHTML();
        
        // Eliminar modal anterior si existe
        const modalAnterior = document.getElementById('modalUniformesVoluntario');
        if (modalAnterior) {
            modalAnterior.remove();
        }

        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
}

// Función global para abrir modal de uniformes
async function verUniformesVoluntario(bomberoId) {
    try {
        console.log('Abriendo tabla de uniformes para bombero ID:', bomberoId);
        const tabla = new TablaUniformesVoluntario(bomberoId);
        const exito = await tabla.cargarDatos();
        
        if (exito) {
            console.log('Mostrando modal con', tabla.todosLosUniformes.length, 'uniformes');
            tabla.mostrar();
        } else {
            console.error('No se pudieron cargar los datos del bombero');
        }
    } catch (error) {
        console.error('Error al abrir tabla de uniformes:', error);
        if (typeof Utils !== 'undefined' && Utils.mostrarNotificacion) {
            Utils.mostrarNotificacion('Error al cargar tabla de uniformes', 'error');
        } else {
            alert('Error al cargar tabla de uniformes: ' + error.message);
        }
    }
}

// Función global para cerrar modal
function cerrarModalUniformes() {
    const modal = document.getElementById('modalUniformesVoluntario');
    if (modal) {
        modal.remove();
    }
}
