// ==================== SISTEMA DE CARGOS ====================
class SistemaCargos {
    constructor() {
        this.bomberoActual = null;
        this.cargos = [];
        this.init();
    }

    async init() {
        // Verificar autenticación
        if (!checkAuth()) {
            window.location.href = 'index.html';
            return;
        }

        // Cargar datos del bombero
        await this.cargarBomberoActual();
        
        // Cargar cargos
        this.cargos = storage.getCargos();
        
        // Configurar interfaz
        this.configurarInterfaz();
        
        // Renderizar cargos
        this.renderizarCargos();
    }

    async cargarBomberoActual() {
        const bomberoId = localStorage.getItem('bomberoCargoActual');
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
        const contenedor = document.getElementById('bomberoDatosCargos');
        const antiguedad = Utils.calcularAntiguedadDetallada(this.bomberoActual.fechaIngreso);
        const estadoBadge = Utils.obtenerBadgeEstado(this.bomberoActual.estadoBombero);
        
        // Validar si puede recibir cargos
        const validacion = Utils.puedeRecibirCargosOFelicitaciones(this.bomberoActual);
        if (!validacion.puede) {
            contenedor.innerHTML = `
                <div style="background: #fee2e2; border-left: 4px solid #dc2626; padding: 20px; border-radius: 8px;">
                    <h3 style="color: #dc2626; margin-top: 0;">⚠️ No se pueden asignar cargos</h3>
                    <p style="color: #991b1b; margin: 10px 0; font-size: 16px;">${validacion.mensaje}</p>
                    <p style="color: #666; margin: 0;">Solo se puede consultar el historial de cargos de este voluntario.</p>
                </div>
            `;
            
            // Deshabilitar formulario
            const formulario = document.getElementById('formCargo');
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
            <div><strong>Nombre Completo:</strong> <span>${Utils.obtenerNombreCompleto(this.bomberoActual)}</span></div>
            <div><strong>Clave Bombero:</strong> <span>${this.bomberoActual.claveBombero || 'N/A'}</span></div>
            <div><strong>RUN:</strong> <span>${this.bomberoActual.rut || this.bomberoActual.run}</span></div>
            <div><strong>Compañía:</strong> <span>${this.bomberoActual.compania}</span></div>
            <div><strong>Estado:</strong> <span style="font-weight: bold;">${estadoBadge}</span></div>
            <div><strong>Antigüedad:</strong> <span>${antiguedad.años} años, ${antiguedad.meses} meses</span></div>
            <div><strong>Fecha Ingreso:</strong> <span>${Utils.formatearFecha(this.bomberoActual.fechaIngreso)}</span></div>
        `;

        document.getElementById('bomberoCargoId').value = this.bomberoActual.id;
    }
    subirLogo() {
    const input = document.getElementById('inputLogoCompania');
    
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        // Validar que sea imagen
        if (!file.type.match('image.*')) {
            Utils.mostrarNotificacion('Por favor selecciona una imagen válida', 'error');
            return;
        }
        
        // Validar tamaño (máximo 2MB)
        if (file.size > 2 * 1024 * 1024) {
            Utils.mostrarNotificacion('La imagen es muy grande. Máximo 2MB', 'error');
            return;
        }
        
        // Leer imagen como base64
        const reader = new FileReader();
        reader.onload = (event) => {
            const logoBase64 = event.target.result;
            
            // Guardar en localStorage
            localStorage.setItem('logoCompania', logoBase64);
            
            Utils.mostrarNotificacion('Logo subido exitosamente', 'success');
            
            // Mostrar preview (opcional)
            this.mostrarPreviewLogo(logoBase64);
        };
        
        reader.onerror = () => {
            Utils.mostrarNotificacion('Error al cargar la imagen', 'error');
        };
        
        reader.readAsDataURL(file);
    };
    
    // Abrir selector de archivos
    input.click();
}

mostrarPreviewLogo(logoBase64) {
    // Buscar si ya existe el preview
    let preview = document.getElementById('logoPreview');
    
    if (!preview) {
        // Crear contenedor de preview
        preview = document.createElement('div');
        preview.id = 'logoPreview';
        preview.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            padding: 15px;
            border-radius: 10px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 1000;
            text-align: center;
        `;
        
        preview.innerHTML = `
            <p style="margin: 0 0 10px; font-weight: bold; color: #333;">Logo de la Compañía</p>
            <img id="logoPreviewImg" style="max-width: 100px; max-height: 100px; border-radius: 5px;" />
            <button onclick="cargosSistema.eliminarLogo()" style="
                margin-top: 10px;
                padding: 5px 15px;
                background: #f44336;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-size: 12px;
            ">🗑️ Eliminar Logo</button>
        `;
        
        document.body.appendChild(preview);
    }
    
    // Actualizar imagen
    document.getElementById('logoPreviewImg').src = logoBase64;
}

eliminarLogo() {
    if (confirm('¿Seguro que deseas eliminar el logo?')) {
        localStorage.removeItem('logoCompania');
        
        const preview = document.getElementById('logoPreview');
        if (preview) {
            preview.remove();
        }
        
        Utils.mostrarNotificacion('Logo eliminado', 'info');
    }
}

