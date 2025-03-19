export function inicializarPedidos() {
    const container = document.querySelector('.newPedido-view');
    container.innerHTML = `
        <div class="title">
            <h3>Gestión de Pedidos</h3>
        </div>
        <div class="pedidos-container">
            <div class="pedidos-botones">
                <button class="btn-agregar-pedido" onclick="mostrarFormularioPedido()">
                    <i class="fas fa-plus"></i> Agregar
                </button>
                <button class="btn-agregar-pedido" onclick="compartirPedido()">
                    <i class="fas fa-file-pdf"></i> Exportar
                </button>
                <button class="btn-agregar-pedido" onclick="finalizarPedidos()">
                    <i class="fas fa-check-circle"></i> Finalizar
                </button>
            </div>
            <div class="pedidos-archivados">
                <button class="btn-toggle-archivados" onclick="togglePedidosArchivados()">
                    <i class="fas fa-archive"></i> Ver Pedidos Archivados
                </button>
                <div class="lista-archivados" style="display: none;"></div>
            </div>
            <div class="lista-pedidos"></div>
        </div>
    `;
    cargarPedidos();
    cargarPedidosArchivados();
}
export async function cargarPedidosArchivados() {
    try {
        const response = await fetch('/obtener-hojas-pedidos');
        const data = await response.json();

        if (data.success && data.hojas.length > 0) {
            const container = document.querySelector('.lista-archivados');
            container.innerHTML = data.hojas.map(hoja => `
                <div class="hoja-archivada">
                    <button class="btn-hoja" onclick="mostrarPedidosArchivados('${hoja}')">
                        <i class="fas fa-folder"></i> ${hoja}
                    </button>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error al cargar pedidos archivados', 'error');
    }
}
export function togglePedidosArchivados() {
    const listaArchivados = document.querySelector('.lista-archivados');
    const boton = document.querySelector('.btn-toggle-archivados');
    const estaVisible = listaArchivados.style.display !== 'none';
    
    listaArchivados.style.display = estaVisible ? 'none' : 'block';
    boton.innerHTML = estaVisible ? 
        '<i class="fas fa-archive"></i> Ver Pedidos Archivados' : 
        '<i class="fas fa-archive"></i> Ocultar Pedidos Archivados';
}
export async function mostrarPedidosArchivados(hoja) {
    try {
        mostrarCarga();
        const response = await fetch(`/obtener-pedidos-archivados/${encodeURIComponent(hoja)}`);
        const data = await response.json();

        if (data.success && data.pedidos.length > 0) {
            const anuncio = document.querySelector('.anuncio');
            anuncio.style.display = 'flex';
            anuncio.innerHTML = `
                <div class="anuncio-contenido">
                    <h2>Pedidos Archivados</h2>
                    <p class="fecha-archivo">Fecha: ${hoja.replace('Pedidos_', '')}</p>
                    <div class="pedidos-archivados-lista">
                        ${data.pedidos.slice(1).map(pedido => `
                            <div class="pedido-archivado-item">
                                <div class="pedido-archivado-info">
                                    <span class="pedido-nombre">${pedido[1]}</span>
                                    <span class="pedido-cantidad">${pedido[2]}</span>
                                </div>
                                <div class="pedido-obs">${pedido[3] || 'Sin observaciones'}</div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="anuncio-botones">
                        <button class="anuncio-btn cancelar" onclick="cerrarFormularioPedido()">Cerrar</button>
                    </div>
                </div>
            `;
        } else {
            mostrarNotificacion('No hay pedidos en este archivo', 'warning');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error al cargar pedidos archivados', 'error');
    } finally {
        ocultarCarga();
    }
}
export async function finalizarPedidos() {
    try {
        mostrarCarga();
        const response = await fetch('/obtener-pedidos');
        const data = await response.json();

        if (!data.success || !data.pedidos.length) {
            mostrarNotificacion('No hay pedidos para finalizar', 'warning');
            return;
        }

        // Mostrar confirmación
        const anuncio = document.querySelector('.anuncio');
        anuncio.style.display = 'flex';
        anuncio.innerHTML = `
            <div class="anuncio-contenido">
                <i class="fas fa-clipboard-check"></i>
                <h2>Finalizar Pedidos</h2>
                <p>¿Desea finalizar y archivar todos los pedidos actuales?</p>
                <div class="pedidos-resumen">
                    <h3>Resumen de Pedidos:</h3>
                    ${data.pedidos.slice(1).map(pedido => `
                        <div class="pedido-resumen-item">
                            <span>${pedido[1]}</span>
                            <span>${pedido[2]}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="anuncio-botones">
                    <button class="anuncio-btn cancelar" onclick="cerrarFormularioPedido()">Cancelar</button>
                    <button class="anuncio-btn confirmar" onclick="confirmarFinalizacionPedidos()">Finalizar</button>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error al cargar los pedidos', 'error');
    } finally {
        ocultarCarga();
    }
}
export async function confirmarFinalizacionPedidos() {
    try {
        mostrarCarga();
        const response = await fetch('/finalizar-pedidos', {
            method: 'POST'
        });

        const data = await response.json();
        if (data.success) {
            mostrarNotificacion('Pedidos finalizados correctamente', 'success');
            cerrarFormularioPedido();
            await Promise.all([
                cargarPedidos(),
                cargarPedidosArchivados() // Agregamos esta línea para actualizar la lista
            ]);
        } else {
            mostrarNotificacion(data.error, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error al finalizar los pedidos', 'error');
    } finally {
        ocultarCarga();
    }
}
export function mostrarFormularioPedido() {
    const anuncio = document.querySelector('.anuncio');
    anuncio.style.display='flex'
    anuncio.innerHTML = `
        <div class="anuncio-contenido">
        <i class="fas fa-shopping-basket fa-2x"></i>
            <h2>Nuevo Pedido</h2>
            <div class="form-pedido">
                <input type="text" id="nombre-pedido" placeholder="Nombre del producto">
                <div class="cantidad-container">
                    <input type="number" id="cantidad-pedido" placeholder="Cantidad">
                    <select id="unidad-medida">
                        <option value="unid.">und.</option>
                        <option value="cajas">cj.</option>
                        <option value="bolsas">bls.</option>
                        <option value="qq">qq</option>
                        <option value="kg">kg</option>
                        <option value="arroba">@</option>
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
        const response = await fetch('/obtener-pedidos');
        const data = await response.json();

        if (!data.success || !data.pedidos.length) {
            mostrarNotificacion('No hay pedidos para compartir', 'warning');
            return;
        }

        // Format pedidos as text
        const fecha = new Date().toLocaleDateString();
        let mensaje = `*PEDIDOS DAMABRAVA ${fecha}*\n\n`;
        
        data.pedidos.slice(1).forEach(pedido => {
            mensaje += `📦 *${pedido[1]}*\n`;
            mensaje += `📏 Cantidad: ${pedido[2]}\n`;
            if (pedido[3]) {
                mensaje += `📝 Obs: ${pedido[3]}\n`;
            }
            mensaje += `\n`;
        });

        mensaje += '\n_Enviado desde App Damabrava_';

        // Share via WhatsApp
        const numero = "59169713972";
        const enlaceWhatsApp = `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
        window.open(enlaceWhatsApp, '_blank');
        
        mostrarNotificacion('Abriendo WhatsApp...', 'success');
    } catch (error) {
        console.error('Error al compartir:', error);
        mostrarNotificacion('Error al compartir los pedidos', 'error');
    } finally {
        ocultarCarga();
    }
}

// Remove or comment out the compartirEnWhatsApp function as it's no longer needed
export function compartirEnWhatsApp(fileName) {
    const numero = "59169713972";
    const mensaje = `Hola, te comparto el archivo de pedidos: ${fileName}`;
    
    const enlaceWhatsApp = `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
    
    // Open WhatsApp in a new window to maintain the current page
    window.open(enlaceWhatsApp, '_blank');
}
