import { registrarNotificacion } from './advertencia.js';
let pedidosTemporales = [];
export function inicializarPedidos() {
    const anuncio = document.querySelector('.anuncio').style.display='none'
    const container = document.querySelector('.newPedido-view');
    container.innerHTML = `
        <div class="title">
            <h3><i class="fas fa-shopping-basket fa-2x"></i> Gestión de Pedidos</h3>
        </div>
        <div class="pedidos-container">
            <div class="pedidos-botones">
                <div class="cuadro-btn"><button class="btn-agregar-pedido" onclick="mostrarFormularioPedido()">
                        <i class="fas fa-plus"></i>
                    </button>
                    <p>Agregar</p>
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
}
export async function togglePedidosRecibidos() {
    const listaRecibidos = document.querySelector('.lista-recibidos');
    const listaArchivados = document.querySelector('.lista-archivados');
    const estaVisible = listaRecibidos.style.display !== 'none';
    
    listaArchivados.style.display = 'none';
    
    if (!estaVisible) {
        try {
            mostrarCarga();
            const response = await fetch('/obtener-pedidos-recibidos');
            const data = await response.json();
            if (data.success && data.pedidos.length > 0) {
                listaRecibidos.innerHTML = `
                    <h2 class="section-title">Pedidos recibidos</h2>
                    <div class="pedido-archivado-card">
                        <div class="section-header">
                            <h3><i class="fas fa-check-circle"></i> Resumen de Ingresos</h3>
                            <button class="btn-copiar" onclick="copiarResumenIngresos()">
                                <i class="fas fa-copy"></i> Copiar
                            </button>
                        </div>
                        <div class="resumen-ingresos" data-ingresos="[]"></div>
                    </div>
                    ${data.pedidos.map(pedido => `
                        <div class="pedido-archivado-card">
                            <div class="pedido-archivado-header">
                                <span class="pedido-nombre">${pedido.nombre}(${pedido.id})</span>
                                <span class="pedido-fecha"><i class="fas fa-calendar"></i> ${pedido.fecha}</span>
                            </div>
                            <div class="pedido-detalles">
                                <span class="pedido-cantidad">
                                    <i class="fas fa-box"></i>
                                    Pedido: ${pedido.cantidad}
                                </span>
                                ${pedido.proveedor ? `
                                <span class="pedido-proveedor">
                                    <i class="fas fa-truck"></i>
                                    Proveedor: ${pedido.proveedor}
                                </span>` : ''}
                                <span class="pedido-obs">
                                    <i class="fas fa-clipboard-check"></i>
                                    ${pedido.obsCompras} ${pedido.medida} 
                                </span>
                            </div>
                            <div class="anuncio-botones">
                                <button class="enviar anuncio-btn green" onclick="window.mostrarFormularioIngreso('${pedido.id}','${pedido.nombre}', 'Pedidos')">
                                    <i class="fas fa-check"></i>
                                    Ingresar
                                </button>
                                <button class="cancelar anuncio-btn red" onclick="window.mostrarFormularioRechazo('${pedido.id}','${pedido.nombre}', 'Pedidos')">
                                    <i class="fas fa-times"></i>
                                    Rechazar
                                </button>
                            </div>
                        </div>
                    `).join('')}
                `;

                // Make functions available globally
                window.mostrarFormularioIngreso = mostrarFormularioIngreso;
                window.mostrarFormularioRechazo = mostrarFormularioRechazo;
                window.copiarResumenIngresos = copiarResumenIngresos;
            } else {
                listaRecibidos.innerHTML = '<p class="no-recibidos">No hay pedidos recibidos</p>';
            }
            listaRecibidos.style.display = 'block';
        } catch (error) {
            console.error('Error:', error);
            mostrarNotificacion('Error al cargar pedidos recibidos', 'error');
        } finally {
            ocultarCarga();
        }
    } else {
        listaRecibidos.style.display = 'none';
    }
}

function copiarResumenIngresos() {
    const resumenDiv = document.querySelector('.resumen-ingresos');
    const ingresos = JSON.parse(resumenDiv.getAttribute('data-ingresos') || '[]');
    
    if (ingresos.length === 0) {
        mostrarNotificacion('No hay ingresos para copiar', 'warning');
        return;
    }

    const mensaje = generarMensajeResumenIngresos(ingresos);
    
    navigator.clipboard.writeText(mensaje).then(() => {
        mostrarNotificacion('Resumen copiado al portapapeles', 'success');
    }).catch(err => {
        console.error('Error al copiar:', err);
        mostrarNotificacion('Error al copiar el resumen', 'error');
    });
}

function generarMensajeResumenIngresos(ingresos) {
    const listaIngresos = ingresos
        .map(i => `• ${i.producto}: ${i.peso}kg${i.observaciones ? ` (${i.observaciones})` : ''}`)
        .join('\n');

    return `SE INGRESÓ MATERIA PRIMA\n\nIngresado:\n${listaIngresos}\n\nLos productos ya se encuentran ingresados en la aplicación de Damabrava.`;
}

function actualizarResumenIngresos(producto, peso, observaciones) {
    try {
        const resumenDiv = document.querySelector('.resumen-ingresos');
        if (!resumenDiv) {
            console.error('No se encontró el elemento resumen-ingresos');
            return;
        }

        const ingresos = JSON.parse(resumenDiv.getAttribute('data-ingresos') || '[]');
        ingresos.push({ producto, peso, observaciones });
        resumenDiv.setAttribute('data-ingresos', JSON.stringify(ingresos));
        
        const mensaje = generarMensajeResumenIngresos(ingresos);
        resumenDiv.textContent = mensaje;

        // Buscar y ocultar la tarjeta del producto de manera más compatible
        const cards = document.querySelectorAll('.pedido-archivado-card');
        cards.forEach(card => {
            const nombreElement = card.querySelector('.pedido-nombre');
            if (nombreElement && nombreElement.textContent === producto) {
                card.style.display = 'none';
            }
        });
    } catch (error) {
        console.error('Error al actualizar resumen:', error);
    }
}
export async function togglePedidosArchivados() {
    const listaArchivados = document.querySelector('.lista-archivados');
    const listaRecibidos = document.querySelector('.lista-recibidos');
    const estaVisible = listaArchivados.style.display !== 'none';
    
    // Ocultar recibidos y actualizar su botón
    listaRecibidos.style.display = 'none';
    
    if (!estaVisible) {
        try {
            mostrarCarga();
            const response = await fetch('/obtener-pedidos-pendientes');
            const data = await response.json();

            if (data.success && data.pedidos.length > 0) {
                listaArchivados.innerHTML = `
                        <p class="section-title">Pedidos pendientes</p>
                        ${data.pedidos.map(pedido => `
                            <div class="pedido-archivado-card">
                                <div class="pedido-archivado-header">
                                    <span class="pedido-nombre">${pedido.nombre}</span>
                                    <span class="pedido-fecha"><i class="fas fa-calendar"></i> ${pedido.fecha}</span>
                                </div>
                                <div class="pedido-detalles">
                                    <span class="pedido-cantidad">
                                        <i class="fas fa-box"></i>
                                        ${pedido.cantidad}
                                    </span>
                                    ${pedido.observaciones ? `
                                    <span class="pedido-obs">
                                        <i class="fas fa-comment"></i>
                                        ${pedido.observaciones}
                                    </span>` : ''}
                                </div>
                            </div>
                        `).join('')}
                    `;
            } else {
                listaArchivados.innerHTML = '<p class="no-archivados">No hay pedidos pendientes</p>';
            }
            listaArchivados.style.display = 'block';
        } catch (error) {
            console.error('Error:', error);
            mostrarNotificacion('Error al cargar pedidos pendientes', 'error');
        } finally {
            ocultarCarga();
        }
    } else {
        listaArchivados.style.display = 'none';
    }
}

export async function mostrarFormularioIngreso(id,producto, hoja) {
    try {
        mostrarCarga();
        const response = await fetch(`/obtener-siguiente-lote/${encodeURIComponent(producto)}`);
        const response2 = await fetch(`/obtener-pedidos-recibidos/${encodeURIComponent(id)}`);
        const data = await response.json();
        const data2 = await response2.json();
        const siguienteLote = data.success ? data.siguienteLote : '?';
        
        const pedidoInfo = data2.pedidos && data2.pedidos.length > 0 ? data2.pedidos[0] : null;
        
        // Check if it's a multiple entry
        if (pedidoInfo?.obsCompras > 1) {
            const anuncio = document.querySelector('.anuncio');
            anuncio.style.display = 'flex';
            anuncio.innerHTML = `
                <div class="anuncio-contenido">
                    <h2><i class="fas fa-exclamation-circle"></i> Ingreso Múltiple</h2>
                    <p>Se detectó que hay ${pedidoInfo.obsCompras} unidades para ingresar.</p>
                    <p>¿Desea realizar un ingreso múltiple?</p>
                    <div class="anuncio-botones">
                        <button class="anuncio-btn gray" onclick="window.procesarIngresoNormal('${producto}', '${hoja}')">No</button>
                        <button class="anuncio-btn green" onclick="window.procesarIngresoMultiple('${producto}', '${hoja}')">Sí</button>
                        <button class="anuncio-btn close" onclick="document.querySelector('.anuncio').style.display='none'"><i class="fas fa-times"></i></button>
                    </div>
                </div>
            `;

            // Add the functions to window object
            window.procesarIngresoNormal = (producto, hoja) => {
                mostrarFormularioIngresoNormal(id, producto, hoja, pedidoInfo, siguienteLote);
            };

            window.procesarIngresoMultiple = (producto, hoja) => {
                mostrarIngresoMultiple(id, producto, hoja, pedidoInfo, siguienteLote);
            };

            window.inicializarPedidos = inicializarPedidos;
            window.procesarIngreso = procesarIngreso;

            return; // Stop here if it's multiple entry
        }

        // If not multiple entry, show normal form
        mostrarFormularioIngresoNormal(producto, hoja, pedidoInfo, siguienteLote);
        window.inicializarPedidos = inicializarPedidos;
        window.procesarIngreso = procesarIngreso;

    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error al cargar el formulario de ingreso', 'error');
    } finally {
        ocultarCarga();
    }
}

function mostrarFormularioIngresoNormal(id, producto, hoja, pedidoInfo, siguienteLote) {
    const anuncio = document.querySelector('.anuncio');
    anuncio.style.display = 'flex';
    anuncio.innerHTML = `
        <div class="anuncio-contenido">
            <h2><i class="fas fa-truck-loading"></i>Ingreso de Producto</h2>
            ${pedidoInfo?.obsCompras ? `<p>Cantidad recibido: ${pedidoInfo.obsCompras} ${pedidoInfo.medida} </p>` : ''}
            
            <div class="form-ingreso">
                <input type="text" id="producto-ingreso" value="${producto}" readonly>
                <div class="lote-info">Lote a asignar: ${siguienteLote}</div>
                <input type="number" id="peso-ingreso" placeholder="Peso en kg" step="0.01">
                <textarea id="observaciones-ingreso" placeholder="Observaciones" rows="3"></textarea>
            </div>
            <div class="anuncio-botones">
                <button class="anuncio-btn close" onclick="document.querySelector('.anuncio').style.display='none'"><i class="fas fa-times"></i></button>
                <button class="anuncio-btn green" onclick="procesarIngreso('${id}','${producto}', '${hoja}')"><i class="fas fa-arrow-right"></i>  Ingresar</button>
            </div>
        </div>
    `;
}


export async function mostrarIngresoMultiple(id, producto, hoja, pedidoInfo, siguienteLote) {
    const anuncio = document.querySelector('.anuncio');
    anuncio.style.display = 'flex';
    anuncio.innerHTML = `
        <div class="anuncio-contenido">
            <h2><i class="fas fa-truck-loading"></i>Ingreso de Producto</h2>

            ${pedidoInfo?.obsCompras ? `<p>Cantidad: (${pedidoInfo.obsCompras} restantes)</p>` : ''}
            
            <div class="form-ingreso">
                <input type="text" id="producto-ingreso" value="${producto}" readonly>
                <div class="lote-info">Lote a asignar: ${siguienteLote}</div>
                <input type="number" id="peso-ingreso" placeholder="Peso en kg" step="0.01">
                <textarea id="observaciones-ingreso" placeholder="Observaciones" rows="3"></textarea>
            </div>
            <div class="anuncio-botones">
                <button class="anuncio-btn close" onclick="document.querySelector('.anuncio').style.display='none'"><i class="fas fa-times"></i></button>
                <button class="anuncio-btn green" onclick="window.procesarIngresoMultiple('${id}','${producto}', '${hoja}')"><i class="fas fa-arrow-right"></i>  Ingresar</button>
            </div>
        </div>
    `;

    window.procesarIngresoMultiple = async (id, producto, hoja) => {
    try {
        mostrarCarga();
        console.log('Iniciando ingreso múltiple para:', id);
        await procesarIngreso(id, producto, hoja, true);

        // Actualizar obsCompras
        console.log('Actualizando cantidad restante para:', producto);
        const response = await fetch(`/actualizar-pedido-recibido/${encodeURIComponent(id)}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();
        console.log('Respuesta del servidor:', data);

        // Hide the product card
        const cards = document.querySelectorAll('.pedido-archivado-card');
        cards.forEach(card => {
            const nombreElement = card.querySelector('.pedido-nombre');
            if (nombreElement && nombreElement.textContent.includes(producto)) {
                card.style.display = 'none';
            }
        });

        if (data.success) {
            if (data.nuevaCantidad > 0) {
                console.log('Quedan ingresos pendientes:', data.nuevaCantidad);
                // Mostrar siguiente formulario de ingreso
                const responseNext = await fetch(`/obtener-siguiente-lote/${encodeURIComponent(producto)}`);
                const dataNext = await responseNext.json();
                const siguienteLote = dataNext.success ? dataNext.siguienteLote : '?';
                
                await mostrarIngresoMultiple(id, producto, hoja, { ...pedidoInfo, obsCompras: data.nuevaCantidad }, siguienteLote);
            } else {
                console.log('Todos los ingresos completados');
                mostrarNotificacion('Todos los ingresos completados', 'success');
                document.querySelector('.anuncio').style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Error en procesarIngresoMultiple:', error);
        mostrarNotificacion('Error al procesar el ingreso múltiple', 'error');
    } finally {
        ocultarCarga();
    }
};
}

