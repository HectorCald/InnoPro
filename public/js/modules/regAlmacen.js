/* =============== FUNCIONES DE INICIO ALMACEN GENERAL =============== */
let filtrosActivos = {
    nombre: '',
    fechaDesde: '',
    fechaHasta: '',
    tipo: 'todos',
    almacen: 'todos'
};
export async function cargarRegistrosAlmacenGral() {
    try {
        mostrarCarga();
        // Obtener el rol del usuario
        const rolResponse = await fetch('/obtener-mi-rol');
        const userData = await rolResponse.json();
        const esAdmin = userData.rol === 'Administración';

        const response = await fetch('/obtener-movimientos-almacen');
        const data = await response.json();

        if (data.success) {
            const container = document.querySelector('.regAlmacen-view');

            container.innerHTML = `
                <div class="filtros-header">
                    <h2 class="section-title">
                        <i class="fas fa-clipboard-list"></i> Registros Almacén
                    </h2>
                    <button class="btn-filtro-acopio">
                        <i class="fas fa-filter"></i> Filtros
                    </button>
                </div>
                <div class="pedidos-container">
                    <div class="fecha-card">
                        <div class="fecha-header">
                            <div class="fecha-info">
                                <h3>Registro de Movimientos</h3>
                                <span class="contador">${data.movimientos.length} movimientos</span>
                            </div>
                            <i class="fas fa-chevron-down"></i>
                        </div>
                        <div class="registros-grupo"></div>
                    </div>
                </div>`;

            const registrosContainer = container.querySelector('.registros-grupo');
            const registrosOrdenados = ordenarRegistrosPorFecha(data.movimientos);

            for (const movimiento of registrosOrdenados) {
                const movimientoCard = crearMovimientoCard(movimiento, esAdmin);
                registrosContainer.appendChild(movimientoCard);
            }

            // Configurar evento para expandir/colapsar
            const fechaHeader = container.querySelector('.fecha-header');
            fechaHeader.addEventListener('click', () => {
                const registrosGrupo = container.querySelector('.registros-grupo');
                registrosGrupo.classList.toggle('active');
                const icono = fechaHeader.querySelector('.fa-chevron-down');
                icono.style.transform = registrosGrupo.classList.contains('active') ? 'rotate(180deg)' : 'rotate(0)';
            });
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error al cargar los movimientos', 'error');
    } finally {
        ocultarCarga();
    }
    configurarFiltros2();
}
function crearMovimientoCard(movimiento, isAdmin) {
    try {
        const [id, fechaCompleta, tipo, producto, cantidad, operario, almacen, razon] = movimiento;

        // Procesar la fecha
        const [fecha, hora] = fechaCompleta.split(', ');
        const [dia, mes] = fecha.split('/');

        // Separar nombre y gramaje
        const [nombre, gramaje] = producto.split('-');

        // Determinar la clase según el tipo
        let tipoClase = '';
        switch (tipo.toLowerCase()) {
            case 'ingreso':
                tipoClase = 'tipo-ingreso';
                break;
            case 'salida':
                tipoClase = 'tipo-salida';
                break;
            case 'transferencia':
                tipoClase = 'tipo-transferencia';
                break;
            case 'ajuste':
                tipoClase = 'tipo-ajuste';
                break;
            default:
                tipoClase = '';
        }

        const registroCard = document.createElement('div');
        registroCard.className = 'registro-card-acopio';
        registroCard.dataset.id = id;
        registroCard.dataset.fecha = fechaCompleta;

        const botonesAdmin = isAdmin ? `
            <div class="acciones">
                <button class="btn-eliminar-registro">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
                <button class="btn-editar-registro">
                    <i class="fas fa-edit"></i> Editar
                </button>
            </div>
        ` : '';

        registroCard.innerHTML = `
            <div class="registro-header">
                <div class="registro-fecha">${dia}/${mes}</div>
                <div class="registro-producto-acopio">${nombre}</div>
                <div class="registro-tipo-movimiento ${tipoClase}">${tipo}</div>
            </div>
            <div class="registro-detalles">
                <p><span>ID:</span> ${id}</p>
                <p><span>Fecha:</span> ${fechaCompleta}</p>
                <p><span>Cantidad:</span> ${cantidad}</p>
                <p><span>Operario:</span> ${operario}</p>
                <p><span>Almacén:</span> ${almacen}</p>
                <p><span>Motivo:</span> ${razon}</p>
                <p><span>Gramaje:</span> ${gramaje}</p> <!-- Display gramaje separately -->
                ${botonesAdmin}
            </div>
        `;

        configurarEventosRegistro(registroCard, isAdmin, movimiento);
        return registroCard;
    } catch (error) {
        console.error('Error al crear movimiento card:', error, movimiento);
        return document.createElement('div');
    }
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

    if (isAdmin) {

        const btnEditar = registroCard.querySelector('.btn-editar-registro');
        btnEditar.addEventListener('click', (e) => {
            e.stopPropagation();
            mostrarFormularioEdicion(pedido);
        });

        const btnEliminar = registroCard.querySelector('.btn-eliminar-registro');
        btnEliminar.addEventListener('click', async (e) => {
            e.stopPropagation();
            const anuncio = document.querySelector('.anuncio-down');
            const anuncioContenido = anuncio.querySelector('.anuncio-contenido');

            anuncioContenido.innerHTML = `
                <div class="encabezado">
                    <h2>Eliminar registros?</h2>
                    <button class="anuncio-btn close" onclick="ocultarAnuncioDown()">
                        <i class="fas fa-arrow-down"></i></button>
                </div>
                <div class="detalles-grup center">
                    <p>¿Estás seguro de que deseas eliminar este registro?</p>
                </div>
                <div class="anuncio-botones">
                    <button class="anuncio-btn red confirmar"><i class="fas fa-trash"></i> Eliminar</button>
                </div>
            `;

            mostrarAnuncioDown();

            const btnConfirmar = anuncio.querySelector('.confirmar');

            btnConfirmar.addEventListener('click', async () => {
                try {
                    mostrarCarga();
                    const response = await fetch('/eliminar-movimiento-almacen', {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ id: pedido[0] })
                    });

                    const data = await response.json();
                    if (data.success) {
                        registroCard.remove();
                        actualizarContador();
                        mostrarNotificacion('Registro eliminado correctamente', 'success');
                    } else {
                        throw new Error(data.error || 'Error al eliminar el registro');
                    }
                } catch (error) {
                    console.error('Error:', error);
                    mostrarNotificacion('Error al eliminar el registro: ' + error.message, 'error');
                } finally {
                    ocultarCarga();
                }
                ocultarAnuncioDown();
            });
        });
    }
}
function ordenarRegistrosPorFecha(registros) {
    return registros.sort((a, b) => {
        try {
            // Convert date strings to Date objects (format: "DD/MM/YYYY, HH:mm:ss")
            const [fechaA, horaA] = a[1].split(', ');
            const [diaA, mesA, yearA] = fechaA.split('/');
            const dateA = new Date(`${yearA}-${mesA}-${diaA} ${horaA}`);

            const [fechaB, horaB] = b[1].split(', ');
            const [diaB, mesB, yearB] = fechaB.split('/');
            const dateB = new Date(`${yearB}-${mesB}-${diaB} ${horaB}`);

            // Sort in descending order (most recent first)
            return dateB - dateA;
        } catch (error) {
            console.error('Error al ordenar fechas:', error);
            return 0;
        }
    });
}

