export function inicializarFormularioProduccion() {
    mostrarCarga();
    const container = document.querySelector('.formProduccion-view');
    container.innerHTML = `
        <div class="form1">
            <div class="title">
                <h3>Formulario de Registro</h3>
            </div>
            <form action="">
                <!-- Campos del Producto -->
                <p>Producto *</p>
                <input type="text" name="producto" id="producto-input" list="productos-list" placeholder="Nombre del producto" autocomplete="off" required>
                <datalist id="productos-list">
                </datalist>
                <p>Lote *</p>
                <input type="number" name="lote" placeholder="Número de lote" required>

                <p>Gramaje (gr) *</p>
                <input type="number" name="gramaje" placeholder="Peso en gramos" required>

                <!-- Campos de Proceso -->
                <p>Selección/Cernido *</p>
                <select name="seleccion" required>
                    <option value="">Seleccione una opción</option>
                    <option value="Cernido">Cernido</option>
                    <option value="Seleccionado">Seleccionado</option>
                </select>

                <!-- Sección de Microondas -->
                <p>Microondas *</p>
                <div class="microondas-container">
                    <div class="radio-group">
                        <input type="radio" id="micro-si" name="microondas-option" value="si" required>
                        <label for="micro-si">Sí</label>
                        <input type="radio" id="micro-no" name="microondas-option" value="no">
                        <label for="micro-no">No</label>
                    </div>
                    <div class="microondas-tiempo" style="display: none;">
                        <input type="number" name="microondas" placeholder="Tiempo en segundos">
                    </div>
                </div>

                <!-- Campos de Producción -->
                <p>Envases Terminados *</p>
                <input type="number" name="envasesTerminados" placeholder="Cantidad de envases" required>

                <p>Fecha de Vencimiento *</p>
                <input type="month" name="fechaVencimiento" required>

                <!-- Botón de Envío -->
                <p class="nota"><i class="fas fa-exclamation-circle"></i> Verifica bien la informacion antes de registrar!</p>
                <button class="enviarRegistro">
                    <i class="fas fa-clipboard-check"></i>
                    Registrar
                </button>
            </form>
        </div>
    `;
    // Inicializar el formulario después de renderizarlo
    inicializarFormulario();
}
export function inicializarFormulario() {
    ocultarCarga();
    const form = document.querySelector('.form1 form');
    
    // Agregar manejo de radio buttons para microondas
    const radioButtons = document.querySelectorAll('input[name="microondas-option"]');
    const tiempoMicroondas = document.querySelector('.microondas-tiempo');
    
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
            const response = await fetch('/registrar-produccion', {
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
        }
        finally{
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