export async function procesarIngreso(id, producto, hoja, esMultiple = false) {
    try {
        mostrarCarga();
        const pesoInput = document.getElementById('peso-ingreso');
        const observacionesInput = document.getElementById('observaciones-ingreso');
        const peso = parseFloat(pesoInput.value);
        const observaciones = observacionesInput.value.trim();

        if (isNaN(peso) || peso <= 0) {
            mostrarNotificacion('Por favor ingrese un peso válido', 'error');
            return;
        }

        console.log('Enviando ingreso:', { producto, peso, hoja, esMultiple });
        const response = await fetch('/procesar-ingreso', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                id,
                producto, 
                peso, 
                hoja, 
                observaciones,
                esMultiple
            })
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Error en la respuesta del servidor');
        }

        if (data.success) {
            actualizarResumenIngresos(producto, peso, observaciones);
            mostrarNotificacion('Ingreso procesado correctamente', 'success');
            
            if (!esMultiple) {
                cerrarFormularioPedido();
            }
        } else {
            throw new Error(data.error || 'Error al procesar el ingreso');
        }
    } catch (error) {
        console.error('Error en procesarIngreso:', error);
        mostrarNotificacion(error.message || 'Error al procesar el ingreso', 'error');
        throw error; // Re-throw para que pueda ser manejado por el llamador
    } finally {
        ocultarCarga();
    }
}
export function mostrarFormularioRechazo(id, producto, hoja) {
    const anuncio = document.querySelector('.anuncio');
    anuncio.innerHTML = `
        <div class="anuncio-contenido">
            
            <h2><i class="fas fa-times-circle"></i>Rechazar Pedido</h2>
            <div class="form-rechazo">
                <p>Producto: ${producto}</p>
                <textarea id="razon-rechazo" placeholder="Razón del rechazo" required></textarea>
            </div>
            <div class="anuncio-botones">
                <button class="anuncio-btn close" onclick="document.querySelector('.anuncio').style.display='none'"><i class="fas fa-times"></i></button>
                <button class="anuncio-btn green" onclick="confirmarRechazo('${id}','${producto}', '${hoja}')"><i class="fas fa-check"></i> Confirmar</button>
            </div>
        </div>
    `;
    anuncio.style.display = 'flex';
}
export async function confirmarRechazo(id, producto, hoja) {
    try {
        const razonTextarea = document.getElementById('razon-rechazo');
        const razon = razonTextarea.value.trim();

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
            body: JSON.stringify({ id, producto, hoja, razon })
        });

        const data = await response.json();
        
        if (response.ok && data.success) {
            mostrarNotificacion('Pedido rechazado correctamente', 'success');
            cerrarFormularioPedido();
            await togglePedidosRecibidos();
        } else {
            throw new Error(data.error || 'Error al rechazar el pedido');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion(error.message, 'error');
    } finally {
        ocultarCarga();
    }
}
export async function finalizarPedidos() {
    try {
        if (pedidosTemporales.length === 0) {
            mostrarNotificacion('No hay pedidos para finalizar', 'warning');
            return;
        }

        // Show confirmation modal
        const anuncio = document.querySelector('.anuncio');
        anuncio.style.display = 'flex';
        anuncio.innerHTML = `
            <div class="anuncio-contenido">
                
                <h2><i class="fas fa-clipboard-check"></i>Finalizar Pedidos</h2>
                <p>¿Desea finalizar y archivar todos los pedidos actuales?</p>
                <div class="pedidos-resumen">
                    <h3>Resumen de Pedidos:</h3>
                    ${pedidosTemporales.map(pedido => `
                        <div class="form-grup">
                            <span>${pedido.nombre}</span>
                            <span>${pedido.cantidad}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="anuncio-botones">
                    <button class="anuncio-btn close" onclick="document.querySelector('.anuncio').style.display='none'"><i class="fas fa-times"></i></button>
                    <button class="anuncio-btn green" onclick="confirmarFinalizacionPedidos()"><i class="fas fa-check-double"></i>  Finalizar</button>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error al cargar los pedidos', 'error');
    }
}
export async function confirmarFinalizacionPedidos() {
    // Create text for clipboard
    const pedidosText = `*PEDIDO DE MATERIA PRIMA*\n\n*Pedido:*\n${pedidosTemporales.map(pedido => 
        `• ${pedido.nombre}: ${pedido.cantidad}${pedido.observaciones ? ` (${pedido.observaciones})` : ''}`
    ).join('\n')}\n\n_El pedido ya se encuentra en la aplicación de Damabrava_`;

    // Copy to clipboard
    await navigator.clipboard.writeText(pedidosText);
    mostrarNotificacion('Pedidos copiados al portapapeles', 'success');
    
    try {
        mostrarCarga();
        
        // Obtener el usuario actual
        const userResponse = await fetch('/obtener-mi-rol');
        const userData = await userResponse.json();
        const usuarioActual = userData.nombre;

        const response = await fetch('/finalizar-pedidos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ pedidos: pedidosTemporales })
        });

        const data = await response.json();
        if (data.success) {
            // Enviar notificación
            try {
                await registrarNotificacion(
                    usuarioActual,           // origen (usuario actual)
                    'Administración',        // destino
                    'Se realizo un pedido de materia prima'
                );
            } catch (notifError) {
                console.error('Error al enviar notificación:', notifError);
            }

            pedidosTemporales = []; // Clear the temporary pedidos
            mostrarNotificacion('Pedidos finalizados correctamente', 'success');
            cerrarFormularioPedido();
            await cargarPedidos();
        } else {
            mostrarNotificacion(data.error || 'Error al finalizar los pedidos', 'error');
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
            <h2><i class="fas fa-shopping-basket fa-2x"></i>Nuevo Pedido</h2>
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
                <button class="anuncio-btn close cancelar" onclick="document.querySelector('.anuncio').style.display='none'"><i class="fas fa-times"></i></button>
                <button class="anuncio-btn green confirmar"><i class="fas fa-plus"></i>Añadir</button>
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

        anuncio.querySelector('.confirmar').onclick = guardarPedido;
        anuncio.style.display = 'flex';

    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error al cargar el formulario de pedido', 'error');
    } finally {
        ocultarCarga();
    }
}
export async function verificarPedidoExistente(nombre) {
    try {
        const response = await fetch(`/buscar-producto-pendiente/${encodeURIComponent(nombre)}`);
        const data = await response.json();
        
        if (data.success && data.productos.length > 0) {
            const producto = data.productos[0];
            // Create pedido object in the format expected by mostrarSugerenciaPedido
            const pedidoExistente = [
                producto.fecha,
                producto.nombre,
                producto.cantidad,
                producto.observaciones
            ];
            
            // Remove any existing suggestion before showing new one
            const existingSuggestion = document.querySelector('.sugerencia-pedido-existente');
            if (existingSuggestion) {
                existingSuggestion.remove();
            }
            
            // Show suggestion for the existing pedido
            mostrarSugerenciaPedido('Pedidos', pedidoExistente);
        }
    } catch (error) {
        console.error('Error al verificar pedido existente:', error);
        mostrarNotificacion('Error al verificar pedido existente', 'error');
    }
}
function mostrarSugerenciaPedido(hoja, pedido) {
    const sugerenciaDiv = document.createElement('div');
    sugerenciaDiv.className = 'sugerencia-pedido-existente';
    
    sugerenciaDiv.innerHTML = `
        <div class="sugerencia-contenido">
            <p>Ya existe un pedido pendiente para "${pedido[1]}"</p>
            <p>Cantidad: ${pedido[2]}</p>
            <p>Fecha: ${pedido[0]}</p>
            ${pedido[3] ? `<p>Observaciones: ${pedido[3]}</p>` : ''}
            <div class="sugerencia-botones">
                <button class="btn-usar-existente anuncio-btn enviar">Usar pedido existente</button>
                <button class="btn-crear-nuevo anuncio-btn cancelar">Crear nuevo pedido</button>
            </div>
        </div>
    `;
    const formPedido = document.querySelector('.form-pedido');
    formPedido.appendChild(sugerenciaDiv);

    // Manejar la decisión del usuario
    sugerenciaDiv.querySelector('.btn-usar-existente').onclick = async () => {
        try {
            mostrarCarga();
            // Eliminar el pedido existente de la hoja Pedidos
            const response = await fetch('/eliminar-pedido', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    fecha: pedido[0],
                    nombre: pedido[1]
                })
            });

            const result = await response.json();
            if (result.success) {
                // Establecer valores en el formulario
                document.getElementById('cantidad-pedido').value = pedido[2].split(' ')[0];
                document.getElementById('obs-pedido').value = pedido[3] || '';
                
                const selectUnidad = document.getElementById('unidad-medida');
                const unidad = pedido[2].split(' ')[1];
                const opcionUnidad = Array.from(selectUnidad.options)
                    .find(option => option.value === unidad || option.text === unidad);
                if (opcionUnidad) {
                    selectUnidad.value = opcionUnidad.value;
                }
                
                mostrarNotificacion('Pedido existente actualizado correctamente', 'success');
            } else {
                mostrarNotificacion('Error al actualizar pedido existente', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            mostrarNotificacion('Error al procesar el pedido existente', 'error');
        }
        finally{
            ocultarCarga();
        }
        sugerenciaDiv.remove();
    };

    sugerenciaDiv.querySelector('.btn-crear-nuevo').onclick = () => {
        sugerenciaDiv.remove();
    };
}