/* =============== FUNCIONES DE FILTROS =============== */
function configurarFiltros2() {
    try {
        const btnFiltro = document.querySelector('.btn-filtro-acopio');
        if (!btnFiltro) {
            console.error('No se encontró el botón de filtro');
            return;
        }

        const anuncio = document.querySelector('.anuncio');
        const anuncioContenido = anuncio.querySelector('.anuncio-contenido');

        function limpiarEventosAnteriores() {
            const botones = anuncio.querySelectorAll('button');
            botones.forEach(boton => {
                const nuevoBoton = boton.cloneNode(true);
                boton.parentNode.replaceChild(nuevoBoton, boton);
            });
        }

        btnFiltro.addEventListener('click', () => {
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

                        <p for="filtro-tipo">Tipo de movimiento</p>
                        <select id="filtro-tipo" value="${filtrosActivos.tipo}">
                            <option value="todos">Todos los tipos</option>
                            <option value="Ingreso">Ingreso</option>
                            <option value="Salida">Salida</option>
                            <option value="Transferencia">Transferencia</option>
                            <option value="Ajuste">Ajuste</option>
                        </select>

                        <p for="filtro-almacen">Almacén</p>
                        <select id="filtro-almacen" value="${filtrosActivos.almacen}">
                            <option value="todos">Todos los almacenes</option>
                            <option value="Principal">Principal</option>
                            <option value="Secundario">Secundario</option>
                            <option value="Temporal">Temporal</option>
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

            // Establecer valores seleccionados en los select
            document.getElementById('filtro-tipo').value = filtrosActivos.tipo;
            document.getElementById('filtro-almacen').value = filtrosActivos.almacen;

            mostrarAnuncio();

            const btnConfirmar = document.getElementById('btn-confirmar-acopio');
            const btnLimpiar = document.getElementById('btn-limpiar-acopio');


            btnConfirmar.addEventListener('click', () => {
                try {
                    filtrosActivos = {
                        nombre: document.getElementById('filtro-nombre-acopio').value.toLowerCase(),
                        fechaDesde: document.getElementById('filtro-fecha-desde-acopio').value,
                        fechaHasta: document.getElementById('filtro-fecha-hasta-acopio').value,
                        tipo: document.getElementById('filtro-tipo').value,
                        almacen: document.getElementById('filtro-almacen').value
                    };

                    aplicarFiltros2();
                    localStorage.setItem('filtrosMovimientosAlmacen', JSON.stringify(filtrosActivos));
                    ocultarAnuncio();
                } catch (error) {
                    console.error('Error al aplicar filtros:', error);
                    mostrarNotificacion('Error al aplicar filtros', 'error');
                }
            });

            btnLimpiar.addEventListener('click', () => {
                try {
                    document.getElementById('filtro-nombre-acopio').value = '';
                    document.getElementById('filtro-fecha-desde-acopio').value = '';
                    document.getElementById('filtro-fecha-hasta-acopio').value = '';
                    document.getElementById('filtro-tipo').value = 'todos';
                    document.getElementById('filtro-almacen').value = 'todos';

                    filtrosActivos = {
                        nombre: '',
                        fechaDesde: '',
                        fechaHasta: '',
                        tipo: 'todos',
                        almacen: 'todos'
                    };

                    aplicarFiltros2();
                    localStorage.removeItem('filtrosMovimientosAlmacen');
                    ocultarAnuncio();
                } catch (error) {
                    console.error('Error al limpiar filtros:', error);
                    mostrarNotificacion('Error al limpiar filtros', 'error');
                }
            });
        });

        // Cargar filtros guardados
        const filtrosGuardados = localStorage.getItem('filtrosMovimientosAlmacen');
        if (filtrosGuardados) {
            try {
                filtrosActivos = JSON.parse(filtrosGuardados);
                aplicarFiltros2();
            } catch (error) {
                console.error('Error al cargar filtros guardados:', error);
                localStorage.removeItem('filtrosMovimientosAlmacen');
            }
        }
    } catch (error) {
        console.error('Error en configurarFiltros2:', error);
        mostrarNotificacion('Error al configurar filtros', 'error');
    }
}
function aplicarFiltros2() {
    try {
        const registros = document.querySelectorAll('.registro-card-acopio');

        if (!registros.length) {
            console.log('No se encontraron registros para filtrar');
            return;
        }

        registros.forEach(registro => {
            try {
                const nombre = registro.querySelector('.registro-producto-acopio')?.textContent.toLowerCase() || '';
                const fecha = registro.dataset.fecha || '';
                const tipo = registro.querySelector('.registro-tipo-movimiento')?.textContent || '';
                const almacenElement = registro.querySelector('.registro-detalles p:last-child');
                const almacen = almacenElement ? almacenElement.textContent.split(':')[1].trim() : '';

                const cumpleFiltros =
                    (!filtrosActivos.nombre || nombre.includes(filtrosActivos.nombre)) &&
                    (!filtrosActivos.fechaDesde || fecha >= filtrosActivos.fechaDesde) &&
                    (!filtrosActivos.fechaHasta || fecha <= filtrosActivos.fechaHasta) &&
                    (filtrosActivos.tipo === 'todos' || tipo === filtrosActivos.tipo) &&
                    (filtrosActivos.almacen === 'todos' || almacen === filtrosActivos.almacen);

                registro.style.display = cumpleFiltros ? '' : 'none';
            } catch (error) {
                console.error('Error al procesar registro individual:', error);
            }
        });

        actualizarContador();
    } catch (error) {
        console.error('Error en aplicarFiltros2:', error);
        mostrarNotificacion('Error al aplicar filtros', 'error');
    }
}

