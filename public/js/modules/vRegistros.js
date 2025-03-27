// Agregar al inicio del archivo
let reglasEspeciales = null;
let preciosBase = null;

// Función para obtener las reglas
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

    // Buscar si existe una regla especial para este producto
    const regla = reglasEspeciales?.find(r => {
        const nombreCoincide = nombre.includes(r.producto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ""));
        const gramajeCumple = r.gramajeMin && r.gramajeMax ? 
            (gramaje >= parseFloat(r.gramajeMin) && gramaje <= parseFloat(r.gramajeMax)) : 
            true;
        return nombreCoincide && gramajeCumple;
    });

    // Obtener multiplicadores y precios base
    const multiplicadores = {
        etiquetado: regla?.etiquetado || '1',
        sellado: regla?.sellado || '1',
        envasado: regla?.envasado || '1',
        cernido: regla?.cernido || preciosBase?.cernidoBolsa || 0
    };

    // Calcular resultados usando los multiplicadores y precios base
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
        await inicializarReglas(); // Agregar esta línea
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
    const estaPagado = registro[12];

    const registroCard = document.createElement('div');
    registroCard.className = 'registro-card';
    registroCard.dataset.fecha = registro[0];
    registroCard.dataset.producto = registro[1];
    registroCard.dataset.lote = registro[2];
    registroCard.dataset.operario = registro[8];

    const cantidadAUsar = registro[10] ? registro[9] : registro[6];
    const resultados = estaPagado ? {
        total: parseFloat(registro[12]),
        envasado: 0,
        etiquetado: 0,
        sellado: 0,
        cernido: 0
    } : calcularTotal(registro[1], cantidadAUsar, registro[3], registro[4]);

    // Botones para administradores
    // En la función crearRegistroCard, modificar la parte de botonesAdmin
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
            <div class="registro-fecha">${fechaFormateada}</div>
            <div class="registro-producto">${registro[1] || 'Sin producto'}</div>
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

    configurarPanelInfo(registroCard);
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
        const fechaA = new Date(`${yearA}-${mesA}-${diaA}`);
        const fechaB = new Date(`${yearB}-${mesB}-${diaB}`);
        return fechaB - fechaA;
    });
}
export function verificarRegistro(fecha, producto, lote, operario, gramaje, seleccion, microondas, envases, vencimiento) {
    const anuncio = document.querySelector('.anuncio');
    const anuncioContenido = anuncio.querySelector('.anuncio-contenido');
    
    // Configurar el contenido del anuncio
    anuncioContenido.innerHTML = `
        <h2>Verificar Registro</h2>
        <div class="detalles-verificacion">
            <div class="form-group">
                <label>Fecha: <span>${fecha}</span></label>
                <label>Producto: <span>${producto}</span></label>
                <label>Envases terminados: <span>${envases}</span></label>
            </div>
            <form id="form-verificacion">
                <div class="form-group">
                    <label for="cantidad-real">Cantidad Real:</label>
                    <input type="number" id="cantidad-real" required min="0" step="1">
                </div>
                <div class="form-group">
                    <label for="fecha-verificacion">Fecha de Verificación:</label>
                    <input type="date" id="fecha-verificacion" value="${new Date().toISOString().split('T')[0]}" required readonly>
                </div>
                <div class="form-group">
                    <label for="observaciones">Observaciones:</label>
                    <textarea id="observaciones" rows="3"></textarea>
                </div>
            </form>
        </div>
        <div class="anuncio-botones">
            <button class="anuncio-btn confirmar">Verificar</button>
            <button class="anuncio-btn cancelar">Cancelar</button>
        </div>
    `;

    // Mostrar el anuncio y el overlay
    anuncio.style.display = 'flex';
    document.querySelector('.overlay').style.display = 'block';
    document.querySelector('.container').classList.add('no-touch');

    // Obtener referencias a los botones después de crear el contenido
    const btnConfirmar = anuncioContenido.querySelector('.confirmar');
    const btnCancelar = anuncioContenido.querySelector('.cancelar');

    // Configurar estilos de los botones
    btnConfirmar.style.backgroundColor = '#4CAF50';
    btnCancelar.style.backgroundColor = '#6c757d';

    // Manejar la confirmación
    btnConfirmar.onclick = async () => {
        const cantidadReal = document.getElementById('cantidad-real').value;
        const fechaVerificacion = document.getElementById('fecha-verificacion').value;
        const observaciones = document.getElementById('observaciones').value;

        if (!cantidadReal || cantidadReal < 0) {
            mostrarNotificacion('Por favor ingrese una cantidad real válida', 'error');
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
                    gramaje,
                    seleccion,
                    microondas,
                    envases,
                    vencimiento,
                    operario,
                    verificacion: cantidadReal,
                    fechaVerificacion,
                    observaciones
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
                throw new Error(data.error || 'Error al guardar la verificación');
            }
        } catch (error) {
            console.error('Error:', error);
            mostrarNotificacion(error.message || 'Error al guardar la verificación', 'error');
        } finally {
            ocultarCarga();
        }
    };

    // Manejar la cancelación
    btnCancelar.onclick = () => {
        anuncio.style.display = 'none';
        document.querySelector('.overlay').style.display = 'none';
        document.querySelector('.container').classList.remove('no-touch');
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