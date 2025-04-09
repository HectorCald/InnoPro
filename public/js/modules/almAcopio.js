export function inicializarAlmacen() {
    const container = document.querySelector('.almAcopio-view');
    // Asegurarnos que el contenedor esté visible
    container.style.display = 'flex';

    container.innerHTML = `
        <div class="title">
            <h3><i class="fas fa-warehouse"></i> Gestión de Almacen</h3>
        </div>
        <div class="alamcenGral-container">
            <div class="almacen-botones">
                <div class="cuadro-btn"><button class="btn-agregar-pedido">
                        <i class="fas fa-boxes"></i>
                    </button>
                    <p>Prima</p>
                </div>
                <div class="cuadro-btn"><button class="btn-agregar-pedido">
                        <i class="fas fa-cubes"></i>
                    </button>
                    <p>Bruto</p>
                </div>
                <div class="cuadro-btn"><button class="btn-agregar-pedido">
                       <i class="fas fa-plus-circle"></i>
                    </button>
                    <p>Agregar</p>
                </div>
                <div class="cuadro-btn"><button class="btn-agregar-pedido">
                       <i class="fas fa-tasks"></i>
                    </button>
                    <p>Tarea</p>
                </div>
                <div class="cuadro-btn"><button class="btn-agregar-pedido">
                       <i class="fas fa-cogs"></i>
                    </button>
                    <p>Proceso</p>
                </div>
            </div>    
            <div class="lista-productos"></div>
        </div>
    `;


    mostrarProductosBruto();
}
export function mostrarProductosBruto() {
    const container = document.querySelector('.lista-productos');
    container.style.display = 'flex';

    container.innerHTML = `
        <div class="almacen-container">
            <div class="almacen-header">
                <div class="search-bar">
                    <input type="text" id="searchProductAcopio" placeholder="Buscar producto...">
                    <i class="fas fa-search search-icon"></i>
                </div>
                <div class="filter-options">
                    <button class="filter-btn" data-filter="all">
                        <i class="fas fa-sort-amount-down"></i>
                    </button>
                    <button class="filter-btn giro" data-filter="low">
                        <i class="fas fa-sort-amount-up"></i>
                    </button>
                </div>
            </div>
            <div class="products-grid" id="productsContainer">
            </div>
        </div>
    `;

    // Call cargarAlmacen after creating the container
    cargarAlmacenBruto();

    function normalizarTexto(texto) {
        return texto.toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Elimina tildes
            .replace(/\s+/g, ' ')            // Reduce espacios múltiples a uno
            .trim();                         // Elimina espacios al inicio y final
    }

    const searchInput = document.getElementById('searchProductAcopio');
    const searchIcon = document.querySelector('.search-icon');

    searchInput.addEventListener('input', (e) => {
        const searchTerm = normalizarTexto(e.target.value);
        const products = document.querySelectorAll('.product-card');

        // Change icon based on input value
        if (e.target.value.length > 0) {
            searchIcon.classList.remove('fa-search');
            searchIcon.classList.add('fa-times');
        } else {
            searchIcon.classList.remove('fa-times');
            searchIcon.classList.add('fa-search');
        }

        products.forEach(product => {
            const productName = normalizarTexto(product.querySelector('.product-name span').textContent);
            product.style.display = productName.includes(searchTerm) ? 'grid' : 'none';
        });
    });

    // Add click event for the search icon
    searchIcon.addEventListener('click', () => {
        if (searchInput.value.length > 0) {
            searchInput.value = '';
            searchIcon.classList.remove('fa-times');
            searchIcon.classList.add('fa-search');
            // Show all products
            document.querySelectorAll('.product-card').forEach(product => {
                product.style.display = 'grid';
            });
        }
    });

    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const filter = button.dataset.filter;
            const products = Array.from(document.querySelectorAll('.product-card'));

            products.sort((a, b) => {
                // Extraer solo los números usando una expresión regular más robusta
                const stockA = parseInt(a.querySelector('.product-quantity').textContent.trim().match(/\d+/) || [0]);
                const stockB = parseInt(b.querySelector('.product-quantity').textContent.trim().match(/\d+/) || [0]);

                // Si no hay número, tratarlo como 0
                const numA = isNaN(stockA) ? 0 : stockA;
                const numB = isNaN(stockB) ? 0 : stockB;

                if (filter === 'all') {
                    return numB - numA; // Mayor a menor
                } else {
                    return numA - numB; // Menor a mayor
                }
            });

            const container = document.getElementById('productsContainer');
            container.innerHTML = '';
            products.forEach(product => container.appendChild(product));
        });
    });
};
export async function cargarAlmacenBruto() {
    try {
        mostrarCarga();
        const response = await fetch('/obtener-almacen-acopio');

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Error al cargar los productos');
        }

        const productsContainer = document.getElementById('productsContainer');
        if (!productsContainer) {
            throw new Error('Container not found');
        }

        window.productosAlmacen = data.pedidos;
        productsContainer.innerHTML = '';

        // Check if we have products
        if (!data.pedidos || data.pedidos.length === 0) {
            productsContainer.innerHTML = '<div class="no-products">No hay productos disponibles</div>';
            return;
        }

        data.pedidos.forEach(producto => {
            if (!producto) return;

            const [id, nombre, pesoBrutoLote, pesoPrimaLote] = producto;

            // Safe handling of weight calculations
            const pesosBrutos = (pesoBrutoLote || '').split(';')
                .map(item => (item || '').split('-')[0])
                .filter(peso => peso);

            const pesosPrima = (pesoPrimaLote || '').split(';')
                .map(item => (item || '').split('-')[0])
                .filter(peso => peso);

            const totalBruto = pesosBrutos.reduce((sum, peso) => {
                const value = parseFloat(peso.replace(',', '.'));
                return sum + (isNaN(value) ? 0 : value);
            }, 0);

            const totalPrima = pesosPrima.reduce((sum, peso) => {
                const value = parseFloat(peso.replace(',', '.'));
                return sum + (isNaN(value) ? 0 : value);
            }, 0);

            let stockClass = '';
            if (totalBruto < 100) {
                stockClass = 'low-stock';
            } else if (totalBruto >= 100 && totalBruto < 300) {
                stockClass = 'medium-stock';
            } else {
                stockClass = 'high-stock';
            }

            const productCard = document.createElement('div');
            productCard.className = `product-card ${stockClass}`;
            productCard.onclick = () => mostrarDetalleProductoAcopio(producto);
            productCard.innerHTML = `
                <div class="product-info">
                    <div class="product-name">
                        <i class="fas fa-box"></i>
                        <span>${nombre || 'Sin nombre'}</span>
                    </div>   
                    <div class="product-quantity">
                        <div class="registro-estado-acopio estado-bruto">${totalBruto.toFixed(1)} kg</div>
                        <div class="registro-estado-acopio estado-prima">${totalPrima.toFixed(1)} kg</div>
                    </div>
                </div>
            `;
            productsContainer.appendChild(productCard);
        });

    } catch (error) {
        console.error('Error detallado:', error);
        mostrarNotificacion(`Error al cargar los productos: ${error.message}`, 'error');
    } finally {
        ocultarCarga();
        scrollToTop('.almacen-view');
    }
}
window.mostrarDetalleProductoAcopio = function (producto) {
    const [id, nombre, pesoBrutoLote, pesoPrimaLote] = producto;
    const anuncio = document.querySelector('.anuncio');
    const contenido = anuncio.querySelector('.anuncio-contenido');

    function formatearPesoLote(pesoLoteStr) {
        if (!pesoLoteStr) return '<div class="detalle-item"><span>No registrado</span></div>';

        return pesoLoteStr.split(';').map(item => {
            const [peso, lote] = item.split('-');
            return `<div class="detalle-item">
                <p>Peso: ${peso} kg</p>
                <span>Lote: ${lote}</span>
            </div>`;
        }).join('');
    }

    contenido.innerHTML = `
        <h2 class="titulo-modal"><i class="fas fa-info-circle"></i> Información</h2>
        <div class="relleno">
            <div class="producto-detalles">
                <div class="detalle-seccion">
                    <p>Información General:</p>               
                    <div class="detalles-grup">
                        <div class="detalle-item">
                            <p>Nombre:</p> <span>${nombre}</span>
                        </div>
                    </div>
                    <p>Materia Bruta:</p>  
                    <div class="detalles-grup">
                        ${formatearPesoLote(pesoBrutoLote)}
                    </div>
                    <p>Materia Prima:</p>  
                    <div class="detalles-grup">
                        ${formatearPesoLote(pesoPrimaLote)}
                    </div>
                </div>
                <div class="detalles-edicion relleno" style="display:none"></div>
            </div>
        </div>
        <div class="anuncio-botones">
            <button class="anuncio-btn blue editar">Editar</button>
            <button class="anuncio-btn green guardar" style="display: none;">Guardar</button>
            <button class="anuncio-btn red eliminar">Eliminar</button>
            <button class="anuncio-btn close cancelar"><i class="fas fa-times"></i></button>
        </div>
    `;

    anuncio.style.display = 'flex';

    const btnEditar = contenido.querySelector('.editar');
    const btnGuardar = contenido.querySelector('.guardar');

    anuncio.querySelector('.cancelar').onclick = () => {
        anuncio.style.display = 'none';
    };

    anuncio.querySelector('.eliminar').onclick = () => {
        mostrarConfirmacionEliminar(id, nombre);
    };

    btnEditar.onclick = () => {
        editarProductoAcopio(producto);
    };
};
window.editarProductoAcopio = function(producto) {
    const [id, nombre, pesoBrutoLote, pesoPrimaLote] = producto;
    const anuncio = document.querySelector('.anuncio');
    const contenido = anuncio.querySelector('.anuncio-contenido');
    const detallesEdicion = contenido.querySelector('.detalles-edicion');
    const btnEditar = contenido.querySelector('.editar');
    const btnGuardar = contenido.querySelector('.guardar');
    const tituloModal = contenido.querySelector('.titulo-modal');
    const detallesGrup = contenido.querySelector('.detalle-seccion');

    detallesEdicion.innerHTML = `
        <p>Información General:</p> 
        <div class="campo-form">
            <label>Nombre:</label>
            <input type="text" id="editNombre" value="${nombre}" class="edit-input">
        </div>
        <div class="form-grup">
            <p>Materia Bruta:</p>
            <div class="form-grup">
                <div class="detalle-item">
                    <input type="number" step="0.01" id="nuevoPesoBruto" class="edit-input" placeholder="Peso (kg)">
                    <input type="number" id="nuevoLoteBruto" class="edit-input" placeholder="Lote">
                    <i class="fas fa-plus-circle add add-peso-bruto"></i>
                </div>
            </div>
            <div id="materiaBrutaEntries">
                ${pesoBrutoLote ? pesoBrutoLote.split(';').map((item, index) => {
                    const [peso, lote] = item.split('-').map(val => val.trim());
                    const pesoFormateado = peso.replace(',', '.');
                    return `
                        <div class="campo-form entrada-peso" data-index="${index}">
                            <div class="detalle-item">
                                <input type="number" step="0.01" id="editPesoBruto_${index}" value="${pesoFormateado}" class="edit-input" placeholder="Peso">
                                <input type="number" id="editLoteBruto_${index}" value="${lote}" class="edit-input" placeholder="Lote">
                                <i class="fas fa-trash delete delete-entry" onclick="eliminarEntrada(this, 'bruto')"></i>
                            </div>
                        </div>`;
                }).join('') : ''}
            </div>
        </div>
        <div class="form-grup">
            <p>Materia Prima:</p>
            <div class="form-grup">
                <div class="detalle-item">
                    <input type="number" step="0.01" id="nuevoPesoPrima" class="edit-input" placeholder="Peso (kg)">
                    <input type="number" id="nuevoLotePrima" class="edit-input" placeholder="Lote">
                    <i class="fas fa-plus-circle add add-peso-prima"></i>
                </div>
            </div>
            <div id="materiaPrimaEntries">
                ${pesoPrimaLote ? pesoPrimaLote.split(';').map((item, index) => {
                    const [peso, lote] = item.split('-').map(val => val.trim());
                    const pesoFormateado = peso.replace(',', '.');
                    return `
                        <div class="campo-form entrada-peso" data-index="${index}">
                            <div class="detalle-item">
                                <input type="number" step="0.01" id="editPesoPrima_${index}" value="${pesoFormateado}" class="edit-input" placeholder="Peso">
                                <input type="number" id="editLotePrima_${index}" value="${lote}" class="edit-input" placeholder="Lote">
                                <i class="fas fa-trash delete delete-entry" onclick="eliminarEntrada(this, 'prima')"></i>
                            </div>
                        </div>`;
                }).join('') : ''}
            </div>
        </div>
    `;

    detallesGrup.style.display = 'none';
    detallesEdicion.style.display = 'flex';
    btnEditar.style.display = 'none';
    btnGuardar.style.display = 'inline-block';
    tituloModal.innerHTML = '<i class="fas fa-edit"></i> Editar Información';

    setupEntryHandlers();
    setupGuardarHandler(id);
};
function setupEntryHandlers() {
    document.querySelector('.add-peso-bruto').addEventListener('click', () => {
        const peso = document.getElementById('nuevoPesoBruto').value;
        const lote = document.getElementById('nuevoLoteBruto').value;
        
        if (!peso || !lote) {
            mostrarNotificacion('Por favor ingrese peso y lote', 'error');
            return;
        }

        const container = document.getElementById('materiaBrutaEntries');
        const nuevoIndex = container.querySelectorAll('.entrada-peso').length;

        container.insertAdjacentHTML('beforeend', `
            <div class="campo-form entrada-peso" data-index="${nuevoIndex}">
                <div class="detalle-item">
                    <input type="number" step="0.01" id="editPesoBruto_${nuevoIndex}" value="${peso}" class="edit-input" placeholder="Peso">
                    <input type="number" id="editLoteBruto_${nuevoIndex}" value="${lote}" class="edit-input" placeholder="Lote">
                    <i class="fas fa-trash delete delete-entry" onclick="this.closest('.entrada-peso').remove()"></i>
                </div>
            </div>
        `);

        // Limpiar campos
        document.getElementById('nuevoPesoBruto').value = '';
        document.getElementById('nuevoLoteBruto').value = '';
    });

    document.querySelector('.add-peso-prima').addEventListener('click', () => {
        const peso = document.getElementById('nuevoPesoPrima').value;
        const lote = document.getElementById('nuevoLotePrima').value;
        
        if (!peso || !lote) {
            mostrarNotificacion('Por favor ingrese peso y lote', 'error');
            return;
        }

        const container = document.getElementById('materiaPrimaEntries');
        const nuevoIndex = container.querySelectorAll('.entrada-peso').length;

        container.insertAdjacentHTML('beforeend', `
            <div class="campo-form entrada-peso" data-index="${nuevoIndex}">
                <div class="detalle-item">
                    <input type="number" step="0.01" id="editPesoPrima_${nuevoIndex}" value="${peso}" class="edit-input" placeholder="Peso">
                    <input type="number" id="editLotePrima_${nuevoIndex}" value="${lote}" class="edit-input" placeholder="Lote">
                    <i class="fas fa-trash delete delete-entry" onclick="this.closest('.entrada-peso').remove()"></i>
                </div>
            </div>
        `);

        // Limpiar campos
        document.getElementById('nuevoPesoPrima').value = '';
        document.getElementById('nuevoLotePrima').value = '';
    });
}
function setupGuardarHandler(id) {
    const btnGuardar = document.querySelector('.guardar');
    const anuncio = document.querySelector('.anuncio');
    const contenido = anuncio.querySelector('.anuncio-contenido');

    btnGuardar.onclick = async () => {
        try {
            mostrarCarga();

            // Recolectar datos brutos y prima (código existente)
            const pesoBrutoInputs = Array.from(contenido.querySelectorAll('[id^="editPesoBruto_"]'));
            const loteBrutoInputs = Array.from(contenido.querySelectorAll('[id^="editLoteBruto_"]'));
            const pesoBrutoLote = pesoBrutoInputs.map((input, index) => {
                if (!input.value || !loteBrutoInputs[index].value) return null;
                return `${input.value.replace(',', '.')}-${loteBrutoInputs[index].value}`;
            }).filter(item => item !== null).join(';');

            const pesoPrimaInputs = Array.from(contenido.querySelectorAll('[id^="editPesoPrima_"]'));
            const lotePrimaInputs = Array.from(contenido.querySelectorAll('[id^="editLotePrima_"]'));
            const pesoPrimaLote = pesoPrimaInputs.map((input, index) => {
                if (!input.value || !lotePrimaInputs[index].value) return null;
                return `${input.value.replace(',', '.')}-${lotePrimaInputs[index].value}`;
            }).filter(item => item !== null).join(';');

            const datosActualizados = {
                id,
                nombre: document.getElementById('editNombre').value,
                pesoBrutoLote,
                pesoPrimaLote
            };

            const response = await fetch('/actualizar-producto-acopio', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(datosActualizados)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.success) {
                mostrarNotificacion('Producto actualizado correctamente', 'success');
                anuncio.style.display = 'none';
                setTimeout(() => cargarAlmacenBruto(), 500);
            } else {
                throw new Error(data.error || 'Error al actualizar el producto');
            }
        } catch (error) {
            console.error('Error:', error);
            mostrarNotificacion(`Error al actualizar el producto: ${error.message}`, 'error');
        } finally {
            ocultarCarga();
        }
    };
}


