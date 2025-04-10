
const cronometros = {};
const lotesSeleccionados = new Set();
export function inicializarTareas() {
    const container = document.querySelector('.newTarea-view');
    container.innerHTML = `
        <div class="title">
            <h3><i class="fas fa-tasks"></i> Gestión de Tareas</h3>
        </div>
        <div class="tareas-container">
            <div class="tareas-botones">
                <div class="cuadro-btn"><button class="btn-agregar-tarea btn-tarea" onclick="mostrarFormularioTarea()">
                    <i class="fas fa-plus"></i>
                </button>
                    <p>Iniciar</p>
                </div>
                <div class="cuadro-btn">
                    <button class="btn-toggle-programa btn-tarea" onclick="mostrarProgramaAcopio()">
                        <i class="fas fa-calendar-alt"></i>
                    </button>
                    <p>Programa</p>
                </div> 
            </div>
            <div class="lista-tareas"></div>
        </div>
        
    `;
    cargarTareasEnProceso();
}
export async function mostrarFormularioTarea(productoPreseleccionado = null) {
    try {
        mostrarCarga();
        const response = await fetch('/obtener-almacen-acopio');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || 'Error al cargar los productos');
        }

        if (!data.pedidos || data.pedidos.length === 0) {
            throw new Error('No hay productos disponibles');
        }

        const anuncio = document.querySelector('.anuncio');
        const contenido = anuncio.querySelector('.anuncio-contenido');
        let nombreProductoActual = productoPreseleccionado || '';


        function mostrarFormularioPrincipal() {
            contenido.innerHTML = `
                <h2><i class="fas fa-plus-circle"></i>Nueva Tarea</h2>
                <div class="relleno">
                    <div class="campo-form">
                        <div class="autocomplete-wrapper">
                            <input type="text" id="nombre-tarea" placeholder="Nombre del producto" 
                                value="${nombreProductoActual}" 
                            ${productoPreseleccionado ? 'readonly' : ''}>
                                <div id="sugerencias-lista" class="sugerencias-lista"></div>
                        </div>
                        <button class="btn-lotes anuncio-btn add" id="btn-mostrar-lotes">
                            <i class="fas fa-boxes"></i>
                        </button>
                    </div>
                    <div class="campo-form peso-disponible"></div>
                    <div class="campo-form">
                        <p>Peso Inicial:</p>
                        <input type="number" id="peso-tarea" placeholder="Peso en kg" step="0.01">
                    </div>
                    <div class="form-grup">
                        <p>Descripción:</p>
                        <textarea id="descripcion-tarea" placeholder="Descripción" rows="3"></textarea>
                    </div>
                </div>
                <div class="anuncio-botones">
                    <button class="anuncio-btn close cancelar"><i class="fas fa-times"></i></button>
                    <button class="anuncio-btn green confirmar"><i class="fas fa-play-circle"></i>  Iniciar Tarea</button>
                </div>
            `;
            setupEventListeners();
        }

        function setupEventListeners() {
            const inputTarea = document.getElementById('nombre-tarea');
            const sugerenciasList = document.getElementById('sugerencias-lista');
            const pesoInput = document.getElementById('peso-tarea');
            const pesoDisponible = document.querySelector('.peso-disponible');
            const btnMostrarLotes = document.getElementById('btn-mostrar-lotes');
        
            if (!productoPreseleccionado) {
                inputTarea.addEventListener('input', () => {
                    const inputValue = inputTarea.value.toLowerCase();
                    nombreProductoActual = inputTarea.value;
                    // Modificamos esta parte para asegurarnos que pedidos existe y tiene el formato correcto
                    const sugerencias = data.pedidos
                        .filter(pedido => pedido && pedido[1]) // Aseguramos que el pedido y su nombre existen
                        .map(pedido => pedido[1]) // Tomamos el nombre del producto
                        .filter(nombre => 
                            nombre.toLowerCase().includes(inputValue)
                        );
        
                    if (inputValue && sugerencias.length > 0) {
                        sugerenciasList.innerHTML = sugerencias
                            .map(nombre => `<div class="sugerencia-item">${nombre}</div>`)
                            .join('');
                        sugerenciasList.style.display = 'block';
                    } else {
                        sugerenciasList.style.display = 'none';
                    }
                });
        
                // Mejoramos el manejo del clic en las sugerencias
                sugerenciasList.addEventListener('click', (e) => {
                    if (e.target.classList.contains('sugerencia-item')) {
                        nombreProductoActual = e.target.textContent;
                        inputTarea.value = nombreProductoActual;
                        sugerenciasList.style.display = 'none';
                        // Enfocamos el siguiente campo después de seleccionar
                        document.getElementById('peso-tarea').focus();
                    }
                });
        
                // Agregamos manejo de teclado para mejor usabilidad
                inputTarea.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' && sugerenciasList.children.length > 0) {
                        e.preventDefault();
                        const primeraSugerencia = sugerenciasList.querySelector('.sugerencia-item');
                        if (primeraSugerencia) {
                            nombreProductoActual = primeraSugerencia.textContent;
                            inputTarea.value = nombreProductoActual;
                            sugerenciasList.style.display = 'none';
                            document.getElementById('peso-tarea').focus();
                        }
                    }
                });
            }

        // Mejoramos el manejo del clic en las sugerencias
        sugerenciasList.addEventListener('click', (e) => {
            if (e.target.classList.contains('sugerencia-item')) {
                nombreProductoActual = e.target.textContent;
                inputTarea.value = nombreProductoActual;
                sugerenciasList.style.display = 'none';
                // Enfocamos el siguiente campo después de seleccionar
                document.getElementById('peso-tarea').focus();
            }
        });
            // Manejador del botón de lotes
            if (btnMostrarLotes) {
                btnMostrarLotes.addEventListener('click', async () => {
                    const nombreTarea = document.getElementById('nombre-tarea').value;
                    if (!nombreTarea) {
                        mostrarNotificacion('Por favor ingrese el nombre del producto primero', 'error');
                        return;
                    }
                    await cargarLotes(nombreTarea);
                });
            }

            // Update peso input max based on selected lots
            if (pesoInput && pesoDisponible) {
                const pesoTotal = Array.from(lotesSeleccionados)
                    .reduce((sum, lote) => sum + parseFloat(lote.peso.toString().replace(',', '.')), 0);

                if (pesoTotal > 0) {
                    pesoDisponible.textContent = `Peso total disponible: ${pesoTotal.toFixed(2).toString().replace('.', ',')}kg`;
                    pesoInput.max = pesoTotal;
                } else {
                    pesoDisponible.textContent = '';
                }
            }

            const confirmarBtn = contenido.querySelector('.confirmar');
            if (confirmarBtn) {
                confirmarBtn.addEventListener('click', () => {
                    const lotes = Array.from(lotesSeleccionados).map(l => l.lote);
                    if (lotes.length === 0) {
                        mostrarNotificacion('Por favor seleccione al menos un lote', 'error');
                        return;
                    }
                    guardarTareaConLote(lotes, data); // Pasamos data como parámetro
                });
            }

            const cancelarBtn = contenido.querySelector('.cancelar');
            if (cancelarBtn) {
                cancelarBtn.addEventListener('click', () => {
                    anuncio.style.display = 'none';
                });
            }
        }

        async function cargarLotes(nombreProducto) {
            try {
                mostrarCarga();
                // Primero obtenemos el ID del producto usando el nombre
                const productoSeleccionado = data.pedidos.find(pedido => pedido[1] === nombreProducto);
                
                if (!productoSeleccionado) {
                    throw new Error('Producto no encontrado');
                }
        
                const productoId = productoSeleccionado[0]; // El ID está en la posición 0
                const lotesResponse = await fetch('/obtener-almacen-acopio');
                const lotesData = await lotesResponse.json(); // Cambiamos el nombre de la variable
        
                if (!lotesData.success) {
                    throw new Error('Error al cargar los lotes');
                }
        
                // Filtramos los productos por ID y obtenemos solo los pesos brutos
                const productoInfo = lotesData.pedidos.find(pedido => pedido[0] === productoId);
                if (!productoInfo || !productoInfo[2]) { // pesoBrutoLote está en posición 2
                    throw new Error('No hay lotes disponibles para este producto');
                }
        
                // Parseamos los lotes del formato "peso-lote;peso-lote"
                const lotesArray = productoInfo[2].split(';').filter(lote => lote.trim());
                
                contenido.innerHTML = `
                    <h2><i class="fas fa-boxes"></i>Selección de Lotes</h2>
                    <div class="relleno">
                        <div class="lotes-grid">
                            ${lotesArray.length > 0 ?
                                lotesArray.map(loteInfo => {
                                    const [peso, lote] = loteInfo.split('-').map(item => item.trim());
                                    return `
                                        <div class="lote-item" data-lote="${lote}" data-peso="${peso}">
                                            <p class="lote-numero">Lote ${lote} - ${peso.toString().replace('.', ',')}kg</p>
                                        </div>
                                    `;
                                }).join('') :
                                '<div class="no-lotes">No hay lotes disponibles</div>'
                            }
                        </div>
                        <div class="lotes-seleccionados">
                            <h3>Lotes Seleccionados:</h3>
                            <div id="lotes-seleccionados-lista"></div>
                            <div class="peso-total"></div>
                        </div>
                    </div>
                    <div class="anuncio-botones">
                        <button class="anuncio-btn blue volver">
                            <i class="fas fa-arrow-left"></i> Volver
                        </button>
                        <button class="anuncio-btn green continuar">Continuar</button>
                    </div>
                `;

                document.querySelectorAll('.lote-item').forEach(item => {
                    item.addEventListener('click', function () {
                        const loteData = {
                            lote: this.dataset.lote,
                            peso: this.dataset.peso.toString().replace('.', ',') // Ensure peso is stored with comma
                        };

                        const loteExistente = Array.from(lotesSeleccionados)
                            .find(l => l.lote === loteData.lote);

                        if (loteExistente) {
                            lotesSeleccionados.delete(loteExistente);
                            this.classList.remove('selected');
                        } else {
                            lotesSeleccionados.add(loteData);
                            this.classList.add('selected');
                        }

                        actualizarResumenLotes();
                    });
                });

                contenido.querySelector('.volver').addEventListener('click', () => {
                    mostrarFormularioPrincipal();
                });

                contenido.querySelector('.continuar').addEventListener('click', () => {
                    if (lotesSeleccionados.size === 0) {
                        mostrarNotificacion('Por favor seleccione al menos un lote', 'error');
                        return;
                    }
                    mostrarFormularioPrincipal();
                });

            } catch (error) {
                mostrarNotificacion('Error al cargar lotes', 'error');
            } finally {
                ocultarCarga();
            }
        }

        function actualizarResumenLotes() {
            const listaLotes = document.getElementById('lotes-seleccionados-lista');
            const pesoTotalDiv = document.querySelector('.peso-total');
            let pesoTotal = 0;

            if (lotesSeleccionados.size > 0) {
                const lotesHTML = Array.from(lotesSeleccionados).map(lote => {
                    pesoTotal += parseFloat(lote.peso.toString().replace(',', '.'));
                    return `<div class="lote-seleccionado">
                Lote ${lote.lote} - ${lote.peso.toString().replace('.', ',')}kg
            </div>`;
                }).join('');

                listaLotes.innerHTML = lotesHTML;
                pesoTotalDiv.textContent = `Peso total: ${pesoTotal.toFixed(2).toString().replace('.', ',')}kg`;

                // Update peso input max based on selected lots
                const pesoInput = document.getElementById('peso-tarea');
                const pesoDisponible = document.querySelector('.peso-disponible');
                if (pesoInput && pesoDisponible) {
                    pesoInput.max = pesoTotal;
                    pesoDisponible.textContent = `Peso total disponible: ${pesoTotal.toFixed(2).toString().replace('.', ',')}kg`;
                }
            } else {
                listaLotes.innerHTML = '<div class="no-lotes">No hay lotes seleccionados</div>';
                pesoTotalDiv.textContent = '';
            }
        }

        mostrarFormularioPrincipal();
        if (productoPreseleccionado) {
            await cargarLotes(productoPreseleccionado);
        }

        anuncio.style.display = 'flex';
    } catch (error) {
        mostrarNotificacion(error.message, 'error');
    } finally {
        ocultarCarga();
    }
}
export async function cargarTareasEnProceso() {
    try {
        const response = await fetch('/obtener-tareas-proceso');
        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Error al cargar tareas');
        }

        const listaTareas = document.querySelector('.lista-tareas');
        if (!listaTareas) return;

        // Clear existing timers
        Object.values(cronometros).forEach(timer => clearInterval(timer));
        
        listaTareas.innerHTML = '';

        if (data.tareas.length === 0) {
            listaTareas.innerHTML = '<div class="no-tareas">No hay tareas en proceso</div>';
            return;
        }

        data.tareas.forEach(tarea => {
            const elementoTarea = document.createElement('div');
            elementoTarea.className = 'tarea-item';
            elementoTarea.innerHTML = `
                <div class="tarea-info">
                    <div class="tarea-header">
                        <h4>${tarea.nombre}</h4>
                        <span class="tarea-peso">${Number(tarea.pesoInicial).toFixed(2).toString().replace('.', ',')} kg</span>
                    </div>
                    <p class="tarea-descripcion">${tarea.descripcion || 'Sin descripción'}</p>
                    <div class="tarea-detalles">
                        <span>Inicio: ${new Date(tarea.fechaInicio).toLocaleString()}</span>
                        <span>Usuario: ${tarea.usuario}</span>
                        <span class="tarea-tiempo" data-tiempo-inicial="${tarea.tiempoInicial}">
                            ${formatearTiempo(calcularTiempoTranscurrido(tarea.tiempoInicial))}
                        </span>
                    </div>
                    <div class="tarea-acciones">
                        <button class="btn-tarea-accion btn-proceso" onclick="agregarProceso('${tarea.nombre}')">
                            <i class="fas fa-plus"></i> Proceso
                        </button>
                        <button class="btn-tarea-accion btn-finalizar" onclick="finalizarTarea('${tarea.nombre}')">
                            <i class="fas fa-check"></i> Finalizar
                        </button>
                    </div>
                </div>
                ${renderizarProcesos(tarea.procesos || [], tarea.nombre)}
            `;

            listaTareas.appendChild(elementoTarea);

            // Start timer for this task
            if (cronometros[tarea.nombre]) {
                clearInterval(cronometros[tarea.nombre]);
            }

            cronometros[tarea.nombre] = setInterval(() => {
                const tiempoElement = elementoTarea.querySelector('.tarea-tiempo');
                const tiempoInicial = parseInt(tarea.tiempoInicial);
                const tiempoActual = calcularTiempoTranscurrido(tiempoInicial);
                tiempoElement.textContent = formatearTiempo(tiempoActual);
            }, 1000);
        });
    } catch (error) {
        console.error('Error al cargar tareas:', error);
        mostrarNotificacion(error.message, 'error');
    }
}
export function iniciarCronometro(tareaId, tiempoInicial) {
    if (cronometros[tareaId]) {
        clearInterval(cronometros[tareaId]);
    }

    const elementoCronometro = document.getElementById(`cronometro-${tareaId}`);
    if (!elementoCronometro) return;

    const actualizarCronometro = () => {
        const tiempoTranscurrido = calcularTiempoTranscurrido(tiempoInicial);
        elementoCronometro.textContent = formatearTiempo(tiempoTranscurrido);
    };

    actualizarCronometro();
    cronometros[tareaId] = setInterval(actualizarCronometro, 1000);
}
export async function finalizarTarea(tareaId) {
    try {
        const confirmacion = await mostrarConfirmacion(
            '¿Finalizar esta tarea?',
            'Esta acción moverá la tarea al historial y calculará el peso restante.'
        );

        if (!confirmacion) return;

        mostrarCarga();
        const response = await fetch('/finalizar-tarea', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ tareaId })
        });

        const data = await response.json();
        if (data.success) {
            mostrarNotificacion(`Tarea finalizada. Merma/Perdida: ${data.pesoRestante}kg`, 'success');
            await cargarTareasEnProceso();
        } else {
            throw new Error(data.error || 'Error al finalizar la tarea');
        }
    } catch (error) {
        mostrarNotificacion(error.message, 'error');
    } finally {
        ocultarCarga();
    }
}
function mostrarConfirmacion(titulo, mensaje) {
    return new Promise((resolve) => {
        const anuncio = document.querySelector('.anuncio');
        const contenido = anuncio.querySelector('.anuncio-contenido');

        contenido.innerHTML = `
            
            <h2><i class="fas fa-exclamation-triangle"></i>${titulo}</h2>
            <div class="detalles-grup center">
            <p>${mensaje}</p>
            </div>
            
            <div class="anuncio-botones">
                <button class="anuncio-btn close cancelar"><i class="fas fa-times"></i></button>
                <button class="anuncio-btn green confirmar"><i class="fas fa-check"></i> Confirmar</button>
            </div>
        `;

        anuncio.querySelector('.cancelar').onclick = () => {
            anuncio.style.display = 'none';
            resolve(false);
        };

        anuncio.querySelector('.confirmar').onclick = () => {
            anuncio.style.display = 'none';
            resolve(true);
        };

        anuncio.style.display = 'flex';
    });
}



