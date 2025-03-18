export function inicializarConsulta() {
    const container = document.querySelector('.consultarRegistros-view');
    container.innerHTML = `
        <div class="consulta-view">
            <div class="title">
                <h3>Consulta de Registros</h3>
            </div>
            <div class="filtros-container">
                <div class="filtro">
                    <p>Rango de Fechas</p>
                    <div class="fecha-range">
                        <input type="date" id="filtroFechaInicio" placeholder="Fecha Inicio">
                        <span>hasta</span>
                        <input type="date" id="filtroFechaFin" placeholder="Fecha Fin">
                    </div>
                </div>
                <div class="filtro">
                    <p>Numero de Lote</p>
                    <input type="number" id="filtroLote" placeholder="Número de Lote">
                </div>
                <div class="filtro">
                    <p>Nombre del producto</p>
                    <input type="text" name="producto" id="producto-input" list="productos-list"
                        placeholder="Nombre del producto" autocomplete="off" required>
                    <datalist id="productos-list">
                    </datalist>
                </div>
                <div class="filtro">
                    <p>Nombre del Operario</p>
                    <input type="text" id="filtroNombre" placeholder="Nombre del operario">
                </div>
                <div class="btn-container">
                    <button class="btn-buscar" onclick="buscarRegistros()">
                        <i class="fas fa-search"></i> Buscar
                    </button>
                    <button class="btn-limpiar" onclick="limpiarFiltros()">
                        <i class="fas fa-eraser"></i> Limpiar
                    </button>
                </div>
            </div>
            <div class="resultados-container">
            </div>
        </div>
    `;

    // Configurar eventos
    const btnBuscar = container.querySelector('.btn-buscar');
    const btnLimpiar = container.querySelector('.btn-limpiar');
    btnBuscar.addEventListener('click', buscarRegistros);
    btnLimpiar.addEventListener('click', limpiarFiltros);
}
export function limpiarFiltros() {
    mostrarCarga();
    document.getElementById('filtroFechaInicio').value = '';
    document.getElementById('filtroFechaFin').value = '';
    document.getElementById('filtroLote').value = '';
    document.getElementById('producto-input').value = '';
    document.getElementById('filtroNombre').value = '';
    
    // Limpiar resultados
    const container = document.querySelector('.resultados-container');
    container.innerHTML = '';
    ocultarCarga();
    mostrarNotificacion('Filtros limpiados', 'success');
}
export async function buscarRegistros() {
    try {
        mostrarCarga();
        const fechaInicio = document.getElementById('filtroFechaInicio').value;
        const fechaFin = document.getElementById('filtroFechaFin').value;
        const lote = document.getElementById('filtroLote').value;
        const producto = document.getElementById('producto-input').value;
        const nombre = document.getElementById('filtroNombre').value;

        console.log('Filtros:', { fechaInicio, fechaFin, lote, producto, nombre });

        const response = await fetch('/obtener-todos-registros');
        const data = await response.json();

        if (data.success) {
            const registrosFiltrados = data.registros.slice(1).filter(registro => {
                if (!registro || registro.length < 9) return false;

                // Convertir la fecha del registro al formato YYYY-MM-DD
                const [dia, mes, anio] = registro[0].split('/');
                const fechaRegistro = new Date(anio, mes - 1, dia);
                fechaRegistro.setHours(12, 0, 0, 0); 
               

                // Verificar el rango de fechas
                                // Verificar el rango de fechas
                                let cumpleFecha = true;
                                if (fechaInicio && fechaFin) {
                                    const inicio = new Date(fechaInicio + 'T00:00:00');
                                    const fin = new Date(fechaFin + 'T23:59:59');
                                    cumpleFecha = fechaRegistro >= inicio && fechaRegistro <= fin;
                                } else if (fechaInicio) {
                                    const inicio = new Date(fechaInicio + 'T00:00:00');
                                    cumpleFecha = fechaRegistro >= inicio;
                                } else if (fechaFin) {
                                    const fin = new Date(fechaFin + 'T23:59:59');
                                    cumpleFecha = fechaRegistro <= fin;
                                }
                const cumpleProducto = !producto || 
                    registro[1].toLowerCase().includes(producto.toLowerCase());
                const cumpleLote = !lote || 
                    String(registro[2]).toLowerCase().includes(String(lote).toLowerCase());
                const cumpleNombre = !nombre || 
                    registro[8].toLowerCase().includes(nombre.toLowerCase());

                return cumpleFecha && cumpleProducto && cumpleLote && cumpleNombre;
            });

            console.log('Registros filtrados:', registrosFiltrados);
            mostrarResultadosBusqueda(registrosFiltrados);
        } else {
            mostrarNotificacion('Error al obtener registros', 'error');
        }
    } catch (error) {
        console.error('Error en la búsqueda:', error);
        mostrarNotificacion('Error al buscar registros', 'error');
    }
    finally{
        ocultarCarga();
    }
}
export function mostrarResultadosBusqueda(registros) {
    const container = document.querySelector('.resultados-container');
    container.innerHTML = '';

    if (!registros || registros.length === 0) {
        container.innerHTML = '<p class="no-resultados">No se encontraron registros</p>';
        return;
    }

    registros.forEach(registro => {
        const card = document.createElement('div');
        card.className = 'registro-card';
        
        // Determinar qué cantidad usar basado en si está verificado
        const cantidadAUsar = registro[10] ? registro[9] : registro[6];
        const resultados = calcularTotal(registro[1], cantidadAUsar, registro[3], registro[4]);

        // Formatear la fecha para mostrar solo día y mes
        const [dia, mes] = registro[0].split('/');
        const fechaFormateada = `${dia}/${mes}`;

        card.innerHTML = `
            <div class="registro-header">
                <div class="registro-info">
                    ${registro[10] ? '<i class="fas fa-check-circle verificado-icon"></i>' : ''}
                    <span class="registro-producto">${registro[1]}</span>
                    <span class="registro-fecha">${fechaFormateada}</span>
                </div>
                <div class="registro-total ${!registro[10] ? 'no-verificado' : ''}">${resultados.total.toFixed(2)} Bs.</div>
            </div>
            <div class="registro-detalles">
                <p><span>Lote:</span> ${registro[2] || '-'}</p>
                <p><span>Gramaje:</span> ${registro[3] || '-'}</p>
                <p><span>Selección:</span> ${registro[4] || '-'}</p>
                <p><span>Microondas:</span> ${registro[5] || '-'}</p>
                <p><span>Envases:</span> ${registro[6] || '-'}</p>
                <p><span>Vencimiento:</span> ${registro[7] || '-'}</p>
                <p><span>Operario:</span> ${registro[8] || '-'}</p>
                ${registro[10] ? `
                    <p><span>Verificación:</span> ${registro[10]}</p>
                    <p><span>Cantidad Real:</span> ${registro[9] || '-'}</p>
                    <p><span>Observaciones:</span> ${registro[11] || '-'}</p>
                ` : ''}
            </div>
        `;

        // Añadir evento para expandir/colapsar detalles
        const header = card.querySelector('.registro-header');
        const detalles = card.querySelector('.registro-detalles');
        header.addEventListener('click', () => {
            detalles.classList.toggle('active');
        });

        container.appendChild(card);
    });
}
function calcularTotal(nombre, cantidad, gramaje, seleccion) {

    nombre = (nombre || '').toLowerCase();
    cantidad = parseFloat(cantidad) || 0;
    gramaje = parseFloat(gramaje) || 0;

    let resultado = cantidad;
    let resultadoEtiquetado = cantidad;
    let resultadoSellado = cantidad;
    const kilos = (cantidad * gramaje) / 1000;
    let resultadoSernido = 0;

    // Lógica para envasado
    if (nombre.includes('Pipoca')) {
        if (gramaje >= 1000) {
            resultado = (cantidad * 5) * 0.048;
        } else if (gramaje >= 500) {
            resultado = (cantidad * 4) * 0.048;
        } else {
            resultado = (cantidad * 2) * 0.048;
        }
    } else if (nombre.includes('bote') || (nombre.includes('clavo de olor entero') && gramaje === 12)) {
        resultado = (cantidad * 2) * 0.048;
    } else if (nombre.includes('laurel') || nombre.includes('huacatay') || nombre.includes('albahaca') || (nombre.includes('canela') && gramaje === 14)) {
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
            }
            else {
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