    // ==================== SELECTOR DE CARGO ====================
    seleccionarCargo(tipo) {
        const cargoComandancia = document.getElementById('cargoComandancia');
        const cargoCompania = document.getElementById('cargoCompania');
        const cargoConsejo = document.getElementById('cargoConsejo');
        const cargoTecnico = document.getElementById('cargoTecnico');
        const tipoCargo = document.getElementById('tipoCargo');
        
        if (tipo === 'comandancia') {
            cargoCompania.value = '';
            cargoConsejo.value = '';
            cargoTecnico.value = '';
            tipoCargo.value = cargoComandancia.value;
        } else if (tipo === 'compania') {
            cargoComandancia.value = '';
            cargoConsejo.value = '';
            cargoTecnico.value = '';
            tipoCargo.value = cargoCompania.value;
        } else if (tipo === 'consejo') {
            cargoComandancia.value = '';
            cargoCompania.value = '';
            cargoTecnico.value = '';
            tipoCargo.value = cargoConsejo.value;
        } else if (tipo === 'tecnico') {
            cargoComandancia.value = '';
            cargoCompania.value = '';
            cargoConsejo.value = '';
            tipoCargo.value = cargoTecnico.value;
        }
    }

    configurarInterfaz() {
        // Configurar formulario
        document.getElementById('formCargo').addEventListener('submit', (e) => {
            this.manejarSubmitFormulario(e);
        });

        // Configurar año actual por defecto
        document.getElementById('añoCargo').value = new Date().getFullYear();
    }

async manejarSubmitFormulario(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const datos = Object.fromEntries(formData);
    
    console.log('🔍 DEBUG: Datos recibidos del formulario:', datos);
    console.log('🔍 cargoIdEditando:', datos.cargoIdEditando);
    
    const errores = this.validarDatosCargo(datos);

    if (errores.length > 0) {
        Utils.mostrarNotificacion('Errores: ' + errores.join(', '), 'error');
        return;
    }

    try {
        await this.guardarCargo(datos);
        const mensaje = datos.cargoIdEditando && datos.cargoIdEditando !== '' ? 
            'Cargo actualizado exitosamente' : 
            'Cargo registrado exitosamente';
        Utils.mostrarNotificacion(mensaje, 'success');
        this.limpiarFormulario();
        this.renderizarCargos();
    } catch (error) {
        Utils.mostrarNotificacion(error.message, 'error');
    }
}

