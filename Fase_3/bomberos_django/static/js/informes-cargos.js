// ==================== GENERADOR DE INFORMES PDF (CARGOS) ====================
// Esta función recrea la estructura de tu Certificado de Cargos.
class GeneradorInformes {
    
    // --- Utilidades Estáticas ---
    static formatearFecha(fecha) {
        if (!fecha) return '-';
        try {
            // Usamos la función de utilidad general del sistema, pero asegurando el formato.
            return new Date(fecha + 'T00:00:00').toLocaleDateString('es-CL');
        } catch (error) {
            return fecha;
        }
    }
    
    static ordenarCargos(cargos) {
        return [...cargos].sort((a, b) => 
            new Date(b.fechaInicioCargo) - new Date(a.fechaInicioCargo)
        );
    }
    // ----------------------------


static async generarPDFCargos(bomberoId) {
    if (typeof window.jspdf === 'undefined') {
        Utils.mostrarNotificacion('Error: La librería jsPDF no está definida. Revise el orden de scripts en su HTML.', 'error');
        return;
    }

    const bomberos = storage.getBomberos();
    const cargos = storage.getCargos();
    const bombero = bomberos.find(b => b.id == bomberoId);
    
    if (!bombero) {
        Utils.mostrarNotificacion('Error: Bombero no encontrado para el ID ' + bomberoId, 'error');
        return;
    }
    
    const cargosBombero = cargos.filter(c => c.bomberoId == bomberoId);
    
    if (cargosBombero.length === 0) {
        Utils.mostrarNotificacion('No hay cargos registrados para exportar', 'warning');
        return;
    }

    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;
        const margin = 20;
        let yPos = 20;

        // ENCABEZADO CON FONDO ROJO
        doc.setFillColor(196, 30, 58);
        doc.rect(0, 0, pageWidth, 50, 'F');
        
        // FOTO DEL BOMBERO (izquierda)
        if (bombero.foto) {
            try {
                doc.addImage(bombero.foto, 'JPEG', 15, 10, 30, 35);
            } catch (error) {
                doc.setFillColor(255, 255, 255);
                doc.rect(15, 10, 30, 35, 'F');
            }
        } else {
            doc.setFillColor(255, 255, 255);
            doc.rect(15, 10, 30, 35, 'F');
            doc.setTextColor(150, 150, 150);
            doc.setFontSize(10);
            doc.text('Sin foto', 30, 30, { align: 'center' });
        }
        
        // TÍTULO CENTRADO
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.setFont(undefined, 'bold');
        doc.text('CERTIFICADO DE CARGOS', pageWidth / 2, 25, { align: 'center' });
        
        // FECHA (centrada)
        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');
        const fechaActual = new Date().toLocaleDateString('es-CL', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        doc.text(fechaActual, pageWidth / 2, 35, { align: 'center' });
        
        yPos = 60;

        // INFORMACIÓN DEL BOMBERO
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text('DATOS DEL VOLUNTARIO', pageWidth / 2, yPos, { align: 'center' });
        yPos += 10;
        
        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');
        
        // AQUÍ ESTÁ EL CAMBIO PRINCIPAL
        const nombreCompleto = Utils.obtenerNombreCompleto(bombero);
        
        const infoBombero = [
            `Nombre: ${nombreCompleto}`,
            `Clave Bombero: ${bombero.claveBombero || 'N/A'}`,
            `RUT: ${bombero.rut || 'N/A'}`,
            `Compañía: ${bombero.compania}`
        ];
        
        infoBombero.forEach(info => {
            doc.text(info, pageWidth / 2, yPos, { align: 'center' });
            yPos += 6;
        });
        
        yPos += 10;

        // TÍTULO DE CARGOS
        doc.setFillColor(0, 63, 135);
        doc.rect(margin, yPos, pageWidth - 2 * margin, 10, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('CARGOS DESEMPEÑADOS', pageWidth / 2, yPos + 7, { align: 'center' });
        yPos += 15;

        // CARGOS ORDENADOS
        const cargosOrdenados = GeneradorInformes.ordenarCargos(cargosBombero);
        
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');

        cargosOrdenados.forEach((cargo, index) => {
            if (yPos > pageHeight - 40) {
                doc.addPage();
                yPos = 20;
            }
            
            // NÚMERO Y CARGO
            doc.setFont(undefined, 'bold');
            const titulo = `${index + 1}. ${cargo.tipoCargo || 'Cargo no especificado'}${cargo.añoCargo ? ` (${cargo.añoCargo})` : ''}`;
            doc.text(titulo, margin + 5, yPos);
            yPos += 6;
            
            doc.setFont(undefined, 'normal');
            
            // PERÍODO
            let periodo = '';
            if (cargo.fechaInicioCargo) {
                periodo = `Desde: ${GeneradorInformes.formatearFecha(cargo.fechaInicioCargo)}`;
                if (cargo.fechaFinCargo) {
                    periodo += ` | Hasta: ${GeneradorInformes.formatearFecha(cargo.fechaFinCargo)}`;
                } else {
                    periodo += ' | En ejercicio';
                }
                doc.text(periodo, margin + 10, yPos);
                yPos += 5;
            }
            
            // OBSERVACIONES
            if (cargo.observacionesCargo) {
                doc.setFontSize(9);
                doc.setTextColor(80, 80, 80);
                const obsTexto = `Observaciones: ${cargo.observacionesCargo}`;
                const lineasObs = doc.splitTextToSize(obsTexto, pageWidth - 2 * margin - 20);
                doc.text(lineasObs, margin + 10, yPos);
                yPos += lineasObs.length * 4.5;
                doc.setFontSize(10);
                doc.setTextColor(0, 0, 0);
            }
            
            yPos += 8;
        });

        // PIE DE PÁGINA
        const totalPages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            
            let footerYPos = pageHeight - 30;
            doc.setDrawColor(200, 200, 200);
            doc.line(margin, footerYPos, pageWidth - margin, footerYPos);
            footerYPos += 8;
            
            doc.setFontSize(9);
            doc.setTextColor(100, 100, 100);
            doc.text('Este certificado acredita los cargos desempeñados por el voluntario', pageWidth / 2, footerYPos, { align: 'center' });
            footerYPos += 5;
            doc.text('en el Cuerpo de Bomberos', pageWidth / 2, footerYPos, { align: 'center' });
            footerYPos += 5;
            doc.setFontSize(8);
            doc.text(`Página ${i} de ${totalPages}`, pageWidth / 2, footerYPos, { align: 'center' });
        }

        // Guardar PDF
        const nombreArchivo = `Certificado_Cargos_${bombero.claveBombero || 'Bombero'}_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(nombreArchivo);

        Utils.mostrarNotificacion('PDF generado exitosamente', 'success');
    } catch (error) {
        console.error('Error al generar PDF:', error);
        Utils.mostrarNotificacion('Error al generar PDF. Revise la foto del bombero si es muy grande.', 'error');
    }
}
}