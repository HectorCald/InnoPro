export async function initializePreciosPro() {
    const view = document.querySelector('.preciosPro-view');
    
    try {
        const response = await fetch('/obtener-precios-base');
        if (!response.ok) {
            throw new Error('Error en la petición al servidor');
        }

        const data = await response.json();
        
        if (!data.success || !data.preciosBase) {
            throw new Error(data.error || 'No se recibieron los precios base');
        }

        const preciosBase = data.preciosBase;

        view.innerHTML = `
            <h2 class="section-title">
                <i class="fas fa-calculator"></i> Configuración de Precios
            </h2>
            
            <div class="precios-container">
                <div class="precios-section">
                    <h3>Valores Base</h3>
                    <div class="precio-group">
                        <label>Etiquetado:</label>
                        <input type="number" id="etiquetado-base" value="${preciosBase.etiquetado}" step="any">
                    </div>
                    <div class="precio-group">
                        <label>Sellado:</label>
                        <input type="number" id="sellado-base" value="${preciosBase.sellado}" step="any">
                    </div>
                    <div class="precio-group">
                        <label>Envasado:</label>
                        <input type="number" id="envasado-base" value="${preciosBase.envasado}" step="any">
                    </div>
                    <div class="precio-group">
                        <label>Cernido:</label>
                        <input type="number" id="cernido-bolsa-base" value="${preciosBase.cernidoBolsa}" step="any">
                    </div>
                    <button id="guardar-precios" class="btn-guardar">
                        <i class="fas fa-save"></i> Guardar Cambios
                    </button>
                    <button id="agregar-regla" class="btn-guardar">
                        <i class="fas fa-plus"></i> Agregar regla
                    </button>
                </div>
            </div>
        `;

        // Agregar evento al botón de guardar
        document.getElementById('guardar-precios').addEventListener('click', guardarPreciosBase);
        // Agregar evento al botón de agregar regla
        document.getElementById('agregar-regla').addEventListener('click', mostrarFormularioRegla);

    } catch (error) {
        console.error('Error al inicializar:', error);
        view.innerHTML = `
            <div class="error-container">
                <p class="error">Error al cargar los precios base</p>
                <p class="error-details">${error.message}</p>
                <button onclick="window.location.reload()" class="btn-retry">
                    <i class="fas fa-sync"></i> Reintentar
                </button>
            </div>
        `;
    }
}

async function guardarPreciosBase() {
    try {
        const nuevosPrecios = {
            etiquetado: document.getElementById('etiquetado-base').value,
            sellado: document.getElementById('sellado-base').value,
            envasado: document.getElementById('envasado-base').value,
            cernidoBolsa: document.getElementById('cernido-bolsa-base').value,
            cernidoBotes: document.getElementById('cernido-botes-base').value
        };

        const response = await fetch('/actualizar-precios-base', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(nuevosPrecios)
        });

        const result = await response.json();
        if (result.success) {
            alert('Precios actualizados correctamente');
        } else {
            throw new Error(result.error || 'Error al actualizar los precios');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al guardar los cambios: ' + error.message);
    }
}

async function mostrarFormularioRegla() {
    try {
        const responseProductos = await fetch('/obtener-productos');
        const dataProductos = await responseProductos.json();
        
        const anuncio = document.querySelector('.anuncio');
        const anuncioContenido = anuncio.querySelector('.anuncio-contenido');
        
        anuncioContenido.innerHTML = `
            <h2>Agregar Regla Especial</h2>
            <input type="text" class="buscador" placeholder="Buscar producto..." id="buscador-producto">
            <select id="producto-select">
                <option value="">Seleccione un producto</option>
                ${dataProductos.productos.map(producto => 
                    `<option value="${producto}">${producto}</option>`
                ).join('')}
            </select>
            <select id="tipo-base">
                <option value="">Seleccione tipo</option>
                <option value="etiquetado">Etiquetado</option>
                <option value="sellado">Sellado</option>
                <option value="envasado">Envasado</option>
                <option value="cernido">Cernido especial</option>
            </select>
                
    <div id="precio-cernido-container" style="display: none;">
        <label>Precio base cernido:</label>
        <input type="text" id="precio-cernido-especial" 
               pattern="[0-9]*[.,]?[0-9]*" 
               placeholder="Ejemplo: 0,016">
    </div>
            <div id="multiplicador-container">
                <select id="multiplicador">
                    <option value="">Seleccione multiplicador</option>
                    ${[1,2,3,4,5].map(num => 
                        `<option value="${num}">x${num}</option>`
                    ).join('')}
                </select>
            </div>
            <div class="anuncio-botones">
                <button class="anuncio-btn cancelar">Cancelar</button>
                <button class="anuncio-btn confirmar">Agregar</button>
            </div>
        `;

        anuncio.style.display = 'flex';
        document.querySelector('.overlay').style.display = 'block';

        configurarEventosFormulario(anuncio);
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar productos: ' + error.message);
    }
}

