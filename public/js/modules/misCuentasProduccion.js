export async function cargarRegistrosCuentas() {
    try {
        mostrarCarga();
        const response = await fetch('/obtener-registros');
        const data = await response.json();

        if (data.success) {
            const container = document.querySelector('.cuentasProduccion-view');

            // Crear un contenedor para los registros
            const registrosContainer = document.createElement('div');
            registrosContainer.className = 'registros-container';
            container.innerHTML = ''; // Limpiar contenedor
            container.appendChild(registrosContainer);

            if (data.registros && data.registros.length > 0) {
                data.registros.forEach(registro => {
                    const card = crearTarjetaRegistro(registro);
                    registrosContainer.appendChild(card);
                });
            } else {
                registrosContainer.innerHTML = '<p class="no-registros">No hay registros disponibles</p>';
            }
        } else {
            mostrarNotificacion(data.error || 'Error al cargar los registros', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error al cargar los registros', 'error');
    }
    finally {
        ocultarCarga();
    }
}
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
        </div>
        <div class="panel-info">
            <div class="panel-content">
                <h4>Desglose de Costos</h4>
                <p><span>Envasado:</span> ${resultados.envasado.toFixed(2)} Bs.</p>
                <p><span>Etiquetado:</span> ${resultados.etiquetado.toFixed(2)} Bs.</p>
                <p><span>Sellado:</span> ${resultados.sellado.toFixed(2)} Bs.</p>
                <p><span>Cernido:</span> ${resultados.cernido.toFixed(2)} Bs.</p>
                <p class="total"><span>Total:</span> ${resultados.total.toFixed(2)} Bs.</p>
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
export function mostrarDetalles(card) {
    const detalles = card.querySelector('.registro-detalles');
    const todosLosDetalles = document.querySelectorAll('.registro-detalles');

    // Cerrar otros detalles abiertos
    todosLosDetalles.forEach(det => {
        if (det !== detalles && det.classList.contains('active')) {
            det.classList.remove('active');
        }
    });

    // Toggle detalles actuales
    detalles.classList.toggle('active');
}
function configurarPanelInfo(card) {
    const infoIcon = card.querySelector('.info-icon');
    const panelInfo = card.querySelector('.panel-info');
    
    if (!infoIcon || !panelInfo) return;

    infoIcon.addEventListener('click', (e) => {
        e.stopPropagation();
        panelInfo.classList.toggle('active');
        
        // Cerrar otros paneles abiertos
        document.querySelectorAll('.panel-info.active').forEach(panel => {
            if (panel !== panelInfo) {
                panel.classList.remove('active');
            }
        });
    });

    // Cerrar panel al hacer clic fuera
    document.addEventListener('click', (e) => {
        if (!infoIcon.contains(e.target) && !panelInfo.contains(e.target)) {
            panelInfo.classList.remove('active');
        }
    });
}
