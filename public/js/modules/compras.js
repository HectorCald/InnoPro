export function inicializarCompras() {
    mostrarCarga();
    const container = document.querySelector('.compras-view');
    container.style.display = 'flex';
    container.innerHTML = `
        <div class="compras-header">
            <h2><i class="fas fa-shopping-cart"></i> Gestión de Compras</h2>
        </div>
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
        <div class="pedido-card ${tipo}">
            <div class="pedido-info">
                <h4>${pedido.nombre}</h4>
                <p class="cantidad"><i class="fas fa-box"></i> ${pedido.cantidad}</p>
                ${pedido.observaciones ? `<p class="observaciones"><i class="fas fa-comment"></i> ${pedido.observaciones}</p>` : ''}
            </div>
            <div class="pedido-meta">
                <span class="fecha"><i class="far fa-calendar"></i> ${pedido.fecha}</span>
                ${pedido.proveedor ? `<span class="proveedor"><i class="fas fa-truck"></i> ${pedido.proveedor}</span>` : ''}
            </div>
        </div>
    `).join('');
}