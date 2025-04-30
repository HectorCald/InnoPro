

/* =============== FUNCIONES PARA OBTENER OTDA LA INFORMACION=============== */
async function cargarTareas() {
    try {
        mostrarCarga();
        const response = await fetch('/obtener-productos-tareas');
        if (!response.ok) throw new Error('Error al cargar productos');
        const data = await response.json();
        window.tareas = data.tareas;

    } catch (error) {
        console.error('Error al cargar productos:', error);
        mostrarNotificacion('Error al cargar productos', 'error');
    } finally {
    }
}
async function cargarRegistrosTareasDB() {
    try {
        mostrarCarga();
        const response = await fetch('/obtener-registros-tareas');
        if (!response.ok) throw new Error('Error al cargar productos');
        const data = await response.json();
        window.registrosTareas = data.tareas;

    } catch (error) {
        console.error('Error al cargar productos:', error);
        mostrarNotificacion('Error al cargar productos', 'error');
    } finally {
    }
}
async function cargarProcedimientos() {
    try {
        mostrarCarga();
        const response = await fetch('/obtener-tareas');
        if (!response.ok) throw new Error('Error al cargar productos');
        const data = await response.json();
        window.procedimiento = data.tareas;

    } catch (error) {
        console.error('Error al cargar productos:', error);
        mostrarNotificacion('Error al cargar productos', 'error');
    } finally {
        ocultarCarga();
    }
}

/* =============== FUNCIONES DE INICIALICAZION=============== */
export function inicializarTareas() {
    const container = document.querySelector('.tareasAcopio-view');

    container.innerHTML = `
        <div class="title">
            <h3><i class="fas fa-tasks"></i> Tareas Acopio</h3>
        </div>
        <div class="ta-container">
            <div class="ta-botones">
                <div class="cuadro-btn">
                    <button class="btn-ta btn-registrar-ta">
                        <i class="fas fa-play"></i>
                    </button>
                    <p>Iniciar</p>
                </div>
                <div class="cuadro-btn">
                    <button class="btn-ta btn-agregar-ta">
                        <i class="fas fa-tasks"></i>
                    </button>
                    <p>Tarea</p>
                </div>
            </div>    
            <div class="lista-registros">
                <div class="ta-header">
                    <div class="search-bar">
                        <input type="text" id="search-ta" placeholder="Buscar registro...">
                        <i class="fas fa-search search-icon-ta"></i>
                    </div>
                    <p class="nota-input"><i class="fas fa-info-circle"></i> Si quieres filtrar por fecha escribe en el buscador (dia-mes-año)</p>
                </div>
                <div class="registros-grid" id="registrosContainer">
                </div>
            </div>
        </div>
    `;

    cargarTareas();
    cargarProcedimientos();
    configurarBusquedaTarea();
    cargarRegistrosTarea();




    // Fix: Change selector to match the button class in the template
    const btnRegistrar = container.querySelector('.btn-registrar-ta');
    btnRegistrar.onclick = mostrarFormularioRegistroTareas;
    const btnTarea = container.querySelector('.btn-agregar-ta');
    btnTarea.onclick = mostrarFormularioAgregarTarea;
}
function configurarBusquedaTarea() {
    const searchInput = document.getElementById('search-ta');
    const searchIcon = document.querySelector('.search-icon-ta');

    function mostrarTodasLasCards() {
        const registros = document.querySelectorAll('.registro-card');
        registros.forEach(registro => {
            registro.style.display = 'block';
            const id = registro.querySelector('.registro-id').textContent;
            const registroData = window.registrosTareas.find(r => r.id.toString() === id);
            if (registroData) {
                registro.onclick = () => mostrarDetalleRegistroTarea(registroData);
            }
        });
    }
    function buscarPorFecha(searchTerm, fechaRegistro) {
        // Convertir fecha del registro a formato comparable
        const [año, mes, dia] = fechaRegistro.split('-');
        
        // Patrones de búsqueda de fecha
        const patronCompleto = /^(\d{2})-(\d{2})-(\d{4})$/;  // 24-03-2025
        const patronCorto = /^(\d{2})-(\d{2})$/;             // 24-03
        const patronSoloMes = /^(\d{2})$/;                   // 03

        if (patronCompleto.test(searchTerm)) {
            const [, dBusqueda, mBusqueda, aBusqueda] = searchTerm.match(patronCompleto);
            return dia === dBusqueda && mes === mBusqueda && año === aBusqueda;
        } else if (patronCorto.test(searchTerm)) {
            const [, dBusqueda, mBusqueda] = searchTerm.match(patronCorto);
            return dia === dBusqueda && mes === mBusqueda;
        } else if (patronSoloMes.test(searchTerm)) {
            return mes === searchTerm;
        }
        return false;
    }

    searchInput.addEventListener('input', (e) => {
        const searchTerm = normalizarTexto(e.target.value);
        const registros = document.querySelectorAll('.registro-card');
        let registrosEncontrados = false;

        if (e.target.value.length > 0) {
            searchIcon.classList.remove('fa-search');
            searchIcon.classList.add('fa-times');
        } else {
            searchIcon.classList.remove('fa-times');
            searchIcon.classList.add('fa-search');
            mostrarTodasLasCards();
            const noResultsMessage = document.querySelector('.no-results-message');
            if (noResultsMessage) noResultsMessage.remove();
            return;
        }

        registros.forEach(registro => {
            const nombre = normalizarTexto(registro.querySelector('.registro-nombre span').textContent);
            const id = normalizarTexto(registro.querySelector('.registro-id').textContent);
            const fecha = registro.querySelector('.registro-fecha').textContent;

            if (nombre.includes(searchTerm) ||
                id.includes(searchTerm) ||
                buscarPorFecha(searchTerm, fecha)) {
                registro.style.display = 'block';
                registrosEncontrados = true;
                const registroData = window.registrosTareas.find(r => r.id.toString() === id);
                if (registroData) {
                    registro.onclick = () => mostrarDetalleRegistroTarea(registroData);
                }
            } else {
                registro.style.display = 'none';
            }
        });

        mostrarMensajeNoResultados(registrosEncontrados, e.target.value);
    });

    searchIcon.addEventListener('click', () => {
        if (searchInput.value.length > 0) {
            searchInput.value = '';
            searchIcon.classList.remove('fa-times');
            searchIcon.classList.add('fa-search');
            mostrarTodasLasCards();
            const noResultsMessage = document.querySelector('.no-results-message');
            if (noResultsMessage) noResultsMessage.remove();
        }
    });

    searchInput.addEventListener('focus', () => {
        const almacenView = document.querySelector('.almacen-view');
        if (almacenView) {
            const searchBarPosition = searchInput.getBoundingClientRect().top + window.scrollY;
            almacenView.scrollTo({
                top: searchBarPosition - 70,
                behavior: 'smooth'
            });
            searchIcon.style.color = '#f37500';
        }
    });

    searchInput.addEventListener('blur', () => {
        searchIcon.style.color = 'gray';
    });
}
function normalizarTexto(texto) {
    return texto.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}