export async function guardarPedido() {
    try {
        const nombre = document.getElementById('nombre-pedido').value.trim();
        const cantidad = document.getElementById('cantidad-pedido').value;
        const unidad = document.getElementById('unidad-medida').value;
        const observaciones = document.getElementById('obs-pedido').value.trim();

        if (!nombre || !cantidad) {
            mostrarNotificacion('Por favor complete todos los campos requeridos', 'warning');
            return;
        }

        const fecha = new Date().toLocaleDateString('es-ES');
        const nuevoPedido = {
            fecha,
            nombre,
            cantidad: `${cantidad} ${unidad}`,
            observaciones
        };

        pedidosTemporales.push(nuevoPedido);
        document.querySelector('.anuncio').style.display = 'none';
        await cargarPedidos(); // This will now show temporary pedidos
        mostrarNotificacion('Pedido agregado correctamente', 'success');
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error al agregar el pedido', 'error');
    }
}

export function eliminarPedido(nombre) {
    document.querySelector('.anuncio').style.display= 'none';
    pedidosTemporales = pedidosTemporales.filter(p => p.nombre !== nombre);
    cargarPedidos();
    mostrarNotificacion('Pedido eliminado correctamente', 'success');
}
export function mostrarConfirmacionEliminar(nombre) {
    const anuncio = document.querySelector('.anuncio');
    anuncio.innerHTML = `
        <div class="anuncio-contenido">
            <h2><i class="fas fa-exclamation-triangle"></i>¿Eliminar pedido?</h2>
            <p>¿Está seguro de eliminar el pedido "${nombre}"?</p>
            <div class="anuncio-botones">
                <button class="anuncio-btn close cancelar"><i class="fas fa-times"></i></button>
                <button class="anuncio-btn red confirmar"><i class="fas fa-trash-alt"></i>  Eliminar</button>
            </div>
        </div>
    `;

    // Actualizar los event listeners
    anuncio.querySelector('.cancelar').addEventListener('click', () => {
        anuncio.style.display = 'none';
    });
    
    anuncio.querySelector('.confirmar').addEventListener('click', () => {
        eliminarPedido(nombre);
    });
    
    anuncio.style.display = 'flex';
}

