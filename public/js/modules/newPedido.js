import { registrarNotificacion } from './advertencia.js';

let pedidosTemporales = [];
function cerrarFormularioPedido() {
    const anuncio = document.querySelector('.anuncio');
    if (anuncio) {
        anuncio.style.display = 'none';
    } else {
        console.error('No se encontró el elemento .anuncio');
    }
}

export async function mostrarFormularioPedido(producto) {
    if (producto === undefined || producto === 'undefined' || producto === null) {
        producto = '';
    }
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
            <div class="relleno">
                <div class="form-grup">
                    <p>Seleccionar producto:</p>
                    <input type="text" id="nombre-pedido" value="${producto}" placeholder="Nombre del producto" autocomplete="off" required>
                    <div id="sugerencias-pedido" class="sugerencias-container" style="display:none;"></div>
                </div>
                
                <div class="form-grup">
                    <p>Seleccione la unidad de medida:</p>
                    <div class="campo-form">
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
                </div>

                <div class="form-grup">
                    <p>Observaciones:</p>
                    <div class="campo-form">
                        <textarea id="obs-pedido" placeholder="Observaciones"></textarea>
                    </div>
                </div>

                <div class="anuncio-botones" style="margin-bottom: 20px;">
                    <button class="anuncio-btn blue agregar-pedido">
                        <i class="fas fa-plus"></i> Agregar a la lista
                    </button>
                </div>

                <div class="lista-pedidos-temporal" style="display: none;">
                    <h2>Pedidos en lista:</h2>
                    <div class="pedidos-agregados detalles-grup" style="background:none;"></div>
                </div>
            </div>
            <div class="anuncio-botones">
                <button class="anuncio-btn close" onclick="document.querySelector('.anuncio').style.display='none'">
                    <i class="fas fa-times"></i>
                </button>
                <button class="anuncio-btn green finalizar-pedidos" style="display: none;">
                    <i class="fas fa-check"></i> Finalizar Pedidos
                </button>
            </div>
        `;

        // Mostrar el anuncio
        anuncio.style.display = 'flex';

        // Configurar evento para agregar pedido
        const btnAgregar = anuncio.querySelector('.agregar-pedido');
        const btnFinalizar = anuncio.querySelector('.finalizar-pedidos');
        const listaPedidos = anuncio.querySelector('.lista-pedidos-temporal');
        const pedidosAgregados = anuncio.querySelector('.pedidos-agregados');

        btnAgregar.addEventListener('click', () => {
            const nombre = document.getElementById('nombre-pedido').value.trim();
            const cantidad = document.getElementById('cantidad-pedido').value;
            const unidad = document.getElementById('unidad-medida').value;
            const observaciones = document.getElementById('obs-pedido').value.trim();

            if (!nombre || !cantidad) {
                mostrarNotificacion('Por favor complete los campos requeridos', 'warning');
                return;
            }

            const pedido = {
                fecha: new Date().toLocaleDateString('es-ES'),
                nombre,
                cantidad: `${cantidad} ${unidad}`,
                observaciones
            };

            pedidosTemporales.push(pedido);
            actualizarListaPedidos(pedidosAgregados);

            // Limpiar campos
            document.getElementById('nombre-pedido').value = '';
            document.getElementById('cantidad-pedido').value = '';
            document.getElementById('obs-pedido').value = '';

            // Mostrar lista y botón finalizar
            listaPedidos.style.display = 'block';
            btnFinalizar.style.display = 'block';
        });

        btnFinalizar.addEventListener('click', async () => {
            if (pedidosTemporales.length === 0) {
                mostrarNotificacion('No hay pedidos para finalizar', 'warning');
                return;
            }
            await finalizarPedidos();
        });

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

        inputPedido.addEventListener('input', async () => {
            const inputValue = normalizeText(inputPedido.value);
            const div = document.querySelector('.sugerencias-container');

            // Añadir o actualizar el contenedor del ícono
            let statusIcon = document.querySelector('.producto-status-icon');
            if (!statusIcon) {
                statusIcon = document.createElement('div');
                statusIcon.className = 'producto-status-icon';
                inputPedido.parentElement.appendChild(statusIcon);
            }

            if (inputValue) {
                try {
                    const response = await fetch(`/buscar-producto-pendiente/${encodeURIComponent(inputValue)}`);
                    const data = await response.json();

                    if (data.success) {
                        const productoExiste = data.productos.length > 0;
                        statusIcon.innerHTML = productoExiste
                            ? '<i class="fas fa-times" style="color: #ff4444;"></i>'
                            : '<i class="fas fa-check" style="color: #00C851;"></i>';
                        statusIcon.style.display = 'block';
                    }
                } catch (error) {
                    console.error('Error:', error);
                }
            } else {
                statusIcon.style.display = 'none';
            }

            // Código existente de sugerencias
            const sugerencias = pedidos.filter(pedido =>
                normalizeText(pedido).includes(inputValue)
            );

            if (inputValue && sugerencias.length > 0) {
                sugerenciasList.innerHTML = sugerencias
                    .map(pedido => `<div class="sugerencias-list"><li class="sugerencia-item">${pedido}</li></div>`)
                    .join('');
                sugerenciasList.style.display = 'block';
                div.style.display = 'block';
            } else {
                sugerenciasList.style.display = 'none';
                div.style.display = 'none';
            }
        });



        // Manejar clic en sugerencia
        sugerenciasList.addEventListener('click', (e) => {
            if (e.target.classList.contains('sugerencia-item')) {
                inputPedido.value = e.target.textContent;
                const div = document.querySelector('.sugerencias-container');
                div.style.display = 'none';
                verificarPedidoExistente(e.target.textContent);
            }
        });

        // Modificar el evento de clic fuera
        document.addEventListener('click', (e) => {
            const div = document.querySelector('.sugerencias-container');
            if (!e.target.closest('#nombre-pedido') && !e.target.closest('#sugerencias-pedido')) {
                div.style.display = 'none';
            }
        });

        anuncio.querySelector('.confirmar').onclick = guardarPedido;
        anuncio.style.display = 'flex';

    } catch (error) {
        console.error('Error:', error);
        // Removemos esta notificación ya que no es necesaria si el formulario se muestra
        if (!document.querySelector('.anuncio-contenido')) {
            mostrarNotificacion('Error al cargar lista de productos', 'error');
        }
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

            // Remove any existing suggestion
            const existingSuggestion = document.querySelector('.sugerencia-pedido-existente');
            if (existingSuggestion) {
                existingSuggestion.remove();
            }

            const sugerenciaDiv = document.createElement('div');
            sugerenciaDiv.className = 'form-grup';

            sugerenciaDiv.innerHTML = `
                <div class="form-grup">
                    <p>Ya existe un pedido pendiente para "${producto.nombre}"</p>
                    <p>Cantidad: ${producto.cantidad}</p>
                    <p>Fecha: ${producto.fecha}</p>
                    ${producto.observaciones ? `<p>Observaciones: ${producto.observaciones}</p>` : ''}
                    <div class="anuncio-botones">
                        <button class="btn-usar-existente anuncio-btn green enviar">Usar pedido existente</button>
                        <button class="btn-crear-nuevo anuncio-btn blue cancelar">Crear nuevo pedido</button>
                    </div>
                </div>
            `;

            const formGrup = document.getElementById('nombre-pedido').closest('.form-grup');
            formGrup.appendChild(sugerenciaDiv);

            // En la función verificarPedidoExistente, modifica el onclick del botón:
            sugerenciaDiv.querySelector('.btn-usar-existente').onclick = async () => {
                try {
                    mostrarCarga();

                    // Establecer valores en el formulario primero
                    const [cantidad] = producto.cantidad.split(' ');
                    document.getElementById('cantidad-pedido').value = cantidad;
                    document.getElementById('obs-pedido').value = producto.observaciones || '';

                    const selectUnidad = document.getElementById('unidad-medida');
                    const unidad = producto.cantidad.split(' ')[1];
                    if (unidad) {
                        const opcionUnidad = Array.from(selectUnidad.options)
                            .find(option => option.value.toLowerCase().includes(unidad.toLowerCase()) ||
                                option.text.toLowerCase().includes(unidad.toLowerCase()));
                        if (opcionUnidad) {
                            selectUnidad.value = opcionUnidad.value;
                        }
                    }

                    // Eliminar el pedido existente
                    const deleteResponse = await fetch('/eliminar-pedido-compras', {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            nombre: producto.nombre,
                            fecha: producto.fecha
                        })
                    });

                    const result = await deleteResponse.json();
                    if (result.success) {
                        mostrarNotificacion('Pedido existente actualizado correctamente', 'success');
                        sugerenciaDiv.remove();
                    } else {
                        throw new Error(result.error || 'Error al actualizar pedido existente');
                    }
                } catch (error) {
                    console.error('Error:', error);
                    mostrarNotificacion('Error al procesar el pedido existente', 'error');
                } finally {
                    ocultarCarga();
                }
            };

            sugerenciaDiv.querySelector('.btn-crear-nuevo').onclick = () => {
                sugerenciaDiv.remove();
            };
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error al verificar pedido existente', 'error');
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
                <div class="detalles-grup center">
                    <p>¿Desea finalizar y archivar todos los pedidos actuales?</p>
                </div>
                <div class="pedidos-resumen">
                    <h2>Resumen de Pedidos:</h2>
                    ${pedidosTemporales.map(pedido => `
                        <div class="form-grup">
                            <span>${pedido.nombre}</span>
                            <span>${pedido.cantidad}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="anuncio-botones">
                    <button class="anuncio-btn close" onclick="document.querySelector('.anuncio').style.display='none'">
                        <i class="fas fa-times"></i>
                    </button>
                    <button class="anuncio-btn green" onclick="confirmarFinalizacionPedidos()">
                        <i class="fas fa-check-double"></i> Finalizar
                    </button>
                </div>
            </div>
        `;
    } catch (error) {
        console.error('Error:', error);
        // Removemos esta notificación ya que no es un error real al mostrar el modal
    }
}
export async function confirmarFinalizacionPedidos() {
    try {
        mostrarCarga();

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

        if (!response.ok) {
            throw new Error('Error en la respuesta del servidor');
        }

        if (data.success) {
            const pedidosText = `*PEDIDO DE MATERIA PRIMA*\n\n*Pedido:*\n${pedidosTemporales.map(pedido =>
                `• ${pedido.nombre}: ${pedido.cantidad}${pedido.observaciones ? ` (${pedido.observaciones})` : ''}`
            ).join('\n')}\n\n_El pedido ya se encuentra en la aplicación de Damabrava_`;

            try {
                await navigator.clipboard.writeText(pedidosText);
            } catch (clipboardError) {
                console.log('No se pudo copiar al portapapeles:', clipboardError);
                // Continuamos con el flujo normal aunque falle la copia
            }

            await registrarNotificacion(
                usuarioActual,
                'Administración',
                'Se realizo un pedido de materia prima'
            );

            pedidosTemporales = [];
            mostrarNotificacion('Pedidos finalizados correctamente', 'success');
            cerrarFormularioPedido();
            return true;
        } else {
            throw new Error(data.error || 'Error al finalizar los pedidos');
        }
    } catch (error) {
        console.error('Error en confirmarFinalizacionPedidos:', error);
        mostrarNotificacion(error.message || 'Error al finalizar los pedidos', 'error');
        return false;
    } finally {
        ocultarCarga();
    }
}
function actualizarListaPedidos(contenedor) {
    contenedor.innerHTML = pedidosTemporales.map(pedido => `
        <div class="detalles-grup">
            <div class="detalle-item">
                <p class="pedido-nombre">${pedido.nombre}</p>
                <span class="pedido-cantidad">${pedido.cantidad}</span>
            </div>
            <div class="detalle-item">
                 ${pedido.observaciones ? `<p class="pedido-obs">Observaciones: ${pedido.observaciones} </p>` : '<p>Observaciones: Ninguna</p>'}
                <i class="fas fa-trash delete" onclick="eliminarPedidoTemporal('${pedido.nombre}')"></i>
            </div>
        </div>
    `).join('');


    window.eliminarPedidoTemporal = (nombre) => {
        pedidosTemporales = pedidosTemporales.filter(p => p.nombre !== nombre);
        actualizarListaPedidos(contenedor);
        if (pedidosTemporales.length === 0) {
            document.querySelector('.lista-pedidos-temporal').style.display = 'none';
            document.querySelector('.finalizar-pedidos').style.display = 'none';
        }
    };
}


export function mostrarSugerenciaPedido(hoja, pedido) {
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
        finally {
            ocultarCarga();
        }
        sugerenciaDiv.remove();
    };

    sugerenciaDiv.querySelector('.btn-crear-nuevo').onclick = () => {
        sugerenciaDiv.remove();
    };
}











