export function inicializarFormularioProduccion() {
    mostrarCarga();
    const container = document.querySelector('.formProduccion-view');
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
    
    // Agregar manejo de radio buttons para microondas
    const radioButtons = document.querySelectorAll('input[name="microondas-option"]');
    const tiempoMicroondas = document.querySelector('.microondas-tiempo');
    
    // Añadir evento focus a todos los inputs para mejorar UX móvil
    const inputs = form.querySelectorAll('input, select');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
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
            const response = await fetch('/mantenimiento', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            
            if (result.success) {
                mostrarNotificacion('Registro guardado correctamente','success');
                resetearFormulario();
            } else {
                throw new Error(result.error || 'Error desconocido');
            }
        } catch (error) {
            console.error('Error completo:', error);
            alert('Error al guardar el registro: ' + error.message);
        } finally {
            ocultarCarga();
        }
    });
    cargarProductos();
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
    finally{
        ocultarCarga();
    }
}
