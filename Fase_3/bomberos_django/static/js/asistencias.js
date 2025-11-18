// ==================== SISTEMA DE ASISTENCIAS A EMERGENCIAS ====================
class SistemaAsistencias {
    constructor() {
        this.bomberos = [];
        this.cargos = [];
        this.emergencias = [];
        this.participantesSeleccionados = [];
        this.canjesSeleccionados = [];
        
        // Cargar catálogo de externos con IDs únicos
        this.catalogoExternos = JSON.parse(localStorage.getItem('catalogoExternos')) || {
            participantes: {},  // { id: {id, nombre, totalAsistencias} }
            canjes: {}          // { id: {id, nombre, compania, totalAsistencias} }
        };
        // NO llamar init() automáticamente, las clases hijas lo harán
    }

    async cargarDatos() {
        try {
            // Cargar bomberos y cargos
            this.bomberos = storage.getBomberos();
            this.cargos = storage.getCargos();

            console.log('📊 Bomberos cargados:', this.bomberos.length);
            console.log('🎖️ Cargos cargados:', this.cargos.length);
        } catch (error) {
            console.error('❌ Error al cargar datos:', error);
            throw error;
        }
    }

    async init() {
        try {
            // Verificar autenticación
            if (typeof checkAuth !== 'undefined' && !checkAuth()) {
                window.location.href = 'index.html';
                return;
            }

            // Cargar datos
            await this.cargarDatos();

            // Establecer fecha y hora actual (SOLO para emergencias)
            const fechaEmergencia = document.getElementById('fechaEmergencia');
            const horaInicio = document.getElementById('horaInicio');
            
            if (fechaEmergencia && horaInicio) {
                const hoy = new Date();
                fechaEmergencia.valueAsDate = hoy;
                const horaActual = hoy.toTimeString().slice(0, 5);
                horaInicio.value = horaActual;
            }

            // Renderizar listas de voluntarios
            this.renderizarVoluntarios();

            // Cargar listas de externos
            this.cargarListasExternos();

            // Configurar eventos
            this.configurarEventos();

            // Actualizar estadísticas iniciales
            this.actualizarEstadisticas();

            console.log('✅ Sistema de asistencias inicializado correctamente');
        } catch (error) {
            console.error('❌ Error al inicializar sistema de asistencias:', error);
            alert('Error al cargar el sistema. Por favor recargue la página.');
        }
    }

    /**
     * Obtiene el cargo vigente del bombero para el año actual
     * @param {number} bomberoId - ID del bombero
     * @returns {object|null} - Objeto con el cargo o null
     */
    obtenerCargoVigente(bomberoId) {
        try {
            const anioActual = new Date().getFullYear();
            const fechaActual = new Date();
            // Resetear hora para comparar solo fechas
            fechaActual.setHours(0, 0, 0, 0);
            
            // Filtrar cargos del bombero
            const cargosBombero = this.cargos.filter(c => c.bomberoId == bomberoId);
            
            if (cargosBombero.length === 0) return null;
            
            // Buscar cargo vigente (por año y fechas)
            let cargoVigente = cargosBombero.find(cargo => {
                // ⚠️ VALIDACIÓN CRÍTICA: Si tiene fecha de término y ya pasó, NO ES VIGENTE
                if (cargo.fechaFinCargo) {
                    const fin = new Date(cargo.fechaFinCargo);
                    fin.setHours(23, 59, 59, 999); // Incluir todo el día final
                    if (fechaActual > fin) {
                        return false; // ❌ Cargo ya terminó
                    }
                }
                
                // Filtrar por año (solo si NO tiene fechas)
                if (cargo.añoCargo && !cargo.fechaInicioCargo && cargo.añoCargo != anioActual) {
                    return false;
                }
                
                // Si tiene fechas de inicio/fin, validar que esté dentro del período
                if (cargo.fechaInicioCargo && cargo.fechaFinCargo) {
                    const inicio = new Date(cargo.fechaInicioCargo);
                    inicio.setHours(0, 0, 0, 0);
                    const fin = new Date(cargo.fechaFinCargo);
                    fin.setHours(23, 59, 59, 999);
                    return fechaActual >= inicio && fechaActual <= fin;
                }
                
                // Si solo tiene fechaInicio, debe haber empezado
                if (cargo.fechaInicioCargo) {
                    const inicio = new Date(cargo.fechaInicioCargo);
                    inicio.setHours(0, 0, 0, 0);
                    return fechaActual >= inicio;
                }
                
                // Si solo tiene año, es vigente
                return true;
            });
            
            // Si no encontró por fechas, buscar el más reciente del año actual QUE NO HAYA TERMINADO
            if (!cargoVigente) {
                const cargosAnioActual = cargosBombero.filter(c => {
                    // ⚠️ VALIDACIÓN CRÍTICA: Si tiene fecha de término y ya pasó, NO ES VIGENTE
                    if (c.fechaFinCargo) {
                        const fin = new Date(c.fechaFinCargo);
                        fin.setHours(23, 59, 59, 999);
                        if (fechaActual > fin) {
                            return false; // ❌ Cargo ya terminó
                        }
                    }
                    
                    // Filtrar por año actual
                    const esDelAnio = c.añoCargo == anioActual || 
                        (c.fechaInicioCargo && new Date(c.fechaInicioCargo).getFullYear() == anioActual);
                    
                    return esDelAnio;
                });
                
                if (cargosAnioActual.length > 0) {
                    // Ordenar por fecha de inicio más reciente
                    cargosAnioActual.sort((a, b) => {
                        const fechaA = a.fechaInicioCargo ? new Date(a.fechaInicioCargo) : new Date(a.añoCargo, 0, 1);
                        const fechaB = b.fechaInicioCargo ? new Date(b.fechaInicioCargo) : new Date(b.añoCargo, 0, 1);
                        return fechaB - fechaA;
                    });
                    cargoVigente = cargosAnioActual[0];
                }
            }
            
            return cargoVigente;
        } catch (error) {
            console.error('Error al obtener cargo vigente:', error);
            return null;
        }
    }

