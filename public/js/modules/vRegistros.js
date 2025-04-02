import { registrarNotificacion } from './advertencia.js'; 

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
window.eliminarRegistro = eliminarRegistro;

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
    const normalizedNombre = (nombre || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "");
    cantidad = parseFloat(cantidad) || 0;
    gramaje = parseFloat(gramaje) || 0;

    // Inicializar multiplicadores con valores por defecto
    let multiplicadores = {
        etiquetado: '1',
        sellado: '1',
        envasado: '1',
        cernido: preciosBase?.cernidoBolsa || '0'
    };

    // Encontrar todas las reglas que aplican para este producto
    const reglasAplicables = reglasEspeciales?.filter(r => {
        const nombreRegla = r.producto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "");
        const nombreCoincide = normalizedNombre.includes(nombreRegla);
        const gramajeCumple = r.gramajeMin && r.gramajeMax ?
            (gramaje >= parseFloat(r.gramajeMin) && gramaje <= parseFloat(r.gramajeMax)) :
            true;
        return nombreCoincide && gramajeCumple;
    }) || [];

    // Revisar cada regla y aplicar el multiplicador correspondiente si es diferente de 1
    reglasAplicables.forEach(regla => {
        // Solo actualizar si la regla tiene un valor específico para esa operación
        if (regla.etiquetado !== '1') multiplicadores.etiquetado = regla.etiquetado;
        if (regla.sellado !== '1') multiplicadores.sellado = regla.sellado;
        if (regla.envasado !== '1') multiplicadores.envasado = regla.envasado;
        if (regla.cernido !== '1') multiplicadores.cernido = regla.cernido;
    });

    // Calcular resultados usando los multiplicadores encontrados
    let resultado = cantidad * preciosBase.envasado * parseFloat(multiplicadores.envasado);
    let resultadoEtiquetado = cantidad * preciosBase.etiquetado * parseFloat(multiplicadores.etiquetado);
    let resultadoSellado = cantidad * preciosBase.sellado * parseFloat(multiplicadores.sellado);
    if (normalizedNombre.includes('bote')) {
        resultadoSellado = cantidad * 0.025;
    }

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
        // Cerrar todos los demás contenedores primero
        document.querySelectorAll('.registros-grupo').forEach(container => {
            if (container !== registrosContainer && container.classList.contains('active')) {
                container.classList.remove('active');
                const icon = container.parentElement.querySelector('.fa-chevron-down');
                if (icon) {
                    icon.style.transform = 'rotate(0)';
                }
            }
        });

        // Abrir/cerrar el contenedor actual
        registrosContainer.classList.toggle('active');
        const icono = operarioHeader.querySelector('.fa-chevron-down');
        icono.style.transform = registrosContainer.classList.contains('active') ? 'rotate(180deg)' : 'rotate(0)';
    });

    return { operarioCard, registrosContainer };
}