/* =============== FUNCIONES DE UTILIDAD =============== */
function actualizarContador() {
    const registrosVisibles = document.querySelectorAll('.registro-card-acopio:not([style*="display: none"])').length;
    const contadores = document.querySelectorAll('.contador');

    contadores.forEach(contador => {
        contador.textContent = `${registrosVisibles} movimientos`;
    });
}

/* =============== FUNCIONES DE EDICION DE REGISTRO =============== */
function mostrarFormularioEdicion(movimiento) {
    const anuncio = document.querySelector('.anuncio');
    const anuncioContenido = anuncio.querySelector('.anuncio-contenido');
    const [id, fecha, tipo, producto, cantidad, operario, almacen] = movimiento;

    anuncioContenido.innerHTML = `
        <div class="encabezado">
            <h2>Editar registro</h2>
            <button class="anuncio-btn close" onclick="ocultarAnuncio()">
                <i class="fas fa-arrow-right"></i></button>
        </div>
        <div class="relleno">

                <p for="edit-tipo">Tipo:</p>
                <select id="edit-tipo">
                    <option value="Ingreso" ${tipo === 'Ingreso' ? 'selected' : ''}>Ingreso</option>
                    <option value="Salida" ${tipo === 'Salida' ? 'selected' : ''}>Salida</option>
                </select>

                <p for="edit-producto">Producto:</p>
                <input type="text" id="edit-producto" value="${producto || ''}">

                <p for="edit-cantidad">Cantidad:</p>
                <input type="number" id="edit-cantidad" value="${cantidad || ''}">

                <p for="edit-operario">Operario:</p>
                <input type="text" id="edit-operario" value="${operario || ''}">

                <p for="edit-almacen">Almacén:</p>
                <select id="edit-almacen">
                    <option value="Principal" ${almacen === 'Principal' ? 'selected' : ''}>Principal</option>
                    <option value="Secundario" ${almacen === 'Secundario' ? 'selected' : ''}>Secundario</option>
                    <option value="Temporal" ${almacen === 'Temporal' ? 'selected' : ''}>Temporal</option>
                </select>
       
        </div>
        <div class="anuncio-botones">
            <button class="anuncio-btn green guardar"><i class="fas fa-save"></i> Guardar</button>
        </div>
    `;

   mostrarAnuncio();

    const btnGuardar = anuncio.querySelector('.guardar');


    btnGuardar.addEventListener('click', async () => {
        try {
            // Validación de campos
            const tipo = document.getElementById('edit-tipo').value;
            const producto = document.getElementById('edit-producto').value.trim();
            const cantidad = document.getElementById('edit-cantidad').value;
            const operario = document.getElementById('edit-operario').value.trim();
            const almacen = document.getElementById('edit-almacen').value;

            // Validar campos vacíos
            if (!producto || !cantidad || !operario || !almacen) {
                throw new Error('Todos los campos son obligatorios');
            }

            // Validar cantidad
            if (isNaN(cantidad) || cantidad <= 0) {
                throw new Error('La cantidad debe ser un número mayor a 0');
            }

            mostrarCarga();
            const datosActualizados = {
                id: id,
                tipo,
                producto,
                cantidad: parseInt(cantidad),
                operario,
                almacen
            };

            const response = await fetch('/actualizar-movimiento-almacen', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify(datosActualizados)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error en la respuesta del servidor');
            }

            const data = await response.json();
            if (data.success) {
                const registroCard = document.querySelector(`.registro-card-acopio[data-id="${id}"]`);
                if (registroCard) {
                    const nuevoMovimiento = [
                        id,
                        fecha, // Mantener la fecha original
                        datosActualizados.tipo,
                        datosActualizados.producto,
                        datosActualizados.cantidad,
                        datosActualizados.operario,
                        datosActualizados.almacen
                    ];
                    const newCard = crearMovimientoCard(nuevoMovimiento, true);
                    registroCard.replaceWith(newCard);
                }
                mostrarNotificacion('Movimiento actualizado correctamente', 'success');
               ocultarAnuncio();
            } else {
                throw new Error(data.error || 'Error al actualizar el movimiento');
            }
        } catch (error) {
            console.error('Error:', error);
            mostrarNotificacion(error.message, 'error');
        } finally {
            ocultarCarga();
        }
    });

}