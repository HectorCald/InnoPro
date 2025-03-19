
const cronometros = {};
export function inicializarTareas() {
    const container = document.querySelector('.newTarea-view');
    container.innerHTML = `
        <div class="title">
            <h3>Gestión de Tareas</h3>
        </div>
        <div class="tareas-container">
            <div class="tareas-botones">
                <button class="btn-agregar-tarea" onclick="mostrarFormularioTarea()">
                    <i class="fas fa-plus"></i> Iniciar
                </button>
                <button class="btn-toggle-historial" onclick="mostrarHistorialTareas()">
                    <i class="fas fa-history"></i> Historial
                </button>
                <button class="btn-toggle-programa">
                    <i class="fas fa-calendar-alt"></i> Programa
                </button>
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
export async function mostrarFormularioTarea() {
    try {
        mostrarCarga();
        const response = 
        await fetch('/obtener-lista-tareas');
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || 'Error al cargar lista de tareas');
        }

        const anuncio = document.querySelector('.anuncio');
        const contenido = anuncio.querySelector('.anuncio-contenido');
        
        contenido.innerHTML = `
            <i class="fas fa-tasks"></i>
            <h2>Nueva Tarea</h2>
            <div class="form-tarea">
                <div class="autocomplete-wrapper">
                    <input type="text" id="nombre-tarea" placeholder="Nombre de la tarea" autocomplete="off" required>
                    <div id="sugerencias-tarea" class="sugerencias-lista"></div>
                </div>
                <input type="number" id="peso-tarea" placeholder="Peso (kg)" step="0.01" required>
                <textarea id="descripcion-tarea" placeholder="Descripción de la tarea"></textarea>
            </div>
            <div class="anuncio-botones">
                <button class="anuncio-btn cancelar">Cancelar</button>
                <button class="anuncio-btn confirmar">Iniciar Tarea</button>
            </div>
        `;

        // Setup autocomplete functionality
        const inputTarea = document.getElementById('nombre-tarea');
        const sugerenciasList = document.getElementById('sugerencias-tarea');
        const tareas = data.tareas;

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
        });

        // Handle suggestion click
        sugerenciasList.addEventListener('click', (e) => {
            if (e.target.classList.contains('sugerencia-item')) {
                inputTarea.value = e.target.textContent;
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

        anuncio.querySelector('.confirmar').onclick = guardarTarea;
        anuncio.style.display = 'flex';
    } catch (error) {
        mostrarNotificacion(error.message, 'error');
    }
    finally {
        ocultarCarga();
    }
}
export async function guardarTarea() {
    const nombreTarea = document.getElementById('nombre-tarea').value;
    const pesoTarea = document.getElementById('peso-tarea').value;
    const descripcionTarea = document.getElementById('descripcion-tarea').value;
    const fechaInicio = new Date().toISOString();

    if (!nombreTarea || !pesoTarea) {
        mostrarNotificacion('Por favor ingrese el nombre y peso de la tarea', 'error');
        return;
    }

    try {
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
                fechaInicio: fechaInicio,
                estado: 'En proceso'
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
export async function pausarTarea(tareaId) {
    const btnPausar = document.getElementById(`btn-pausar-${tareaId}`);
    const estaPausado = localStorage.getItem(`pausa-${tareaId}`) === 'true';

    try {
        if (estaPausado) {
            // Reanudar
            localStorage.setItem(`pausa-${tareaId}`, 'false');
            btnPausar.innerHTML = '<i class="fas fa-pause"></i> Pausa';
            iniciarCronometro(tareaId, tiemposGuardados[tareaId], false);
        } else {
            // Pausar
            localStorage.setItem(`pausa-${tareaId}`, 'true');
            btnPausar.innerHTML = '<i class="fas fa-play"></i> Play';
            if (cronometros[tareaId]) {
                clearInterval(cronometros[tareaId]);
            }
        }

        await fetch('/actualizar-estado-tarea', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                tareaId, 
                estado: estaPausado ? 'En proceso' : 'Pausada',
                tiempoTranscurrido: tiemposGuardados[tareaId]
            })
        });
    } catch (error) {
        mostrarNotificacion('Error al actualizar el estado de la tarea', 'error');
    }
}
export async function agregarProceso(tareaId) {
    try {
        const response = await fetch('/obtener-lista-tareas2');
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || 'Error al cargar lista de procesos');
        }

        const anuncio = document.querySelector('.anuncio');
        const contenido = anuncio.querySelector('.anuncio-contenido');
        
        contenido.innerHTML = `
            <i class="fas fa-cog"></i>
            <h2>Nuevo Proceso</h2>
            <div class="form-proceso">
                <div class="autocomplete-wrapper">
                    <input type="text" id="descripcion-proceso" placeholder="Proceso" autocomplete="off" required>
                    <div id="sugerencias-proceso" class="sugerencias-lista"></div>
                </div>
            </div>
            <div class="anuncio-botones">
                <button class="anuncio-btn cancelar">Cancelar</button>
                <button class="anuncio-btn confirmar">Agregar Proceso</button>
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
    }
}
export async function finalizarProceso(tareaId, procesoId) {
    try {
        const anuncio = document.querySelector('.anuncio');
        const contenido = anuncio.querySelector('.anuncio-contenido');
        
        contenido.innerHTML = `
            <i class="fas fa-weight"></i>
            <h2>Finalizar Proceso</h2>
            <div class="form-proceso">
                <input type="number" id="peso-proceso-final" placeholder="Peso final (kg)" step="0.01" required>
            </div>
            <div class="anuncio-botones">
                <button class="anuncio-btn cancelar">Cancelar</button>
                <button class="anuncio-btn confirmar">Finalizar</button>
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
export async function cargarTareasEnProceso() {
    try {
        const response = await fetch('/obtener-tareas-proceso');
        const data = await response.json();

        const listaTareas = document.querySelector('.lista-tareas');
        if (data.success && data.tareas) {
            listaTareas.innerHTML = data.tareas.map(tarea => `
                <div class="tarea-item" data-id="${tarea.id}">
                    <div class="tarea-info">
                        <div class="tarea-header">
                            <h4>${tarea.nombre}</h4>
                            <span class="tarea-peso">${tarea.peso} kg</span>
                        </div>
                        <p class="tarea-descripcion">${tarea.descripcion || 'Sin descripción'}</p>
                        <div class="tarea-detalles">
                            <span>Inicio: ${new Date(tarea.fechaInicio).toLocaleString()}</span>
                            <span>Usuario: ${tarea.usuario}</span>
                            <span id="cronometro-${tarea.id}">Tiempo: Calculando...</span>
                        </div>
                        <div class="tarea-acciones">
                            <button class="btn-tarea-accion btn-agregar-proceso" onclick="agregarProceso('${tarea.id}')">
                                <i class="fas fa-plus"></i> Proceso
                            </button>
                            <button class="btn-tarea-accion btn-pausar" onclick="pausarTarea('${tarea.id}')">
                                <i class="fas fa-pause"></i> Pausar
                            </button>
                            <button class="btn-tarea-accion btn-finalizar" onclick="finalizarTarea('${tarea.id}')">
                                <i class="fas fa-check"></i> Finalizar
                            </button>
                        </div>
                    </div>
                    ${renderizarProcesos(tarea.procesos, tarea.id)}
                </div>
            `).join('');

            // Inicializar cronómetros
            data.tareas.forEach(tarea => {
                iniciarCronometro(tarea.id, tarea.tiempoInicial);
            });
        } else {
            listaTareas.innerHTML = '<p>No hay tareas en proceso</p>';
        }
    } catch (error) {
        mostrarNotificacion('Error al cargar las tareas', 'error');
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
                                    <button class="btn-proceso-control btn-proceso-editar" 
                                            onclick="actualizarProceso('${tareaId}', '${proceso.id}')">
                                        <i class="fas fa-edit"></i>
                                    </button>
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
            '¿Estás seguro de que deseas finalizar esta tarea?',
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
            <i class="fas fa-exclamation-triangle"></i>
            <h2>${titulo}</h2>
            <p>${mensaje}</p>
            <div class="anuncio-botones">
                <button class="anuncio-btn cancelar">Cancelar</button>
                <button class="anuncio-btn confirmar">Confirmar</button>
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
