export function inicializarCompras() {
    mostrarCarga();
    const container = document.querySelector('.compras-view');
    container.innerHTML = `
        <div class="title">
            <h2 class="section-title"><i class="fas fa-shopping-cart fa-2x"></i> Gestión de Compras</h2>
        </div>
        <div class="acopio-section">
            <div class="acopio-header">
                <i class="fas fa-archive"></i>
                <h3>Acopio</h3>
                <i class="fas fa-chevron-down"></i>
            </div>
            <div class="acopio-content">
                <div class="pedidos-section">
                    <h4 class="section-subtitle"><i class="fas fa-times-circle"></i> Pedidos Rechazados</h4>
                    <div class="pedidos-rechazados"></div>
                </div>
                <div class="pedidos-section">
                    <h4 class="section-subtitle"><i class="fas fa-clock"></i> Pedidos Pendientes</h4>
                    <div class="pedidos-pendientes"></div>
                </div>
                <div class="pedidos-section">
                    <h4 class="section-subtitle"><i class="fas fa-exclamation-circle"></i> Pedidos Parcialmente Recibidos</h4>
                    <div class="pedidos-parciales"></div>
                </div>
            </div>
        </div>
    `;

    // Configurar el comportamiento desplegable
    const acopioHeader = container.querySelector('.acopio-header');
    const acopioSection = container.querySelector('.acopio-section');
    const acopioContent = container.querySelector('.acopio-content');
    const chevronIcon = acopioHeader.querySelector('.fa-chevron-down');

    acopioHeader.addEventListener('click', () => {
        acopioSection.classList.toggle('expanded');
        acopioContent.classList.toggle('expanded');
        chevronIcon.classList.toggle('rotated');
        if (acopioContent.classList.contains('expanded')) {
            cargarPedidosArchivados();
        }
    });
    ocultarCarga();
}
// ... existing code ...
async function cargarPedidosArchivados() {
    try {
        mostrarCarga();
        const response = await fetch('/obtener-pedidos-clasificados');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        if (data.success) {
            const rechazadosContainer = document.querySelector('.pedidos-rechazados');
            const pendientesContainer = document.querySelector('.pedidos-pendientes');
            const parcialesContainer = document.querySelector('.pedidos-parciales');
            
            const renderizarPedidos = (pedidos, container) => {
                if (!container) {
                    console.error('Container not found');
                    return;
                }
                
                if (pedidos && pedidos.length > 0) {
                    container.innerHTML = pedidos.map(hoja => {
                        const nombreHoja = typeof hoja === 'object' ? hoja.nombre : hoja;
                        return `
                            <div class="pedido-archivado">
                                <div class="pedido-archivado-header">
                                    <span>${nombreHoja}</span>
                                    <button class="btn-ver-detalles" data-hoja="${nombreHoja}">
                                        Ver Detalles
                                    </button>
                                </div>
                                <div class="pedido-detalles-compras" id="detalles-${nombreHoja.replace(/[^a-zA-Z0-9]/g, '')}"></div>
                                <button class="anuncio-btn confirmar entregar" data-hoja="${nombreHoja}">
                                    Entregar
                                </button>
                            </div>
                        `;
                    }).join('');

                    // Configurar botones de ver detalles
                    container.querySelectorAll('.btn-ver-detalles').forEach(btn => {
                        btn.addEventListener('click', async (e) => {
                            const hoja = e.target.dataset.hoja;
                            const detallesContainer = document.getElementById(`detalles-${hoja.replace(/[^a-zA-Z0-9]/g, '')}`);
                            const detallesButton = e.target;

                            try {
                                if (!detallesContainer.innerHTML) {
                                    detallesButton.disabled = true;
                                    mostrarCarga();
                                    const response = await fetch(`/obtener-detalles-pedidos/${encodeURIComponent(hoja)}`);
                                    const data = await response.json();

                                    if (data.success) {
                                        detallesContainer.innerHTML = `
                                            <table class="detalles-table">
                                                <thead>
                                                    <tr>
                                                        <th>Fecha</th>
                                                        <th>Producto</th>
                                                        <th>Cantidad</th>
                                                        <th>Observaciones</th>
                                                        <th>Cant. Recibida</th>
                                                        <th>Proveedor</th>
                                                        <th>Fecha Recepción</th>
                                                        <th>Estado</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    ${data.pedidos.map(pedido => `
                                                        <tr>
                                                            <td>${pedido[0] || '-'}</td>
                                                            <td>${pedido[1] || '-'}</td>
                                                            <td>${pedido[2] || '-'}</td>
                                                            <td>${pedido[3] || '-'}</td>
                                                            <td>${pedido[4] || '-'}</td>
                                                            <td>${pedido[5] || '-'}</td>
                                                            <td>${pedido[6] || '-'}</td>
                                                            <td>${pedido[7] || 'Pendiente'}</td>
                                                        </tr>
                                                    `).join('')}
                                                </tbody>
                                            </table>
                                        `;
                                    }
                                    detallesButton.disabled = false;
                                }
                                detallesContainer.classList.toggle('expanded');
                                detallesButton.textContent = detallesContainer.classList.contains('expanded') ? 
                                    'Ocultar Detalles' : 'Ver Detalles';
                            } catch (error) {
                                console.error('Error:', error);
                                detallesContainer.innerHTML = '<p class="error">Error al cargar los detalles</p>';
                                detallesButton.disabled = false;
                            } finally {
                                ocultarCarga();
                            }
                        });
                    });
                    
                    // Configurar botones de entregar
                    container.querySelectorAll('.entregar').forEach(btn => {
                        btn.addEventListener('click', async (e) => {
                            const hoja = e.target.dataset.hoja;
                            try {
                                mostrarCarga();
                                const response = await fetch(`/obtener-detalles-pedidos/${encodeURIComponent(hoja)}`);
                                const data = await response.json();
                                
                                if (data.success) {
                                    mostrarFormularioEntrega(hoja, data.pedidos);
                                } else {
                                    mostrarNotificacion('Error al cargar los detalles del pedido', 'error');
                                }
                            } catch (error) {
                                console.error('Error:', error);
                                mostrarNotificacion('Error al cargar los detalles del pedido', 'error');
                            } finally {
                                ocultarCarga();
                            }
                        });
                    });
                } else {
                    container.innerHTML = '<p class="no-pedidos">No hay pedidos en esta sección</p>';
                }
            };

            // Renderizar cada sección
            renderizarPedidos(data.pedidos.rechazados, rechazadosContainer);
            renderizarPedidos(data.pedidos.pendientes, pendientesContainer);
            renderizarPedidos(data.pedidos.parciales, parcialesContainer);
        } else {
            throw new Error(data.error || 'Error al cargar los pedidos');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error al cargar los pedidos: ' + error.message, 'error');
        const containers = [
            '.pedidos-rechazados',
            '.pedidos-pendientes',
            '.pedidos-parciales'
        ];
        containers.forEach(container => {
            const element = document.querySelector(container);
            if (element) {
                element.innerHTML = '<p class="error">Error al cargar los pedidos</p>';
            }
        });
    } finally {
        ocultarCarga();
    }
}
function mostrarFormularioEntrega(hoja, pedidos) {
    const anuncio = document.querySelector('.anuncio');
    const contenido = anuncio.querySelector('.anuncio-contenido');
    
    contenido.innerHTML = `
        <i class="fas fa-truck-loading fa-2x"></i>
        <h2>Registrar Entrega</h2>
        <div class="form-entrega">
            <select id="producto-entrega" required>
                <option value="">Seleccione un producto</option>
                ${pedidos.map(pedido => `
                    <option value="${pedido[1]}">${pedido[1]} - ${pedido[2]}</option>
                `).join('')}
            </select>
            <input type="text" id="cantidad-entrega" placeholder="Cantidad" required>
            <input type="text" id="proveedor-entrega" placeholder="Proveedor" required>
            <input type="number" id="precio-entrega" placeholder="Precio/Costo" step="0.01" required>
        </div>
        <div class="anuncio-botones">
            <button class="anuncio-btn cancelar">Cancelar</button>
            <button class="anuncio-btn confirmar">Confirmar</button>
        </div>
    `;

    // Configurar los event listeners
    anuncio.querySelector('.cancelar').onclick = () => {
        anuncio.style.display = 'none';
    };

    anuncio.querySelector('.confirmar').onclick = async () => {
        const producto = document.getElementById('producto-entrega').value;
        const cantidad = document.getElementById('cantidad-entrega').value;
        const proveedor = document.getElementById('proveedor-entrega').value;
        const precio = document.getElementById('precio-entrega').value;

        if (!producto || !cantidad || !proveedor || !precio) {
            mostrarNotificacion('Por favor complete todos los campos', 'warning');
            return;
        }

        try {
            mostrarCarga();
            const response = await fetch('/actualizar-entrega-pedido', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    hoja,
                    producto,
                    cantidad,
                    proveedor,
                    precio
                })
            });

            const data = await response.json();
            if (data.success) {
                mostrarNotificacion('Entrega registrada correctamente', 'success');
                anuncio.style.display = 'none';
                cargarPedidosArchivados(); // Recargar la lista
            } else {
                mostrarNotificacion(data.error, 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            mostrarNotificacion('Error al registrar la entrega', 'error');
        }finally{
            ocultarCarga();
        }
    };

    anuncio.style.display = 'flex';
}
