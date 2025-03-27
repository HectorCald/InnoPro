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
                            <i class="fas fa-save"></i> Guardar Cambios
                        </button>
                        <button id="agregar-regla" class="btn-guardar">
                            <i class="fas fa-plus"></i> Agregar regla
                        </button>
                    </div>
                </div>

                <div class="reglas-section">
                    <h3>Reglas Especiales</h3>
                    <div class="tabla-reglas">
                        <table>
                            <thead>
                                <tr>
                                    <th>Producto</th>
                                    <th>Reglas Activas</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${reglas.map(regla => {
                                    const reglasActivas = [];
                                    if (regla.etiquetado !== '1') reglasActivas.push('Etiquetado');
                                    if (regla.sellado !== '1') reglasActivas.push('Sellado');
                                    if (regla.envasado !== '1') reglasActivas.push('Envasado');
                                    if (regla.cernido !== '1') reglasActivas.push('Cernido');
                                    if (regla.gramajeMin && regla.gramajeMax) reglasActivas.push('Gramaje');
                                    
                                    return `
                                    <tr>
                                        <td>
                                            <button class="btn-ver-detalles" data-producto="${regla.producto}">
                                                ${regla.producto}
                                            </button>
                                        </td>
                                        <td>${reglasActivas.join(', ') || 'Sin reglas'}</td>
                                        <td>
                                            <button class="btn-eliminar" data-producto="${regla.producto}">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        </td>
                                    </tr>
                                `}).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;

        // Add event listeners
        document.getElementById('guardar-precios').addEventListener('click', guardarPreciosBase);
        document.getElementById('agregar-regla').addEventListener('click', mostrarFormularioRegla);
        
        // Add event listeners for delete buttons
        document.querySelectorAll('.btn-eliminar').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const producto = e.currentTarget.dataset.producto;
                if (confirm(`¿Está seguro de eliminar la regla para ${producto}?`)) {
                    await eliminarRegla(producto);
                }
            });
        });

        // Add event listeners for detail buttons
        document.querySelectorAll('.btn-ver-detalles').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const producto = e.currentTarget.dataset.producto;
                const regla = reglas.find(r => r.producto === producto);
                mostrarDetallesRegla(regla);
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
        <div class="detalles-regla">
            <div class="detalle-grupo">
                <label>Producto:</label>
                <span>${regla.producto}</span>
            </div>
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
        <div class="anuncio-botones">
            <button class="anuncio-btn cancelar">Cerrar</button>
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

// Add this new function for deleting rules
async function eliminarRegla(producto) {
    try {
        mostrarCarga();
        const response = await fetch('/eliminar-regla-especial', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ producto })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error en la petición al servidor');
        }

        const result = await response.json();
        if (result.success) {
            mostrarNotificacion('Regla eliminada correctamente', 'success', 3000);
            // Reload the page to refresh the rules
            window.location.reload();
        } else {
            throw new Error(result.error || 'Error al eliminar la regla');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al eliminar la regla: ' + error.message);
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
            <div id="rango-gramaje-container">
                <label>Rango de gramaje (opcional):</label>
                <div class="rango-inputs">
                    <input type="number" id="gramaje-min" placeholder="Mínimo" min="0">
                    <span>a</span>
                    <input type="number" id="gramaje-max" placeholder="Máximo" min="0">
                </div>
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
            if (parseInt(gramajeMin.value) >= parseInt(gramajeMax.value)) {
                gramajeMin.value = parseInt(gramajeMax.value) - 1;
            }
        }
    });

    gramajeMax.addEventListener('input', () => {
        if (gramajeMin.value && gramajeMax.value) {
            if (parseInt(gramajeMax.value) <= parseInt(gramajeMin.value)) {
                gramajeMax.value = parseInt(gramajeMin.value) + 1;
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
            const producto = document.getElementById('producto-select').value;
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

            if ((gramajeMin && !gramajeMax) || (!gramajeMin && gramajeMax)) {
                throw new Error('Si especifica un rango de gramaje, debe completar ambos valores');
            }

            if (gramajeMin && gramajeMax && parseInt(gramajeMin) >= parseInt(gramajeMax)) {
                throw new Error('El gramaje mínimo debe ser menor que el máximo');
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