function configurarEventosFormulario(anuncio) {
    // Evento para mostrar/ocultar campos según tipo
    document.getElementById('tipo-base').addEventListener('change', (e) => {
        const precioCernidoContainer = document.getElementById('precio-cernido-container');
        const multiplicadorContainer = document.getElementById('multiplicador-container');
        
        if (e.target.value === 'cernido') {
            precioCernidoContainer.style.display = 'block';
            multiplicadorContainer.style.display = 'none';
            document.getElementById('multiplicador').value = '1';
        } else {
            precioCernidoContainer.style.display = 'none';
            multiplicadorContainer.style.display = 'block';
            document.getElementById('precio-cernido-especial').value = '';
        }
    });

    // Configurar el input de cernido para manejar decimales
    const precioCernidoInput = document.getElementById('precio-cernido-especial');
    precioCernidoInput.addEventListener('input', (e) => {
        let valor = e.target.value;
        // Solo permitir números y una coma o punto
        valor = valor.replace(/[^\d,.]/, '');
        // Asegurar solo un separador decimal
        const partes = valor.split(/[,.]/);
        if (partes.length > 2) {
            valor = partes[0] + ',' + partes[1];
        }
        e.target.value = valor;
    });

    // Implementar búsqueda
    const buscador = document.getElementById('buscador-producto');
    const productoSelect = document.getElementById('producto-select');
    const productosOriginales = [...productoSelect.options];

    buscador.addEventListener('input', (e) => {
        const busqueda = e.target.value.toLowerCase();
        productoSelect.innerHTML = '<option value="">Seleccione un producto</option>';
        productosOriginales.forEach(option => {
            if (option.text.toLowerCase().includes(busqueda)) {
                productoSelect.appendChild(option.cloneNode(true));
            }
        });
    });

    // Evento para cancelar
    anuncio.querySelector('.cancelar').addEventListener('click', () => {
        anuncio.style.display = 'none';
        document.querySelector('.overlay').style.display = 'none';
    });

    // Evento para agregar
    anuncio.querySelector('.confirmar').addEventListener('click', async () => {
        try {
            const producto = document.getElementById('producto-select').value;
            const base = document.getElementById('tipo-base').value;
            const multiplicador = base === 'cernido' ? '1' : document.getElementById('multiplicador').value;
            
            // Manejar el valor del cernido especial
            let precioCernido = document.getElementById('precio-cernido-especial').value;
            if (base === 'cernido' && precioCernido) {
                // Asegurar formato decimal con punto
                precioCernido = precioCernido.replace(',', '.');
                // Validar que sea un número válido
                if (isNaN(parseFloat(precioCernido))) {
                    throw new Error('Por favor ingrese un precio válido para cernido');
                }
            }

            // Validaciones
            if (!producto || !base) {
                throw new Error('Por favor complete todos los campos');
            }

            if (base === 'cernido' && !precioCernido) {
                throw new Error('Por favor ingrese el precio base para cernido');
            }

            if (base !== 'cernido' && !multiplicador) {
                throw new Error('Por favor seleccione un multiplicador');
            }

            const response = await fetch('/guardar-producto-especial', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    producto,
                    base,
                    multiplicador: base === 'cernido' ? precioCernido : multiplicador,
                    precioCernido: null
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error en la petición al servidor');
            }

            const result = await response.json();
            if (result.success) {
                alert('Regla especial agregada correctamente');
                anuncio.style.display = 'none';
                document.querySelector('.overlay').style.display = 'none';
            } else {
                throw new Error(result.error || 'Error al guardar la regla');
            }
        } catch (error) {
            console.error('Error:', error);
            alert(error.message);
        }
    });
}