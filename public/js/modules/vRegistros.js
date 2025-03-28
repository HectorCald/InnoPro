// Agregar al inicio del archivo
let reglasEspeciales = null;
let preciosBase = null;
let filtrosActivos = {
    nombre: '',
    fechaDesde: '',
    fechaHasta: '',
    estado: 'todos' // 'todos', 'verificados', 'no_verificados'
};
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
function crearRegistroCard(registro, esAdmin) {
    const [dia, mes, año] = registro[0].split('/');
    // Keep the full date format for display
    const fechaFormateada = `${dia}/${mes}/${año}`;
    const estaPagado = registro[12];

    const registroCard = document.createElement('div');
    registroCard.className = 'registro-card';
    registroCard.dataset.fecha = `20${año}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;

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
export async function pagarRegistro(fecha, producto, lote, operario, gramaje, cantidadReal) {
    try {
        mostrarCarga();
        const registroCard = document.querySelector(`.registro-card[data-fecha="${fecha}"][data-producto="${producto}"][data-lote="${lote}"][data-operario="${operario}"]`);
        if (!registroCard) return;

        const total = registroCard.querySelector('.registro-total').textContent.replace(' Bs.', '');

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
                gramaje,
                cantidadReal,
                total
            })
        });

        const data = await response.json();
        if (data.success) {
            // Actualizar la UI
            const totalElement = registroCard.querySelector('.registro-total');
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

            mostrarNotificacion('Pago registrado correctamente');
        } else {
            mostrarNotificacion(data.error || 'Error al registrar el pago', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error al registrar el pago', 'error');
    } finally {
        ocultarCarga();
        cargarRegistros();
    }
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
                    vencimiento
                })
            });

            const data = await response.json();
            if (data.success) {
                mostrarNotificacion(data.mensaje || 'Verificación guardada correctamente');
                anuncio.style.display = 'none';
                document.querySelector('.overlay').style.display = 'none';
                document.querySelector('.container').classList.remove('no-touch');
                // Refresh the page to show updated data
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
export async function eliminarRegistro(fecha, producto, lote, operario) {
    const anuncio = document.querySelector('.anuncio');
    const contenido = anuncio.querySelector('.anuncio-contenido');
    const btnConfirmar = anuncio.querySelector('.confirmar');
    const btnCancelar = anuncio.querySelector('.cancelar');

    // Configure dialog for delete confirmation
    contenido.querySelector('h2').textContent = '¿Eliminar registro?';
    contenido.querySelector('p').textContent = 'Esta acción no se puede deshacer';
    btnConfirmar.textContent = 'Eliminar';
    btnConfirmar.style.backgroundColor = '#dc3545';
    btnCancelar.style.display = 'block';

    // Show the dialog
    anuncio.style.display = 'flex';
    document.querySelector('.container').classList.add('no-touch');

    // Handle confirmation
    btnConfirmar.onclick = async () => {
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
            anuncio.style.display = 'none';
            document.querySelector('.container').classList.remove('no-touch');
        }
    };

    // Handle cancellation
    btnCancelar.onclick = () => {
        anuncio.style.display = 'none';
        document.querySelector('.container').classList.remove('no-touch');
    };
}


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
    
    registrosCards.forEach(card => {
        let mostrar = true;
        
        // Filtro por nombre
        if (filtrosActivos.nombre) {
            const operario = card.dataset.operario.toLowerCase();
            mostrar = operario.includes(filtrosActivos.nombre.toLowerCase());
        }

        // Filtro por fechas
        if (mostrar && (filtrosActivos.fechaDesde || filtrosActivos.fechaHasta)) {
            const fechaRegistro = card.dataset.fecha; // Ya está en formato YYYY-MM-DD

            if (filtrosActivos.fechaDesde) {
                mostrar = fechaRegistro >= filtrosActivos.fechaDesde;
            }
            
            if (mostrar && filtrosActivos.fechaHasta) {
                mostrar = fechaRegistro <= filtrosActivos.fechaHasta;
            }
        }

        // Filtro por estado
        if (mostrar && filtrosActivos.estado !== 'todos') {
            const estaVerificado = card.querySelector('.verificado-icon') !== null;
            mostrar = (filtrosActivos.estado === 'verificados') === estaVerificado;
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