function mostrarMensajeNoResultados(encontrados, busqueda) {
    const container = document.getElementById('registrosContainer');
    const mensajeExistente = document.querySelector('.no-results-message');

    if (!encontrados && busqueda) {
        if (!mensajeExistente) {
            container.innerHTML += `
                <div class="no-results-message">
                    <i class="fas fa-search"></i>
                    <p>No se encontraron registros que contengan "${busqueda}"</p>
                </div>
            `;
        }
    } else if (mensajeExistente) {
        mensajeExistente.remove();
    }
}
async function cargarRegistrosTarea() {
    try {
        await cargarRegistrosTareasDB();
        const container = document.getElementById('registrosContainer');
        mostrarCarga();

        const registros = window.registrosTareas;

        // Verificar si hay datos
        if (!registros || registros.length === 0) {
            container.innerHTML = '<div class="no-results-message">No hay registros disponibles</div>';
            return;
        }

        // Ordenar registros por ID (formato TA-X) de mayor a menor
        const registrosOrdenados = [...registros].sort((a, b) => {
            const idA = parseInt(a.id.split('-')[1]);
            const idB = parseInt(b.id.split('-')[1]);
            return idB - idA;  // Orden descendente
        });

        container.innerHTML = '';
        registrosOrdenados.forEach(registro => {
            const card = crearRegistroCardTarea(registro);
            container.appendChild(card);
        });

    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error al cargar registros de tareas', 'error');
    } finally {
        ocultarCarga();
    }
}
function crearRegistroCardTarea(registro) {
    const div = document.createElement('div');
    div.className = 'registro-card';

    let tiempoInfo;
    if (registro.horaFin) {
        const inicio = new Date(`2000/01/01 ${registro.horaInicio}`);
        const fin = new Date(`2000/01/01 ${registro.horaFin}`);
        const diff = Math.abs(fin - inicio);
        const horas = Math.floor(diff / 3600000);
        const minutos = Math.floor((diff % 3600000) / 60000);
        tiempoInfo = `
                    <span class="tiempo"><i class="fas fa-clock"></i> ${horas}h ${minutos}m</span>`;
    } else {
        tiempoInfo = '';
    }

    // Calculate procedures count
    const procedimientosCount = registro.procedimiento ? registro.procedimiento.split(',').length : 0;
    const procedimientosInfo = `
            
            <span class="procedimientos"><i class="fas fa-tasks"></i> ${procedimientosCount}</span>
    `;

    div.innerHTML = `
        <div class="registro-header">
            <span class="registro-id">${registro.id}</span>
            <span class="registro-fecha">${registro.fecha}</span>
        </div>
        <div class="registro-info">
            <div class="registro-nombre">
                <i class="fas fa-mortar-pestle"></i>
                <span>${registro.nombre}</span>
            </div>
            <div class="registro-ta">
                ${procedimientosInfo}
                ${tiempoInfo}
            </div>
        </div>
    `;

    div.addEventListener('click', () => mostrarDetalleRegistroTarea(registro));
    return div;
}

