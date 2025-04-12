export async function initializePreciosPro() {
    const view = document.querySelector('.preciosPro-view');

    try {
        mostrarCarga();
        const [responsePrecios, responseReglas] = await Promise.all([
            fetch('/obtener-precios-base'),
            fetch('/obtener-reglas-especiales')
        ]);

        if (!responsePrecios.ok || !responseReglas.ok) {
            throw new Error('Error en la petición al servidor');
        }

        const [dataPrecios, dataReglas] = await Promise.all([
            responsePrecios.json(),
            responseReglas.json()
        ]);

        if (!dataPrecios.success || !dataPrecios.preciosBase) {
            throw new Error(dataPrecios.error || 'No se recibieron los precios base');
        }

        const preciosBase = dataPrecios.preciosBase;
        const reglas = dataReglas.reglas || [];

        view.innerHTML = `
            <h3 class="title">
                <i class="fas fa-calculator"></i> Configuración de Precios
            </h3>
            
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
                    <div class ="btn-precioPro">
                        <button id="guardar-precios" class="btn-guardar">
                            <i class="fas fa-save"></i> Guardar
                        </button>
                        <button id="agregar-regla" class="btn-guardar">
                            <i class="fas fa-plus"></i> Agregar regla
                        </button>
                    </div>
                </div>

                <div class="reglas-section">
                    <h3>Reglas Especiales</h3>
                   <div class="reglas-container">
                        ${reglas.map((regla, index) => `
                             <div class="regla-item">
        <button class="btn-ver-detalles" 
            data-producto="${regla.producto}"
            data-index="${index}">
            ${regla.producto}
        </button>
        <div class="regla-detalles">
            ${regla.etiquetado !== '1' ? `
                <div class="detalle-grupo">
                    <label>Etiquetado:</label>
                    <span>${regla.etiquetado}x</span>
                </div>
            ` : ''}
            ${regla.sellado !== '1' ? `
                <div class="detalle-grupo">
                    <label>Sellado:</label>
                    <span>${regla.sellado}x</span>
                </div>
            ` : ''}
            ${regla.envasado !== '1' ? `
                <div class="detalle-grupo">
                    <label>Envasado:</label>
                    <span>${regla.envasado}x</span>
                </div>
            ` : ''}
            ${regla.cernido !== '1' ? `
                <div class="detalle-grupo">
                    <label>Cernido:</label>
                    <span>${regla.cernido}</span>
                </div>
            ` : ''}
            ${regla.gramajeMin && regla.gramajeMax ? `
                <div class="detalle-grupo">
                    <label>Rango de Gramaje:</label>
                    <span>${regla.gramajeMin} - ${regla.gramajeMax}</span>
                </div>
            ` : ''}
        </div>
        <button class="btn-eliminar" 
            data-producto="${regla.producto}"
            data-index="${index}">
            <i class="fas fa-trash"></i>
        </button>
    </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

        // Add event listeners
        document.getElementById('guardar-precios').addEventListener('click', guardarPreciosBase);
        document.getElementById('agregar-regla').addEventListener('click', mostrarFormularioRegla);
        
        // Add event listeners for delete buttons
        document.querySelectorAll('.btn-ver-detalles').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const producto = e.currentTarget.dataset.producto;
                const index = parseInt(e.currentTarget.dataset.index);
                const regla = reglas[index];
                
                if (window.innerWidth <= 768) {
                    // En móvil, mostrar el modal
                    mostrarDetallesRegla(regla);
                } else {
                    // En desktop, mostrar/ocultar detalles en línea
                    const reglaItem = e.currentTarget.closest('.regla-item');
                    const detalles = reglaItem.querySelector('.regla-detalles');
                    
                    // Cerrar otros detalles abiertos
                    document.querySelectorAll('.regla-detalles.visible').forEach(det => {
                        if (det !== detalles) det.classList.remove('visible');
                    });
                    
                    // Toggle detalles actuales
                    detalles.classList.toggle('visible');
                }
            });
        });
        document.querySelectorAll('.btn-eliminar').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const producto = e.currentTarget.dataset.producto;
                const index = parseInt(e.currentTarget.dataset.index);
                mostrarAnuncioEliminar(producto, index);
            });
        });
        

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
    } finally {
        ocultarCarga();
    }
}
function mostrarDetallesRegla(regla) {
    const anuncio = document.querySelector('.anuncio');
    const anuncioContenido = anuncio.querySelector('.anuncio-contenido');
    
    anuncioContenido.innerHTML = `
        <h2>Detalles de Regla Especial</h2>
        <div class="detalles-grup">
            <div class="detalle-item">
                <p>Producto:</p>
                <span>${regla.producto}</span>
            </div>
            ${regla.etiquetado !== '1' ? `
                <div class="detalle-item">
                    <p>Etiquetado:</p>
                    <span>${regla.etiquetado}x</span>
                </div>
            ` : ''}
            ${regla.sellado !== '1' ? `
                <div class="detalle-item">
                    <p>Sellado:</p>
                    <span>${regla.sellado}x</span>
                </div>
            ` : ''}
            ${regla.envasado !== '1' ? `
                <div class="detalle-item">
                    <p>Envasado:</p>
                    <span>${regla.envasado}x</span>
                </div>
            ` : ''}
            ${regla.cernido !== '1' ? `
                <div class="detalle-item">
                    <p>Cernido:</p>
                    <span>${regla.cernido}</span>
                </div>
            ` : ''}
            ${regla.gramajeMin && regla.gramajeMax ? `
                <div class="detalle-item">
                    <p>Rango de Gramaje:</p>
                    <span>${regla.gramajeMin} - ${regla.gramajeMax}</span>
                </div>
            ` : ''}
        </div>
        <div class="anuncio-botones">
            <button class="anuncio-btn close cancelar"><i class="fas fa-times"></i></button>
        </div>
    `;

    anuncio.style.display = 'flex';
    document.querySelector('.overlay').style.display = 'block';

    // Add close button event listener
    anuncio.querySelector('.cancelar').addEventListener('click', () => {
        anuncio.style.display = 'none';
        document.querySelector('.overlay').style.display = 'none';
    });
}
async function eliminarRegla(producto, index) {
    try {
        mostrarCarga();
        // Obtener las reglas actuales
        const responseReglas = await fetch('/obtener-reglas-especiales');
        const dataReglas = await responseReglas.json();
        
        if (!dataReglas.reglas || !dataReglas.reglas[index]) {
            throw new Error('No se encontró la regla a eliminar');
        }

        const reglaAEliminar = dataReglas.reglas[index];

        const response = await fetch('/eliminar-regla-especial', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                producto: reglaAEliminar.producto,
                etiquetado: reglaAEliminar.etiquetado,
                sellado: reglaAEliminar.sellado,
                envasado: reglaAEliminar.envasado,
                cernido: reglaAEliminar.cernido,
                gramajeMin: reglaAEliminar.gramajeMin || '',
                gramajeMax: reglaAEliminar.gramajeMax || '',
                index: index + 3 // Ajustamos el índice para que coincida con la hoja
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al eliminar la regla');
        }

        const result = await response.json();
        if (result.success) {
            mostrarNotificacion('Regla eliminada correctamente', 'success', 3000);
            await initializePreciosPro();
        } else {
            throw new Error(result.error || 'Error al eliminar la regla');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error al eliminar la regla: ' + error.message, 'error', 3000);
    } finally {
        ocultarCarga();
    }
}
async function guardarPreciosBase() {
    try {
        mostrarCarga();
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
    }finally{

    }
}
async function mostrarFormularioRegla() {
    try {
        mostrarCarga();
        const responseProductos = await fetch('/obtener-productos');
        const dataProductos = await responseProductos.json();
        
        const anuncio = document.querySelector('.anuncio');
        const anuncioContenido = anuncio.querySelector('.anuncio-contenido');
        
        anuncioContenido.innerHTML = `
            <h2><i class="fas fa-plus-circle"></i> Agregar Regla</h2>
            <div class="relleno">
                <div class="campo-form">
                     <input type="text" class="buscador" placeholder="Buscar producto..." id="buscador-producto">
                </div>
               <div class="campo-form">
                     <select id="producto-select">
                        <option value="">Seleccione un producto</option>
                        ${dataProductos.productos.map(producto => 
                            `<option value="${producto}">${producto}</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="campo-form">
                     <select id="tipo-base">
                        <option value="">Seleccione tipo</option>
                        <option value="etiquetado">Etiquetado</option>
                        <option value="sellado">Sellado</option>
                        <option value="envasado">Envasado</option>
                        <option value="cernido">Cernido especial</option>
                    </select>
                </div>
                <div id="precio-cernido-container" class="campo-form" style="display: none;">
                    <label>Precio base cernido:</label>
                    <input type="text" id="precio-cernido-especial" 
                        pattern="[0-9]*[.,]?[0-9]*" 
                        placeholder="Ejemplo: 0.3">
                </div>
                <div id="multiplicador-container" class="campo-form">
                    <select id="multiplicador">
                        <option value="">Seleccione multiplicador</option>
                        ${[1,2,3,4,5].map(num => 
                            `<option value="${num}">x${num}</option>`
                        ).join('')}
                    </select>
                </div>
                <div id="rango-gramaje-container" class="form-grup">
                    <p>Rango de gramaje (opcional):</p>
                    <div class="rango-inputs">
                        <input type="number" id="gramaje-min" placeholder="Mínimo" min="0">
                        <span>a</span>
                        <input type="number" id="gramaje-max" placeholder="Máximo" min="0">
                    </div>
                </div>
            </div>
            <div class="anuncio-botones">
                <button class="anuncio-btn close cancelar"><i class="fas fa-times"></i></button>
                <button class="anuncio-btn green confirmar"><i class="fas fa-plus-circle"></i>  Agregar</button>
            </div>
        `;

        anuncio.style.display = 'flex';

        configurarEventosFormulario(anuncio);
        await initializePreciosPro();
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar productos: ' + error.message);
    } finally {
        ocultarCarga();
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
        valor = valor.replace(/[^\d,.]/, '');
        const partes = valor.split(/[,.]/);
        if (partes.length > 2) {
            valor = partes[0] + ',' + partes[1];
        }
        e.target.value = valor;
    });

    // Validación de rango de gramaje
    const gramajeMin = document.getElementById('gramaje-min');
    const gramajeMax = document.getElementById('gramaje-max');

    gramajeMin.addEventListener('input', () => {
        if (gramajeMin.value && gramajeMax.value) {
            if (parseInt(gramajeMin.value) > parseInt(gramajeMax.value)) {
                gramajeMin.value = parseInt(gramajeMax.value);
            }
        }
    });

    gramajeMax.addEventListener('input', () => {
        if (gramajeMin.value && gramajeMax.value) {
            if (parseInt(gramajeMax.value) < parseInt(gramajeMin.value)) {
                gramajeMax.value = parseInt(gramajeMin.value);
            }
        }
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
            mostrarCarga();
            const productoSeleccionado = document.getElementById('producto-select').value;
            const busquedaProducto = document.getElementById('buscador-producto').value.trim();
            const base = document.getElementById('tipo-base').value;
            const multiplicador = base === 'cernido' ? '1' : document.getElementById('multiplicador').value;
            const gramajeMin = document.getElementById('gramaje-min').value;
            const gramajeMax = document.getElementById('gramaje-max').value;
            
            let precioCernido = document.getElementById('precio-cernido-especial').value;
            if (base === 'cernido' && precioCernido) {
                precioCernido = precioCernido.replace(',', '.');
                if (isNaN(parseFloat(precioCernido))) {
                    throw new Error('Por favor ingrese un precio válido para cernido');
                }
            }

            // Validaciones modificadas
            if (!base) {
                throw new Error('Por favor seleccione un tipo');
            }

            if (base === 'cernido' && !precioCernido) {
                throw new Error('Por favor ingrese el precio base para cernido');
            }

            if (base !== 'cernido' && !multiplicador) {
                throw new Error('Por favor seleccione un multiplicador');
            }

            if ((gramajeMin && !gramajeMax) || (!gramajeMin && gramajeMax)) {
                throw new Error('Si especifica un rango de gramaje, debe completar ambos valores');
            }

            if (gramajeMin && gramajeMax && parseInt(gramajeMin) > parseInt(gramajeMax)) {
                throw new Error('El gramaje mínimo debe ser menor o igual que el máximo');
            }

            // Usar el producto seleccionado o el término de búsqueda
            const producto = productoSeleccionado || busquedaProducto;
            if (!producto) {
                throw new Error('Por favor ingrese un nombre de producto o seleccione uno de la lista');
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
                    gramajeMin: gramajeMin || null,
                    gramajeMax: gramajeMax || null
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error en la petición al servidor');
            }

            const result = await response.json();
            if (result.success) {
                mostrarNotificacion('Regla especial agregada correctamente', 'success', 3000);
                anuncio.style.display = 'none';
                document.querySelector('.overlay').style.display = 'none';
                await initializePreciosPro();
            } else {
                throw new Error(result.error || 'Error al guardar la regla');
            }
        } catch (error) {
            console.error('Error:', error);
            alert(error.message);
        } finally {
            ocultarCarga();
        }
    });
}
function mostrarAnuncioEliminar(producto, index) {
    const anuncio = document.querySelector('.anuncio');
    const anuncioContenido = anuncio.querySelector('.anuncio-contenido');
    
    anuncioContenido.innerHTML = `
        <i class="fas fa-exclamation-triangle"></i>
        <h2>¿Eliminar regla?</h2>
        <div class="detalles-grup center">
            <p>¿Está seguro de eliminar la regla de: "${producto}"?</p>
            <p>Esta acción no se puede deshacer</p>
        </div>
        <div class="anuncio-botones">
            <button class="anuncio-btn close cancelar"><i class="fas fa-times"></i></button>
            <button class="anuncio-btn red confirmar">Eliminar</button>
        </div>
    `;

    anuncio.style.display = 'flex';

    // Add event listeners for buttons
    anuncio.querySelector('.cancelar').addEventListener('click', () => {
        anuncio.style.display = 'none';
    });

    anuncio.querySelector('.confirmar').addEventListener('click', async () => {
        await eliminarRegla(producto, index);
        anuncio.style.display = 'none';
    });
}