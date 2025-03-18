export function inicializarPedidos() {
    const container = document.querySelector('.newPedido-view');
    container.innerHTML = `
        <div class="title">
            <h3>Gestión de Pedidos</h3>
        </div>
        <div class="pedidos-container">
         <div class="pedidos-botones">
            <button class="btn-agregar-pedido" onclick="mostrarFormularioPedido()">
                <i class="fas fa-plus"></i> Agregar Pedido
            </button>
            <button class="btn-agregar-pedido" onclick="compartirPedido()">
                    <i class="fas fa-file-pdf"></i> Exportar PDF
                </button>
            </div>
            <div class="lista-pedidos"></div>
        </div>
    `;
    cargarPedidos();
}
export function mostrarFormularioPedido() {
    const anuncio = document.querySelector('.anuncio');
    anuncio.style.display='flex'
    anuncio.innerHTML = `
        <div class="anuncio-contenido">
            <h2>Nuevo Pedido</h2>
            <div class="form-pedido">
                <input type="text" id="nombre-pedido" placeholder="Nombre del producto">
                <div class="cantidad-container">
                    <input type="number" id="cantidad-pedido" placeholder="Cantidad">
                    <select id="unidad-medida">
                        <option value="unid.">unid.</option>
                        <option value="cajas">cajas</option>
                        <option value="bolsas">bolsas</option>
                        <option value="qq">qq</option>
                        <option value="kg">kg</option>
                        <option value="arroba">arroba</option>
                    </select>
                </div>
                <textarea id="obs-pedido" placeholder="Observaciones"></textarea>
            </div>
            <div class="anuncio-botones">
                <button class="anuncio-btn cancelar" onclick="cerrarFormularioPedido()">Cancelar</button>
                <button class="anuncio-btn confirmar" onclick="guardarPedido()">Añadir</button>
            </div>
        </div>
    `;
}
export async function guardarPedido() {
    try {
        mostrarCarga();
        const nombre = document.getElementById('nombre-pedido').value;
        const cantidad = document.getElementById('cantidad-pedido').value;
        const unidad = document.getElementById('unidad-medida').value;
        const observaciones = document.getElementById('obs-pedido').value;

        if (!nombre || !cantidad) {
            mostrarNotificacion('Por favor complete los campos requeridos', 'warning');
            return;
        }

        const cantidadFormateada = `${cantidad} ${unidad}`;

        const response = await fetch('/guardar-pedido', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nombre,
                cantidad: cantidadFormateada,
                observaciones
            })
        });

        const data = await response.json();
        if (data.success) {
            mostrarNotificacion('Pedido guardado correctamente', 'success');
            cerrarFormularioPedido();
            cargarPedidos();
        } else {
            mostrarNotificacion(data.error, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error al guardar el pedido', 'error');
    } finally {
        ocultarCarga();
    }
}
export function cerrarFormularioPedido() {
    const anuncio = document.querySelector('.anuncio');
    anuncio.style.display='none'
}



export async function cargarPedidos() {
    try {
        mostrarCarga();
        const response = await fetch('/obtener-pedidos');
        const data = await response.json();

        const container = document.querySelector('.lista-pedidos');
        if (data.success && data.pedidos.length > 0) {
            container.innerHTML = data.pedidos.slice(1).map(pedido => `
                <div class="pedido-card">
                    <div class="pedido-header">
                        <div class="pedido-info">
                            <div class="pedido-principal">
                                <span class="pedido-nombre">${pedido[1]}</span>
                                <div class="pedido-detalles">
                                    <span class="pedido-fecha"><i class="far fa-calendar"></i> ${pedido[0]}</span>
                                    <span class="pedido-cantidad"><i class="fas fa-box"></i> ${pedido[2]}</span>
                                </div>
                            </div>
                        </div>
                        <button class="btn-eliminar" onclick="mostrarConfirmacionEliminar('${pedido[0]}', '${pedido[1]}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                    <div class="pedido-obs">
                        <i class="far fa-comment-alt"></i> ${pedido[3] || 'Sin observaciones'}
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<p class="no-pedidos">No hay pedidos registrados</p>';
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error al cargar los pedidos', 'error');
    } finally {
        ocultarCarga();
    }
}

export async function eliminarPedido(fecha, nombre) {
    try {
        mostrarCarga();
        const response = await fetch('/eliminar-pedido', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ fecha, nombre })
        });

        const data = await response.json();
        if (data.success) {
            mostrarNotificacion('Pedido eliminado correctamente', 'success');
            cargarPedidos();
        } else {
            mostrarNotificacion(data.error, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error al eliminar el pedido', 'error');
    } finally {
        ocultarCarga();
        cerrarFormularioPedido();
    }
}
export function mostrarConfirmacionEliminar(fecha, nombre) {
    const anuncio = document.querySelector('.anuncio');
    anuncio.style.display = 'flex';
    anuncio.innerHTML = `
        <div class="anuncio-contenido">
            <i class="fas fa-exclamation-triangle"></i>
            <h2>¿Eliminar pedido?</h2>
            <p>Esta acción no se puede deshacer</p>
            <div class="anuncio-botones">
                <button class="anuncio-btn cancelar" onclick="cerrarFormularioPedido()">Cancelar</button>
                <button class="anuncio-btn confirmar" onclick="eliminarPedido('${fecha}', '${nombre}')">Eliminar</button>
            </div>
        </div>
    `;
}
export async function compartirPedido() {
    try {
        mostrarCarga();
        console.log('Iniciando proceso de PDF...');

        // Obtener los pedidos
        const response = await fetch('/obtener-pedidos');
        const data = await response.json();

        if (!data.success || !data.pedidos.length) {
            mostrarNotificacion('No hay pedidos para compartir', 'warning');
            return;
        }

        // Crear el PDF directamente en el navegador
        const { jsPDF } = window.jspdf;
        if (!jsPDF) {
            throw new Error('jsPDF no está disponible');
        }

        const doc = new jsPDF();

        // Configuración del PDF
        doc.setFont("helvetica", "bold");
        doc.setFontSize(20);
        doc.text("DAMABRAVA", 105, 20, { align: "center" });
        
        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        const fecha = new Date().toLocaleDateString();
        doc.text(`Fecha: ${fecha}`, 20, 40);

        // Preparar datos
        const headers = [["Fecha", "Producto", "Cantidad", "Observaciones"]];
        const pedidos = data.pedidos.slice(1).map(pedido => [
            pedido[0],
            pedido[1],
            pedido[2],
            pedido[3] || "Sin observaciones"
        ]);

        // Generar tabla
        doc.autoTable({
            startY: 60,
            head: headers,
            body: pedidos,
            theme: 'grid',
            styles: { fontSize: 10, cellPadding: 5 },
            headStyles: {
                fillColor: [76, 175, 80],
                textColor: [255, 255, 255]
            },
            alternateRowStyles: { fillColor: [245, 245, 245] }
        });

        // Descargar el PDF
        doc.save(`Pedidos_Damabrava_${fecha.replace(/\//g, '-')}.pdf`);
        mostrarNotificacion('PDF generado correctamente', 'success');

    } catch (error) {
        console.error('Error en generación de PDF:', error);
        mostrarNotificacion('Error al generar el PDF: ' + error.message, 'error');
    } finally {
        ocultarCarga();
    }
}
