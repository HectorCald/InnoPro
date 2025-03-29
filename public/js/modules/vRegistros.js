/* ==================== VARIABLES GLOBALES Y CONFIGURACIÓN INICIAL ==================== */
let reglasEspeciales = null;
let preciosBase = null;
let filtrosActivos = {
    nombre: '',
    fechaDesde: '',
    fechaHasta: '',
    estado: 'todos' // 'todos', 'verificados', 'no_verificados'
};

// Exportar funciones al scope global
window.editarRegistro = editarRegistro;
window.formatearFecha = formatearFecha;

/* ==================== FUNCIONES DE INICIALIZACIÓN ==================== */
async function inicializarReglas() {
    try {
        const [responseReglas, responsePrecios] = await Promise.all([
            fetch('/obtener-reglas-especiales'),
            fetch('/obtener-precios-base')
        ]);
        const dataReglas = await responseReglas.json();
        const dataPrecios = await responsePrecios.json();
        
        reglasEspeciales = dataReglas.reglas || [];
        preciosBase = dataPrecios.preciosBase;
    } catch (error) {
        console.error('Error al cargar reglas:', error);
    }
}

/* ==================== FUNCIONES DE CÁLCULO Y UTILIDAD ==================== */
export function calcularTotal(nombre, cantidad, gramaje, seleccion) {
    nombre = (nombre || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "");
    cantidad = parseFloat(cantidad) || 0;
    gramaje = parseFloat(gramaje) || 0;

    // Encontrar todas las reglas que aplican para este producto
    const reglasAplicables = reglasEspeciales?.filter(r => {
        const nombreCoincide = nombre.includes(r.producto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ""));
        const gramajeCumple = r.gramajeMin && r.gramajeMax ? 
            (gramaje >= parseFloat(r.gramajeMin) && gramaje <= parseFloat(r.gramajeMax)) : 
            true;
        return nombreCoincide && gramajeCumple;
    }) || [];

    // Obtener los multiplicadores más altos para cada operación
    const multiplicadores = {
        etiquetado: '1',
        sellado: '1',
        envasado: '1',
        cernido: preciosBase?.cernidoBolsa || '0'
    };

    // Revisar todas las reglas aplicables y usar el multiplicador más alto para cada operación
    reglasAplicables.forEach(regla => {
        multiplicadores.etiquetado = Math.max(parseFloat(multiplicadores.etiquetado), parseFloat(regla.etiquetado || '1')).toString();
        multiplicadores.sellado = Math.max(parseFloat(multiplicadores.sellado), parseFloat(regla.sellado || '1')).toString();
        multiplicadores.envasado = Math.max(parseFloat(multiplicadores.envasado), parseFloat(regla.envasado || '1')).toString();
        multiplicadores.cernido = Math.max(parseFloat(multiplicadores.cernido), parseFloat(regla.cernido || preciosBase?.cernidoBolsa || '0')).toString();
    });

    // Calcular resultados usando los multiplicadores más altos encontrados
    let resultado = cantidad * preciosBase.envasado * parseFloat(multiplicadores.envasado);
    let resultadoEtiquetado = cantidad * preciosBase.etiquetado * parseFloat(multiplicadores.etiquetado);
    let resultadoSellado = cantidad * preciosBase.sellado * parseFloat(multiplicadores.sellado);
    
    let resultadoSernido = 0;
    if (seleccion === 'Cernido') {
        const kilos = (cantidad * gramaje) / 1000;
        resultadoSernido = kilos * parseFloat(multiplicadores.cernido) * 5;
    }

    return {
        total: resultado + resultadoEtiquetado + resultadoSellado + resultadoSernido,
        envasado: resultado,
        etiquetado: resultadoEtiquetado,
        sellado: resultadoSellado,
        cernido: resultadoSernido
    };
}

