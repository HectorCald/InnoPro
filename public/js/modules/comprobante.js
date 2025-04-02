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
            <div class="detalle-comprobante" style="background: white; color: black; padding: 20px; border-radius: 10px; max-width: 500px; margin: auto;">
                <div style="text-align: center; margin-bottom: 20px;">
                    <h2 style="margin: 0; color: #28a745;">¡Pago realizado!</h2>
                    <h1 style="margin: 10px 0; font-size: 2em;">Bs ${comprobante.total}</h1>
                </div>

                <div style="margin:  0; border-bottom: 1px solid #eee; padding-bottom: 10px;">
                    <h3 style="margin: 0; color: #666;">Para</h3>
                    <p style="margin: 5px 0; font-size: 1.2em;">${comprobante.nombre}</p>
                    <p style="margin: 5px 0; color: #666;">${comprobante.carnet}</p>
                    <p style="margin: 5px 0; color: #666;">Operario</p>
                </div>

                <div style="margin: 20px 0; border-bottom: 1px solid #eee; padding-bottom: 10px;">
                    <h3 style="margin: 0; color: #666;">De</h3>
                    <p style="margin: 0; font-size: 1.2em;">DAMABRAVA</p>
                    <p style="margin:0; color: #666;">Empresa</p>
                </div>

                <div style="margin: 20px 0;">
                    <h3 style="margin: 0; color: #666;">Realizado en</h3>
                    <p style="margin:0;">${comprobante.fecha}</p>
                    <p style="margin:  0; color: #666;">ID del pago ${comprobante.id}</p>
                </div>

                <div style="margin: 0;">
                    <h3 style="margin: 0; color: #666;">Detalle</h3>
                    <p style="margin: 5px 0;">${comprobante.detalle}</p>
                </div>

                ${comprobante.firma ? `
                    <p style="margin: 0; color: #666;">Firma del interesado:</p>
                    <div style="margin: 10px 0; text-align: center;">
                        <img src="${comprobante.firma}" alt="Firma digital" style="max-width: 150px; border: none;">
                    </div>
                    <div class="logo-container" style="text-align: center; margin-top: 10px;">
                        <p style="margin: 5px 0; color: #666; font-size: 12px;">
                            <img src="./img/Logotipo.webp" alt="Logo Damabrava" style="width: 40px; height: auto; vertical-align: middle;">
                            DAMABRAVA
                        </p>
                    </div>
                ` : ''}

                <div class="anuncio-botones" style="margin-top: 20px; text-align: center;">
                    <button class="btn-cerrar anuncio-btn cancelar" onclick="cancelarComprobante()">Cerrar</button>
                    ${!comprobante.firma ? `
                        <button class="btn-firmar anuncio-btn enviar" onclick="firmarComprobante('${comprobante.id}')">Firmar</button>
                    ` : `
                        <button class="btn-descargar anuncio-btn enviar" onclick="descargarComprobantePDF('${comprobante.id}')">
                            <i class="fas fa-download"></i> Guardar
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
        
        const opt = {
            margin: 7,
            filename: `comprobante-${id}.pdf`,
            image: { type: 'jpeg', quality: 2 },
            html2canvas: { 
                scale: 1,
                useCORS: true,
                letterRendering: true,
                width: 280,
                height: 600
            },
            jsPDF: { 
                unit: 'mm', 
                format: [80, 160],
                orientation: 'portrait',
                compress: true
            }
        };

        // Generar PDF y obtener como base64
        const pdf = await html2pdf()
            .set(opt)
            .from(detalleComprobante)
            .outputPdf('datauristring');

        // Restaurar botones
        botonesOriginales.style.display = 'flex';
        
        // Guardar en Google Sheets
        const response = await fetch(`/guardar-pdf/${id}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ pdfBase64: pdf })
        });

        if (!response.ok) throw new Error('Error al guardar el PDF');

        // Descargar el PDF
        window.location.href = `/descargar-pdf/${id}`;
        
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
    
    const signatureContainer = document.createElement('div');
    signatureContainer.className = 'signature-container';
    signatureContainer.innerHTML = `
        <div class="signature-header">
            <h4>Firma Digital</h4>
            <button class="btn-fullscreen" onclick="toggleFullscreenPad()">
                <i class="fas fa-expand"></i>
            </button>
        </div>
        <canvas id="signaturePad"></canvas>
        <div class="anuncio-botones">
            <button class="anuncio-btn cancelar" onclick="limpiarFirma()">Limpiar</button>
            <button class="anuncio-btn enviar" onclick="finalizarFirma('${id}')">Finalizar</button>
        </div>
    `;
    
    detalleComprobante.appendChild(signatureContainer);
    
    const canvas = document.getElementById('signaturePad');
    const ctx = canvas.getContext('2d');
    
    function resizeCanvas() {
        const container = document.querySelector('.signature-container');
        if (container.classList.contains('fullscreen')) {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight * 0.7;
        } else {
            canvas.width = 280;
            canvas.height = 200;
        }
        
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
    }
    
    resizeCanvas();
    
    window.toggleFullscreenPad = function() {
        const container = document.querySelector('.signature-container');
        const button = document.querySelector('.btn-fullscreen i');
        const currentImage = canvas.toDataURL();
        
        container.classList.toggle('fullscreen');
        button.classList.toggle('fa-expand');
        button.classList.toggle('fa-compress');
        
        resizeCanvas();
        
        // Restore previous drawing
        const img = new Image();
        img.onload = function() {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        };
        img.src = currentImage;
    };
    
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;
    
    function draw(e) {
    if (!isDrawing) return;
    
    let x, y;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    if (e.type === 'mousemove') {
        x = (e.clientX - rect.left) * scaleX;
        y = (e.clientY - rect.top) * scaleY;
    } else {
        x = (e.touches[0].clientX - rect.left) * scaleX;
        y = (e.touches[0].clientY - rect.top) * scaleY;
    }
    
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.stroke();
    
    [lastX, lastY] = [x, y];
}

