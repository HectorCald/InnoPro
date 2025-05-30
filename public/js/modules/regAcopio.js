/* =============== FUNCIONES DE INICIO REGISTROS ACOPIO =============== */
import { mostrarFormularioIngresoAcopio } from './almAcopio.js';
import { mostrarAnuncioDown, ocultarAnuncioDown } from './components.js';
import { entregarPedido } from './compras.js';

let filtrosActivos = {
    nombre: '',
    fechaDesde: '',
    fechaHasta: '',
    estado: 'todos' // 'todos', 'pendiente', 'recibido', 'en_proceso'
};
/* =============== FUNCIONES DE REGSITROS PEDIDOS=============== */
export async function cargarRegistrosAcopio() {
    try {
        mostrarCarga();
        const rolResponse = await fetch('/obtener-mi-rol');
        const userData = await rolResponse.json();
        const esAdmin = userData.rol === 'Administración';

        // Obtener tanto pedidos como movimientos
        const [responsePedidos, responseMovimientos] = await Promise.all([
            fetch('/obtener-registros-pedidos'),
            fetch('/obtener-movimientos-acopio')
        ]);

        const dataPedidos = await responsePedidos.json();
        const dataMovimientos = await responseMovimientos.json();

        if (dataPedidos.success && dataMovimientos.success) {
            const container = document.querySelector('.regAcopio-view');

            // ... código existente ...

            container.innerHTML = `
            <div class="filtros-header">
                <h2 class="section-title">
                    <i class="fas fa-clipboard-list"></i> Registros Acopio
                </h2>
                <button class="btn-filtro-acopio">
                    <i class="fas fa-filter"></i> Filtros
                </button>
            </div>
            <div class="filter-options-acopio">
                <button class="filter-btn-acopio active" data-estado="todos">
                    <i class="fas fa-list"></i> <p>Todos</p>
                </button>
                <button class="filter-btn-acopio" data-estado="Pendiente">
                    <i class="fas fa-clock"></i> <p>Pendiente</p>
                </button>
                <button class="filter-btn-acopio" data-estado="Recibido">
                    <i class="fas fa-check"></i> <p>Recibido</p>
                </button>
                <button class="filter-btn-acopio" data-estado="En proceso">
                    <i class="fas fa-spinner"></i> <p>En proceso</p>
                </button>
                <button class="filter-btn-acopio" data-estado="Rechazado">
                    <i class="fas fa-times"></i> <p>Rechazado</p>
                </button>
            </div>
    <div class="pedidos-container">
        <div class="fecha-card">
            <div class="fecha-header">
                <div class="fecha-info">
                    <h3>Registro de Pedidos</h3>
                    <span class="contador">${dataPedidos.pedidos.length} pedidos</span>
                </div>
                <i class="fas fa-chevron-down"></i>
            </div>
            <div class="registros-grupo registros-pedidos"></div>
        </div>
        
        <div class="fecha-card">
            <div class="fecha-header">
                <div class="fecha-info">
                    <h3>Registro de Movimientos</h3>
                    <span class="contador">${dataMovimientos.movimientos.length} movimientos</span>
                </div>
                <i class="fas fa-chevron-down"></i>
            </div>
            <div class="registros-grupo registros-movimientos"></div>
        </div>
    </div>`;
            configurarFiltrosBotones();
            // Cargar pedidos
            const registrosPedidosContainer = container.querySelector('.registros-pedidos');
            const registrosOrdenados = ordenarRegistrosPorFecha(dataPedidos.pedidos);
            for (const pedido of registrosOrdenados) {
                const pedidoCard = crearPedidoCard(pedido, esAdmin);
                registrosPedidosContainer.appendChild(pedidoCard);
            }

            // Cargar movimientos
            const movimientosContainer = container.querySelector('.registros-movimientos');
            const movimientosOrdenados = ordenarRegistrosPorFecha(dataMovimientos.movimientos);
            for (const movimiento of movimientosOrdenados) {
                const movimientoCard = crearMovimientoCard(movimiento, esAdmin);
                movimientosContainer.appendChild(movimientoCard);
            }

            // Configurar eventos para ambos headers
            document.querySelectorAll('.fecha-header').forEach(header => {
                header.addEventListener('click', () => {
                    const grupo = header.nextElementSibling;
                    grupo.classList.toggle('active');
                    const icono = header.querySelector('.fa-chevron-down');
                    icono.style.transform = grupo.classList.contains('active') ? 'rotate(180deg)' : 'rotate(0)';
                });
            });
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error al cargar los registros', 'error');
    } finally {
        ocultarCarga();
    }
    configurarFiltros2();


}
function crearPedidoCard(pedido, isAdmin) {
    const [dia, mes, año] = pedido[1].split('/');
    const registroCard = document.createElement('div');
    registroCard.className = 'registro-card-acopio';
    registroCard.dataset.id = pedido[0];
    registroCard.dataset.fecha = pedido[1];

    const estado = pedido[8] || 'Pendiente';
    const estadoClass = estado.toLowerCase().replace(' ', '-');

    const botonesAdmin = isAdmin ? `
    <div class="acciones">
        <button class="btn-eliminar-registro anuncio-btn red">
            Eliminar
        </button>
        <button class="btn-editar-registro anuncio-btn blue">
            Editar
        </button>
        ${estado.toLowerCase() === 'pendiente' ? `
            <button class="btn-entregar-pedido anuncio-btn green">
            Entregar
            </button>
        ` : ''}
    </div>
` : (estado.toLowerCase() === 'recibido' ? `
    <div class="acciones">
        <button class="btn-cambiar-estado anuncio-btn blue">
           Ingresado
        </button>
        <button class="btn-ingresar-acopio anuncio-btn green">
            Ingresar
        </button>
        <button class="btn-rechazar anuncio-btn red" data-id="${pedido[0]}" data-nombre="${pedido[2]}">
            Rechazar
        </button>
    </div>
` : estado.toLowerCase() === 'pendiente' ? `
    <div class="acciones">
        <button class="btn-eliminar-registro anuncio-btn red">
            <i class="fas fa-trash"></i> Eliminar
        </button>
    </div>
` : estado.toLowerCase() === 'ingresado' ? `
    <div class="acciones">
        <button class="btn-cambiar-estado anuncio-btn blue">
            <i class="fas fa-exchange-alt"></i> No ingresado
        </button>
    </div>
` : '');

    registroCard.innerHTML = `
        <div class="registro-header">
            <div class="registro-fecha">${dia}/${mes}</div>
            <div class="registro-producto-acopio">${pedido[2] || 'Sin nombre'}</div>
            <div class="registro-estado-acopio estado-${estadoClass}">${estado}</div>
        </div>
        <div class="registro-detalles">
            <p><span>Cantidad Pedida:</span> ${pedido[3] || '-'}</p>
            <p><span>Cantidad Entregado:</span> ${pedido[12] || '-'}</p>
            <p><span>Observaciones:</span> ${pedido[4] || '-'}</p>
            ${isAdmin ? `<p><span>Cantidad comprada:</span> ${pedido[5] || '-'}Bls.</p>` : ''}
            <p><span>Proveedor:</span> ${pedido[6] || '-'}</p>
            ${isAdmin ? `<p><span>Costo:</span> ${pedido[7] || '-'}</p>` : ''}
            <p><span>Detalles:</span> ${pedido[9] || '-'}</p>
            <p><span>Sin ingresar:</span> ${pedido[10]} ${pedido[11] || '-'}</p>
            ${botonesAdmin}
        </div>
    `;

    configurarEventosRegistro(registroCard, isAdmin, pedido);
    return registroCard;
}
function configurarEventosRegistro(registroCard, isAdmin, pedido) {
    const header = registroCard.querySelector('.registro-header');

    header.addEventListener('click', (e) => {
        const detalles = registroCard.querySelector('.registro-detalles');

        // Cerrar otros registros abiertos
        document.querySelectorAll('.registro-detalles.active').forEach(otherDetalles => {
            if (otherDetalles !== detalles) {
                otherDetalles.classList.remove('active');
            }
        });

        detalles.classList.toggle('active');

        if (detalles.classList.contains('active')) {
            setTimeout(() => {
                registroCard.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            }, 100);
        }
    });
    const btnEliminar = registroCard.querySelector('.btn-eliminar-registro');
    if (btnEliminar) {
        btnEliminar.addEventListener('click', async (e) => {
            e.stopPropagation();
            mostrarConfirmacionEliminar(pedido, registroCard);
        });
    }

    if (isAdmin) {

        const btnEditar = registroCard.querySelector('.btn-editar-registro');
        btnEditar.addEventListener('click', (e) => {
            e.stopPropagation(); // Evitar que se active el evento del header
            mostrarFormularioEdicion(pedido);
        });

        const btnEliminar = registroCard.querySelector('.btn-eliminar-registro');
        btnEliminar.addEventListener('click', async (e) => {
            e.stopPropagation();
            mostrarConfirmacionEliminar(pedido, registroCard);
        });

        const btnEntregar = registroCard.querySelector('.btn-entregar-pedido');
        if (btnEntregar) {
            btnEntregar.addEventListener('click', (e) => {
                e.stopPropagation();
                // Crear el elemento con la estructura completa necesaria
                const pedidoCard = document.createElement('div');
                pedidoCard.className = 'pedido-card';
                pedidoCard.dataset.id = pedido[0];
                pedidoCard.dataset.nombre = pedido[2];

                // Crear el contenedor de la lista
                const listContainer = document.createElement('div');
                listContainer.className = 'pedidos-list pendientes';
                listContainer.appendChild(pedidoCard);

                // Crear el botón dentro del pedidoCard
                const button = document.createElement('button');
                button.className = 'btn-entregar';
                pedidoCard.appendChild(button);

                // Llamar a entregarPedido con el botón
                entregarPedido(button);
            });
        }



    } else {
        // Add state change functionality for non-admin users
        const btnCambiarEstado = registroCard.querySelector('.btn-cambiar-estado');
        if (btnCambiarEstado) {
            btnCambiarEstado.addEventListener('click', async (e) => {
                e.stopPropagation();
                try {
                    mostrarCarga();
                    const nuevoEstado = pedido[8] === 'Recibido' ? 'Ingresado' : 'Recibido';

                    const response = await fetch('/actualizar-registro-pedido', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            id: pedido[0],
                            datos: {
                                estado: nuevoEstado
                            }
                        })
                    });

                    const data = await response.json();
                    if (data.success) {
                        // Update the UI
                        pedido[8] = nuevoEstado;
                        const estadoElement = registroCard.querySelector('.registro-estado-acopio');
                        estadoElement.textContent = nuevoEstado;
                        estadoElement.className = `registro-estado-acopio estado-${nuevoEstado.toLowerCase()}`;

                        // Si cambia a Recibido, mostrar formulario de ingreso automáticamente
                        if (nuevoEstado === 'Recibido') {
                            setTimeout(() => {
                                const anuncio = document.querySelector('.anuncio');
                                const overlay = document.querySelector('.overlay');
                                if (overlay) overlay.style.display = 'flex';
                            }, 500);
                        }

                        // Replace the entire card to update the buttons
                        const newCard = crearPedidoCard(pedido, false);
                        registroCard.replaceWith(newCard);

                        mostrarNotificacion(`Estado actualizado a ${nuevoEstado}`, 'success');
                    } else {
                        throw new Error(data.error || 'Error al actualizar estado');
                    }
                } catch (error) {
                    mostrarNotificacion(error.message, 'error');
                } finally {
                    ocultarCarga();
                }
            });
        }

        // Configurar botón de ingreso para estado Recibido
        if (pedido[8] === 'Recibido') {
            // Modificar donde se llama a mostrarFormularioIngresoAcopio
            const btnIngresar = registroCard.querySelector('.btn-ingresar-acopio');
            if (btnIngresar) {
                btnIngresar.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    try {
                        const nombreProducto = pedido[2];
                        await mostrarFormularioIngresoAcopio(nombreProducto);
                    } catch (error) {
                        console.error('Error completo:', error);
                        mostrarNotificacion('Error al mostrar el formulario. Por favor, intente nuevamente.', 'error');
                    }
                });
            }
            const btnRechazar = registroCard.querySelector('.btn-rechazar');
            if (btnRechazar) {
                btnRechazar.addEventListener('click', (e) => {
                    e.stopPropagation();
                    mostrarFormularioRechazo(btnRechazar.dataset.id, btnRechazar.dataset.nombre);
                });
            }
        }

    }

}
function ordenarRegistrosPorFecha(registros) {
    return registros.sort((a, b) => {
        const [diaA, mesA, yearA] = (a[1] || '').split('/');
        const [diaB, mesB, yearB] = (b[1] || '').split('/');

        const fechaA = new Date(20 + yearA, mesA - 1, diaA);
        const fechaB = new Date(20 + yearB, mesB - 1, diaB);

        return fechaB - fechaA;
    });
}