/* =============== FUNCIONES DE DETALLES, EDICION, ELIMINACION Y FINALICACION DE TAREA=============== */
function mostrarDetalleRegistroTarea(registro) {
    // Calculate elapsed time if horaFin exists
    let tiempoInfo = '';
    if (registro.horaFin) {
        const inicio = new Date(`2000/01/01 ${registro.horaInicio}`);
        const fin = new Date(`2000/01/01 ${registro.horaFin}`);
        const diff = Math.abs(fin - inicio);
        const horas = Math.floor(diff / 3600000);
        const minutos = Math.floor((diff % 3600000) / 60000);
        tiempoInfo = `
            <div class="detalle-item">
                <p>Tiempo transcurrido:</p><span>${horas}h ${minutos}m</span>
            </div>`;
    }

    const anuncio = document.querySelector('.anuncio');
    const contenido = anuncio.querySelector('.anuncio-contenido');

    contenido.innerHTML = `
        <div class="encabezado">
            <h2>Detalle de Tarea</h2>
            <button class="anuncio-btn close" onclick="ocultarAnuncio()">
                <i class="fas fa-arrow-right"></i>
            </button>
        </div>
        <div class="relleno">
            <div class="detalles-grup">
                <div class="detalle-item">
                    <p>ID:</p><span>${registro.id}</span>
                </div>
                <div class="detalle-item">
                    <p>Fecha:</p><span>${registro.fecha}</span>
                </div>
                <div class="detalle-item">
                    <p>Nombre:</p><span>${registro.nombre}</span>
                </div>
                <div class="detalle-item">
                    <p>Hora Inicio:</p><span>${registro.horaInicio}</span>
                </div>
                ${registro.horaFin ? `
                <div class="detalle-item">
                    <p>Hora Fin:</p><span>${registro.horaFin}</span>
                </div>
                ${tiempoInfo}` : ''}
            </div>
            ${!registro.horaFin ? `
                <div class="procedimientos-container">
                    <p><strong>Agregar Procedimientos:</strong></p>
                    <div class="procedimiento-input-container">
                        <input type="text" id="procedimientoInput" class="edit-input" placeholder="Buscar procedimiento...">
                        <div class="sugerencias-container">
                            <div class="procedimientos-list sugerencias-list"></div>
                        </div>
                        
                    </div>
                    <div class="procedimientos-seleccionados detalles-grup" ></div>
                </div>
                <div class="observaciones-container">
                    <p><strong>Observaciones:</strong></p>
                    <textarea id="observacionesInput" class="edit-input" rows="3"></textarea>
                </div>
            ` : `
                <p class="subtitle">Procedimientos</p>
                <div class="procedimientos-container detalles-grup">
                    <div class="procedimientos-lista ">
                        ${registro.procedimiento ? registro.procedimiento.split(',').map(proc =>
        `<p class="procedimiento-tag">-${proc.trim()}</p>`
    ).join('') : 'No hay procedimientos registrados'}
                    </div>
                </div>
                ${registro.observaciones ? `
                <p class="subtitle">Observaciones</p>
                    <div class="observaciones-container detalles-grup">
                        
                        <p>${registro.observaciones}</p>
                    </div>
                ` : ''}
            `}
        </div>
        <div class="anuncio-botones">
            ${registro.horaFin ? `
                <button class="anuncio-btn blue editar">
                    <i class="fas fa-edit"></i> Editar
                </button>
            ` : `
                <button class="anuncio-btn green finalizar">
                    <i class="fas fa-check"></i> Finalizar
                </button>
            `}
            <button class="anuncio-btn red eliminar">
                <i class="fas fa-trash"></i> Eliminar
            </button>
        </div>
    `;

    mostrarAnuncio();

    if (!registro.horaFin) {
        configurarProcedimientos(registro);
    }

    // Event listeners
    const btnFinalizar = contenido.querySelector('.finalizar');
    const btnEditar = contenido.querySelector('.editar');
    const btnEliminar = contenido.querySelector('.eliminar');

    if (btnFinalizar) {
        btnFinalizar.onclick = () => finalizarTarea(registro);
    }

    if (btnEditar) {
        btnEditar.onclick = () => editarTarea(registro);
    }

    if (btnEliminar) {
        btnEliminar.onclick = () => eliminarTarea(registro);
    }
    function configurarProcedimientos(registro) {
        const input = document.getElementById('procedimientoInput');
        const lista = document.querySelector('.procedimientos-list');
        const container = document.querySelector('.sugerencias-container');
        const seleccionados = document.querySelector('.procedimientos-seleccionados');
        const procedimientosSeleccionados = new Set();

        // Initialize with existing procedures if any
        if (registro.procedimiento) {
            registro.procedimiento.split(',').forEach(proc => {
                procedimientosSeleccionados.add(proc.trim());
            });
            actualizarProcedimientosSeleccionados();
        }

        input.addEventListener('input', () => {
            const busqueda = input.value.toLowerCase().trim();
            if (busqueda.length < 2) {
                lista.style.display = 'none';
                container.style.display = 'none';
                return;
            }

            const procedimientosFiltrados = window.procedimiento.filter(proc =>
                proc.nombre.toLowerCase().includes(busqueda) &&
                !procedimientosSeleccionados.has(proc.nombre) // Don't show already selected procedures
            );

            lista.innerHTML = procedimientosFiltrados.map(proc => `
            <li class="procedimiento-item" data-id="${proc.id}" data-nombre="${proc.nombre}">
                ${proc.nombre}
            </li>
        `).join('');

            if (procedimientosFiltrados.length > 0) {
                lista.style.display = 'flex';
                container.style.display = 'flex';
            } else {
                lista.innerHTML = '<li class="no-results">No se encontraron procedimientos</li>';
                lista.style.display = 'flex';
                container.style.display = 'flex';
            }

            lista.querySelectorAll('.procedimiento-item').forEach(item => {
                item.onclick = () => agregarProcedimiento(item.dataset.nombre);
            });
        });

        // Handle keyboard navigation
        input.addEventListener('keydown', (e) => {
            const items = lista.querySelectorAll('.procedimiento-item');
            const currentIndex = Array.from(items).findIndex(item =>
                item.classList.contains('selected'));

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    if (currentIndex < items.length - 1) {
                        if (currentIndex >= 0) items[currentIndex].classList.remove('selected');
                        items[currentIndex + 1].classList.add('selected');
                    }
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    if (currentIndex > 0) {
                        items[currentIndex].classList.remove('selected');
                        items[currentIndex - 1].classList.add('selected');
                    }
                    break;
                case 'Enter':
                    e.preventDefault();
                    const selectedItem = lista.querySelector('.procedimiento-item.selected');
                    if (selectedItem) {
                        agregarProcedimiento(selectedItem.dataset.nombre);
                    }
                    break;
                case 'Escape':
                    lista.style.display = 'none';
                    container.style.display = 'none';
                    input.value = '';
                    break;
            }
        });

        // Close suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (!input.contains(e.target) && !container.contains(e.target)) {
                lista.style.display = 'none';
                container.style.display = 'none';
            }
        });

        function agregarProcedimiento(nombre) {
            if (!procedimientosSeleccionados.has(nombre)) {
                procedimientosSeleccionados.add(nombre);
                actualizarProcedimientosSeleccionados();
            }
            input.value = '';
            lista.style.display = 'none';
            container.style.display = 'none';
        }

        function actualizarProcedimientosSeleccionados() {
            seleccionados.innerHTML = Array.from(procedimientosSeleccionados).map(proc => `
            <div class="procedimiento-tag detalle-item">
                <p>${proc}</p>
                <i class="fas fa-trash delete" onclick="eliminarProcedimiento('${proc}')"></i>
            </div>
        `).join('');
        }

        window.eliminarProcedimiento = (nombre) => {
            procedimientosSeleccionados.delete(nombre);
            actualizarProcedimientosSeleccionados();
        };

        return {
            getProcedimientos: () => Array.from(procedimientosSeleccionados)
        };
    }

    async function editarTarea(registro) {
        const anuncio = document.querySelector('.anuncio');
        const contenido = anuncio.querySelector('.anuncio-contenido');

        contenido.innerHTML = `
        <div class="encabezado">
            <h2>Editar Tarea</h2>
            <button class="anuncio-btn close" onclick="ocultarAnuncio()">
                <i class="fas fa-arrow-right"></i>
            </button>
        </div>
        <div class="relleno">
            <div class="detalles-grup">
                <div class="detalle-item">
                    <p>ID:</p><span>${registro.id}</span>
                </div>
                <div class="detalle-item">
                    <p>Fecha:</p><span>${registro.fecha}</span>
                </div>
                <div class="detalle-item">
                    <p>Nombre:</p><span>${registro.nombre}</span>
                </div>
                <div class="detalle-item">
                    <p>Hora Inicio:</p><span>${registro.horaInicio}</span>
                </div>
                <div class="detalle-item">
                    <p>Hora Fin:</p><span>${registro.horaFin}</span>
                </div>
            </div>
            <p class="subtitle">Procedimientos</p>
            <div class="procedimientos-container">
                <div class="procedimiento-input-container">
                    <input type="text" id="procedimientoInput" class="edit-input" placeholder="Buscar procedimiento...">
                    <div class="sugerencias-container">
                        <div class="procedimientos-list sugerencias-list"></div>
                    </div>
                </div>
                <div class="procedimientos-seleccionados detalles-grup">
                    ${registro.procedimiento ? registro.procedimiento.split(',').map(proc => `
                        <div class="procedimiento-tag detalle-item">
                            <p>${proc.trim()}</p>
                            <i class="fas fa-trash delete" onclick="eliminarProcedimiento('${proc.trim()}')"></i>
                        </div>
                    `).join('') : ''}
                </div>
            </div>
            <p class="subtitle">Observaciones</p>
            <div class="observaciones-container">
                <textarea id="observacionesInput" class="edit-input" rows="3">${registro.observaciones || ''}</textarea>
            </div>
        </div>
        <div class="anuncio-botones">
            <button class="anuncio-btn blue guardar">
                <i class="fas fa-save"></i> Guardar
            </button>
        </div>
    `;

        mostrarAnuncio();
        configurarProcedimientos(registro);

        // Configurar botón de guardar
        const btnGuardar = contenido.querySelector('.guardar');
        btnGuardar.onclick = async () => {
            try {
                mostrarCarga();
                const procedimientos = Array.from(document.querySelectorAll('.procedimiento-tag p'))
                    .map(tag => tag.textContent.trim())
                    .join(',');
                const observaciones = document.getElementById('observacionesInput').value;

                const response = await fetch('/editar-tarea-acopio', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        id: registro.id,
                        procedimientos,
                        observaciones
                    })
                });

                if (!response.ok) throw new Error('Error al editar tarea');

                mostrarNotificacion('Tarea editada correctamente', 'success');
                ocultarAnuncio();
                cargarRegistrosTarea();
            } catch (error) {
                console.error('Error:', error);
                mostrarNotificacion('Error al editar la tarea', 'error');
            } finally {
                ocultarCarga();
            }
        };
    }

    async function eliminarTarea(registro) {
        const anuncio = document.querySelector('.anuncio-down');
        const contenido = anuncio.querySelector('.anuncio-contenido');

        contenido.innerHTML = `
        <div class="encabezado">
            <h2>Eliminar Tarea?</h2>
            <button class="anuncio-btn close" onclick="ocultarAnuncioDown()">
                <i class="fas fa-arrow-down"></i>
            </button>
        </div>
        <div class="detalles-grup">
            <p>Estas seguro de eliminar las tareas del prodcuto "${registro.nombre}"?</p>
            <p>Esta acción no se puede deshacer.</p>
        </div>
        <div class="anuncio-botones">
            <button class="anuncio-btn red confirmar-eliminar">
                <i class="fas fa-trash"></i> Confirmar
            </button>
        </div>
    `;

        mostrarAnuncioDown();

        // Configurar botones
        const btnConfirmar = contenido.querySelector('.confirmar-eliminar');

        btnConfirmar.onclick = async () => {
            try {
                mostrarCarga();
                const response = await fetch('/eliminar-tarea-acopio', {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        id: registro.id
                    })
                });

                if (!response.ok) throw new Error('Error al eliminar tarea');

                mostrarNotificacion('Tarea eliminada correctamente', 'success');
                ocultarAnuncioDown();
                cargarRegistrosTarea();
            } catch (error) {
                console.error('Error:', error);
                mostrarNotificacion('Error al eliminar la tarea', 'error');
            } finally {
                ocultarCarga();
            }
        };
    }

    async function finalizarTarea(registro) {
        const procedimientos = Array.from(document.querySelectorAll('.procedimiento-tag'))
            .map(tag => tag.textContent.trim())
            .join(',');
        const observaciones = document.getElementById('observacionesInput').value;
        const horaFin = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

        try {
            mostrarCarga();
            const response = await fetch('/finalizar-tarea-acopio', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id: registro.id,
                    horaFin,
                    procedimientos,
                    observaciones
                })
            });

            if (!response.ok) throw new Error('Error al finalizar tarea');

            mostrarNotificacion('Tarea finalizada correctamente', 'success');
            ocultarAnuncio();
            cargarRegistrosTarea();
        } catch (error) {
            console.error('Error:', error);
            mostrarNotificacion('Error al finalizar la tarea', 'error');
            ocultarCarga();
        }
    }
}

