export function inicializarComprobante() {
    const anuncio = document.querySelector('.anuncio');
    anuncio.style.display = 'none';
    const container = document.querySelector('.comprobante-view');
    container.innerHTML = `
        <div class="title">
            <h3><i class="fas fa-shopping-basket fa-2x"></i> Gestión de Comprobantes</h3>
        </div>
        <div class="comprobantes-container">
            <div class="comprobante-botones">
                <div class="cuadro-btn"><button class="btn-agregar-comprobante" onclick="mostrarFormularioComprobante()">
                        <i class="fas fa-plus"></i>
                    </button>
                    <p>Generar</p>
                </div>
                <div class="cuadro-btn"><button class="btn-agregar-comprobante">
                        <i class="fab fa-whatsapp"></i>
                    </button>
                    <p>Compartir</p>
                </div>
            </div>
            <div class="lista-comprobantes"></div>
        </div>
    `;

    configurarEventosComprobante();
    mostrarListaComprobantes();
}

function generarFormularioHTML() {
    return `
        <div class="anuncio-contenido">
            <div class="formulario-comprobante">
                <h2>Nuevo Comprobante</h2>
                <div class="campo-form">
                    <label>ID:</label>
                    <input type="text" id="comprobanteId" readonly>
                </div>
                <div class="campo-form">
                    <label>Número:</label>
                    <input type="text" id="comprobanteNumero" readonly>
                </div>
                <div class="campo-form">
                    <label>Fecha y Hora:</label>
                    <input type="text" id="comprobanteFecha" readonly>
                </div>
                <div class="campo-form">
                    <input type="text" id="comprobanteNombre" placeholder="Nombre" required>
                </div>
                <div class="campo-form">
                    <input type="number" id="comprobanteTelefono" placeholder="Telefono" required>
                </div>
                <div class="campo-form">
                    <input type="number" id="comprobanteCarnet" placeholder="Carnet" required>
                </div>
                <div class="campo-form">
                    <textarea id="comprobanteDetalle" placeholder="Detalle" required></textarea>
                </div>
                <div class="campo-form">
                    <input type="number" id="comprobanteSubtotal" placeholder="Subtotal" required>
                </div>
                <div class="campo-form">
                    <input type="number" id="comprobanteTotal" placeholder="Total" required>
                </div>
                <div class="campo-form">
                    <label>Pago:</label>
                    <select id="comprobantePago" placeholder="Metodo de pago" required>
                        <option value="EFECTIVO">Efectivo</option>
                        <option value="QR">QR</option>
                        <option value="TRANSFERENCIA">Transferencia</option>
                    </select>
                </div>
                <div class="anuncio-botones">
                    <button class="btn-generar anuncio-btn enviar" onclick="generarComprobante()">Generar</button>
                    <button class="btn-cancelar anuncio-btn cancelar" onclick="cancelarComprobante()">Cancelar</button>
                </div>
            </div>
        </div>
    `;
}

