/* ==================== INICIALIZACIÓN DE LA APLICACIÓN ==================== */
document.addEventListener('DOMContentLoaded', () => {
    bienvenida();
    manejarCierreSesion();
    inicializarBotones();
});

/* ==================== FUNCIONES DE AUTENTICACIÓN Y SESIÓN ==================== */
async function bienvenida() {
    try {
        const response = await fetch('/obtener-nombre');
        const data = await response.json();
        
        if (data.nombre) {
            const bienvenida = document.querySelector('.bienvenida');
            if (bienvenida) {
                bienvenida.innerHTML = '<i class="fas fa-warehouse"></i> Admin';
            }
        }
    } catch (error) {
        console.error('Error al obtener el nombre:', error);
    }
}

// ... resto del código específico de dashboard_alm ...

function manejarCierreSesion() {
    const btnLogout = document.querySelector('.logout-btn');
    btnLogout.addEventListener('click', async () => {
        try {
            const response = await fetch('/cerrar-sesion', { method: 'POST' });
            if (response.ok) {
                window.location.href = '/';
            }
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        }
    });
}

/* ==================== INICIALIZACIÓN DE BOTONES ==================== */
function inicializarBotones() {
    const btnVerificar = document.querySelector('.verificarRegistros');
    const btnConsultar = document.querySelector('.consultarRegistros');

    if (btnVerificar) {
        btnVerificar.addEventListener('click', async () => {
            mostrar('.registros-view');
            await cargarRegistros();
        });
    }

    if (btnConsultar) {
        btnConsultar.addEventListener('click', () => {
            // Implementar funcionalidad de consulta
        });
    }
}

/* ==================== SISTEMA DE NOTIFICACIONES ==================== */
function mostrarNotificacion(mensaje, tipo = 'success', duracion = 5000) {
    const notificador = document.querySelector('.notificador');
    const notificacion = document.createElement('div');
    notificacion.className = `notificacion ${tipo}`;
    
    let icono;
    switch(tipo) {
        case 'success':
            icono = 'fa-check-circle';
            break;
        case 'warning':
            icono = 'fa-exclamation-triangle';
            break;
        case 'error':
            icono = 'fa-times-circle';
            break;
    }
    
    notificacion.innerHTML = `
        <i class="fas ${icono}"></i>
        <span class="mensaje">${mensaje}</span>
        <button class="cerrar"><i class="fas fa-times"></i></button>
    `;
    
    notificador.appendChild(notificacion);
    
    const cerrarBtn = notificacion.querySelector('.cerrar');
    cerrarBtn.addEventListener('click', () => {
        notificacion.style.animation = 'fadeOut 0.3s ease-out forwards';
        setTimeout(() => notificacion.remove(), 300);
    });
    
    setTimeout(() => {
        if (notificacion.parentElement) {
            notificacion.style.animation = 'fadeOut 0.3s ease-out forwards';
            setTimeout(() => notificacion.remove(), 300);
        }
    }, duracion);
}
/* ==================== GESTIÓN DE REGISTROS ==================== */
async function cargarRegistros() {
    try {
        const response = await fetch('/obtener-todos-registros');
        const data = await response.json();
        
        if (data.success) {
            const container = document.querySelector('.registros-container');
            container.innerHTML = '';
            
            // Agrupar registros por fecha, saltando la primera fila (encabezados)
            const registrosPorFecha = {};
            data.registros.slice(1).forEach(registro => {  // slice(1) para saltar la primera fila
                if (!registro[0]) return; // Saltar filas vacías
                if (!registrosPorFecha[registro[0]]) {
                    registrosPorFecha[registro[0]] = [];
                }
                registrosPorFecha[registro[0]].push(registro);
            });

            // Ordenar fechas de más reciente a más antigua
            const fechasOrdenadas = Object.keys(registrosPorFecha).sort((a, b) => new Date(b) - new Date(a));

            // Crear tarjetas para cada fecha
            fechasOrdenadas.forEach(fecha => {
                const registros = registrosPorFecha[fecha];
                const fechaCard = document.createElement('div');
                fechaCard.className = 'fecha-card';
                
                const fechaHeader = document.createElement('div');
                fechaHeader.className = 'fecha-header';
                fechaHeader.innerHTML = `
                    <div class="fecha-info">
                        <h3>${formatearFecha(fecha)}</h3>
                        <span class="contador">${registros.length} registros</span>
                    </div>
                    <i class="fas fa-chevron-down"></i>
                `;
                fechaCard.appendChild(fechaHeader);

                // Contenedor para los registros de esta fecha
                const registrosContainer = document.createElement('div');
                registrosContainer.className = 'registros-grupo';

                // Añadir evento click al header de fecha
                fechaHeader.addEventListener('click', () => {
                    registrosContainer.classList.toggle('active');
                    const icono = fechaHeader.querySelector('.fa-chevron-down');
                    icono.style.transform = registrosContainer.classList.contains('active') ? 'rotate(180deg)' : 'rotate(0)';
                });

                registros.forEach(registro => {
                    const registroCard = document.createElement('div');
                    registroCard.className = 'registro-card';
                    
                    registroCard.innerHTML = `
                        <div class="registro-header">
                            <span class="registro-producto">${registro[1]}</span>
                            <i class="fas fa-chevron-down"></i>
                        </div>
                        <div class="registro-detalles">
                            <p><span>Lote:</span> ${registro[2] || '-'}</p>
                            <p><span>Gramaje:</span> ${registro[3] || '-'}</p>
                            <p><span>Selección:</span> ${registro[4] || '-'}</p>
                            <p><span>Microondas:</span> ${registro[5] || '-'}</p>
                            <p><span>Envases:</span> ${registro[6] || '-'}</p>
                            <p><span>Vencimiento:</span> ${registro[7] || '-'}</p>
                            <p><span>Operario:</span> ${registro[8] || '-'}</p>
                            <p><span>Estado:</span> <span class="estado ${(registro[9] || 'pendiente').toLowerCase()}">${registro[9] || 'Pendiente'}</span></p>
                            <div class="acciones">
                                <button onclick="editarRegistro('${registro[0]}', '${registro[1]}')" class="btn-editar">
                                    <i class="fas fa-edit"></i> Editar
                                </button>
                                <button onclick="confirmarEliminacion('${registro[0]}', '${registro[1]}')" class="btn-eliminar">
                                    <i class="fas fa-trash"></i> Eliminar
                                </button>
                            </div>
                        </div>
                    `;
                    
                    registroCard.querySelector('.registro-header').addEventListener('click', () => {
                        const detalles = registroCard.querySelector('.registro-detalles');
                        const icono = registroCard.querySelector('.fa-chevron-down');
                        
                        if (detalles.classList.contains('active')) {
                            detalles.classList.remove('active');
                            icono.style.transform = 'rotate(0)';
                        } else {
                            detalles.classList.add('active');
                            icono.style.transform = 'rotate(180deg)';
                        }
                    });

                    registrosContainer.appendChild(registroCard);
                });

                fechaCard.appendChild(registrosContainer);
                container.appendChild(fechaCard);
            });
        }
    } catch (error) {
        console.error('Error al cargar registros:', error);
        mostrarNotificacion('Error al cargar los registros', 'error');
    }
}

