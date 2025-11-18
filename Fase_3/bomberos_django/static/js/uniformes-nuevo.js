// ==================== SISTEMA DE UNIFORMES INDEPENDIENTES ====================
// Cada tipo de uniforme tiene su propio sistema de IDs y almacenamiento
class SistemaUniformes {
    constructor() {
        this.bomberoActual = null;
        // Almacenamiento separado por tipo
        this.uniformesEstructural = [];
        this.uniformesForestal = [];
        this.uniformesRescate = [];
        this.uniformesHazmat = [];
        this.uniformesTenidaCuartel = [];
        this.uniformesAccesorios = [];
        this.uniformesParada = [];
        this.uniformesUsar = [];
        this.uniformesAgreste = [];
        this.uniformesUm6 = [];
        this.uniformesGersa = [];
        this.tipoSeleccionado = null;
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
        if (!permisos || !permisos.canViewUniformes) {
            Utils.mostrarNotificacion('No tienes permisos para acceder a este módulo', 'error');
            setTimeout(() => window.location.href = 'sistema.html', 2000);
            return;
        }

        // Cargar datos del bombero
        await this.cargarBomberoActual();
        
        // Mostrar/Ocultar uniformes según rol
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        
        // Cards básicas (Estructural, Forestal, Rescate, Hazmat)
        const cardsBasicas = ['cardEstructural', 'cardForestal', 'cardRescate', 'cardHazmat'];
        
        // TESORERO: Solo ve Accesorios y Tenida de Cuartel (ocultar básicas)
        if (currentUser && currentUser.role === 'Tesorero') {
            // Ocultar básicas
            cardsBasicas.forEach(id => {
                const card = document.getElementById(id);
                if (card) card.style.display = 'none';
            });
            // Mostrar específicas
            const cardAccesorios = document.getElementById('cardAccesorios');
            const cardTenida = document.getElementById('cardTenida');
            if (cardAccesorios) cardAccesorios.style.display = 'block';
            if (cardTenida) cardTenida.style.display = 'block';
        }
        // DIRECTOR: Solo ve Parada (ocultar básicas)
        else if (currentUser && currentUser.role === 'Director') {
            // Ocultar básicas
            cardsBasicas.forEach(id => {
                const card = document.getElementById(id);
                if (card) card.style.display = 'none';
            });
            // Mostrar específica
            const cardParada = document.getElementById('cardParada');
            if (cardParada) cardParada.style.display = 'block';
        }
        // OTROS ROLES: Ven las básicas + sus específicas
        else {
            // Parada: Solo si ya fue Director (ya verificado arriba)
            
            // USAR, AGRESTE, UM-6, GERSA: Capitán y Ayudante
            const cardUsar = document.getElementById('cardUsar');
            const cardAgreste = document.getElementById('cardAgreste');
            const cardUm6 = document.getElementById('cardUm6');
            const cardGersa = document.getElementById('cardGersa');
            if (currentUser && (currentUser.role === 'Capitán' || currentUser.role === 'Ayudante')) {
                if (cardUsar) cardUsar.style.display = 'block';
                if (cardAgreste) cardAgreste.style.display = 'block';
                if (cardUm6) cardUm6.style.display = 'block';
                if (cardGersa) cardGersa.style.display = 'block';
            }
        }
        
        // Cargar uniformes por tipo (almacenamiento separado)
        this.uniformesEstructural = JSON.parse(localStorage.getItem('uniformesEstructural') || '[]');
        this.uniformesForestal = JSON.parse(localStorage.getItem('uniformesForestal') || '[]');
        this.uniformesRescate = JSON.parse(localStorage.getItem('uniformesRescate') || '[]');
        this.uniformesHazmat = JSON.parse(localStorage.getItem('uniformesHazmat') || '[]');
        this.uniformesTenidaCuartel = JSON.parse(localStorage.getItem('uniformesTenidaCuartel') || '[]');
        this.uniformesAccesorios = JSON.parse(localStorage.getItem('uniformesAccesorios') || '[]');
        this.uniformesParada = JSON.parse(localStorage.getItem('uniformesParada') || '[]');
        this.uniformesUsar = JSON.parse(localStorage.getItem('uniformesUsar') || '[]');
        this.uniformesAgreste = JSON.parse(localStorage.getItem('uniformesAgreste') || '[]');
        this.uniformesUm6 = JSON.parse(localStorage.getItem('uniformesUm6') || '[]');
        this.uniformesGersa = JSON.parse(localStorage.getItem('uniformesGersa') || '[]');
        
        // Inicializar contadores por tipo
        window.idEstructural = parseInt(localStorage.getItem('idEstructural') || '1');
        window.idForestal = parseInt(localStorage.getItem('idForestal') || '1');
        window.idRescate = parseInt(localStorage.getItem('idRescate') || '1');
        window.idHazmat = parseInt(localStorage.getItem('idHazmat') || '1');
        window.idTenidaCuartel = parseInt(localStorage.getItem('idTenidaCuartel') || '1');
        window.idAccesorios = parseInt(localStorage.getItem('idAccesorios') || '1');
        window.idParada = parseInt(localStorage.getItem('idParada') || '1');
        window.idUsar = parseInt(localStorage.getItem('idUsar') || '1');
        window.idAgreste = parseInt(localStorage.getItem('idAgreste') || '1');
        window.idUm6 = parseInt(localStorage.getItem('idUm6') || '1');
        window.idGersa = parseInt(localStorage.getItem('idGersa') || '1');
        
        // Renderizar uniformes
        this.renderizarUniformes();
    }

    async cargarBomberoActual() {
        const bomberoId = localStorage.getItem('bomberoUniformeActual');
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
        const contenedor = document.getElementById('bomberoDatosUniformes');
        const antiguedad = Utils.calcularAntiguedadDetallada(this.bomberoActual.fechaIngreso);
        const estadoBadge = Utils.obtenerBadgeEstado(this.bomberoActual.estadoBombero);
        
        contenedor.innerHTML = `
            <div><strong>Nombre Completo:</strong> <span>${Utils.obtenerNombreCompleto(this.bomberoActual)}</span></div>
            <div><strong>Clave Bombero:</strong> <span>${this.bomberoActual.claveBombero}</span></div>
            <div><strong>RUN:</strong> <span>${this.bomberoActual.rut}</span></div>
            <div><strong>Compañía:</strong> <span>${this.bomberoActual.compania}</span></div>
            <div><strong>Estado:</strong> <span style="font-weight: bold;">${estadoBadge}</span></div>
            <div><strong>Antigüedad:</strong> <span>${antiguedad.años} años, ${antiguedad.meses} meses</span></div>
        `;
        
        // Verificar si puede recibir uniformes
        const validacion = Utils.puedeRecibirUniformes(this.bomberoActual);
        if (!validacion.puede) {
            // Mostrar alerta prominente
            const alertaContainer = document.getElementById('listaUniformes');
            if (alertaContainer) {
                alertaContainer.innerHTML = `
                    <div style="background: #fee2e2; border-left: 4px solid #dc2626; padding: 20px; border-radius: 8px; margin-top: 20px;">
                        <h3 style="color: #dc2626; margin-top: 0;">⚠️ No se pueden asignar uniformes</h3>
                        <p style="color: #991b1b; margin: 10px 0; font-size: 16px;">${validacion.mensaje}</p>
                        <p style="color: #666; margin: 0; font-size: 14px;">
                            Solo se puede consultar el historial de uniformes de este voluntario.
                        </p>
                    </div>
                `;
            }
            
            // Deshabilitar todos los botones de tipo de uniforme
            const botones = document.querySelectorAll('.tipo-uniforme-btn');
            botones.forEach(btn => {
                btn.disabled = true;
                btn.style.opacity = '0.5';
                btn.style.cursor = 'not-allowed';
            });
        }
    }

    seleccionarTipo(tipo) {
        this.tipoSeleccionado = tipo;
        this.contadorPiezas = 0; // Reiniciar contador
        
        const formularioContainer = document.getElementById('formularioUniforme');
        
        if (!formularioContainer) {
            console.error('❌ formularioContainer no existe en el DOM');
            return;
        }
        
        let formularioHTML = '';
        let usaPiezas = false; // Flag para saber si usa sistema de piezas
        
        if (tipo === 'estructural') {
            formularioHTML = this.generarFormularioEstructural();
            usaPiezas = true;
        } else if (tipo === 'forestal') {
            formularioHTML = this.generarFormularioForestal();
            usaPiezas = true;
        } else if (tipo === 'rescate') {
            formularioHTML = this.generarFormularioRescate();
            usaPiezas = true;
        } else if (tipo === 'hazmat') {
            formularioHTML = this.generarFormularioHazmat();
            usaPiezas = true;
        } else if (tipo === 'tenidaCuartel') {
            formularioHTML = this.generarFormularioTenidaCuartel();
            usaPiezas = true;
        } else if (tipo === 'accesorios') {
            formularioHTML = this.generarFormularioAccesorios();
            usaPiezas = true;
        } else if (tipo === 'parada') {
            formularioHTML = this.generarFormularioParada();
            usaPiezas = true;
        } else if (tipo === 'usar') {
            formularioHTML = this.generarFormularioUsar();
            usaPiezas = true;
        } else if (tipo === 'agreste') {
            formularioHTML = this.generarFormularioAgreste();
            usaPiezas = true;
        } else if (tipo === 'um6') {
            formularioHTML = this.generarFormularioUm6();
            usaPiezas = true;
        } else if (tipo === 'gersa') {
            formularioHTML = this.generarFormularioGersa();
            usaPiezas = true;
        }
        
        formularioContainer.innerHTML = formularioHTML;
        formularioContainer.style.display = 'block'; // ⭐ MOSTRAR EL CONTENEDOR
        
        // Configurar evento del formulario
        const form = document.getElementById('formUniformeEspecifico');
        if (form) {
            form.addEventListener('submit', (e) => this.manejarSubmit(e));
        }
        
        // Si usa piezas, agregar la primera automáticamente
        if (usaPiezas) {
            // Usar requestAnimationFrame para asegurar que el DOM esté listo
            requestAnimationFrame(() => {
                const container = document.getElementById('piezasContainer');
                if (container) {
                    this.agregarPieza(tipo);
                }
            });
        }
        
        // Scroll al formulario
        formularioContainer.scrollIntoView({ behavior: 'smooth' });
    }

    generarFormularioEstructural() {
        return `
            <h3>🧯 Uniforme Estructural</h3>
            <button type="button" class="btn btn-secondary" onclick="sistemaUniformes.volverATipos()" style="margin-bottom: 20px;">
                ← Volver a Tipos
            </button>
            
            <form id="formUniformeEspecifico">
                <input type="hidden" name="tipoUniforme" value="estructural">
                <input type="hidden" name="bomberoId" value="${this.bomberoActual.id}">
                
                <div id="piezasContainer"></div>
                
                <button type="button" class="btn btn-secondary" onclick="sistemaUniformes.agregarPieza('estructural')" style="margin: 20px 0;">
                    ➕ Agregar otro artículo
                </button>

                <div class="form-group">
                    <label for="observaciones">Observaciones Generales</label>
                    <textarea id="observaciones" name="observaciones" rows="3" placeholder="Observaciones adicionales sobre la entrega..."></textarea>
                </div>

                <div class="buttons">
                    <button type="submit" class="btn btn-uniforme">✅ Registrar Entrega</button>
                    <button type="button" class="btn btn-danger" onclick="sistemaUniformes.volverAlSistema()">❌ Cancelar</button>
                </div>
            </form>
        `;
    }