/* =============== FUNCIONES NUEVO REGISTRO =============== */
function mostrarFormularioRegistroTareas() {
    const anuncio = document.querySelector('.anuncio');
    const contenido = anuncio.querySelector('.anuncio-contenido');

    contenido.innerHTML = `
        <div class="encabezado">
            <h2>Nueva Tarea</h2>
            <button class="anuncio-btn close" onclick="ocultarAnuncio()">
                <i class="fas fa-arrow-right"></i></button>
        </div>
        <div class="relleno">
            <p>Fecha</p>
            <input type="date" id="fechaMP" class="edit-input" value="${new Date().toISOString().split('T')[0]}" readonly>

            <p>Busca y selecciona el producto</p>
            <input class="buscarTarea" type="text" id="tarea">
            <div class="sugerencias-container">
            <div class="sugerencias-list"></div>
            </div>
        </div>
        <div class="anuncio-botones">
            <button class="anuncio-btn green iniciar">
                <i class="fas fa-save"></i> Inciar tarea
            </button>
        </div>
    `;

    mostrarAnuncio();


    configurarBuscadorTareas();
    configurarBotonesGuardar();

    function configurarBuscadorTareas() {
        const inputBuscar = document.getElementById('tarea');
        const sugerenciasContainer = document.querySelector('.sugerencias-container');
        const sugerencias = document.querySelector('.sugerencias-list');
        const btnIniciar = document.querySelector('.iniciar');

        let tareas = window.tareas || [];

        inputBuscar.addEventListener('input', () => {
            const busqueda = inputBuscar.value.toLowerCase().trim();

            if (busqueda.length < 2) {
                sugerencias.style.display = 'none';
                sugerenciasContainer.style.display = 'none';
                btnIniciar.disabled = true;
                return;
            }

            const tareasFiltradas = tareas.filter(tarea =>
                tarea.nombre.toLowerCase().includes(busqueda)
            );

            if (tareasFiltradas.length > 0) {
                sugerencias.innerHTML = `
                ${tareasFiltradas.map(tarea => `
                    <li class="sugerencia-item" data-id="${tarea.id}" data-nombre="${tarea.nombre}">
                        ${tarea.nombre}
                    </li>
                `).join('')}
            `;
                sugerencias.style.display = 'flex';
                sugerenciasContainer.style.display = 'flex';

                // Event delegation for suggestion clicks
                sugerencias.onclick = (e) => {
                    const item = e.target.closest('.sugerencia-item');
                    if (item) {
                        const nombre = item.dataset.nombre;
                        inputBuscar.value = nombre;
                        btnIniciar.disabled = false;
                        sugerencias.style.display = 'none';
                        sugerenciasContainer.style.display = 'none';
                    }
                };
            } else {
                sugerencias.innerHTML = '<div class="no-sugerencias">No se encontraron tareas</div>';
                sugerencias.style.display = 'flex';
                sugerenciasContainer.style.display = 'flex';
                btnIniciar.disabled = true;
            }
        });

        // Clear input and suggestions when clicking the input
        inputBuscar.addEventListener('focus', () => {
            if (inputBuscar.value.length < 2) {
                sugerencias.style.display = 'none';
                sugerenciasContainer.style.display = 'none';
            }
        });

        // Close suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (!inputBuscar.contains(e.target) &&
                !sugerenciasContainer.contains(e.target)) {
                sugerencias.style.display = 'none';
                sugerenciasContainer.style.display = 'none';
            }
        });

        // Handle keyboard navigation
        inputBuscar.addEventListener('keydown', (e) => {
            const items = sugerencias.querySelectorAll('.sugerencia-item');
            const currentIndex = Array.from(items).findIndex(item =>
                item.classList.contains('selected'));

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    if (currentIndex < items.length - 1) {
                        if (currentIndex >= 0) items[currentIndex].classList.remove('selected');
                        items[currentIndex + 1].classList.add('selected');
                    }
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    if (currentIndex > 0) {
                        items[currentIndex].classList.remove('selected');
                        items[currentIndex - 1].classList.add('selected');
                    }
                    break;
                case 'Enter':
                    e.preventDefault();
                    const selectedItem = sugerencias.querySelector('.sugerencia-item.selected');
                    if (selectedItem) {
                        inputBuscar.value = selectedItem.dataset.nombre;
                        btnIniciar.disabled = false;
                        sugerencias.style.display = 'none';
                        sugerenciasContainer.style.display = 'none';
                    }
                    break;
            }
        });
    }
    function configurarBotonesGuardar() {
        const btnIniciar = document.querySelector('.iniciar');
        const inputBuscar = document.getElementById('tarea');
        const inputFecha = document.getElementById('fechaMP');

        btnIniciar.onclick = async () => {
            const fecha = inputFecha.value;
            const nombre = inputBuscar.value;
            const horaInicio = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

            if (!fecha || !nombre) {
                mostrarNotificacion('Por favor complete todos los campos', 'error');
                return;
            }

            const registro = {
                fecha,
                nombre,
                horaInicio,
                horaFin: '',
                procedimiento: '',
                observaciones: ''
            };

            try {
                mostrarCarga();
                const response = await fetch('/registrar-tarea-acopio', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(registro)
                });

                const data = await response.json();
                if (!response.ok) throw new Error(data.error || 'Error al guardar');

                mostrarNotificacion('¡Tarea iniciada exitosamente!', 'success');
                ocultarAnuncio();
                cargarRegistrosTarea();
            } catch (error) {
                console.error('Error:', error);
                mostrarNotificacion('Error al iniciar la tarea', 'error');
            } finally {
                ocultarCarga();
            }
        };
    }
}