export function mostrarProcesos(tareaId) {
    const procesosDiv = document.getElementById(`procesos-${tareaId}`);
    if (procesosDiv) {
        procesosDiv.style.display = procesosDiv.style.display === 'none' ? 'block' : 'none';
    }
}
export function toggleProcesos(tareaId) {
    const procesosContenido = document.getElementById(`procesos-${tareaId}`);
    const header = procesosContenido.previousElementSibling;
    const icon = header.querySelector('i');

    if (procesosContenido.style.display === 'none') {
        procesosContenido.style.display = 'block';
        icon.classList.replace('fa-chevron-down', 'fa-chevron-up');
    } else {
        procesosContenido.style.display = 'none';
        icon.classList.replace('fa-chevron-up', 'fa-chevron-down');
    }
}
export function renderizarProcesos(procesos, tareaId) {
    if (!procesos || procesos.length === 0) return '';

    const procesosUnicos = procesos.reduce((acc, proceso) => {
        if (!acc.find(p => p.descripcion === proceso.descripcion)) {
            acc.push(proceso);
        }
        return acc;
    }, []);

    return `
        <div class="procesos-acordeon">
            <div class="procesos-header" onclick="toggleProcesos('${tareaId}')">
                <span>Procesos (${procesosUnicos.length})</span>
                <i class="fas fa-chevron-down"></i>
            </div>
            <div class="procesos-contenido" id="procesos-${tareaId}" style="display: none;">
                ${procesosUnicos.map(proceso => {
                    const estaFinalizado = proceso.estado === 'Finalizado';
                    return `
                        <div class="proceso-item ${estaFinalizado ? 'finalizado' : ''}" data-id="${proceso.id}">
                            <div class="proceso-info">
                                <div class="proceso-descripcion">${proceso.descripcion}</div>
                                ${proceso.peso ? `<div class="proceso-peso">Peso: ${proceso.peso} kg</div>` : ''}
                                <div class="proceso-tiempo">
                                    <div>Inicio: ${new Date(proceso.inicio).toLocaleString()}</div>
                                    ${proceso.fin ? `<div>Fin: ${new Date(proceso.fin).toLocaleString()}</div>` : ''}
                                </div>
                                <div class="proceso-estado">${proceso.estado}</div>
                            </div>
                            ${!estaFinalizado ? `
                                <div class="proceso-controles">
                                    <button class="btn-proceso-control btn-proceso-finalizar" 
                                            onclick="finalizarProceso('${tareaId}', '${proceso.id}')">
                                        <i class="fas fa-check"></i>
                                    </button>
                                </div>
                            ` : ''}
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}
export async function agregarProceso(tareaId) {
    try {
        mostrarCarga();
        const response = await fetch('/obtener-lista-tareas2');
        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Error al cargar lista de procesos');
        }

        const anuncio = document.querySelector('.anuncio');
        const contenido = anuncio.querySelector('.anuncio-contenido');

        contenido.innerHTML = `
            
            <h2><i class="fas fa-cog"></i>Nuevo Proceso</h2>
            <div class="relleno" style="min-height:200px">
            <p>Proceso:</p>
                <div class="form-grup">
                    <div class="autocomplete-wrapper">
                        <input type="text" id="descripcion-proceso" placeholder="Proceso" autocomplete="off" required>
                        <div id="sugerencias-proceso" class="sugerencias-lista"></div>
                    </div>
                </div>
            </div>
            
            <div class="anuncio-botones">
                <button class="anuncio-btn close cancelar"><i class="fas fa-times"></i></button>
                <button class="anuncio-btn green confirmar"><i class="fas fa-plus-circle"></i>  Agregar Proceso</button>
            </div>
        `;


        // Setup autocomplete functionality
        const inputProceso = document.getElementById('descripcion-proceso');
        const sugerenciasList = document.getElementById('sugerencias-proceso');
        const procesos = data.tareas;

        inputProceso.addEventListener('input', () => {
            const inputValue = inputProceso.value.toLowerCase();
            const sugerencias = procesos.filter(proceso =>
                proceso.toLowerCase().includes(inputValue)
            );

            if (inputValue && sugerencias.length > 0) {
                sugerenciasList.innerHTML = sugerencias
                    .map(proceso => `<div class="sugerencia-item">${proceso}</div>`)
                    .join('');
                sugerenciasList.style.display = 'block';
            } else {
                sugerenciasList.style.display = 'none';
            }
        });

        // Handle suggestion click
        sugerenciasList.addEventListener('click', (e) => {
            if (e.target.classList.contains('sugerencia-item')) {
                inputProceso.value = e.target.textContent;
                sugerenciasList.style.display = 'none';
            }
        });

        // Hide suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.autocomplete-wrapper')) {
                sugerenciasList.style.display = 'none';
            }
        });

        anuncio.querySelector('.cancelar').onclick = () => {
            anuncio.style.display = 'none';
        };

        anuncio.querySelector('.confirmar').onclick = async () => {
            const descripcion = inputProceso.value.trim();

            if (!descripcion) {
                mostrarNotificacion('Por favor ingrese la descripción del proceso', 'error');
                return;
            }

            try {
                mostrarCarga();
                const response = await fetch('/agregar-proceso-tarea', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        tareaId,
                        descripcion
                    })
                });

                const data = await response.json();
                if (data.success) {
                    mostrarNotificacion('Proceso agregado correctamente', 'success');
                    anuncio.style.display = 'none';
                    await cargarTareasEnProceso();
                } else {
                    mostrarNotificacion(data.error, 'error');
                }
            } catch (error) {
                mostrarNotificacion('Error al agregar el proceso', 'error');
            } finally {
                ocultarCarga();
            }
        };

        anuncio.style.display = 'flex';
    } catch (error) {
        mostrarNotificacion(error.message, 'error');
    } finally {
        ocultarCarga();
    }
}
export async function finalizarProceso(tareaId, procesoId) {
    try {
        const anuncio = document.querySelector('.anuncio');
        const contenido = anuncio.querySelector('.anuncio-contenido');

        contenido.innerHTML = `
            
            <h2><i class="fas fa-weight"></i>Finalizar Proceso</h2>
            <p>Peso Final:</p>
            <div class="campo-form">
                <input type="number" id="peso-proceso-final" placeholder="Peso final (kg)" step="0.01" required>
            </div>
            <div class="anuncio-botones">
                <button class="anuncio-btn close cancelar"><i class="fas fa-times"></i></button>
                <button class="anuncio-btn green confirmar"><i class="fas fa-check-circle"></i> Finalizar</button>
            </div>
        `;

        anuncio.querySelector('.cancelar').onclick = () => {
            anuncio.style.display = 'none';
        };

        anuncio.querySelector('.confirmar').onclick = async () => {
            const peso = document.getElementById('peso-proceso-final').value;

            if (!peso) {
                mostrarNotificacion('Por favor ingrese el peso final', 'error');
                return;
            }

            try {
                mostrarCarga();
                const response = await fetch('/actualizar-proceso', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        tareaId,
                        procesoId,
                        estado: 'Finalizado',
                        fin: true,
                        peso: parseFloat(peso)
                    })
                });

                const data = await response.json();
                if (data.success) {
                    mostrarNotificacion('Proceso finalizado correctamente', 'success');
                    anuncio.style.display = 'none';
                    await cargarTareasEnProceso();
                } else {
                    mostrarNotificacion(data.error, 'error');
                }
            } catch (error) {
                mostrarNotificacion('Error al finalizar el proceso', 'error');
            } finally {
                ocultarCarga();
            }
        };

        anuncio.style.display = 'flex';
    } catch (error) {
        mostrarNotificacion(error.message, 'error');
    }
}