    generarFormularioForestal() {
        return `
            <h3>🌲 Uniforme Forestal</h3>
            <button type="button" class="btn btn-secondary" onclick="sistemaUniformes.volverATipos()" style="margin-bottom: 20px;">
                ← Volver a Tipos
            </button>
            
            <form id="formUniformeEspecifico">
                <input type="hidden" name="tipoUniforme" value="forestal">
                <input type="hidden" name="bomberoId" value="${this.bomberoActual.id}">
                
                <div id="piezasContainer"></div>
                
                <button type="button" class="btn btn-secondary" onclick="sistemaUniformes.agregarPieza('forestal')" style="margin: 20px 0;">
                    ➕ Agregar otro artículo
                </button>

                <div class="form-group">
                    <label for="observaciones">Observaciones Generales</label>
                    <textarea id="observaciones" name="observaciones" rows="3" placeholder="Observaciones adicionales sobre la entrega..."></textarea>
                </div>

                <div class="buttons">
                    <button type="submit" class="btn btn-uniforme">✅ Registrar Entrega</button>
                    <button type="button" class="btn btn-danger" onclick="sistemaUniformes.volverAlSistema()">❌ Cancelar</button>
                </div>
            </form>
        `;
    }

    generarFormularioRescate() {
        // Usar replaceAll para reemplazar TODAS las ocurrencias
        return this.generarFormularioForestal()
            .replaceAll('🌲 Uniforme Forestal', '🚑 Uniforme de Rescate')
            .replaceAll('forestal', 'rescate')
            .replaceAll('Forestal', 'Rescate');
    }

    toggleCascoForestal() {
        const checkbox = document.getElementById('incluyeCasco');
        const camposCasco = document.getElementById('camposCasco');
        camposCasco.style.display = checkbox.checked ? 'grid' : 'none';
    }

    volverATipos() {
        const formularioContainer = document.getElementById('formularioUniforme');
        formularioContainer.style.display = 'none';
        this.tipoSeleccionado = null;
    }

    async manejarSubmit(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const datos = Object.fromEntries(formData);
        
        try {
            const uniformeRegistrado = await this.guardarUniforme(datos);
            event.target.reset();
            this.renderizarUniformes();
            this.volverATipos();
            Utils.mostrarNotificacion('✅ Uniforme registrado exitosamente. Usa el botón "PDF" para generar el comprobante.', 'success');
        } catch (error) {
            console.error('Error al registrar uniforme:', error);
            Utils.mostrarNotificacion('Error al registrar uniforme: ' + error.message, 'error');
        }
    }

    procesarPiezasDinamicas(datos) {
        const piezas = [];
        
        // Buscar todas las piezas en el FormData
        for (let key in datos) {
            if (key.startsWith('componente_pieza_')) {
                const piezaId = key.replace('componente_', '');
                let componente = datos[`componente_${piezaId}`];
                let nombrePersonalizado = null;
                
                // Si es "otro", usar el nombre personalizado
                if (componente === 'otro' && datos[`nombrePersonalizado_${piezaId}`]) {
                    nombrePersonalizado = datos[`nombrePersonalizado_${piezaId}`];
                    componente = nombrePersonalizado.toLowerCase().replace(/ /g, '_');
                }
                
                // Determinar unidad y par/simple según componente
                let unidad = 1;
                let parSimple = 'Simple';
                if (['botas', 'guantes'].includes(componente)) {
                    unidad = 2;
                    parSimple = 'Par';
                }
                
                const pieza = {
                    componente: componente,
                    nombrePersonalizado: nombrePersonalizado,
                    marca: datos[`marca_${piezaId}`],
                    serie: datos[`serie_${piezaId}`] || '',
                    talla: datos[`talla_${piezaId}`] || '',
                    condicion: datos[`condicion_${piezaId}`],
                    estadoFisico: datos[`estadoFisico_${piezaId}`],
                    fechaEntrega: datos[`fechaEntrega_${piezaId}`],
                    unidad: unidad,
                    parSimple: parSimple,
                    estadoPieza: 'activo',
                    fechaDevolucion: null,
                    devueltoPor: null
                };
                
                piezas.push(pieza);
            }
        }
        
        return piezas;
    }

    async guardarUniforme(datos) {
        // Generar ID único según tipo
        let idUnico, contador;
        if (datos.tipoUniforme === 'estructural') {
            contador = window.idEstructural++;
            idUnico = `ESTR-${String(contador).padStart(3, '0')}`;
            localStorage.setItem('idEstructural', window.idEstructural);
        } else if (datos.tipoUniforme === 'forestal') {
            contador = window.idForestal++;
            idUnico = `FOR-${String(contador).padStart(3, '0')}`;
            localStorage.setItem('idForestal', window.idForestal);
        } else if (datos.tipoUniforme === 'rescate') {
            contador = window.idRescate++;
            idUnico = `RESC-${String(contador).padStart(3, '0')}`;
            localStorage.setItem('idRescate', window.idRescate);
        } else if (datos.tipoUniforme === 'hazmat') {
            contador = window.idHazmat++;
            idUnico = `HAZ-${String(contador).padStart(3, '0')}`;
            localStorage.setItem('idHazmat', window.idHazmat);
        } else if (datos.tipoUniforme === 'tenidaCuartel') {
            contador = window.idTenidaCuartel++;
            idUnico = `TCU-${String(contador).padStart(3, '0')}`;
            localStorage.setItem('idTenidaCuartel', window.idTenidaCuartel);
        } else if (datos.tipoUniforme === 'accesorios') {
            contador = window.idAccesorios++;
            idUnico = `ACC-${String(contador).padStart(3, '0')}`;
            localStorage.setItem('idAccesorios', window.idAccesorios);
        } else if (datos.tipoUniforme === 'parada') {
            contador = window.idParada++;
            idUnico = `PAR-${String(contador).padStart(3, '0')}`;
            localStorage.setItem('idParada', window.idParada);
        } else if (datos.tipoUniforme === 'usar') {
            contador = window.idUsar++;
            idUnico = `USAR-${String(contador).padStart(3, '0')}`;
            localStorage.setItem('idUsar', window.idUsar);
        } else if (datos.tipoUniforme === 'agreste') {
            contador = window.idAgreste++;
            idUnico = `AGR-${String(contador).padStart(3, '0')}`;
            localStorage.setItem('idAgreste', window.idAgreste);
        } else if (datos.tipoUniforme === 'um6') {
            contador = window.idUm6++;
            idUnico = `UM6-${String(contador).padStart(3, '0')}`;
            localStorage.setItem('idUm6', window.idUm6);
        } else if (datos.tipoUniforme === 'gersa') {
            contador = window.idGersa++;
            idUnico = `GERSA-${String(contador).padStart(3, '0')}`;
            localStorage.setItem('idGersa', window.idGersa);
        }

        const uniformeData = {
            id: idUnico,
            bomberoId: parseInt(datos.bomberoId),
            tipoUniforme: datos.tipoUniforme,
            condicion: datos.condicion,
            estadoFisico: datos.estadoFisico,
            fechaEntrega: datos.fechaEntrega,
            observaciones: datos.observaciones || '',
            registradoPor: JSON.parse(localStorage.getItem('currentUser')).username,
            fechaRegistro: new Date().toISOString(),
            estado: 'activo' // activo o devuelto
        };

        // Agregar detalles según tipo
        if (datos.tipoUniforme === 'estructural' || datos.tipoUniforme === 'forestal' || datos.tipoUniforme === 'rescate') {
            // Ahora también usan el sistema de piezas dinámicas
            uniformeData.piezas = this.procesarPiezasDinamicas(datos);
            if (uniformeData.piezas.length === 0) {
                throw new Error('Debe registrar al menos un artículo');
            }
        } else if (datos.tipoUniforme === 'hazmat') {
            // Procesar piezas dinámicas
            uniformeData.piezas = this.procesarPiezasDinamicas(datos);
            if (uniformeData.piezas.length === 0) {
                throw new Error('Debe registrar al menos un artículo');
            }
        } else if (datos.tipoUniforme === 'tenidaCuartel') {
            // Procesar piezas dinámicas
            uniformeData.piezas = this.procesarPiezasDinamicas(datos);
            if (uniformeData.piezas.length === 0) {
                throw new Error('Debe registrar al menos un artículo');
            }
        } else if (datos.tipoUniforme === 'accesorios') {
            // Procesar piezas dinámicas
            uniformeData.piezas = this.procesarPiezasDinamicas(datos);
            if (uniformeData.piezas.length === 0) {
                throw new Error('Debe registrar al menos un artículo');
            }
        } else if (datos.tipoUniforme === 'parada') {
            // Procesar piezas dinámicas
            uniformeData.piezas = this.procesarPiezasDinamicas(datos);
            if (uniformeData.piezas.length === 0) {
                throw new Error('Debe registrar al menos un artículo');
            }
        } else if (datos.tipoUniforme === 'usar') {
            // Procesar piezas dinámicas
            uniformeData.piezas = this.procesarPiezasDinamicas(datos);
            if (uniformeData.piezas.length === 0) {
                throw new Error('Debe registrar al menos un artículo');
            }
        } else if (datos.tipoUniforme === 'agreste') {
            // Procesar piezas dinámicas
            uniformeData.piezas = this.procesarPiezasDinamicas(datos);
            if (uniformeData.piezas.length === 0) {
                throw new Error('Debe registrar al menos un artículo');
            }
        } else if (datos.tipoUniforme === 'um6') {
            // Procesar piezas dinámicas
            uniformeData.piezas = this.procesarPiezasDinamicas(datos);
            if (uniformeData.piezas.length === 0) {
                throw new Error('Debe registrar al menos un artículo');
            }
        } else if (datos.tipoUniforme === 'gersa') {
            // Procesar piezas dinámicas
            uniformeData.piezas = this.procesarPiezasDinamicas(datos);
            if (uniformeData.piezas.length === 0) {
                throw new Error('Debe registrar al menos un artículo');
            }
        }

        // Guardar en el array correspondiente
        if (datos.tipoUniforme === 'estructural') {
            this.uniformesEstructural.push(uniformeData);
        } else if (datos.tipoUniforme === 'forestal') {
            this.uniformesForestal.push(uniformeData);
        } else if (datos.tipoUniforme === 'rescate') {
            this.uniformesRescate.push(uniformeData);
        } else if (datos.tipoUniforme === 'hazmat') {
            this.uniformesHazmat.push(uniformeData);
        } else if (datos.tipoUniforme === 'tenidaCuartel') {
            this.uniformesTenidaCuartel.push(uniformeData);
        } else if (datos.tipoUniforme === 'accesorios') {
            this.uniformesAccesorios.push(uniformeData);
        } else if (datos.tipoUniforme === 'parada') {
            this.uniformesParada.push(uniformeData);
        } else if (datos.tipoUniforme === 'usar') {
            this.uniformesUsar.push(uniformeData);
        } else if (datos.tipoUniforme === 'agreste') {
            this.uniformesAgreste.push(uniformeData);
        } else if (datos.tipoUniforme === 'um6') {
            this.uniformesUm6.push(uniformeData);
        } else if (datos.tipoUniforme === 'gersa') {
            this.uniformesGersa.push(uniformeData);
        }
        
        this.guardarDatos();
        return uniformeData;
    }

    guardarDatos() {
        // Guardar cada tipo por separado
        localStorage.setItem('uniformesEstructural', JSON.stringify(this.uniformesEstructural));
        localStorage.setItem('uniformesForestal', JSON.stringify(this.uniformesForestal));
        localStorage.setItem('uniformesRescate', JSON.stringify(this.uniformesRescate));
        localStorage.setItem('uniformesHazmat', JSON.stringify(this.uniformesHazmat));
        localStorage.setItem('uniformesTenidaCuartel', JSON.stringify(this.uniformesTenidaCuartel));
        localStorage.setItem('uniformesAccesorios', JSON.stringify(this.uniformesAccesorios));
        localStorage.setItem('uniformesParada', JSON.stringify(this.uniformesParada));
        localStorage.setItem('uniformesUsar', JSON.stringify(this.uniformesUsar));
        localStorage.setItem('uniformesAgreste', JSON.stringify(this.uniformesAgreste));
        localStorage.setItem('uniformesUm6', JSON.stringify(this.uniformesUm6));
        localStorage.setItem('uniformesGersa', JSON.stringify(this.uniformesGersa));
        
        // Disparar evento personalizado para notificar cambios (útil para actualizar tablas en tiempo real)
        window.dispatchEvent(new CustomEvent('uniformesActualizados', {
            detail: {
                bomberoId: this.bomberoActual ? this.bomberoActual.id : null,
                timestamp: new Date().toISOString()
            }
        }));
    }