    validarDatosCargo(datos) {
        const errores = [];
        
        const tieneAño = datos.añoCargo && datos.añoCargo.trim();
        const tieneCargo = datos.tipoCargo && datos.tipoCargo.trim();
        const tieneDesde = datos.fechaInicioCargo && datos.fechaInicioCargo.trim();

        if (!tieneAño && !tieneCargo && !tieneDesde) {
            errores.push('Debe completar al menos uno de los siguientes campos: Año, Cargo o Desde');
        }

        if (datos.añoCargo) {
            const año = parseInt(datos.añoCargo);
            if (año < 1950 || año > 2030) {
                errores.push('El año debe estar entre 1950 y 2030');
            }
        }

        if (datos.fechaInicioCargo && datos.fechaFinCargo) {
            if (new Date(datos.fechaInicioCargo) > new Date(datos.fechaFinCargo)) {
                errores.push('La fecha de término debe ser posterior a la fecha de inicio');
            }
        }

        return errores;
    }

    async guardarCargo(datos) {
        console.log('💾 GUARDANDO CARGO - Datos recibidos:', datos);
        console.log('🔍 cargoIdEditando RAW:', datos.cargoIdEditando);
        
        // Validar y parsear el ID de edición
        let cargoIdEditando = null;
        if (datos.cargoIdEditando && datos.cargoIdEditando !== '' && datos.cargoIdEditando !== 'undefined' && datos.cargoIdEditando !== 'null') {
            cargoIdEditando = parseInt(datos.cargoIdEditando);
            if (isNaN(cargoIdEditando)) {
                cargoIdEditando = null;
            }
        }
        
        const editando = cargoIdEditando !== null && !isNaN(cargoIdEditando);
        
        console.log('🎯 ¿Modo EDICIÓN?', editando, '| ID:', cargoIdEditando);
        console.log('📊 Cargos actuales en memoria:', this.cargos.length);
        console.log('🔢 Counter actual:', window.cargoIdCounter);
        
        // Asegurar que el counter es un número válido
        if (!window.cargoIdCounter || isNaN(window.cargoIdCounter)) {
            const maxId = Math.max(0, ...this.cargos.map(c => c.id || 0));
            window.cargoIdCounter = maxId + 1;
            console.log('⚠️ Counter reinicializado a:', window.cargoIdCounter);
        }
        
        const cargoData = {
            id: editando ? cargoIdEditando : window.cargoIdCounter++,
            bomberoId: parseInt(datos.bomberoCargoId),
            añoCargo: datos.añoCargo ? parseInt(datos.añoCargo) : null,
            tipoCargo: datos.tipoCargo || null,
            fechaInicioCargo: datos.fechaInicioCargo || null,
            fechaFinCargo: datos.fechaFinCargo || null,
            observacionesCargo: datos.observacionesCargo || null,
            fechaRegistro: editando ? 
                (this.cargos.find(c => c.id == cargoIdEditando)?.fechaRegistro || new Date().toISOString()) : 
                new Date().toISOString()
        };
        
        console.log('📦 Cargo a guardar:', cargoData);
        
        // Validar que el ID es válido
        if (!cargoData.id || isNaN(cargoData.id)) {
            console.error('❌ ERROR CRÍTICO: ID inválido generado');
            throw new Error('Error al generar ID del cargo');
        }

        if (editando) {
            const index = this.cargos.findIndex(c => c.id == cargoIdEditando);
            console.log('🔍 Índice del cargo a actualizar:', index);
            
            if (index !== -1) {
                console.log('✅ ACTUALIZANDO cargo existente en índice', index);
                this.cargos[index] = cargoData;
            } else {
                console.error('❌ ERROR: No se encontró el cargo con ID', cargoIdEditando);
                throw new Error('Cargo no encontrado para editar');
            }
        } else {
            console.log('➕ CREANDO nuevo cargo con ID', cargoData.id);
            this.cargos.push(cargoData);
        }
        
        console.log('📊 Cargos después de guardar:', this.cargos.length);
        this.guardarDatos();
        console.log('✅ Cargo guardado en localStorage');
    }

    guardarDatos() {
        storage.saveCargos(this.cargos);
        storage.saveCounters({
            bomberoId: window.idCounter,
            sancionId: window.sancionIdCounter,
            cargoId: window.cargoIdCounter
        });
    }

