export function inicializarPedidos() {
    const container = document.querySelector('.newPedido-view');
    container.innerHTML = `
        <div class="title">
            <h2 class="section-title"><i class="fas fa-shopping-basket fa-2x"></i> Gestión de Pedidos</h2>
        </div>
        <div class="pedidos-container">
            <div class="pedidos-botones">
                <div class="cuadro-btn"><button class="btn-agregar-pedido" onclick="mostrarFormularioPedido()">
                        <i class="fas fa-plus"></i>
                    </button>
                    <p>Agregar</p>
                </div>
                <div class="cuadro-btn"><button class="btn-agregar-pedido" onclick="compartirPedido()">
                        <i class="fab fa-whatsapp"></i>
                    </button>
                    <p>Compartir</p>
                </div>
                <div class="cuadro-btn"><button class="btn-agregar-pedido" onclick="finalizarPedidos()">
                        <i class="fas fa-check-circle"></i>
                    </button>
                    <p>Finalizar</p>
                </div> 
                <div class="cuadro-btn"><button class="btn-agregar-pedido btn-toggle-archivados" onclick="togglePedidosArchivados()">
                        <i class="fas fa-archive"></i>
                    </button>
                    <p>Archivados</p>
                </div>
                <div class="cuadro-btn"><button class="btn-agregar-pedido btn-toggle-recibidos" onclick="togglePedidosRecibidos()">
                        <i class="fas fa-truck-loading"></i>
                    </button>
                    <p>Recibidos</p>
                </div>
            </div>
            <div class="pedidos-archivados">
                <div class="lista-archivados" style="display: none;"></div>
                <div class="lista-recibidos" style="display: none;"></div>
            </div>
            <div class="lista-pedidos"></div>
        </div>
    `;
    cargarPedidos();
    cargarPedidosArchivados();
}
export function togglePedidosRecibidos() {
    const listaRecibidos = document.querySelector('.lista-recibidos');
    const listaArchivados = document.querySelector('.lista-archivados');
    const estaVisible = listaRecibidos.style.display !== 'none';
    
    // Ocultar archivados y actualizar su botón
    listaArchivados.style.display = 'none';
    
    // Toggle recibidos
    listaRecibidos.style.display = estaVisible ? 'none' : 'block';
    
    if (!estaVisible) {
        cargarPedidosRecibidos();
    }
}
export function togglePedidosArchivados() {
    const listaArchivados = document.querySelector('.lista-archivados');
    const listaRecibidos = document.querySelector('.lista-recibidos');
    const estaVisible = listaArchivados.style.display !== 'none';
    
    // Ocultar recibidos y actualizar su botón
    listaRecibidos.style.display = 'none';
    
    // Toggle archivados
    listaArchivados.style.display = estaVisible ? 'none' : 'block';
}
export async function cargarPedidosRecibidos() {
    try {
        mostrarCarga();
        const response = await fetch('/obtener-pedidos-recibidos');
        const data = await response.json();

        const container = document.querySelector('.lista-recibidos');
        if (data.success && data.hojas.length > 0) {
            container.innerHTML = data.hojas.map(hoja => `
                <div class="hoja-recibida">
                    <button class="btn-hoja" onclick="mostrarPedidosRecibidos('${hoja}')">
                        <i class="fas fa-file-invoice"></i> ${hoja}
                    </button>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<p class="no-archivos">No hay pedidos recibidos</p>';
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error al cargar pedidos recibidos', 'error');
    }
    finally{
        ocultarCarga();
    }
}
export async function procesarIngreso(producto, hoja) {
    try {
        const pesoInput = document.getElementById('peso-ingreso');
        const peso = pesoInput.value.trim();

        if (!peso) {
            mostrarNotificacion('Por favor ingrese el peso', 'warning');
            return;
        }

        mostrarCarga();
        const response = await fetch('/procesar-ingreso', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ producto, peso, hoja })
        });

        const data = await response.json();
        if (data.success) {
            mostrarNotificacion('Ingreso procesado correctamente', 'success');
            cerrarFormularioPedido();
            
            // Si la hoja fue eliminada, actualizar la vista
            if (data.hojaEliminada) {
                const listaRecibidos = document.querySelector('.lista-recibidos');
                if (listaRecibidos) {
                    // Eliminar la hoja de la lista
                    const hojaElement = listaRecibidos.querySelector(`[onclick="mostrarPedidosRecibidos('${hoja}')"]`);
                    if (hojaElement) {
                        hojaElement.closest('.hoja-recibida').remove();
                    }
                }
            }
            
            // Recargar la lista de pedidos recibidos
            await cargarPedidosRecibidos();
        } else {
            mostrarNotificacion(data.error || 'Error al procesar el ingreso', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error al procesar el ingreso', 'error');
    } finally {
        ocultarCarga();
        const anuncio = document.querySelector('.anuncio');
        if (anuncio) {
            anuncio.style.display = 'none';
        }
    }
}
export async function mostrarPedidosRecibidos(hoja) {
    try {
        mostrarCarga();
        const response = await fetch(`/obtener-detalles-recibidos/${encodeURIComponent(hoja)}`);
        const data = await response.json();

        if (data.success && data.pedidos && data.pedidos.length > 1) {
            const anuncio = document.querySelector('.anuncio');
            anuncio.style.display = 'flex';
            
            anuncio.innerHTML = `
                <div class="anuncio-contenido">
                    <h2>Pedidos Recibidos</h2>
                    <p class="fecha-archivo">Fecha: ${hoja.replace('Pedidos_', '')}</p>
                    <div class="pedidos-recibidos-lista">
                        ${data.pedidos.slice(1).map(pedido => `
                            <div class="pedido-recibido-item">
                                <div class="pedido-recibido-info">
                                    <span class="pedido-nombre">${pedido[1] || ''}</span>
                                    <span class="pedido-cantidad">${pedido[2] || ''}</span>
                                    <span class="pedido-recibido">Cantidad: ${pedido[4] || 'No recibido'}</span> <br>
                                    <span class="pedido-proveedor">Proveedor: ${pedido[5] || 'Sin proveedor'}</span><br>
                                    <span class="pedido-costo">Precio: ${pedido[6]+' Bs.' || 'Sin costo'}</span><br>
                                    <div class="btn-recibido-pedido">
                                        <button class="btn-ingreso-pedido" onclick="mostrarFormularioIngreso('${pedido[1]}', '${hoja}', '${pedido[4]}')">
                                            <i class="fas fa-warehouse"></i> Ingresar
                                        </button>
                                        <button class="btn-rechazo-pedido" onclick="mostrarFormularioRechazo('${pedido[1]}', '${hoja}')">
                                            <i class="fas fa-times-circle"></i> Rechazar
                                        </button>
                                    </div>
                                    
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
            mostrarNotificacion('No hay pedidos recibidos', 'info');
            cerrarFormularioPedido();
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error al cargar pedidos recibidos', 'error');
    } finally {
        ocultarCarga();
    }
}
export function mostrarFormularioRechazo(producto, hoja) {
    const anuncio = document.querySelector('.anuncio');
    anuncio.innerHTML = `
        <div class="anuncio-contenido">
            <i class="fas fa-times-circle"></i>
            <h2>Rechazar Pedido</h2>
            <div class="form-rechazo">
                <p>Producto: ${producto}</p>
                <textarea id="razon-rechazo" placeholder="Razón del rechazo" required></textarea>
            </div>
            <div class="anuncio-botones">
                <button class="anuncio-btn cancelar" onclick="mostrarPedidosRecibidos('${hoja}')">Cancelar</button>
                <button class="anuncio-btn confirmar" onclick="confirmarRechazo('${producto}', '${hoja}')">Confirmar</button>
            </div>
        </div>
    `;
    anuncio.style.display = 'flex';
}
export async function confirmarRechazo(producto, hoja) {
    try {
        const razon = document.getElementById('razon-rechazo').value.trim();
        
        if (!razon) {
            mostrarNotificacion('Por favor ingrese la razón del rechazo', 'warning');
            return;
        }

        mostrarCarga();
        const response = await fetch('/rechazar-pedido', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ producto, hoja, razon })
        });

        const data = await response.json();
        if (data.success) {
            mostrarNotificacion('Pedido rechazado correctamente', 'success');
            await mostrarPedidosRecibidos(hoja);
        } else {
            mostrarNotificacion(data.error || 'Error al rechazar el pedido', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error al rechazar el pedido', 'error');
    } finally {
        ocultarCarga();
    }
}
export async function mostrarFormularioIngreso(producto, hoja) {
    try {
        // Get next lot number
        const response = await fetch(`/obtener-siguiente-lote/${encodeURIComponent(producto)}`);
        const data = await response.json();
        const siguienteLote = data.success ? data.siguienteLote : '?';

        const anuncio = document.querySelector('.anuncio');
        anuncio.innerHTML = `
            <div class="anuncio-contenido">
                <h2>Ingreso de Producto</h2>
                <div class="form-ingreso">
                    <input type="text" id="producto-ingreso" value="${producto}" readonly>
                    <div class="lote-info">Lote a asignar: ${siguienteLote}</div>
                    <input type="number" id="peso-ingreso" placeholder="Peso en kg" step="0.01">
                </div>
                <div class="anuncio-botones">
                    <button class="anuncio-btn cancelar" onclick="mostrarPedidosRecibidos('${hoja}')">Cancelar</button>
                    <button class="anuncio-btn confirmar" onclick="procesarIngreso('${producto}', '${hoja}')">Ingresar</button>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error al cargar el formulario de ingreso', 'error');
    }
}
export async function cargarPedidosArchivados() {
    try {
        mostrarCarga();
        const response = await fetch('/obtener-hojas-pedidos');
        const data = await response.json();

        if (data.success && data.hojas.length > 0) {
            const container = document.querySelector('.lista-archivados');
            container.innerHTML = data.hojas.map(hoja => `
                <div class="hoja-archivada">
                    <button class="btn-hoja" onclick="mostrarPedidosArchivados('${hoja}')">
                        <i class="fas fa-file-invoice"></i> ${hoja}
                    </button>
                </div>
            `).join('');
        } else {
            const container = document.querySelector('.lista-archivados');
            container.innerHTML = '<p class="no-archivos">No hay pedidos archivados</p>';
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error al cargar pedidos archivados', 'error');
    }
    finally{
        ocultarCarga();
    }
}
export async function mostrarDetallesPedido(hoja) {
    try {
        mostrarCarga();
        const response = await fetch(`/obtener-detalles-pedido/${encodeURIComponent(hoja)}`);
        const data = await response.json();

        if (data.success && data.pedidos) {
            const anuncio = document.querySelector('.anuncio');
            anuncio.style.display = 'flex';
            
            anuncio.innerHTML = `
                <div class="anuncio-contenido">
                    <h2>Pedidos Archivados</h2>
                    <p class="fecha-archivo">Fecha: ${hoja.replace('Pedidos_', '')}</p>
                    <div class="pedidos-archivados-lista">
                        ${data.pedidos.slice(1).map(pedido => `
                            <div class="pedido-archivado-item">
                                <div class="pedido-info">
                                    <span class="pedido-nombre">${pedido[1] || ''}</span>
                                    <span class="pedido-cantidad">${pedido[2] || ''}</span>
                                    <span class="pedido-obs">${pedido[3] || 'Sin observaciones'}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="anuncio-botones">
                        <button class="anuncio-btn cancelar" onclick="cerrarFormularioPedido()">Cerrar</button>
                    </div>
                </div>
            `;
        } else {
            mostrarNotificacion('No se encontraron detalles del pedido', 'warning');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error al cargar detalles del pedido', 'error');
    } finally {
        ocultarCarga();
    }
}
export async function mostrarPedidosArchivados(hoja) {
    try {
        mostrarCarga();
        const response = await fetch(`/obtener-detalles-pedido/${encodeURIComponent(hoja)}`);
        const data = await response.json();

        if (data.success && data.pedidos) {
            const anuncio = document.querySelector('.anuncio');
            anuncio.style.display = 'flex';
            
            anuncio.innerHTML = `
                <div class="anuncio-contenido">
                    <h2>Pedidos Archivados</h2>
                    <p class="fecha-archivo">Fecha: ${hoja.replace('Pedidos_', '')}</p>
                    <div class="pedidos-archivados-lista">
                        ${data.pedidos.slice(1).map(pedido => `
                            <div class="pedido-archivado-item">
                                <div class="pedido-info">
                                    <span class="pedido-nombre">${pedido[1] || ''}</span>
                                    <span class="pedido-cantidad">${pedido[2] || ''}</span>
                                    <span class="pedido-obs">${pedido[3] || 'Sin observaciones'}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="anuncio-botones">
                        <button class="anuncio-btn cancelar" onclick="cerrarFormularioPedido()">Cerrar</button>
                    </div>
                </div>
            `;
        } else {
            mostrarNotificacion('No se encontraron detalles del pedido', 'warning');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error al cargar detalles del pedido', 'error');
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

export async function mostrarFormularioPedido() {
    try {
        mostrarCarga();
        const response = await fetch('/obtener-lista-pedidos');
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || 'Error al cargar lista de pedidos');
        }

        const anuncio = document.querySelector('.anuncio');
        const contenido = anuncio.querySelector('.anuncio-contenido');
        
        contenido.innerHTML = `
            <i class="fas fa-shopping-basket fa-2x"></i>
            <h2>Nuevo Pedido</h2>
            <div class="form-pedido">
                <div class="autocomplete-wrapper">
                    <input type="text" id="nombre-pedido" placeholder="Nombre del producto" autocomplete="off" required>
                    <div id="sugerencias-pedido" class="sugerencias-lista"></div>
                </div>
                <div class="cantidad-container">
                    <input type="number" id="cantidad-pedido" placeholder="Cantidad" required>
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
                <button class="anuncio-btn cancelar">Cancelar</button>
                <button class="anuncio-btn confirmar">Añadir</button>
            </div>
        `;

        // Configurar autocompletado
        const inputPedido = document.getElementById('nombre-pedido');
        const sugerenciasList = document.getElementById('sugerencias-pedido');
        const pedidos = data.pedidos;

        // Agregar evento para verificar pedidos existentes
        inputPedido.addEventListener('blur', async () => {
            const nombre = inputPedido.value.trim();
            if (nombre) {
                await verificarPedidoExistente(nombre);
            }
        });

        const normalizeText = (text) => {
            return text.toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-z0-9\s]/g, '');
        };

        inputPedido.addEventListener('input', () => {
            const inputValue = normalizeText(inputPedido.value);
            const sugerencias = pedidos.filter(pedido => 
                normalizeText(pedido).includes(inputValue)
            );

            if (inputValue && sugerencias.length > 0) {
                sugerenciasList.innerHTML = sugerencias
                    .map(pedido => `<div class="sugerencia-item">${pedido}</div>`)
                    .join('');
                sugerenciasList.style.display = 'block';
            } else {
                sugerenciasList.style.display = 'none';
            }
        });

        // Manejar clic en sugerencia
        sugerenciasList.addEventListener('click', (e) => {
            if (e.target.classList.contains('sugerencia-item')) {
                inputPedido.value = e.target.textContent;
                sugerenciasList.style.display = 'none';
                // Verificar pedidos existentes al seleccionar una sugerencia
                verificarPedidoExistente(e.target.textContent);
            }
        });

        // Ocultar sugerencias al hacer clic fuera
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.autocomplete-wrapper')) {
                sugerenciasList.style.display = 'none';
            }
        });

        // Actualizar los event listeners
        anuncio.querySelector('.cancelar').onclick = cerrarFormularioPedido;
        anuncio.querySelector('.confirmar').onclick = guardarPedido;
        anuncio.style.display = 'flex';

    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error al cargar el formulario de pedido', 'error');
    } finally {
        ocultarCarga();
    }
}
// Agregar esta función para verificar pedidos existentes
async function verificarPedidoExistente(nombre) {
    try {
        const response = await fetch(`/buscar-pedido-existente/${encodeURIComponent(nombre)}`);
        const data = await response.json();
        
        if (data.success && data.pedidoExistente) {
            const { hoja, datos } = data.pedidoExistente;
            mostrarSugerenciaPedido(hoja, datos);
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error:', error);
        return false;
    }
    finally {
        ocultarCarga();
    }
}

// Agregar esta función para mostrar la sugerencia
// Modificar la función mostrarSugerenciaPedido
function mostrarSugerenciaPedido(hoja, pedido) {
    const sugerenciaDiv = document.createElement('div');
    sugerenciaDiv.className = 'sugerencia-pedido-existente';
    
    // Extraer cantidad y unidad del pedido[2] (ejemplo: "5 kg" -> ["5", "kg"])
    const [cantidad, unidad] = pedido[2].split(' ');
    sugerenciaDiv.innerHTML = `
        <div class="sugerencia-contenido">
            <p>Ya existe un pedido sin recibir para "${pedido[1]}"</p>
            <p>Cantidad: ${pedido[2]}</p>
            <p>En la hoja: ${hoja}</p>
            <div class="sugerencia-botones">
                <button class="btn-usar-existente">Usar pedido existente</button>
                <button class="btn-crear-nuevo">Crear nuevo pedido</button>
            </div>
        </div>
    `;
    mostrarCarga();
    const formPedido = document.querySelector('.form-pedido');
    formPedido.appendChild(sugerenciaDiv);

    // Manejar la decisión del usuario
    sugerenciaDiv.querySelector('.btn-usar-existente').onclick = async () => {
        // Establecer valores en el formulario
        document.getElementById('cantidad-pedido').value = cantidad;
        const selectUnidad = document.getElementById('unidad-medida');
        // Encontrar la opción que coincida con la unidad
        const opcionUnidad = Array.from(selectUnidad.options)
            .find(option => option.value === unidad || option.text === unidad);
        if (opcionUnidad) {
            selectUnidad.value = opcionUnidad.value;
        }
        
        // Eliminar el pedido existente
        await eliminarPedidoExistente(hoja, pedido[1]);
        sugerenciaDiv.remove();
    };

    sugerenciaDiv.querySelector('.btn-crear-nuevo').onclick = () => {
        sugerenciaDiv.remove();
    };
}

// Agregar la función eliminarPedidoExistente
async function eliminarPedidoExistente(hoja, nombre) {
    try {
        mostrarCarga();
        const response = await fetch('/eliminar-pedido-existente', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ hoja, nombre })
        });

        const data = await response.json();
        if (data.success) {
            mostrarNotificacion('Pedido existente eliminado correctamente', 'success');
            if (data.hojaEliminada) {
                mostrarNotificacion('Hoja de pedido eliminada', 'info');
            }
        } else {
            mostrarNotificacion(data.error || 'Error al eliminar pedido existente', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error al eliminar pedido existente', 'error');
    }
    finally {
        ocultarCarga();
    }
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
    anuncio.style.display = 'none';
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
    const contenido = anuncio.querySelector('.anuncio-contenido');
    
    contenido.innerHTML = `
        <i class="fas fa-exclamation-triangle"></i>
        <h2>¿Eliminar pedido?</h2>
        <p>Esta acción no se puede deshacer</p>
        <div class="anuncio-botones">
            <button class="anuncio-btn cancelar">Cancelar</button>
            <button class="anuncio-btn confirmar">Eliminar</button>
        </div>
    `;

    // Actualizar los event listeners
    anuncio.querySelector('.cancelar').onclick = cerrarFormularioPedido;
    anuncio.querySelector('.confirmar').onclick = () => eliminarPedido(fecha, nombre);
    anuncio.style.display = 'flex';
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
export function compartirEnWhatsApp(fileName) {
    const numero = "59169713972";
    const mensaje = `Hola, te comparto el archivo de pedidos: ${fileName}`;
    
    const enlaceWhatsApp = `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
    
    // Open WhatsApp in a new window to maintain the current page
    window.open(enlaceWhatsApp, '_blank');
}