// ==================== MIXIN PARA VOLUNTARIOS EXTERNOS ====================
// Este mixin se puede aplicar a cualquier clase de asistencia para agregar
// funcionalidad de voluntarios participantes y canjes

const VoluntariosExternosMixin = {
    initExternos() {
        this.participantesSeleccionados = [];
        this.canjesSeleccionados = [];
        this.participantesGuardados = JSON.parse(localStorage.getItem('voluntariosParticipantes')) || [];
        this.canjesGuardados = JSON.parse(localStorage.getItem('voluntariosCanjes')) || [];
    },

    cargarListasExternos() {
        // Cargar datalist de participantes
        const datalistParticipantes = document.getElementById('listaParticipantes');
        if (datalistParticipantes) {
            datalistParticipantes.innerHTML = '';
            this.participantesGuardados.forEach(nombre => {
                const option = document.createElement('option');
                option.value = nombre;
                datalistParticipantes.appendChild(option);
            });
        }

        // Cargar datalist de canjes
        const datalistCanjes = document.getElementById('listaCanjes');
        if (datalistCanjes) {
            datalistCanjes.innerHTML = '';
            this.canjesGuardados.forEach(nombre => {
                const option = document.createElement('option');
                option.value = nombre;
                datalistCanjes.appendChild(option);
            });
        }
    },

    agregarParticipante() {
        const input = document.getElementById('inputParticipante');
        const nombre = input.value.trim();

        if (!nombre) {
            Utils.mostrarNotificacion('Ingrese el nombre del voluntario participante', 'error');
            return;
        }

        this.participantesSeleccionados.push(nombre);

        if (!this.participantesGuardados.includes(nombre)) {
            this.participantesGuardados.push(nombre);
            localStorage.setItem('voluntariosParticipantes', JSON.stringify(this.participantesGuardados));
            this.cargarListasExternos();
        }

        input.value = '';
        this.renderizarExternos();
        this.actualizarEstadisticas();
    },

    agregarCanje() {
        const input = document.getElementById('inputCanje');
        const nombre = input.value.trim();

        if (!nombre) {
            Utils.mostrarNotificacion('Ingrese el nombre y compañía del voluntario canje', 'error');
            return;
        }

        this.canjesSeleccionados.push(nombre);

        if (!this.canjesGuardados.includes(nombre)) {
            this.canjesGuardados.push(nombre);
            localStorage.setItem('voluntariosCanjes', JSON.stringify(this.canjesGuardados));
            this.cargarListasExternos();
        }

        input.value = '';
        this.renderizarExternos();
        this.actualizarEstadisticas();
    },

    eliminarParticipante(index) {
        this.participantesSeleccionados.splice(index, 1);
        this.renderizarExternos();
        this.actualizarEstadisticas();
    },

    eliminarCanje(index) {
        this.canjesSeleccionados.splice(index, 1);
        this.renderizarExternos();
        this.actualizarEstadisticas();
    },

    renderizarExternos() {
        // Renderizar participantes
        const contenedorParticipantes = document.getElementById('participantesSeleccionados');
        if (contenedorParticipantes) {
            contenedorParticipantes.innerHTML = '';
            this.participantesSeleccionados.forEach((nombre, index) => {
                const div = document.createElement('div');
                div.className = 'externo-item';
                div.innerHTML = `
                    <div>
                        <span class="externo-nombre">${nombre}</span>
                        <span class="externo-tipo">Participante</span>
                    </div>
                    <button class="btn-eliminar-externo" onclick="${this.nombreClase}.eliminarParticipante(${index})">
                        ✕
                    </button>
                `;
                contenedorParticipantes.appendChild(div);
            });
        }

        // Renderizar canjes
        const contenedorCanjes = document.getElementById('canjesSeleccionados');
        if (contenedorCanjes) {
            contenedorCanjes.innerHTML = '';
            this.canjesSeleccionados.forEach((nombre, index) => {
                const div = document.createElement('div');
                div.className = 'externo-item';
                div.innerHTML = `
                    <div>
                        <span class="externo-nombre">${nombre}</span>
                        <span class="externo-tipo">Canje</span>
                    </div>
                    <button class="btn-eliminar-externo" onclick="${this.nombreClase}.eliminarCanje(${index})">
                        ✕
                    </button>
                `;
                contenedorCanjes.appendChild(div);
            });
        }
    },

    agregarExternosAAsistentes(asistentes) {
        // Agregar voluntarios participantes
        this.participantesSeleccionados.forEach(nombre => {
            asistentes.push({
                bomberoId: null,
                nombre: nombre,
                claveBombero: null,
                categoria: 'Voluntario Participante',
                cargo: null,
                esExterno: true,
                tipoExterno: 'participante'
            });
        });

        // Agregar voluntarios canjes
        this.canjesSeleccionados.forEach(nombre => {
            asistentes.push({
                bomberoId: null,
                nombre: nombre,
                claveBombero: null,
                categoria: 'Voluntario Canje',
                cargo: null,
                esExterno: true,
                tipoExterno: 'canje'
            });
        });

        return asistentes;
    },

    validarAsistentes(checkboxes) {
        return checkboxes.length > 0 || 
               this.participantesSeleccionados.length > 0 || 
               this.canjesSeleccionados.length > 0;
    },

    obtenerMensajeExternos() {
        if (this.participantesSeleccionados.length === 0 && this.canjesSeleccionados.length === 0) {
            return '';
        }

        let mensaje = `\n\n👥 VOLUNTARIOS EXTERNOS:\n`;
        if (this.participantesSeleccionados.length > 0) {
            mensaje += `• Participantes: ${this.participantesSeleccionados.length}\n`;
        }
        if (this.canjesSeleccionados.length > 0) {
            mensaje += `• Canjes: ${this.canjesSeleccionados.length}`;
        }
        return mensaje;
    }
};
