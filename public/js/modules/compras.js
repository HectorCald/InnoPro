export function inicializarCompras() {
    mostrarCarga();
    const container = document.querySelector('.compras-view');
    container.style.display = 'flex';
    container.innerHTML = `
        <div class="pedidos-container">
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
    const container = document.querySelector(`.pedidos-list.${tipo}`);
    
    if (!pedidos.length) {
        container.innerHTML = `<p class="no-pedidos">No hay pedidos ${tipo}</p>`;
        return;
    }

    container.innerHTML = pedidos.map(pedido => `
        <div class="pedido-card ${tipo}" data-fecha="${pedido.fecha}" data-nombre="${pedido.nombre}">
            <div class="pedido-info">
                <h4>${pedido.nombre}</h4>
                <p class="cantidad"><i class="fas fa-box"></i> ${pedido.cantidad}</p>
                ${pedido.observaciones ? `<p class="observaciones"><i class="fas fa-comment"></i> ${pedido.observaciones}</p>` : ''}
            </div>
            <div class="pedido-meta">
                <span class="fecha"><i class="far fa-calendar"></i> ${pedido.fecha}</span>
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
}

export async function eliminarPedido(button) {
    try {
        const card = button.closest('.pedido-card');
        const fecha = card.dataset.fecha;
        const nombre = card.dataset.nombre;

        const anuncio = document.querySelector('.anuncio');
        const anuncioContenido = document.querySelector('.anuncio-contenido');
        
        // Update anuncio content
        anuncioContenido.innerHTML = `
        <i class="fas fa-exclamation-triangle"></i>
            <h3> Confirmar eliminación</h3>
            <p>¿Estás seguro de eliminar el pedido de ${nombre}?</p>
            <div class="anuncio-botones">
                <button class="anuncio-btn confirmar">Confirmar</button>
                <button class="anuncio-btn cancelar">Cancelar</button>
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
            body: JSON.stringify({
                fecha: fecha,
                producto: nombre
            })
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
        const fecha = card.dataset.fecha;
        const nombre = card.dataset.nombre;

        const anuncio = document.querySelector('.anuncio');
        const anuncioContenido = document.querySelector('.anuncio-contenido');
        
        // Update anuncio content with form
        anuncioContenido.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <h3>Entregar Pedido</h3>
            <p>Complete los detalles de entrega para: ${nombre}</p>
            <div class="anuncio-form">
                <div class="form-group">
                    <label for="cantidad">Cantidad</label>
                    <input type="text" id="cantidad" class="form-input" placeholder="Ingrese cantidad">
                </div>
                <div class="form-group">
                    <label for="proveedor">Proveedor</label>
                    <input type="text" id="proveedor" class="form-input" placeholder="Nombre del proveedor">
                </div>
                <div class="form-group">
                    <label for="precio">Precio</label>
                    <input type="number" id="precio" class="form-input" placeholder="0.00" step="0.01">
                </div>
                <div class="form-group">
                    <label for="observaciones">Observaciones</label>
                    <textarea id="observaciones" class="form-input" placeholder="Observaciones adicionales"></textarea>
                </div>
            </div>
            <div class="anuncio-botones">
                <button class="anuncio-btn confirmar">Confirmar</button>
                <button class="anuncio-btn cancelar">Cancelar</button>
            </div>
        `;
        
        anuncio.style.display = 'flex';

        const confirmed = await new Promise(resolve => {
            const btnConfirmar = anuncioContenido.querySelector('.confirmar');
            const btnCancelar = anuncioContenido.querySelector('.cancelar');

            const handleConfirm = () => {
                const formData = {
                    cantidad: document.getElementById('cantidad').value,
                    proveedor: document.getElementById('proveedor').value,
                    precio: document.getElementById('precio').value,
                    observaciones: document.getElementById('observaciones').value
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

        const response = await fetch('/entregar-pedido', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                fecha: fecha,
                producto: nombre,
                ...confirmed
            })
        });

        const data = await response.json();

        if (data.success) {
            mostrarNotificacion('Pedido entregado correctamente', 'success');
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