let filtrosActivos = {
    nombre: '',
    fechaDesde: '',
    fechaHasta: '',
    estado: 'todos' // 'todos', 'pendiente', 'recibido', 'en_proceso'
};
export async function cargarRegistrosAcopio() {
    try {
        mostrarCarga();
        // Obtener el rol del usuario primero
        const rolResponse = await fetch('/obtener-mi-rol');
        const userData = await rolResponse.json();
        const esAdmin = userData.rol === 'Administración';

        const response = await fetch('/obtener-registros-pedidos');
        const data = await response.json();

        if (data.success) {
            const container = document.querySelector('.regAcopio-view');

            // Header con título
            container.innerHTML = `
                <div class="filtros-header">
                    <h2 class="section-title">
                        <i class="fas fa-clipboard-list"></i> Registros Acopio
                    </h2>
                    <button class="btn-filtro-acopio">
                        <i class="fas fa-filter"></i> Filtros
                    </button>
                </div>
                <div class="pedidos-container">
                    <div class="fecha-card">
                        <div class="fecha-header">
                            <div class="fecha-info">
                                <h3>Registro de Pedidos</h3>
                                <span class="contador">${data.pedidos.length} pedidos</span>
                            </div>
                            <i class="fas fa-chevron-down"></i>
                        </div>
                        <div class="registros-grupo"></div>
                    </div>
                </div>`;

            const registrosContainer = container.querySelector('.registros-grupo');
            const registrosOrdenados = ordenarRegistrosPorFecha(data.pedidos);

            for (const pedido of registrosOrdenados) {
                const pedidoCard = crearPedidoCard(pedido, esAdmin); // Pasar esAdmin como parámetro
                registrosContainer.appendChild(pedidoCard);
            }

            // Configurar evento para expandir/colapsar grupo
            const fechaHeader = container.querySelector('.fecha-header');
            fechaHeader.addEventListener('click', () => {
                const registrosGrupo = container.querySelector('.registros-grupo');
                registrosGrupo.classList.toggle('active');
                const icono = fechaHeader.querySelector('.fa-chevron-down');
                icono.style.transform = registrosGrupo.classList.contains('active') ? 'rotate(180deg)' : 'rotate(0)';
            });

        } else {
            throw new Error(data.error || 'Error al obtener los pedidos');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error al cargar los pedidos: ' + error.message, 'error');
    } finally {
        ocultarCarga();
    }
    configurarFiltros();
}
function crearPedidoCard(pedido, isAdmin) {
    const [dia, mes, año] = pedido[1].split('/');
    const registroCard = document.createElement('div');
    registroCard.className = 'registro-card';
    registroCard.dataset.id = pedido[0];
    registroCard.dataset.fecha = pedido[1];

    const estado = pedido[8] || 'Pendiente';
    const estadoClass = estado.toLowerCase().replace(' ', '-');

    // Botones de administrador
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
            <div class="registro-producto">${pedido[2] || 'Sin nombre'}</div>
            <div class="registro-estado estado-${estadoClass}">${estado}</div>
        </div>
        <div class="registro-detalles">
            <p><span>Cantidad Pedida:</span> ${pedido[3] || '-'}</p>
            <p><span>Cantidad Entregado:</span> ${pedido[12] || '-'}</p>
            <p><span>Observaciones:</span> ${pedido[4] || '-'}</p>
            ${isAdmin ? `<p><span>Cantidad comprada:</span> ${pedido[5] || '-'} Kg.</p>` : ''}
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

    if (isAdmin) {
        // Configurar botón de editar
        const btnEditar = registroCard.querySelector('.btn-editar-registro');
        btnEditar.addEventListener('click', (e) => {
            e.stopPropagation();
            mostrarFormularioEdicion(pedido);
        });

        // Configurar botón de eliminar
        const btnEliminar = registroCard.querySelector('.btn-eliminar-registro');
        btnEliminar.addEventListener('click', async (e) => {
            e.stopPropagation();
            const anuncio = document.querySelector('.anuncio');
            const anuncioContenido = anuncio.querySelector('.anuncio-contenido');
            const overlay = document.querySelector('.overlay');

            anuncioContenido.innerHTML = `
                <h2><i class="fas fa-trash"></i> Eliminación</h2>
                <p>¿Está seguro de eliminar este registro? Esta accion no se puede deshacer.</p>
                <div class="anuncio-botones">
                    <button class="anuncio-btn red confirmar"><i class="fas fa-trash"></i> Eliminar</button>
                    <button class="anuncio-btn close cancelar"><i class="fas fa-times"></i></button>
                </div>
            `;

            anuncio.style.display = 'flex';
            overlay.style.display = 'block';

            const btnConfirmar = anuncio.querySelector('.confirmar');
            const btnCancelar = anuncio.querySelector('.cancelar');

            btnConfirmar.addEventListener('click', async () => {
                try {
                    mostrarCarga();
                    const response = await fetch('/eliminar-registro-pedido', {
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
                }finally{
                    ocultarCarga();
                }
                anuncio.style.display = 'none';
                overlay.style.display = 'none';
            });

            btnCancelar.addEventListener('click', () => {
                anuncio.style.display = 'none';
                overlay.style.display = 'none';
            });
        });
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
function configurarFiltros() {
    const btnFiltro = document.querySelector('.btn-filtro-acopio');
    const anuncio = document.querySelector('.anuncio');
    const anuncioContenido = anuncio.querySelector('.anuncio-contenido');

    btnFiltro.addEventListener('click', () => {
        anuncioContenido.innerHTML = `
            <h2><i class="fas fa-filter"></i> Filtros</h2>
            <div class="filtros-form">
                <div class="campo-form">
                    <label for="filtro-nombre">Nombre del producto:</label>
                    <input type="text" id="filtro-nombre" placeholder="Filtrar por nombre" value="${filtrosActivos.nombre}">
                </div>
                <div class="campo-form">
                    <label for="filtro-fecha-desde">Fecha desde:</label>
                    <input type="date" id="filtro-fecha-desde" value="${filtrosActivos.fechaDesde}">
                </div>
                <div class="campo-form">
                    <label for="filtro-fecha-hasta">Fecha hasta:</label>
                    <input type="date" id="filtro-fecha-hasta" value="${filtrosActivos.fechaHasta}">
                </div>
                <div class="campo-form">
                    <label for="filtro-estado">Estado:</label>
                    <select id="filtro-estado">
                        <option value="todos" ${filtrosActivos.estado === 'todos' ? 'selected' : ''}>Todos los estados</option>
                        <option value="Pendiente" ${filtrosActivos.estado === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
                        <option value="Recibido" ${filtrosActivos.estado === 'Recibido' ? 'selected' : ''}>Recibido</option>
                        <option value="En proceso" ${filtrosActivos.estado === 'En proceso' ? 'selected' : ''}>En proceso</option>
                    </select>
                </div>
            </div>
            <div class="anuncio-botones">
                <button class="anuncio-btn green confirmar">
                    <i class="fas fa-check-circle"></i> Aplicar
                </button>
                <button class="anuncio-btn blue limpiar">
                    <i class="fas fa-eraser"></i> Limpiar
                </button>
                <button class="anuncio-btn close cancelar">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        anuncio.style.display = 'flex';

        // Configurar botones
        const btnConfirmar = anuncio.querySelector('.confirmar');
        const btnLimpiar = anuncio.querySelector('.limpiar');
        const btnCancelar = anuncio.querySelector('.cancelar');

        btnConfirmar.addEventListener('click', () => {
            filtrosActivos = {
                nombre: document.getElementById('filtro-nombre').value.toLowerCase(),
                fechaDesde: document.getElementById('filtro-fecha-desde').value,
                fechaHasta: document.getElementById('filtro-fecha-hasta').value,
                estado: document.getElementById('filtro-estado').value
            };

            aplicarFiltros();
            localStorage.setItem('filtrosRegistros', JSON.stringify(filtrosActivos));

            anuncio.style.display = 'none';
        });

        btnLimpiar.addEventListener('click', () => {
            document.getElementById('filtro-nombre').value = '';
            document.getElementById('filtro-fecha-desde').value = '';
            document.getElementById('filtro-fecha-hasta').value = '';
            document.getElementById('filtro-estado').value = 'todos';

            filtrosActivos = {
                nombre: '',
                fechaDesde: '',
                fechaHasta: '',
                estado: 'todos'
            };

            aplicarFiltros();
            localStorage.removeItem('filtrosRegistros');

            anuncio.style.display = 'none';
        });

        btnCancelar.addEventListener('click', () => {
            anuncio.style.display = 'none';
        });
    });

    // Cargar filtros guardados al iniciar
    const filtrosGuardados = localStorage.getItem('filtrosRegistros');
    if (filtrosGuardados) {
        filtrosActivos = JSON.parse(filtrosGuardados);
        aplicarFiltros();
    }

    // Cerrar al hacer clic fuera del anuncio
    overlay.addEventListener('click', () => {
        anuncio.style.display = 'none';
    });
}
function aplicarFiltros() {
    const registros = document.querySelectorAll('.registro-card');
    registros.forEach(registro => {
        const nombre = registro.querySelector('.registro-producto').textContent.toLowerCase();
        const fecha = registro.dataset.fecha;
        const estado = registro.querySelector('.registro-estado').textContent;

        const cumpleFiltros =
            (!filtrosActivos.nombre || nombre.includes(filtrosActivos.nombre)) &&
            (!filtrosActivos.fechaDesde || fecha >= filtrosActivos.fechaDesde) &&
            (!filtrosActivos.fechaHasta || fecha <= filtrosActivos.fechaHasta) &&
            (filtrosActivos.estado === 'todos' || estado === filtrosActivos.estado);

        registro.style.display = cumpleFiltros ? '' : 'none';
    });

    actualizarContador();
}
function actualizarContador() {
    const registrosVisibles = document.querySelectorAll('.registro-card:not([style*="display: none"])').length;
    const contadores = document.querySelectorAll('.contador');

    // Actualizar todos los contadores en la página
    contadores.forEach(contador => {
        contador.textContent = `${registrosVisibles} pedidos`;
    });
}
function mostrarFormularioEdicion(pedido) {
    const anuncio = document.querySelector('.anuncio');
    const anuncioContenido = anuncio.querySelector('.anuncio-contenido');
    const overlay = document.querySelector('.overlay');

    anuncioContenido.innerHTML = `
        <h2><i class="fas fa-edit"></i> Editar Registro</h2>
        <div class="edicion-form">
            <div class="campo-form">
                <label for="edit-nombre">Nombre:</label>
                <input type="text" id="edit-nombre" value="${pedido[2] || ''}">
            </div>
            <div class="campo-form">
                <label for="edit-cantidad">Cantidad:</label>
                <input type="number" id="edit-cantidad" value="${pedido[3] || ''}">
            </div>
            <div class="campo-form">
                <label for="edit-observaciones">Obs:</label>
                <textarea id="edit-observaciones">${pedido[4] || ''}</textarea>
            </div>
            <div class="campo-form">
                <label for="edit-cantidad-entregada">Cantidad Entregada:</label>
                <input type="number" id="edit-cantidad-entregada" value="${pedido[5] || ''}">
            </div>
            <div class="campo-form">
                <label for="edit-proveedor">Proveedor:</label>
                <input type="text" id="edit-proveedor" value="${pedido[6] || ''}">
            </div>
            <div class="campo-form">
                <label for="edit-costo">Costo:</label>
                <input type="number" id="edit-costo" value="${pedido[7] || ''}">
            </div>
            <div class="campo-form">
                <label for="edit-estado">Estado:</label>
                <select id="edit-estado">
                    <option value="Pendiente" ${pedido[8] === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
                    <option value="En proceso" ${pedido[8] === 'En proceso' ? 'selected' : ''}>En proceso</option>
                    <option value="Recibido" ${pedido[8] === 'Recibido' ? 'selected' : ''}>Recibido</option>
                </select>
            </div>
            <div class="campo-form">
                <label for="edit-detalles">Detalles:</label>
                <textarea id="edit-detalles">${pedido[9] || ''}</textarea>
            </div>
           <div class="campo-form">
                <label for="edit-cantidad-compras">Cantidad Compras:</label>
                <input type="number" id="edit-cantidad-compras" value="${pedido[10] || ''}">
            </div>
            <div class="campo-form">
                <label for="edit-medida">Medida:</label>
                <input type="text" id="edit-medida" value="${pedido[11] || ''}">
            </div>
            <div class="campo-form">
                <label for="edit-entregado">Entregado:</label>
                <input type="text" id="edit-entregado" value="${pedido[12] || ''}">
            </div>
        </div>
        <div class="anuncio-botones">
            <button class="anuncio-btn green guardar"><i class="fas fa-save"></i> Guardar</button>
            <button class="anuncio-btn close cancelar"><i class="fas fa-times"></i></button>
        </div>
    `;

    anuncio.style.display = 'flex';


    // Configure buttons
    const btnGuardar = anuncio.querySelector('.guardar');
    const btnCancelar = anuncio.querySelector('.cancelar');

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
        }finally{
            ocultarCarga();
        }

        anuncio.style.display = 'none';
        overlay.style.display = 'none';
    });

    btnCancelar.addEventListener('click', () => {
        anuncio.style.display = 'none';
        overlay.style.display = 'none';
    });
}


