// ==================== SISTEMA DE CUOTAS Y BENEFICIOS ====================
class SistemaCuotasBeneficios {
    constructor() {
        this.bomberoActual = null;
        this.cuotas = [];
        this.beneficios = [];
        this.pagosCuotas = [];
        this.pagosBeneficios = [];
        this.tabActual = 'cuotas';
        this.anioActual = new Date().getFullYear();
        this.init();
    }

    async init() {
        if (!checkAuth()) {
            window.location.href = 'index.html';
            return;
        }

        const sePudoCargar = await this.cargarBomberoActual();
        if (!sePudoCargar) {
            // El bombero está exento o no existe, no continuar
            return;
        }
        
        this.cargarDatos();
        this.configurarInterfaz();
        this.aplicarPermisosUI();
        this.renderizarTodo();
    }

    async cargarBomberoActual() {
        const bomberoId = localStorage.getItem('bomberoCuotasActual');
        if (!bomberoId) {
            Utils.mostrarNotificacion('No se ha seleccionado ningún bombero', 'error');
            setTimeout(() => this.volverAlSistema(), 2000);
            return false;
        }

        const bomberos = storage.getBomberos();
        // Convertir a número para comparación exacta
        this.bomberoActual = bomberos.find(b => b.id === parseInt(bomberoId));
        
        if (!this.bomberoActual) {
            Utils.mostrarNotificacion('Bombero no encontrado', 'error');
            setTimeout(() => this.volverAlSistema(), 2000);
            return false;
        }

        // VERIFICAR SI PUEDE PAGAR CUOTAS (por categoría y estado)
        const categoria = Utils.calcularCategoriaBombero(this.bomberoActual.fechaIngreso);
        const estaExentoPorCategoria = categoria === 'Honorario' || categoria === 'Insigne de 25 Años';
        
        // Verificar estado del voluntario
        const validacionEstado = Utils.puedePagarCuotas(this.bomberoActual);
        
        if (estaExentoPorCategoria || !validacionEstado.puede) {
            // OCULTAR TODO EL CONTENIDO
            const nombreCompleto = Utils.obtenerNombreCompleto(this.bomberoActual);
            const motivo = estaExentoPorCategoria ? 
                `es <strong>${categoria}</strong> y está exento de pagar cuotas sociales` : 
                validacionEstado.mensaje;
            
            document.body.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; height: 100vh; flex-direction: column; font-family: Arial; padding: 20px; text-align: center;">
                    <h1 style="color: #f44336; font-size: 48px;">❌</h1>
                    <h2>Acceso Denegado</h2>
                    <p style="font-size: 18px; max-width: 600px;">${nombreCompleto} ${motivo}</p>
                    <p style="font-size: 16px; color: #666; margin-top: 10px;">
                        No se pueden registrar pagos de cuotas para este voluntario.
                    </p>
                    <p style="color: #999; margin-top: 20px;">Redirigiendo al sistema...</p>
                </div>
            `;
            setTimeout(() => this.volverAlSistema(), 3000);
            return false;
        }

        this.mostrarInfoBombero();
        return true;
    }

    mostrarInfoBombero() {
        const contenedor = document.getElementById('bomberoDatosCuotas');
        
        contenedor.innerHTML = `
            <div><strong>Nombre:</strong> <span>${this.bomberoActual.nombre}</span></div>
            <div><strong>Clave:</strong> <span>${this.bomberoActual.claveBombero}</span></div>
            <div><strong>RUN:</strong> <span>${this.bomberoActual.rut}</span></div>
            <div><strong>Compañía:</strong> <span>${this.bomberoActual.compania}</span></div>
        `;

        document.getElementById('bomberoCuotaId').value = this.bomberoActual.id;
        document.getElementById('bomberoBeneficioId').value = this.bomberoActual.id;
    }

    cargarDatos() {
        this.beneficios = storage.getBeneficios();
        this.pagosCuotas = storage.getPagosCuotas();
        this.pagosBeneficios = storage.getPagosBeneficios();
    }

    configurarInterfaz() {
        // Formulario de cuota social
        document.getElementById('formCuotaSocial').addEventListener('submit', (e) => {
            this.manejarSubmitCuota(e);
        });

        // Formulario crear beneficio
        document.getElementById('formCrearBeneficio').addEventListener('submit', (e) => {
            this.manejarSubmitCrearBeneficio(e);
        });

        // Formulario pago beneficio
        document.getElementById('formPagoBeneficio').addEventListener('submit', (e) => {
            this.manejarSubmitPagoBeneficio(e);
        });

        // Fecha automática
        const hoy = new Date().toISOString().split('T')[0];
        document.getElementById('fechaPagoCuota').value = hoy;
        document.getElementById('fechaPagoBeneficio').value = hoy;
        
        // Año actual
        document.getElementById('anioCuota').value = this.anioActual;
        
        // Agregar event listeners a los checkboxes de meses
        document.querySelectorAll('input[name="meses"]').forEach(checkbox => {
            checkbox.addEventListener('change', () => this.actualizarTotalAPagar());
        });
        
        // Event listener para cambio de tipo de cuota
        document.getElementById('tipoCuota').addEventListener('change', () => this.actualizarTotalAPagar());
    }

    aplicarPermisosUI() {
        const permisos = getUserPermissions();
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        
        // Solo administradores pueden crear beneficios
        const adminSection = document.getElementById('adminBeneficios');
        if (adminSection) {
            if (currentUser.role === 'Director' || currentUser.role === 'Super Administrador' || currentUser.role === 'Tesorero') {
                adminSection.style.display = 'block';
            } else {
                adminSection.style.display = 'none';
            }
        }
    }

    // ==================== GESTIÓN DE TABS ====================
    cambiarTab(tab) {
        this.tabActual = tab;
        
        // Actualizar botones
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');
        
        // Actualizar contenido
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.getElementById(`tab${tab.charAt(0).toUpperCase() + tab.slice(1)}`).classList.add('active');
        
        // Renderizar según tab
        if (tab === 'cuotas') {
            this.renderizarGridMeses();
            this.renderizarHistorialCuotas();
        } else if (tab === 'beneficios') {
            this.cargarBeneficiosEnSelect();
            this.renderizarBeneficiosActivos();
            this.renderizarHistorialBeneficios();
        } else if (tab === 'deudas') {
            this.renderizarEstadoDeudas();
        }
    }

    // ==================== CUOTAS SOCIALES ====================
    cambioTipoCuota() {
        this.actualizarTotalAPagar();
    }
    
    actualizarTotalAPagar() {
        const tipo = document.getElementById('tipoCuota').value;
        const checkboxes = document.querySelectorAll('input[name="meses"]:checked');
        const cantidadMeses = checkboxes.length;
        
        let montoPorMes = 0;
        if (tipo === 'regular') {
            montoPorMes = 5000;
        } else if (tipo === 'estudiante') {
            montoPorMes = 3000;
        }
        
        const total = montoPorMes * cantidadMeses;
        const totalElement = document.getElementById('totalAPagar');
        if (totalElement) {
            totalElement.textContent = this.formatearMonto(total);
        }
    }
    
    actualizarEstadoCheckboxes() {
        const checkboxes = document.querySelectorAll('input[name="meses"]');
        
        checkboxes.forEach(checkbox => {
            const mes = parseInt(checkbox.value);
            const estaPagado = this.pagosCuotas.some(p => 
                p.bomberoId == this.bomberoActual.id && 
                p.mes == mes && 
                p.anio == this.anioActual
            );
            
            if (estaPagado) {
                checkbox.checked = false;
                checkbox.disabled = true;
                checkbox.parentElement.style.opacity = '0.5';
                checkbox.parentElement.style.pointerEvents = 'none';
            } else {
                checkbox.disabled = false;
                checkbox.parentElement.style.opacity = '1';
                checkbox.parentElement.style.pointerEvents = 'auto';
            }
        });
        
        // Actualizar total después de deshabilitar
        this.actualizarTotalAPagar();
    }

    async manejarSubmitCuota(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const datos = Object.fromEntries(formData);
        
        // Obtener meses seleccionados
        const mesesSeleccionados = Array.from(
            document.querySelectorAll('input[name="meses"]:checked')
        ).map(cb => parseInt(cb.value));
        
        if (mesesSeleccionados.length === 0) {
            Utils.mostrarNotificacion('Debe seleccionar al menos un mes', 'error');
            return;
        }
        
        const errores = this.validarDatosCuota(datos, mesesSeleccionados);
        if (errores.length > 0) {
            Utils.mostrarNotificacion('Errores: ' + errores.join(', '), 'error');
            return;
        }

        try {
            // Guardar pago para cada mes seleccionado
            for (const mes of mesesSeleccionados) {
                await this.guardarPagoCuota({...datos, mes: mes});
            }
            
            Utils.mostrarNotificacion(`Pago de ${mesesSeleccionados.length} cuota(s) registrado exitosamente`, 'success');
            this.limpiarFormularioCuota();
            this.renderizarGridMeses();
            this.actualizarEstadoCheckboxes();
            this.renderizarHistorialCuotas();
            this.actualizarSaldoSidebar(); // Actualizar saldo inmediatamente
            
        } catch (error) {
            Utils.mostrarNotificacion(error.message, 'error');
        }
    }

    validarDatosCuota(datos, mesesSeleccionados) {
        const errores = [];
        
        if (!datos.tipoCuota) errores.push('Debe seleccionar tipo de cuota');
        if (mesesSeleccionados.length === 0) errores.push('Debe seleccionar al menos un mes');
        if (!datos.anioCuota) errores.push('Debe ingresar el año');
        if (!datos.fechaPagoCuota) errores.push('Debe ingresar la fecha de pago');
        if (!datos.formaPagoCuota) errores.push('Debe seleccionar la forma de pago');
        
        // Verificar que no se estén pagando meses ya pagados
        for (const mes of mesesSeleccionados) {
            const yaExiste = this.pagosCuotas.some(p => 
                p.bomberoId == this.bomberoActual.id && 
                p.mes == mes && 
                p.anio == datos.anioCuota
            );
            
            if (yaExiste) {
                errores.push(`Ya existe un pago para ${this.obtenerNombreMes(mes)}`);
            }
        }
        
        return errores;
    }

    async guardarPagoCuota(datos) {
        const montoPorCuota = datos.tipoCuota === 'regular' ? 5000 : 3000;

        const pagoCuota = {
            id: this.generarId(),
            bomberoId: this.bomberoActual.id,
            tipoCuota: datos.tipoCuota,
            monto: montoPorCuota,
            mes: parseInt(datos.mes),
            anio: parseInt(datos.anioCuota),
            fechaPago: datos.fechaPagoCuota,
            formaPago: datos.formaPagoCuota,
            observaciones: datos.observacionesCuota || '',
            registradoPor: JSON.parse(localStorage.getItem('currentUser')).username,
            fechaRegistro: new Date().toISOString()
        };

        this.pagosCuotas.push(pagoCuota);
        
        // Registrar movimiento financiero (INGRESO)
        const movimiento = {
            id: this.generarId(),
            tipo: 'ingreso',
            categoria: 'Cuotas sociales',
            monto: montoPorCuota,
            descripcion: `Pago cuota social ${this.obtenerNombreMes(datos.mes)} ${datos.anioCuota} - ${Utils.obtenerNombreCompleto(this.bomberoActual)}`,
            fecha: datos.fechaPagoCuota,
            registradoPor: JSON.parse(localStorage.getItem('currentUser')).username,
            fechaRegistro: new Date().toISOString()
        };
        
        const movimientos = storage.getMovimientosFinancieros();
        movimientos.push(movimiento);
        storage.saveMovimientosFinancieros(movimientos);
        
        this.guardarDatos();
    }

    renderizarGridMeses() {
        const grid = document.getElementById('gridMesesCuotas');
        if (!grid) return;
        
        const meses = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        
        // Actualizar año mostrado
        const anioElement = document.getElementById('anioActualCuotas');
        if (anioElement) {
            anioElement.textContent = this.anioActual;
        }

        const html = meses.map((mes, index) => {
            const numeroMes = index + 1;
            const pago = this.pagosCuotas.find(p => 
                p.bomberoId == this.bomberoActual.id && 
                p.mes == numeroMes && 
                p.anio == this.anioActual
            );

            let estadoClass = 'pendiente';
            let estadoTexto = 'Pendiente';
            
            if (pago) {
                estadoClass = 'pagado';
                estadoTexto = `Pagado: ${this.formatearMonto(pago.monto)}`;
            }

            return `
                <div class="mes-card ${estadoClass}">
                    <div class="mes-nombre">${mes}</div>
                    <div class="mes-estado">${estadoTexto}</div>
                </div>
            `;
        }).join('');

        grid.innerHTML = html;
        
        // Actualizar estado de checkboxes después de renderizar
        this.actualizarEstadoCheckboxes();
    }

    renderizarHistorialCuotas() {
        const lista = document.getElementById('listaCuotas');
        const total = document.getElementById('totalPagosCuotas');
        const pagosBombero = this.pagosCuotas
            .filter(p => p.bomberoId == this.bomberoActual.id)
            .sort((a, b) => new Date(b.fechaPago) - new Date(a.fechaPago));
        
        // Actualizar contador
        if (total) {
            total.textContent = pagosBombero.length;
        }

        if (pagosBombero.length === 0) {
            lista.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">No hay pagos de cuotas registrados</p>';
            return;
        }

        lista.innerHTML = pagosBombero.map(pago => `
            <div class="pago-card">
                <div class="pago-header">
                    <div>
                        <strong>${this.obtenerNombreMes(pago.mes)} ${pago.anio}</strong> - 
                        <span>${pago.tipoCuota === 'regular' ? 'Cuota Regular' : 'Cuota Estudiante'}</span>
                    </div>
                    <div class="pago-monto">${this.formatearMonto(pago.monto)}</div>
                </div>
                <div class="item-info">
                    <div><strong>Fecha de pago:</strong> <span>${Utils.formatearFecha(pago.fechaPago)}</span></div>
                    ${pago.formaPago ? `<div><strong>Forma de pago:</strong> <span>${pago.formaPago}</span></div>` : ''}
                    ${pago.observaciones ? `<div><strong>Observaciones:</strong> <span>${pago.observaciones}</span></div>` : ''}
                    <div><strong>Registrado por:</strong> <span>${pago.registradoPor}</span></div>
                </div>
            </div>
        `).join('');
    }

    // ==================== BENEFICIOS ====================
    async manejarSubmitCrearBeneficio(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const datos = Object.fromEntries(formData);
        
        const errores = this.validarDatosBeneficio(datos);
        if (errores.length > 0) {
            Utils.mostrarNotificacion('Errores: ' + errores.join(', '), 'error');
            return;
        }

        try {
            await this.guardarBeneficio(datos);
            Utils.mostrarNotificacion('Beneficio creado exitosamente', 'success');
            this.limpiarFormularioBeneficio();
            this.cargarBeneficiosEnSelect();
            this.renderizarBeneficiosActivos();
        } catch (error) {
            Utils.mostrarNotificacion(error.message, 'error');
        }
    }

    validarDatosBeneficio(datos) {
        const errores = [];
        
        if (!datos.tipoBeneficio) errores.push('Debe seleccionar tipo de beneficio');
        if (!datos.nombreBeneficio) errores.push('Debe ingresar nombre del evento');
        if (!datos.fechaEvento) errores.push('Debe ingresar fecha del evento');
        if (!datos.fechaLimiteRendicion) errores.push('Debe ingresar fecha límite de rendición');
        if (!datos.cantidadTarjetas || parseInt(datos.cantidadTarjetas) <= 0) errores.push('Cantidad de tarjetas inválida');
        if (!datos.precioTarjeta || parseFloat(datos.precioTarjeta) <= 0) errores.push('Precio de tarjeta inválido');
        
        if (new Date(datos.fechaLimiteRendicion) < new Date(datos.fechaEvento)) {
            errores.push('La fecha límite debe ser posterior a la fecha del evento');
        }
        
        return errores;
    }

    async guardarBeneficio(datos) {
        const beneficio = {
            id: this.generarId(),
            tipo: datos.tipoBeneficio,
            nombre: datos.nombreBeneficio,
            fechaEvento: datos.fechaEvento,
            fechaLimiteRendicion: datos.fechaLimiteRendicion,
            cantidadTarjetas: parseInt(datos.cantidadTarjetas),
            precioTarjeta: parseFloat(datos.precioTarjeta),
            descripcion: datos.descripcionBeneficio || null,
            estado: 'activo',
            creadoPor: JSON.parse(localStorage.getItem('currentUser')).username,
            fechaCreacion: new Date().toISOString()
        };

        this.beneficios.push(beneficio);
        this.guardarDatos();
    }

    cargarBeneficiosEnSelect() {
        const select = document.getElementById('beneficioSeleccionado');
        const beneficiosActivos = this.beneficios.filter(b => b.estado === 'activo');
        
        select.innerHTML = '<option value="">Seleccione un beneficio</option>';
        
        beneficiosActivos.forEach(b => {
            const option = document.createElement('option');
            option.value = b.id;
            option.textContent = `${b.nombre} - ${b.tipo}`;
            select.appendChild(option);
        });
    }

    cambioBeneficioSeleccionado() {
        const beneficioId = document.getElementById('beneficioSeleccionado').value;
        const infoDiv = document.getElementById('infoBeneficioSeleccionado');
        
        if (!beneficioId) {
            infoDiv.style.display = 'none';
            document.getElementById('montoPagoBeneficio').value = '';
            return;
        }

        const beneficio = this.beneficios.find(b => b.id === beneficioId);
        if (!beneficio) return;

        document.getElementById('infoTarjetasAsignadas').textContent = beneficio.cantidadTarjetas;
        document.getElementById('infoPrecioTarjeta').textContent = this.formatearMonto(beneficio.precioTarjeta);
        document.getElementById('infoTotalEsperado').textContent = this.formatearMonto(beneficio.cantidadTarjetas * beneficio.precioTarjeta);
        document.getElementById('infoFechaLimite').textContent = Utils.formatearFecha(beneficio.fechaLimiteRendicion);
        
        infoDiv.style.display = 'block';
        
        // Calcular monto al cambiar tarjetas vendidas
        document.getElementById('tarjetasVendidas').addEventListener('input', () => {
            this.calcularMontoBeneficio();
        });
    }

    calcularMontoBeneficio() {
        const beneficioId = document.getElementById('beneficioSeleccionado').value;
        const tarjetasVendidas = parseInt(document.getElementById('tarjetasVendidas').value) || 0;
        
        if (!beneficioId) return;
        
        const beneficio = this.beneficios.find(b => b.id === beneficioId);
        if (!beneficio) return;
        
        const monto = tarjetasVendidas * beneficio.precioTarjeta;
        document.getElementById('montoPagoBeneficio').value = monto;
    }

    async manejarSubmitPagoBeneficio(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const datos = Object.fromEntries(formData);
        
        const errores = this.validarDatosPagoBeneficio(datos);
        if (errores.length > 0) {
            Utils.mostrarNotificacion('Errores: ' + errores.join(', '), 'error');
            return;
        }

        try {
            await this.guardarPagoBeneficio(datos);
            Utils.mostrarNotificacion('Pago de beneficio registrado exitosamente', 'success');
            this.limpiarFormularioPagoBeneficio();
            this.renderizarHistorialBeneficios();
            this.actualizarSaldoSidebar(); // Actualizar saldo inmediatamente
            
        } catch (error) {
            Utils.mostrarNotificacion(error.message, 'error');
        }
    }

    validarDatosPagoBeneficio(datos) {
        const errores = [];
        
        if (!datos.beneficioSeleccionado) errores.push('Debe seleccionar un beneficio');
        if (!datos.tarjetasVendidas || parseInt(datos.tarjetasVendidas) < 0) errores.push('Cantidad de tarjetas inválida');
        if (!datos.montoPagoBeneficio || parseFloat(datos.montoPagoBeneficio) < 0) errores.push('Monto inválido');
        if (!datos.fechaPagoBeneficio) errores.push('Debe ingresar la fecha de pago');
        
        return errores;
    }

    async guardarPagoBeneficio(datos) {
        const beneficio = this.beneficios.find(b => b.id === datos.beneficioSeleccionado);
        
        const pagoBeneficio = {
            id: this.generarId(),
            bomberoId: parseInt(datos.bomberoBeneficioId),
            beneficioId: datos.beneficioSeleccionado,
            beneficioNombre: beneficio.nombre,
            tarjetasAsignadas: beneficio.cantidadTarjetas,
            tarjetasVendidas: parseInt(datos.tarjetasVendidas),
            precioTarjeta: beneficio.precioTarjeta,
            montoPagado: parseFloat(datos.montoPagoBeneficio),
            montoEsperado: beneficio.cantidadTarjetas * beneficio.precioTarjeta,
            fechaPago: datos.fechaPagoBeneficio,
            observaciones: datos.observacionesBeneficio || null,
            registradoPor: JSON.parse(localStorage.getItem('currentUser')).username,
            fechaRegistro: new Date().toISOString()
        };

        this.pagosBeneficios.push(pagoBeneficio);
        
        // Registrar movimiento financiero (INGRESO)
        const movimiento = {
            id: this.generarId(),
            tipo: 'ingreso',
            categoria: 'Beneficio',
            monto: parseFloat(datos.montoPagoBeneficio),
            descripcion: `Beneficio: ${beneficio.nombre} - ${this.bomberoActual ? Utils.obtenerNombreCompleto(this.bomberoActual) : 'Voluntario'} (${datos.tarjetasVendidas}/${beneficio.cantidadTarjetas} tarjetas)`,
            fecha: datos.fechaPagoBeneficio,
            registradoPor: JSON.parse(localStorage.getItem('currentUser')).username,
            fechaRegistro: new Date().toISOString()
        };
        
        const movimientos = storage.getMovimientosFinancieros();
        movimientos.push(movimiento);
        storage.saveMovimientosFinancieros(movimientos);
        
        this.guardarDatos();
    }

    renderizarBeneficiosActivos() {
        const lista = document.getElementById('listaBeneficiosActivos');
        const beneficiosActivos = this.beneficios.filter(b => b.estado === 'activo');

        if (beneficiosActivos.length === 0) {
            lista.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">No hay beneficios activos</p>';
            return;
        }

        lista.innerHTML = beneficiosActivos.map(b => {
            const hoy = new Date();
            const fechaLimite = new Date(b.fechaLimiteRendicion);
            let estadoClass = 'activo';
            let estadoTexto = 'Activo';
            
            if (fechaLimite < hoy) {
                estadoClass = 'vencido';
                estadoTexto = 'Vencido';
            }

            return `
                <div class="beneficio-card">
                    <div class="beneficio-header">
                        <div class="beneficio-tipo">${b.tipo} - ${b.nombre}</div>
                        <div class="beneficio-estado ${estadoClass}">${estadoTexto}</div>
                    </div>
                    <div class="item-info">
                        <div><strong>Fecha evento:</strong> <span>${Utils.formatearFecha(b.fechaEvento)}</span></div>
                        <div><strong>Fecha límite:</strong> <span>${Utils.formatearFecha(b.fechaLimiteRendicion)}</span></div>
                        <div><strong>Tarjetas por voluntario:</strong> <span>${b.cantidadTarjetas}</span></div>
                        <div><strong>Precio por tarjeta:</strong> <span>${this.formatearMonto(b.precioTarjeta)}</span></div>
                        <div><strong>Total esperado:</strong> <span>${this.formatearMonto(b.cantidadTarjetas * b.precioTarjeta)}</span></div>
                        ${b.descripcion ? `<div class="full-width"><strong>Descripción:</strong> <span>${b.descripcion}</span></div>` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    renderizarHistorialBeneficios() {
        const lista = document.getElementById('listaPagosBeneficios');
        const pagosBombero = this.pagosBeneficios
            .filter(p => p.bomberoId == this.bomberoActual.id)
            .sort((a, b) => new Date(b.fechaPago) - new Date(a.fechaPago));

        if (pagosBombero.length === 0) {
            lista.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">No hay pagos de beneficios registrados</p>';
            return;
        }

        lista.innerHTML = pagosBombero.map(pago => {
            const esCompleto = pago.montoPagado >= pago.montoEsperado;
            
            return `
                <div class="pago-card">
                    <div class="pago-header">
                        <div><strong>${pago.beneficioNombre}</strong></div>
                        <div class="pago-monto">${this.formatearMonto(pago.montoPagado)}</div>
                    </div>
                    <div class="item-info">
                        <div><strong>Tarjetas asignadas:</strong> <span>${pago.tarjetasAsignadas}</span></div>
                        <div><strong>Tarjetas vendidas:</strong> <span>${pago.tarjetasVendidas}</span></div>
                        <div><strong>Monto esperado:</strong> <span>${this.formatearMonto(pago.montoEsperado)}</span></div>
                        <div><strong>Estado:</strong> <span style="color: ${esCompleto ? '#4caf50' : '#f44336'}">${esCompleto ? '✓ Completo' : '⚠ Incompleto'}</span></div>
                        <div><strong>Fecha de pago:</strong> <span>${Utils.formatearFecha(pago.fechaPago)}</span></div>
                        ${pago.observaciones ? `<div class="full-width"><strong>Observaciones:</strong> <span>${pago.observaciones}</span></div>` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    // ==================== ESTADO DE DEUDAS ====================
    renderizarEstadoDeudas() {
        const deudaCuotas = this.calcularDeudaCuotas();
        const deudaBeneficios = this.calcularDeudaBeneficios();
        const deudaTotal = deudaCuotas.monto + deudaBeneficios.monto;

        document.getElementById('deudaCuotas').textContent = this.formatearMonto(deudaCuotas.monto);
        document.getElementById('detalleCuotasDeuda').textContent = `${deudaCuotas.mesesPendientes} meses pendientes`;
        
        document.getElementById('deudaBeneficios').textContent = this.formatearMonto(deudaBeneficios.monto);
        document.getElementById('detalleBeneficiosDeuda').textContent = `${deudaBeneficios.beneficiosPendientes} beneficios pendientes`;
        
        document.getElementById('deudaTotal').textContent = this.formatearMonto(deudaTotal);

        // Renderizar detalle de deudas
        const contenedor = document.getElementById('deudasDetalladas');
        let html = '';

        if (deudaCuotas.detalle.length > 0) {
            html += '<h4>Cuotas Pendientes:</h4>';
            deudaCuotas.detalle.forEach(d => {
                html += `
                    <div class="deuda-item">
                        <h5>Cuota ${d.mes} ${d.anio}</h5>
                        <p>Monto: ${this.formatearMonto(d.monto)}</p>
                    </div>
                `;
            });
        }

        if (deudaBeneficios.detalle.length > 0) {
            html += '<h4 style="margin-top: 20px;">Beneficios Pendientes:</h4>';
            deudaBeneficios.detalle.forEach(d => {
                html += `
                    <div class="deuda-item">
                        <h5>${d.nombre}</h5>
                        <p>Monto pendiente: ${this.formatearMonto(d.montoPendiente)}</p>
                        <p>Fecha límite: ${Utils.formatearFecha(d.fechaLimite)}</p>
                        ${d.vencido ? '<p style="color: #f44336; font-weight: bold;">⚠ VENCIDO</p>' : ''}
                    </div>
                `;
            });
        }

        if (deudaTotal === 0) {
            html = '<p style="text-align: center; color: #4caf50; font-size: 1.2rem; padding: 20px;">✓ No hay deudas pendientes</p>';
        }

        contenedor.innerHTML = html;
    }

    calcularDeudaCuotas() {
        const hoy = new Date();
        const mesActual = hoy.getMonth() + 1;
        const anioActual = hoy.getFullYear();
        
        let monto = 0;
        let mesesPendientes = 0;
        let detalle = [];

        // Calcular cuotas pendientes del año actual
        for (let mes = 1; mes <= mesActual; mes++) {
            const pagado = this.pagosCuotas.find(p => 
                p.bomberoId == this.bomberoActual.id && 
                p.mes == mes && 
                p.anio == anioActual
            );

            if (!pagado) {
                monto += 5000; // Asumiendo cuota regular
                mesesPendientes++;
                detalle.push({
                    mes: this.obtenerNombreMes(mes),
                    anio: anioActual,
                    monto: 5000
                });
            }
        }

        return { monto, mesesPendientes, detalle };
    }

    calcularDeudaBeneficios() {
        const hoy = new Date();
        let monto = 0;
        let beneficiosPendientes = 0;
        let detalle = [];

        const beneficiosActivos = this.beneficios.filter(b => b.estado === 'activo');

        beneficiosActivos.forEach(b => {
            const pago = this.pagosBeneficios.find(p => 
                p.bomberoId == this.bomberoActual.id && 
                p.beneficioId === b.id
            );

            const montoEsperado = b.cantidadTarjetas * b.precioTarjeta;
            const montoPagado = pago ? pago.montoPagado : 0;
            const montoPendiente = montoEsperado - montoPagado;

            if (montoPendiente > 0) {
                monto += montoPendiente;
                beneficiosPendientes++;
                detalle.push({
                    nombre: b.nombre,
                    montoPendiente: montoPendiente,
                    fechaLimite: b.fechaLimiteRendicion,
                    vencido: new Date(b.fechaLimiteRendicion) < hoy
                });
            }
        });

        return { monto, beneficiosPendientes, detalle };
    }

  // ==================== REGISTRO EN FINANZAS ====================
    async registrarIngresoFinanzas(datos) {
        const movimientos = storage.getMovimientosFinancieros();
        
        const movimiento = {
            id: this.generarId(),
            tipo: 'ingreso',
            monto: datos.monto,
            categoria: datos.tipo,
            detalle: datos.descripcion,
            fecha: datos.fecha,
            descripcion: datos.descripcion,
            comprobante: null,
            nombreComprobanteOriginal: null,
            registradoPor: JSON.parse(localStorage.getItem('currentUser')).username,
            fechaRegistro: new Date().toISOString()
        };

        movimientos.push(movimiento);
        storage.saveMovimientosFinancieros(movimientos);
    }

    // ==================== UTILIDADES ====================
    generarId() {
        return Date.now() + Math.random().toString(36).substr(2, 9);
    }

    guardarDatos() {
        storage.saveBeneficios(this.beneficios);
        storage.savePagosCuotas(this.pagosCuotas);
        storage.savePagosBeneficios(this.pagosBeneficios);
    }

    formatearMonto(monto) {
        return new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: 'CLP',
            minimumFractionDigits: 0
        }).format(monto);
    }

    obtenerNombreMes(numero) {
        const meses = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        return meses[parseInt(numero) - 1];
    }

    actualizarSaldoSidebar() {
        // Usar la función global del sidebar si existe
        if (typeof actualizarSaldoCompania === 'function') {
            actualizarSaldoCompania();
        }
    }

    renderizarTodo() {
        this.renderizarGridMeses();
        this.actualizarEstadoCheckboxes();
        this.renderizarHistorialCuotas();
        this.cargarBeneficiosEnSelect();
        this.renderizarBeneficiosActivos();
        this.renderizarHistorialBeneficios();
    }

    limpiarFormularioCuota() {
        document.getElementById('formCuotaSocial').reset();
        document.getElementById('bomberoCuotaId').value = this.bomberoActual.id;
        document.getElementById('anioCuota').value = this.anioActual;
        document.getElementById('fechaPagoCuota').value = new Date().toISOString().split('T')[0];
        document.getElementById('totalAPagar').textContent = '$0';
        
        // Desmarcar todos los checkboxes
        document.querySelectorAll('input[name="meses"]').forEach(cb => {
            if (!cb.disabled) {
                cb.checked = false;
            }
        });
    }

    limpiarFormularioBeneficio() {
        document.getElementById('formCrearBeneficio').reset();
    }

    limpiarFormularioPagoBeneficio() {
        document.getElementById('formPagoBeneficio').reset();
        document.getElementById('bomberoBeneficioId').value = this.bomberoActual.id;
        document.getElementById('fechaPagoBeneficio').value = new Date().toISOString().split('T')[0];
        document.getElementById('infoBeneficioSeleccionado').style.display = 'none';
    }

    async generarPDFDeudas() {
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.width;
            let yPos = 20;

            // Calcular deudas
            const deudaCuotas = this.calcularDeudaCuotas();
            const deudaBeneficios = this.calcularDeudaBeneficios();
            const deudaTotal = deudaCuotas.monto + deudaBeneficios.monto;

            // Logo si existe
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

            // Información del Voluntario
            yPos += 15;
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.text('DATOS DEL VOLUNTARIO', 15, yPos);
            
            yPos += 8;
            doc.setFontSize(10);
            doc.setFont(undefined, 'normal');
            doc.text(`Nombre: ${Utils.obtenerNombreCompleto(this.bomberoActual)}`, 15, yPos);
            yPos += 6;
            doc.text(`Clave: ${this.bomberoActual.claveBombero}`, 15, yPos);
            yPos += 6;
            doc.text(`RUT: ${this.bomberoActual.rut}`, 15, yPos);
            yPos += 6;
            doc.text(`Compañía: ${this.bomberoActual.compania}`, 15, yPos);

            // Resumen de Deudas
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
            doc.text(`Deuda en Cuotas: ${this.formatearMonto(deudaCuotas.monto)} (${deudaCuotas.mesesPendientes} meses)`, 20, yPos);
            
            yPos += 6;
            doc.text(`Deuda en Beneficios: ${this.formatearMonto(deudaBeneficios.monto)} (${deudaBeneficios.beneficiosPendientes} beneficios)`, 20, yPos);
            
            yPos += 8;
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            if (deudaTotal > 0) {
                doc.setTextColor(244, 67, 54); // Rojo
            } else {
                doc.setTextColor(76, 175, 80); // Verde
            }
            doc.text(`TOTAL ADEUDADO: ${this.formatearMonto(deudaTotal)}`, 20, yPos);
            doc.setTextColor(0, 0, 0);

            // Detalle de Cuotas Pendientes
            if (deudaCuotas.detalle.length > 0) {
                yPos += 15;
                doc.setFontSize(12);
                doc.setFont(undefined, 'bold');
                doc.text('CUOTAS PENDIENTES', 15, yPos);
                
                yPos += 5;
                const cuotasData = deudaCuotas.detalle.map(d => [
                    d.mes,
                    d.anio,
                    this.formatearMonto(d.monto)
                ]);

                doc.autoTable({
                    startY: yPos,
                    head: [['Mes', 'Año', 'Monto']],
                    body: cuotasData,
                    theme: 'grid',
                    headStyles: { fillColor: [255, 152, 0] },
                    margin: { left: 15, right: 15 }
                });

                yPos = doc.lastAutoTable.finalY + 10;
            }

            // Detalle de Beneficios Pendientes
            if (deudaBeneficios.detalle.length > 0) {
                if (yPos > 220) {
                    doc.addPage();
                    yPos = 20;
                }

                doc.setFontSize(12);
                doc.setFont(undefined, 'bold');
                doc.text('BENEFICIOS PENDIENTES', 15, yPos);
                
                yPos += 5;
                const beneficiosData = deudaBeneficios.detalle.map(d => [
                    d.nombre,
                    this.formatearMonto(d.montoPendiente),
                    Utils.formatearFecha(d.fechaLimite),
                    d.vencido ? 'VENCIDO' : 'Vigente'
                ]);

                doc.autoTable({
                    startY: yPos,
                    head: [['Beneficio', 'Monto Pendiente', 'Fecha Límite', 'Estado']],
                    body: beneficiosData,
                    theme: 'grid',
                    headStyles: { fillColor: [33, 150, 243] },
                    margin: { left: 15, right: 15 },
                    columnStyles: {
                        3: { 
                            cellWidth: 25,
                            fontStyle: 'bold'
                        }
                    },
                    didParseCell: function(data) {
                        if (data.section === 'body' && data.column.index === 3) {
                            if (data.cell.raw === 'VENCIDO') {
                                data.cell.styles.textColor = [244, 67, 54];
                            } else {
                                data.cell.styles.textColor = [76, 175, 80];
                            }
                        }
                    }
                });
            }

            // Nota final
            yPos = doc.internal.pageSize.height - 20;
            doc.setFontSize(8);
            doc.setTextColor(128, 128, 128);
            doc.text('Este documento es un informe generado automáticamente por el Sistema SEIS', pageWidth / 2, yPos, { align: 'center' });

            // Guardar PDF
            const nombreArchivo = `Informe_Deudas_${this.bomberoActual.claveBombero}_${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(nombreArchivo);

            Utils.mostrarNotificacion('✅ PDF de deudas generado exitosamente', 'success');
        } catch (error) {
            console.error('Error al generar PDF:', error);
            Utils.mostrarNotificacion('❌ Error al generar PDF: ' + error.message, 'error');
        }
    }

    async exportarExcel() {
        try {
            const cuotasBombero = this.pagosCuotas.filter(p => p.bomberoId == this.bomberoActual.id);
            const beneficiosBombero = this.pagosBeneficios.filter(p => p.bomberoId == this.bomberoActual.id);
            
            const datosExcel = [];
            
            // Sección de cuotas
            datosExcel.push({
                'Tipo': 'CUOTAS SOCIALES',
                'Detalle': '',
                'Fecha': '',
                'Monto': ''
            });
            
            cuotasBombero.forEach(c => {
                datosExcel.push({
                    'Tipo': 'Cuota Social',
                    'Detalle': `${this.obtenerNombreMes(c.mes)} ${c.anio}`,
                    'Fecha': Utils.formatearFecha(c.fechaPago),
                    'Monto': c.monto
                });
            });
            
            datosExcel.push({});
            
            // Sección de beneficios
            datosExcel.push({
                'Tipo': 'BENEFICIOS',
                'Detalle': '',
                'Fecha': '',
                'Monto': ''
            });
            
            beneficiosBombero.forEach(b => {
                datosExcel.push({
                    'Tipo': 'Beneficio',
                    'Detalle': b.beneficioNombre,
                    'Fecha': Utils.formatearFecha(b.fechaPago),
                    'Monto': b.montoPagado
                });
            });

            await Utils.exportarAExcel(
                datosExcel,
                `Cuotas_Beneficios_${this.bomberoActual.claveBombero}_${new Date().toISOString().split('T')[0]}.xlsx`,
                'Cuotas y Beneficios'
            );

            Utils.mostrarNotificacion('Excel descargado exitosamente', 'success');
        } catch (error) {
            Utils.mostrarNotificacion('Error al generar Excel: ' + error.message, 'error');
        }
    }

    volverAlSistema() {
        localStorage.removeItem('bomberoCuotasActual');
        window.location.href = 'sistema.html';
    }
    
}

document.addEventListener('DOMContentLoaded', () => {
    window.cuotasSistema = new SistemaCuotasBeneficios();
});