function configurarEventosComprobante() {
    window.mostrarFormularioComprobante = async function() {
        const anuncio = document.querySelector('.anuncio');
        anuncio.innerHTML = generarFormularioHTML();
        anuncio.style.display = 'flex';
        document.querySelector('.container').classList.add('no-touch');
        
        // Generar ID y Número automáticamente
        const response = await fetch('/obtener-ultimo-comprobante');
        const data = await response.json();
        const ultimoNumero = data.ultimoNumero || 0;
        const nuevoNumero = ultimoNumero + 1;
        
        document.getElementById('comprobanteId').value = `CA-${nuevoNumero}`;
        document.getElementById('comprobanteNumero').value = nuevoNumero;
        
        // Establecer fecha y hora actual
        const ahora = new Date();
        document.getElementById('comprobanteFecha').value = ahora.toLocaleString('es-ES');
    };

    window.cancelarComprobante = function() {
        const anuncio = document.querySelector('.anuncio');
        anuncio.style.display = 'none';
        document.querySelector('.container').classList.remove('no-touch');
    };

    window.generarComprobante = async function() {
        try {
            mostrarCarga();
            const comprobante = {
                id: document.getElementById('comprobanteId').value,
                numero: document.getElementById('comprobanteNumero').value,
                fecha: document.getElementById('comprobanteFecha').value,
                nombre: document.getElementById('comprobanteNombre').value,
                telefono: document.getElementById('comprobanteTelefono').value,
                carnet: document.getElementById('comprobanteCarnet').value,
                detalle: document.getElementById('comprobanteDetalle').value,
                subtotal: document.getElementById('comprobanteSubtotal').value,
                total: document.getElementById('comprobanteTotal').value,
                metodoPago: document.getElementById('comprobantePago').value
            };

            const response = await fetch('/registrar-comprobante', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(comprobante)
            });

            const data = await response.json();
            if (data.success) {
                mostrarNotificacion('Comprobante generado correctamente', 'success');
                cancelarComprobante();
                mostrarListaComprobantes();
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            console.error('Error:', error);
            mostrarNotificacion('Error al generar el comprobante', 'error');
        }finally {
            ocultarCarga();
        }
    };
}
async function mostrarListaComprobantes() {
    try {
        mostrarCarga();
        const response = await fetch('/obtener-comprobantes');
        const data = await response.json();

        if (data.success) {
            const listaComprobantes = document.querySelector('.lista-comprobantes');
            listaComprobantes.innerHTML = data.comprobantes.map(comprobante => `
                <div class="comprobante-item" data-id="${comprobante.id}" onclick="mostrarDetalleComprobante('${comprobante.id}')">
                    <span>Comprobante número: ${comprobante.numero}</span>
                    <span>Total: ${comprobante.total}</span>
                </div>
            `).join('');
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        console.error('Error al obtener comprobantes:', error);
    }finally{
        ocultarCarga();
    }
}

window.mostrarDetalleComprobante = async function(id) {
    try {
        mostrarCarga();
        const response = await fetch(`/obtener-detalle-comprobante/${id}`);
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error en el servidor');
        }
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || 'Error al obtener los detalles');
        }

        const comprobante = data.comprobante;
        const anuncio = document.querySelector('.anuncio');
        const contenido = document.querySelector('.anuncio-contenido');
        
        contenido.innerHTML = `
            <div class="detalle-comprobante">
                <h2>Detalle del Comprobante</h2>
                <h2><img src="./img/Logotipo.webp" alt="Logotipo" style="max-width: 30px;">Damabrava</h2>
                <div class="campo-detalle">
                    <label>ID:</label>
                    <p>${comprobante.id}</p>
                </div>
                <div class="campo-detalle">
                    <label>Número:</label>
                    <p>${comprobante.numero}</p>
                </div>
                <div class="campo-detalle">
                    <label>Fecha:</label>
                    <p>${comprobante.fecha}</p>
                </div>
                <div class="campo-detalle">
                    <label>Nombre:</label>
                    <p>${comprobante.nombre}</p>
                </div>
                <div class="campo-detalle">
                    <label>Teléfono:</label>
                    <p>${comprobante.telefono}</p>
                </div>
                <div class="campo-detalle">
                    <label>Carnet:</label>
                    <p>${comprobante.carnet}</p>
                </div>
                <div class="campo-detalle">
                    <label>Detalle:</label>
                    <p>${comprobante.detalle}</p>
                </div>
                <div class="campo-detalle">
                    <label>Subtotal:</label>
                    <p>${comprobante.subtotal}</p>
                </div>
                <div class="campo-detalle">
                    <label>Total:</label>
                    <p>${comprobante.total}</p>
                </div>
                <div class="campo-detalle">
                    <label>Método de Pago:</label>
                    <p>${comprobante.metodoPago}</p>
                </div>
                ${comprobante.firma ? `
                    <div class="campo-detalle firma-preview">
                        <label>Firma digital:</label>
                        <img src="${comprobante.firma}" alt="Firma digital" style="max-width: 300px; border: 1px solid #ccc;">
                    </div>
                ` : ''}
                <div class="anuncio-botones">
                    <button class="btn-cerrar anuncio-btn cancelar" onclick="cancelarComprobante()">Cerrar</button>
                    ${!comprobante.firma ? `
                        <button class="btn-firmar anuncio-btn enviar" onclick="firmarComprobante('${comprobante.id}')">Firmar</button>
                    ` : `
                        <button class="btn-descargar anuncio-btn enviar" onclick="descargarComprobantePDF('${comprobante.id}')">
                            <i class="fas fa-download"></i> Descargar PDF
                        </button>
                    `}
                </div>
            </div>
        `;
        
        anuncio.style.display = 'flex';
        document.querySelector('.container').classList.add('no-touch');
    } catch (error) {
        console.error('Error al mostrar detalle del comprobante:', error);
        mostrarNotificacion(error.message || 'Error al cargar los detalles del comprobante', 'error');
    } finally {
        ocultarCarga();
    }
};
window.descargarComprobantePDF = async function(id) {
    try {
        mostrarCarga();
        const detalleComprobante = document.querySelector('.detalle-comprobante');
        
        // Ocultar botones antes de generar PDF
        const botonesOriginales = detalleComprobante.querySelector('.anuncio-botones');
        botonesOriginales.style.display = 'none';
        
        // Generar PDF como base64
        const pdfBase64 = await html2pdf().set({
            margin: 10,
            filename: `comprobante-${id}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 1, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        })
        .from(detalleComprobante)
        .outputPdf('datauristring');

        // Guardar PDF en Google Sheets
        const response = await fetch(`/guardar-pdf/${id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pdfBase64 })
        });

        if (!response.ok) {
            throw new Error('Error al guardar el PDF');
        }

        // Descargar PDF
        window.location.href = `/descargar-pdf/${id}`;
        
        // Restaurar botones
        botonesOriginales.style.display = 'flex';
        mostrarNotificacion('PDF generado correctamente', 'success');
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error al generar el PDF', 'error');
    } finally {
        ocultarCarga();
    }
};
window.firmarComprobante = async function(id) {
    const contenido = document.querySelector('.anuncio-contenido');
    const detalleComprobante = contenido.querySelector('.detalle-comprobante');
    
    // Add signature pad container
    const signatureContainer = document.createElement('div');
    signatureContainer.className = 'signature-container';
    signatureContainer.innerHTML = `
        <h4>Firma Digital</h4>
        <canvas id="signaturePad" min-width="100%" height="200" style="border-radius: 10px; background: #fff;"></canvas>
        <div class="anuncio-botones">
            <button class="anuncio-btn cancelar" onclick="limpiarFirma()">Limpiar</button>
            <button class="anuncio-btn enviar" onclick="finalizarFirma('${id}')">Finalizar</button>
        </div>
    `;
    
    detalleComprobante.appendChild(signatureContainer);
    
    // Initialize signature pad
    const canvas = document.getElementById('signaturePad');
    const signaturePad = new SignaturePad(canvas, {
        backgroundColor: 'rgb(255, 255, 255)',
        penColor: 'rgb(0, 0, 0)'
    });
    
    window.limpiarFirma = function() {
        signaturePad.clear();
    };
    
    window.finalizarFirma = async function(comprobanteId) {
        if (signaturePad.isEmpty()) {
            mostrarNotificacion('Por favor realice su firma', 'error');
            return;
        }
        
        try {
            mostrarCarga();
            const firmaBase64 = signaturePad.toDataURL('image/png');
            const response = await fetch(`/guardar-firma/${comprobanteId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ firma: firmaBase64 })
            });
            
            const data = await response.json();
            if (data.success) {
                mostrarNotificacion('Firma guardada correctamente', 'success');
                cancelarComprobante();
                mostrarListaComprobantes();
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            console.error('Error al guardar la firma:', error);
            mostrarNotificacion('Error al guardar la firma', 'error');
        }finally {
            ocultarCarga();
        }
    };
};