/* =============== FUNCIONES DE FILTROS =============== */
function configurarFiltros2() {
    const btnFiltro = document.querySelector('.btn-filtro-acopio');
    const anuncio = document.querySelector('.anuncio');
    const anuncioContenido = anuncio.querySelector('.anuncio-contenido');

    // Función para limpiar eventos anteriores
    function limpiarEventosAnteriores() {
        const botones = anuncio.querySelectorAll('button');
        botones.forEach(boton => {
            const nuevoBoton = boton.cloneNode(true);
            boton.parentNode.replaceChild(nuevoBoton, boton);
        });
    }

    btnFiltro.addEventListener('click', () => {
        // Limpiar eventos anteriores
        limpiarEventosAnteriores();

        anuncioContenido.innerHTML = `
            <div class="encabezado">
                <h2>Filtros</h2>
                <button class="anuncio-btn close" onclick="ocultarAnuncio()">
                    <i class="fas fa-arrow-right"></i></button>
            </div>
            <div class="filtros-form relleno">

                    <p for="filtro-nombre-acopio">Nombre del producto</p>
                    <input type="text" id="filtro-nombre-acopio" placeholder="Filtrar por nombre" value="${filtrosActivos.nombre}">

                    <p for="filtro-fecha-desde-acopio">Fecha desde</p>
                    <input type="date" id="filtro-fecha-desde-acopio" value="${filtrosActivos.fechaDesde}">

                    <p for="filtro-fecha-hasta-acopio">Fecha hasta</p>
                    <input type="date" id="filtro-fecha-hasta-acopio" value="${filtrosActivos.fechaHasta}">

                    <p for="filtro-estado-acopio">Estado</p>
                    <select id="filtro-estado-acopio">
                        <option value="todos" ${filtrosActivos.estado === 'todos' ? 'selected' : ''}>Todos los estados</option>
                        <option value="Pendiente" ${filtrosActivos.estado === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
                        <option value="Recibido" ${filtrosActivos.estado === 'Recibido' ? 'selected' : ''}>Recibido</option>
                        <option value="En proceso" ${filtrosActivos.estado === 'En proceso' ? 'selected' : ''}>En proceso</option>
                    </select>

            </div>
            <div class="anuncio-botones" id="botones-filtro-acopio">
                <button class="anuncio-btn green confirmar-acopio" id="btn-confirmar-acopio">
                    <i class="fas fa-check-circle"></i> Aplicar
                </button>
                <button class="anuncio-btn blue limpiar-acopio" id="btn-limpiar-acopio">
                    <i class="fas fa-eraser"></i> Limpiar
                </button>
            </div>
        `;

        mostrarAnuncio();

        // Configurar botones usando IDs únicos
        const btnConfirmar = document.getElementById('btn-confirmar-acopio');
        const btnLimpiar = document.getElementById('btn-limpiar-acopio');

        btnConfirmar.addEventListener('click', () => {
            filtrosActivos = {
                nombre: document.getElementById('filtro-nombre-acopio').value.toLowerCase(),
                fechaDesde: document.getElementById('filtro-fecha-desde-acopio').value,
                fechaHasta: document.getElementById('filtro-fecha-hasta-acopio').value,
                estado: document.getElementById('filtro-estado-acopio').value
            };

            aplicarFiltros2();
            localStorage.setItem('filtrosRegistrosAcopio', JSON.stringify(filtrosActivos));
            ocultarAnuncio();
        });

        btnLimpiar.addEventListener('click', () => {
            document.getElementById('filtro-nombre-acopio').value = '';
            document.getElementById('filtro-fecha-desde-acopio').value = '';
            document.getElementById('filtro-fecha-hasta-acopio').value = '';
            document.getElementById('filtro-estado-acopio').value = 'todos';

            filtrosActivos = {
                nombre: '',
                fechaDesde: '',
                fechaHasta: '',
                estado: 'todos'
            };

            // Change this line from aplicarFiltros to aplicarFiltros2
            aplicarFiltros2();
            localStorage.removeItem('filtrosRegistrosAcopio');
            ocultarAnuncio();
        });
    });

    // Cargar filtros guardados al iniciar con la nueva clave
    const filtrosGuardados = localStorage.getItem('filtrosRegistrosAcopio');
    if (filtrosGuardados) {
        filtrosActivos = JSON.parse(filtrosGuardados);
        // Change this line from aplicarFiltros to aplicarFiltros2
        aplicarFiltros2();
    }
}
function aplicarFiltros2() {
    const registros = document.querySelectorAll('.registro-card-acopio');
    registros.forEach(registro => {
        const nombreElement = registro.querySelector('.registro-producto-acopio');
        const estadoElement = registro.querySelector('.registro-estado-acopio');

        // Skip if required elements are not found
        if (!nombreElement || !estadoElement) return;

        const nombre = nombreElement.textContent.toLowerCase();
        const fecha = registro.dataset.fecha;
        const estado = estadoElement.textContent;

        const cumpleFiltros =
            (!filtrosActivos.nombre || nombre.includes(filtrosActivos.nombre)) &&
            (!filtrosActivos.fechaDesde || fecha >= filtrosActivos.fechaDesde) &&
            (!filtrosActivos.fechaHasta || fecha <= filtrosActivos.fechaHasta) &&
            (filtrosActivos.estado === 'todos' || estado === filtrosActivos.estado);

        registro.style.display = cumpleFiltros ? '' : 'none';
    });

    actualizarContador();
}
function configurarFiltrosBotones() {
    const filterButtons = document.querySelectorAll('.filter-btn-acopio');
    const filterOptionsContainer = document.querySelector('.filter-options-acopio');

    // Set initial active state
    if (!filtrosActivos.estado || filtrosActivos.estado === 'todos') {
        filterButtons[0].classList.add('active');
    } else {
        const activeButton = Array.from(filterButtons)
            .find(btn => btn.dataset.estado === filtrosActivos.estado);
        if (activeButton) {
            activeButton.classList.add('active');
        }
    }

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            // Add active to clicked button
            button.classList.add('active');

            // Update active filter
            filtrosActivos.estado = button.dataset.estado;

            // Apply filters
            aplicarFiltros2();

            // Smooth scroll to center
            const buttonRect = button.getBoundingClientRect();
            const containerRect = filterOptionsContainer.getBoundingClientRect();
            const scrollOffset = buttonRect.left - containerRect.left - 
                               (containerRect.width / 2) + (buttonRect.width / 2);
            
            filterOptionsContainer.scrollTo({
                left: filterOptionsContainer.scrollLeft + scrollOffset,
                behavior: 'smooth'
            });
        });
    });
}
/* =============== FUNCIONES DE EDICION, ELIMINACION, RECHAZO PEDIDOS=============== */
function mostrarFormularioEdicion(pedido) {
    const anuncio = document.querySelector('.anuncio');
    const anuncioContenido = anuncio.querySelector('.anuncio-contenido');
    const overlay = document.querySelector('.overlay');

    anuncioContenido.innerHTML = `
        <div class="encabezado">
            <h2>Editar registro</h2>
            <button class="anuncio-btn close" onclick="ocultarAnuncio()">
                <i class="fas fa-arrow-right"></i></button>
        </div>
        <div class="relleno">
                <p for="edit-nombre">Nombre del producto</p>
                <input type="text" id="edit-nombre"placeholder="Ingresa el producto" value="${pedido[2] || ''}">

                <p for="edit-cantidad">Cantidad</p>
                <input type="number" id="edit-cantidad" placeholder="Ingresa la cantidad" value="${pedido[3] || ''}">

                <p for="edit-observaciones">Observaciones</p>
                <textarea id="edit-observaciones"style="min-height: 100px" placeholder="Ingresa las observaciones">${pedido[4] || ''}</textarea>

                <p for="edit-cantidad-entregada">Cantidad Entregada</p>
                <input type="number" id="edit-cantidad-entregada" placeholder="Ingresa la cantidad entregada" value="${pedido[5] || ''}">

                <p for="edit-proveedor">Proveedor</p>
                <input type="text" id="edit-proveedor" placeholder="Ingresa el proveedor" value="${pedido[6] || ''}">

                <p for="edit-costo">Costo</p>
                <input type="number" id="edit-costo" placeholder="Ingresa el costo. Ej: 23" value="${pedido[7] || ''}">

                <p for="edit-estado">Estado</p>
                <select id="edit-estado">
                    <option value="Pendiente" ${pedido[8] === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
                    <option value="En proceso" ${pedido[8] === 'En proceso' ? 'selected' : ''}>En proceso</option>
                    <option value="Recibido" ${pedido[8] === 'Recibido' ? 'selected' : ''}>Recibido</option>
                    <option value="Recibido" ${pedido[8] === 'Ingresado' ? 'selected' : ''}>Ingresado</option>
                </select>

                <p for="edit-detalles">Detalles</p>
                <textarea id="edit-detalles" style="min-height: 100px" placeholder="Ingresa el detalle">${pedido[9] || ''}</textarea>
                

                <p for="edit-cantidad-compras">Cantidad Compras:</p>
                <input type="number" id="edit-cantidad-compras" placeholder="Ingresa la cantidad entregada compras" value="${pedido[10] || ''}">

                <p for="edit-medida">Medida</p>
                <input type="text" id="edit-medida" placeholder="Ingresa la unidad de medida. Ej: Bls, Und" value="${pedido[11] || ''}">

                <p for="edit-entregado">Entregado</p>
                <input type="text" id="edit-entregado" placeholder="Ingresa la cantidad entregada" value="${pedido[12] || ''}">
            
        </div>
        <div class="anuncio-botones">
            <button class="anuncio-btn green guardar"><i class="fas fa-save"></i> Guardar</button>
        </div>
    `;

    mostrarAnuncio();


    // Configure buttons
    const btnGuardar = anuncio.querySelector('.guardar');


    // ... in mostrarFormularioEdicion function ...
    btnGuardar.addEventListener('click', async () => {
        const datosActualizados = {
            nombre: document.getElementById('edit-nombre').value,
            cantidad: document.getElementById('edit-cantidad').value,
            observaciones: document.getElementById('edit-observaciones').value,
            cantidadEntregada: document.getElementById('edit-cantidad-entregada').value,
            proveedor: document.getElementById('edit-proveedor').value,
            costo: document.getElementById('edit-costo').value,
            estado: document.getElementById('edit-estado').value,
            detalles: document.getElementById('edit-detalles').value,
            cantidadCompras: document.getElementById('edit-cantidad-compras').value,
            medida: document.getElementById('edit-medida').value,
            entregado: document.getElementById('edit-entregado').value
        };

        try {
            mostrarCarga();
            const response = await fetch('/actualizar-registro-pedido', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: pedido[0],
                    datos: datosActualizados
                })
            });

            const data = await response.json();
            if (data.success) {
                // Update the existing card with new data
                const registroCard = document.querySelector(`.registro-card[data-id="${pedido[0]}"]`);
                if (registroCard) {
                    // Update pedido array with new values
                    pedido[2] = datosActualizados.nombre;
                    pedido[3] = datosActualizados.cantidad;
                    pedido[4] = datosActualizados.observaciones;
                    pedido[5] = datosActualizados.cantidadEntregada;
                    pedido[6] = datosActualizados.proveedor;
                    pedido[7] = datosActualizados.costo;
                    pedido[8] = datosActualizados.estado;
                    pedido[9] = datosActualizados.detalles;
                    pedido[10] = datosActualizados.cantidadCompras;
                    pedido[11] = datosActualizados.medida;
                    pedido[12] = datosActualizados.entregado;

                    // Create new card with updated data
                    const newCard = crearPedidoCard(pedido, true);
                    registroCard.replaceWith(newCard);

                    // If the details were open, keep them open
                    if (registroCard.querySelector('.registro-detalles.active')) {
                        newCard.querySelector('.registro-detalles').classList.add('active');
                    }
                }
                mostrarNotificacion('Registro actualizado correctamente', 'success');
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            mostrarNotificacion('Error al actualizar registro: ' + error.message, 'error');
        } finally {
            ocultarCarga();

        }

        ocultarAnuncio();
    });

}
function mostrarConfirmacionEliminar(pedido, registroCard) {
    const anuncio = document.querySelector('.anuncio-down');
    const anuncioContenido = anuncio.querySelector('.anuncio-contenido');

    anuncioContenido.innerHTML = `
        <div class="encabezado">
            <h2>Eliminar pedido?</h2>
            <button class="anuncio-btn close" onclick="ocultarAnuncioDown()">
                <i class="fas fa-arrow-down"></i></button>
        </div>
        <div class="form-grup">
            <p>¿Está seguro que desea eliminar este registro?</p>
            <div class="detalles-eliminacion">
                <p><strong>ID:</strong> ${pedido[0]}</p>
                <p><strong>Fecha:</strong> ${pedido[1]}</p>
                <p><strong>Producto:</strong> ${pedido[2]}</p>
            </div>
        </div>
        <div class="anuncio-botones">
            <button class="anuncio-btn red confirmar-eliminacion">
                <i class="fas fa-trash"></i> Eliminar
            </button>
        </div>
    `;

    const btnConfirmar = anuncioContenido.querySelector('.confirmar-eliminacion');

    btnConfirmar.addEventListener('click', async () => {
        try {
            mostrarCarga();
            const response = await fetch('/eliminar-pedido', {  // Cambiado a usar el endpoint existente
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: pedido[0] })
            });

            const data = await response.json();
            if (data.success) {
                registroCard.remove();
                mostrarNotificacion('Registro eliminado correctamente', 'success');
                actualizarContador();
            } else {
                throw new Error(data.error || 'Error al eliminar el registro');
            }
        } catch (error) {
            mostrarNotificacion('Error al eliminar registro: ' + error.message, 'error');
        } finally {
            ocultarCarga();
            ocultarAnuncioDown();
        }
    });

    mostrarAnuncioDown();
}
function mostrarFormularioRechazo(id, nombre) {
    const anuncio = document.querySelector('.anuncio');
    const contenido = anuncio.querySelector('.anuncio-contenido');

    contenido.innerHTML = `
        <div class="encabezado">
            <h2>Rechazar pedido</h2>
            <button class="anuncio-btn close" onclick="ocultarAnuncio()">
                <i class="fas fa-arrow-right"></i></button>
        </div>
        <div class="relleno">
            <div class="detalles-grup">
                <div class="detalle-item">
                    <p>ID:</p><span>${id}</span>
                </div>
                <div class="detalle-item">
                    <p>Producto:</p><span>${nombre}</span>
                </div>
            </div>
             <p>Razón del rechazo</p>
            <textarea id="razonRechazo" class="edit-input" rows="4" placeholder="Explique la razón del rechazo..."></textarea>
        </div>
        <div class="anuncio-botones">
            <button class="anuncio-btn red confirmar-rechazo"><i class="fas fa-times"></i> Confirmar Rechazo</button>
        </div>
    `;
    mostrarAnuncio();
    // Event listeners
    const btnConfirmar = contenido.querySelector('.confirmar-rechazo');
    const razonInput = contenido.querySelector('#razonRechazo');

    btnConfirmar.onclick = async () => {
        const razon = razonInput.value.trim();
        if (!razon) {
            mostrarNotificacion('Debe ingresar una razón para el rechazo', 'error');
            return;
        }

        try {
            mostrarCarga();
            const response = await fetch('/rechazar-pedido', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, razon })
            });

            const data = await response.json();
            if (data.success) {
                mostrarNotificacion('Pedido rechazado correctamente', 'success');
                ocultarAnuncio();
                cargarRegistrosAcopio(); // Recargar la vista
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            mostrarNotificacion('Error al rechazar el pedido: ' + error.message, 'error');
        } finally {
            ocultarCarga();
        }
    };

}