function formatearTiempo(segundos) {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segs = segundos % 60;
    return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:${String(segs).padStart(2, '0')}`;
}
async function guardarTareaConLote(lotes, data) {
    try {
        const nombreTarea = document.getElementById('nombre-tarea').value;
        const pesoTarea = document.getElementById('peso-tarea').value.replace(',', '.');
        const descripcionTarea = document.getElementById('descripcion-tarea').value;

        if (!nombreTarea || !pesoTarea || !Array.isArray(lotes) || lotes.length === 0) {
            mostrarNotificacion('Por favor complete todos los campos requeridos', 'error');
            return;
        }

        // Get producto ID from the passed data
        const productoSeleccionado = data.pedidos.find(pedido => pedido[1] === nombreTarea);
        if (!productoSeleccionado) {
            throw new Error('Producto no encontrado');
        }

        const productoId = productoSeleccionado[0];
        mostrarCarga();

        // First create the task
        const responseTarea = await fetch('/crear-tarea', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nombre: nombreTarea,
                peso: Number(pesoTarea),
                descripcion: descripcionTarea,
                fechaInicio: new Date().toISOString(),
                estado: 'En proceso',
                lotes: lotes
            })
        });

        const dataTarea = await responseTarea.json();
        
        if (!dataTarea.success) {
            throw new Error(dataTarea.error || 'Error al crear la tarea');
        }

        // Then update the lotes weights
        const responseLotes = await fetch('/actualizar-pesos-lotes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                productoId,
                lotes: Array.from(lotesSeleccionados)
            })
        });

        const dataLotes = await responseLotes.json();
        
        if (!dataLotes.success) {
            throw new Error('Error al actualizar los pesos de los lotes');
        }

        mostrarNotificacion('Tarea iniciada correctamente', 'success');
        document.querySelector('.anuncio').style.display = 'none';
        await cargarTareasEnProceso();

    } catch (error) {
        mostrarNotificacion(error.message || 'Error al crear la tarea', 'error');
    } finally {
        ocultarCarga();
    }
}
function calcularTiempoTranscurrido(tiempoInicial) {
    return Math.floor((Date.now() - parseInt(tiempoInicial)) / 1000);
}



export async function mostrarProgramaAcopio() {
    try {
        mostrarCarga();

        // First check if there's an existing program for the week
        const verificacion = await fetch('/verificar-programa-semana');
        const { existePrograma } = await verificacion.json();

        if (existePrograma) {
            await verProgramaciones();
            return;
        }

        // If no program exists, show the interface to create one
        const response = await fetch('/obtener-lista-tareas2');
        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Error al cargar lista de tareas');
        }

        const hoy = new Date();
        const diasHastaDomingo = 7 - hoy.getDay();
        const proximoDomingo = new Date(hoy);
        proximoDomingo.setDate(hoy.getDate() + diasHastaDomingo);

        const dias = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
        const tareasOptions = data.tareas.map(tarea =>
            `<option value="${tarea}">${tarea}</option>`
        ).join('');

        const anuncio = document.querySelector('.anuncio');
        const contenido = anuncio.querySelector('.anuncio-contenido');

        contenido.innerHTML = `
            
            <h2><i class="fas fa-calendar-alt"></i>Programa de Acopio</h2>
            <div class="relleno">
                <p>Semana hasta el ${proximoDomingo.toLocaleDateString()}</p>
                ${dias.map(dia => `
                    <div class="campo-form">
                        <p>${dia}</p>
                        <p id="fecha-${dia.toLowerCase()}" class="fecha-input"></p>
                    </div>
                    
                    <div class="tareas-dia" id="tareas-${dia.toLowerCase()}">
                        <div class="detalle-item">
                            <div class="campo-form">
                                <p>Tarea:</p>
                                <select class="producto-select">
                                        <option value="">Seleccionar producto</option>
                                        ${tareasOptions}
                                    </select>
                            </div>
                            <i class="fas fa-trash delete btn-eliminar-tarea"></i>
                            <i class="fas fa-plus add btn-agregar-tarea-dia" data-dia="${dia.toLowerCase()}"></i>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="anuncio-botones">
                <button class="anuncio-btn close cancelar"><i class="fas fa-times"></i></button>
                <button class="anuncio-btn green confirmar guardar-programa"><i class="fas fa-save"></i> Guardar</button>
                <button class="anuncio-btn blue ver-programa"><i class="fas fa-eye"></i> Ver programa</button>
            </div>
        `;

        // Set dates automatically
        dias.forEach((dia, index) => {
            const fecha = new Date(proximoDomingo);
            fecha.setDate(fecha.getDate() - (6 - index));
            document.getElementById(`fecha-${dia.toLowerCase()}`).textContent = fecha.toISOString().split('T')[0];
        });

        // Add task button handlers
        document.querySelectorAll('.btn-agregar-tarea-dia').forEach(btn => {
            btn.addEventListener('click', () => {
                const dia = btn.dataset.dia;
                const tareasContainer = document.getElementById(`tareas-${dia}`);
                const nuevaTarea = document.createElement('div');
                nuevaTarea.className = 'tarea-programa';
                nuevaTarea.innerHTML = `
                    <div class="campo-form">
                                <div class="campo-form">
                                    <p>Tarea:</p>
                                    <select class="producto-select">
                                            <option value="">Seleccionar producto</option>
                                            ${tareasOptions}
                                        </select>
                                </div>
                                <button type="button" class="btn-eliminar-tarea anuncio-btn delete">
                                    <i class="fas fa-trash"></i>
                                </button>
                                <button type="button" class="btn-agregar-tarea-dia anuncio-btn add" data-dia="${dia.toLowerCase()}">
                                    <i class="fas fa-plus"></i>
                                </button>
                            </div>
                `;
                tareasContainer.appendChild(nuevaTarea);

                nuevaTarea.querySelector('.btn-eliminar-tarea').addEventListener('click', function () {
                    if (tareasContainer.children.length > 1) {
                        nuevaTarea.remove();
                    } else {
                        mostrarNotificacion('Debe haber al menos una tarea por día', 'error');
                    }
                });
            });
        });

        // Initial delete button handlers
        document.querySelectorAll('.btn-eliminar-tarea').forEach(btn => {
            btn.addEventListener('click', function () {
                const tareasContainer = this.closest('.tareas-dia');
                if (tareasContainer.children.length > 1) {
                    this.closest('.tarea-programa').remove();
                } else {
                    mostrarNotificacion('Debe haber al menos una tarea por día', 'error');
                }
            });
        });

        // Main button handlers
        anuncio.querySelector('.cancelar').onclick = () => {
            anuncio.style.display = 'none';
        };

        anuncio.querySelector('.guardar-programa').addEventListener('click', guardarProgramacion);
        anuncio.querySelector('.ver-programa').onclick = verProgramaciones;

        anuncio.style.display = 'flex';
    } catch (error) {
        mostrarNotificacion(error.message, 'error');
    } finally {
        ocultarCarga();
    }
}
export async function verProgramaciones() {
    try {
        mostrarCarga();
        const response = await fetch('/obtener-programaciones');
        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error);
        }

        const anuncio = document.querySelector('.anuncio');
        const contenido = anuncio.querySelector('.anuncio-contenido');

        contenido.innerHTML = `
            
            <h2><i class="fas fa-calendar-check"></i>Programaciones Actuales</h2>
            <div class="relleno">
                ${data.programaciones.length > 0 ?
                data.programaciones.map(prog => `
                        <div class="programacion-item">
                            <div class="programacion-fecha">
                                <strong>${prog.dia}</strong> - ${new Date(prog.fecha).toLocaleDateString()}
                            </div>
                            <div class="detalle-item">
                                <p>${prog.producto}</p>
                                <i class="fas fa-play run iniciar-tarea" onclick="iniciarTareaProgramada('${prog.producto}', '${prog.fecha}')"></i>
                            </div>
                                    
                        </div>
                    `).join('')
                : '<p class="no-programaciones">No hay programaciones registradas</p>'
            }
            </div>
            <div class="anuncio-botones">
                <button class="anuncio-btn gray cancelar">Cerrar</button>
                ${data.programaciones.length > 0 ? `
                    <button class="anuncio-btn red confirmar eliminar-todo" onclick="eliminarProgramaCompleto()">
                        Eliminar
                    </button>
                ` : ''}
            </div>
            
        `;

        anuncio.querySelector('.cancelar').onclick = () => {
            anuncio.style.display = 'none';
        };

        anuncio.style.display = 'flex';
    } catch (error) {
        mostrarNotificacion(error.message, 'error');
    } finally {
        ocultarCarga();
    }
}
window.eliminarProgramaCompleto = async function () {
    try {
        const confirmacion = await mostrarConfirmacion(
            '¿Eliminar programa completo?',
            'Esta acción eliminará todas las programaciones de la semana y no se puede deshacer.'
        );

        if (!confirmacion) return;

        mostrarCarga();
        const response = await fetch('/eliminar-programa-completo', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Error al eliminar el programa');
        }

        mostrarNotificacion('Programa eliminado completamente', 'success');
        await verProgramaciones(); // Refresh the list
    } catch (error) {
        mostrarNotificacion(error.message, 'error');
    } finally {
        ocultarCarga();
    }
};
window.iniciarTareaProgramada = async function (producto, fecha) {
    try {
        const anuncio = document.querySelector('.anuncio');
        anuncio.style.display = 'none';

        // First update the program status
        const updateResponse = await fetch('/actualizar-estado-programa', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ fecha, producto })
        });

        const updateData = await updateResponse.json();
        if (!updateData.success) {
            throw new Error(updateData.error || 'Error al actualizar el programa');
        }

        // Then show the task form
        await mostrarFormularioTarea(producto);
    } catch (error) {
        mostrarNotificacion(error.message, 'error');
    }
};
export async function guardarProgramacion(event) {
    if (event) event.preventDefault();
    try {
        mostrarCarga();
        const dias = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
        const programaciones = [];

        for (const dia of dias) {
            const tareasContainer = document.getElementById(`tareas-${dia}`);
            if (!tareasContainer) {
                console.error(`Container not found for ${dia}`);
                continue;
            }

            const fechaInput = document.getElementById(`fecha-${dia}`);
            if (!fechaInput) {
                console.error(`Date input not found for ${dia}`);
                continue;
            }

            const fecha = fechaInput.value;
            const tareaSelects = tareasContainer.querySelectorAll('.producto-select');

            tareaSelects.forEach(select => {
                if (select.value && select.value !== '') {
                    programaciones.push({
                        fecha: fecha,
                        dia: dia.charAt(0).toUpperCase() + dia.slice(1),
                        producto: select.value,
                        estado: 'Pendiente'
                    });
                }
            });
        }

        if (programaciones.length === 0) {
            throw new Error('No hay programaciones para guardar');
        }

        const response = await fetch('/guardar-programa', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ programaciones })
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Error al guardar el programa');
        }

        mostrarNotificacion('Programa guardado correctamente', 'success');
        document.querySelector('.anuncio').style.display = 'none';
        await verProgramaciones();
    } catch (error) {
        console.error('Error en guardarProgramacion:', error);
        mostrarNotificacion(error.message, 'error');
    } finally {
        ocultarCarga();
    }
}
window.agregarTareaDia = function (dia, tareas) {
    const tareasContainer = document.getElementById(`tareas-${dia}`);
    const nuevaTarea = document.createElement('div');
    nuevaTarea.className = 'tarea-programa';
    nuevaTarea.innerHTML = `
        <select class="producto-select">
            <option value="">Seleccionar producto</option>
            ${tareas.map(tarea => `
                <option value="${tarea}">${tarea}</option>
            `).join('')}
        </select>
        <button class="btn-eliminar-tarea anuncio-btn" onclick="eliminarTareaDia(this)">
            <i class="fas fa-trash"></i>
        </button>
    `;
    tareasContainer.appendChild(nuevaTarea);
};
window.eliminarTareaDia = function (button) {
    button.closest('.tarea-programa').remove();
};