/* =============== FUNCIONES DE AGREGAR UNA TAREA A LA LISTA, CARGAR, MOSTRAR Y ELIMINAR =============== */
function mostrarFormularioAgregarTarea() {
    const anuncio = document.querySelector('.anuncio');
    const contenido = anuncio.querySelector('.anuncio-contenido');


    contenido.innerHTML = `
        <div class="encabezado">
            <h2>Agregar tarea a la lista</h2>
            <button class="anuncio-btn close" onclick="ocultarAnuncio()">
                <i class="fas fa-arrow-right"></i></button>
        </div>
        <div class="relleno">
                <p>Nueva Tarea:</p>
                <div class="detalle-item">
                    <input type="text" id="nombreTarea" class="edit-input" placeholder="Nombre de la tarea">
                    <small id="tareaDisponible" style="display: none;"></small>
                </div>
            <div id="listaTareas" class="sugerencias-list" style="display: none; flex-direction:column; height:100%; gap:5px">
                <!-- Aquí se cargarán las tareas existentes -->
            </div>
        </div>
        <div class="anuncio-botones">
            <button class="anuncio-btn blue ver-tareas"><i class="fas fa-eye"></i> Ver Tareas</button>
            <button class="anuncio-btn green agregar"><i class="fas fa-plus"></i> Agregar</button>
        </div>
    `;

    mostrarAnuncio();

    const inputTarea = document.getElementById('nombreTarea');
    const mensajeDisponible = document.getElementById('tareaDisponible');
    const btnVerTareas = contenido.querySelector('.ver-tareas');
    const btnAgregar = contenido.querySelector('.agregar');
    const listaTareas = document.getElementById('listaTareas');
    let tareasVisible = false;
    let timeoutId = null;

    inputTarea.addEventListener('input', async () => {
        const nombre = inputTarea.value.trim();
        mensajeDisponible.style.display = nombre ? 'block' : 'none';

        // Limpiar el timeout anterior si existe
        if (timeoutId) clearTimeout(timeoutId);

        if (nombre) {
            // Mostrar indicador de carga mientras se verifica
            mensajeDisponible.innerHTML = '<i class="fas fa-spinner fa-spin" style="color: #666; font-size: 1.2em; border:none;"></i>';

            // Esperar 300ms después de que el usuario deje de escribir
            timeoutId = setTimeout(async () => {
                const nombreNormalizado = nombre.toLowerCase()
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .trim();

                const response = await fetch('/verificar-tarea', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        nombre: nombre,
                        nombreNormalizado: nombreNormalizado
                    })
                });
                const data = await response.json();

                if (data.disponible) {
                    mensajeDisponible.innerHTML = '<i class="fas fa-check-circle" style="color: #28a745; font-size: 1.2em; border:none;"></i>';
                } else {
                    mensajeDisponible.innerHTML = '<i class="fas fa-times-circle" style="color: #dc3545; font-size: 1.2em; border:none;"></i>';
                }
            }, 300);
        }
    });
    btnVerTareas.onclick = async () => {
        if (!tareasVisible) {
            await cargarTareas();
            listaTareas.style.display = 'flex';
            btnVerTareas.innerHTML = '<i class="fas fa-eye-slash"></i> Ocultar Tareas';
        } else {
            listaTareas.style.display = 'none';
            btnVerTareas.innerHTML = '<i class="fas fa-eye"></i> Ver Tareas';
        }
        tareasVisible = !tareasVisible;
    };
    btnAgregar.onclick = agregarNuevaTarea;

    async function cargarTareas() {
        const container = document.getElementById('listaTareas');
        try {
            mostrarCarga();
            const response = await fetch('/obtener-tareas');
            const data = await response.json();
    
            container.innerHTML = data.tareas.map(tarea => `
                <div class="detalle-item" style="padding-bottom:10px; background-color:#242424; padding:10px; border-radius:10px">
                    <span style="text-align:left">${tarea.nombre}</span>
                    <i class="fas fa-trash delete" onclick="eliminarTarea('${tarea.id}')"></i>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error:', error);
            mostrarNotificacion('Error al cargar las tareas', 'error');
        } finally {
            ocultarCarga();
        }
    }
    async function agregarNuevaTarea() {
        const nombre = document.getElementById('nombreTarea').value.trim();
        if (!nombre) {
            mostrarNotificacion('Ingrese un nombre para la tarea', 'error');
            return;
        }
    
        try {
            mostrarCarga();
            const response = await fetch('/agregar-tarea', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre })
            });
    
            const data = await response.json();
            if (data.success) {
                mostrarNotificacion('Tarea agregada correctamente', 'success');
                document.getElementById('nombreTarea').value = '';
                cargarTareas();
            }
        } catch (error) {
            console.error('Error:', error);
            mostrarNotificacion('Error al agregar la tarea', 'error');
        } finally {
            ocultarCarga();
        }
    }
    window.eliminarTarea = async (id) => {
        try {
            mostrarCarga();
            const response = await fetch('/eliminar-tarea', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
    
            const data = await response.json();
            if (data.success) {
                mostrarNotificacion('Tarea eliminada correctamente', 'success');
                cargarTareas();
            }
        } catch (error) {
            console.error('Error:', error);
            mostrarNotificacion('Error al eliminar la tarea', 'error');
        } finally {
            ocultarCarga();
        }
    };
    
}