function crearRegistroCard(registro, esAdmin) {
    const [dia, mes, año] = registro[1].split('/');
    // Keep the full date format for display
    const fechaFormateada = `${dia}/${mes}/${año}`;
    const estaPagado = registro[13];

    const registroCard = document.createElement('div');
    registroCard.className = 'registro-card';
    registroCard.dataset.id = registro[0];
    registroCard.dataset.fecha = `20${año}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
    registroCard.dataset.producto = registro[2];
    registroCard.dataset.lote = registro[3];
    registroCard.dataset.operario = registro[9];

    // Solo calcular resultados si es admin
    const resultados = esAdmin ? (estaPagado ? {
        total: parseFloat(registro[13]),
        envasado: 0,
        etiquetado: 0,
        sellado: 0,
        cernido: 0
    } : calcularTotal(registro[2], registro[11] ? registro[10] : registro[7], registro[4], registro[5])) : null;

    // Botones para administradores
    const botonesAdmin = esAdmin ? `
    <button onclick="eliminarRegistro('${registro[0]}')" class="btn-eliminar-registro">
        <i class="fas fa-trash"></i> Eliminar
    </button>
    <button onclick="editarRegistro('${registro[0]}', '${registro[1]}', '${registro[2]}', '${registro[3]}', '${registro[9]}', '${registro[4]}', '${registro[5]}', '${registro[6]}', '${registro[7]}', '${registro[8]}', '${registro[10] || ''}', '${registro[11] || ''}')" class="btn-editar-registro">
        <i class="fas fa-edit"></i> Editar
    </button>
    ${registro[10] ? `
        <button onclick="pagarRegistro('${registro[0]}')" 
            class="btn-pagar-registro"
            ${registro[13] ? 'disabled style="background-color: #888; cursor: not-allowed;"' : ''}>
            <i class="fas fa-dollar-sign"></i> Pagar
        </button>
    ` : ''}` : '';

    // Botón de eliminar para usuarios normales (solo si no está verificado)
    const botonEliminarUsuario = !esAdmin && !registro[11] ? `
        <button onclick="eliminarRegistro('${registro[0]}')" class="btn-eliminar-registro">
            <i class="fas fa-trash"></i> Eliminar
        </button>
    ` : '';

    registroCard.innerHTML = `
        <div class="registro-header">
            ${registro[11] ? '<i class="fas fa-check-circle verificado-icon"></i>' : ''}
            <div class="registro-fecha">${dia}/${mes}</div>
            <div class="registro-producto">${registro[2] || 'Sin producto'}</div>
            ${esAdmin ? `
                <div class="registro-total ${!registro[11] ? 'no-verificado' : ''} ${estaPagado ? 'pagado' : ''}" 
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
            <p><span>Lote:</span> ${registro[3] || '-'}</p>
            <p><span>Gramaje:</span> ${registro[4] || '-'}</p>
            <p><span>Selección:</span> ${registro[5] || '-'}</p>
            <p><span>Microondas:</span> ${registro[6] || '-'}</p>
            <p><span>Envases:</span> ${registro[7] || '-'}</p>
            <p><span>Vencimiento:</span> ${registro[8] || '-'}</p>
            
            ${registro[11] ? `
                <p><span>Fecha Verificación:</span> ${registro[11]}</p>
                <p><span>Cantidad Real:</span> ${registro[10] || '-'}</p>
                <p><span>Observaciones:</span> ${registro[12] || '-'}</p>
                <div class="acciones">
                    ${botonesAdmin}
                </div>
            ` : `
                <div class="acciones">
                    ${!esAdmin ? `
                        <button onclick="verificarRegistro('${registro[0]}', '${registro[1]}', '${registro[2]}', '${registro[9]}', '${registro[7]}')" class="btn-editar">
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

            // Cerrar otros registros abiertos primero
            document.querySelectorAll('.registro-detalles').forEach(otherDetalles => {
                if (otherDetalles !== detalles && otherDetalles.classList.contains('active')) {
                    otherDetalles.classList.remove('active');
                    const otherCard = otherDetalles.closest('.registro-card');
                    if (otherCard) {
                        const otherIcon = otherCard.querySelector('.info-icon');
                        if (otherIcon) {
                            otherIcon.style.display = 'none';
                        }
                    }
                }
            });

            // Toggle detalles actuales
            detalles.classList.toggle('active');

            // Mostrar/ocultar icono de info
            if (infoIcon) {
                infoIcon.style.display = detalles.classList.contains('active') ? 'inline-block' : 'none';
            }

            // Si el registro está abierto, desplazar la pantalla para mostrarlo completo
            if (detalles.classList.contains('active')) {
                setTimeout(() => {
                    registroCard.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center'
                    });
                }, 100);
            }
        }
    });
}

function ordenarRegistrosPorFecha(registros) {
    return registros.sort((a, b) => {
        try {
            // Ignorar el ID y usar el índice 1 para la fecha
            const fechaA = a[1] || '';
            const fechaB = b[1] || '';

            if (!fechaA || !fechaB) return 0;

            // Convertir fechas (dd/mm/yy) a formato comparable
            const [diaA, mesA, yearA] = fechaA.split('/');
            const [diaB, mesB, yearB] = fechaB.split('/');

            const fechaFormateadaA = `20${yearA}-${mesA}-${diaA}`;
            const fechaFormateadaB = `20${yearB}-${mesB}-${diaB}`;

            return fechaFormateadaB.localeCompare(fechaFormateadaA);
        } catch (error) {
            console.error('Error al ordenar fechas:', error);
            return 0;
        }
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
                </div>`;

                const registrosPorOperario = {};
                data.registros.slice(1).forEach(registro => {
                    // El operario ahora está en el índice 9 (era 8 antes)
                    const operario = registro[9];
                    if (!operario) return;
                    
                    if (!registrosPorOperario[operario]) {
                        registrosPorOperario[operario] = [];
                    }
                    registrosPorOperario[operario].push(registro);
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

            // Aplicar filtros guardados si existen
            const filtrosGuardados = localStorage.getItem('filtrosRegistros');
            if (filtrosGuardados) {
                filtrosActivos = JSON.parse(filtrosGuardados);
                aplicarFiltros();
            }

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
export async function pagarRegistro(id) {
    try {
        mostrarCarga();

        // Buscar el registro card por ID
        const registroCard = document.querySelector(`.registro-card[data-id="${id}"]`);
        if (!registroCard) {
            throw new Error('No se encontró el registro');
        }

        // Obtener el total del registro
        const totalElement = registroCard.querySelector('.registro-total');
        if (!totalElement) {
            throw new Error('No se encontró el total del registro');
        }

        const total = totalElement.textContent.replace(' Bs.', '');

        // Enviar la petición al servidor
        const response = await fetch('/registrar-pago', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id, total })
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
        await cargarRegistros();
    }
}
export function verificarRegistro(id, fecha, producto, operario, envases) {
    const anuncio = document.querySelector('.anuncio');
    const anuncioContenido = anuncio.querySelector('.anuncio-contenido');

    anuncioContenido.innerHTML = `
        <h2>Verificar Registro</h2>
        <div class="detalles-verificacion">
            <div class="form-group">
                <input type="hidden" id="registro-id" value="${id}">
                <label>Fecha: <span>${fecha}</span></label>
                <label>Producto: <span>${producto}</span></label>
                <label>Operario: <span>${operario}</span></label>
                <label>Envases terminados: <span>${envases}</span></label>
            </div>
            <form id="form-verificacion">
                <div class="form-group">
                    <label for="cantidad-real">Cantidad Real:</label>
                    <input type="number" id="cantidad-real" required min="0" step="1" placeholder="Cantidad Real">
                </div>
                <div class="form-group">
                    <label for="fecha-verificacion">Fecha de Verificación:</label>
                    <input type="date" id="fecha-verificacion" value="${new Date().toISOString().split('T')[0]}" required readonly>
                </div>
                <div class="form-group">
                    <label for="observaciones">Observaciones:</label>
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
            // Get current user
            const userResponse = await fetch('/obtener-mi-rol');
            const userData = await userResponse.json();
            const usuarioActual = userData.nombre;

            const response = await fetch('/actualizar-verificacion', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id,
                    verificacion: cantidadReal,
                    fechaVerificacion,
                    observaciones,
                    cantidadDeclarada: envases
                })
            });

            const data = await response.json();
            if (data.success) {
                // Send notification to operator
                try {
                    await registrarNotificacion(
                        usuarioActual, // origin (current user)
                        operario,     // destination (operator)
                        `Se ha verificado tu registro (${producto}). Cantidad declarada: ${envases}, Cantidad real: ${cantidadReal}. ${observaciones ? `Observaciones: ${observaciones}` : ''}`
                    );
                } catch (notifError) {
                    console.error('Error al enviar notificación:', notifError);
                }

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
            mostrarNotificacion('Error al guardar la verificación: ' + error.message, 'error');
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
export async function eliminarRegistro(id) {
    try {
        const razon = await mostrarModalConfirmacion(
            'Eliminar Registro',
            '¿Estás seguro de que deseas eliminar este registro?'
        );

        if (!razon) return;

        mostrarCarga();

        // Get current user first
        const userResponse = await fetch('/obtener-mi-rol');
        const userData = await userResponse.json();
        const usuarioActual = userData.nombre;

        // Get the record card to extract information
        const registroCard = document.querySelector(`.registro-card[data-id="${id}"]`);
        if (!registroCard) {
            throw new Error('No se encontró el registro');
        }

        const producto = registroCard.dataset.producto;
        const lote = registroCard.dataset.lote;
        const operario = registroCard.dataset.operario;

        const response = await fetch('/eliminar-registro', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: id,
                razon: razon
            })
        });

        const data = await response.json();

        if (data.success) {
            try {
                // Register notification with proper error handling
                await registrarNotificacion(
                    usuarioActual,
                    operario,
                    `Registro eliminado - Producto: ${producto}, Lote: ${lote}. Razón: ${razon}`
                );
            } catch (notifError) {
                console.error('Error al enviar notificación:', notifError);
                // Continue execution even if notification fails
            }

            mostrarNotificacion('Registro eliminado correctamente', 'success');
            await cargarRegistros();
        } else {
            throw new Error(data.error || 'Error al eliminar el registro');
        }
    } catch (error) {
        console.error('Error al eliminar registro:', error);
        mostrarNotificacion('Error al eliminar el registro: ' + error.message, 'error');
    } finally {
        ocultarCarga();
    }
}
function mostrarModalConfirmacion(titulo, mensaje) {
    return new Promise((resolve) => {
        const anuncio = document.querySelector('.anuncio');
        const anuncioContenido = anuncio.querySelector('.anuncio-contenido');

        anuncioContenido.innerHTML = `
            <h2>${titulo}</h2>
            <div class="detalles-verificacion">
                <div class="form-group">
                    <textarea id="razonEliminacion" placeholder="Explique el motivo de la eliminacion. Aqui!" required ></textarea>
                </div>
            </div>
            <div class="anuncio-botones">
                <button class="anuncio-btn confirmar">Confirmar</button>
                <button class="anuncio-btn cancelar">Cancelar</button>
            </div>
        `;

        anuncio.style.display = 'flex';
        document.querySelector('.overlay').style.display = 'block';
        document.querySelector('.container').classList.add('no-touch');

        const btnConfirmar = anuncio.querySelector('.confirmar');
        const btnCancelar = anuncio.querySelector('.cancelar');
        const textarea = anuncio.querySelector('#razonEliminacion');

        btnConfirmar.addEventListener('click', () => {
            const razon = textarea.value.trim();
            if (!razon) {
                mostrarNotificacion('Por favor, ingresa una razón', 'warning');
                return;
            }
            anuncio.style.display = 'none';
            document.querySelector('.overlay').style.display = 'none';
            document.querySelector('.container').classList.remove('no-touch');
            resolve(razon);
        });

        btnCancelar.addEventListener('click', () => {
            anuncio.style.display = 'none';
            document.querySelector('.overlay').style.display = 'none';
            document.querySelector('.container').classList.remove('no-touch');
            resolve(null);
        });
    });
}
export function editarRegistro(id, fecha, producto, lote, operario, gramaje, seleccion, microondas, envases, vencimiento, verificacion, fechaVerificacion) {
    const anuncio = document.querySelector('.anuncio');
    const anuncioContenido = anuncio.querySelector('.anuncio-contenido');

    anuncioContenido.innerHTML = `
        <h2>Editar Registro</h2>
        <div class="detalles-verificacion">
            <form id="form-edicion">
                <input type="hidden" id="edit-id" value="${id}">
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
        }, 300);
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

        try {
            mostrarCarga();
            // Get current user
            const userResponse = await fetch('/obtener-mi-rol');
            const userData = await userResponse.json();
            const usuarioActual = userData.nombre;

            const datosActualizados = {
                id: document.getElementById('edit-id').value,
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

            const response = await fetch('/actualizar-registro', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(datosActualizados)
            });

            const data = await response.json();
            if (data.success) {
                // Send notification to operator
                try {
                    await registrarNotificacion(
                        usuarioActual,     // origin (current user)
                        operario,          // destination (operator)
                        `Se editó tu registro (${producto}-${lote}). Razón: ${razonEdicion}`
                    );
                } catch (notifError) {
                    console.error('Error al enviar notificación:', notifError);
                }

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
    const anuncio = document.querySelector('.anuncio');
    const anuncioContenido = anuncio.querySelector('.anuncio-contenido');

    // Cargar filtros guardados al inicio
    const filtrosGuardados = localStorage.getItem('filtrosRegistros');
    if (filtrosGuardados) {
        filtrosActivos = JSON.parse(filtrosGuardados);
    }

    btnFiltro.addEventListener('click', () => {
        // Cargar valores guardados en los inputs
        const filtrosGuardados = localStorage.getItem('filtrosRegistros');
        const valoresGuardados = filtrosGuardados ? JSON.parse(filtrosGuardados) : {
            nombre: '',
            fechaDesde: '',
            fechaHasta: '',
            estado: 'todos'
        };

        anuncioContenido.innerHTML = `
            <h2><i class="fas fa-filter"></i> Filtros de Registros</h2>
            <div class="detalles-verificacion">
                <form id="filtros-form">
                    <div class="campo-form">
                        <label>Operario:</label>
                        <input type="text" id="filtro-nombre" placeholder="Buscar por nombre" value="${valoresGuardados.nombre}">
                    </div>
                    <div class="campo-form">
                        <label>Fecha desde:</label>
                        <input type="date" id="filtro-fecha-desde" value="${valoresGuardados.fechaDesde}">
                    </div>
                    <div class="campo-form">
                        <label>Fecha hasta:</label>
                        <input type="date" id="filtro-fecha-hasta" value="${valoresGuardados.fechaHasta}">
                    </div>
                    <div class="campo-form">
                        <label>Estado:</label>
                        <select id="filtro-estado">
                            <option value="todos" ${valoresGuardados.estado === 'todos' ? 'selected' : ''}>Todos</option>
                            <option value="verificados" ${valoresGuardados.estado === 'verificados' ? 'selected' : ''}>Verificados</option>
                            <option value="no_verificados" ${valoresGuardados.estado === 'no_verificados' ? 'selected' : ''}>No verificados</option>
                        </select>
                    </div>
                </form>
            </div>
            <div class="anuncio-botones">
                <button class="anuncio-btn green aplicar">Aplicar</button>
                <button class="anuncio-btn red limpiar">Limpiar</button>
                <button class="anuncio-btn gray cancelar">Cancelar</button>
            </div>
        `;

        anuncio.style.display = 'flex';
        document.querySelector('.overlay').style.display = 'block';
        document.querySelector('.container').classList.add('no-touch');

        const cerrarModal = () => {
            anuncio.style.display = 'none';
            document.querySelector('.overlay').style.display = 'none';
            document.querySelector('.container').classList.remove('no-touch');
        };

        anuncioContenido.querySelector('.aplicar').addEventListener('click', () => {
            filtrosActivos = {
                nombre: document.getElementById('filtro-nombre').value,
                fechaDesde: document.getElementById('filtro-fecha-desde').value,
                fechaHasta: document.getElementById('filtro-fecha-hasta').value,
                estado: document.getElementById('filtro-estado').value
            };
            // Guardar filtros en localStorage
            localStorage.setItem('filtrosRegistros', JSON.stringify(filtrosActivos));
            aplicarFiltros();
            cerrarModal();
        });

        anuncioContenido.querySelector('.limpiar').addEventListener('click', () => {
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
            // Eliminar filtros del localStorage
            localStorage.removeItem('filtrosRegistros');
            aplicarFiltros();
            cerrarModal();
        });

        anuncioContenido.querySelector('.cancelar').addEventListener('click', cerrarModal);
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

        // Filtro por estado (verificado/no verificado)
        if (mostrar && filtrosActivos.estado !== 'todos') {
            const esVerificado = card.querySelector('.verificado-icon') !== null;
            mostrar = filtrosActivos.estado === 'verificados' ? esVerificado : !esVerificado;
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
        botonCalcular.innerHTML = '<i class="fas fa-calculator"></i> Calcular Total';
        botonCalcular.style.cssText = `
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            padding: 15px 30px;
            background-color: #4CAF50;
            color: white;
            border: none;
            border-radius: 25px;
            cursor: pointer;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            z-index: 1000;
            font-size: 16px;
            font-weight: bold;
            display: flex;
            align-items: center;
            gap: 10px;
            transition: all 0.3s ease;
        `;

        botonCalcular.addEventListener('mouseover', () => {
            botonCalcular.style.backgroundColor = '#45a049';
            botonCalcular.style.transform = 'translateX(-50%) scale(1.05)';
        });

        botonCalcular.addEventListener('mouseout', () => {
            botonCalcular.style.backgroundColor = '#4CAF50';
            botonCalcular.style.transform = 'translateX(-50%) scale(1)';
        });

        botonCalcular.addEventListener('click', () => {
            const totalGeneral = registrosFiltrados.reduce((sum, reg) => sum + reg.total, 0);
            const anuncio = document.querySelector('.anuncio');
            const anuncioContenido = anuncio.querySelector('.anuncio-contenido');

            anuncioContenido.innerHTML = `
                <h2><i class="fas fa-calculator"></i> Resumen de Registros</h2>
                <div class="detalles-verificacion">
                    <div class="resumen-info">
                        <p><strong>Operario:</strong> ${filtrosActivos.nombre}</p>
                        <p><strong>Desde:</strong> ${filtrosActivos.fechaDesde || 'No especificado'}</p>
                        <p><strong>Hasta:</strong> ${filtrosActivos.fechaHasta || 'No especificado'}</p>
                        <p class="total-general"><strong>Total:</strong> ${totalGeneral.toFixed(2)} Bs.</p>
                    </div>
                </div>
                <div class="anuncio-botones">
                    <button class="anuncio-btn gray cancelar">Cerrar</button>
                </div>
            `;

            anuncio.style.display = 'flex';
            document.querySelector('.overlay').style.display = 'block';
            document.querySelector('.container').classList.add('no-touch');

            anuncioContenido.querySelector('.cancelar').addEventListener('click', () => {
                anuncio.style.display = 'none';
                document.querySelector('.overlay').style.display = 'none';
                document.querySelector('.container').classList.remove('no-touch');
            });
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
