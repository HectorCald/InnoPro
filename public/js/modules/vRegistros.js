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
        // Obtener el rol una sola vez al inicio
        const rolResponse = await fetch('/obtener-mi-rol');
        const userData = await rolResponse.json();
        const esAdmin = userData.rol === 'Administración';

        const response = await fetch('/obtener-todos-registros');
        const data = await response.json();

        if (data.success) {
            const container = document.querySelector('.verificarRegistros-view');
            container.innerHTML = '<h2 class="section-title"><i class="fas fa-check-double verificado-icon"></i> Registros</h2>';

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

            mostrarNotificacion('Registros cargados correctamente');
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
    const [dia, mes] = registro[0].split('/');
    const fechaFormateada = `${dia}/${mes}`;

    const registroCard = document.createElement('div');
    registroCard.className = 'registro-card';
    registroCard.dataset.fecha = registro[0];
    registroCard.dataset.producto = registro[1];
    registroCard.dataset.lote = registro[2];
    registroCard.dataset.operario = registro[8];

    const cantidadAUsar = registro[10] ? registro[9] : registro[6];
    const resultados = calcularTotal(registro[1], cantidadAUsar, registro[3], registro[4]);

    // Botones para administradores
    // En la función crearRegistroCard, modificar la parte de botonesAdmin
    const botonesAdmin = esAdmin ? `
    <button onclick="eliminarRegistro('${registro[0]}', '${registro[1]}', '${registro[2]}', '${registro[8]}')" class="btn-eliminar-registro">
        <i class="fas fa-trash"></i> Eliminar
    </button>
    ${registro[10] ? `
        <button onclick="pagarRegistro('${registro[0]}', '${registro[1]}', '${registro[2]}', '${registro[8]}')" class="btn-pagar-registro">
            <i class="fas fa-dollar-sign"></i> Pagar
        </button>
    ` : ''}
` : '';

    // Botón de eliminar para usuarios normales (solo si no está verificado)
    const botonEliminarUsuario = !esAdmin && !registro[10] ? `
        <button onclick="eliminarRegistro('${registro[0]}', '${registro[1]}', '${registro[2]}', '${registro[8]}')" class="btn-eliminar-registro">
            <i class="fas fa-trash"></i> Eliminar
        </button>
    ` : '';

    registroCard.innerHTML = `
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
                        <button onclick="verificarRegistro('${registro[0]}', '${registro[1]}', '${registro[2]}', '${registro[8]}')" class="btn-editar">
                            <i class="fas fa-check-circle"></i> Verificar
                        </button>
                        ${botonEliminarUsuario}
                    ` : botonesAdmin}
                </div>
            `}
        </div>
    `;

    configurarPanelInfo(registroCard);
    configurarEventosRegistro(registroCard);

    return registroCard;
}
export async function pagarRegistro(fecha, producto, lote, operario) {
    try {
        const registroCard = document.querySelector(`.registro-card[data-fecha="${fecha}"][data-producto="${producto}"][data-lote="${lote}"][data-operario="${operario}"]`);
        if (!registroCard) return;

        // Verificar si el registro está verificado
        const estaVerificado = registroCard.querySelector('.verificado-icon');
        if (!estaVerificado) {
            mostrarNotificacion('El registro debe estar verificado antes de poder pagarlo', 'error');
            return;
        }

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
                total
            })
        });

        const data = await response.json();
        if (data.success) {
            // Actualizar la UI
            registroCard.querySelector('.registro-total').classList.add('pagado');
            registroCard.querySelector('.btn-pagar-registro').disabled = true;
            registroCard.querySelector('.btn-pagar-registro').style.backgroundColor = '#888';

            // Fijar los valores del panel de información
            const panelInfo = registroCard.querySelector('.panel-info');
            const valoresActuales = panelInfo.innerHTML;
            panelInfo.innerHTML = valoresActuales;

            mostrarNotificacion('Pago registrado correctamente');
        } else {
            mostrarNotificacion(data.error || 'Error al registrar el pago', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error al registrar el pago', 'error');
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
        const fechaA = new Date(`${yearA}-${mesA}-${diaA}`);
        const fechaB = new Date(`${yearB}-${mesB}-${diaB}`);
        return fechaB - fechaA;
    });
}


export function verificarRegistro(fecha, producto, lote, operario) {
    const anuncio = document.querySelector('.anuncio');
    const contenido = anuncio.querySelector('.anuncio-contenido');
    const btnConfirmar = anuncio.querySelector('.confirmar');
    const btnCancelar = anuncio.querySelector('.cancelar');
    const fondo = document.querySelector('.overlay').style.display = 'flex';

    // Configurar el estilo del anuncio como modal
    btnConfirmar.textContent = 'Verificar';
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