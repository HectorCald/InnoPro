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
        const listContainer = card.closest('.pedidos-list');
        const tipo = listContainer.classList.contains('pendientes') ? 'pendientes' : 
                    listContainer.classList.contains('proceso') ? 'proceso' : 'rechazados';

        const anuncio = document.querySelector('.anuncio');
        anuncio.innerHTML = `
            <div class="anuncio-contenido">
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
                        <button class="filter-btn active anuncio-btn" data-status="llego">Llegó</button>
                        <button class="filter-btn anuncio-btn" data-status="no-llego">No Llegó</button>
                    </div>
                </div>
                <div class="anuncio-botones">
                    <button class="anuncio-btn green confirmar"><i class="fas fa-check"></i> Confirmar</button>
                </div>
            </div>
        `;

        mostrarAnuncio();

        // Configurar botones de estado
        const filterButtons = anuncio.querySelectorAll('.filter-btn');
        filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        // Esperar confirmación
        const confirmed = await new Promise(resolve => {
            const btnConfirmar = anuncio.querySelector('.confirmar');
            const handleConfirm = () => {
                const formData = {
                    cantidad: document.getElementById('cantidad').value,
                    proveedor: document.getElementById('proveedor').value,
                    precio: document.getElementById('precio').value,
                    transporte: document.getElementById('transporte').value || '0',
                    observaciones: document.getElementById('observaciones').value,
                    unidad: document.getElementById('unidad').value,
                    estado: anuncio.querySelector('.filter-btn.active').dataset.status
                };

                if (!formData.cantidad || !formData.proveedor) {
                    mostrarNotificacion('Por favor complete los campos requeridos', 'warning');
                    return;
                }

                ocultarAnuncio();
                resolve(formData);
            };
            btnConfirmar.addEventListener('click', handleConfirm);
        });

        if (!confirmed) return;

        mostrarCarga();

        // Obtener usuario y enviar datos
        const userResponse = await fetch('/obtener-mi-rol');
        const userData = await userResponse.json();
        const usuarioActual = userData.nombre;

        const response = await fetch('/entregar-pedido', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, ...confirmed })
        });

        const data = await response.json();

        if (data.success) {
            // Registrar notificación
            await registrarNotificacion(
                usuarioActual,
                'Acopio',
                `Se hizo la entrega de: ${nombre} cantidad ${confirmed.observaciones} ${confirmed.unidad}`
            );

            // Actualizar UI
            const counter = document.querySelector(`.contador-${tipo}`);
            if (counter) {
                counter.textContent = parseInt(counter.textContent) - 1;
            }
            card.remove();

            // Mostrar resumen
            await mostrarResumenEntrega(confirmed, nombre);
            mostrarNotificacion('Pedido entregado correctamente', 'success');
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

let entregasRealizadas = [];

export function compartirEntregas() {
    if (entregasRealizadas.length === 0) {
        mostrarNotificacion('No hay entregas para compartir', 'warning');
        return;
    }

    const mensaje = `*Resumen de Entregas*%0A%0A` +
        entregasRealizadas.map(entrega =>
            `Producto: ${entrega.nombre}%0A` +
            `Cantidad: ${entrega.observaciones} ${entrega.unidad}%0A` +
            `Estado: ${entrega.estado === 'llego' ? 'Llegó' : 'No llegó'}%0A` +
            `-------------------%0A`
        ).join('') +
        `Los productos ya se encuentran como entregas en la aplicación de InnoPro`;

    window.open(`https://wa.me/?text=${mensaje}`, '_blank');
}
export async function mostrarResumenEntrega(datosEntrega, nombre) {
    try {
        // Agregar la nueva entrega al array
        entregasRealizadas.push({ ...datosEntrega, nombre });

        // Limpiar y preparar el anuncio
        const anuncio = document.querySelector('.anuncio');
        anuncio.innerHTML = `
            <div class="anuncio-contenido">
                <div class="encabezado">
                    <h2>Resumen de Entregas</h2>
                    <button class="anuncio-btn close" onclick="ocultarAnuncio()">
                        <i class="fas fa-arrow-right"></i>
                    </button>
                </div>
                <div class="relleno">
                    <div class="detalles-grup">
                        ${entregasRealizadas.map(entrega => `
                            <div class="detalles-entrega">
                                <div class="detalle-item">
                                    <p>Producto:</p><span>${entrega.nombre}</span>
                                </div>
                                <div class="detalle-item">
                                    <p>Cantidad:</p><span>${entrega.cantidad} Kg</span>
                                </div>
                                <div class="detalle-item">
                                    <p>Proveedor:</p><span>${entrega.proveedor}</span>
                                </div>
                                <div class="detalle-item">
                                    <p>Precio:</p><span>S/. ${entrega.precio}</span>
                                </div>
                                <div class="detalle-item">
                                    <p>Transporte:</p><span>S/. ${entrega.transporte || '0'}</span>
                                </div>
                                <div class="detalle-item">
                                    <p>Detalles:</p><span>${entrega.observaciones} ${entrega.unidad}</span>
                                </div>
                                <div class="detalle-item">
                                    <p>Estado:</p><span>${entrega.estado === 'llego' ? 'Llegó' : 'No llegó'}</span>
                                </div>
                            </div>
                        `).join('<hr>')}
                    </div>
                </div>
                <div class="anuncio-botones">
                    <button class="anuncio-btn red btn-limpiar">
                        <i class="fas fa-broom"></i> Limpiar
                    </button>
                    <button class="anuncio-btn blue btn-seguir">
                        <i class="fas fa-plus"></i> Seguir
                    </button>
                    <button class="anuncio-btn green whatsapp btn-whatsapp">
                        <i class="fab fa-whatsapp"></i> Enviar
                    </button>
                </div>
            </div>
        `;

        // Configurar los botones después de crear el contenido
        const anuncioContenido = anuncio.querySelector('.anuncio-contenido');
        const btnLimpiar = anuncioContenido.querySelector('.btn-limpiar');
        const btnSeguir = anuncioContenido.querySelector('.btn-seguir');
        const btnWhatsapp = anuncioContenido.querySelector('.btn-whatsapp');

        btnLimpiar.addEventListener('click', () => {
            entregasRealizadas = [];
            ocultarAnuncio();
            cargarPedidos();
        });

        btnSeguir.addEventListener('click', () => {
            ocultarAnuncio();
        });

        btnWhatsapp.addEventListener('click', compartirEntregas);

        mostrarAnuncio();
    } catch (error) {
        console.error('Error en mostrarResumenEntrega:', error);
        mostrarNotificacion('Error al mostrar el resumen de entregas', 'error');
    }
}