// Función auxiliar para formatear la fecha
function formatearFecha(fecha) {
    try {
        // Convertir el formato DD/MM/YYYY a YYYY-MM-DD para crear el objeto Date
        if (fecha.includes('/')) {
            const [dia, mes, anio] = fecha.split('/');
            fecha = `${anio}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
        }
        
        const fechaObj = new Date(fecha);
        
        // Verificar si la fecha es válida
        if (isNaN(fechaObj.getTime())) {
            return fecha; // Retornar la fecha original si no es válida
        }
        
        const opciones = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        
        return fechaObj.toLocaleDateString('es-ES', opciones);
    } catch (error) {
        console.error('Error al formatear fecha:', error);
        return fecha; // Retornar la fecha original en caso de error
    }
}

function editarRegistro(fecha, producto) {
    const modal = document.querySelector('.modal-edicion');
    const form = document.getElementById('form-edicion');
    
    document.getElementById('edit-fecha').value = fecha;
    document.getElementById('edit-producto').value = producto;
    
    modal.style.display = 'flex';
    
    form.onsubmit = async (e) => {
        e.preventDefault();
        
        const verificacion = document.getElementById('edit-verificacion').value;
        const fechaVerificacion = document.getElementById('edit-fecha-verificacion').value;
        const observaciones = document.getElementById('edit-observaciones').value;
        
        try {
            const response = await fetch('/actualizar-verificacion', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    fecha,
                    producto,
                    verificacion,
                    fechaVerificacion,
                    observaciones
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                mostrarNotificacion('Registro actualizado correctamente');
                modal.style.display = 'none';
                cargarRegistros();
            } else {
                mostrarNotificacion(data.error || 'Error al actualizar', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            mostrarNotificacion('Error al actualizar el registro', 'error');
        }
    };
}

function confirmarEliminacion(fecha, producto) {
    const anuncio = document.querySelector('.anuncio');
    anuncio.style.display = 'flex';
    
    const btnConfirmar = anuncio.querySelector('.confirmar');
    const btnCancelar = anuncio.querySelector('.cancelar');
    
    btnConfirmar.onclick = async () => {
        try {
            const response = await fetch('/eliminar-registro', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ fecha, producto })
            });
            
            const data = await response.json();
            
            if (data.success) {
                mostrarNotificacion('Registro eliminado correctamente');
                cargarRegistros();
            } else {
                mostrarNotificacion(data.error || 'Error al eliminar', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            mostrarNotificacion('Error al eliminar el registro', 'error');
        } finally {
            anuncio.style.display = 'none';
        }
    };
    
    btnCancelar.onclick = () => {
        anuncio.style.display = 'none';
    };
}

/* ==================== FUNCIONES DE UTILIDAD ==================== */
function mostrar(selector) {
    const elemento = document.querySelector(selector);
    if (elemento) {
        elemento.style.display = elemento.style.display === 'flex' ? 'none' : 'flex';
        const container = document.querySelector('.container');
        container.classList.toggle('no-touch');
    }
}

// Actualizar inicializarBotones para incluir la carga de registros
function inicializarBotones() {
    const btnVerificar = document.querySelector('.verificarRegistros');
    const btnConsultar = document.querySelector('.consultarRegistros');

    if (btnVerificar) {
        btnVerificar.addEventListener('click', () => {
            mostrar('.registros-view');
            cargarRegistros();
        });
    }

    // Cerrar modal de edición
    const cerrarModal = document.querySelector('.cerrar-modal');
    if (cerrarModal) {
        cerrarModal.addEventListener('click', () => {
            document.querySelector('.modal-edicion').style.display = 'none';
        });
    }
}