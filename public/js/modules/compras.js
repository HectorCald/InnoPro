import { registrarNotificacion } from './advertencia.js';
/* =============== FUNCIONES DE INCIO DE COMPRAS =============== */
export function inicializarCompras() {
    mostrarCarga();
    const container = document.querySelector('.compras-view');
    container.style.display = 'flex';
    container.innerHTML = `
            <div class="title">
                <h3><i class="fas fa-shopping-cart"></i> Compras Acopio</h3>
            </div>
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
                <div class="section-header collapsible">
                    <h3><i class="fas fa-clock"></i> Pedidos Pendientes</h3>
                    <span class="contador-pendientes">0</span>
                    <i class="fas fa-chevron-down section-arrow"></i>
                </div>
                <div class="pedidos-list pendientes collapsed"></div>
            </div>
            <div class="pedidos-section">
                <div class="section-header collapsible">
                    <h3><i class="fas fa-spinner"></i> En Proceso</h3>
                    <span class="contador-proceso">0</span>
                    <i class="fas fa-chevron-down section-arrow"></i>
                </div>
                <div class="pedidos-list proceso collapsed"></div>
            </div>
            <div class="pedidos-section">
                <div class="section-header collapsible">
                    <h3><i class="fas fa-times-circle"></i> Pedidos Rechazados</h3>
                    <span class="contador-rechazados">0</span>
                    <i class="fas fa-chevron-down section-arrow"></i>
                </div>
                <div class="pedidos-list rechazados collapsed"></div>
            </div>
    `;

    // Agregar eventos para los headers desplegables
    const headers = container.querySelectorAll('.section-header.collapsible');
    headers.forEach(header => {
        header.addEventListener('click', () => {
            const content = header.nextElementSibling;
            const arrow = header.querySelector('.section-arrow');
            const comprasView = document.querySelector('.compras-view');

            // Cerrar otras secciones primero
            headers.forEach(otherHeader => {
                if (otherHeader !== header) {
                    const otherContent = otherHeader.nextElementSibling;
                    const otherArrow = otherHeader.querySelector('.section-arrow');
                    otherContent.classList.add('collapsed');
                    if (otherArrow) {
                        otherArrow.style.transform = 'rotate(0deg)';
                    }
                }
            });

            // Toggle la sección actual
            content.classList.toggle('collapsed');
            arrow.style.transform = content.classList.contains('collapsed') ? 'rotate(0deg)' : 'rotate(180deg)';

            // Si la sección está abierta, hacer scroll hasta el header
            if (!content.classList.contains('collapsed')) {
                setTimeout(() => {
                    const headerRect = header.getBoundingClientRect();
                    const headerOffset = headerRect.top + comprasView.scrollTop - 90; // 10px de margen superior
                    comprasView.scrollTo({
                        top: headerOffset,
                        behavior: 'smooth'
                    });
                }, 100);
            }
        });
    });

    cargarPedidos();
}
async function cargarPedidos() {
    try {
        mostrarCarga();

        // Cargar pedidos pendientes
        const resPendientes = await fetch('/obtener-pedidos-estado/Pendiente');
        const dataPendientes = await resPendientes.json();

        // Cargar pedidos en proceso
        const resProceso = await fetch('/obtener-pedidos-estado/En proceso');
        const dataProceso = await resProceso.json();

        // Cargar pedidos rechazados
        const resRechazados = await fetch('/obtener-pedidos-estado/Rechazado');
        const dataRechazados = await resRechazados.json();

        // Actualizar contadores
        document.querySelector('.contador-pendientes').textContent = dataPendientes.pedidos.length;
        document.querySelector('.contador-proceso').textContent = dataProceso.pedidos.length;
        document.querySelector('.contador-rechazados').textContent = dataRechazados.pedidos.length;

        // Mostrar pedidos
        mostrarPedidos(dataPendientes.pedidos, 'pendientes');
        mostrarPedidos(dataProceso.pedidos, 'proceso');
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

/* =============== FUNCIONES DE ELIMINAR, ENTREGAR Y LOS RESUMENES DE ENTREGA=============== */
export async function eliminarPedido(button) {
    try {
        const card = button.closest('.pedido-card');
        const id = card.dataset.id;
        const nombre = card.dataset.nombre;

        const anuncio2 = document.querySelector('.anuncio-down');
        anuncio2.innerHTML = ''; // Limpiar el contenido existente

        const anuncioContenido = document.createElement('div');
        anuncioContenido.className = 'anuncio-contenido';
        anuncioContenido.innerHTML = `
            <div class="encabezado">
                <h2>Eliminar pedido?</h2>
                <button class="anuncio-btn close" onclick="ocultarAnuncioDown()">
                    <i class="fas fa-arrow-down"></i></button>
            </div>
            <p>¿Está seguro que desea eliminar el siguiente pedido?</p>
            <div class="anuncio-detalles">
                <p><strong>Producto:</strong> ${nombre}</p>
                <p><strong>ID:</strong> ${id}</p>
            </div>
            <div class="anuncio-botones">
                <button class="anuncio-btn red confirmar">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
            </div>
        `;
        anuncio2.appendChild(anuncioContenido);

        mostrarAnuncioDown();


        const confirmed = await new Promise(resolve => {
            const btnConfirmar = anuncioContenido.querySelector('.confirmar');

            const handleClick = (value) => {
                btnConfirmar.removeEventListener('click', () => handleClick(true));
                ocultarAnuncioDown();
                resolve(value);
            };

            btnConfirmar.addEventListener('click', () => handleClick(true));
        });

        if (!confirmed) return;

        mostrarCarga();
        const response = await fetch('/eliminar-pedido', {
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

        // Obtener el estado actual del pedido
        const estadoActual = card.closest('.pedidos-list').classList.contains('proceso') ? 'En proceso' : 'Pendiente';

        const anuncio = document.querySelector('.anuncio');
        const anuncioContenido = document.querySelector('.anuncio-contenido');

        anuncioContenido.innerHTML = `
            <div class="encabezado">
                <h2>Entregar pedido</h2>
                <button class="anuncio-btn close" onclick="ocultarAnuncio()">
                    <i class="fas fa-arrow-right"></i></button>
            </div>
            <div class="relleno">
                <p class="subtitle">Entrega de: ${nombre} (${id})</p>

                        <p for="cantidad">Cantidad:</p>
                        <input type="number" id="cantidad" class="form-input" placeholder="Cantidad en Kg.">


                        <p for="proveedor">Proveedor:</p>
                        <input type="text" id="proveedor" class="form-input" placeholder="Nombre del proveedor">

                        <p for="precio">Precio:</p>
                        <input type="number" id="precio" class="form-input" placeholder="0.00" step="0.01">

                        <p for="precio">Transporte y otros:</p>
                        <input type="number" id="transporte" class="form-input" placeholder="0.00" step="0.01">

                        <p for="observaciones">Cantidad:</p>
                        <div style="display: flex; gap: 10px;">
                            <input type="number" id="observaciones" class="form-input" style="flex: 2;" placeholder="Cantidad">
                            <select id="unidad" class="form-input" style="flex: 1;">
                                <option value="Bls.">Bls.</option>
                                <option value="Cja.">Cja.</option>
                            </select>
                        </div>

                <p class="subtitle">Estado:</p>  

                    <div class="anuncio-botones" style="margin-top: 10px;">
                            <button class="filter-btn active anuncio-btn" data-status="llego">
                                Llegó
                            </button>
                            <button class="filter-btn anuncio-btn" data-status="no-llego">
                                No Llegó
                            </button>
                        </div>

            </div>
            <div class="anuncio-botones">
                <button class="anuncio-btn green confirmar"><i class="fas fa-check"></i> Confirmar</button>
            </div>
        `;
        anuncio.appendChild(anuncioContenido);
        mostrarAnuncio();

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

            const handleConfirm = () => {
                // Obtener y validar todos los valores
                const transporteInput = document.getElementById('transporte');
                const transporteValue = transporteInput ? transporteInput.value : '0';
                console.log('Valor del input transporte:', transporteValue); // Debugging

                const formData = {
                    cantidad: document.getElementById('cantidad').value,
                    proveedor: document.getElementById('proveedor').value,
                    precio: document.getElementById('precio').value,
                    transporte: transporteValue,
                    observaciones: document.getElementById('observaciones').value,
                    unidad: document.getElementById('unidad').value,
                    estado: anuncioContenido.querySelector('.filter-btn.active').dataset.status
                };

                console.log('FormData completo:', formData); // Debugging
                handleClick(formData);
            };

            const handleClick = (value) => {
                btnConfirmar.removeEventListener('click', handleConfirm);
                btnCancelar.removeEventListener('click', () => handleClick(false));
                ocultarAnuncio();
                resolve(value);
            };

            btnConfirmar.addEventListener('click', handleConfirm);

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
                transporte: confirmed.transporte || '0', // Aseguramos que se envíe el valor
                observaciones: confirmed.observaciones,
                unidad: confirmed.unidad,
                estado: confirmed.estado
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