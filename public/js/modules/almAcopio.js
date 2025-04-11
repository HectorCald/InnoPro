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
                       <i class="fas fa-arrow-circle-up"></i>
                    </button>
                    <p>Ingresos</p>
                </div>
                <div class="cuadro-btn"><button class="btn-agregar-pedido">
                       <i class="fas fa-arrow-circle-down"></i>
                    </button>
                    <p>Salidas</p>
                </div>
            </div>    
            <div class="lista-productos"></div>
        </div>
    `;
    const btnAgregarAcopio = container.querySelector('.btn-agregar-pedido i.fa-plus-circle').parentElement;
    btnAgregarAcopio.onclick = () => mostrarFormularioAgregarAcopio('');

    const btnAgregarTarea = container.querySelector('.btn-agregar-pedido i.fa-tasks').parentElement;
    btnAgregarTarea.onclick = () => mostrarFormularioAgregarTarea('');

    const btnIngresos = container.querySelector('.btn-agregar-pedido i.fa-arrow-circle-up').parentElement;
    btnIngresos.onclick = () => mostrarFormularioIngresoAcopio('');

    const btnSalidas = container.querySelector('.btn-agregar-pedido i.fa-arrow-circle-down').parentElement;
    btnSalidas.onclick = () => mostrarFormularioSalidaAcopio();


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
                    <button class="filter-btn" data-view="both" title="Mostrar ambos">
                        <i class="fas fa-boxes"></i>
                    </button>
                    <button class="filter-btn" data-view="bruto" title="Solo Bruto">
                        <i class="fas fa-cubes"></i>
                    </button>
                    <button class="filter-btn" data-view="prima" title="Solo Prima">
                        <i class="fas fa-box"></i>
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
    let currentView = 'both';
    let currentSort = 'all';

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (button.dataset.filter) {
                // Manejo de ordenamiento
                currentSort = button.dataset.filter;
                filterButtons.forEach(btn => {
                    if (btn.dataset.filter) btn.classList.remove('active');
                });
            } else if (button.dataset.view) {
                // Manejo de vista (bruto/prima)
                currentView = button.dataset.view;
                filterButtons.forEach(btn => {
                    if (btn.dataset.view) btn.classList.remove('active');
                });
            }
            button.classList.add('active');

            const products = Array.from(document.querySelectorAll('.product-card'));

            // Aplicar filtros de vista
            products.forEach(product => {
                const brutoPeso = product.querySelector('.estado-bruto');
                const primaPeso = product.querySelector('.estado-prima');

                switch (currentView) {
                    case 'bruto':
                        if (brutoPeso) brutoPeso.style.display = 'block';
                        if (primaPeso) primaPeso.style.display = 'none';
                        break;
                    case 'prima':
                        if (brutoPeso) brutoPeso.style.display = 'none';
                        if (primaPeso) primaPeso.style.display = 'block';
                        break;
                    default: // 'both'
                        if (brutoPeso) brutoPeso.style.display = 'block';
                        if (primaPeso) primaPeso.style.display = 'block';
                        break;
                }
            });

            // Ordenar productos
            products.sort((a, b) => {
                const getRelevantValue = (card) => {
                    let value;
                    if (currentView === 'prima') {
                        value = card.querySelector('.estado-prima').textContent;
                    } else {
                        value = card.querySelector('.estado-bruto').textContent;
                    }
                    return parseFloat(value) || 0;
                };

                const valueA = getRelevantValue(a);
                const valueB = getRelevantValue(b);

                return currentSort === 'all' ? valueB - valueA : valueA - valueB;
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
                        <div class="registro-estado-acopio estado-bruto">${totalBruto.toFixed(1)}</div>
                        <div class="registro-estado-acopio estado-prima">${totalPrima.toFixed(1)}</div>
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
window.editarProductoAcopio = function (producto) {
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
                                <i class="fas fa-trash delete delete-entry" data-type="bruto"></i>
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
                                <i class="fas fa-trash delete delete-entry" data-type="prima"></i>
                            </div>
                        </div>`;
    }).join('') : ''}
            </div>
        </div>
    `;
    document.querySelectorAll('.delete-entry').forEach(deleteBtn => {
        deleteBtn.addEventListener('click', function () {
            this.closest('.entrada-peso').remove();
        });
    });
    detallesGrup.style.display = 'none';
    detallesEdicion.style.display = 'flex';
    btnEditar.style.display = 'none';
    btnGuardar.style.display = 'inline-block';
    tituloModal.innerHTML = '<i class="fas fa-edit"></i> Editar Información';

    setupEntryHandlers();
    setupGuardarHandler(id);
};



function mostrarConfirmacionEliminar(id, nombre) {
    const anuncio = document.querySelector('.anuncio');
    const contenido = anuncio.querySelector('.anuncio-contenido');

    contenido.innerHTML = `
        <h2><i class="fas fa-exclamation-triangle"></i> Confirmar Eliminación</h2>
        <div class="relleno">
        <div class="detalles-grup center">
            <p>¿Está seguro que desea eliminar el producto "${nombre}"?</p>
            <p>Esta acción no se puede deshacer.</p>
        </div>
        </div>
        <div class="anuncio-botones">
            <button class="anuncio-btn red confirmar-eliminar">Eliminar</button>
            <button class="anuncio-btn close cancelar"><i class="fas fa-times"></i></button>
        </div>
    `;

    anuncio.style.display = 'flex';

    contenido.querySelector('.confirmar-eliminar').onclick = async () => {
        try {
            mostrarCarga();
            const response = await fetch('/eliminar-producto-acopio', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ id })
            });

            if (!response.ok) throw new Error('Error al eliminar el producto');

            mostrarNotificacion('Producto eliminado correctamente', 'success');
            anuncio.style.display = 'none';
            setTimeout(() => cargarAlmacenBruto(), 500);
        } catch (error) {
            console.error('Error:', error);
            mostrarNotificacion('Error al eliminar el producto', 'error');
        } finally {
            ocultarCarga();
        }
    };

    contenido.querySelector('.cancelar').onclick = () => {
        anuncio.style.display = 'none';
    };
}
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
function mostrarFormularioAgregarAcopio() {
    const anuncio = document.querySelector('.anuncio');
    const contenido = anuncio.querySelector('.anuncio-contenido');

    contenido.innerHTML = `
        <h2><i class="fas fa-plus-circle"></i> Nuevo Producto</h2>
        <div class="relleno">
            <p>Información General:</p>
            <div class="campo-form">
                <label>Nombre del Producto:</label>
                <input type="text" id="nuevoNombre" class="edit-input" placeholder="Nombre del producto" required>
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
                <div id="materiaBrutaEntries"></div>
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
                <div id="materiaPrimaEntries"></div>
            </div>
        </div>
        <div class="anuncio-botones">
            <button class="anuncio-btn green guardar"><i class="fas fa-save"></i> Guardar</button>
            <button class="anuncio-btn close cancelar"><i class="fas fa-times"></i></button>
        </div>
    `;

    anuncio.style.display = 'flex';

    setupEntryHandlers();

    anuncio.querySelector('.cancelar').onclick = () => {
        anuncio.style.display = 'none';
    };

    anuncio.querySelector('.guardar').onclick = async () => {
        try {
            mostrarCarga();

            // Recolectar datos de materia bruta
            const pesoBrutoInputs = Array.from(document.querySelectorAll('[id^="editPesoBruto_"]'));
            const loteBrutoInputs = Array.from(document.querySelectorAll('[id^="editLoteBruto_"]'));
            const pesoBrutoLote = pesoBrutoInputs.map((input, index) => {
                if (!input.value || !loteBrutoInputs[index].value) return null;
                return `${input.value.replace(',', '.')}-${loteBrutoInputs[index].value}`;
            }).filter(item => item !== null).join(';');

            // Recolectar datos de materia prima
            const pesoPrimaInputs = Array.from(document.querySelectorAll('[id^="editPesoPrima_"]'));
            const lotePrimaInputs = Array.from(document.querySelectorAll('[id^="editLotePrima_"]'));
            const pesoPrimaLote = pesoPrimaInputs.map((input, index) => {
                if (!input.value || !lotePrimaInputs[index].value) return null;
                return `${input.value.replace(',', '.')}-${lotePrimaInputs[index].value}`;
            }).filter(item => item !== null).join(';');

            const nuevoProducto = {
                nombre: document.getElementById('nuevoNombre').value,
                pesoBrutoLote,
                pesoPrimaLote
            };

            const response = await fetch('/agregar-producto-acopio', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(nuevoProducto)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.success) {
                mostrarNotificacion('Producto agregado correctamente', 'success');
                anuncio.style.display = 'none';
                setTimeout(() => cargarAlmacenBruto(), 500);
            } else {
                throw new Error(data.error || 'Error al agregar el producto');
            }
        } catch (error) {
            console.error('Error:', error);
            mostrarNotificacion(`Error al agregar el producto: ${error.message}`, 'error');
        } finally {
            ocultarCarga();
        }
    };
}




function mostrarFormularioAgregarTarea() {
    const anuncio = document.querySelector('.anuncio');
    const contenido = anuncio.querySelector('.anuncio-contenido');


    contenido.innerHTML = `
        <h2><i class="fas fa-tasks"></i> Gestión de Tareas</h2>
        <div class="relleno">
            <div class="campo-form">
                <label>Nueva Tarea:</label>
                <div class="detalle-item">
                    <input type="text" id="nombreTarea" class="edit-input" placeholder="Nombre de la tarea">
                    <small id="tareaDisponible" style="display: none;"></small>
                </div>
            </div>
            <div id="listaTareas" class="campo-form" style="display: none;">
                <!-- Aquí se cargarán las tareas existentes -->
            </div>
        </div>
        <div class="anuncio-botones">
            <button class="anuncio-btn blue ver-tareas"><i class="fas fa-eye"></i> Ver Tareas</button>
            <button class="anuncio-btn green agregar"><i class="fas fa-plus"></i> Agregar</button>
            <button class="anuncio-btn close cancelar"><i class="fas fa-times"></i></button>
        </div>
    `;

    anuncio.style.display = 'flex';

    const inputTarea = document.getElementById('nombreTarea');
    const mensajeDisponible = document.getElementById('tareaDisponible');
    const btnVerTareas = contenido.querySelector('.ver-tareas');
    const btnAgregar = contenido.querySelector('.agregar');
    const btnCancelar = contenido.querySelector('.cancelar');
    const listaTareas = document.getElementById('listaTareas');
    let tareasVisible = false;
    let timeoutId = null;

    inputTarea.addEventListener('input', async () => {
        const nombre = inputTarea.value.trim();
        mensajeDisponible.style.display = nombre ? 'block' : 'none';

        // Limpiar el timeout anterior si existe
        if (timeoutId) clearTimeout(timeoutId);

        if (nombre) {
            // Mostrar indicador de carga mientras se verifica
            mensajeDisponible.innerHTML = '<i class="fas fa-spinner fa-spin" style="color: #666; font-size: 1.2em; border:none;"></i>';

            // Esperar 300ms después de que el usuario deje de escribir
            timeoutId = setTimeout(async () => {
                const nombreNormalizado = nombre.toLowerCase()
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .trim();

                const response = await fetch('/verificar-tarea', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        nombre: nombre,
                        nombreNormalizado: nombreNormalizado
                    })
                });
                const data = await response.json();

                if (data.disponible) {
                    mensajeDisponible.innerHTML = '<i class="fas fa-check-circle" style="color: #28a745; font-size: 1.2em; border:none;"></i>';
                } else {
                    mensajeDisponible.innerHTML = '<i class="fas fa-times-circle" style="color: #dc3545; font-size: 1.2em; border:none;"></i>';
                }
            }, 300);
        }
    });
    btnVerTareas.onclick = async () => {
        if (!tareasVisible) {
            await cargarTareas();
            listaTareas.style.display = 'block';
            btnVerTareas.innerHTML = '<i class="fas fa-eye-slash"></i> Ocultar Tareas';
        } else {
            listaTareas.style.display = 'none';
            btnVerTareas.innerHTML = '<i class="fas fa-eye"></i> Ver Tareas';
        }
        tareasVisible = !tareasVisible;
    };

    btnAgregar.onclick = agregarNuevaTarea;
    btnCancelar.onclick = () => anuncio.style.display = 'none';
}
async function cargarTareas() {
    const container = document.getElementById('listaTareas');
    try {
        mostrarCarga();
        const response = await fetch('/obtener-tareas');
        const data = await response.json();

        container.innerHTML = data.tareas.map(tarea => `
            <div class="detalle-item" style="padding-bottom:10px">
                <span style="text-align:left">${tarea.nombre}</span>
                <i class="fas fa-trash delete" onclick="eliminarTarea('${tarea.id}')"></i>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error al cargar las tareas', 'error');
    } finally {
        ocultarCarga();
    }
}
async function agregarNuevaTarea() {
    const nombre = document.getElementById('nombreTarea').value.trim();
    if (!nombre) {
        mostrarNotificacion('Ingrese un nombre para la tarea', 'error');
        return;
    }

    try {
        mostrarCarga();
        const response = await fetch('/agregar-tarea', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre })
        });

        const data = await response.json();
        if (data.success) {
            mostrarNotificacion('Tarea agregada correctamente', 'success');
            document.getElementById('nombreTarea').value = '';
            cargarTareas();
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error al agregar la tarea', 'error');
    } finally {
        ocultarCarga();
    }
}
window.eliminarTarea = async (id) => {
    try {
        mostrarCarga();
        const response = await fetch('/eliminar-tarea', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });

        const data = await response.json();
        if (data.success) {
            mostrarNotificacion('Tarea eliminada correctamente', 'success');
            cargarTareas();
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error al eliminar la tarea', 'error');
    } finally {
        ocultarCarga();
    }
};



