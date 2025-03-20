// Variables globales para mantener el estado
let registrosFiltrados = [];
let registrosOriginales = [];
let registrosMostrados = 0;
const registrosPorPagina = 10;

export async function cargarRegistrosCuentas() {
    try {
        mostrarCarga();
        
        // Usar la petición existente para obtener el nombre
        const nombreResponse = await fetch('/obtener-nombre');
        const nombreData = await nombreResponse.json();
        const nombreUsuario = nombreData.nombre;

        const response = await fetch('/obtener-registros');
        const data = await response.json();

        if (data.success) {
            const container = document.querySelector('.cuentasProduccion-view');
            
            // Crear sección de filtros
            // En la función cargarRegistrosCuentas, modifica el HTML de los filtros
container.innerHTML = `
    <h2 class="section-title">Filtros</h2>
    <div class="filters-section">
        <div class="filter-wrapper">
            <h3 class="filter-title">Período de tiempo</h3>
            <div class="filter-group">
                <button class="filter-btn" data-period="7">7 días</button>
                <button class="filter-btn" data-period="30">1 mes</button>
                <button class="filter-btn" data-period="90">3 meses</button>
                <button class="filter-btn" data-period="210">7 meses</button>
                <button class="filter-btn active" data-period="365">12 meses</button>
            </div>
        </div>
        <div class="filter-wrapper">
            <h3 class="filter-title">Estado de verificación</h3>
            <div class="filter-group">
                <button class="filter-btn active" data-verify="all">Todos</button>
                <button class="filter-btn" data-verify="verified">Verificados</button>
                <button class="filter-btn" data-verify="unverified">No Verificados</button>
            </div>
        </div>
    </div>
    <h2 class="section-title">Registros</h2>
    <div class="registros-container"></div>
    <button class="load-more" style="display: none;">Cargar más</button>
`;

            if (data.registros && data.registros.length > 0) {
                // Filtrar solo los registros del usuario actual y ordenar por fecha
                registrosOriginales = data.registros
                    .filter(registro => registro[8] === nombreUsuario)
                    .sort((a, b) => {
                        const fechaA = parsearFecha(a[0]);
                        const fechaB = parsearFecha(b[0]);
                        return fechaB - fechaA;
                    });

                // Mostrar todos los registros inicialmente
                registrosFiltrados = [...registrosOriginales];
                mostrarRegistros(true);
                setupFilters();
            } else {
                document.querySelector('.registros-container').innerHTML = 
                    '<p class="no-registros">No hay registros disponibles</p>';
            }
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error al cargar los registros', 'error');
    } finally {
        ocultarCarga();
    }
}

function aplicarFiltros() {
    const periodo = parseInt(
        document.querySelector('.filter-btn[data-period].active')?.dataset.period || 7
    );
    const verificacion = 
        document.querySelector('.filter-btn[data-verify].active')?.dataset.verify || 'all';

    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() - periodo);

    // Filtrar registros
    registrosFiltrados = registrosOriginales.filter(registro => {
        const fechaRegistro = parsearFecha(registro[0]);
        const cumpleFecha = fechaRegistro >= fechaLimite;
        
        if (verificacion === 'all') return cumpleFecha;
        if (verificacion === 'verified') return cumpleFecha && registro[10];
        if (verificacion === 'unverified') return cumpleFecha && !registro[10];
        return false;
    });

    // Mostrar registros filtrados y asegurar que el contenedor sea visible
    mostrarRegistros(true);
    
    // Asegurar que el contenedor sea visible
    const container = document.querySelector('.registros-container');
    if (container) {
        container.style.display = 'grid';
        container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}
function mostrarRegistros(reset = false) {
    if (reset) {
        registrosMostrados = 0;
        document.querySelector('.registros-container').innerHTML = '';
    }
    
    const container = document.querySelector('.registros-container');
    const loadMoreBtn = document.querySelector('.load-more');
    
    if (registrosFiltrados.length === 0) {
        container.innerHTML = '<p class="no-registros">No hay registros para mostrar</p>';
        loadMoreBtn.style.display = 'none';
        return;
    }

    const registrosAMostrar = registrosFiltrados.slice(
        registrosMostrados,
        registrosMostrados + registrosPorPagina
    );

    registrosAMostrar.forEach(registro => {
        const card = crearTarjetaRegistro(registro);
        container.appendChild(card);
    });

    registrosMostrados += registrosAMostrar.length;
    loadMoreBtn.style.display = 
        registrosMostrados < registrosFiltrados.length ? 'block' : 'none';
}

function setupFilters() {
    const container = document.querySelector('.cuentasProduccion-view');
    
    // Filtros de período
    container.querySelectorAll('.filter-btn[data-period]').forEach(btn => {
        btn.addEventListener('click', () => {
            container.querySelectorAll('.filter-btn[data-period]')
                .forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            aplicarFiltros();
        });
    });

    // Filtros de verificación
    container.querySelectorAll('.filter-btn[data-verify]').forEach(btn => {
        btn.addEventListener('click', () => {
            container.querySelectorAll('.filter-btn[data-verify]')
                .forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            aplicarFiltros();
        });
    });

    // Botón de cargar más
    const loadMoreBtn = container.querySelector('.load-more');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => mostrarRegistros());
    }
}