export async function cargarPedidos() {
    try {
        const container = document.querySelector('.lista-pedidos');
        
        if (pedidosTemporales.length === 0) {
            container.innerHTML = '<p class="no-pedidos">No hay pedidos pendientes</p>';
            return;
        }

        container.innerHTML = `
            <div class="pedidos-lista">
                ${pedidosTemporales.map(pedido => `
                    <div class="pedido-card">
                        <div class="pedido-info">
                            <h4>${pedido.nombre}</h4>
                            <div class="cantidad">
                                <i class="fas fa-box"></i>
                                <span>${pedido.cantidad}</span>
                            </div>
                            ${pedido.observaciones ? `
                            <div class="observaciones">
                                <i class="fas fa-comment"></i>
                                <span>${pedido.observaciones}</span>
                            </div>
                            ` : ''}
                        </div>
                        <div class="pedido-meta">
                            <span>
                                <i class="fas fa-calendar"></i>
                                ${pedido.fecha}
                            </span>
                            <button class="btn-eliminar" onclick="window.eliminarPedidoTemp('${pedido.nombre}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        // Hacer la función disponible globalmente
        window.eliminarPedidoTemp = (nombre) => {
            mostrarConfirmacionEliminar(nombre);
        };
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error al cargar los pedidos', 'error');
    }
    document.querySelector('.lista-recibidos').style.display = 'none';
    document.querySelector('.lista-archivados').style.display = 'none';
}