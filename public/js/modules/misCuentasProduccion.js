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
    finally{
        ocultarCarga();
    }
}

export function crearTarjetaRegistro(registro) {
    const div = document.createElement('div');
    div.className = 'registro-card';
    
    // Verificar que registro sea un array válido
    if (!Array.isArray(registro)) {
        console.error('Registro inválido:', registro);
        return div;
    }

    div.innerHTML = `
        <div class="registro-header">
            <div class="registro-info">
                ${registro[10] ? '<i class="fas fa-check-circle verificado-icon"></i>' : ''}
                <div class="registro-fecha">${registro[0] || 'Sin fecha'}</div>
                <div class="registro-producto">${registro[1] || 'Sin producto'}</div>
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

    // Agregar el evento click directamente
    const header = div.querySelector('.registro-header');
    header.addEventListener('click', () => mostrarDetalles(div));

    return div;
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