    renderizarUniformes() {
        const lista = document.getElementById('listaUniformes');
        const totalElement = document.getElementById('totalUniformes');
        if (!lista) return;

        const todosLosUniformes = [
            ...this.uniformesEstructural,
            ...this.uniformesForestal,
            ...this.uniformesRescate,
            ...this.uniformesHazmat,
            ...this.uniformesTenidaCuartel,
            ...this.uniformesAccesorios,
            ...this.uniformesParada,
            ...this.uniformesUsar,
            ...this.uniformesAgreste,
            ...this.uniformesUm6,
            ...this.uniformesGersa
        ];
        
        // Filtrar uniformes ACTIVOS para mostrar arriba
        const uniformesBombero = todosLosUniformes.filter(u => u.bomberoId == this.bomberoActual.id && u.estado === 'activo');
        
        // Obtener TODOS los uniformes del bombero (activos y devueltos) para el historial
        const todosUniformesBombero = todosLosUniformes.filter(u => u.bomberoId == this.bomberoActual.id);
        
        if (totalElement) {
            totalElement.textContent = uniformesBombero.length;
        }

        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        console.log('✅ Usuario actual completo:', currentUser);
        console.log('✅ Rol del usuario:', currentUser ? currentUser.role : 'No hay usuario');
        
        // Verificar rol de Super Administrador (nombre exacto del sistema)
        const esSuperAdmin = currentUser && (
            currentUser.role === 'Super Administrador' ||  // ⭐ NOMBRE CORRECTO DEL SISTEMA
            currentUser.role === 'Super Admin' || 
            currentUser.role === 'SuperAdmin' || 
            currentUser.role === 'super admin' ||
            currentUser.role === 'superadmin'
        );
        console.log('✅ Es Super Admin:', esSuperAdmin);

        // Renderizar uniformes activos
        let htmlUniformes = '';
        
        if (uniformesBombero.length === 0) {
            htmlUniformes = '<p style="text-align: center; padding: 40px; color: #999;">No hay uniformes activos registrados</p>';
        } else {
            htmlUniformes = uniformesBombero.map(uniforme => {
                const tipoNombre = this.obtenerNombreTipo(uniforme.tipoUniforme);
                const esEditor = uniforme.registradoPor === currentUser.username;
                
                // Todos los uniformes ahora usan piezas
                if (uniforme.piezas && uniforme.piezas.length > 0) {
                    return this.renderizarUniformeConPiezas(uniforme, tipoNombre, esEditor, esSuperAdmin);
                } else {
                    // Uniformes legacy antiguos (mostrar migración pendiente)
                    return this.renderizarUniformeLegacy(uniforme, tipoNombre, esEditor, esSuperAdmin);
                }
            }).join('');
        }
        
        // Generar historial de devoluciones (SIEMPRE visible)
        const htmlHistorial = this.renderizarHistorialDevoluciones(todosUniformesBombero);
        
        // Combinar todo
        lista.innerHTML = htmlUniformes + htmlHistorial;
    }
    
    obtenerNombreTipo(tipo) {
        const nombres = {
            'estructural': '🧯 Estructural',
            'forestal': '🌲 Forestal',
            'rescate': '🚑 Rescate',
            'hazmat': '☣️ Hazmat',
            'tenidaCuartel': '🏠 Tenida de Cuartel',
            'accesorios': '🎒 Accesorios',
            'parada': '🎖️ Uniforme de Parada',
            'usar': '🚨 Uniforme USAR',
            'agreste': '🌾 Uniforme AGRESTE',
            'um6': '⚓ Uniforme UM-6',
            'gersa': '🤿 Uniforme GERSA'
        };
        return nombres[tipo] || 'Uniforme';
    }
    
    renderizarUniformeConPiezas(uniforme, tipoNombre, esEditor, esSuperAdmin) {
        const piezasActivas = uniforme.piezas.filter(p => p.estadoPieza === 'activo');
        if (piezasActivas.length === 0) return '';
        
        let tablaPiezas = `
            <table style="width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 0.9em;">
                <thead>
                    <tr style="background: #f0f0f0; border-bottom: 2px solid #ddd;">
                        <th style="padding: 8px; text-align: left;">Artículo</th>
                        <th style="padding: 8px; text-align: center;">Marca</th>
                        <th style="padding: 8px; text-align: center;">Serie</th>
                        <th style="padding: 8px; text-align: center;">Talla</th>
                        <th style="padding: 8px; text-align: center;">Condición</th>
                        <th style="padding: 8px; text-align: center;">Estado</th>
                        <th style="padding: 8px; text-align: center;">F.Entrega</th>
                        <th style="padding: 8px; text-align: center;">Últ. Modificación</th>
                        <th style="padding: 8px; text-align: center;">Modificado por</th>
                        <th style="padding: 8px; text-align: center;">Acciones</th>
                    </tr>
                </thead>
                <tbody>`;
        
        piezasActivas.forEach((pieza, indexFiltrado) => {
            // Encontrar el índice real en el array completo de piezas
            const indexReal = uniforme.piezas.indexOf(pieza);
            
            const nombrePieza = pieza.nombrePersonalizado || this.formatearNombreComponente(pieza.componente);
            const piezaId = `${uniforme.id}_${indexReal}`;
            
            const ultimaMod = pieza.ultimaModificacion;
            const fechaMod = ultimaMod ? Utils.formatearFecha(ultimaMod.fecha) : '-';
            const usuarioMod = ultimaMod ? ultimaMod.usuario : '-';
            
            tablaPiezas += `
                <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 8px;">${nombrePieza}</td>
                    <td style="padding: 8px;">${pieza.marca || 'N/A'}</td>
                    <td style="padding: 8px; text-align: center;">${pieza.serie || 'N/A'}</td>
                    <td style="padding: 8px; text-align: center;">${pieza.talla || 'N/A'}</td>
                    <td style="padding: 8px; text-align: center;">${this.formatearCondicion(pieza.condicion)}</td>
                    <td style="padding: 8px; text-align: center;">
                        <select onchange="sistemaUniformes.actualizarEstado('${uniforme.id}', ${indexReal}, this.value)" style="padding: 4px; border: 1px solid #ddd; border-radius: 4px; font-size: 0.85em;">
                            <option value="bueno" ${pieza.estadoFisico === 'bueno' ? 'selected' : ''}>✅ Bueno</option>
                            <option value="regular" ${pieza.estadoFisico === 'regular' ? 'selected' : ''}>⚠️ Regular</option>
                            <option value="malo" ${pieza.estadoFisico === 'malo' ? 'selected' : ''}>❌ Malo</option>
                        </select>
                    </td>
                    <td style="padding: 8px; text-align: center;">${Utils.formatearFecha(pieza.fechaEntrega)}</td>
                    <td style="padding: 8px; text-align: center; font-size: 0.85em; color: #666;">${fechaMod}</td>
                    <td style="padding: 8px; text-align: center; font-size: 0.85em; color: #666;">${usuarioMod}</td>
                    <td style="padding: 8px; text-align: center;">
                        <button class="btn btn-danger btn-sm" onclick="sistemaUniformes.devolverPieza('${uniforme.id}', ${indexReal})" style="font-size: 0.8em;">
                            📤
                        </button>
                    </td>
                </tr>`;
        });
        
        tablaPiezas += `</tbody></table>`;
        
        return `
            <div class="uniforme-card" style="margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <h4>${tipoNombre} - ID: ${uniforme.id}</h4>
                    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                        <button class="btn btn-warning btn-sm" onclick="sistemaUniformes.editarUniforme('${uniforme.id}')" style="background: linear-gradient(135deg, #ffc107 0%, #ff9800 100%); color: white; border: none; display: ${esSuperAdmin ? 'inline-block' : 'none'};">
                            ✏️ Editar
                        </button>
                        <button class="btn btn-pdf btn-sm" onclick="sistemaUniformes.generarPDFPorId('${uniforme.id}')">
                            📄 PDF
                        </button>
                    </div>
                </div>
                ${tablaPiezas}
                ${uniforme.observaciones ? `<p style="margin-top: 10px;"><strong>Observaciones:</strong> ${uniforme.observaciones}</p>` : ''}
                <p style="font-size: 0.85em; color: #666; margin-top: 10px;">Registrado por: ${uniforme.registradoPor} el ${Utils.formatearFecha(uniforme.fechaRegistro)}</p>
            </div>
        `;
    }
    
