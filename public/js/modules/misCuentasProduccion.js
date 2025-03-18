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

    // Calcular el total
    const total = calcularTotal(registro[1], registro[6], registro[3]); // nombre, cantidad, gramaje

    div.innerHTML = `
        <div class="registro-header">
                ${registro[10] ? '<i class="fas fa-check-circle verificado-icon"></i>' : ''}
                <div class="registro-fecha">${registro[0] || 'Sin fecha'}</div>
                <div class="registro-producto">${registro[1] || 'Sin producto'}</div>
                <div class="registro-total">${total.toFixed(2)} Bs.</div>
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

    return div;
}
function calcularTotal(nombre, cantidad, gramaje) {
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

    // Lógica para sernido
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
        if(nombre.includes('tomillo')){
            resultadoSernido = 0;
        }
        else{
            resultadoSernido = (kilos * 0.08) * 5;
        }
    }
    return resultado + resultadoEtiquetado + resultadoSellado + resultadoSernido;
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