/* =============== FUNCIONES DE REGISTROS MOVIMIENTOS=============== */
function crearMovimientoCard(movimiento, isAdmin) {
    const [id, fecha, tipo, producto, cantidad, operario, almacen, razon] = movimiento;
    const movimientoCard = document.createElement('div');
    movimientoCard.className = 'registro-card-acopio';
    movimientoCard.dataset.id = id;
    movimientoCard.dataset.fecha = fecha;

    const fechaCorta = fecha.split(',')[0];
    const [dia, mes] = fechaCorta.split('/');

    // Determinar la clase según el tipo de movimiento
    const tipoClass = tipo.toLowerCase().includes('ingreso') ? 'tipo-ingreso' : 'tipo-salida';

    movimientoCard.innerHTML = `
        <div class="registro-header">
            <div class="registro-fecha">${dia}/${mes}</div>
            <div class="registro-producto-acopio">${producto}</div>
            <div class="registro-estado-acopio ${tipoClass}">${tipo}</div>
        </div>
        <div class="registro-detalles">
            <p><span>ID:</span> ${id}</p>
            <p><span>Cantidad:</span> ${cantidad}</p>
            <p><span>Operario:</span> ${operario}</p>
            <p><span>Almacén:</span> ${almacen}</p>
            <p><span>Razón:</span> ${razon || '-'}</p>
            ${isAdmin ? `
                <div class="acciones">
                    <button class="btn-eliminar-registro">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                    <button class="btn-editar-registro">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                </div>
            ` : ''}
        </div>
    `;

    configurarEventosMovimiento(movimientoCard, isAdmin, movimiento);
    return movimientoCard;
}
function configurarEventosMovimiento(movimientoCard, isAdmin, movimiento) {
    const header = movimientoCard.querySelector('.registro-header');

    header.addEventListener('click', (e) => {
        const detalles = movimientoCard.querySelector('.registro-detalles');
        document.querySelectorAll('.registro-detalles.active').forEach(otherDetalles => {
            if (otherDetalles !== detalles) {
                otherDetalles.classList.remove('active');
            }
        });
        detalles.classList.toggle('active');

        // Add smooth scrolling to center
        if (detalles.classList.contains('active')) {
            setTimeout(() => {
                movimientoCard.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            }, 100);
        }
    });

    if (isAdmin) {
        const btnEliminar = movimientoCard.querySelector('.btn-eliminar-registro');
        if (btnEliminar) {
            btnEliminar.addEventListener('click', (e) => {
                e.stopPropagation();
                mostrarConfirmacionEliminarMovimiento(movimiento, movimientoCard);
            });
        }

        const btnEditar = movimientoCard.querySelector('.btn-editar-registro');
        if (btnEditar) {
            btnEditar.addEventListener('click', (e) => {
                e.stopPropagation();
                mostrarFormularioEdicionMovimiento(movimiento);
            });
        }
    }
}