    renderizarUniformeLegacy(uniforme, tipoNombre, esEditor, esSuperAdmin) {
        // Para Estructural, Forestal, Rescate (sistema antiguo)
        let detalles = '';
        
        if (uniforme.jardinera) {
            detalles += `<p><strong>Jardinera:</strong> ${uniforme.jardinera.marca} - ${uniforme.jardinera.serie} (Talla: ${uniforme.jardinera.talla})</p>`;
        }
        if (uniforme.chaqueta) {
            detalles += `<p><strong>Chaqueta:</strong> ${uniforme.chaqueta.marca} - ${uniforme.chaqueta.serie} (Talla: ${uniforme.chaqueta.talla})</p>`;
        }
        if (uniforme.guantes) {
            detalles += `<p><strong>Guantes:</strong> ${uniforme.guantes.marca} - ${uniforme.guantes.serie} (Talla: ${uniforme.guantes.talla})</p>`;
        }
        if (uniforme.botas) {
            detalles += `<p><strong>Botas:</strong> ${uniforme.botas.marca} - ${uniforme.botas.serie} (Talla: ${uniforme.botas.talla})</p>`;
        }
        if (uniforme.casco) {
            detalles += `<p><strong>Casco:</strong> ${uniforme.casco.marca} - ${uniforme.casco.serie}</p>`;
        }
        if (uniforme.esclavina) {
            detalles += `<p><strong>Esclavina:</strong> ${uniforme.esclavina.marca} - ${uniforme.esclavina.serie} (Talla: ${uniforme.esclavina.talla})</p>`;
        }
        
        return `
            <div class="uniforme-card">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div>
                        <h4>${tipoNombre} - ID: ${uniforme.id}</h4>
                        ${detalles}
                        ${uniforme.observaciones ? `<p><strong>Obs:</strong> ${uniforme.observaciones}</p>` : ''}
                    </div>
                    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                        <button class="btn btn-warning btn-sm" onclick="sistemaUniformes.editarUniforme('${uniforme.id}')" style="background: linear-gradient(135deg, #ffc107 0%, #ff9800 100%); color: white; border: none; display: ${esSuperAdmin ? 'inline-block' : 'none'};">
                            ✏️ Editar
                        </button>
                        <button class="btn btn-pdf btn-sm" onclick="sistemaUniformes.generarPDFPorId('${uniforme.id}')">
                            📄 PDF
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    
    formatearNombreComponente(componente) {
        // Manejo especial para cinturones
        if (componente === 'cinturon_negro') return 'Cinturón Negro';
        if (componente === 'cinturon_blanco') return 'Cinturón Blanco';
        return componente.replace(/_/g, ' ').split(' ').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
    }
    
    formatearCondicion(condicion) {
        const map = { 'nuevo': '🆕 Nuevo', 'semi-nuevo': '🔄 Semi-Nuevo', 'usado': '📦 Usado' };
        return map[condicion] || condicion;
    }
    
    formatearEstado(estado) {
        const map = { 'bueno': '✅ Bueno', 'regular': '⚠️ Regular', 'malo': '❌ Malo' };
        return map[estado] || estado;
    }

    // Renderizar historial de devoluciones
    renderizarHistorialDevolucion(uniforme) {
        if (!uniforme.piezas) return '';
        
        const piezasDevueltas = uniforme.piezas.filter(p => p.estadoPieza === 'devuelto' && p.fechaDevolucion);
        
        if (piezasDevueltas.length === 0) return '';
        
        let historialHTML = `
            <div style="margin-top: 20px; padding: 15px; background: #fff3e0; border-left: 4px solid #ff9800; border-radius: 4px;">
                <h5 style="color: #ff9800; margin-top: 0; margin-bottom: 15px;">📋 Historial de Devoluciones</h5>
                <table style="width: 100%; border-collapse: collapse; font-size: 0.9em;">
                    <thead>
                        <tr style="background: #ffe0b2; border-bottom: 2px solid #ff9800;">
                            <th style="padding: 8px; text-align: left;">Artículo</th>
                            <th style="padding: 8px; text-align: center;">Fecha Dev.</th>
                            <th style="padding: 8px; text-align: center;">Estado Dev.</th>
                            <th style="padding: 8px; text-align: center;">Condición Dev.</th>
                            <th style="padding: 8px; text-align: left;">Observaciones</th>
                            <th style="padding: 8px; text-align: center;">Devuelto por</th>
                        </tr>
                    </thead>
                    <tbody>`;
        
        piezasDevueltas.forEach(pieza => {
            const nombrePieza = pieza.nombrePersonalizado || this.formatearNombreComponente(pieza.componente);
            const estadoColor = pieza.estadoDevolucion === 'bueno' ? '#4caf50' : 
                               pieza.estadoDevolucion === 'regular' ? '#ff9800' : 
                               pieza.estadoDevolucion === 'malo' ? '#f44336' : '#999';
            
            historialHTML += `
                <tr style="border-bottom: 1px solid #ddd;">
                    <td style="padding: 8px;">${nombrePieza}</td>
                    <td style="padding: 8px; text-align: center;">${Utils.formatearFecha(pieza.fechaDevolucion)}</td>
                    <td style="padding: 8px; text-align: center; color: ${estadoColor}; font-weight: bold;">
                        ${this.formatearEstado(pieza.estadoDevolucion)}
                    </td>
                    <td style="padding: 8px; text-align: center;">
                        ${this.formatearCondicion(pieza.condicionDevolucion)}
                    </td>
                    <td style="padding: 8px;">${pieza.observacionesDevolucion || '-'}</td>
                    <td style="padding: 8px; text-align: center;">${pieza.devueltoPor || '-'}</td>
                </tr>`;
        });
        
        historialHTML += `
                    </tbody>
                </table>
            </div>`;
        
        return historialHTML;
    }

    // Renderizar historial COMPLETO de devoluciones del voluntario (SIEMPRE visible)
    renderizarHistorialDevoluciones(todosUniformesBombero) {
        // Recopilar TODAS las piezas devueltas de TODOS los uniformes
        const todasPiezasDevueltas = [];
        
        todosUniformesBombero.forEach(uniforme => {
            if (!uniforme.piezas) return;
            
            uniforme.piezas.forEach(pieza => {
                if (pieza.estadoPieza === 'devuelto' && pieza.fechaDevolucion) {
                    todasPiezasDevueltas.push({
                        ...pieza,
                        uniformeId: uniforme.id,
                        tipoUniforme: this.obtenerNombreTipo(uniforme.tipoUniforme)
                    });
                }
            });
        });
        
        // Si no hay devoluciones, mostrar mensaje
        if (todasPiezasDevueltas.length === 0) {
            return `
                <div style="margin-top: 30px; padding: 20px; background: #f5f5f5; border-left: 4px solid #999; border-radius: 4px;">
                    <h4 style="color: #666; margin-top: 0;">📋 Historial de Devoluciones</h4>
                    <p style="color: #999; text-align: center; margin: 0;">No hay artículos devueltos registrados</p>
                </div>
            `;
        }
        
        // Ordenar por fecha de devolución (más reciente primero)
        todasPiezasDevueltas.sort((a, b) => new Date(b.fechaDevolucion) - new Date(a.fechaDevolucion));
        
        let historialHTML = `
            <div style="margin-top: 30px; padding: 20px; background: #fff3e0; border-left: 4px solid #ff9800; border-radius: 4px;">
                <h4 style="color: #ff9800; margin-top: 0; margin-bottom: 15px;">📋 Historial Completo de Devoluciones</h4>
                <p style="font-size: 0.9em; color: #666; margin-bottom: 15px;">
                    Total de artículos devueltos: <strong>${todasPiezasDevueltas.length}</strong>
                </p>
                <table style="width: 100%; border-collapse: collapse; font-size: 0.9em;">
                    <thead>
                        <tr style="background: #ffe0b2; border-bottom: 2px solid #ff9800;">
                            <th style="padding: 8px; text-align: left;">Uniforme</th>
                            <th style="padding: 8px; text-align: left;">Artículo</th>
                            <th style="padding: 8px; text-align: left;">Marca/Modelo</th>
                            <th style="padding: 8px; text-align: center;">N° Serie</th>
                            <th style="padding: 8px; text-align: center;">Talla</th>
                            <th style="padding: 8px; text-align: center;">Fecha Dev.</th>
                            <th style="padding: 8px; text-align: center;">Estado Dev.</th>
                            <th style="padding: 8px; text-align: center;">Condición Dev.</th>
                            <th style="padding: 8px; text-align: left;">Observaciones</th>
                            <th style="padding: 8px; text-align: center;">Devuelto por</th>
                        </tr>
                    </thead>
                    <tbody>`;
        
        todasPiezasDevueltas.forEach((pieza, index) => {
            const nombrePieza = pieza.nombrePersonalizado || this.formatearNombreComponente(pieza.componente);
            const estadoColor = pieza.estadoDevolucion === 'bueno' ? '#4caf50' : 
                               pieza.estadoDevolucion === 'regular' ? '#ff9800' : 
                               pieza.estadoDevolucion === 'malo' ? '#f44336' : '#999';
            
            const bgColor = index % 2 === 0 ? '#ffffff' : '#fafafa';
            
            historialHTML += `
                <tr style="border-bottom: 1px solid #ddd; background: ${bgColor};">
                    <td style="padding: 8px; font-size: 0.85em;">
                        <span style="background: #e3f2fd; padding: 4px 8px; border-radius: 4px; display: inline-block;">
                            ${pieza.tipoUniforme} - ${pieza.uniformeId}
                        </span>
                    </td>
                    <td style="padding: 8px;">${nombrePieza}</td>
                    <td style="padding: 8px;">${pieza.marca || '-'}</td>
                    <td style="padding: 8px; text-align: center;">${pieza.serie || '-'}</td>
                    <td style="padding: 8px; text-align: center;">${pieza.talla || '-'}</td>
                    <td style="padding: 8px; text-align: center;">${Utils.formatearFecha(pieza.fechaDevolucion)}</td>
                    <td style="padding: 8px; text-align: center; color: ${estadoColor}; font-weight: bold;">
                        ${this.formatearEstado(pieza.estadoDevolucion)}
                    </td>
                    <td style="padding: 8px; text-align: center;">
                        ${this.formatearCondicion(pieza.condicionDevolucion)}
                    </td>
                    <td style="padding: 8px;">${pieza.observacionesDevolucion || '-'}</td>
                    <td style="padding: 8px; text-align: center;">${pieza.devueltoPor || '-'}</td>
                </tr>`;
        });
        
        historialHTML += `
                    </tbody>
                </table>
            </div>`;
        
        return historialHTML;
    }

    // ==================== FUNCIONES DE DEVOLUCIÓN Y EDICIÓN ====================
    
    devolverPieza(uniformeId, piezaIndex) {
        const uniforme = this.buscarUniforme(uniformeId);
        if (!uniforme || !uniforme.piezas) return;
        
        const pieza = uniforme.piezas[piezaIndex];
        const nombrePieza = pieza.nombrePersonalizado || this.formatearNombreComponente(pieza.componente);
        
        // Mostrar modal de devolución
        this.mostrarModalDevolucion(nombrePieza, (estadoDevolucion, condicionDevolucion, observaciones) => {
            pieza.estadoPieza = 'devuelto';
            pieza.fechaDevolucion = new Date().toISOString();
            pieza.devueltoPor = JSON.parse(localStorage.getItem('currentUser')).username;
            pieza.estadoDevolucion = estadoDevolucion;
            pieza.condicionDevolucion = condicionDevolucion;
            pieza.observacionesDevolucion = observaciones;
            
            // Si todas las piezas están devueltas, marcar uniforme completo como devuelto
            const todasDevueltas = uniforme.piezas.every(p => p.estadoPieza === 'devuelto');
            if (todasDevueltas) {
                uniforme.estado = 'devuelto';
            }
            
            this.guardarDatos();
            this.renderizarUniformes();
            Utils.mostrarNotificacion('✅ Artículo devuelto exitosamente', 'success');
        });
    }
    
    mostrarModalDevolucion(nombrePieza, callback) {
        const modalHTML = `
            <div id="modalDevolucion" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999;">
                <div style="background: white; padding: 30px; border-radius: 10px; max-width: 500px; width: 90%;">
                    <h3 style="margin-top: 0;">📤 Registrar Devolución</h3>
                    <p><strong>Artículo:</strong> ${nombrePieza}</p>
                    
                    <div style="margin: 20px 0;">
                        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Estado en que se devuelve:</label>
                        <select id="estadoDevolucion" class="form-control" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                            <option value="">Seleccione...</option>
                            <option value="bueno">✅ Bueno</option>
                            <option value="regular">⚠️ Regular</option>
                            <option value="malo">❌ Malo</option>
                            <option value="deteriorado">🔻 Muy Deteriorado</option>
                        </select>
                    </div>
                    
                    <div style="margin: 20px 0;">
                        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Condición en que se devuelve:</label>
                        <select id="condicionDevolucion" class="form-control" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                            <option value="">Seleccione...</option>
                            <option value="nuevo">🆕 Como Nuevo</option>
                            <option value="semi-nuevo">🔄 Semi-Nuevo</option>
                            <option value="usado">📦 Usado</option>
                            <option value="muy_usado">⚠️ Muy Usado</option>
                        </select>
                    </div>
                    
                    <div style="margin: 20px 0;">
                        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Observaciones de devolución:</label>
                        <textarea id="observacionesDevolucion" class="form-control" rows="3" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" placeholder="Daños, desgaste, etc..."></textarea>
                    </div>
                    
                    <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">
                        <button onclick="document.getElementById('modalDevolucion').remove()" class="btn btn-secondary">❌ Cancelar</button>
                        <button onclick="sistemaUniformes.confirmarDevolucion()" class="btn btn-danger">✅ Confirmar Devolución</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Guardar callback
        this._callbackDevolucion = callback;
    }
    
    confirmarDevolucion() {
        const estado = document.getElementById('estadoDevolucion').value;
        const condicion = document.getElementById('condicionDevolucion').value;
        const observaciones = document.getElementById('observacionesDevolucion').value;
        
        if (!estado || !condicion) {
            Utils.mostrarNotificacion('⚠️ Debe completar estado y condición', 'warning');
            return;
        }
        
        document.getElementById('modalDevolucion').remove();
        
        if (this._callbackDevolucion) {
            this._callbackDevolucion(estado, condicion, observaciones);
            this._callbackDevolucion = null;
        }
    }
    
    devolverTodo(uniformeId) {
        if (!confirm('¿Devolver TODOS los artículos de este uniforme?')) return;
        
        const uniforme = this.buscarUniforme(uniformeId);
        if (!uniforme) return;
        
        const currentUser = JSON.parse(localStorage.getItem('currentUser')).username;
        const now = new Date().toISOString();
        
        if (uniforme.piezas) {
            uniforme.piezas.forEach(pieza => {
                if (pieza.estadoPieza === 'activo') {
                    pieza.estadoPieza = 'devuelto';
                    pieza.fechaDevolucion = now;
                    pieza.devueltoPor = currentUser;
                }
            });
        }
        
        uniforme.estado = 'devuelto';
        uniforme.fechaDevolucion = now;
        uniforme.devueltoPor = currentUser;
        
        this.guardarDatos();
        this.renderizarUniformes();
        Utils.mostrarNotificacion('✅ Uniforme completo devuelto exitosamente', 'success');
    }
    