    /**
     * Genera ID único para externos
     */
    generarIdExterno(tipo) {
        return `${tipo}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Cargar listas de externos en los datalists
     */
    cargarListasExternos() {
        const datalistParticipantes = document.getElementById('listaParticipantes');
        if (datalistParticipantes) {
            datalistParticipantes.innerHTML = '';
            Object.values(this.catalogoExternos.participantes).forEach(p => {
                const option = document.createElement('option');
                option.value = p.nombre;
                option.dataset.id = p.id;
                datalistParticipantes.appendChild(option);
            });
        }

        const datalistCanjes = document.getElementById('listaCanjes');
        if (datalistCanjes) {
            datalistCanjes.innerHTML = '';
            Object.values(this.catalogoExternos.canjes).forEach(c => {
                const option = document.createElement('option');
                option.value = c.nombre;
                option.dataset.id = c.id;
                datalistCanjes.appendChild(option);
            });
        }
    }

    /**
     * Agregar participante
     */
    agregarParticipante() {
        const input = document.getElementById('inputParticipante');
        const nombre = input.value.trim();
        if (!nombre) {
            Utils.mostrarNotificacion('Ingrese el nombre del voluntario participante', 'error');
            return;
        }

        // Buscar si ya existe en el catálogo
        let externo = Object.values(this.catalogoExternos.participantes).find(p => p.nombre === nombre);
        
        if (!externo) {
            // Crear nuevo con ID único
            const nuevoId = this.generarIdExterno('part');
            externo = {
                id: nuevoId,
                nombre: nombre,
                tipo: 'participante',
                totalAsistencias: 0,
                fechaRegistro: new Date().toISOString()
            };
            this.catalogoExternos.participantes[nuevoId] = externo;
            localStorage.setItem('catalogoExternos', JSON.stringify(this.catalogoExternos));
            this.cargarListasExternos();
        }

        this.participantesSeleccionados.push(externo);
        input.value = '';
        this.renderizarExternos();
        this.actualizarEstadisticasConExternos();
    }

    /**
     * Agregar canje
     */
    agregarCanje() {
        const input = document.getElementById('inputCanje');
        const nombre = input.value.trim();
        if (!nombre) {
            Utils.mostrarNotificacion('Ingrese el nombre y compañía del voluntario canje', 'error');
            return;
        }

        // Buscar si ya existe en el catálogo
        let externo = Object.values(this.catalogoExternos.canjes).find(c => c.nombre === nombre);
        
        if (!externo) {
            // Crear nuevo con ID único
            const nuevoId = this.generarIdExterno('canje');
            externo = {
                id: nuevoId,
                nombre: nombre,
                tipo: 'canje',
                totalAsistencias: 0,
                fechaRegistro: new Date().toISOString()
            };
            this.catalogoExternos.canjes[nuevoId] = externo;
            localStorage.setItem('catalogoExternos', JSON.stringify(this.catalogoExternos));
            this.cargarListasExternos();
        }

        this.canjesSeleccionados.push(externo);
        input.value = '';
        this.renderizarExternos();
        this.actualizarEstadisticasConExternos();
    }

    /**
     * Eliminar participante
     */
    eliminarParticipante(index) {
        this.participantesSeleccionados.splice(index, 1);
        this.renderizarExternos();
        this.actualizarEstadisticasConExternos();
    }

    /**
     * Eliminar canje
     */
    eliminarCanje(index) {
        this.canjesSeleccionados.splice(index, 1);
        this.renderizarExternos();
        this.actualizarEstadisticasConExternos();
    }

    /**
     * Renderizar externos en UI
     */
    renderizarExternos() {
        const contenedorParticipantes = document.getElementById('participantesSeleccionados');
        if (contenedorParticipantes) {
            contenedorParticipantes.innerHTML = this.participantesSeleccionados.map((ext, index) => 
                `<div class="externo-item">
                    <div>
                        <span class="externo-nombre">${ext.nombre}</span>
                        <span class="externo-tipo">Participante</span>
                    </div>
                    <button class="btn-eliminar-externo" onclick="asistencias.eliminarParticipante(${index})">✕</button>
                </div>`
            ).join('');
        }

        const contenedorCanjes = document.getElementById('canjesSeleccionados');
        if (contenedorCanjes) {
            contenedorCanjes.innerHTML = this.canjesSeleccionados.map((ext, index) =>
                `<div class="externo-item">
                    <div>
                        <span class="externo-nombre">${ext.nombre}</span>
                        <span class="externo-tipo">Canje</span>
                    </div>
                    <button class="btn-eliminar-externo" onclick="asistencias.eliminarCanje(${index})">✕</button>
                </div>`
            ).join('');
        }
    }

    /**
     * Actualizar estadísticas incluyendo externos
     */
    actualizarEstadisticasConExternos() {
        const checkboxes = document.querySelectorAll('input[type="checkbox"]:checked');
        let oficialesComandancia = 0, oficialesCompania = 0, cargosConfianza = 0, voluntarios = 0;

        checkboxes.forEach(checkbox => {
            const bomberoId = parseInt(checkbox.dataset.bomberoId);
            const bombero = this.bomberos.find(b => b.id == bomberoId);
            const cargoVigente = this.obtenerCargoVigente(bomberoId);

            if (bombero.estadoBombero === 'martir') {
                voluntarios++;
            } else if (cargoVigente) {
                if (this.esCargoComandancia(cargoVigente.tipoCargo)) oficialesComandancia++;
                else if (this.esCargoOficialCompania(cargoVigente.tipoCargo)) oficialesCompania++;
                else if (this.esCargoConfianza(cargoVigente.tipoCargo)) cargosConfianza++;
                else voluntarios++;
            } else {
                voluntarios++;
            }
        });

        const totalOficiales = oficialesComandancia + oficialesCompania;
        const totalConExternos = checkboxes.length + this.participantesSeleccionados.length + this.canjesSeleccionados.length;

        // Actualizar UI si existen los elementos
        const elemTotal = document.getElementById('resumenTotal');
        const elemOficiales = document.getElementById('resumenOficiales');
        const elemComandancia = document.getElementById('resumenComandancia');
        const elemCompania = document.getElementById('resumenCompania');
        const elemConfianza = document.getElementById('resumenConfianza');
        const elemVoluntarios = document.getElementById('resumenVoluntarios');

        if (elemTotal) elemTotal.textContent = totalConExternos;
        if (elemOficiales) elemOficiales.textContent = totalOficiales;
        if (elemComandancia) elemComandancia.textContent = oficialesComandancia;
        if (elemCompania) elemCompania.textContent = oficialesCompania;
        if (elemConfianza) elemConfianza.textContent = cargosConfianza;
        if (elemVoluntarios) elemVoluntarios.textContent = voluntarios + this.participantesSeleccionados.length + this.canjesSeleccionados.length;
    }

    /**
     * Actualiza el ranking de asistencias de los voluntarios
     * @param {Array} asistentes - Array de asistentes
     * @param {string} tipoAsistencia - Tipo de asistencia
     */
    actualizarRankingAsistencias(asistentes, tipoAsistencia) {
        try {
            const anioActual = new Date().getFullYear();
            let ranking = JSON.parse(localStorage.getItem('rankingAsistencias')) || {};
            
            if (!ranking[anioActual]) {
                ranking[anioActual] = {};
            }

            asistentes.forEach(asistente => {
                // Solo contar asistentes con bomberoId (voluntarios regulares)
                // EXCLUIR MÁRTIRES: Los mártires se registran pero NO cuentan en el ranking
                if (asistente.bomberoId) {
                    // Verificar si es mártir
                    const bombero = this.bomberos.find(b => b.id == asistente.bomberoId);
                    const esMartir = bombero && bombero.estadoBombero === 'martir';
                    
                    // Si es mártir, saltar (no contar en ranking)
                    if (esMartir) {
                        console.log(`⚪ Mártir excluido del ranking: ${asistente.nombre}`);
                        return; // No actualizar ranking para mártires
                    }
                    
                    const id = asistente.bomberoId;
                    
                    if (!ranking[anioActual][id]) {
                        ranking[anioActual][id] = {
                            nombre: asistente.nombre,
                            claveBombero: asistente.claveBombero,
                            total: 0,
                            emergencias: 0,
                            asambleas: 0,
                            ejercicios: 0,
                            citaciones: 0,
                            otras: 0
                        };
                    }
                    
                    ranking[anioActual][id].total++;
                    
                    switch(tipoAsistencia) {
                        case 'emergencia':
                            ranking[anioActual][id].emergencias++;
                            break;
                        case 'asamblea':
                            ranking[anioActual][id].asambleas++;
                            break;
                        case 'ejercicios':
                            ranking[anioActual][id].ejercicios++;
                            break;
                        case 'citaciones':
                            ranking[anioActual][id].citaciones++;
                            break;
                        case 'otras':
                            ranking[anioActual][id].otras++;
                            break;
                    }
                }
                // Ranking separado para externos usando ID único
                else if (asistente.esExterno && asistente.externoId) {
                    const tipoExterno = asistente.tipoExterno === 'participante' ? 'participantes' : 'canjes';
                    const keyExterno = `externos_${tipoExterno}`;
                    
                    if (!ranking[anioActual][keyExterno]) {
                        ranking[anioActual][keyExterno] = {};
                    }
                    
                    if (!ranking[anioActual][keyExterno][asistente.externoId]) {
                        ranking[anioActual][keyExterno][asistente.externoId] = {
                            id: asistente.externoId,
                            nombre: asistente.nombre,
                            total: 0,
                            emergencias: 0,
                            asambleas: 0,
                            ejercicios: 0,
                            citaciones: 0,
                            otras: 0,
                            tipo: asistente.tipoExterno
                        };
                    }
                    
                    ranking[anioActual][keyExterno][asistente.externoId].total++;
                    
                    // Incrementar por tipo
                    switch(tipoAsistencia) {
                        case 'emergencia':
                            ranking[anioActual][keyExterno][asistente.externoId].emergencias++;
                            break;
                        case 'asamblea':
                            ranking[anioActual][keyExterno][asistente.externoId].asambleas++;
                            break;
                        case 'ejercicios':
                            ranking[anioActual][keyExterno][asistente.externoId].ejercicios++;
                            break;
                        case 'citaciones':
                            ranking[anioActual][keyExterno][asistente.externoId].citaciones++;
                            break;
                        case 'otras':
                            ranking[anioActual][keyExterno][asistente.externoId].otras++;
                            break;
                    }
                    
                    // Actualizar total en catálogo
                    if (asistente.tipoExterno === 'participante' && this.catalogoExternos.participantes[asistente.externoId]) {
                        this.catalogoExternos.participantes[asistente.externoId].totalAsistencias++;
                    } else if (asistente.tipoExterno === 'canje' && this.catalogoExternos.canjes[asistente.externoId]) {
                        this.catalogoExternos.canjes[asistente.externoId].totalAsistencias++;
                    }
                    localStorage.setItem('catalogoExternos', JSON.stringify(this.catalogoExternos));
                }
            });

            localStorage.setItem('rankingAsistencias', JSON.stringify(ranking));
            console.log('✅ Ranking de asistencias actualizado');
        } catch (error) {
            console.error('Error al actualizar ranking:', error);
        }
    }

    /**
     * Determina si un cargo es de oficialidad de compañía
     * @param {string} tipoCargo - Tipo del cargo
     * @returns {boolean}
     */
    esCargoOficialCompania(tipoCargo) {
        if (!tipoCargo) return false;
        
        const cargosOficialidad = [
            'Capitán',
            'Director',
            'Secretario',
            'Tesorero',
            'Capellán',
            'Intendente',
            'Teniente Primero',
            'Teniente Segundo', 
            'Teniente Tercero',
            'Teniente Cuarto'
        ];
        
        return cargosOficialidad.includes(tipoCargo);
    }
    
    /**
     * Determina si un cargo es de confianza
     * @param {string} tipoCargo - Tipo del cargo
     * @returns {boolean}
     */
    esCargoConfianza(tipoCargo) {
        if (!tipoCargo) return false;
        
        const cargosConfianza = [
            'Jefe de Máquinas',
            'Maquinista 1°',
            'Maquinista 2°',
            'Maquinista 3°',
            'Ayudante',
            'Ayudante 1°',
            'Ayudante 2°',
            'Ayudante 3°'
        ];
        
        return cargosConfianza.includes(tipoCargo);
    }

    /**
     * Determina si un cargo es de comandancia/general
     * @param {string} tipoCargo - Tipo del cargo
     * @returns {boolean}
     */
    esCargoComandancia(tipoCargo) {
        if (!tipoCargo) return false;
        
        const cargosComandancia = [
            'Superintendente',
            'Comandante 1',
            'Comandante 2',
            'Comandante 3',
            'Intendente General',
            'Tesorero General',
            'Secretario General',
            'Ayudante General'
        ];
        
        return cargosComandancia.includes(tipoCargo);
    }

    /**
     * Formatea el cargo para mostrar
     * @param {object} cargo - Objeto del cargo
     * @returns {string} - HTML del cargo formateado
     */
    formatearCargo(cargo) {
        if (!cargo || !cargo.tipoCargo) return '';
        
        // Definir iconos según tipo de cargo
        const iconosCargos = {
            // Comandancia
            'Superintendente': '⭐⭐⭐',
            'Comandante 1': '⭐⭐',
            'Comandante 2': '⭐⭐',
            'Comandante 3': '⭐⭐',
            'Intendente General': '🎖️',
            'Tesorero General': '💰',
            'Secretario General': '📋',
            'Ayudante General': '🎯',
            
            // Compañía
            'Capitán': '👨‍🚒',
            'Teniente Primero': '🔰',
            'Teniente Segundo': '🔰',
            'Teniente Tercero': '🔰',
            'Teniente Cuarto': '🔰',
            'Ayudante': '🎯',
            'Ayudante 1': '🎯',
            'Ayudante 2': '🎯',
            'Ayudante 3': '🎯',
            'Ayudante 4': '🎯',
            'Cabo Primero': '📌',
            'Cabo Segundo': '📌',
            'Cabo': '📌',
            
            // Maquinistas
            'Jefe de Máquinas': '🔧',
            'Primer Maquinista': '⚙️',
            'Segundo Maquinista': '⚙️',
            'Tercer Maquinista': '⚙️',
            
            // Otros cargos administrativos
            'Director': '🎖️',
            'Tesorero': '💰',
            'Intendente': '📊',
            'Secretario': '📝',
            
            'Otro': '🔹'
        };
        
        const icono = iconosCargos[cargo.tipoCargo] || '🎖️';
        const año = cargo.añoCargo || new Date().getFullYear();
        
        return `
            <div class="voluntario-cargo">
                ${icono} ${cargo.tipoCargo} | ${año}
            </div>
        `;
    }

    renderizarVoluntarios() {
        try {
            // Filtrar bomberos activos y mártires (excluir inactivos)
            const bomberosActivos = this.bomberos.filter(b => 
                b.estadoBombero !== 'Dado de Baja' && 
                b.estadoBombero !== 'inactivo'
            );

            // Crear arrays para cada categoría
            const martires = [];
            const oficialesComandancia = [];
            const oficialesCompania = [];
            const cargosConfianza = [];
            const insignes = [];
            const honorariosCuerpo = [];
            const honorariosCia = [];
            const voluntarios = [];
            
            bomberosActivos.forEach(bombero => {
                const cargoVigente = this.obtenerCargoVigente(bombero.id);
                const categoria = Utils.calcularCategoriaBombero(bombero.fechaIngreso);
                
                // 1. Mártires (prioridad máxima)
                if (bombero.estadoBombero === 'martir') {
                    martires.push(bombero);
                }
                // 2. Oficiales de Comandancia
                else if (cargoVigente && this.esCargoComandancia(cargoVigente.tipoCargo)) {
                    oficialesComandancia.push(bombero);
                }
                // 3. Oficiales de Compañía
                else if (cargoVigente && this.esCargoOficialCompania(cargoVigente.tipoCargo)) {
                    oficialesCompania.push(bombero);
                }
                // 4. Cargos de Confianza
                else if (cargoVigente && this.esCargoConfianza(cargoVigente.tipoCargo)) {
                    cargosConfianza.push(bombero);
                }
                // 5. Voluntarios Insignes (50+ años)
                else if (categoria.categoria === 'Voluntario Insigne de Chile') {
                    insignes.push(bombero);
                }
                // 6. Honorarios del Cuerpo (25-49 años)
                else if (categoria.categoria === 'Voluntario Honorario del Cuerpo') {
                    honorariosCuerpo.push(bombero);
                }
                // 7. Honorarios de Compañía (20-24 años)
                else if (categoria.categoria === 'Voluntario Honorario de Compañía') {
                    honorariosCia.push(bombero);
                }
                // 8. Voluntarios (<20 años)
                else {
                    voluntarios.push(bombero);
                }
            });

            console.log('✅ Clasificación completada:');
            console.log('  - Mártires:', martires.length);
            console.log('  - Oficiales Comandancia:', oficialesComandancia.length);
            console.log('  - Oficiales Compañía:', oficialesCompania.length);
            console.log('  - Cargos de Confianza:', cargosConfianza.length);
            console.log('  - Insignes:', insignes.length);
            console.log('  - Honorarios Cuerpo:', honorariosCuerpo.length);
            console.log('  - Honorarios Cía:', honorariosCia.length);
            console.log('  - Voluntarios:', voluntarios.length);

            // Renderizar cada categoría
            this.renderizarCategoria('listaMartires', martires, 'martir');
            this.renderizarCategoria('listaGenerales', oficialesComandancia, 'comandancia');
            this.renderizarCategoria('listaCompania', oficialesCompania, 'compania');
            this.renderizarCategoria('listaCargosConfianza', cargosConfianza, 'confianza');
            this.renderizarCategoria('listaInsignes', insignes, 'insigne');
            this.renderizarCategoria('listaHonorariosCuerpo', honorariosCuerpo, 'honorarioCuerpo');
            this.renderizarCategoria('listaHonorariosCia', honorariosCia, 'honorarioCia');
            this.renderizarCategoria('listaVoluntarios', voluntarios, 'voluntario');
        } catch (error) {
            console.error('❌ Error al renderizar voluntarios:', error);
        }
    }

    renderizarCategoria(containerId, bomberos, tipo) {
        const container = document.getElementById(containerId);
        
        if (!container) {
            console.warn(`⚠️ Contenedor ${containerId} no encontrado`);
            return;
        }
        
        if (bomberos.length === 0) {
            container.innerHTML = '<p style="color: #999; text-align: center; padding: 20px;">No hay voluntarios en esta categoría</p>';
            return;
        }

        // Ordenar por apellido y nombre
        bomberos.sort((a, b) => {
            const nombreA = `${a.primerApellido || ''} ${a.segundoApellido || ''} ${a.primerNombre || ''}`.trim();
            const nombreB = `${b.primerApellido || ''} ${b.segundoApellido || ''} ${b.primerNombre || ''}`.trim();
            return nombreA.localeCompare(nombreB);
        });

        container.innerHTML = bomberos.map(bombero => {
            // Obtener cargo vigente
            const cargoVigente = this.obtenerCargoVigente(bombero.id);
            const htmlCargo = this.formatearCargo(cargoVigente);
            
            return `
                <div class="voluntario-item" onclick="this.querySelector('input').click()">
                    <input 
                        type="checkbox" 
                        id="bombero_${bombero.id}" 
                        data-bombero-id="${bombero.id}"
                        data-tipo="${tipo}"
                        onchange="asistencias.actualizarEstadisticas()"
                        onclick="event.stopPropagation()">
                    <div class="voluntario-info">
                        <div class="voluntario-nombre">${Utils.obtenerNombreCompleto(bombero)}</div>
                        ${htmlCargo}
                        <div class="voluntario-clave">${bombero.claveBombero}</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    configurarEventos() {
        // Evento para actualizar estadísticas en tiempo real
        document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', () => this.actualizarEstadisticas());
        });
    }

    actualizarEstadisticas() {
        try {
            // Si existen los elementos de resumen detallado, usar esa función
            if (document.getElementById('resumenTotal')) {
                this.actualizarEstadisticasConExternos();
                return;
            }

            // Sino, usar estadísticas básicas
            const totalPersonas = this.bomberos.filter(b => b.estadoBombero !== 'Dado de Baja').length;
            const asistentes = document.querySelectorAll('input[type="checkbox"]:checked').length;
            
            // Incluir externos en el conteo
            const totalExternos = (this.participantesSeleccionados ? this.participantesSeleccionados.length : 0) + 
                                 (this.canjesSeleccionados ? this.canjesSeleccionados.length : 0);
            const totalConExternos = asistentes + totalExternos;
            
            const porcentaje = totalPersonas > 0 ? Math.round((totalConExternos / totalPersonas) * 100) : 0;

            const elemTotalPersonas = document.getElementById('totalPersonas');
            const elemTotalAsistentes = document.getElementById('totalAsistentes');
            const elemPorcentaje = document.getElementById('porcentajeAsistencia');
            
            if (elemTotalPersonas) elemTotalPersonas.textContent = totalPersonas;
            if (elemTotalAsistentes) elemTotalAsistentes.textContent = totalConExternos;
            if (elemPorcentaje) elemPorcentaje.textContent = porcentaje + '%';
        } catch (error) {
            console.error('Error al actualizar estadísticas:', error);
        }
    }

    seleccionarTodos(tipo) {
        const checkboxes = document.querySelectorAll(`input[data-tipo="${tipo}"]`);
        checkboxes.forEach(checkbox => checkbox.checked = true);
        this.actualizarEstadisticas();
    }

    deseleccionarTodos(tipo) {
        const checkboxes = document.querySelectorAll(`input[data-tipo="${tipo}"]`);
        checkboxes.forEach(checkbox => checkbox.checked = false);
        this.actualizarEstadisticas();
    }

    mostrarNotificacion(mensaje, tipo) {
        // Intentar usar Utils si existe
        if (typeof Utils !== 'undefined' && Utils.mostrarNotificacion) {
            Utils.mostrarNotificacion(mensaje, tipo);
        } else {
            // Fallback a alert
            alert(mensaje);
        }
        console.log(`📢 ${tipo.toUpperCase()}: ${mensaje}`);
    }

    obtenerUsuarioActual() {
        // Intentar obtener usuario de diferentes formas
        if (typeof getCurrentUser === 'function') {
            try {
                const user = getCurrentUser();
                return user ? user.username : 'Sistema';
            } catch (error) {
                console.warn('Error al obtener usuario:', error);
            }
        }
        
        // Intentar de localStorage directamente
        try {
            const user = JSON.parse(localStorage.getItem('currentUser'));
            return user ? user.username : 'Sistema';
        } catch (error) {
            return 'Sistema';
        }
    }

    guardarRegistro() {
        try {
            console.log('🔄 Iniciando guardado de registro...');

            // Validar campos requeridos
            const fecha = document.getElementById('fechaEmergencia').value;
            const horaInicio = document.getElementById('horaInicio').value;
            const horaTermino = document.getElementById('horaTermino').value;
            const direccion = document.getElementById('direccionEmergencia').value;
            const claveEmergencia = document.getElementById('claveEmergencia').value;

            console.log('📋 Datos del formulario:', { fecha, horaInicio, horaTermino, direccion, claveEmergencia });

            if (!fecha || !horaInicio || !horaTermino || !direccion || !claveEmergencia) {
                this.mostrarNotificacion('Por favor complete todos los campos obligatorios', 'error');
                return;
            }

            // Obtener asistentes
            const checkboxes = document.querySelectorAll('input[type="checkbox"]:checked');
            
            console.log('👥 Checkboxes marcados:', checkboxes.length);

            if (checkboxes.length === 0) {
                this.mostrarNotificacion('Debe seleccionar al menos un asistente', 'error');
                return;
            }

            const asistentes = Array.from(checkboxes).map(cb => {
                const bomberoId = cb.dataset.bomberoId;
                const bombero = this.bomberos.find(b => b.id == bomberoId);
                
                if (!bombero) {
                    console.warn('⚠️ Bombero no encontrado:', bomberoId);
                    return null;
                }
                
                // Obtener cargo vigente del bombero
                const cargoVigente = this.obtenerCargoVigente(bomberoId);
                
                // Determinar categoría basada en estado y cargo
                let categoria = 'Voluntario';
                if (bombero.estadoBombero === 'martir') {
                    categoria = 'Voluntario Mártir';
                } else if (cargoVigente) {
                    if (this.esCargoComandancia(cargoVigente.tipoCargo)) {
                        categoria = 'Oficial de Comandancia';
                    } else if (this.esCargoOficialCompania(cargoVigente.tipoCargo)) {
                        categoria = 'Oficial de Compañía';
                    } else if (this.esCargoConfianza(cargoVigente.tipoCargo)) {
                        categoria = 'Cargo de Confianza';
                    }
                }
                
                return {
                    bomberoId: bomberoId,
                    nombre: Utils.obtenerNombreCompleto(bombero),
                    claveBombero: bombero.claveBombero,
                    categoria: categoria,
                    cargo: cargoVigente ? cargoVigente.tipoCargo : null,
                    añoCargo: cargoVigente ? cargoVigente.añoCargo : null
                };
            }).filter(a => a !== null);

            console.log('✅ Asistentes procesados:', asistentes.length);

            // Calcular estadísticas por categoría
            const oficialesComandancia = asistentes.filter(a => a.categoria === 'Oficial de Comandancia').length;
            const oficialesCompania = asistentes.filter(a => a.categoria === 'Oficial de Compañía').length;
            const cargosConfianza = asistentes.filter(a => a.categoria === 'Cargo de Confianza').length;
            const totalOficiales = oficialesComandancia + oficialesCompania;
            const voluntariosRegulares = asistentes.filter(a => 
                a.categoria !== 'Oficial de Comandancia' && 
                a.categoria !== 'Oficial de Compañía' && 
                a.categoria !== 'Cargo de Confianza'
            ).length;

            // Crear registro de asistencia
            const registro = {
                id: Date.now(),
                tipo: 'emergencia',
                fecha: fecha,
                horaInicio: horaInicio,
                horaTermino: horaTermino,
                claveEmergencia: claveEmergencia,
                direccion: direccion,
                descripcion: direccion + (document.getElementById('observaciones')?.value ? ' - ' + document.getElementById('observaciones').value : ''),
                observaciones: document.getElementById('observaciones')?.value || '',
                asistentes: asistentes,
                totalAsistentes: asistentes.length,
                oficialesComandancia: oficialesComandancia,
                oficialesCompania: oficialesCompania,
                totalOficiales: totalOficiales,
                cargosConfianza: cargosConfianza,
                voluntarios: voluntariosRegulares,
                participantes: 0,
                canjes: 0,
                totalPersonas: this.bomberos.filter(b => b.estadoBombero !== 'Dado de Baja').length,
                porcentajeAsistencia: Math.round((asistentes.length / this.bomberos.filter(b => b.estadoBombero !== 'Dado de Baja').length) * 100),
                registradoPor: this.obtenerUsuarioActual(),
                fechaRegistro: new Date().toISOString()
            };

            console.log('📦 Registro creado:', registro);

            // Guardar en localStorage
            this.guardarEnStorage(registro);

            console.log('💾 Registro guardado en localStorage');

            this.mostrarNotificacion('✅ Registro de asistencia guardado exitosamente', 'success');

            // Preguntar si desea agregar otra asistencia
            setTimeout(() => {
                if (confirm('¿Desea registrar otra emergencia?')) {
                    this.limpiarFormulario();
                } else {
                    // Verificar si existe la página de historial
                    if (document.querySelector('a[href*="historial"]')) {
                        window.location.href = 'historial-asistencias.html';
                    } else {
                        this.limpiarFormulario();
                        this.mostrarNotificacion('Registro guardado. Puede ver el historial en el menú principal.', 'info');
                    }
                }
            }, 1000);

        } catch (error) {
            console.error('❌ ERROR al guardar registro:', error);
            alert('Error al guardar el registro: ' + error.message);
        }
    }

    guardarEnStorage(registro) {
        try {
            // Guardar en el array común de asistencias
            let asistencias = JSON.parse(localStorage.getItem('asistencias')) || [];
            
            // Asegurar que tiene el tipo='emergencia' (no sobreescribir si ya tiene tipo)
            if (!registro.tipo) {
                registro.tipo = 'emergencia';
            }
            
            // Agregar voluntarios externos al array de asistentes (solo si existen)
            if (this.participantesSeleccionados && this.participantesSeleccionados.length > 0) {
                this.participantesSeleccionados.forEach(externo => {
                    registro.asistentes.push({
                        bomberoId: null,
                        nombre: externo.nombre,
                        externoId: externo.id,
                        claveBombero: null,
                        categoria: 'Voluntario Participante',
                        cargo: null,
                        esExterno: true,
                        tipoExterno: 'participante'
                    });
                });
                
                // Actualizar contador de participantes
                registro.participantes = this.participantesSeleccionados.length;
            }
            
            if (this.canjesSeleccionados && this.canjesSeleccionados.length > 0) {
                this.canjesSeleccionados.forEach(externo => {
                    registro.asistentes.push({
                        bomberoId: null,
                        nombre: externo.nombre,
                        externoId: externo.id,
                        claveBombero: null,
                        categoria: 'Voluntario Canje',
                        cargo: null,
                        esExterno: true,
                        tipoExterno: 'canje'
                    });
                });
                
                // Actualizar contador de canjes
                registro.canjes = this.canjesSeleccionados.length;
            }
            
            // Actualizar total de asistentes (incluyendo externos)
            registro.totalAsistentes = registro.asistentes.length;
            
            // Recalcular voluntarios si se agregaron externos
            if ((this.participantesSeleccionados && this.participantesSeleccionados.length > 0) || 
                (this.canjesSeleccionados && this.canjesSeleccionados.length > 0)) {
                const externosCount = (registro.participantes || 0) + (registro.canjes || 0);
                registro.voluntarios = (registro.voluntarios || 0) + externosCount;
            }
            
            asistencias.push(registro);
            localStorage.setItem('asistencias', JSON.stringify(asistencias));
            
            // Actualizar ranking
            this.actualizarRankingAsistencias(registro.asistentes, 'emergencia');
            
            console.log('✅ Guardado exitoso. Total asistencias:', asistencias.length);
            console.log('📊 Registro completo:', registro);
        } catch (error) {
            console.error('❌ Error al guardar en localStorage:', error);
            throw error;
        }
    }

    limpiarFormulario() {
        try {
            // Limpiar campos
            document.getElementById('claveEmergencia').value = '';
            document.getElementById('direccionEmergencia').value = '';
            if (document.getElementById('observaciones')) {
                document.getElementById('observaciones').value = '';
            }

            // Establecer fecha y hora actual
            const hoy = new Date();
            document.getElementById('fechaEmergencia').valueAsDate = hoy;
            document.getElementById('horaInicio').value = hoy.toTimeString().slice(0, 5);
            document.getElementById('horaTermino').value = '';

            // Desmarcar todos los checkboxes
            document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);

            // Actualizar estadísticas
            this.actualizarEstadisticas();

            // Scroll al inicio
            window.scrollTo(0, 0);

            console.log('🧹 Formulario limpiado');
        } catch (error) {
            console.error('Error al limpiar formulario:', error);
        }
    }
}

// Inicializar cuando cargue la página (SOLO para registro-asistencia.html - emergencias)
if (document.getElementById('fechaEmergencia')) {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('🚀 Iniciando Sistema de Asistencias (Emergencias)...');
        window.asistencias = new SistemaAsistencias();
        window.asistencias.init();
    });
}