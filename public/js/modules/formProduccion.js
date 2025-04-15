import { registrarNotificacion } from './advertencia.js';
/* =============== FUNCIONES DE INCIO DE FORMULARIO PRODUCCION =============== */
export function inicializarFormularioProduccion() {
    const container = document.querySelector('.formProduccion-view');
    const anuncio = document.querySelector('.anuncio');

    // Primero, inicializa la vista principal
    container.innerHTML = `
        <div class="title">
            <i class="fas fa-clipboard-list"></i>
            <h2 class="section-title">Registro de Producción</h2>
        </div>
        <div class="pedidos-container">
            <div class="pedidos-botones">
                <div class="cuadro-btn">
                    <button class="btn-agregar-pedido" onclick="mostrarFormularioProduccion()">
                        <i class="fas fa-plus"></i>
                    </button>
                    <p>Nuevo Registro</p>
                </div>
            </div>
        </div>
    `;

    // Ocultar el anuncio inicialmente
    anuncio.style.display = 'none';
}
export function mostrarFormularioProduccion() {
    if (!verificarHorario()) {
        mostrarNotificacion('No se pueden registrar producciones fuera del horario permitido (8:00 AM - 7:00 PM)', 'error');
        return;
    }

    const anuncio = document.querySelector('.anuncio');
    const contenido = anuncio.querySelector('.anuncio-contenido');
    
    contenido.innerHTML = `
    <h2><i class="fas fa-clipboard-list"></i> Nueva Producción</h2>
    <div class="relleno">
        <div class="form-grup">
            <p>Producto:</p>
            <div class="producto-container">
                <input type="text" name="producto" id="producto-input" placeholder="Selecciona el producto" autocomplete="off" required>
                <div class="sugerencias-container" style="display: none;">
                    <ul class="sugerencias-list"></ul>
                </div>
            </div>
        </div>
            <div class="campo-form">
                <p>Lote:</p>
                <input type="number" name="lote" placeholder="Numero" required>
            </div>
            <div class="campo-form">
                <p>Gramaje:</p>
                <input type="number" name="gramaje" placeholder="Numero" required>
            </div>
            <div class="campo-form">
                <p>Proceso:</p>
                <select name="seleccion" required id="seleccion">
                    <option value="">Elige una opción</option>
                    <option value="Cernido">Cernido</option>
                    <option value="Seleccionado">Seleccionado</option>
                </select>
            </div>
            <div class="campo-form">
                <p class="etiqueta-microondas">Microondas:</p>
                <div class="campo-form">
                    <div class="anuncio-botones" style="margin-top: 10px;">
                        <button class="filter-btn anuncio-btn" data-status="si" value="si" id="si" style="width:60px">SI</button>
                        <button class="filter-btn anuncio-btn" data-status="no-llego value="no" id="no" style="width:60px">NO</button>
                    </div>
                </div>
            </div>
            <div class="microondas-tiempo campo-form" style="display: none;">
                <input type="number" name="microondas" placeholder="Tiempo en segundos">
            </div>
            <div class="campo-form">
                <p>Envases Terminados:</p>
                <input type="number" name="envasesTerminados" placeholder="Numero" required>
            </div>
            <div class="form-grup">
                <p>Fecha de Vencimiento:</p>
                <input type="month" name="fechaVencimiento" required>
            </div>
            <p class="nota">
                <i class="fas fa-exclamation-circle"></i>
                Verifica bien la información antes de registrar
            </p>
        </div>
        <div class="anuncio-botones">
            <button class="anuncio-btn close" onclick="document.querySelector('.anuncio').style.display='none'">
                <i class="fas fa-times"></i>
            </button>
            <button class="anuncio-btn green confirmar">
                <i class="fas fa-clipboard-check"></i> Registrar
            </button>
        </div>
    `;

    // Mostrar el anuncio
    anuncio.style.display = 'flex';

    // Inicializar el formulario
    inicializarFormulario();

    anuncio.querySelector('.confirmar').onclick = async (e) => {
    e.preventDefault();
    
    // First validate if product exists in the list
    const productoInput = document.getElementById('producto-input');
    const productoValue = productoInput.value.trim();
    
    try {
        mostrarCarga();
        const response = await fetch('/obtener-productos');
        const data = await response.json();
        
        if (!data.productos.includes(productoValue)) {
            mostrarNotificacion('El producto ingresado no existe en la lista', 'warning');
            productoInput.classList.add('invalid');
            ocultarCarga();
            return;
        }

        // Continue with other validations if product exists
        const requiredInputs = anuncio.querySelectorAll('input[required], select[required]');
        let isValid = true;
        
        requiredInputs.forEach(input => {
            if (!input.value.trim()) {
                isValid = false;
                input.classList.add('invalid');
            } else {
                input.classList.remove('invalid');
            }
        });
    
        if (!isValid) {
            mostrarNotificacion('Por favor complete todos los campos requeridos', 'warning');
            ocultarCarga();
            return;
        }
    
        // Recopilar todos los datos del formulario
        const formData = {
            producto: productoValue,
            lote: document.querySelector('input[name="lote"]').value,
            gramaje: document.querySelector('input[name="gramaje"]').value,
            seleccion: document.querySelector('select[name="seleccion"]').value,
            envasesTerminados: document.querySelector('input[name="envasesTerminados"]').value,
            fechaVencimiento: document.querySelector('input[name="fechaVencimiento"]').value
        };

        // Rest of your existing code for handling microondas and submission
        const botonSiActivo = anuncio.querySelector('#si.active');
        if (botonSiActivo) {
            formData.microondas = document.querySelector('input[name="microondas"]').value;
        } else {
            formData.microondas = 'No';
        }

        const userResponse = await fetch('/obtener-mi-rol');
        const userData = await userResponse.json();
        const usuarioActual = userData.nombre;

        const submitResponse = await fetch('/registrar-produccion', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const result = await submitResponse.json();

        if (result.success) {
            await registrarNotificacion(
                usuarioActual,
                'Almacen',
                `Se registró una nueva producción de ${formData.producto}`
            );
            mostrarNotificacion('Registro guardado correctamente', 'success');
            document.querySelector('.anuncio').style.display = 'none';
        } else {
            throw new Error(result.error || 'Error desconocido');
        }
    } catch (error) {
        console.error('Error completo:', error);
        mostrarNotificacion('Error al guardar el registro: ' + error.message, 'error');
    } finally {
        ocultarCarga();
    }
    };
    // Manejar botones de microondas
    const filterButtons = anuncio.querySelectorAll('.filter-btn');
    const tiempoMicroondas = anuncio.querySelector('.microondas-tiempo');
    
    filterButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            if (btn.id === 'si') {
                tiempoMicroondas.style.display = 'block';
                tiempoMicroondas.querySelector('input').required = true;
                tiempoMicroondas.querySelector('input').focus(); // Set focus on the input
            } else {
                tiempoMicroondas.style.display = 'none';
                tiempoMicroondas.querySelector('input').required = false;
                tiempoMicroondas.querySelector('input').value = '';
            }
        });
    });

}
window.mostrarFormularioProduccion = mostrarFormularioProduccion;
export function inicializarFormulario() {
    ocultarCarga();
    const productoInput = document.getElementById('producto-input');
    let productosDisponibles = [];

    // Usar el contenedor de sugerencias existente
    const sugerenciasContainer = document.querySelector('.sugerencias-container');
    const sugerenciasList = sugerenciasContainer.querySelector('.sugerencias-list');

    inicializarEventosProducto(productoInput, sugerenciasContainer, sugerenciasList, productosDisponibles);
    inicializarEventosFormulario(productoInput, productosDisponibles);
    scrollToTop('.formProduccion-view');
}
function inicializarEventosProducto(productoInput, sugerenciasContainer, sugerenciasList, productosDisponibles) {
    function normalizarTexto(texto) {
        return texto.toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/\s+/g, "");
    }

    productoInput.addEventListener('input', function() {
        const valorNormalizado = normalizarTexto(this.value.trim());
        
        if (valorNormalizado) {
            const sugerencias = productosDisponibles.filter(producto => 
                normalizarTexto(producto).includes(valorNormalizado)
            );
            
            if (sugerencias.length > 0) {
                sugerenciasList.innerHTML = sugerencias
                    .map(producto => `<li>${producto}</li>`)
                    .join('');
                sugerenciasContainer.style.display = 'block';
            } else {
                sugerenciasContainer.style.display = 'none';
            }
        } else {
            sugerenciasContainer.style.display = 'none';
        }
    });

    sugerenciasList.addEventListener('click', function(e) {
        if (e.target.tagName === 'LI') {
            productoInput.value = e.target.textContent;
            sugerenciasContainer.style.display = 'none';
        }
    });

    document.addEventListener('click', function(e) {
        if (!productoInput.contains(e.target) && !sugerenciasContainer.contains(e.target)) {
            sugerenciasContainer.style.display = 'none';
        }
    });

    async function cargarProductosValidados() {
    try {
        mostrarCarga();
        const response = await fetch('/obtener-productos');
        const data = await response.json();

        if (data.success) {
            // Normalizar y eliminar duplicados
            const productosUnicos = new Set(
                data.productos.map(producto => 
                    producto.trim() // Eliminar espacios en blanco al inicio y final
                ).filter(Boolean) // Eliminar valores vacíos
            );
            
            productosDisponibles.length = 0;
            productosDisponibles.push(...Array.from(productosUnicos));
            productosDisponibles.sort((a, b) => a.localeCompare(b, 'es')); // Ordenar alfabéticamente en español
        }
    } catch (error) {
        console.error('Error al cargar productos:', error);
    } finally {
        ocultarCarga();
    }
}

    cargarProductosValidados();
}
function inicializarEventosFormulario(form, productoInput, productosDisponibles) {
    const radioButtons = document.querySelectorAll('input[name="microondas-option"]');
    const tiempoMicroondas = document.querySelector('.microondas-tiempo');

    // Mobile UX improvement
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

    // Microondas radio buttons
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

    // Form submission
    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        if (!verificarHorario()) {
            mostrarNotificacion('No se pueden registrar producciones fuera del horario permitido (8:00 AM - 6:15 PM)', 'error');
            return;
        }

        // Validación del producto al momento del submit
        const productoSeleccionado = productoInput.value.trim();
        if (!productosDisponibles.includes(productoSeleccionado)) {
            mostrarNotificacion('El producto ingresado no existe en la lista', 'warning');
            return;
        }

        const formData = new FormData(form);
        const data = {};

        // Process microwave option
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
}

/* =============== FUNCIONES DE CARGA DE FORMULARIO =============== */
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

/* =============== FUNCIONES DE HORARIO DE REGISTRO =============== */
function verificarHorario() {
    const ahora = new Date();
    const hora = ahora.getHours();
    const minutos = ahora.getMinutes();
    const tiempoActual = hora * 60 + minutos; // Convertir a minutos

    const inicioJornada = 8 * 60;     const finJornada = 19 * 60; 

    return tiempoActual >= inicioJornada && tiempoActual <= finJornada;
}