import { registrarNotificacion } from './advertencia.js';
export function inicializarCompras() {
    mostrarCarga();
    const container = document.querySelector('.compras-view');
    container.style.display = 'flex';
    container.innerHTML = `
        <div class="pedidos-container">
            <div class="entregados-section">
                <div class="section-header">
                    <h3><i class="fas fa-check-circle"></i> Resumen de Entregas</h3>
                    <button class="btn-copiar" onclick="copiarResumen()">
                        <i class="fas fa-copy"></i> Copiar
                    </button>
                </div>
                <div class="resumen-mensaje"></div>
            </div>
            <div class="pedidos-section">
                <div class="section-header">
                    <h3><i class="fas fa-clock"></i> Pedidos Pendientes</h3>
                    <span class="contador-pendientes">0</span>
                </div>
                <div class="pedidos-list pendientes"></div>
            </div>
            <div class="pedidos-section">
                <div class="section-header">
                    <h3><i class="fas fa-times-circle"></i> Pedidos Rechazados</h3>
                    <span class="contador-rechazados">0</span>
                </div>
                <div class="pedidos-list rechazados"></div>
            </div>
        </div>
        
    `;

    cargarPedidos();
    ocultarCarga();
}
async function cargarPedidos() {
    try {
        mostrarCarga();

        // Cargar pedidos pendientes
        const resPendientes = await fetch('/obtener-pedidos-estado/Pendiente');
        const dataPendientes = await resPendientes.json();

        // Cargar pedidos rechazados
        const resRechazados = await fetch('/obtener-pedidos-estado/Rechazado');
        const dataRechazados = await resRechazados.json();

        // Actualizar contadores
        document.querySelector('.contador-pendientes').textContent = dataPendientes.pedidos.length;
        document.querySelector('.contador-rechazados').textContent = dataRechazados.pedidos.length;

        // Mostrar pedidos
        mostrarPedidos(dataPendientes.pedidos, 'pendientes');
        mostrarPedidos(dataRechazados.pedidos, 'rechazados');
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error al cargar los pedidos', 'error');
    } finally {
        ocultarCarga();
    }
}
function mostrarPedidos(pedidos, tipo) {
    mostrarCarga();
    const container = document.querySelector(`.pedidos-list.${tipo}`);

    if (!pedidos.length) {
        container.innerHTML = `<p class="no-pedidos">No hay pedidos ${tipo}</p>`;
        return;
    }

    container.innerHTML = pedidos.map(pedido => `
        <div class="pedido-card ${tipo}" data-id="${pedido.id}" data-nombre="${pedido.nombre}">
            <div class="pedido-info">
                <h4>${pedido.nombre}</h4>
                <p class="cantidad"><i class="fas fa-box"></i> ${pedido.cantidad}</p>
                ${pedido.observaciones ? `<p class="observaciones"><i class="fas fa-comment"></i> ${pedido.observaciones}</p>` : ''}
            </div>
            <div class="pedido-meta">
                <span class="fecha"><i class="far fa-calendar"></i> ${pedido.fecha}</span>
                <span class="id"><i class="fas fa-hashtag"></i> ${pedido.id}</span>
                ${pedido.proveedor ? `<span class="proveedor"><i class="fas fa-truck"></i> ${pedido.proveedor}</span>` : ''}
            </div>
            <div class="pedido-actions">
                <button class="btn-entregar">
                    <i class="fas fa-check"></i> Entregar
                </button>
                <button class="btn-eliminar">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
            </div>
        </div>
    `).join('');


    // Add event listeners after rendering
    container.querySelectorAll('.btn-eliminar').forEach(btn => {
        btn.addEventListener('click', () => eliminarPedido(btn));
    });
    container.querySelectorAll('.btn-entregar').forEach(btn => {
        btn.addEventListener('click', () => entregarPedido(btn));
    });
    ocultarCarga();
}
export async function eliminarPedido(button) {
    try {
        const card = button.closest('.pedido-card');
        const id = card.dataset.id;
        const nombre = card.dataset.nombre;

        const anuncio = document.querySelector('.anuncio');
        const anuncioContenido = document.querySelector('.anuncio-contenido');

        anuncioContenido.innerHTML = `
            <h2><i class="fas fa-trash"></i> Eliminar Pedido</h2>
            <p>¿Está seguro que desea eliminar el siguiente pedido?</p>
            <div class="anuncio-detalles">
                <p><strong>Producto:</strong> ${nombre}</p>
                <p><strong>ID:</strong> ${id}</p>
            </div>
            <div class="anuncio-botones">
                <button class="anuncio-btn red confirmar">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
                <button class="anuncio-btn close cancelar">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        anuncio.style.display = 'flex';

        const confirmed = await new Promise(resolve => {
            const btnConfirmar = anuncioContenido.querySelector('.confirmar');
            const btnCancelar = anuncioContenido.querySelector('.cancelar');

            const handleClick = (value) => {
                btnConfirmar.removeEventListener('click', () => handleClick(true));
                btnCancelar.removeEventListener('click', () => handleClick(false));
                anuncio.style.display = 'none';
                resolve(value);
            };

            btnConfirmar.addEventListener('click', () => handleClick(true));
            btnCancelar.addEventListener('click', () => handleClick(false));
        });

        if (!confirmed) return;

        mostrarCarga();
        const response = await fetch('/eliminar-pedido-compras', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id })
        });

        const data = await response.json();

        if (data.success) {
            mostrarNotificacion('Pedido eliminado correctamente', 'success');
            await cargarPedidos();
        } else {
            throw new Error(data.error || 'Error al eliminar el pedido');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error al eliminar el pedido: ' + error.message, 'error');
    } finally {
        ocultarCarga();
    }
}
export async function entregarPedido(button) {
    try {
        const card = button.closest('.pedido-card');
        const id = card.dataset.id;
        const nombre = card.dataset.nombre;

        const anuncio = document.querySelector('.anuncio');
        const anuncioContenido = document.querySelector('.anuncio-contenido');

        anuncioContenido.innerHTML = `
            <h2><i class="fas fa-check-circle"></i>Entregar Pedido</h2>
            <div class="relleno">
                <p>Entrega de: ${nombre} (${id})</p>
                <div class="anuncio-form">
                    <div class="campo-form">
                        <label for="cantidad">Cantidad:</label>
                        <input type="number" id="cantidad" class="form-input" placeholder="Cantidad en Kg.">
                    </div>
                    <div class="campo-form">
                        <label for="proveedor">Proveedor:</label>
                        <input type="text" id="proveedor" class="form-input" placeholder="Nombre del proveedor">
                    </div>
                    <div class="campo-form">
                        <label for="precio">Precio:</label>
                        <input type="number" id="precio" class="form-input" placeholder="0.00" step="0.01">
                    </div>
                    <div class="campo-form">
                        <label for="observaciones">Cantidad:</label>
                        <div style="display: flex; gap: 10px;">
                            <input type="number" id="observaciones" class="form-input" style="flex: 2;" placeholder="Cantidad">
                            <select id="unidad" class="form-input" style="flex: 1;">
                                <option value="Bls.">Bls.</option>
                                <option value="Cja.">Cja.</option>
                            </select>
                        </div>
                    </div>
                </div>
                <p>Estado:</p>  
                <div class="campo-form">
                    <div class="anuncio-botones" style="margin-top: 10px;">
                            <button class="filter-btn active anuncio-btn" data-status="llego">
                                Llegó
                            </button>
                            <button class="filter-btn anuncio-btn" data-status="no-llego">
                                No Llegó
                            </button>
                        </div>
                </div>
            </div>
            
            <div class="anuncio-botones">
                <button class="anuncio-btn green confirmar"><i class="fas fa-check"></i> Confirmar</button>
                <button class="anuncio-btn close cancelar"><i class="fas fa-times"></i></button>
            </div>
        `;

        anuncio.style.display = 'flex';

        const filterButtons = anuncioContenido.querySelectorAll('.filter-btn');
        filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault(); // Prevent button default action
                filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        const confirmed = await new Promise(resolve => {
            const btnConfirmar = anuncioContenido.querySelector('.confirmar');
            const btnCancelar = anuncioContenido.querySelector('.cancelar');

            const handleConfirm = () => {
                const cantidad = document.getElementById('observaciones').value;
                const unidad = document.getElementById('unidad').value;
                const estadoSeleccionado = anuncioContenido.querySelector('.filter-btn.active').dataset.status;
                const formData = {
                    cantidad: document.getElementById('cantidad').value,
                    proveedor: document.getElementById('proveedor').value,
                    precio: document.getElementById('precio').value,
                    observaciones: cantidad,
                    unidad: unidad,
                    estado: estadoSeleccionado
                };
                handleClick(formData);
            };

            const handleClick = (value) => {
                btnConfirmar.removeEventListener('click', handleConfirm);
                btnCancelar.removeEventListener('click', () => handleClick(false));
                anuncio.style.display = 'none';
                resolve(value);
            };

            btnConfirmar.addEventListener('click', handleConfirm);
            btnCancelar.addEventListener('click', () => handleClick(false));
        });

        if (!confirmed) return;

        mostrarCarga();

        // Obtener el usuario actual primero
        const userResponse = await fetch('/obtener-mi-rol');
        const userData = await userResponse.json();
        const usuarioActual = userData.nombre;

        const response = await fetch('/entregar-pedido', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: id,
                cantidad: confirmed.cantidad,
                proveedor: confirmed.proveedor,
                precio: confirmed.precio,
                observaciones: confirmed.observaciones,
                unidad: confirmed.unidad,
                estado: confirmed.estado  // Including the state in the request
            })
        });

        const data = await response.json();

        if (data.success) {
            // Enviar notificación
            try {
                await registrarNotificacion(
                    usuarioActual,    // origen (usuario actual)
                    'Acopio',         // destino
                    `Se hizo la entrega de: ${nombre} cantidad ${confirmed.observaciones} ${confirmed.unidad}`
                );
            } catch (notifError) {
                console.error('Error al enviar notificación:', notifError);
            }

            mostrarNotificacion('Pedido entregado correctamente', 'success');
            actualizarResumenEntregas(nombre, confirmed.observaciones);
            await cargarPedidos();
        } else {
            throw new Error(data.error || 'Error al entregar el pedido');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error al entregar el pedido: ' + error.message, 'error');
    } finally {
        ocultarCarga();
    }
}
function actualizarResumenEntregas(producto, observaciones) {
    const resumenDiv = document.querySelector('.resumen-mensaje');
    const productosEntregados = resumenDiv.getAttribute('data-entregas') ?
        JSON.parse(resumenDiv.getAttribute('data-entregas')) : [];

    productosEntregados.push({ producto, observaciones });
    resumenDiv.setAttribute('data-entregas', JSON.stringify(productosEntregados));

    const mensaje = generarMensajeResumen(productosEntregados);
    resumenDiv.innerHTML = mensaje;
}
function generarMensajeResumen(productos) {
    if (!productos.length) return '';

    const listaProductos = productos
        .map(p => `• ${p.producto}${p.observaciones ? `: (${p.observaciones})` : ''}`)
        .join('\n');

    return `SE TRAJO MATERIA PRIMA\n\nEntregado:\n${listaProductos}\n\nLos productos ya se encuentran como entregado en la aplicación de Damabrava.`;
}
window.copiarResumen = function () {
    const resumenDiv = document.querySelector('.resumen-mensaje');
    const texto = resumenDiv.textContent;

    if (!texto.trim()) {
        mostrarNotificacion('No hay entregas para copiar', 'error');
        return;
    }

    navigator.clipboard.writeText(texto).then(() => {
        mostrarNotificacion('Resumen copiado al portapapeles', 'success');
    }).catch(err => {
        console.error('Error al copiar:', err);
        mostrarNotificacion('Error al copiar el resumen', 'error');
    });
}