export function mostrarFormularioIngresoAcopio(productoSeleccionado = '') {
    const anuncio = document.querySelector('.anuncio');
    const anuncioContenido = anuncio.querySelector('.anuncio-contenido');

    anuncioContenido.innerHTML = `
        <h2><i class="fas fa-arrow-circle-up"></i> Nuevo Ingreso</h2>
        <div class="relleno">
            <div class="campo-form">
                <label>Producto:</label>
                <select id="productoIngreso" class="edit-input" required>
                    <option value="">Seleccione un producto</option>
                    ${window.productosAlmacen?.map(producto =>
        `<option value="${producto[1]}" ${productoSeleccionado === producto[1] ? 'selected' : ''}>${producto[1]}</option>`
    ).join('') || ''}
                </select>
            </div>
            <div class="campo-form">
                <label>Tipo:</label>
                <select id="tipoIngreso" class="edit-input" required>
                    <option value="bruto">Materia Bruta</option>
                    <option value="prima">Materia Prima</option>
                </select>
            </div>
            <div class="campo-form">
                <label>Peso (kg):</label>
                <input type="number" step="0.1" id="pesoIngreso" class="edit-input" required>
            </div>
            <div class="campo-form">
                <label>Lote:</label>
                <input type="text" id="loteIngreso" class="edit-input" readonly>
            </div>
            <div class="campo-form">
                <label>Razón:</label>
                <textarea id="razonIngreso" class="edit-input" required></textarea>
            </div>
        </div>
        <div class="anuncio-botones">
            <button class="anuncio-btn green procesar">
                <i class="fas fa-check"></i> Procesar Ingreso
            </button>
            <button class="anuncio-btn close cancelar">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;

    const productoSelect = document.getElementById('productoIngreso');
    const tipoSelect = document.getElementById('tipoIngreso');
    const loteInput = document.getElementById('loteIngreso');

    // Función para obtener el siguiente número de lote
    const getNextLote = () => {
        const producto = window.productosAlmacen?.find(p => p[1] === productoSelect.value);
        if (!producto) return '1';

        const columnaIndex = tipoSelect.value === 'bruto' ? 2 : 3;
        const lotesExistentes = (producto[columnaIndex] || '').split(';')
            .map(item => parseInt(item.split('-')[1]) || 0);

        return Math.max(0, ...lotesExistentes) + 1;
    };

    // Actualizar lote cuando cambie el producto o tipo
    const actualizarLote = () => {
        if (productoSelect.value && tipoSelect.value) {
            loteInput.value = getNextLote();
        }
    };

    productoSelect.addEventListener('change', actualizarLote);
    tipoSelect.addEventListener('change', actualizarLote);

    // Set initial lote if producto is preselected
    if (productoSeleccionado) {
        actualizarLote();
    }

    anuncio.style.display = 'flex';

    // Rest of your existing code...
    const btnProcesar = anuncioContenido.querySelector('.procesar');
    const btnCancelar = anuncioContenido.querySelector('.cancelar');

    btnProcesar.onclick = async () => {
        try {
            const producto = productoSelect.value;
            const tipo = tipoSelect.value;
            const peso = document.getElementById('pesoIngreso').value;
            const lote = loteInput.value;
            const razon = document.getElementById('razonIngreso').value;

            if (!producto || !tipo || !peso || !razon) {
                mostrarNotificacion('Por favor complete todos los campos', 'error');
                return;
            }

            mostrarCarga();

            // First process the ingreso
            const ingresoResponse = await fetch('/procesar-ingreso-acopio', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    producto,
                    tipo,
                    peso,
                    lote,
                    razon
                })
            });

            const ingresoData = await ingresoResponse.json();

            if (!ingresoData.success) {
                throw new Error(ingresoData.error || 'Error al procesar el ingreso');
            }

            // Then register the movement
            const movimientoResponse = await fetch('/registrar-movimiento-acopio', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tipo: 'Ingreso ' + tipo,
                    producto,
                    cantidad: peso,
                    operario: 'Sistema',
                    razon
                })
            });

            const movimientoData = await movimientoResponse.json();

            if (!movimientoData.success) {
                throw new Error('Error al registrar el movimiento');
            }

            mostrarNotificacion('Ingreso procesado correctamente', 'success');
            anuncio.style.display = 'none';
            cargarAlmacenBruto();
        } catch (error) {
            console.error('Error:', error);
            mostrarNotificacion(error.message, 'error');
        } finally {
            ocultarCarga();
        }
    };

    btnCancelar.onclick = () => {
        anuncio.style.display = 'none';
    };
}

export async function mostrarFormularioSalidaAcopio() {
    const anuncio = document.querySelector('.anuncio');
    const contenido = anuncio.querySelector('.anuncio-contenido');

    contenido.innerHTML = `
        <h2><i class="fas fa-arrow-circle-down"></i> Nueva Salida</h2>
        <div class="relleno">
            <div class="campo-form">
                <label>Producto:</label>
                <select id="productoSalida" class="edit-input" required>
                    <option value="">Seleccione un producto</option>
                    ${window.productosAlmacen?.map(producto =>
        `<option value="${producto[1]}">${producto[1]}</option>`
    ).join('') || ''}
                </select>
            </div>
            <div class="campo-form">
                <label>Tipo:</label>
                <select id="tipoSalida" class="edit-input" required>
                    <option value="bruto">Materia Bruta</option>
                    <option value="prima">Materia Prima</option>
                </select>
            </div>
            <div class="campo-form">
                <label>Lote:</label>
                <select id="loteSalida" class="edit-input" required>
                    <option value="">Seleccione un lote</option>
                </select>
            </div>
            <div class="campo-form">
                <label>Peso (kg):</label>
                <input type="number" step="0.1" id="pesoSalida" class="edit-input" required>
            </div>
            <div class="campo-form">
                <label>Prooveder:</label>
                <input type="text" id="operarioSalida" class="edit-input" required>
            </div>
            <div class="campo-form">
                <label>Razón:</label>
                <textarea id="razonSalida" class="edit-input" required></textarea>
            </div>
        </div>
        <div class="anuncio-botones">
            <button class="anuncio-btn green procesar">Procesar Salida</button>
            <button class="anuncio-btn close cancelar"><i class="fas fa-times"></i></button>
        </div>
    `;

    // Manejar cambios en producto y tipo para actualizar lotes
    const productoSelect = document.getElementById('productoSalida');
    const tipoSelect = document.getElementById('tipoSalida');
    const loteSelect = document.getElementById('loteSalida');

    const actualizarLotes = () => {
        const producto = window.productosAlmacen?.find(p => p[1] === productoSelect.value);
        if (!producto) return;

        const columnaIndex = tipoSelect.value === 'bruto' ? 2 : 3;
        const pesosLotes = (producto[columnaIndex] || '').split(';');

        loteSelect.innerHTML = '<option value="">Seleccione un lote</option>' +
            pesosLotes
                .filter(item => {
                    const [peso] = item.split('-');
                    return parseFloat(peso) > 0;
                })
                .map(item => {
                    const [peso, lote] = item.split('-');
                    return `<option value="${lote}" data-peso="${peso}">Lote ${lote} (${peso} kg)</option>`;
                }).join('');
    };

    productoSelect.onchange = actualizarLotes;
    tipoSelect.onchange = actualizarLotes;

    anuncio.style.display = 'flex';

    contenido.querySelector('.cancelar').onclick = () => {
        anuncio.style.display = 'none';
    };

    contenido.querySelector('.procesar').onclick = async () => {
        try {
            const producto = document.getElementById('productoSalida').value;
            const tipo = document.getElementById('tipoSalida').value;
            const lote = document.getElementById('loteSalida').value;
            const peso = document.getElementById('pesoSalida').value;
            const operario = document.getElementById('operarioSalida').value;
            const razon = document.getElementById('razonSalida').value;

            if (!producto || !tipo || !lote || !peso || !operario || !razon) {
                mostrarNotificacion('Por favor complete todos los campos', 'warning');
                return;
            }

            mostrarCarga();

            // Registrar el movimiento
            await fetch('/registrar-movimiento-acopio', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tipo: 'Salida ' + tipo,
                    producto,
                    cantidad: peso,
                    operario,
                    razon
                })
            });

            // Procesar la salida
            const response = await fetch('/procesar-salida-acopio', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ producto, tipo, peso, lote })
            });

            const data = await response.json();
            if (data.success) {
                mostrarNotificacion('Salida procesada correctamente', 'success');
                anuncio.style.display = 'none';
                cargarAlmacenBruto();
                setTimeout(() => {
                    mostrarFormularioIngresoAcopio(producto);
                    // Pre-establecer tipo a "prima" y el peso
                    document.getElementById('tipoIngreso').value = 'prima';
                    document.getElementById('pesoIngreso').value = peso;
                }, 500);
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            mostrarNotificacion(error.message, 'error');
        } finally {
            ocultarCarga();
        }
    };
}



