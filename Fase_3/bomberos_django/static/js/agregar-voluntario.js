// Sistema de Creación de Bomberos
class CrearBomberoSistema {
    constructor() {
        this.fotoNueva = null;
        this.init();
    }

    async init() {
        if (!checkAuth()) {
            window.location.href = 'index.html';
            return;
        }
        this.mostrarInfoUsuario();
        this.configurarEventos();
        this.establecerFechaActual();
    }

    mostrarInfoUsuario() {
        const userRoleInfo = document.getElementById('userRoleInfo');
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        if (currentUser) {
            userRoleInfo.textContent = `${currentUser.role}: ${currentUser.username}`;
        }
        document.getElementById('logoutBtn').addEventListener('click', () => logout());
    }

    configurarEventos() {
        const form = document.getElementById('formCrearBombero');
        if (form) form.addEventListener('submit', (e) => this.manejarSubmit(e));

        const rutInput = document.getElementById('rut');
        if (rutInput) {
            rutInput.addEventListener('input', (e) => {
                e.target.value = Utils.formatearRUN(e.target.value);
            });
        }
    }

    establecerFechaActual() {
        const fechaIngreso = document.getElementById('fechaIngreso');
        if (fechaIngreso) fechaIngreso.value = new Date().toISOString().split('T')[0];
    }

    previsualizarFoto(input) {
        const preview = document.getElementById('previewFoto');
        if (!input.files || !input.files[0]) {
            preview.innerHTML = '';
            this.fotoNueva = null;
            return;
        }

        const file = input.files[0];
        if (file.size > 5 * 1024 * 1024) {
            Utils.mostrarNotificacion('La foto no debe superar 5MB', 'error');
            input.value = '';
            preview.innerHTML = '';
            this.fotoNueva = null;
            return;
        }

        if (!file.type.startsWith('image/')) {
            Utils.mostrarNotificacion('Solo se permiten archivos de imagen', 'error');
            input.value = '';
            preview.innerHTML = '';
            this.fotoNueva = null;
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            this.fotoNueva = e.target.result;
            preview.innerHTML = `
                <div style="text-align: center; margin-top: 10px;">
                    <img src="${e.target.result}" alt="Vista previa" 
                         style="max-width: 150px; max-height: 150px; border-radius: 10px; border: 2px solid #4caf50; object-fit: cover;">
                    <p style="font-size: 0.8rem; color: #666; margin-top: 5px;">✅ Foto cargada</p>
                </div>
            `;
        };
        reader.readAsDataURL(file);
    }

    async manejarSubmit(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const datos = Object.fromEntries(formData);

        if (!datos.nombre || !datos.rut) {
            Utils.mostrarNotificacion('Nombre y RUT son obligatorios', 'error');
            return;
        }

        if (!Utils.validarRUN(datos.rut)) {
            Utils.mostrarNotificacion('RUT inválido', 'error');
            return;
        }

        try {
            let fotoBase64 = null;
            const inputFoto = document.getElementById('fotoBombero');
            if (inputFoto && inputFoto.files && inputFoto.files[0]) {
                fotoBase64 = await this.leerFotoComoBase64(inputFoto.files[0]);
            }

            // CALCULAR ID DE FORMA SEGURA: buscar el máximo ID existente + 1
            const bomberos = storage.getBomberos();
            let nuevoId = 1;
            
            if (bomberos.length > 0) {
                // Encontrar el ID más alto que existe
                const maxId = Math.max(...bomberos.map(b => parseInt(b.id) || 0));
                nuevoId = maxId + 1;
            }
            
            // VERIFICAR que el ID no exista (seguridad extra)
            while (bomberos.some(b => b.id === nuevoId)) {
                nuevoId++;
            }
            
            console.log('✅ Nuevo ID asignado:', nuevoId);

            const bomberoNuevo = {
                id: nuevoId,
                claveBombero: datos.claveBombero,
                nombre: datos.nombre,
                apellidoPaterno: datos.apellidoPaterno || '',
                apellidoMaterno: datos.apellidoMaterno || '',
                fechaNacimiento: datos.fechaNacimiento,
                rut: datos.rut,
                profesion: datos.profesion,
                domicilio: datos.domicilio,
                nroRegistro: datos.nroRegistro,
                fechaIngreso: datos.fechaIngreso,
                compania: datos.compania,
                grupoSanguineo: datos.grupoSanguineo,
                telefono: datos.telefono,
                email: datos.email || '',
                foto: fotoBase64,
                otrosCuerpos: datos.otrosCuerpos || '',
                companiaOpcional: datos.companiaOpcional || '',
                desde: datos.desde || '',
                hasta: datos.hasta || '',
                estadoBombero: 'activo', // Estado por defecto
                fechaRegistro: new Date().toISOString()
            };

            // Agregar el nuevo bombero al array que ya cargamos arriba
            bomberos.push(bomberoNuevo);
            storage.saveBomberos(bomberos);

            // Actualizar contador para el próximo bombero
            const counters = storage.getCounters();
            storage.saveCounters({
                bomberoId: nuevoId + 1,
                sancionId: counters.sancionId || 1,
                cargoId: counters.cargoId || 1,
                felicitacionId: counters.felicitacionId || 1,
                uniformeId: counters.uniformeId || 1
            });

            Utils.mostrarNotificacion('✅ Bombero registrado exitosamente', 'success');
            setTimeout(() => this.volver(), 1500);
        } catch (error) {
            console.error('❌ Error:', error);
            Utils.mostrarNotificacion('Error al crear: ' + error.message, 'error');
        }
    }

    leerFotoComoBase64(archivo) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => reject(new Error('Error al leer la foto'));
            reader.readAsDataURL(archivo);
        });
    }

    limpiarFormulario() {
        document.getElementById('formCrearBombero').reset();
        document.getElementById('previewFoto').innerHTML = '';
        this.fotoNueva = null;
        this.establecerFechaActual();
    }

    volver() {
        window.location.href = 'sistema.html';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.crearBomberoSistema = new CrearBomberoSistema();
});