function startDrawing(e) {
    isDrawing = true;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    if (e.type === 'mousedown') {
        lastX = (e.clientX - rect.left) * scaleX;
        lastY = (e.clientY - rect.top) * scaleY;
    } else {
        lastX = (e.touches[0].clientX - rect.left) * scaleX;
        lastY = (e.touches[0].clientY - rect.top) * scaleY;
    }
}
    
    function stopDrawing() {
        isDrawing = false;
    }
    
    // Mouse Events
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    
    // Touch Events
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        startDrawing(e);
    }, { passive: false });
    
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        draw(e);
    }, { passive: false });
    
    canvas.addEventListener('touchend', stopDrawing);
    
    // Handle window resize
    window.addEventListener('resize', () => {
        if (document.querySelector('.signature-container.fullscreen')) {
            const currentImage = canvas.toDataURL();
            resizeCanvas();
            const img = new Image();
            img.onload = function() {
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            };
            img.src = currentImage;
        }
    });
    
    window.limpiarFirma = function() {
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
    };
    
    window.finalizarFirma = async function(comprobanteId) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        let isEmpty = true;
        
        for (let i = 0; i < data.length; i += 4) {
            if (data[i] !== 255 || data[i + 1] !== 255 || data[i + 2] !== 255) {
                isEmpty = false;
                break;
            }
        }
        
        if (isEmpty) {
            mostrarNotificacion('Por favor realice su firma', 'error');
            return;
        }
        
        try {
            mostrarCarga();
            const firmaBase64 = canvas.toDataURL('image/png');
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
        } finally {
            ocultarCarga();
        }
    };
};
window.toggleFullscreenPad = function() {
        const container = document.querySelector('.signature-container');
        const button = document.querySelector('.btn-fullscreen i');
        const currentImage = canvas.toDataURL();
        
        container.classList.toggle('fullscreen');
        button.classList.toggle('fa-expand');
        button.classList.toggle('fa-compress');
        
        if (container.classList.contains('fullscreen')) {
            // Force landscape orientation when fullscreen
            if (screen.orientation && screen.orientation.lock) {
                screen.orientation.lock('landscape').catch(err => {
                    console.log('Orientation lock failed:', err);
                });
            }
            canvas.width = window.innerHeight; // Switch width and height
            canvas.height = window.innerWidth * 0.7;
        } else {
            // Release orientation lock when exiting fullscreen
            if (screen.orientation && screen.orientation.unlock) {
                screen.orientation.unlock();
            }
            canvas.width = 280;
            canvas.height = 200;
        }
        
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        
        // Restore previous drawing
        const img = new Image();
        img.onload = function() {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        };
        img.src = currentImage;
};
window.toggleFullscreenPad = function() {
    const container = document.querySelector('.signature-container');
    const expandButton = document.querySelector('.btn-fullscreen');
    const closeButton = document.querySelector('.btn-close-fullscreen');
    const currentImage = canvas.toDataURL();
    
    container.classList.add('fullscreen');
    expandButton.style.display = 'none';
    closeButton.style.display = 'block';
    
    resizeCanvas();
    
    // Restore previous drawing
    const img = new Image();
    img.onload = function() {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = currentImage;
};