/* =============== FUNCIONES DE REGISTRO DE MOVIMIENTOS ELIMINACION Y EDICION=============== */
function mostrarFormularioEdicionMovimiento(movimiento) {
    const anuncio = document.querySelector('.anuncio');
    const anuncioContenido = anuncio.querySelector('.anuncio-contenido');
    const [id, fecha, tipo, producto, cantidad, operario, almacen, razon] = movimiento;

    anuncioContenido.innerHTML = `
        <h2><i class="fas fa-edit"></i> Editar Movimiento</h2>
        <div class="relleno">
            <div class="campo-form">
                <label for="edit-tipo">Tipo:</label>
                <select id="edit-tipo">
                    <option value="Ingreso" ${tipo === 'Ingreso' ? 'selected' : ''}>Ingreso</option>
                    <option value="Salida" ${tipo === 'Salida' ? 'selected' : ''}>Salida</option>
                </select>
            </div>
            <div class="campo-form">
                <label for="edit-producto">Producto:</label>
                <input type="text" id="edit-producto" value="${producto || ''}">
            </div>
            <div class="campo-form">
                <label for="edit-cantidad">Cantidad:</label>
                <input type="number" id="edit-cantidad" value="${cantidad || ''}">
            </div>
            <div class="campo-form">
                <label for="edit-operario">Operario:</label>
                <input type="text" id="edit-operario" value="${operario || ''}">
            </div>
            <div class="campo-form">
                <label for="edit-almacen">Almacén:</label>
                <input type="text" id="edit-almacen" value="${almacen || ''}" readonly>
            </div>
            <div class="campo-form">
                <label for="edit-razon">Razón:</label>
                <textarea id="edit-razon">${razon || ''}</textarea>
            </div>
        </div>
        <div class="anuncio-botones">
            <button class="anuncio-btn green guardar">
                <i class="fas fa-save"></i> Guardar
            </button>
            <button class="anuncio-btn close cancelar">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;

    const btnGuardar = anuncioContenido.querySelector('.guardar');
    const btnCancelar = anuncioContenido.querySelector('.cancelar');

    btnGuardar.addEventListener('click', async () => {
        try {
            mostrarCarga();
            const datosActualizados = {
                tipo: document.getElementById('edit-tipo').value,
                producto: document.getElementById('edit-producto').value,
                cantidad: document.getElementById('edit-cantidad').value,
                operario: document.getElementById('edit-operario').value,
                almacen: document.getElementById('edit-almacen').value,
                razon: document.getElementById('edit-razon').value
            };

            const response = await fetch('/actualizar-movimiento-acopio', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: id,
                    ...datosActualizados
                })
            });

            const data = await response.json();
            if (data.success) {
                // Update the movement card
                const movimientoCard = document.querySelector(`.registro-card-acopio[data-id="${id}"]`);
                if (movimientoCard) {
                    const newMovimiento = [
                        id, fecha, datosActualizados.tipo,
                        datosActualizados.producto, datosActualizados.cantidad,
                        datosActualizados.operario, datosActualizados.almacen,
                        datosActualizados.razon
                    ];
                    const newCard = crearMovimientoCard(newMovimiento, true);
                    movimientoCard.replaceWith(newCard);
                }
                mostrarNotificacion('Movimiento actualizado correctamente', 'success');
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            mostrarNotificacion('Error al actualizar movimiento: ' + error.message, 'error');
        } finally {
            ocultarCarga();
            anuncio.style.display = 'none';
        }
    });

    btnCancelar.addEventListener('click', () => {
        anuncio.style.display = 'none';
    });

    anuncio.style.display = 'flex';
}
function mostrarConfirmacionEliminarMovimiento(movimiento, movimientoCard) {
    const anuncio = document.querySelector('.anuncio-down');
    const anuncioContenido = anuncio.querySelector('.anuncio-contenido');
    const [id, fecha, tipo, producto] = movimiento;

    anuncioContenido.innerHTML = `
        <div class="encabezado">
            <h2>Eliminar Movimiento?</h2>
            <button class="anuncio-btn close" onclick="ocultarAnuncioDown()">
                <i class="fas fa-arrow-down"></i></button>
        </div>
        <div class="form-grup">
            <p>¿Está seguro que desea eliminar este movimiento?</p>
            <div class="detalles-eliminacion">
                <p><strong>ID:</strong> ${id}</p>
                <p><strong>Fecha:</strong> ${fecha}</p>
                <p><strong>Tipo:</strong> ${tipo}</p>
                <p><strong>Producto:</strong> ${producto}</p>
            </div>
        </div>
        <div class="anuncio-botones">
            <button class="anuncio-btn red confirmar-eliminacion">
                <i class="fas fa-trash"></i> Eliminar
            </button>
        </div>
    `;
    mostrarAnuncioDown();
    const btnConfirmar = anuncioContenido.querySelector('.confirmar-eliminacion');

    btnConfirmar.addEventListener('click', async () => {
        try {
            mostrarCarga();
            const response = await fetch('/eliminar-movimiento-acopio', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: id })
            });

            const data = await response.json();
            if (data.success) {
                movimientoCard.remove();
                mostrarNotificacion('Movimiento eliminado correctamente', 'success');
                actualizarContador();
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            mostrarNotificacion('Error al eliminar movimiento: ' + error.message, 'error');
        } finally {
            ocultarCarga();
            ocultarAnuncioDown();
        }
    });
}

/* =============== FUNCIONES DE UTILIDAD =============== */
function actualizarContador() {
    const registrosVisibles = document.querySelectorAll('.registro-card-acopio:not([style*="display: none"])').length;
    const contadores = document.querySelectorAll('.contador');

    // Actualizar todos los contadores en la página
    contadores.forEach(contador => {
        contador.textContent = `${registrosVisibles} pedidos`;
    });
}









