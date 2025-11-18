// ==================== GENERADOR DE INFORMES DE DEUDAS ====================
class GeneradorInformes {
    
 static async generarInformeDeudas(bomberoId) {
    const bomberos = storage.getBomberos();
    const bombero = bomberos.find(b => b.id == bomberoId);
    
    if (!bombero) {
        Utils.mostrarNotificacion('Bombero no encontrado', 'error');
        return;
    }

    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;
        const margin = 20;
        let yPos = 20;

        doc.setFillColor(196, 30, 58);
        doc.rect(0, 0, pageWidth, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.setFont(undefined, 'bold');
        doc.text('INFORME DE DEUDAS', pageWidth / 2, 15, { align: 'center' });
        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');
        doc.text('Compañía de Bomberos', pageWidth / 2, 25, { align: 'center' });
        doc.text(`Fecha: ${new Date().toLocaleDateString('es-CL')}`, pageWidth / 2, 32, { align: 'center' });
        yPos = 50;

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('DATOS DEL VOLUNTARIO', margin, yPos);
        yPos += 10;
        
        // AQUÍ ESTÁ EL CAMBIO PRINCIPAL
        const nombreCompleto = Utils.obtenerNombreCompleto(bombero);
        
        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');
        doc.text(`Nombre: ${nombreCompleto}`, margin, yPos);
        yPos += 6;
        doc.text(`Clave: ${bombero.claveBombero}`, margin, yPos);
        yPos += 6;
        doc.text(`RUT: ${bombero.rut}`, margin, yPos);
        yPos += 6;
        doc.text(`Compañía: ${bombero.compania}`, margin, yPos);
        yPos += 15;

        const deudasCuotas = this.calcularDeudasCuotas(bomberoId);
        doc.setFillColor(0, 63, 135);
        doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('CUOTAS SOCIALES', margin + 3, yPos + 5);
        yPos += 12;
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');

        if (deudasCuotas.length === 0) {
            doc.text('Sin deudas pendientes', margin + 5, yPos);
            yPos += 8;
        } else {
            doc.setFont(undefined, 'bold');
            doc.text(`Total meses adeudados: ${deudasCuotas.length}`, margin + 5, yPos);
            yPos += 6;
            doc.setFont(undefined, 'normal');
            deudasCuotas.forEach((deuda) => {
                if (yPos > 270) { doc.addPage(); yPos = 20; }
                doc.text(`  ${deuda.mes} ${deuda.anio} - ${deuda.monto}`, margin + 5, yPos);
                yPos += 6;
            });
            yPos += 2;
            doc.setFont(undefined, 'bold');
            doc.text(`TOTAL ADEUDADO: ${this.formatearMonto(deudasCuotas.reduce((sum, d) => sum + d.montoNumerico, 0))}`, margin + 5, yPos);
            yPos += 10;
        }

        const deudasBeneficios = this.calcularDeudasBeneficios(bomberoId);
        doc.setFillColor(156, 39, 176);
        doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('BENEFICIOS', margin + 3, yPos + 5);
        yPos += 12;
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');

        if (deudasBeneficios.length === 0) {
            doc.text('Sin deudas pendientes', margin + 5, yPos);
            yPos += 8;
        } else {
            doc.setFont(undefined, 'bold');
            doc.text(`Total beneficios adeudados: ${deudasBeneficios.length}`, margin + 5, yPos);
            yPos += 6;
            doc.setFont(undefined, 'normal');
            deudasBeneficios.forEach((deuda) => {
                if (yPos > 260) { doc.addPage(); yPos = 20; }
                doc.text(`  ${deuda.nombreBeneficio}`, margin + 5, yPos);
                yPos += 5;
                doc.setFontSize(9);
                doc.setTextColor(100, 100, 100);
                doc.text(`    Fecha: ${deuda.fecha} | Monto: ${deuda.monto}`, margin + 5, yPos);
                yPos += 6;
                doc.setFontSize(10);
                doc.setTextColor(0, 0, 0);
            });
            yPos += 2;
            doc.setFont(undefined, 'bold');
            doc.text(`TOTAL ADEUDADO: ${this.formatearMonto(deudasBeneficios.reduce((sum, d) => sum + d.montoNumerico, 0))}`, margin + 5, yPos);
            yPos += 10;
        }

        const totalGeneral = deudasCuotas.reduce((sum, d) => sum + d.montoNumerico, 0) + deudasBeneficios.reduce((sum, d) => sum + d.montoNumerico, 0);
        
        if (totalGeneral > 0) {
            yPos += 5;
            doc.setFillColor(196, 30, 58);
            doc.rect(margin, yPos, pageWidth - 2 * margin, 12, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            doc.text(`DEUDA TOTAL: ${this.formatearMonto(totalGeneral)}`, pageWidth / 2, yPos + 8, { align: 'center' });
        }

        doc.save(`Informe_Deudas_${bombero.claveBombero}_${new Date().toISOString().split('T')[0]}.pdf`);
        Utils.mostrarNotificacion('Informe generado exitosamente', 'success');
    } catch (error) {
        console.error('Error:', error);
        Utils.mostrarNotificacion('Error al generar el informe: ' + error.message, 'error');
    }
}
    static calcularDeudasCuotas(bomberoId) {
        const pagosCuotas = storage.getPagosCuotas();
        const anioActual = new Date().getFullYear();
        const mesActual = new Date().getMonth() + 1;
        const deudas = [];
        const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        
        for (let mes = 1; mes <= mesActual; mes++) {
            const pagado = pagosCuotas.some(p => p.bomberoId == bomberoId && p.mes == mes && p.anio == anioActual);
            if (!pagado) {
                deudas.push({ mes: meses[mes - 1], anio: anioActual, monto: '$5.000', montoNumerico: 5000 });
            }
        }
        return deudas;
    }

    static calcularDeudasBeneficios(bomberoId) {
        const beneficios = storage.getBeneficios();
        const asignaciones = storage.getAsignacionesBeneficios();
        const pagosBeneficios = storage.getPagosBeneficios();
        const deudas = [];
        
        // MÉTODO 1: Buscar en asignaciones (sistema beneficios.html)
        const asignacionesBombero = asignaciones.filter(a => 
            a.bomberoId == bomberoId && 
            (a.estadoPago === 'pendiente' || a.estadoPago === 'parcial')
        );
        
        asignacionesBombero.forEach(asignacion => {
            const beneficio = beneficios.find(b => b.id === asignacion.beneficioId);
            if (beneficio && beneficio.estado === 'activo') {
                const montoDeuda = asignacion.montoEsperado - asignacion.montoPagado;
                if (montoDeuda > 0) {
                    deudas.push({
                        nombreBeneficio: beneficio.nombre,
                        monto: this.formatearMonto(montoDeuda),
                        montoNumerico: montoDeuda,
                        fecha: Utils.formatearFecha(beneficio.fechaEvento || beneficio.fecha)
                    });
                }
            }
        });
        
        // MÉTODO 2: Buscar beneficios con cantidadTarjetas (sistema cuotas-beneficios.html)
        const beneficiosActivos = beneficios.filter(b => 
            b.estado === 'activo' && 
            b.cantidadTarjetas && 
            b.precioTarjeta
        );
        
        beneficiosActivos.forEach(beneficio => {
            // Verificar que este beneficio no esté ya en deudas (evitar duplicados)
            const yaAgregado = deudas.some(d => {
                const benef = beneficios.find(b => b.nombre === d.nombreBeneficio);
                return benef && benef.id === beneficio.id;
            });
            
            if (yaAgregado) return;
            
            const pago = pagosBeneficios.find(p => 
                p.bomberoId == bomberoId && 
                p.beneficioId === beneficio.id
            );
            
            const montoEsperado = beneficio.cantidadTarjetas * beneficio.precioTarjeta;
            const montoPagado = pago ? pago.montoPagado : 0;
            const montoPendiente = montoEsperado - montoPagado;
            
            if (montoPendiente > 0) {
                deudas.push({
                    nombreBeneficio: beneficio.nombre,
                    monto: this.formatearMonto(montoPendiente),
                    montoNumerico: montoPendiente,
                    fecha: Utils.formatearFecha(beneficio.fechaEvento || beneficio.fecha)
                });
            }
        });
        
        return deudas;
    }

    static formatearMonto(monto) {
        return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', minimumFractionDigits: 0 }).format(monto);
    }
}

function generarInformeDeudas(bomberoId) {
    GeneradorInformes.generarInformeDeudas(bomberoId);
}