function parsearFecha(fechaStr) {
    const [dia, mes, año] = fechaStr.split('/');
    return new Date(2000 + parseInt(año), parseInt(mes) - 1, parseInt(dia));
}
export function mostrarDetalles(card) {
    const detalles = card.querySelector('.registro-detalles');
    const todosLosDetalles = document.querySelectorAll('.registro-detalles');
    const todosLosIconos = document.querySelectorAll('.info-icon');
    const currentIcon = card.querySelector('.info-icon');

    // Cerrar otros detalles abiertos y restablecer iconos
    todosLosDetalles.forEach((det, index) => {
        if (det !== detalles && det.classList.contains('active')) {
            det.classList.remove('active');
            if (todosLosIconos[index]) {
                todosLosIconos[index].style.display = 'none';
            }
        }
    });

    // Toggle detalles actuales
    detalles.classList.toggle('active');
    
    // Ajustar visibilidad del icono actual
    if (currentIcon) {
        currentIcon.style.display = detalles.classList.contains('active') ? 'block' : 'none';
    }
}
// El resto de las funciones (crearTarjetaRegistro, calcularTotal, etc.) se mantienen igual
export function crearTarjetaRegistro(registro) {
    const div = document.createElement('div');
    div.className = 'registro-card';

    if (!Array.isArray(registro)) {
        console.error('Registro inválido:', registro);
        return div;
    }

    const [dia, mes] = registro[0].split('/');
    const fechaFormateada = `${dia}/${mes}`;
    // Determinar qué cantidad usar basado en si está verificado
    const cantidadAUsar = registro[10] ? registro[9] : registro[6];
    const resultados = calcularTotal(registro[1], cantidadAUsar, registro[3], registro[4]);

    div.innerHTML = `
        <div class="registro-header">
                ${registro[10] ? '<i class="fas fa-check-circle verificado-icon"></i>' : ''}
                <div class="registro-fecha">${fechaFormateada}</div>
                <div class="registro-producto">${registro[1] || 'Sin producto'}</div>
                <div class="registro-total ${!registro[10] ? 'no-verificado' : ''}">${resultados.total.toFixed(2)} Bs.</div>
                <i class="fas fa-info-circle info-icon"></i>
                <div class="panel-info">
                    <h4>Desglose de Costos</h4>
                    <p><span>Envasado:</span> ${resultados.envasado.toFixed(2)} Bs.</p>
                    <p><span>Etiquetado:</span> ${resultados.etiquetado.toFixed(2)} Bs.</p>
                    <p><span>Sellado:</span> ${resultados.sellado.toFixed(2)} Bs.</p>
                    <p><span>Cernido:</span> ${resultados.cernido.toFixed(2)} Bs.</p>
                    <p class="total"><span>Total:</span> ${resultados.total.toFixed(2)} Bs.</p>
                </div>
        </div>
        </div>
        <div class="registro-detalles">
            <p><span>Lote:</span> ${registro[2] || '—'}</p>
            <p><span>Gramaje:</span> ${registro[3] ? registro[3] + 'gr' : '—'}</p>
            <p><span>Selección/Cernido:</span> ${registro[4] || '—'}</p>
            <p><span>Microondas:</span> ${registro[5] ? registro[5] + 's' : '—'}</p>
            <p><span>Envases Terminados:</span> ${registro[6] || '—'}</p>
            <p><span>Fecha Vencimiento:</span> ${registro[7] || '—'}</p>
            <p><span>Nombre:</span> ${registro[8] || '—'}</p>
            <p><span>Verificar:</span> ${registro[9] || '—'}</p>
            <p><span>Fecha Ver.:</span> ${registro[10] || '—'}</p>
            <p><span>Observaciones:</span> ${registro[11] || '—'}</p>
        </div>
    `;

    const header = div.querySelector('.registro-header');
    header.addEventListener('click', () => mostrarDetalles(div));
    configurarPanelInfo(div);
    return div;

}
function calcularTotal(nombre, cantidad, gramaje, seleccion) {
    nombre = (nombre || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "");
    cantidad = parseFloat(cantidad) || 0;
    gramaje = parseFloat(gramaje) || 0;

    let resultado = cantidad;
    let resultadoEtiquetado = cantidad;
    let resultadoSellado = cantidad;
    const kilos = (cantidad * gramaje) / 1000;
    let resultadoSernido = 0;

    // Lógica para envasado
    if (nombre.includes('pipoca')) {
        if (gramaje >= 1000) {
            resultado = (cantidad * 5) * 0.048;
        } else if (gramaje >= 500) {
            resultado = (cantidad * 4) * 0.048;
        } else {
            resultado = (cantidad * 2) * 0.048;
        }
    } else if (
        nombre.includes('bote') || 
        (nombre.includes('clavo de olor entero') && gramaje === 12) || 
        (nombre.includes('canela en rama') && gramaje === 4) || 
        (nombre.includes('linaza') && gramaje === 50)
    ) {
        resultado = (cantidad * 2) * 0.048;
    } else if (
        nombre.includes('laurel') || 
        nombre.includes('huacatay') || 
        nombre.includes('albahaca') || 
        (nombre.includes('canela') && gramaje === 14)
    ) {
        resultado = (cantidad * 3) * 0.048;
    } else {
        if (gramaje == 150) {
            resultado = (cantidad * 3) * 0.048;
        } else if (gramaje == 500) {
            resultado = (cantidad * 4) * 0.048;
        } else if (gramaje == 1000) {
            resultado = (cantidad * 5) * 0.048;
        } else {
            resultado = (cantidad * 1) * 0.048;
        }
    }

    // Lógica para etiquetado
    if (nombre.includes('bote')) {
        resultadoEtiquetado = (cantidad * 2) * 0.016;
    } else {
        resultadoEtiquetado = cantidad * 0.016;
    }

    // Lógica para sellado
    if (nombre.includes('bote')) {
        resultadoSellado = cantidad * 0.3 / 60 * 5;
    } else if (gramaje > 150) {
        resultadoSellado = (cantidad * 2) * 0.006;
    } else {
        resultadoSellado = (cantidad * 1) * 0.006;
    }

    // Lógica para cernido
    if (seleccion !== 'Cernido') {
        resultadoSernido = 0;
    } else {
        if (nombre.includes('bote')) {
            if (nombre.includes('canela') || nombre.includes('cebolla') || nombre.includes('locoto')) {
                resultadoSernido = (kilos * 0.34) * 5;
            } else {
                resultadoSernido = (kilos * 0.1) * 5;
            }
        } else if (nombre.includes('canela') || nombre.includes('cebolla') ||
            nombre.includes('aji amarillo dulce') || nombre.includes('locoto')) {
            resultadoSernido = (kilos * 0.3) * 5;
        } else {
            if (nombre.includes('tomillo')) {
                resultadoSernido = 0;
            } else {
                resultadoSernido = (kilos * 0.08) * 5;
            }
        }
    }

    return {
        total: resultado + resultadoEtiquetado + resultadoSellado + resultadoSernido,
        envasado: resultado,
        etiquetado: resultadoEtiquetado,
        sellado: resultadoSellado,
        cernido: resultadoSernido
    };
}

// Update the configurarPanelInfo function
function configurarPanelInfo(card) {
    const infoIcon = card.querySelector('.info-icon');
    const panelInfo = card.querySelector('.panel-info');
    const header = card.querySelector('.registro-header');
    
    if (!infoIcon || !panelInfo) return;

    infoIcon.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent event from bubbling up
        
        // Close all other panels first
        document.querySelectorAll('.panel-info.active').forEach(panel => {
            if (panel !== panelInfo) {
                panel.classList.remove('active');
            }
        });
        
        // Toggle current panel
        panelInfo.classList.toggle('active');
    });

    // Prevent panel from closing when clicking inside it
    panelInfo.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    // Close panel when clicking anywhere else in the document
    document.addEventListener('click', (e) => {
        if (!infoIcon.contains(e.target) && !panelInfo.contains(e.target)) {
            panelInfo.classList.remove('active');
        }
    });

    // Prevent header click from triggering details when clicking info icon
    header.addEventListener('click', (e) => {
        if (infoIcon.contains(e.target)) {
            e.stopPropagation();
        }
    });
}