    renderizarCargos() {
        const lista = document.getElementById('listaCargos');
        const total = document.getElementById('totalCargos');
        
        const cargosBombero = this.cargos.filter(c => c.bomberoId == this.bomberoActual.id);
        const cargosOrdenados = this.ordenarCargos(cargosBombero);
        
        total.textContent = cargosBombero.length;

        if (cargosBombero.length === 0) {
            lista.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">No hay cargos registrados para este bombero</p>';
            return;
        }

        lista.innerHTML = cargosOrdenados.map(cargo => this.generarHTMLCargo(cargo)).join('');
    }

    ordenarCargos(cargos) {
        return [...cargos].sort((a, b) => {
            // Priorizar fecha de inicio
            if (a.fechaInicioCargo && b.fechaInicioCargo) {
                return new Date(b.fechaInicioCargo) - new Date(a.fechaInicioCargo);
            }
            
            // Luego por año
            if (a.añoCargo && b.añoCargo) {
                return b.añoCargo - a.añoCargo;
            }
            
            // Finalmente por fecha de registro
            return new Date(b.fechaRegistro) - new Date(a.fechaRegistro);
        });
    }

generarHTMLCargo(cargo) {
    const esVigente = cargo.fechaInicioCargo && !cargo.fechaFinCargo;
    
    return `
        <div class="item-card cargo-card">
            <div class="item-header">
                <div class="item-tipo">
                    ${cargo.tipoCargo || 'Registro de Servicio'}
                    ${cargo.añoCargo ? ` (${cargo.añoCargo})` : ''}
                </div>
                <div class="item-acciones">
                    <button class="btn-accion btn-editar-cargo" onclick="cargosSistema.editarCargo(${cargo.id})" title="Editar cargo">
                        ✏️ Editar
                    </button>
                </div>
            </div>
            <div class="item-info">
                ${cargo.añoCargo ? `
                    <div><strong>Año:</strong> <span>${cargo.añoCargo}</span></div>
                ` : ''}
                
                ${cargo.tipoCargo ? `
                    <div><strong>Cargo:</strong> <span>${cargo.tipoCargo}</span></div>
                ` : ''}
                
                ${cargo.fechaInicioCargo ? `
                    <div><strong>Desde:</strong> <span>${Utils.formatearFecha(cargo.fechaInicioCargo)}</span></div>
                ` : ''}
                
                ${cargo.fechaFinCargo ? `
                    <div><strong>Hasta:</strong> <span>${Utils.formatearFecha(cargo.fechaFinCargo)}</span></div>
                ` : cargo.fechaInicioCargo ? `
                    <div><strong>Estado:</strong> <span style="color: #4caf50; font-weight: bold;">En ejercicio</span></div>
                ` : ''}
                
                <div class="full-width">
                    <strong>Observaciones:</strong> 
                    <span>${cargo.observacionesCargo || 'Sin observaciones'}</span>
                </div>
            </div>
        </div>
    `;
}

