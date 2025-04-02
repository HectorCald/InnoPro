
const cronometros = {};
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
                <div class="cuadro-btn"><button class="btn-toggle-historial btn-tarea" onclick="mostrarHistorialTareas()">
                    <i class="fas fa-history"></i>
                </button>
                    <p>Historial</p>
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
export async function mostrarHistorialTareas() {
    try {
        mostrarCarga();
        const response = await fetch('/obtener-historial-tareas');
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || 'Error al cargar historial');
        }

        const anuncio = document.querySelector('.anuncio');
        const contenido = anuncio.querySelector('.anuncio-contenido');
        
        contenido.innerHTML = `
            <i class="fas fa-history"></i>
            <h2>Historial de Tareas</h2>
            <div class="historial-tareas">
                ${data.tareas.map(tarea => {
                    // Aquí está la corrección para calcular la duración
                    const inicio = new Date(tarea.fechaInicio);
                    const fin = new Date(tarea.fechaFin);
                    const diferenciaMilisegundos = fin - inicio;
                    const segundosTotales = Math.floor(diferenciaMilisegundos / 1000);
                    
                    const horas = Math.floor(segundosTotales / 3600);
                    const minutos = Math.floor((segundosTotales % 3600) / 60);
                    const segundos = segundosTotales % 60;
                    
                    const duracionFormateada = `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;

                    return `
                    <div class="historial-tarea">
                        <div class="historial-tarea-header">
                            <h3>${tarea.nombre}</h3>
                            <span class="historial-fecha">
                                ${new Date(tarea.fechaInicio).toLocaleDateString()}
                            </span>
                        </div>
                            <div class="historial-peso">
                                <span>Peso Inicial: ${tarea.pesoInicial} kg</span>
                                <span>Peso Final: ${tarea.pesoFinal} kg</span>
                                <span>Merma: ${tarea.merma} kg</span>
                                <span>Duración Total: ${duracionFormateada}</span>
                            </div>

                        <div class="historial-procesos">
                            <h4>Procesos:</h4>
                            ${tarea.procesos.map(proceso => `
                                <div class="historial-proceso">
                                    <span class="proceso-nombre">${proceso.descripcion}</span>
                                    <span class="proceso-peso">${proceso.peso || 0} kg</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `}).join('')}
            </div>
            <div class="anuncio-botones">
                <button class="anuncio-btn cancelar">Cerrar</button>
            </div>
        `;

        anuncio.querySelector('.cancelar').onclick = () => {
            anuncio.style.display = 'none';
        };

        anuncio.style.display = 'flex';
    } catch (error) {
        mostrarNotificacion(error.message, 'error');
    }
    finally{
        ocultarCarga();
    }
}
function formatearTiempo(segundos) {
    const horas = Math.floor(segundos / 3600);
    const minutos = Math.floor((segundos % 3600) / 60);
    const segs = segundos % 60;
    return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:${String(segs).padStart(2, '0')}`;
}
export async function mostrarFormularioTarea(productoPreseleccionado = '') {
    try {
        mostrarCarga();
        const response = await fetch('/obtener-lista-tareas');
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || 'Error al cargar lista de tareas');
        }

        const anuncio = document.querySelector('.anuncio');
        const contenido = anuncio.querySelector('.anuncio-contenido');
        
        contenido.innerHTML = `
            
            <h2><i class="fas fa-tasks"></i>Nueva Tarea</h2>
            <div class="form-tarea">
                <div class="autocomplete-wrapper">
                    <input type="text" id="nombre-tarea" value="${productoPreseleccionado}" 
                           placeholder="Nombre de la tarea" autocomplete="off" required
                           ${productoPreseleccionado ? 'readonly' : ''}>
                    <div id="sugerencias-tarea" class="sugerencias-lista"></div>
                </div>
                <select id="lote-tarea" class="form-input" disabled required>
                    <option value="">Seleccione un lote</option>
                </select>
                <div class="peso-disponible" style="color: #666; margin: 5px 0;"></div>
                <input type="number" id="peso-tarea" placeholder="Peso (kg)" step="0.01" required>
                <textarea id="descripcion-tarea" placeholder="Descripción de la tarea"></textarea>
            </div>
            <div class="anuncio-botones">
                <button class="anuncio-btn  gray cancelar">Cancelar</button>
                <button class="anuncio-btn green confirmar">Iniciar Tarea</button>
            </div>
        `;

        const inputTarea = document.getElementById('nombre-tarea');
        const sugerenciasList = document.getElementById('sugerencias-tarea');
        const selectLote = document.getElementById('lote-tarea');
        const pesoInput = document.getElementById('peso-tarea');
        const pesoDisponible = document.querySelector('.peso-disponible');
        const tareas = data.tareas;

        // Handle product selection and load lots
        async function cargarLotes(nombreProducto) {
            try {
                const response = await fetch(`/obtener-lotes/${encodeURIComponent(nombreProducto)}`);
                const data = await response.json();
                
                if (data.success && data.lotes.length > 0) {
                    selectLote.innerHTML = `
                        <option value="">Seleccione un lote</option>
                        ${data.lotes.map(lote => `
                            <option value="${lote.lote}" data-peso="${lote.peso}">
                                Lote ${lote.lote} - Disponible: ${lote.peso}kg
                            </option>
                        `).join('')}
                    `;
                    selectLote.disabled = false;
                } else {
                    selectLote.innerHTML = '<option value="">No hay lotes disponibles</option>';
                    selectLote.disabled = true;
                }
            } catch (error) {
                mostrarNotificacion('Error al cargar lotes', 'error');
            }
        }

        // Product input handler (only if no preselected product)
        if (!productoPreseleccionado) {
            inputTarea.addEventListener('input', () => {
                const inputValue = inputTarea.value.toLowerCase();
                const sugerencias = tareas.filter(tarea => 
                    tarea.toLowerCase().includes(inputValue)
                );

                if (inputValue && sugerencias.length > 0) {
                    sugerenciasList.innerHTML = sugerencias
                        .map(tarea => `<div class="sugerencia-item">${tarea}</div>`)
                        .join('');
                    sugerenciasList.style.display = 'block';
                } else {
                    sugerenciasList.style.display = 'none';
                }
                
                selectLote.innerHTML = '<option value="">Seleccione un lote</option>';
                selectLote.disabled = true;
                pesoDisponible.textContent = '';
            });

            // Handle suggestion click
            sugerenciasList.addEventListener('click', async (e) => {
                if (e.target.classList.contains('sugerencia-item')) {
                    inputTarea.value = e.target.textContent;
                    sugerenciasList.style.display = 'none';
                    await cargarLotes(inputTarea.value);
                }
            });
        } else {
            // If product is preselected, load lots immediately
            await cargarLotes(productoPreseleccionado);
        }

        // Handle lot selection
        selectLote.addEventListener('change', () => {
            const selectedOption = selectLote.selectedOptions[0];
            if (selectedOption.value) {
                const pesoMax = selectedOption.dataset.peso;
                pesoDisponible.textContent = `Peso disponible: ${pesoMax}kg`;
                pesoInput.max = pesoMax;
            } else {
                pesoDisponible.textContent = '';
                pesoInput.max = '';
            }
        });

        // Save task handler
        anuncio.querySelector('.confirmar').onclick = () => {
            const loteSeleccionado = selectLote.value;
            if (!loteSeleccionado) {
                mostrarNotificacion('Por favor seleccione un lote', 'error');
                return;
            }
            guardarTareaConLote(loteSeleccionado);
        };

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
async function guardarTareaConLote(lote) {
    try {
        const nombreTarea = document.getElementById('nombre-tarea').value;
        const pesoTarea = document.getElementById('peso-tarea').value;
        const descripcionTarea = document.getElementById('descripcion-tarea').value;

        if (!nombreTarea || !pesoTarea || !lote) {
            mostrarNotificacion('Por favor complete todos los campos requeridos', 'error');
            return;
        }

        mostrarCarga();
        const response = await fetch('/crear-tarea', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nombre: nombreTarea,
                peso: parseFloat(pesoTarea),
                descripcion: descripcionTarea,
                fechaInicio: new Date().toISOString(),
                estado: 'En proceso',
                lote: lote
            })
        });

        const data = await response.json();
        if (data.success) {
            mostrarNotificacion('Tarea iniciada correctamente', 'success');
            document.querySelector('.anuncio').style.display = 'none';
            await cargarTareasEnProceso();
        } else {
            throw new Error(data.error || 'Error al crear la tarea');
        }
    } catch (error) {
        mostrarNotificacion(error.message || 'Error al crear la tarea', 'error');
    } finally {
        ocultarCarga();
    }
}
function calcularTiempoTranscurrido(tiempoInicial) {
    return Math.floor((Date.now() - parseInt(tiempoInicial)) / 1000);
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
        
        listaTareas.innerHTML = '';

        data.tareas.forEach(tarea => {
            const elementoTarea = document.createElement('div');
            elementoTarea.className = 'tarea-item';
            elementoTarea.innerHTML = `
                <div class="tarea-info">
                    <div class="tarea-header">
                        <h4>${tarea.nombre}</h4>
                        <span class="tarea-peso">${tarea.pesoInicial} kg</span>
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
export async function pausarTarea(tareaId) {
    try {
        const tareaElement = document.querySelector(`.tarea-item h4:contains("${tareaId}")`).closest('.tarea-item');
        if (!tareaElement) {
            throw new Error('Elemento de tarea no encontrado');
        }

        const btnPausar = tareaElement.querySelector('.btn-pausar');
        const tiempoElement = tareaElement.querySelector('.tarea-tiempo');
        const estaPausado = localStorage.getItem(`pausa-${tareaId}`) === 'true';

        const response = await fetch('/pausar-tarea', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                tareaId, 
                estado: estaPausado ? 'En proceso' : 'Pausada'
            })
        });

        const data = await response.json();
        if (!data.success) {
            throw new Error(data.error || 'Error al actualizar el estado');
        }

        if (estaPausado) {
            // Reanudar tarea
            localStorage.setItem(`pausa-${tareaId}`, 'false');
            btnPausar.innerHTML = '<i class="fas fa-pause"></i> Pausar';
            
            const tiempoInicial = parseInt(tiempoElement.dataset.tiempoInicial);
            if (cronometros[tareaId]) {
                clearInterval(cronometros[tareaId]);
            }
            cronometros[tareaId] = setInterval(() => {
                const nuevoTiempo = calcularTiempoTranscurrido(tiempoInicial);
                tiempoElement.textContent = formatearTiempo(nuevoTiempo);
            }, 1000);
        } else {
            // Pausar tarea
            localStorage.setItem(`pausa-${tareaId}`, 'true');
            btnPausar.innerHTML = '<i class="fas fa-play"></i> Reanudar';
            if (cronometros[tareaId]) {
                clearInterval(cronometros[tareaId]);
            }
        }

        await cargarTareasEnProceso(); // Recargar las tareas para actualizar el estado
        mostrarNotificacion(
            estaPausado ? 'Tarea reanudada' : 'Tarea pausada', 
            'success'
        );
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error al actualizar el estado de la tarea', 'error');
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
            <div class="form-proceso">
                <div class="autocomplete-wrapper">
                    <input type="text" id="descripcion-proceso" placeholder="Proceso" autocomplete="off" required>
                    <div id="sugerencias-proceso" class="sugerencias-lista"></div>
                </div>
            </div>
            <div class="anuncio-botones">
                <button class="anuncio-btn gray cancelar">Cancelar</button>
                <button class="anuncio-btn green confirmar">Agregar Proceso</button>
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
    }finally{
        ocultarCarga();
    }
}
export async function finalizarProceso(tareaId, procesoId) {
    try {
        const anuncio = document.querySelector('.anuncio');
        const contenido = anuncio.querySelector('.anuncio-contenido');
        
        contenido.innerHTML = `
            
            <h2><i class="fas fa-weight"></i>Finalizar Proceso</h2>
            <div class="form-proceso">
                <input type="number" id="peso-proceso-final" placeholder="Peso final (kg)" step="0.01" required>
            </div>
            <div class="anuncio-botones">
                <button class="anuncio-btn gray cancelar">Cancelar</button>
                <button class="anuncio-btn green confirmar">Finalizar</button>
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
export function renderizarProcesos(procesos, tareaId) {
    if (!procesos || procesos.length === 0) return '';
    
    return `
        <div class="procesos-acordeon">
            <div class="procesos-header" onclick="toggleProcesos('${tareaId}')">
                <span>Procesos (${procesos.length})</span>
                <i class="fas fa-chevron-down"></i>
            </div>
            <div class="procesos-contenido" id="procesos-${tareaId}" style="display: none;">
                ${procesos.map(proceso => {
                    const estaFinalizado = proceso.estado === 'Finalizado';
                    const tiempoTranscurrido = calcularTiempoTranscurrido(
                        proceso.inicio, 
                        proceso.fin || new Date().toISOString()
                    );
                    
                    return `
                        <div class="proceso-item ${estaFinalizado ? 'finalizado' : ''}" data-id="${proceso.id}">
                            <div class="proceso-info">
                                <div class="proceso-descripcion">${proceso.descripcion}</div>
                                <div class="proceso-peso">Peso: ${proceso.peso} kg</div>
                                <div class="proceso-tiempo">
                                    <div>Inicio: ${new Date(proceso.inicio).toLocaleString()}</div>
                                    ${proceso.fin ? `<div>Fin: ${new Date(proceso.fin).toLocaleString()}</div>` : ''}
                                    <div class="tiempo-transcurrido">Duración: ${tiempoTranscurrido}</div>
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
export function mostrarProcesos(tareaId) {
    const procesosDiv = document.getElementById(`procesos-${tareaId}`);
    if (procesosDiv) {
        procesosDiv.style.display = procesosDiv.style.display === 'none' ? 'block' : 'none';
    }
}
export async function pausarProceso(tareaId, procesoId) {
    try {
        const btnPausar = document.querySelector(`.tarea-proceso[data-id="${procesoId}"] .btn-proceso-pausar`);
        const estaPausado = btnPausar.querySelector('i').classList.contains('fa-play');

        if (estaPausado) {
            // Reanudar proceso
            btnPausar.innerHTML = '<i class="fas fa-pause"></i>';
            await fetch('/actualizar-proceso', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    tareaId, 
                    procesoId,
                    estado: 'En proceso'
                })
            });
        } else {
            // Pausar proceso
            btnPausar.innerHTML = '<i class="fas fa-play"></i>';
            await fetch('/actualizar-proceso', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    tareaId, 
                    procesoId,
                    estado: 'Pausado'
                })
            });
        }
    } catch (error) {
        mostrarNotificacion('Error al actualizar el proceso', 'error');
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
            mostrarNotificacion(`Tarea finalizada. Peso restante: ${data.pesoRestante}kg`, 'success');
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
            <p>${mensaje}</p>
            <div class="anuncio-botones">
                <button class="anuncio-btn gray cancelar">Cancelar</button>
                <button class="anuncio-btn green confirmar">Confirmar</button>
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
            <p>Semana hasta el ${proximoDomingo.toLocaleDateString()}</p>
            <div class="programa-form">
                ${dias.map(dia => `
                    <div class="dia-programa">
                        <div class="campo-form">
                            <p>${dia}</p>
                            <p id="fecha-${dia.toLowerCase()}" class="fecha-input"></p>
                        </div>
                        
                        <div class="tareas-dia" id="tareas-${dia.toLowerCase()}">
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
                        </div>
                        
                    </div>
                `).join('')}
                <div class="anuncio-botones">
                    <button class="anuncio-btn gray cancelar">Cancelar</button>
                    <button class="anuncio-btn green confirmar guardar-programa">Guardar</button>
                    <button class="anuncio-btn blue ver-programa">Ver</button>
                </div>
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

                nuevaTarea.querySelector('.btn-eliminar-tarea').addEventListener('click', function() {
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
            btn.addEventListener('click', function() {
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
            <div class="programaciones-lista">
                ${data.programaciones.length > 0 ? 
                    data.programaciones.map(prog => `
                        <div class="programacion-item">
                            <div class="programacion-fecha">
                                <strong>${prog.dia}</strong> - ${new Date(prog.fecha).toLocaleDateString()}
                            </div>
                            <div class="campo-form">
                                <p>${prog.producto}</p>
                                 <button class="anuncio-btn run iniciar-tarea" 
                                    onclick="iniciarTareaProgramada('${prog.producto}', '${prog.fecha}')">
                                     <i class="fas fa-play"></i>
                                </button>
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

window.eliminarProgramaCompleto = async function() {
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
window.iniciarTareaProgramada = async function(producto, fecha) {
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

window.agregarTareaDia = function(dia, tareas) {
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

window.eliminarTareaDia = function(button) {
    button.closest('.tarea-programa').remove();
};