    actualizarCondicion(uniformeId, piezaIndex, nuevaCondicion) {
        const uniforme = this.buscarUniforme(uniformeId);
        if (!uniforme || !uniforme.piezas) return;
        
        const pieza = uniforme.piezas[piezaIndex];
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        
        // Guardar historial de cambio
        if (!pieza.historialCambios) pieza.historialCambios = [];
        pieza.historialCambios.push({
            campo: 'condicion',
            valorAnterior: pieza.condicion,
            valorNuevo: nuevaCondicion,
            modificadoPor: currentUser ? currentUser.username : 'desconocido',
            fechaModificacion: new Date().toISOString()
        });
        
        pieza.condicion = nuevaCondicion;
        pieza.ultimaModificacion = {
            usuario: currentUser ? currentUser.username : 'desconocido',
            fecha: new Date().toISOString(),
            campo: 'condicion'
        };
        
        this.guardarDatos();
        this.renderizarUniformes();
        Utils.mostrarNotificacion('✅ Condición actualizada', 'success');
    }
    
    actualizarEstado(uniformeId, piezaIndex, nuevoEstado) {
        const uniforme = this.buscarUniforme(uniformeId);
        if (!uniforme || !uniforme.piezas) return;
        
        const pieza = uniforme.piezas[piezaIndex];
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        
        // Guardar historial de cambio
        if (!pieza.historialCambios) pieza.historialCambios = [];
        pieza.historialCambios.push({
            campo: 'estadoFisico',
            valorAnterior: pieza.estadoFisico,
            valorNuevo: nuevoEstado,
            modificadoPor: currentUser ? currentUser.username : 'desconocido',
            fechaModificacion: new Date().toISOString()
        });
        
        pieza.estadoFisico = nuevoEstado;
        pieza.ultimaModificacion = {
            usuario: currentUser ? currentUser.username : 'desconocido',
            fecha: new Date().toISOString(),
            campo: 'estadoFisico'
        };
        
        this.guardarDatos();
        this.renderizarUniformes();
        Utils.mostrarNotificacion('✅ Estado actualizado', 'success');
    }
    
    buscarUniforme(uniformeId) {
        return this.uniformesEstructural.find(u => u.id === uniformeId) ||
               this.uniformesForestal.find(u => u.id === uniformeId) ||
               this.uniformesRescate.find(u => u.id === uniformeId) ||
               this.uniformesHazmat.find(u => u.id === uniformeId) ||
               this.uniformesTenidaCuartel.find(u => u.id === uniformeId) ||
               this.uniformesAccesorios.find(u => u.id === uniformeId) ||
               this.uniformesParada.find(u => u.id === uniformeId) ||
               this.uniformesUsar.find(u => u.id === uniformeId) ||
               this.uniformesAgreste.find(u => u.id === uniformeId) ||
               this.uniformesUm6.find(u => u.id === uniformeId) ||
               this.uniformesGersa.find(u => u.id === uniformeId);
    }
    
    devolverUniforme(uniformeId) {
        // Para uniformes legacy (Estructural, Forestal, Rescate)
        if (!confirm('¿Está seguro de registrar la devolución de este uniforme?')) return;

        let uniforme = this.uniformesEstructural.find(u => u.id === uniformeId) ||
                      this.uniformesForestal.find(u => u.id === uniformeId) ||
                      this.uniformesRescate.find(u => u.id === uniformeId) ||
                      this.uniformesHazmat.find(u => u.id === uniformeId) ||
                      this.uniformesTenidaCuartel.find(u => u.id === uniformeId) ||
                      this.uniformesAccesorios.find(u => u.id === uniformeId) ||
                      this.uniformesParada.find(u => u.id === uniformeId) ||
                      this.uniformesUsar.find(u => u.id === uniformeId) ||
                      this.uniformesAgreste.find(u => u.id === uniformeId) ||
                      this.uniformesUm6.find(u => u.id === uniformeId) ||
                      this.uniformesGersa.find(u => u.id === uniformeId);
        
        if (uniforme) {
            uniforme.estado = 'devuelto';
            uniforme.fechaDevolucion = new Date().toISOString();
            uniforme.devueltoPor = JSON.parse(localStorage.getItem('currentUser')).username;
            this.guardarDatos();
            this.renderizarUniformes();
            Utils.mostrarNotificacion('✅ Devolución registrada exitosamente', 'success');
        } else {
            Utils.mostrarNotificacion('❌ Error: Uniforme no encontrado', 'error');
        }
    }

    // Función para editar uniforme (solo Super Admin)
    editarUniforme(uniformeId) {
        const uniforme = this.buscarUniforme(uniformeId);
        if (!uniforme) {
            Utils.mostrarNotificacion('❌ Uniforme no encontrado', 'error');
            return;
        }

        // Mostrar modal de edición
        this.mostrarModalEdicionUniforme(uniforme);
    }