    editarCargo(cargoId) {
    console.log('🔧 EDITAR CARGO - ID:', cargoId);
    const cargo = this.cargos.find(c => c.id == cargoId);
    if (!cargo) {
        Utils.mostrarNotificacion('Cargo no encontrado', 'error');
        return;
    }
    
    console.log('✅ Cargo encontrado:', cargo);
    
    // Llenar el formulario con los datos del cargo
    const editandoInput = document.getElementById('cargoIdEditando');
    console.log('🔍 Campo cargoIdEditando:', editandoInput);
    
    if (editandoInput) {
        editandoInput.value = cargo.id;
        console.log('✅ Campo cargoIdEditando llenado con ID:', cargo.id);
    } else {
        console.error('❌ ERROR: Campo cargoIdEditando NO EXISTE en el DOM');
        alert('ERROR CRÍTICO: El campo cargoIdEditando no existe. Contacta al desarrollador.');
        return;
    }
    
    document.getElementById('añoCargo').value = cargo.añoCargo || '';
    document.getElementById('fechaInicioCargo').value = cargo.fechaInicioCargo || '';
    document.getElementById('fechaFinCargo').value = cargo.fechaFinCargo || '';
    document.getElementById('observacionesCargo').value = cargo.observacionesCargo || '';
    
    // Determinar en qué selector va el cargo
    const cargosComandancia = ['Superintendente', 'Comandante 1', 'Comandante 2', 'Comandante 3', 
                                'Intendente General', 'Tesorero General', 'Secretario General', 'Ayudante General'];
    const cargosCompania = ['Capitán', 'Director', 'Secretario', 'Tesorero', 'Capellán', 'Intendente',
                            'Teniente Primero', 'Teniente Segundo', 'Teniente Tercero', 'Teniente Cuarto'];
    const cargosConsejo = ['Miembro Consejo de Disciplina de Cía', 'Miembro Junta Calificadora', 
                           'Miembro Junta Revisora de Cuentas'];
    const cargosTecnicos = ['Jefe de Máquinas', 'Maquinista 1°', 'Maquinista 2°', 'Maquinista 3°',
                            'Ayudante', 'Ayudante 1°', 'Ayudante 2°', 'Ayudante 3°'];
    
    if (cargosComandancia.includes(cargo.tipoCargo)) {
        document.getElementById('cargoComandancia').value = cargo.tipoCargo;
        document.getElementById('cargoCompania').value = '';
        document.getElementById('cargoConsejo').value = '';
        document.getElementById('cargoTecnico').value = '';
    } else if (cargosCompania.includes(cargo.tipoCargo)) {
        document.getElementById('cargoComandancia').value = '';
        document.getElementById('cargoCompania').value = cargo.tipoCargo;
        document.getElementById('cargoConsejo').value = '';
        document.getElementById('cargoTecnico').value = '';
    } else if (cargosConsejo.includes(cargo.tipoCargo)) {
        document.getElementById('cargoComandancia').value = '';
        document.getElementById('cargoCompania').value = '';
        document.getElementById('cargoConsejo').value = cargo.tipoCargo;
        document.getElementById('cargoTecnico').value = '';
    } else if (cargosTecnicos.includes(cargo.tipoCargo)) {
        document.getElementById('cargoComandancia').value = '';
        document.getElementById('cargoCompania').value = '';
        document.getElementById('cargoConsejo').value = '';
        document.getElementById('cargoTecnico').value = cargo.tipoCargo;
    }
    
    document.getElementById('tipoCargo').value = cargo.tipoCargo || '';
    
    // Cambiar texto del botón
    const btnSubmit = document.querySelector('#formCargo button[type="submit"]');
    if (btnSubmit) {
        btnSubmit.textContent = '✅ Actualizar Cargo';
        btnSubmit.style.background = '#ff9800';
    }
    
    // Scroll al formulario
    document.getElementById('formCargo').scrollIntoView({ behavior: 'smooth', block: 'start' });
    
    Utils.mostrarNotificacion('Editando cargo - Puedes modificar la fecha de término y observaciones', 'info');
}

