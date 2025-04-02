import { registrarNotificacion } from './advertencia.js';
export function inicializarFormularioProduccion() {
    mostrarCarga();
    const container = document.querySelector('.formProduccion-view');

    if (!verificarHorario()) {
        container.innerHTML = `
            <div class="title">
                <i class="fas fa-clock"></i>
                <h2 class="section-title">Fuera de Horario</h2>
            </div>
            <div class="horario-mensaje">
                <p>Lo sentimos, solo se pueden registrar producciones entre las 8:00 AM y 6:30 PM.</p>
                <p>Por favor, regrese durante el horario establecido.</p>
            </div>
        `;
        ocultarCarga();
        return;
    }

    container.innerHTML = `
        <div class="title">
            <i class="fas fa-clipboard-list"></i>
            <h2 class="section-title">Formulario de Registro</h2>
        </div>
        <div class="form1">
            <form action="">
                <div class="form-group">
                    <input type="text" name="producto" id="producto-input" list="productos-list" 
                           placeholder=" " autocomplete="off" required>
                    <p>Producto *</p>
                    <datalist id="productos-list"></datalist>
                </div>

                <div class="form-group">
                    <input type="number" name="lote" placeholder=" " required>
                    <p>Lote *</p>
                </div>

                <div class="form-group">
                    <input type="number" name="gramaje" placeholder=" " required>
                    <p>Gramaje (gr) *</p>
                </div>

                <div class="form-group">
                    <select name="seleccion" required id="seleccion">
                        <option value=""></option>
                        <option value="Cernido">Cernido</option>
                        <option value="Seleccionado">Seleccionado</option>
                    </select>
                    <p>Selección/Cernido *</p>
                </div>

                <div class="form-group">
                    <p class="etiqueta-microondas">Microondas*</p>
                    <div class="microondas-container">
                        <div class="radio-group">
                            <input type="radio" id="micro-si" name="microondas-option" value="si" required>
                            <label for="micro-si"><i class="fas fa-check"></i> Sí</label>
                            <input type="radio" id="micro-no" name="microondas-option" value="no">
                            <label for="micro-no"><i class="fas fa-times"></i> No</label>
                        </div>
                        <div class="microondas-tiempo" style="display: none;">
                            <input type="number" name="microondas" placeholder="Tiempo en segundos">
                        </div>
                    </div>
                </div>

                <div class="form-group">
                    <input type="number" name="envasesTerminados" placeholder=" " required>
                    <p>Envases Terminados *</p>
                </div>

                <div class="form-group">
                    <input type="month" name="fechaVencimiento" placeholder=" " required>
                    <p>Fecha de Vencimiento *</p>
                </div>

                <p class="nota">
                    <i class="fas fa-exclamation-circle"></i>
                    Verifica bien la información antes de registrar
                </p>

                <button class="enviarRegistro" type="submit">
                    <i class="fas fa-clipboard-check"></i>
                    Registrar Producción
                </button>
            </form>
        </div>
    `;
    inicializarFormulario();
}
export function inicializarFormulario() {
    ocultarCarga();
    const form = document.querySelector('.form1 form');
    const productoInput = document.getElementById('producto-input');
    let productosDisponibles = [];

    // Validación del producto
    productoInput.addEventListener('change', function() {
        const productoSeleccionado = this.value.trim();
        if (!productosDisponibles.includes(productoSeleccionado)) {
            mostrarNotificacion('Por favor seleccione un producto válido de la lista', 'warning');
            this.value = '';
        }
    });

    // Agregar manejo de radio buttons para microondas
    const radioButtons = document.querySelectorAll('input[name="microondas-option"]');
    const tiempoMicroondas = document.querySelector('.microondas-tiempo');

    // Añadir evento focus a todos los inputs para mejorar UX móvil
    const inputs = form.querySelectorAll('input, select');
    inputs.forEach(input => {
        input.addEventListener('focus', function () {
            setTimeout(() => {
                const inputRect = this.getBoundingClientRect();
                const offset = inputRect.top + window.scrollY - (window.innerHeight / 3);
                window.scrollTo({
                    top: offset,
                    behavior: 'smooth'
                });
            }, 100);
        });
    });

    radioButtons.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'si') {
                tiempoMicroondas.style.display = 'block';
                tiempoMicroondas.querySelector('input').required = true;
            } else {
                tiempoMicroondas.style.display = 'none';
                tiempoMicroondas.querySelector('input').required = false;
                tiempoMicroondas.querySelector('input').value = '';
            }
        });
    });

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const productoSeleccionado = productoInput.value.trim();
        if (!productosDisponibles.includes(productoSeleccionado)) {
            mostrarNotificacion('Por favor seleccione un producto válido de la lista', 'warning');
            return;
        }

        if (!verificarHorario()) {
            mostrarNotificacion('No se pueden registrar producciones fuera del horario permitido (8:00 AM - 6:15 PM)', 'error');
            return;
        }

        const formData = new FormData(form);
        const data = {};

        // Procesar opción de microondas
        const microOption = form.querySelector('input[name="microondas-option"]:checked').value;
        if (microOption === 'no') {
            data.microondas = 'No';
        } else {
            data.microondas = formData.get('microondas');
        }

        // Process other fields
        formData.forEach((value, key) => {
            if (key !== 'microondas' && key !== 'microondas-option') {
                if (['lote', 'gramaje', 'envasesTerminados'].includes(key)) {
                    data[key] = Number(value) || 0;
                } else {
                    data[key] = value;
                }
            }
        });

        try {
            mostrarCarga();
            // Get current user first
            const userResponse = await fetch('/obtener-mi-rol');
            const userData = await userResponse.json();
            const usuarioActual = userData.nombre;

            const response = await fetch('/registrar-produccion', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (result.success) {
                try {
                    await registrarNotificacion(
                        usuarioActual,
                        'Almacen',
                        `Se registró una nueva producción de ${data.producto}`
                    );
                } catch (notifError) {
                    console.error('Error al enviar notificación:', notifError);
                }

                mostrarNotificacion('Registro guardado correctamente', 'success');
                resetearFormulario();
            } else {
                throw new Error(result.error || 'Error desconocido');
            }
        } catch (error) {
            console.error('Error completo:', error);
            mostrarNotificacion('Error al guardar el registro: ' + error.message, 'error');
        } finally {
            ocultarCarga();
        }
    });

    // Modificar cargarProductos para guardar la lista
    async function cargarProductosValidados() {
        try {
            mostrarCarga();
            const response = await fetch('/obtener-productos');
            const data = await response.json();

            if (data.success) {
                const datalist = document.getElementById('productos-list');
                datalist.innerHTML = '';
                productosDisponibles = data.productos;

                data.productos.forEach(producto => {
                    const option = document.createElement('option');
                    option.value = producto;
                    datalist.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error al cargar productos:', error);
            mostrarNotificacion('Error al cargar la lista de productos', 'error');
        } finally {
            ocultarCarga();
        }
    }

    cargarProductosValidados();
}
export function resetearFormulario() {
    const inputs = document.querySelectorAll('.form1 form input:not([type="radio"])');
    inputs.forEach(input => {
        input.value = '';
    });

    const radioInputs = document.querySelectorAll('input[type="radio"]');
    radioInputs.forEach(radio => {
        radio.checked = false;
    });

    const selector = document.querySelector('.form1 form select');
    if (selector) {
        selector.selectedIndex = 0;
    }

    document.querySelector('.microondas-tiempo').style.display = 'none';
}
export async function cargarProductos() {
    try {
        mostrarCarga();
        const response = await fetch('/obtener-productos');
        const data = await response.json();

        if (data.success) {
            const datalist = document.getElementById('productos-list');
            datalist.innerHTML = ''; // Limpiar opciones existentes

            data.productos.forEach(producto => {
                const option = document.createElement('option');
                option.value = producto;
                datalist.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error al cargar productos:', error);
    }
    finally {
        ocultarCarga();
    }
}
function verificarHorario() {
    const ahora = new Date();
    const hora = ahora.getHours();
    const minutos = ahora.getMinutes();
    const tiempoActual = hora * 60 + minutos; // Convertir a minutos

    const inicioJornada = 8 * 60; // 8:00 AM en minutos
    const finJornada = 19 * 60; // 6:15 PM en minutos

    return tiempoActual >= inicioJornada && tiempoActual <= finJornada;
}