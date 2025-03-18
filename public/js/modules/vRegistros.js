export async function cargarRegistros() {
    try {
        mostrarCarga();
        const response = await fetch('/obtener-todos-registros');
        const data = await response.json();

        if (data.success) {
            const container = document.querySelector('.verificarRegistros-view');
            container.innerHTML = '<h3 class="titulo-seccion">Verificar Registros</h3>';

            // Agrupar registros por nombre de operario, saltando la primera fila (encabezados)
            const registrosPorOperario = {};
            data.registros.slice(1).forEach(registro => {
                if (!registro[8]) return; // Saltar filas sin nombre de operario
                if (!registrosPorOperario[registro[8]]) {
                    registrosPorOperario[registro[8]] = [];
                }
                registrosPorOperario[registro[8]].push(registro);
            });

            // Ordenar nombres alfabéticamente
            const nombresOrdenados = Object.keys(registrosPorOperario).sort();

            // Crear tarjetas para cada operario
            nombresOrdenados.forEach(nombre => {
                const registros = registrosPorOperario[nombre];
                const operarioCard = document.createElement('div');
                operarioCard.className = 'fecha-card'; // Mantenemos la misma clase para el estilo

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

                // Contenedor para los registros de este operario
                const registrosContainer = document.createElement('div');
                registrosContainer.className = 'registros-grupo';

                // Añadir evento click al header
                operarioHeader.addEventListener('click', () => {
                    registrosContainer.classList.toggle('active');
                    const icono = operarioHeader.querySelector('.fa-chevron-down');
                    icono.style.transform = registrosContainer.classList.contains('active') ? 'rotate(180deg)' : 'rotate(0)';
                });

                // Ordenar registros por fecha (del más reciente al más antiguo)
                registros.sort((a, b) => {
                    const [diaA, mesA, yearA] = a[0].split('/');
                    const [diaB, mesB, yearB] = b[0].split('/');
                    const fechaA = new Date(`${yearA}-${mesA}-${diaA}`);
                    const fechaB = new Date(`${yearB}-${mesB}-${diaB}`);
                    return fechaB - fechaA;
                });

                registros.forEach(registro => {
                    // Formatear la fecha para mostrar el año abreviado
                    const [dia, mes, año] = registro[0].split('/');
                    const fechaFormateada = `${dia}/${mes}/${año.slice(-2)}`; // Toma solo los últimos 2 dígitos del año

                    const registroCard = document.createElement('div');
                    registroCard.className = 'registro-card';
                    registroCard.innerHTML = `
                        <div class="registro-header">
                            ${registro[10] ? '<i class="fas fa-check-circle verificado-icon"></i>' : ''}
                            <span class="registro-fecha">${fechaFormateada}</span>
                            <span class="registro-producto">${registro[1]}</span>
                            <span class="registro-total">${calcularTotal(registro[1], registro[6], registro[3]).toFixed(2)} Bs.</span>
                            <i class="fas fa-chevron-down"></i>
                        </div>
                        <div class="registro-detalles">
                            <p><span>Lote:</span> ${registro[2] || '-'}</p>
                            <p><span>Gramaje:</span> ${registro[3] || '-'}</p>
                            <p><span>Selección:</span> ${registro[4] || '-'}</p>
                            <p><span>Microondas:</span> ${registro[5] || '-'}</p>
                            <p><span>Envases:</span> ${registro[6] || '-'}</p>
                            <p><span>Vencimiento:</span> ${registro[7] || '-'}</p>
                            <p><span>Estado:</span> <span class="estado ${(registro[9] || 'pendiente').toLowerCase()}">${registro[9] || 'Pendiente'}</span></p>
                            ${registro[10] ? `
                                <p><span>Fecha Verificación:</span> ${registro[10]}</p>
                                <p><span>Cantidad Real:</span> ${registro[9] || '-'}</p>
                                <p><span>Observaciones:</span> ${registro[11] || '-'}</p>
                            ` : `
                                <div class="acciones">
                                    <button onclick="verificarRegistro('${registro[0]}', '${registro[1]}', '${registro[2]}', '${registro[8]}')" class="btn-editar">
                                        <i class="fas fa-check-circle"></i> Verificar
                                    </button>
                                </div>
                            `}
                        </div>
                    `;

                    // Evento para expandir/colapsar detalles (ahora funciona para todos los registros)
                    registroCard.querySelector('.registro-header').addEventListener('click', () => {
                        const detalles = registroCard.querySelector('.registro-detalles');
                        detalles.classList.toggle('active');
                        const icono = registroCard.querySelector('.fa-chevron-down');
                        icono.style.transform = detalles.classList.contains('active') ? 'rotate(180deg)' : 'rotate(0)';
                    });

                    registrosContainer.appendChild(registroCard);
                });

                operarioCard.appendChild(registrosContainer);
                container.appendChild(operarioCard);
            });
        }
    } catch (error) {
        console.error('Error al cargar registros:', error);
        mostrarNotificacion('Error al cargar los registros', 'error');
    }
    finally {
        ocultarCarga();
    }
}
export function verificarRegistro(fecha, producto, lote, operario) {
    const anuncio = document.querySelector('.anuncio');
    const contenido = anuncio.querySelector('.anuncio-contenido');
    const btnConfirmar = anuncio.querySelector('.confirmar');
    const btnCancelar = anuncio.querySelector('.cancelar');

    // Configurar el estilo del anuncio como modal
    btnConfirmar.textContent = 'Guardar';
    btnConfirmar.style.backgroundColor = '#4CAF50';
    btnCancelar.style.display = 'block';

    // Establecer la fecha actual por defecto
    const fechaHoy = new Date().toISOString().split('T')[0];

    // Personalizar el contenido del anuncio
    mostrarCarga();
    contenido.querySelector('h2').textContent = 'Verificar Registro';
    contenido.querySelector('p').innerHTML = `
        <form id="form-verificacion">
            <div class="form-group">
                <label for="cantidad-real">Cantidad Real:</label>
                <input type="number" id="cantidad-real" required>
            </div>
            <div class="form-group">
                <label for="fecha-verificacion">Fecha de Verificación:</label>
                <input type="date" id="fecha-verificacion" value="${fechaHoy}" required onlyread>
            </div>
            <div class="form-group">
                <label for="observaciones">Observaciones:</label>
                <textarea id="observaciones" rows="3"></textarea>
            </div>
        </form>
    `;
    ocultarCarga();
    // Mostrar el anuncio
    anuncio.style.display = 'flex';
    document.querySelector('.container').classList.add('no-touch');

    // Manejar la confirmación
    btnConfirmar.onclick = async () => {
        const cantidadReal = document.getElementById('cantidad-real').value;
        const fechaVerificacion = document.getElementById('fecha-verificacion').value;
        const observaciones = document.getElementById('observaciones').value;

        if (!cantidadReal || !fechaVerificacion) {
            mostrarNotificacion('Por favor complete los campos requeridos', 'error');
            return;
        }

        try {
            mostrarCarga();
            const response = await fetch('/actualizar-verificacion', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    fecha,
                    producto,
                    lote,
                    operario,
                    verificacion: cantidadReal,
                    fechaVerificacion,
                    observaciones
                })
            });

            const data = await response.json();
            if (data.success) {
                mostrarNotificacion('Verificación guardada correctamente');
                anuncio.style.display = 'none';
                document.querySelector('.container').classList.remove('no-touch');
                cargarRegistros(); // Recargar los registros
            } else {
                mostrarNotificacion(data.error || 'Error al guardar la verificación', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            mostrarNotificacion('Error al guardar la verificación', 'error');
        }
        finally {
            ocultarCarga();
        }
    };

    // Manejar la cancelación
    btnCancelar.onclick = () => {
        anuncio.style.display = 'none';
        document.querySelector('.container').classList.remove('no-touch');
    };
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
        if (nombre.includes('tomillo')) {
            resultadoSernido = 0;
        }
        else {
            resultadoSernido = (kilos * 0.08) * 5;
        }
    }
    return resultado + resultadoEtiquetado + resultadoSellado + resultadoSernido;
}