/* ==================== FUNCIONES DE MANIPULACIÓN DE UI ==================== */
function crearOperarioCard(nombre, registros) {
    const operarioCard = document.createElement('div');
    operarioCard.className = 'fecha-card';

    const operarioHeader = document.createElement('div');
    operarioHeader.className = 'fecha-header';
    operarioHeader.innerHTML = `
        <div class="fecha-info">
            <h3>${nombre}</h3>
            <span class="contador">${registros.length} registros</span>
        </div>
        <i class="fas fa-chevron-down"></i>
    `;
    operarioCard.appendChild(operarioHeader);

    const registrosContainer = document.createElement('div');
    registrosContainer.className = 'registros-grupo';

    operarioHeader.addEventListener('click', () => {
        registrosContainer.classList.toggle('active');
        const icono = operarioHeader.querySelector('.fa-chevron-down');
        icono.style.transform = registrosContainer.classList.contains('active') ? 'rotate(180deg)' : 'rotate(0)';
    });

    return { operarioCard, registrosContainer };
}

function crearRegistroCard(registro, esAdmin) {
    const [dia, mes, año] = registro[0].split('/');
    // Keep the full date format for display
    const fechaFormateada = `${dia}/${mes}/${año}`;
    const estaPagado = registro[12];

    const registroCard = document.createElement('div');
    registroCard.className = 'registro-card';
    registroCard.dataset.fecha = `20${año}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
    registroCard.dataset.producto = registro[1];
    registroCard.dataset.lote = registro[2];
    registroCard.dataset.operario = registro[8];

    // Solo calcular resultados si es admin
    const resultados = esAdmin ? (estaPagado ? {
        total: parseFloat(registro[12]),
        envasado: 0,
        etiquetado: 0,
        sellado: 0,
        cernido: 0
    } : calcularTotal(registro[1], registro[10] ? registro[9] : registro[6], registro[3], registro[4])) : null;

    // Botones para administradores
    const botonesAdmin = esAdmin ? `
        <button onclick="eliminarRegistro('${registro[0]}', '${registro[1]}', '${registro[2]}', '${registro[8]}')" class="btn-eliminar-registro">
            <i class="fas fa-trash"></i> Eliminar
        </button>
        <button onclick="editarRegistro('${registro[0]}', '${registro[1]}', '${registro[2]}', '${registro[8]}', '${registro[3]}', '${registro[4]}', '${registro[5]}', '${registro[6]}', '${registro[7]}', '${registro[9] || ''}', '${registro[10] || ''}')" class="btn-editar-registro">
            <i class="fas fa-edit"></i> Editar
        </button>
        ${registro[10] ? `
            <button onclick="pagarRegistro('${registro[0]}', '${registro[1]}', '${registro[2]}', '${registro[8]}', '${registro[3]}', '${registro[9]}')" 
                class="btn-pagar-registro"
                ${estaPagado ? 'disabled style="background-color: #888; cursor: not-allowed;"' : ''}>
                <i class="fas fa-dollar-sign"></i> Pagar
            </button>
        ` : ''}` : '';

    // Botón de eliminar para usuarios normales (solo si no está verificado)
    const botonEliminarUsuario = !esAdmin && !registro[10] ? `
        <button onclick="eliminarRegistro('${registro[0]}', '${registro[1]}', '${registro[2]}', '${registro[8]}')" class="btn-eliminar-registro">
            <i class="fas fa-trash"></i> Eliminar
        </button>
    ` : '';

    registroCard.innerHTML = `
        <div class="registro-header">
            ${registro[10] ? '<i class="fas fa-check-circle verificado-icon"></i>' : ''}
            <div class="registro-fecha">${dia}/${mes}</div>
            <div class="registro-producto">${registro[1] || 'Sin producto'}</div>
            ${esAdmin ? `
                <div class="registro-total ${!registro[10] ? 'no-verificado' : ''} ${estaPagado ? 'pagado' : ''}" 
                     style="${estaPagado ? 'color: #888;' : ''}">${resultados.total.toFixed(2)} Bs.</div>
                <i class="fas fa-info-circle info-icon"></i>
                <div class="panel-info" ${estaPagado ? 'style="color: #888;"' : ''}>
                    <h4>Desglose de Costos</h4>
                    <p><span>Envasado:</span> ${resultados.envasado.toFixed(2)} Bs.</p>
                    <p><span>Etiquetado:</span> ${resultados.etiquetado.toFixed(2)} Bs.</p>
                    <p><span>Sellado:</span> ${resultados.sellado.toFixed(2)} Bs.</p>
                    <p><span>Cernido:</span> ${resultados.cernido.toFixed(2)} Bs.</p>
                    <p class="total"><span>Total:</span> ${resultados.total.toFixed(2)} Bs.</p>
                </div>
            ` : ''}
        </div>
        <div class="registro-detalles">
            <p><span>Lote:</span> ${registro[2] || '-'}</p>
            <p><span>Gramaje:</span> ${registro[3] || '-'}</p>
            <p><span>Selección:</span> ${registro[4] || '-'}</p>
            <p><span>Microondas:</span> ${registro[5] || '-'}</p>
            <p><span>Envases:</span> ${registro[6] || '-'}</p>
            <p><span>Vencimiento:</span> ${registro[7] || '-'}</p>
            
            ${registro[10] ? `
                <p><span>Fecha Verificación:</span> ${registro[10]}</p>
                <p><span>Cantidad Real:</span> ${registro[9] || '-'}</p>
                <p><span>Observaciones:</span> ${registro[11] || '-'}</p>
                <div class="acciones">
                    ${botonesAdmin}
                </div>
            ` : `
                <div class="acciones">
                    ${!esAdmin ? `
                        <button onclick="verificarRegistro('${registro[0]}', '${registro[1]}', '${registro[2]}', '${registro[8]}', '${registro[3]}', '${registro[4]}', '${registro[5]}', '${registro[6]}', '${registro[7]}')" class="btn-editar">
                            <i class="fas fa-check-circle"></i> Verificar
                        </button>
                        ${botonEliminarUsuario}
                    ` : botonesAdmin}
                </div>
            `}
        </div>
    `;

    // Solo configurar el panel de información si es administrador
    if (esAdmin) {
        configurarPanelInfo(registroCard);
    }
    configurarEventosRegistro(registroCard);

    return registroCard;
}

function configurarPanelInfo(card) {
    const infoIcon = card.querySelector('.info-icon');
    const panelInfo = card.querySelector('.panel-info');
    const header = card.querySelector('.registro-header');

    if (!infoIcon || !panelInfo) return;

    infoIcon.addEventListener('click', (e) => {
        e.stopPropagation();

        // Cerrar todos los otros paneles primero
        document.querySelectorAll('.panel-info.active').forEach(panel => {
            if (panel !== panelInfo) {
                panel.classList.remove('active');
            }
        });

        // Toggle del panel actual
        panelInfo.classList.toggle('active');
    });

    // Evitar que el panel se cierre al hacer clic dentro
    panelInfo.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    // Cerrar panel al hacer clic en cualquier otro lugar
    document.addEventListener('click', (e) => {
        if (!infoIcon.contains(e.target) && !panelInfo.contains(e.target)) {
            panelInfo.classList.remove('active');
        }
    });

    // Evitar que el clic en el icono de info active los detalles
    header.addEventListener('click', (e) => {
        if (infoIcon.contains(e.target)) {
            e.stopPropagation();
        }
    });
}

function configurarEventosRegistro(registroCard) {
    registroCard.querySelector('.registro-header').addEventListener('click', (e) => {
        if (!e.target.classList.contains('info-icon')) {
            const detalles = registroCard.querySelector('.registro-detalles');
            const infoIcon = registroCard.querySelector('.info-icon');
            detalles.classList.toggle('active');

            // Mostrar/ocultar icono de info
            infoIcon.style.display = detalles.classList.contains('active') ? 'inline-block' : 'none';

            const icono = registroCard.querySelector('.fa-chevron-down');
            icono.style.transform = detalles.classList.contains('active') ? 'rotate(180deg)' : 'rotate(0)';
        }
    });
}

function ordenarRegistrosPorFecha(registros) {
    return registros.sort((a, b) => {
        const [diaA, mesA, yearA] = a[0].split('/');
        const [diaB, mesB, yearB] = b[0].split('/');
        const fechaA = `20${yearA}-${mesA.padStart(2, '0')}-${diaA.padStart(2, '0')}`;
        const fechaB = `20${yearB}-${mesB.padStart(2, '0')}-${diaB.padStart(2, '0')}`;
        return fechaB.localeCompare(fechaA);
    });
}

/* ==================== FUNCIONES DE GESTIÓN DE REGISTROS ==================== */
export async function cargarRegistros() {
    try {
        mostrarCarga();
        await inicializarReglas();
        const rolResponse = await fetch('/obtener-mi-rol');
        const userData = await rolResponse.json();
        const esAdmin = userData.rol === 'Administración';

        const response = await fetch('/obtener-todos-registros');
        const data = await response.json();

        if (data.success) {
            const container = document.querySelector('.verificarRegistros-view');
            
            // Agregar header con título y botón de filtro
            container.innerHTML = `
                <div class="filtros-header">
                    <h2 class="section-title">
                        <i class="fas fa-check-double verificado-icon"></i> Registros
                    </h2>
                    <button class="btn-filtro">
                        <i class="fas fa-filter"></i> Filtros
                    </button>
                </div>
                <div class="panel-filtros">
                    <form class="filtros-form">
                        <div class="filtro-grupo">
                            <label>Nombre del operario</label>
                            <input type="text" id="filtro-nombre" placeholder="Buscar por nombre">
                        </div>
                        <div class="filtro-grupo">
                            <label>Fecha desde</label>
                            <input type="date" id="filtro-fecha-desde">
                        </div>
                        <div class="filtro-grupo">
                            <label>Fecha hasta</label>
                            <input type="date" id="filtro-fecha-hasta">
                        </div>
                        <div class="filtro-grupo">
                            <label>Estado</label>
                            <select id="filtro-estado">
                                <option value="todos">Todos</option>
                                <option value="verificados">Verificados</option>
                                <option value="no_verificados">No verificados</option>
                            </select>
                        </div>
                        <div class="filtros-acciones">
                            <button type="button" class="aplicar">Aplicar filtros</button>
                            <button type="button" class="limpiar">Limpiar filtros</button>
                        </div>
                    </form>
                </div>`;

            const registrosPorOperario = {};
            data.registros.slice(1).forEach(registro => {
                if (!registro[8]) return;
                if (!registrosPorOperario[registro[8]]) {
                    registrosPorOperario[registro[8]] = [];
                }
                registrosPorOperario[registro[8]].push(registro);
            });

            const nombresOrdenados = Object.keys(registrosPorOperario).sort();

            for (const nombre of nombresOrdenados) {
                const registros = ordenarRegistrosPorFecha(registrosPorOperario[nombre]);
                const { operarioCard, registrosContainer } = crearOperarioCard(nombre, registros);

                for (const registro of registros) {
                    const registroCard = crearRegistroCard(registro, esAdmin);
                    registrosContainer.appendChild(registroCard);
                }

                operarioCard.appendChild(registrosContainer);
                container.appendChild(operarioCard);
            }

            // Configurar los eventos de filtrado después de cargar los registros
            configurarFiltros();

        } else {
            throw new Error(data.error || 'Error al obtener los registros');
        }
    } catch (error) {
        console.error('Error al cargar registros:', error);
        mostrarNotificacion('Error al cargar los registros: ' + error.message, 'error');
    } finally {
        ocultarCarga();
    }
}

export async function pagarRegistro(fecha, producto, lote, operario) {
    try {
        mostrarCarga();
        
        // Buscar el registro card sin depender de la fecha
        const selector = `.registro-card[data-producto="${producto}"][data-lote="${lote}"][data-operario="${operario}"]`;
        
        const registroCard = document.querySelector(selector);
        if (!registroCard) {
            console.error('No se encontró el registro card. Datos:', { producto, lote, operario });
            mostrarNotificacion('No se encontró el registro', 'error');
            return;
        }

        // Obtener el total del registro
        const totalElement = registroCard.querySelector('.registro-total');
        if (!totalElement) {
            console.error('No se encontró el elemento total en el registro card');
            mostrarNotificacion('No se encontró el total del registro', 'error');
            return;
        }

        const total = totalElement.textContent.replace(' Bs.', '');
        
        // Enviar la petición al servidor
        const response = await fetch('/registrar-pago', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                fecha,
                producto,
                lote,
                operario,
                total
            })
        });

        const data = await response.json();
        
        if (data.success) {
            // Actualizar la UI
            totalElement.classList.add('pagado');
            totalElement.style.color = '#888';

            const btnPagar = registroCard.querySelector('.btn-pagar-registro');
            if (btnPagar) {
                btnPagar.disabled = true;
                btnPagar.style.backgroundColor = '#888';
                btnPagar.style.cursor = 'not-allowed';
            }

            // Fijar los valores del panel de información
            const panelInfo = registroCard.querySelector('.panel-info');
            if (panelInfo) {
                panelInfo.style.color = '#888';
            }

            mostrarNotificacion('Pago registrado correctamente', 'success');
        } else {
            throw new Error(data.error || 'Error al registrar el pago');
        }
    } catch (error) {
        console.error('Error en el proceso de pago:', error);
        mostrarNotificacion('Error al registrar el pago: ' + error.message, 'error');
    } finally {
        ocultarCarga();
        await cargarRegistros(); // Recargar los registros para actualizar la vista
    }
}

export function verificarRegistro(fecha, producto, lote, operario, gramaje, seleccion, microondas, envases, vencimiento) {
    const anuncio = document.querySelector('.anuncio');
    const anuncioContenido = anuncio.querySelector('.anuncio-contenido');
    
    anuncioContenido.innerHTML = `
        <h2>Verificar Registro</h2>
        <div class="detalles-verificacion">
            <div class="form-group">
                <label>Fecha: <span>${fecha}</span></label>
                <label>Producto: <span>${producto}</span></label>
                <label>Operario: <span>${operario}</span></label>
                <label>Envases terminados: <span>${envases}</span></label>
            </div>
            <form id="form-verificacion">
                <div class="form-group">
                    <input type="number" id="cantidad-real" required min="0" step="1" placeholder="Cantidad Real">
                </div>
                <div class="form-group">
                    <label for="fecha-verificacion">Fecha de Verificación:</label>
                    <input type="date" id="fecha-verificacion" value="${new Date().toISOString().split('T')[0]}" required readonly>
                </div>
                <div class="form-group">
                    <textarea id="observaciones" rows="3" placeholder="Observaciones (se enviará como notificación al operario)"></textarea>
                </div>
            </form>
        </div>
        <div class="anuncio-botones">
            <button class="anuncio-btn confirmar">Verificar</button>
            <button class="anuncio-btn cancelar">Cancelar</button>
        </div>
    `;

    anuncio.style.display = 'flex';
    document.querySelector('.overlay').style.display = 'block';
    document.querySelector('.container').classList.add('no-touch');

    const confirmarBtn = anuncio.querySelector('.confirmar');
    const cancelarBtn = anuncio.querySelector('.cancelar');

    confirmarBtn.addEventListener('click', async () => {
        const cantidadReal = document.getElementById('cantidad-real').value;
        const fechaVerificacion = document.getElementById('fecha-verificacion').value;
        const observaciones = document.getElementById('observaciones').value;

        if (!cantidadReal) {
            alert('Por favor, ingrese la cantidad real');
            return;
        }

        try {
            mostrarCarga();
            const response = await fetch('/actualizar-verificacion', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    fecha,
                    producto,
                    lote,
                    operario,
                    verificacion: cantidadReal,
                    fechaVerificacion,
                    observaciones,
                    gramaje,
                    seleccion,
                    microondas,
                    envases,
                    vencimiento,
                    cantidadDeclarada: envases
                })
            });

            const data = await response.json();
            if (data.success) {
                mostrarNotificacion(data.mensaje || 'Verificación guardada correctamente');
                anuncio.style.display = 'none';
                document.querySelector('.overlay').style.display = 'none';
                document.querySelector('.container').classList.remove('no-touch');
                await cargarRegistros();
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error al guardar la verificación: ' + error.message);
        } finally {
            ocultarCarga();
        }
    });

    cancelarBtn.addEventListener('click', () => {
        anuncio.style.display = 'none';
        document.querySelector('.overlay').style.display = 'none';
        document.querySelector('.container').classList.remove('no-touch');
    });
}

export async function eliminarRegistro(fecha, producto, lote, operario) {
    const anuncio = document.querySelector('.anuncio');
    const contenido = anuncio.querySelector('.anuncio-contenido');

    // Limpiar completamente el contenido anterior
    contenido.innerHTML = `
        <h2>¿Eliminar registro?</h2>
        <p>Esta acción no se puede deshacer</p>
        <div class="anuncio-botones">
            <button class="anuncio-btn confirmar">Eliminar</button>
            <button class="anuncio-btn cancelar">Cancelar</button>
        </div>
    `;

    // Obtener referencias a los nuevos botones
    const btnConfirmar = contenido.querySelector('.confirmar');
    const btnCancelar = contenido.querySelector('.cancelar');

    // Mostrar el diálogo
    anuncio.style.display = 'flex';
    document.querySelector('.overlay').style.display = 'block';
    document.querySelector('.container').classList.add('no-touch');

    // Función para limpiar y cerrar el modal
    const cerrarModal = () => {
        anuncio.style.display = 'none';
        document.querySelector('.overlay').style.display = 'none';
        document.querySelector('.container').classList.remove('no-touch');
        // Remover los event listeners
        btnConfirmar.removeEventListener('click', handleConfirmar);
        btnCancelar.removeEventListener('click', handleCancelar);
    };

    // Definir las funciones manejadoras
    const handleConfirmar = async () => {
        try {
            mostrarCarga();
            const response = await fetch('/eliminar-registro', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    fecha,
                    producto,
                    lote,
                    operario
                })
            });

            const data = await response.json();
            if (data.success) {
                mostrarNotificacion('Registro eliminado correctamente');
                await cargarRegistros();
            } else {
                mostrarNotificacion(data.error || 'Error al eliminar el registro', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            mostrarNotificacion('Error al eliminar el registro', 'error');
        } finally {
            ocultarCarga();
            cerrarModal();
        }
    };

    const handleCancelar = () => {
        cerrarModal();
    };

    // Agregar los event listeners a los nuevos botones
    btnConfirmar.addEventListener('click', handleConfirmar);
    btnCancelar.addEventListener('click', handleCancelar);
}

export function editarRegistro(fecha, producto, lote, operario, gramaje, seleccion, microondas, envases, vencimiento, verificacion, fechaVerificacion) {
    const anuncio = document.querySelector('.anuncio');
    const anuncioContenido = anuncio.querySelector('.anuncio-contenido');
    
    anuncioContenido.innerHTML = `
        <h2>Editar Registro</h2>
        <div class="detalles-verificacion">
            <form id="form-edicion">
                <div class="form-group">
                    <label for="edit-fecha">Fecha:</label>
                    <input type="text" id="edit-fecha" value="${fecha}" required>
                </div>
                <div class="form-group">
                    <label for="edit-producto">Producto:</label>
                    <input type="text" id="edit-producto" value="${producto}" 
                           list="productos-list" placeholder="Buscar producto..." 
                           autocomplete="off" required>
                    <datalist id="productos-list"></datalist>
                </div>
                <div class="form-group">
                    <label for="edit-lote">Lote:</label>
                    <input type="text" id="edit-lote" value="${lote}" required>
                </div>
                <div class="form-group">
                    <label for="edit-gramaje">Gramaje:</label>
                    <input type="number" id="edit-gramaje" value="${gramaje}" required>
                </div>
                <div class="form-group">
                    <label for="edit-seleccion">Selección:</label>
                    <select id="edit-seleccion" required>
                        <option value="Normal" ${seleccion === 'Normal' ? 'selected' : ''}>Normal</option>
                        <option value="Cernido" ${seleccion === 'Cernido' ? 'selected' : ''}>Cernido</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="edit-microondas">Microondas:</label>
                    <input type="text" id="edit-microondas" value="${microondas}">
                </div>
                <div class="form-group">
                    <label for="edit-envases">Envases:</label>
                    <input type="number" id="edit-envases" value="${envases}" required>
                </div>
                <div class="form-group">
                    <label for="edit-vencimiento">Vencimiento:</label>
                    <input type="text" id="edit-vencimiento" value="${vencimiento}" required>
                </div>
                <div class="form-group">
                    <label for="razon-edicion">Razón de la edición:</label>
                    <textarea id="razon-edicion" rows="3" required placeholder="Explique el motivo de la edición"></textarea>
                </div>
            </form>
        </div>
        <div class="anuncio-botones">
            <button class="anuncio-btn confirmar">Actualizar</button>
            <button class="anuncio-btn cancelar">Cancelar</button>
        </div>
    `;

    // Initialize product suggestions
    const productoInput = anuncio.querySelector('#edit-producto');
    const productosList = anuncio.querySelector('#productos-list');
    
    // Initial load of products
    fetch('/obtener-productos')
        .then(response => response.json())
        .then(data => {
            productosList.innerHTML = '';
            data.productos.forEach(producto => {
                const option = document.createElement('option');
                option.value = producto;
                productosList.appendChild(option);
            });
        })
        .catch(error => console.error('Error al cargar productos:', error));

    // Real-time search with debounce
    let timeoutId;
    productoInput.addEventListener('input', () => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(async () => {
            try {
                const response = await fetch('/buscar-productos?query=' + encodeURIComponent(productoInput.value));
                const data = await response.json();
                
                productosList.innerHTML = '';
                data.productos.forEach(producto => {
                    const option = document.createElement('option');
                    option.value = producto;
                    productosList.appendChild(option);
                });
            } catch (error) {
                console.error('Error al buscar productos:', error);
            }
        }, 300); // Debounce delay of 300ms
    });

    anuncio.style.display = 'flex';
    document.querySelector('.overlay').style.display = 'block';
    document.querySelector('.container').classList.add('no-touch');

    const confirmarBtn = anuncio.querySelector('.confirmar');
    const cancelarBtn = anuncio.querySelector('.cancelar');

    confirmarBtn.addEventListener('click', async () => {
        const razonEdicion = document.getElementById('razon-edicion').value;
        if (!razonEdicion) {
            alert('Por favor, ingrese la razón de la edición');
            return;
        }

        const datosActualizados = {
            fechaOriginal: fecha,
            productoOriginal: producto,
            loteOriginal: lote,
            operarioOriginal: operario,
            fecha: document.getElementById('edit-fecha').value,
            producto: document.getElementById('edit-producto').value,
            lote: document.getElementById('edit-lote').value,
            gramaje: document.getElementById('edit-gramaje').value,
            seleccion: document.getElementById('edit-seleccion').value,
            microondas: document.getElementById('edit-microondas').value,
            envases: document.getElementById('edit-envases').value,
            vencimiento: document.getElementById('edit-vencimiento').value,
            razonEdicion
        };

        try {
            mostrarCarga();
            const response = await fetch('/actualizar-registro', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(datosActualizados)
            });

            const data = await response.json();
            if (data.success) {
                mostrarNotificacion('Registro actualizado correctamente');
                anuncio.style.display = 'none';
                document.querySelector('.overlay').style.display = 'none';
                document.querySelector('.container').classList.remove('no-touch');
                await cargarRegistros();
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            console.error('Error:', error);
            mostrarNotificacion('Error al actualizar el registro: ' + error.message, 'error');
        } finally {
            ocultarCarga();
        }
    });

    cancelarBtn.addEventListener('click', () => {
        anuncio.style.display = 'none';
        document.querySelector('.overlay').style.display = 'none';
        document.querySelector('.container').classList.remove('no-touch');
    });
}

/* ==================== FUNCIONES DE FILTRADO ==================== */
function configurarFiltros() {
    const btnFiltro = document.querySelector('.btn-filtro');
    const panelFiltros = document.querySelector('.panel-filtros');
    const form = document.querySelector('.filtros-form');
    
    btnFiltro.addEventListener('click', () => {
        panelFiltros.classList.toggle('active');
    });

    form.querySelector('.aplicar').addEventListener('click', () => {
        filtrosActivos = {
            nombre: document.getElementById('filtro-nombre').value,
            fechaDesde: document.getElementById('filtro-fecha-desde').value,
            fechaHasta: document.getElementById('filtro-fecha-hasta').value,
            estado: document.getElementById('filtro-estado').value
        };
        aplicarFiltros();
        panelFiltros.classList.remove('active');
    });

    form.querySelector('.limpiar').addEventListener('click', () => {
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
    });
}

function aplicarFiltros() {
    const registrosCards = document.querySelectorAll('.registro-card');
    const fechaCards = document.querySelectorAll('.fecha-card');
    
    fechaCards.forEach(card => card.style.display = 'none');
    
    // Remover botón existente si hay
    const botonExistente = document.querySelector('.btn-calcular-total');
    if (botonExistente) {
        botonExistente.remove();
    }

    let registrosFiltrados = [];
    
    registrosCards.forEach(card => {
        let mostrar = true;
        
        // Filtro por nombre del operario
        if (filtrosActivos.nombre) {
            const nombreOperario = card.closest('.fecha-card').querySelector('h3').textContent.toLowerCase();
            mostrar = nombreOperario.includes(filtrosActivos.nombre.toLowerCase());
        }

        // Filtro por fechas
        if (mostrar && (filtrosActivos.fechaDesde || filtrosActivos.fechaHasta)) {
            const fechaTexto = card.querySelector('.registro-fecha').textContent;
            const [dia, mes] = fechaTexto.split('/');
            const año = new Date().getFullYear();
            const fechaRegistro = `${año}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;

            if (filtrosActivos.fechaDesde) {
                mostrar = fechaRegistro >= filtrosActivos.fechaDesde;
            }
            
            if (mostrar && filtrosActivos.fechaHasta) {
                mostrar = fechaRegistro <= filtrosActivos.fechaHasta;
            }
        }

        // Si el registro es visible y tiene un total, agregarlo a la lista
        if (mostrar) {
            const totalElement = card.querySelector('.registro-total');
            if (totalElement) {
                registrosFiltrados.push({
                    total: parseFloat(totalElement.textContent.replace(' Bs.', '')),
                    element: card
                });
            }
        }

        // Actualizar visibilidad
        card.style.display = mostrar ? 'block' : 'none';
        
        if (mostrar) {
            const fechaCard = card.closest('.fecha-card');
            if (fechaCard) {
                fechaCard.style.display = 'block';
            }
        }
    });

    // Si hay filtros activos de nombre y fechas, mostrar el botón
    if (filtrosActivos.nombre && (filtrosActivos.fechaDesde || filtrosActivos.fechaHasta) && registrosFiltrados.length > 0) {
        const container = document.querySelector('.verificarRegistros-view');
        const botonCalcular = document.createElement('button');
        botonCalcular.className = 'btn-calcular-total';
        botonCalcular.innerHTML = '<i class="fas fa-calculator"></i> Calcular Total a Pagar';
        botonCalcular.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 10px 20px;
            background-color: #4CAF50;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            z-index: 1000;
        `;

        botonCalcular.addEventListener('click', () => {
            const totalGeneral = registrosFiltrados.reduce((sum, reg) => sum + reg.total, 0);
            mostrarNotificacion(`Total a pagar: ${totalGeneral.toFixed(2)} Bs.`, 'success', 5000);
        });

        container.appendChild(botonCalcular);
    }

    // Actualizar contadores
    fechaCards.forEach(fechaCard => {
        if (fechaCard.style.display === 'block') {
            const registrosVisibles = Array.from(fechaCard.querySelectorAll('.registro-card'))
                .filter(r => r.style.display === 'block').length;
            const contador = fechaCard.querySelector('.contador');
            if (contador) {
                contador.textContent = `${registrosVisibles} registros`;
            }
        }
    });
}

/* ==================== FUNCIONES DE UTILIDAD ==================== */
function formatearFecha(fecha) {
    if (!fecha) {
        const hoy = new Date();
        const año = hoy.getFullYear();
        const mes = String(hoy.getMonth() + 1).padStart(2, '0');
        const dia = String(hoy.getDate()).padStart(2, '0');
        return `${año}-${mes}-${dia}`;
    }
    return fecha;
}