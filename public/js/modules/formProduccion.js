
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
    <div class="encabezado">
        <h2>Registro Producción</h2>
         <button class="anuncio-btn close" onclick="ocultarAnuncio()">
            <i class="fas fa-arrow-right"></i></button>
    </div>
    <div class="relleno">
            <p>Producto*</p>
                <input type="text" name="producto" id="producto-input" placeholder="Selecciona el producto" autocomplete="off" required>
                <div class="sugerencias-container" style="display: none;">
                    <ul class="sugerencias-list"></ul>
                </div>

            <p>Gramaje* (Autogenerado)<i class="fas fa-info-circle" id="gramaje-info" style="color:gray"></i></p>
            <div class="campo-form" style="background:none;padding:0px">
                <input type="number" name="gramaje" placeholder="Gramaje" readonly tabindex="-1" style="pointer-events: none;">
                <input type="number" name="gramaje-special" placeholder="Ingresa gramaje especial" style="display: none;">
            </div>
            
            
            <p>Lote*</p>
                <input type="number" name="lote" placeholder="Ingresa el lote. Ej: 03557" required>
                
            <p>Proceso* (Elige una opción)</p>
                <div style="margin-bottom: 10px">
                    <div class="anuncio-botones" style="margin-top: 5px; padding:0">
                        <button class="proceso-btn anuncio-btn" data-status="Cernido" value="Cernido" id="cernido" style="width:100%">Cernido</button>
                        <button class="proceso-btn anuncio-btn" data-status="Seleccionado" value="Seleccionado" id="seleccionado" style="width:100%">Seleccionado</button>
                    </div>
                </div>

            <p class="etiqueta-microondas">Microondas* (Elige una opción)</p>
                <div style="margin-bottom: 10px">
                    <div class="anuncio-botones" style="margin-top:5px;padding:0">
                        <button class="microondas-btn anuncio-btn" data-status="si" value="si" id="si" style="width:100%">SI</button>
                        <button class="microondas-btn anuncio-btn" data-status="no-llego" value="no" id="no" style="width:100%">NO</button>
                    </div>
                </div>
            <div class="microondas-tiempo" style="display: none;">
                <input type="number" name="microondas" placeholder="Tiempo en segundos. Ej: 60">
            </div>
            <p>Envases Terminados*</p>
                <input type="number" name="envasesTerminados" placeholder="Ingresa la cantidad. Ej: 400" required>
        
            <p>Fecha de Vencimiento*</p>
                <div style="display: flex; gap: 10px;">
                    <select name="mes" required style="width: 50%;">
                        <option value="">Mes</option>
                        ${Array.from({ length: 12 }, (_, i) => i + 1)
            .map(num => `<option value="${String(num).padStart(2, '0')}">${String(num).padStart(2, '0')}</option>`)
            .join('')}
                    </select>
                    <select name="año" required style="width: 50%;">
                        <option value="">Año</option>
                        ${Array.from({ length: 26 }, (_, i) => i + 2025)
            .map(year => `<option value="${year}">${year}</option>`)
            .join('')}
                    </select>
                </div>

            <p class="nota">
                <i class="fas fa-exclamation-circle"></i>
                Verifica bien la información antes de registrar
            </p>
    </div>
    <div class="anuncio-botones">
          
        <button class="anuncio-btn green confirmar">
            <i class="fas fa-clipboard-check"></i> Finalizar y registrar
        </button>
    </div>
    `;

    // Mostrar el anuncio
    mostrarAnuncio();

    // Inicializar el formulario
    inicializarFormulario();

    // Manejar botones de proceso y microondas
    const procesoBotones = anuncio.querySelectorAll('.proceso-btn');
    const microondasBotones = anuncio.querySelectorAll('.microondas-btn');
    const tiempoMicroondas = anuncio.querySelector('.microondas-tiempo');

    procesoBotones.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            procesoBotones.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    microondasBotones.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            microondasBotones.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            if (btn.id === 'si') {
                tiempoMicroondas.style.display = 'block';
                tiempoMicroondas.querySelector('input').required = true;
                tiempoMicroondas.querySelector('input').focus();
            } else {
                tiempoMicroondas.style.display = 'none';
                tiempoMicroondas.querySelector('input').required = false;
                tiempoMicroondas.querySelector('input').value = '';
            }
        });
    });

    anuncio.querySelector('.confirmar').onclick = async (e) => {
        e.preventDefault();

        const productoInput = document.getElementById('producto-input');
        const productoValue = productoInput.value.trim();

        try {
            mostrarCarga();
            const response = await fetch('/obtener-productos');
            const data = await response.json();


            if (!data.productos.some(p => p.nombre === productoValue)) {
                mostrarNotificacion('El producto ingresado no existe en la lista', 'warning');
                productoInput.classList.add('invalid');
                ocultarCarga();
                return;
            }

            // Validar campos requeridos
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

            // Validar que se haya seleccionado un proceso
            const procesoSeleccionado = anuncio.querySelector('.proceso-btn.active');
            if (!procesoSeleccionado) {
                mostrarNotificacion('Por favor seleccione un proceso', 'warning');
                ocultarCarga();
                return;
            }

            // Validar que se haya seleccionado una opción de microondas
            const microondasSeleccionado = anuncio.querySelector('.microondas-btn.active');
            if (!microondasSeleccionado) {
                mostrarNotificacion('Por favor seleccione una opción de microondas', 'warning');
                ocultarCarga();
                return;
            }
            const formData = {
                producto: productoValue,
                lote: document.querySelector('input[name="lote"]').value,
                gramaje: (() => {
                    const gramajeEspecial = document.querySelector('input[name="gramaje-special"]').value;
                    const gramajeNormal = document.querySelector('input[name="gramaje"]').value;
                    return (gramajeEspecial === "" || gramajeEspecial === "0") ? gramajeNormal : gramajeEspecial;
                })(),
                seleccion: procesoSeleccionado.value,
                envasesTerminados: document.querySelector('input[name="envasesTerminados"]').value,
                fechaVencimiento: `${document.querySelector('select[name="año"]').value}-${document.querySelector('select[name="mes"]').value}`,
            };


            // Manejar opción de microondas
            if (microondasSeleccionado.id === 'si') {
                const tiempoMicroondas = document.querySelector('input[name="microondas"]').value;
                if (!tiempoMicroondas) {
                    mostrarNotificacion('Por favor ingrese el tiempo de microondas', 'warning');
                    ocultarCarga();
                    return;
                }
                formData.microondas = tiempoMicroondas;
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
}
window.mostrarFormularioProduccion = mostrarFormularioProduccion;
export function inicializarFormulario() {
    ocultarCarga();
    const productoInput = document.getElementById('producto-input');
    let productosDisponibles = [];

    const gramajeInfo = document.getElementById('gramaje-info');
    const gramajeSpecial = document.querySelector('input[name="gramaje-special"]');
    const gramaje = document.querySelector('input[name="gramaje"]');
    
    gramajeInfo.addEventListener('click', function() {
        if (gramajeSpecial.style.display === 'none') {
            gramajeSpecial.style.display = 'block';
            gramaje.style.display = 'none';
            gramajeInfo.style.color = '#4CAF50'; // Verde cuando gramaje especial está visible
        } else {
            gramajeSpecial.style.display = 'none';
            gramaje.style.display = 'block';
            gramajeInfo.style.color = 'gray'; // Gris cuando gramaje normal está visible
        }
    });

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



    sugerenciasList.querySelectorAll('li').forEach(li => {
        li.addEventListener('click', function () {
            const [nombre, gramajeTexto] = this.textContent.split(' - ');
            const gramaje = gramajeTexto.replace('g', '');
            productoInput.value = nombre; // Solo establecemos el nombre
            document.querySelector('input[name="gramaje"]').value = gramaje;
            sugerenciasContainer.style.display = 'none';
        });
    });

    document.addEventListener('click', function (e) {
        if (!productoInput.contains(e.target) && !sugerenciasContainer.contains(e.target)) {
            sugerenciasContainer.style.display = 'none';
        }
    });

    async function cargarProductosValidados() {
        try {
            const response = await fetch('/obtener-productos');
            const data = await response.json();

            if (data.success) {
                productosDisponibles.length = 0;
                // Formatear los productos manteniendo la estructura original
                productosDisponibles.push(...data.productos.map(producto => ({
                    nombre: producto.nombre,
                    gramaje: producto.gramaje,
                    texto: `${producto.nombre} - ${producto.gramaje}g`
                })));
            }
        } catch (error) {
            console.error('Error al cargar productos:', error);
        }
    }

    productoInput.addEventListener('input', function () {
        const valorBusqueda = normalizarTexto(this.value.trim());

        if (valorBusqueda) {
            const sugerencias = productosDisponibles.filter(producto =>
                normalizarTexto(producto.texto).includes(valorBusqueda)
            );

            if (sugerencias.length > 0) {
                sugerenciasList.innerHTML = sugerencias
                    .map(producto => `<li data-nombre="${producto.nombre}" data-gramaje="${producto.gramaje}">${producto.texto}</li>`)
                    .join('');
                sugerenciasContainer.style.display = 'block';

                // Manejar la selección de sugerencias
                sugerenciasList.querySelectorAll('li').forEach(li => {
                    li.addEventListener('click', function () {
                        const nombre = this.dataset.nombre;
                        const gramaje = this.dataset.gramaje;
                        productoInput.value = nombre;
                        document.querySelector('input[name="gramaje"]').value = gramaje;
                        sugerenciasContainer.style.display = 'none';
                    });
                });
            } else {
                sugerenciasContainer.style.display = 'none';
            }
        } else {
            sugerenciasContainer.style.display = 'none';
        }
    });


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
    form.addEventListener('submit', async function (e) {
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
        const response = await fetch('/obtener-productos');
        const data = await response.json();

        if (data.success) {
            const datalist = document.getElementById('productos-list');
            datalist.innerHTML = ''; // Limpiar opciones existentes

            data.productos.forEach(producto => {
                const option = document.createElement('option');
                // Asume que producto es un objeto con propiedades nombre y gramaje
                option.value = `${producto.nombre} - ${producto.gramaje}g`;
                option.setAttribute('data-nombre', producto.nombre);
                option.setAttribute('data-gramaje', producto.gramaje);
                datalist.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error al cargar productos:', error);
    }
}

/* =============== FUNCIONES DE HORARIO DE REGISTRO =============== */
function verificarHorario() {
    const ahora = new Date();
    const hora = ahora.getHours();
    const minutos = ahora.getMinutes();
    const tiempoActual = hora * 60 + minutos; // Convertir a minutos

    const inicioJornada = 8 * 60; const finJornada = 22 * 60;

    return tiempoActual >= inicioJornada && tiempoActual <= finJornada;
}