    limpiarFormulario() {
    document.getElementById('formCargo').reset();
    document.getElementById('añoCargo').value = '';
    document.getElementById('fechaInicioCargo').value = '';
    document.getElementById('fechaFinCargo').value = '';
    document.getElementById('observacionesCargo').value = '';
    
    // Limpiar los selectores de cargo
    document.getElementById('cargoComandancia').value = '';
    document.getElementById('cargoCompania').value = '';
    document.getElementById('cargoConsejo').value = '';
    document.getElementById('cargoTecnico').value = '';
    document.getElementById('tipoCargo').value = '';
    
    // Setear bomberoCargoId de forma segura
    const bomberoInput = document.getElementById('bomberoCargoId');
    if (bomberoInput) {
        bomberoInput.value = this.bomberoActual.id;
    }
    
    // Restaurar texto del botón
    const btnSubmit = document.querySelector('#formCargo button[type="submit"]');
    if (btnSubmit) {
        btnSubmit.textContent = 'Registrar Cargo';
        btnSubmit.style.background = '';
    }
    
    // Limpiar campo de edición si existe
    const editandoInput = document.getElementById('cargoIdEditando');
    if (editandoInput) {
        editandoInput.value = '';
    }
    
    // Setear año actual si el campo existe
    const añoInput = document.getElementById('añoCargo');
    if (añoInput) {
        añoInput.value = new Date().getFullYear();
    }
}
    async exportarExcel() {
        if (!this.bomberoActual) {
            Utils.mostrarNotificacion('Error: No hay un bombero seleccionado', 'error');
            return;
        }

        const cargosBombero = this.cargos.filter(c => c.bomberoId == this.bomberoActual.id);
        
        if (cargosBombero.length === 0) {
            Utils.mostrarNotificacion('No hay cargos registrados para exportar', 'error');
            return;
        }

        try {
            const datosExcel = cargosBombero.map((cargo, index) => ({
                'N°': index + 1,
                'Bombero': Utils.obtenerNombreCompleto(this.bomberoActual),
                'Clave': this.bomberoActual.claveBombero || 'N/A',
                'RUN': this.bomberoActual.rut || this.bomberoActual.run,
                'Compañía': this.bomberoActual.compania,
                'Año': cargo.añoCargo || 'No especificado',
                'Cargo': cargo.tipoCargo || 'No especificado',
                'Desde': cargo.fechaInicioCargo ? Utils.formatearFecha(cargo.fechaInicioCargo) : 'No especificado',
                'Hasta': cargo.fechaFinCargo ? Utils.formatearFecha(cargo.fechaFinCargo) : 'En ejercicio',
                'Observaciones': cargo.observacionesCargo || 'Sin observaciones',
                'Fecha Registro': Utils.formatearFecha(cargo.fechaRegistro)
            }));

            await Utils.exportarAExcel(
                datosExcel,
                `Cargos_${this.bomberoActual.claveBombero || 'Bombero'}_${new Date().toISOString().split('T')[0]}.xlsx`,
                'Cargos'
            );

            Utils.mostrarNotificacion('Excel de cargos descargado exitosamente', 'success');
        } catch (error) {
            Utils.mostrarNotificacion('Error al generar Excel: ' + error.message, 'error');
        }
    }

async exportarPDFCargos() {
    if (!this.bomberoActual) {
        Utils.mostrarNotificacion('Error: No hay un bombero seleccionado', 'error');
        return;
    }

    const cargosBombero = this.cargos.filter(c => c.bomberoId == this.bomberoActual.id);
    
    if (cargosBombero.length === 0) {
        Utils.mostrarNotificacion('No hay cargos registrados para exportar', 'error');
        return;
    }

    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;
        const margin = 20;
        let yPos = 20;

        // ========== ENCABEZADO CON FONDO NEGRO ==========
        doc.setFillColor(0, 0, 0);
        doc.rect(0, 0, pageWidth, 55, 'F');
        
       // ========== FOTO DEL BOMBERO (IZQUIERDA - CIRCULAR CON NOMBRE) ==========
      // ========== FOTO DEL BOMBERO (IZQUIERDA - OVALADA SIN BORDE) ==========
        if (this.bomberoActual.foto) {
            try {
                // Solo la foto con bordes redondeados
                const fotoX = 14;
                const fotoY = 8;
                const fotoWidth = 32;
                const fotoHeight = 40;
                
                doc.addImage(this.bomberoActual.foto, 'JPEG', fotoX, fotoY, fotoWidth, fotoHeight);
                
            } catch (error) {
                console.log('No se pudo cargar la foto');
                // Placeholder simple
                doc.setFillColor(60, 60, 60);
                doc.roundedRect(14, 8, 32, 40, 16, 16, 'F');
                doc.setTextColor(200, 200, 200);
                doc.setFontSize(8);
                doc.text('SIN', 30, 26, { align: 'center' });
                doc.text('FOTO', 30, 32, { align: 'center' });
            }
        } else {
            // Placeholder si no hay foto
            doc.setFillColor(60, 60, 60);
            doc.roundedRect(14, 8, 32, 40, 16, 16, 'F');
            doc.setTextColor(200, 200, 200);
            doc.setFontSize(8);
            doc.text('SIN', 30, 26, { align: 'center' });
            doc.text('FOTO', 30, 32, { align: 'center' });
        }
        // ========== TÍTULO CENTRADO ==========
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont(undefined, 'bold');
        doc.text('CERTIFICADO DE CARGOS', pageWidth / 2, 23, { align: 'center' });
        
        // Subtítulo
        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');
        doc.text('Cuerpo de Bomberos', pageWidth / 2, 31, { align: 'center' });
        
        // FECHA
        const fechaActual = new Date().toLocaleDateString('es-CL', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        doc.setFontSize(9);
        doc.text(fechaActual, pageWidth / 2, 38, { align: 'center' });
        
        // ========== LOGO DE LA COMPAÑÍA (DERECHA - SIN MARCO NI FONDO) ==========
        const logoCompania = localStorage.getItem('logoCompania');
        
        if (logoCompania) {
            try {
                // Logo directo sin recuadros
                doc.addImage(logoCompania, 'PNG', pageWidth - 46, 10, 32, 36);
            } catch (error) {
                console.log('Error al cargar logo:', error);
                // Placeholder mínimo si falla
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(10);
                doc.setFont(undefined, 'bold');
                doc.text('LOGO', pageWidth - 30, 28, { align: 'center' });
            }
        } else {
            // Placeholder si no hay logo
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(10);
            doc.setFont(undefined, 'bold');
            doc.text('LOGO', pageWidth - 30, 24, { align: 'center' });
            doc.setFontSize(8);
            doc.setFont(undefined, 'normal');
            doc.text('COMPAÑIA', pageWidth - 30, 30, { align: 'center' });
        }
        
        yPos = 65;

        // ========== INFORMACIÓN DEL BOMBERO ==========
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('DATOS DEL VOLUNTARIO', pageWidth / 2, yPos, { align: 'center' });
        yPos += 3;
        
        // Línea decorativa bajo el título
        doc.setDrawColor(196, 30, 58);
        doc.setLineWidth(0.8);
        doc.line(pageWidth / 2 - 35, yPos, pageWidth / 2 + 35, yPos);
        yPos += 8;
        
        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(60, 60, 60);
        
        const infoBombero = [
            `Nombre: ${Utils.obtenerNombreCompleto(this.bomberoActual)}`,
            `Clave Bombero: ${this.bomberoActual.claveBombero || 'N/A'}`,
            `N° Registro: ${this.bomberoActual.nroRegistro || 'N/A'}`,
            `RUN: ${this.bomberoActual.rut || this.bomberoActual.run}`,
            `Compañía: ${this.bomberoActual.compania}`
        ];
        infoBombero.forEach(info => {
            doc.text(info, pageWidth / 2, yPos, { align: 'center' });
            yPos += 6;
        });
        
        yPos += 8;

        // ========== TÍTULO DE CARGOS ==========
        doc.setFillColor(196, 30, 58);
        doc.rect(margin, yPos, pageWidth - 2 * margin, 10, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('CARGOS DESEMPEÑADOS', pageWidth / 2, yPos + 7, { align: 'center' });
        yPos += 16;

        // ========== CARGOS ORDENADOS ==========
        const cargosOrdenados = this.ordenarCargos(cargosBombero);
        
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');

        cargosOrdenados.forEach((cargo, index) => {
            if (yPos > pageHeight - 45) {
                doc.addPage();
                yPos = 20;
            }
            
            // Recuadro para cada cargo
            doc.setFillColor(250, 250, 250);
            const cargoHeight = cargo.observacionesCargo ? 22 : 16;
            doc.roundedRect(margin, yPos - 4, pageWidth - 2 * margin, cargoHeight, 1, 1, 'F');
            
            // Barra lateral roja
            doc.setFillColor(196, 30, 58);
            doc.rect(margin, yPos - 4, 3, cargoHeight, 'F');
            
            // NÚMERO Y CARGO
            doc.setFont(undefined, 'bold');
            doc.setFontSize(11);
            doc.setTextColor(0, 0, 0);
            const titulo = `${index + 1}. ${cargo.tipoCargo || 'Cargo no especificado'}${cargo.añoCargo ? ` (${cargo.añoCargo})` : ''}`;
            doc.text(titulo, margin + 6, yPos);
            yPos += 6;
            
            doc.setFont(undefined, 'normal');
            doc.setFontSize(9);
            doc.setTextColor(80, 80, 80);
            
            // PERÍODO (SIN EMOJIS)
            if (cargo.fechaInicioCargo) {
                let periodo = `Desde: ${Utils.formatearFecha(cargo.fechaInicioCargo)}`;
                if (cargo.fechaFinCargo) {
                    periodo += ` | Hasta: ${Utils.formatearFecha(cargo.fechaFinCargo)}`;
                } else {
                    periodo += ' | En ejercicio';
                }
                doc.text(periodo, margin + 6, yPos);
                yPos += 5;
            }
            
            // OBSERVACIONES (SIN EMOJIS)
            if (cargo.observacionesCargo) {
                doc.setFontSize(8);
                doc.setTextColor(100, 100, 100);
                const obsTexto = `Obs: ${cargo.observacionesCargo}`;
                const lineasObs = doc.splitTextToSize(obsTexto, pageWidth - 2 * margin - 14);
                doc.text(lineasObs, margin + 6, yPos);
                yPos += lineasObs.length * 3.5;
            }
            
            yPos += cargoHeight - 10;
        });

        // ========== PIE DE PÁGINA ==========
        const totalPages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            
            let footerYPos = pageHeight - 25;
            
            // Línea decorativa
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.5);
            doc.line(margin, footerYPos, pageWidth - margin, footerYPos);
            footerYPos += 6;
            
            doc.setFontSize(9);
            doc.setTextColor(100, 100, 100);
            doc.setFont(undefined, 'italic');
            doc.text('Este certificado acredita los cargos desempeñados por el voluntario', pageWidth / 2, footerYPos, { align: 'center' });
            footerYPos += 4;
            doc.text('en el Cuerpo de Bomberos', pageWidth / 2, footerYPos, { align: 'center' });
            
            // Número de página
            footerYPos += 5;
            doc.setFontSize(8);
            doc.setFont(undefined, 'normal');
            doc.text(`Pagina ${i} de ${totalPages}`, pageWidth / 2, footerYPos, { align: 'center' });
        }

        // ========== GUARDAR PDF ==========
        const nombreArchivo = `Certificado_Cargos_${this.bomberoActual.claveBombero || 'Bombero'}_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(nombreArchivo);

        Utils.mostrarNotificacion('PDF generado exitosamente', 'success');
    } catch (error) {
        console.error('Error al generar PDF:', error);
        Utils.mostrarNotificacion('Error al generar PDF: ' + error.message, 'error');
    }
}

    volverAlSistema() {
        localStorage.removeItem('bomberoCargoActual');
        window.location.href = 'sistema.html';
    }
    // Función auxiliar para dibujar texto en forma curva
dibujarTextoCurvo(doc, texto, centerX, centerY, radius, startAngle, direction) {
    const angleStep = Math.PI / (texto.length + 1);
    
   
}
}


// Inicializar sistema cuando se cargue la página
document.addEventListener('DOMContentLoaded', () => {
    window.cargosSistema = new SistemaCargos();
});