    mostrarModalEdicionUniforme(uniforme) {
        const modalHTML = `
            <div id="modalEdicionUniforme" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 9999; overflow-y: auto;">
                <div style="background: white; padding: 30px; border-radius: 10px; max-width: 900px; width: 90%; max-height: 90vh; overflow-y: auto;">
                    <h3 style="margin-top: 0;">✏️ Editar Uniforme ${uniforme.id}</h3>
                    
                    <div style="margin: 20px 0;">
                        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Observaciones Generales:</label>
                        <textarea id="editObservaciones" class="form-control" rows="3" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">${uniforme.observaciones || ''}</textarea>
                    </div>

                    <h4 style="margin-top: 20px; border-bottom: 2px solid #ddd; padding-bottom: 10px;">Artículos del Uniforme</h4>
                    
                    <div id="piezasEdicion">
                        ${uniforme.piezas ? uniforme.piezas.map((pieza, index) => this.renderizarPiezaEdicion(pieza, index)).join('') : '<p>No hay artículos para editar</p>'}
                    </div>
                    
                    <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">
                        <button onclick="document.getElementById('modalEdicionUniforme').remove()" class="btn btn-secondary">❌ Cancelar</button>
                        <button onclick="sistemaUniformes.guardarEdicionUniforme('${uniforme.id}')" class="btn btn-uniforme">✅ Guardar Cambios</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    renderizarPiezaEdicion(pieza, index) {
        const nombrePieza = pieza.nombrePersonalizado || this.formatearNombreComponente(pieza.componente);
        return `
            <div style="border: 1px solid #ddd; padding: 15px; margin-bottom: 15px; border-radius: 8px; background: #f9f9f9;">
                <h5 style="color: #FF6B35; margin-bottom: 10px;">📦 ${nombrePieza}</h5>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Marca / Modelo:</label>
                        <input type="text" id="edit_marca_${index}" class="form-control" value="${pieza.marca || ''}" style="padding: 8px; border: 1px solid #ddd; border-radius: 4px; width: 100%;">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: bold;">N° de Serie:</label>
                        <input type="text" id="edit_serie_${index}" class="form-control" value="${pieza.serie || ''}" style="padding: 8px; border: 1px solid #ddd; border-radius: 4px; width: 100%;">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Talla:</label>
                        <input type="text" id="edit_talla_${index}" class="form-control" value="${pieza.talla || ''}" style="padding: 8px; border: 1px solid #ddd; border-radius: 4px; width: 100%;">
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Condición:</label>
                        <select id="edit_condicion_${index}" class="form-control" style="padding: 8px; border: 1px solid #ddd; border-radius: 4px; width: 100%;">
                            <option value="nuevo" ${pieza.condicion === 'nuevo' ? 'selected' : ''}>🆕 Nuevo</option>
                            <option value="semi-nuevo" ${pieza.condicion === 'semi-nuevo' ? 'selected' : ''}>🔄 Semi-Nuevo</option>
                            <option value="usado" ${pieza.condicion === 'usado' ? 'selected' : ''}>📦 Usado</option>
                        </select>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Estado Físico:</label>
                        <select id="edit_estado_${index}" class="form-control" style="padding: 8px; border: 1px solid #ddd; border-radius: 4px; width: 100%;">
                            <option value="bueno" ${pieza.estadoFisico === 'bueno' ? 'selected' : ''}>✅ Bueno</option>
                            <option value="regular" ${pieza.estadoFisico === 'regular' ? 'selected' : ''}>⚠️ Regular</option>
                            <option value="malo" ${pieza.estadoFisico === 'malo' ? 'selected' : ''}>❌ Malo</option>
                        </select>
                    </div>
                    <div>
                        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Fecha de Entrega:</label>
                        <input type="date" id="edit_fecha_${index}" class="form-control" value="${pieza.fechaEntrega ? pieza.fechaEntrega.split('T')[0] : ''}" style="padding: 8px; border: 1px solid #ddd; border-radius: 4px; width: 100%;">
                    </div>
                </div>
            </div>
        `;
    }

    guardarEdicionUniforme(uniformeId) {
        const uniforme = this.buscarUniforme(uniformeId);
        if (!uniforme) {
            Utils.mostrarNotificacion('❌ Error: Uniforme no encontrado', 'error');
            return;
        }

        // Actualizar observaciones generales
        uniforme.observaciones = document.getElementById('editObservaciones').value;

        // Actualizar cada pieza
        if (uniforme.piezas) {
            uniforme.piezas.forEach((pieza, index) => {
                const marca = document.getElementById(`edit_marca_${index}`);
                const serie = document.getElementById(`edit_serie_${index}`);
                const talla = document.getElementById(`edit_talla_${index}`);
                const condicion = document.getElementById(`edit_condicion_${index}`);
                const estado = document.getElementById(`edit_estado_${index}`);
                const fecha = document.getElementById(`edit_fecha_${index}`);

                if (marca) pieza.marca = marca.value;
                if (serie) pieza.serie = serie.value;
                if (talla) pieza.talla = talla.value;
                if (condicion) pieza.condicion = condicion.value;
                if (estado) pieza.estadoFisico = estado.value;
                if (fecha) pieza.fechaEntrega = fecha.value;
            });
        }

        // Guardar cambios
        this.guardarDatos();
        this.renderizarUniformes();

        // Cerrar modal
        document.getElementById('modalEdicionUniforme').remove();

        Utils.mostrarNotificacion('✅ Uniforme actualizado exitosamente', 'success');
    }

    // Wrapper para generar PDF desde botón individual
    generarPDFPorId(uniformeId) {
        // Buscar en todos los arrays
        const uniforme = this.uniformesEstructural.find(u => u.id === uniformeId) ||
                        this.uniformesForestal.find(u => u.id === uniformeId) ||
                        this.uniformesRescate.find(u => u.id === uniformeId) ||
                        this.uniformesHazmat.find(u => u.id === uniformeId) ||
                        this.uniformesTenidaCuartel.find(u => u.id === uniformeId) ||
                        this.uniformesAccesorios.find(u => u.id === uniformeId) ||
                        this.uniformesParada.find(u => u.id === uniformeId) ||
                        this.uniformesUsar.find(u => u.id === uniformeId) ||
                        this.uniformesAgreste.find(u => u.id === uniformeId) ||
                        this.uniformesUm6.find(u => u.id === uniformeId) ||
                        this.uniformesGersa.find(u => u.id === uniformeId);
        
        if (uniforme) {
            this.generarPDFUniforme(uniforme);
        } else {
            Utils.mostrarNotificacion('Uniforme no encontrado', 'error');
        }
    }

    // Generar PDF para UN SOLO uniforme
    async generarPDFUniforme(uniforme) {
        console.log('Generando PDF para uniforme:', uniforme);
        Utils.mostrarNotificacion('Generando comprobante de entrega...', 'info');

        try {
            if (!window.jspdf) {
                throw new Error('jsPDF no está cargado');
            }
            
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            console.log('jsPDF inicializado correctamente');
            
            // Logo (si existe) - Ajustado para no superponerse
            const logoCompania = localStorage.getItem('logoCompania');
            if (logoCompania) {
                doc.addImage(logoCompania, 'PNG', 15, 8, 28, 28);
            }

            // Determinar color según tipo de uniforme (antes de usarlo)
            let colorPrincipalR, colorPrincipalG, colorPrincipalB;
            
            if (uniforme.tipoUniforme === 'estructural') {
                colorPrincipalR = 255; colorPrincipalG = 152; colorPrincipalB = 0; // Naranja
            } else if (uniforme.tipoUniforme === 'forestal') {
                colorPrincipalR = 76; colorPrincipalG = 175; colorPrincipalB = 80; // Verde
            } else if (uniforme.tipoUniforme === 'rescate') {
                colorPrincipalR = 244; colorPrincipalG = 67; colorPrincipalB = 54; // Rojo
            } else if (uniforme.tipoUniforme === 'hazmat') {
                colorPrincipalR = 255; colorPrincipalG = 235; colorPrincipalB = 59; // Amarillo
            } else if (uniforme.tipoUniforme === 'tenidaCuartel') {
                colorPrincipalR = 33; colorPrincipalG = 150; colorPrincipalB = 243; // Azul
            } else if (uniforme.tipoUniforme === 'accesorios') {
                colorPrincipalR = 156; colorPrincipalG = 39; colorPrincipalB = 176; // Morado
            } else if (uniforme.tipoUniforme === 'parada') {
                colorPrincipalR = 63; colorPrincipalG = 81; colorPrincipalB = 181; // Índigo
            } else if (uniforme.tipoUniforme === 'usar') {
                colorPrincipalR = 255; colorPrincipalG = 87; colorPrincipalB = 34; // Naranja oscuro
            } else if (uniforme.tipoUniforme === 'agreste') {
                colorPrincipalR = 139; colorPrincipalG = 195; colorPrincipalB = 74; // Verde oliva
            } else if (uniforme.tipoUniforme === 'um6') {
                colorPrincipalR = 0; colorPrincipalG = 150; colorPrincipalB = 199; // Azul marítimo
            } else if (uniforme.tipoUniforme === 'gersa') {
                colorPrincipalR = 0; colorPrincipalG = 188; colorPrincipalB = 212; // Cyan (buceo)
            } else {
                colorPrincipalR = 96; colorPrincipalG = 125; colorPrincipalB = 139; // Gris
            }
            
            // Título - Ajustado para no superponerse con logo
            doc.setFontSize(18);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(colorPrincipalR, colorPrincipalG, colorPrincipalB);
            doc.text('REGISTRO DE UNIFORMES ASIGNADOS', 105, 22, { align: 'center' });
            
            // Línea decorativa gruesa
            doc.setDrawColor(colorPrincipalR, colorPrincipalG, colorPrincipalB);
            doc.setLineWidth(1);
            doc.line(15, 40, 195, 40);
            
            doc.setLineWidth(0.3);
            doc.line(15, 42, 195, 42);

            // Información del Voluntario - CON RECUADRO
            let y = 50;
            
            const nombreCompleto = Utils.obtenerNombreCompleto(this.bomberoActual);
            const antiguedad = Utils.calcularAntiguedadDetallada(this.bomberoActual.fechaIngreso);
            
            // Recuadro para datos del voluntario con color del uniforme
            doc.setFillColor(colorPrincipalR + (255-colorPrincipalR)*0.9, 
                            colorPrincipalG + (255-colorPrincipalG)*0.9, 
                            colorPrincipalB + (255-colorPrincipalB)*0.9);
            doc.roundedRect(15, y - 5, 180, 40, 3, 3, 'F');
            doc.setDrawColor(colorPrincipalR, colorPrincipalG, colorPrincipalB);
            doc.setLineWidth(0.5);
            doc.roundedRect(15, y - 5, 180, 40, 3, 3, 'S');
            
            doc.setFontSize(11);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(colorPrincipalR, colorPrincipalG, colorPrincipalB);
            doc.text('DATOS DEL VOLUNTARIO', 20, y + 2);
            
            doc.setFont(undefined, 'normal');
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            y += 10;
            
            doc.setFont(undefined, 'bold');
            doc.text('Nombre:', 20, y);
            doc.setFont(undefined, 'normal');
            doc.text(nombreCompleto, 42, y);
            y += 7;
            
            doc.setFont(undefined, 'bold');
            doc.text('Clave:', 20, y);
            doc.setFont(undefined, 'normal');
            doc.text(this.bomberoActual.claveBombero, 42, y);
            
            doc.setFont(undefined, 'bold');
            doc.text('RUN:', 120, y);
            doc.setFont(undefined, 'normal');
            doc.text(this.bomberoActual.rut, 135, y);
            y += 7;
            
            doc.setFont(undefined, 'bold');
            doc.text('Compañía:', 20, y);
            doc.setFont(undefined, 'normal');
            doc.text(this.bomberoActual.compania, 42, y);
            y += 7;
            
            doc.setFont(undefined, 'bold');
            doc.text('Antigüedad:', 20, y);
            doc.setFont(undefined, 'normal');
            doc.text(`${antiguedad.años} años, ${antiguedad.meses} meses`, 42, y);
            y += 15;

            // Título del uniforme entregado con color específico
            doc.setFontSize(13);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(colorPrincipalR, colorPrincipalG, colorPrincipalB);
            doc.text('UNIFORME ENTREGADO', 15, y);
            y += 10;

            // Generar el uniforme (usar colores ya definidos)
            let tipoNombre, colorNombre;
            
            if (uniforme.tipoUniforme === 'estructural') {
                tipoNombre = 'UNIFORME ESTRUCTURAL';
                colorNombre = 'naranja';
            } else if (uniforme.tipoUniforme === 'forestal') {
                tipoNombre = 'UNIFORME FORESTAL';
                colorNombre = 'verde';
            } else if (uniforme.tipoUniforme === 'rescate') {
                tipoNombre = 'UNIFORME DE RESCATE';
                colorNombre = 'rojo';
            } else if (uniforme.tipoUniforme === 'hazmat') {
                tipoNombre = 'UNIFORME HAZMAT';
                colorNombre = 'amarillo';
            } else if (uniforme.tipoUniforme === 'tenidaCuartel') {
                tipoNombre = 'TENIDA DE CUARTEL';
                colorNombre = 'azul';
            } else if (uniforme.tipoUniforme === 'accesorios') {
                tipoNombre = 'ACCESORIOS';
                colorNombre = 'morado';
            } else if (uniforme.tipoUniforme === 'parada') {
                tipoNombre = 'UNIFORME DE PARADA';
                colorNombre = 'índigo';
            } else if (uniforme.tipoUniforme === 'usar') {
                tipoNombre = 'UNIFORME USAR';
                colorNombre = 'naranja oscuro';
            } else if (uniforme.tipoUniforme === 'agreste') {
                tipoNombre = 'UNIFORME AGRESTE';
                colorNombre = 'verde oliva';
            } else if (uniforme.tipoUniforme === 'um6') {
                tipoNombre = 'UNIFORME UM-6 (MARÍTIMO)';
                colorNombre = 'azul marítimo';
            } else if (uniforme.tipoUniforme === 'gersa') {
                tipoNombre = 'UNIFORME GERSA (BUCEO)';
                colorNombre = 'cyan';
            } else {
                tipoNombre = 'UNIFORME';
                colorNombre = 'gris';
            }
            
            console.log(`Generando PDF de ${tipoNombre} con color ${colorNombre}`);
            
            // Barra superior con tipo y COLOR ESPECÍFICO
            doc.setFillColor(colorPrincipalR, colorPrincipalG, colorPrincipalB);
            doc.roundedRect(15, y, 180, 8, 2, 2, 'F');
            
            doc.setFontSize(10);
            doc.setTextColor(255, 255, 255);
            doc.setFont(undefined, 'bold');
            doc.text(tipoNombre, 20, y + 5.5);
            
            y += 12;
            
            // ID del uniforme
            doc.setFontSize(8);
            doc.setTextColor(100, 100, 100);
            doc.setFont(undefined, 'normal');
            doc.text(`ID Uniforme: ${uniforme.id}`, 20, y);
            y += 6;
            
            // AHORA MOSTRAR LAS PIEZAS
            if (uniforme.piezas && uniforme.piezas.length > 0) {
                doc.setFontSize(9);
                doc.setTextColor(0, 0, 0);
                
                uniforme.piezas.forEach((pieza, index) => {
                    // Recuadro para cada pieza
                    const alturaPieza = 28;
                    doc.setFillColor(250, 250, 250);
                    doc.roundedRect(15, y, 180, alturaPieza, 2, 2, 'F');
                    doc.setDrawColor(220, 220, 220);
                    doc.setLineWidth(0.3);
                    doc.roundedRect(15, y, 180, alturaPieza, 2, 2, 'S');
                    
                    y += 5;
                    
                    // Nombre del componente
                    const nombreComponente = pieza.nombrePersonalizado || this.formatearNombreComponente(pieza.componente);
                    doc.setFont(undefined, 'bold');
                    doc.setTextColor(colorPrincipalR, colorPrincipalG, colorPrincipalB);
                    doc.text(`${index + 1}. ${nombreComponente}`, 20, y);
                    
                    y += 5;
                    doc.setFont(undefined, 'normal');
                    doc.setTextColor(0, 0, 0);
                    
                    // Marca y Serie
                    doc.text(`Marca: ${pieza.marca || 'N/A'}`, 20, y);
                    if (pieza.serie) {
                        doc.text(`| Serie: ${pieza.serie}`, 70, y);
                    }
                    if (pieza.talla) {
                        doc.text(`| Talla: ${pieza.talla}`, 120, y);
                    }
                    y += 5;
                    
                    // Condición y Estado
                    const condicionMap = {
                        'nuevo': 'Nuevo',
                        'semi-nuevo': 'Semi-Nuevo',
                        'usado': 'Usado'
                    };
                    const estadoMap = {
                        'bueno': 'Bueno',
                        'regular': 'Regular',
                        'malo': 'Malo'
                    };
                    const condicionTexto = condicionMap[pieza.condicion] || pieza.condicion;
                    const estadoTexto = estadoMap[pieza.estadoFisico] || pieza.estadoFisico;
                    
                    doc.setFontSize(8);
                    doc.setTextColor(100, 100, 100);
                    doc.text(`Condición: ${condicionTexto} | Estado: ${estadoTexto} | F. Entrega: ${Utils.formatearFecha(pieza.fechaEntrega)}`, 20, y);
                    
                    y += alturaPieza - 10;
                });
            } else {
                // Uniformes legacy sin piezas (compatibilidad)
                doc.setFontSize(9);
                doc.setTextColor(150, 150, 150);
                doc.text('(Uniforme registrado con formato anterior)', 20, y);
                y += 6;
            }
            
            y += 5;
            
            // Observaciones generales
            if (uniforme.observaciones) {
                doc.setFontSize(9);
                doc.setFont(undefined, 'bold');
                doc.setTextColor(0, 0, 0);
                doc.text('Observaciones: ', 20, y);
                doc.setFont(undefined, 'normal');
                doc.text(uniforme.observaciones, 52, y);
                y += 6;
            }

            // Verificar si necesita nueva página antes de firmas
            if (y > 200) {
                doc.addPage();
                y = 20;
            }
            
            // Línea de separación final con color del uniforme
            doc.setDrawColor(colorPrincipalR, colorPrincipalG, colorPrincipalB);
            doc.setLineWidth(0.8);
            doc.line(15, y, 195, y);
            
            y += 10;

            // Declaración
            doc.setFillColor(255, 248, 225);
            doc.roundedRect(15, y, 180, 22, 3, 3, 'F');
            doc.setDrawColor(255, 193, 7);
            doc.setLineWidth(0.5);
            doc.roundedRect(15, y, 180, 22, 3, 3, 'S');
            
            doc.setFontSize(9);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(colorPrincipalR, colorPrincipalG, colorPrincipalB);
            doc.text('DECLARACIÓN:', 20, y + 6);
            
            doc.setFont(undefined, 'normal');
            doc.setFontSize(8);
            doc.setTextColor(0, 0, 0);
            doc.text('Declaro haber recibido los uniformes detallados anteriormente en buen estado,', 20, y + 12);
            doc.text('comprometiéndome a su correcto uso y conservación.', 20, y + 17);
            
            y += 30;

            // Sección de firmas
            const xIzq = 30;
            const xDer = 130;
            
            // Título de firmas
            doc.setFontSize(8);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(100, 100, 100);
            doc.text('FIRMAS Y AUTORIZACIONES', 105, y, { align: 'center' });
            
            y += 8;
            
            // Firma izquierda - Voluntario
            doc.setDrawColor(100, 100, 100);
            doc.setLineWidth(0.5);
            doc.line(xIzq, y, xIzq + 60, y);
            
            doc.setFontSize(9);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(0, 0, 0);
            doc.text('Firma del Voluntario', xIzq + 15, y + 5);
            doc.setFont(undefined, 'normal');
            doc.setFontSize(8);
            doc.setTextColor(80, 80, 80);
            doc.text(`Documento: ${nombreCompleto}`, xIzq, y + 10);
            doc.text(`RUN: ${this.bomberoActual.rut}`, xIzq, y + 15);
            
            // Firma derecha - Autoridad
            doc.setDrawColor(100, 100, 100);
            doc.setLineWidth(0.5);
            doc.line(xDer, y, xDer + 60, y);
            
            doc.setFontSize(9);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(0, 0, 0);
            doc.text('Firma y Timbre', xDer + 18, y + 5);
            doc.setFont(undefined, 'normal');
            doc.setFontSize(8);
            doc.setTextColor(80, 80, 80);
            doc.text('Capitanía / Autoridad', xDer + 15, y + 10);
            doc.text('Fecha: ______________', xDer + 13, y + 15);

            // Footer en todas las páginas
            const totalPaginas = doc.internal.pages.length - 1;
            const fechaGeneracion = new Date().toLocaleDateString('es-CL', { 
                day: '2-digit', 
                month: 'long', 
                year: 'numeric' 
            });
            
            for (let i = 1; i <= totalPaginas; i++) {
                doc.setPage(i);
                
                // Línea superior del footer con color del uniforme
                doc.setDrawColor(colorPrincipalR, colorPrincipalG, colorPrincipalB);
                doc.setLineWidth(0.3);
                doc.line(15, 285, 195, 285);
                
                // Texto del footer
                doc.setFontSize(7);
                doc.setTextColor(120, 120, 120);
                doc.setFont(undefined, 'normal');
                doc.text(`Documento generado el ${fechaGeneracion}`, 15, 289);
                
                doc.setFont(undefined, 'bold');
                doc.text(`Página ${i} de ${totalPaginas}`, 195, 289, { align: 'right' });
                
                doc.setFont(undefined, 'italic');
                doc.setFontSize(6);
                doc.text('Sistema de Registro de Uniformes - Proyecto SEIS', 105, 293, { align: 'center' });
            }

            // Descargar PDF
            const fecha = new Date().toISOString().split('T')[0];
            const nombreArchivo = `Comprobante_Uniforme_${this.bomberoActual.claveBombero}_${fecha}.pdf`;
            
            console.log('Guardando PDF con nombre:', nombreArchivo);
            doc.save(nombreArchivo);
            console.log('PDF guardado exitosamente');
            
            Utils.mostrarNotificacion('✅ Comprobante de entrega generado', 'success');
        } catch (error) {
            console.error('❌ Error al generar PDF:', error);
            console.error('Stack trace:', error.stack);
            Utils.mostrarNotificacion('Error al generar PDF: ' + error.message, 'error');
        }
    }

    // ==================== NUEVOS FORMULARIOS ====================
    
    generarFormularioHazmat() {
        return `
            <h3>☣️ Uniforme Hazmat</h3>
            <button type="button" class="btn btn-secondary" onclick="sistemaUniformes.volverATipos()" style="margin-bottom: 20px;">
                ← Volver a Tipos
            </button>
            
            <form id="formUniformeEspecifico">
                <input type="hidden" name="tipoUniforme" value="hazmat">
                <input type="hidden" name="bomberoId" value="${this.bomberoActual.id}">
                
                <div id="piezasContainer"></div>
                
                <button type="button" class="btn btn-secondary" onclick="sistemaUniformes.agregarPieza('hazmat')" style="margin: 20px 0;">
                    ➕ Agregar otro artículo
                </button>

                <div class="form-group">
                    <label for="observaciones">Observaciones Generales</label>
                    <textarea id="observaciones" name="observaciones" rows="3" placeholder="Observaciones adicionales sobre la entrega..."></textarea>
                </div>

                <div class="buttons">
                    <button type="submit" class="btn btn-uniforme">✅ Registrar Entrega</button>
                    <button type="button" class="btn btn-danger" onclick="sistemaUniformes.volverAlSistema()">❌ Cancelar</button>
                </div>
            </form>
        `;
    }

    generarFormularioTenidaCuartel() {
        return `
            <h3>🏠 Tenida de Cuartel</h3>
            <button type="button" class="btn btn-secondary" onclick="sistemaUniformes.volverATipos()" style="margin-bottom: 20px;">
                ← Volver a Tipos
            </button>
            
            <form id="formUniformeEspecifico">
                <input type="hidden" name="tipoUniforme" value="tenidaCuartel">
                <input type="hidden" name="bomberoId" value="${this.bomberoActual.id}">
                
                <div id="piezasContainer"></div>
                
                <button type="button" class="btn btn-secondary" onclick="sistemaUniformes.agregarPieza('tenidaCuartel')" style="margin: 20px 0;">
                    ➕ Agregar otro artículo
                </button>

                <div class="form-group">
                    <label for="observaciones">Observaciones Generales</label>
                    <textarea id="observaciones" name="observaciones" rows="3" placeholder="Observaciones adicionales sobre la entrega..."></textarea>
                </div>

                <div class="buttons">
                    <button type="submit" class="btn btn-uniforme">✅ Registrar Entrega</button>
                    <button type="button" class="btn btn-danger" onclick="sistemaUniformes.volverAlSistema()">❌ Cancelar</button>
                </div>
            </form>
        `;
    }

    generarFormularioAccesorios() {
        return `
            <h3>🎒 Accesorios</h3>
            <button type="button" class="btn btn-secondary" onclick="sistemaUniformes.volverATipos()" style="margin-bottom: 20px;">
                ← Volver a Tipos
            </button>
            
            <form id="formUniformeEspecifico">
                <input type="hidden" name="tipoUniforme" value="accesorios">
                <input type="hidden" name="bomberoId" value="${this.bomberoActual.id}">
                
                <div id="piezasContainer"></div>
                
                <button type="button" class="btn btn-secondary" onclick="sistemaUniformes.agregarPieza('accesorios')" style="margin: 20px 0;">
                    ➕ Agregar otro artículo
                </button>

                <div class="form-group">
                    <label for="observaciones">Observaciones Generales</label>
                    <textarea id="observaciones" name="observaciones" rows="3" placeholder="Observaciones adicionales sobre la entrega..."></textarea>
                </div>

                <div class="buttons">
                    <button type="submit" class="btn btn-uniforme">✅ Registrar Entrega</button>
                    <button type="button" class="btn btn-danger" onclick="sistemaUniformes.volverAlSistema()">❌ Cancelar</button>
                </div>
            </form>
        `;
    }

    generarFormularioParada() {
        return `
            <h3>🎖️ Uniforme de Parada</h3>
            <button type="button" class="btn btn-secondary" onclick="sistemaUniformes.volverATipos()" style="margin-bottom: 20px;">
                ← Volver a Tipos
            </button>
            
            <form id="formUniformeEspecifico">
                <input type="hidden" name="tipoUniforme" value="parada">
                <input type="hidden" name="bomberoId" value="${this.bomberoActual.id}">
                
                <div id="piezasContainer"></div>
                
                <button type="button" class="btn btn-secondary" onclick="sistemaUniformes.agregarPieza('parada')" style="margin: 20px 0;">
                    ➕ Agregar otro artículo
                </button>

                <div class="form-group">
                    <label for="observaciones">Observaciones Generales</label>
                    <textarea id="observaciones" name="observaciones" rows="3" placeholder="Observaciones adicionales sobre la entrega..."></textarea>
                </div>

                <div class="buttons">
                    <button type="submit" class="btn btn-uniforme">✅ Registrar Entrega</button>
                    <button type="button" class="btn btn-danger" onclick="sistemaUniformes.volverAlSistema()">❌ Cancelar</button>
                </div>
            </form>
        `;
    }

    generarFormularioUsar() {
        return `
            <h3>🚨 Uniforme USAR (Urban Search and Rescue)</h3>
            <button type="button" class="btn btn-secondary" onclick="sistemaUniformes.volverATipos()" style="margin-bottom: 20px;">
                ← Volver a Tipos
            </button>
            
            <form id="formUniformeEspecifico">
                <input type="hidden" name="tipoUniforme" value="usar">
                <input type="hidden" name="bomberoId" value="${this.bomberoActual.id}">
                
                <div id="piezasContainer"></div>
                
                <button type="button" class="btn btn-secondary" onclick="sistemaUniformes.agregarPieza('usar')" style="margin: 20px 0;">
                    ➕ Agregar otro artículo
                </button>

                <div class="form-group">
                    <label for="observaciones">Observaciones Generales</label>
                    <textarea id="observaciones" name="observaciones" rows="3" placeholder="Observaciones adicionales sobre la entrega..."></textarea>
                </div>

                <div class="buttons">
                    <button type="submit" class="btn btn-uniforme">✅ Registrar Entrega</button>
                    <button type="button" class="btn btn-danger" onclick="sistemaUniformes.volverAlSistema()">❌ Cancelar</button>
                </div>
            </form>
        `;
    }

    generarFormularioAgreste() {
        return `
            <h3>🌾 Uniforme AGRESTE (Materiales Peligrosos)</h3>
            <button type="button" class="btn btn-secondary" onclick="sistemaUniformes.volverATipos()" style="margin-bottom: 20px;">
                ← Volver a Tipos
            </button>
            
            <form id="formUniformeEspecifico">
                <input type="hidden" name="tipoUniforme" value="agreste">
                <input type="hidden" name="bomberoId" value="${this.bomberoActual.id}">
                
                <div id="piezasContainer"></div>
                
                <button type="button" class="btn btn-secondary" onclick="sistemaUniformes.agregarPieza('agreste')" style="margin: 20px 0;">
                    ➕ Agregar otro artículo
                </button>

                <div class="form-group">
                    <label for="observaciones">Observaciones Generales</label>
                    <textarea id="observaciones" name="observaciones" rows="3" placeholder="Observaciones adicionales sobre la entrega..."></textarea>
                </div>

                <div class="buttons">
                    <button type="submit" class="btn btn-uniforme">✅ Registrar Entrega</button>
                    <button type="button" class="btn btn-danger" onclick="sistemaUniformes.volverAlSistema()">❌ Cancelar</button>
                </div>
            </form>
        `;
    }

    generarFormularioUm6() {
        return `
            <h3>⚓ Uniforme UM-6 (Marítimo)</h3>
            <button type="button" class="btn btn-secondary" onclick="sistemaUniformes.volverATipos()" style="margin-bottom: 20px;">
                ← Volver a Tipos
            </button>
            
            <form id="formUniformeEspecifico">
                <input type="hidden" name="tipoUniforme" value="um6">
                <input type="hidden" name="bomberoId" value="${this.bomberoActual.id}">
                
                <div id="piezasContainer"></div>
                
                <button type="button" class="btn btn-secondary" onclick="sistemaUniformes.agregarPieza('um6')" style="margin: 20px 0;">
                    ➕ Agregar otro artículo
                </button>

                <div class="form-group">
                    <label for="observaciones">Observaciones Generales</label>
                    <textarea id="observaciones" name="observaciones" rows="3" placeholder="Observaciones adicionales sobre la entrega..."></textarea>
                </div>

                <div class="buttons">
                    <button type="submit" class="btn btn-uniforme">✅ Registrar Entrega</button>
                    <button type="button" class="btn btn-danger" onclick="sistemaUniformes.volverAlSistema()">❌ Cancelar</button>
                </div>
            </form>
        `;
    }

    generarFormularioGersa() {
        return `
            <h3>🤿 Uniforme GERSA (Buceo - Rescate Acuático)</h3>
            <button type="button" class="btn btn-secondary" onclick="sistemaUniformes.volverATipos()" style="margin-bottom: 20px;">
                ← Volver a Tipos
            </button>
            
            <form id="formUniformeEspecifico">
                <input type="hidden" name="tipoUniforme" value="gersa">
                <input type="hidden" name="bomberoId" value="${this.bomberoActual.id}">
                
                <div id="piezasContainer"></div>
                
                <button type="button" class="btn btn-secondary" onclick="sistemaUniformes.agregarPieza('gersa')" style="margin: 20px 0;">
                    ➕ Agregar otro artículo
                </button>

                <div class="form-group">
                    <label for="observaciones">Observaciones Generales</label>
                    <textarea id="observaciones" name="observaciones" rows="3" placeholder="Observaciones adicionales sobre la entrega..."></textarea>
                </div>

                <div class="buttons">
                    <button type="submit" class="btn btn-uniforme">✅ Registrar Entrega</button>
                    <button type="button" class="btn btn-danger" onclick="sistemaUniformes.volverAlSistema()">❌ Cancelar</button>
                </div>
            </form>
        `;
    }

    toggleOtroArticulo(selectId, containerIdocultar) {
        const select = document.getElementById(selectId);
        const container = document.getElementById(containerIdocultar);
        const input = container ? container.querySelector('input') : null;
        
        if (select && container) {
            if (select.value === 'otro') {
                container.style.display = 'block';
                if (input) input.required = true;
            } else {
                container.style.display = 'none';
                if (input) {
                    input.required = false;
                    input.value = '';
                }
            }
        }
    }

    // ==================== GESTIÓN DE PIEZAS DINÁMICAS ====================
    
    agregarPieza(tipo) {
        if (!this.contadorPiezas) this.contadorPiezas = 0;
        this.contadorPiezas++;
        const piezaId = `pieza_${this.contadorPiezas}`;
        
        const container = document.getElementById('piezasContainer');
        if (!container) return;
        
        const opcionesComponente = this.obtenerOpcionesComponente(tipo);
        const incluyeTalla = tipo !== 'accesorios';
        const cantidadPiezas = document.querySelectorAll('.pieza-uniforme').length + 1;
        
        const piezaHTML = `
            <div class="form-section pieza-uniforme" id="${piezaId}" style="position: relative; border: 2px solid #e0e0e0; border-radius: 8px; padding: 20px; margin-bottom: 20px; background: #f9f9f9;">
                <button type="button" class="btn btn-danger btn-sm" onclick="sistemaUniformes.eliminarPieza('${piezaId}')" 
                        style="position: absolute; top: 10px; right: 10px;" ${cantidadPiezas === 1 ? 'disabled' : ''}>
                    ❌ Eliminar
                </button>
                
                <h4 style="color: #FF6B35; margin-bottom: 15px;">📦 Artículo #${this.contadorPiezas}</h4>
                
                <div class="form-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                    <div class="form-group">
                        <label class="required">${tipo === 'accesorios' ? 'Tipo de Accesorio' : 'Artículo'}</label>
                        <select name="componente_${piezaId}" class="form-control" required onchange="sistemaUniformes.toggleOtroPieza('${piezaId}')">
                            ${opcionesComponente}
                        </select>
                    </div>
                    
                    <div class="form-group" id="otro_${piezaId}" style="display: none;">
                        <label class="required">Nombre del Artículo</label>
                        <input type="text" name="nombrePersonalizado_${piezaId}" class="form-control" placeholder="Nombre personalizado">
                    </div>
                    
                    <div class="form-group">
                        <label>Marca / Modelo</label>
                        <input type="text" name="marca_${piezaId}" class="form-control" placeholder="Ej: Lion, Rosenbauer">
                    </div>
                    
                    <div class="form-group">
                        <label>N° de Serie</label>
                        <input type="text" name="serie_${piezaId}" class="form-control" placeholder="Ej: HAZ-123">
                    </div>
                    
                    ${incluyeTalla ? `
                    <div class="form-group">
                        <label>Talla</label>
                        <input type="text" name="talla_${piezaId}" class="form-control" placeholder="Ej: M, L, XL">
                    </div>
                    ` : ''}
                    
                    <div class="form-group">
                        <label class="required">Condición</label>
                        <select name="condicion_${piezaId}" class="form-control" required>
                            <option value="">Seleccione...</option>
                            <option value="nuevo">🆕 Nuevo</option>
                            <option value="semi-nuevo">🔄 Semi-Nuevo</option>
                            <option value="usado">📦 Usado</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label class="required">Estado Físico</label>
                        <select name="estadoFisico_${piezaId}" class="form-control" required>
                            <option value="">Seleccione...</option>
                            <option value="bueno">✅ Bueno</option>
                            <option value="regular">⚠️ Regular</option>
                            <option value="malo">❌ Malo</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label class="required">Fecha de Entrega</label>
                        <input type="date" name="fechaEntrega_${piezaId}" class="form-control" required value="${new Date().toISOString().split('T')[0]}">
                    </div>
                </div>
            </div>
        `;
        
        container.insertAdjacentHTML('beforeend', piezaHTML);
    }
    
    eliminarPieza(piezaId) {
        const piezas = document.querySelectorAll('.pieza-uniforme');
        if (piezas.length <= 1) {
            Utils.mostrarNotificacion('⚠️ Debe haber al menos un artículo', 'warning');
            return;
        }
        
        const pieza = document.getElementById(piezaId);
        if (pieza) {
            pieza.remove();
            // Renumerar las piezas restantes
            this.renumerarPiezas();
            // Actualizar botones de eliminar
            this.actualizarBotonesEliminar();
        }
    }
    
    actualizarBotonesEliminar() {
        const piezas = document.querySelectorAll('.pieza-uniforme');
        const botones = document.querySelectorAll('.pieza-uniforme button[onclick*="eliminarPieza"]');
        
        botones.forEach(boton => {
            if (piezas.length === 1) {
                boton.disabled = true;
            } else {
                boton.disabled = false;
            }
        });
    }
    
    renumerarPiezas() {
        const piezas = document.querySelectorAll('.pieza-uniforme h4');
        piezas.forEach((h4, index) => {
            h4.textContent = `📦 Artículo #${index + 1}`;
        });
    }
    
    toggleOtroPieza(piezaId) {
        const select = document.querySelector(`[name="componente_${piezaId}"]`);
        const otroContainer = document.getElementById(`otro_${piezaId}`);
        const otroInput = document.querySelector(`[name="nombrePersonalizado_${piezaId}"]`);
        
        if (select && otroContainer && otroInput) {
            if (select.value === 'otro') {
                otroContainer.style.display = 'block';
                otroInput.required = true;
            } else {
                otroContainer.style.display = 'none';
                otroInput.required = false;
                otroInput.value = '';
            }
        }
    }
    
    obtenerOpcionesComponente(tipo) {
        const opciones = {
            'estructural': `
                <option value="jardinera">Jardinera Estructural</option>
                <option value="chaqueta">Chaqueta Estructural</option>
                <option value="guantes">Guantes Estructurales</option>
                <option value="botas">Botas Estructurales</option>
                <option value="casco">Casco Estructural</option>
                <option value="esclavina">Esclavina Estructural</option>
                <option value="otro">Otro</option>
            `,
            'forestal': `
                <option value="jardinera">Jardinera Forestal</option>
                <option value="chaqueta">Chaqueta Forestal</option>
                <option value="guantes">Guantes Forestales</option>
                <option value="botas">Botas Forestales</option>
                <option value="casco">Casco Forestal</option>
                <option value="esclavina">Esclavina Forestal</option>
                <option value="otro">Otro</option>
            `,
            'rescate': `
                <option value="jardinera">Jardinera de Rescate</option>
                <option value="chaqueta">Chaqueta de Rescate</option>
                <option value="guantes">Guantes de Rescate</option>
                <option value="botas">Botas de Rescate</option>
                <option value="casco">Casco de Rescate</option>
                <option value="esclavina">Esclavina de Rescate</option>
                <option value="otro">Otro</option>
            `,
            'hazmat': `
                <option value="casaca_multi_rol">Casaca Multi Rol</option>
                <option value="pantalon_multi_rol">Pantalón Multi Rol</option>
                <option value="botas">Botas</option>
                <option value="casco">Casco Hazmat</option>
                <option value="guantes">Guantes Hazmat</option>
                <option value="esclavina">Esclavina</option>
                <option value="otro">Otro</option>
            `,
            'tenidaCuartel': `
                <option value="polera_institucional_cia">Polera Institucional de Cía.</option>
                <option value="poleron_institucional_cia">Polerón Institucional de Cía.</option>
                <option value="casaca_institucional_cia">Casaca Institucional de Cía.</option>
                <option value="pantalon_institucional_cia">Pantalón Institucional de Cía.</option>
                <option value="otro">Otro</option>
            `,
            'accesorios': `
                <option value="radio_portatil">Radio Portátil</option>
                <option value="cargador">Cargador</option>
                <option value="bateria_adicional">Batería Adicional</option>
                <option value="linterna">Linterna</option>
                <option value="otro">Otro</option>
            `,
            'parada': `
                <option value="casaca">Casaca</option>
                <option value="pantalon_negro">Pantalón Negro</option>
                <option value="pantalon_blanco">Pantalón Blanco</option>
                <option value="cinturon_negro">Cinturón Negro</option>
                <option value="cinturon_blanco">Cinturón Blanco</option>
                <option value="otro">Otro</option>
            `,
            'usar': `
                <option value="casaca_multi_rol">Casaca Multi Rol</option>
                <option value="pantalon_multi_rol">Pantalón Multi Rol</option>
                <option value="botas">Botas</option>
                <option value="casco">Casco USAR</option>
                <option value="guantes">Guantes USAR</option>
                <option value="otro">Otro</option>
            `,
            'agreste': `
                <option value="casaca_multi_rol">Casaca Multi Rol</option>
                <option value="pantalon_multi_rol">Pantalón Multi Rol</option>
                <option value="botas">Botas</option>
                <option value="casco">Casco AGRESTE</option>
                <option value="guantes">Guantes AGRESTE</option>
                <option value="otro">Otro</option>
            `,
            'um6': `
                <option value="casaca_multi_rol">Casaca Multi Rol</option>
                <option value="pantalon_multi_rol">Pantalón Multi Rol</option>
                <option value="botas">Botas</option>
                <option value="casco">Casco UM-6</option>
                <option value="guantes">Guantes UM-6</option>
                <option value="chaleco_salvavidas">Chaleco Salvavidas</option>
                <option value="otro">Otro</option>
            `,
            'gersa': `
                <option value="traje_buceo">Traje de Buceo</option>
                <option value="aletas">Aletas</option>
                <option value="mascara">Máscara</option>
                <option value="regulador">Regulador</option>
                <option value="tanque_oxigeno">Tanque de Oxígeno</option>
                <option value="chaleco_compensador">Chaleco Compensador</option>
                <option value="otro">Otro</option>
            `
        };
        
        return opciones[tipo] || '';
    }

    volverAlSistema() {
        window.location.href = 'sistema.html';
    }
}

// Inicializar sistema
let sistemaUniformes;
document.addEventListener('DOMContentLoaded', () => {
    sistemaUniformes = new SistemaUniformes();
});
