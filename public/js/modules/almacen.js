
export function inicializarAlmacenGral() {
    const container = document.querySelector('.almacen-view');
    container.innerHTML = `
        <div class="title">
            <h3><i class="fas fa-warehouse"></i> Gestión de Almacen</h3>
        </div>
        <div class="alamcenGral-container">
            <div class="almacen-botones">
                <div class="cuadro-btn"><button class="btn-agregar-pedido">
                        <i class="fas fa-plus"></i>
                    </button>
                    <p>Ingresar</p>
                </div>
                <div class="cuadro-btn"><button class="btn-agregar-pedido">
                        <i class="fas fa-plus-circle"></i> 
                    </button>
                    <p>Agregar</p>
                </div>
            </div>    
            <div class="lista-productos"></div>
        </div>
    `;
    
    const btnIngresar = container.querySelector('.btn-agregar-pedido i.fa-plus').parentElement;
    btnIngresar.onclick = () => mostrarFormularioIngreso('');
    
    const btnAgregar = container.querySelector('.btn-agregar-pedido i.fa-plus-circle').parentElement;
    btnAgregar.onclick = mostrarFormularioAgregarProducto;
    
    mostrarProductos();
}
export async function mostrarFormularioIngreso(producto) {
    try {
        mostrarCarga();
        const response = await fetch('/obtener-almacen-general');
        const data = await response.json();
        if (!data.success) {
            throw new Error('Error al cargar los productos');
        }
        window.productosAlmacen = data.pedidos;

        const anuncio = document.querySelector('.anuncio');
        const contenido = anuncio.querySelector('.anuncio-contenido');

        contenido.innerHTML = `
            <h2><i class="fas fa-plus"></i> Ingresar Stock</h2>
            <div class="producto-detalles">
                <div class="detalle-seccion">
                    <div class="form-grup">
                        <label>Buscar Producto:</label>
                        <div class="autocomplete-wrapper">
                            <input type="text" id="buscarProducto" class="edit-input" placeholder="Escriba para buscar...">
                            <p class="recomendacion">Selecciona un prodcuto:</p>
                            <div class="productos-sugeridos" style="display: none;">
                            <!-- Las sugerencias se mostrarán aquí -->
                            </div>
                        </div>
                    </div>
                    <div class="producto-seleccionado" style="display: none;">
                        <p><strong>Selección:</strong> <span id="nombreProductoSeleccionado"></span></p>
                        <input type="hidden" id="idProductoSeleccionado">
                    </div>
                    <div class="form-grup">
                        <label>Cantidad a Ingresar:</label>
                        <input type="number" id="cantidadIngreso" class="edit-input" min="1" placeholder="Cantidad">
                    </div>
                </div>
            </div>
            <div class="anuncio-botones">
                <button class="anuncio-btn green ingresar" disabled><i class="fas fa-plus-circle"></i> Ingresar Stock</button>
                <button class="anuncio-btn close cancelar"><i class="fas fa-times"></i></button>
            </div>
        `;

        anuncio.style.display = 'flex';

        const inputBuscar = contenido.querySelector('#buscarProducto');
        const sugerencias = contenido.querySelector('.productos-sugeridos');
        const btnIngresar = contenido.querySelector('.ingresar');
        const recomendacion = contenido.querySelector('.recomendacion');

        // Configurar el evento input antes de establecer el valor
        const handleInput = () => {
            const busqueda = inputBuscar.value.toLowerCase().trim();
            if (busqueda.length < 2) {
                sugerencias.style.display = 'none';
                return;
            }

            const productosFiltrados = window.productosAlmacen.filter(producto => 
                producto[1].toLowerCase().includes(busqueda)
            );

            if (productosFiltrados.length > 0) {
                sugerencias.innerHTML = productosFiltrados.map(producto => `
                    <div class="sugerencia-item" data-id="${producto[0]}" data-nombre="${producto[1]}" data-gramaje="${producto[2]}">
                        ${producto[1]} - ${producto[2]}gr
                    </div>
                `).join('');
                sugerencias.style.display = 'block';

                // Agregar eventos click a las sugerencias
                sugerencias.querySelectorAll('.sugerencia-item').forEach(item => {
                    item.addEventListener('click', () => {
                        const id = item.dataset.id;
                        const nombre = item.dataset.nombre;
                        const gramaje = item.dataset.gramaje;
                        document.getElementById('idProductoSeleccionado').value = id;
                        document.getElementById('nombreProductoSeleccionado').textContent = `${nombre} - ${gramaje}gr`;
                        document.querySelector('.producto-seleccionado').style.display = 'block';
                        inputBuscar.value = `${nombre} - ${gramaje}gr`;
                        sugerencias.style.display = 'none';
                        btnIngresar.disabled = false;
                        recomendacion.style.display = 'none';
                    });
                });
            } else {
                sugerencias.innerHTML = '<div class="no-resultados">No se encontraron productos</div>';
                sugerencias.style.display = 'block';
            }
        };

        inputBuscar.addEventListener('input', handleInput);

        // Si se proporciona un producto, prellenarlo y mostrar sugerencias
        if (producto) {
            inputBuscar.value = producto;
            // Esperar a que el DOM se actualice
            setTimeout(() => {
                handleInput();
                if (sugerencias.children.length > 0) {
                    sugerencias.style.display = 'block';
                }
            }, 100);
        }

        // Cerrar sugerencias al hacer clic fuera
        document.addEventListener('click', (e) => {
            if (!sugerencias.contains(e.target) && e.target !== inputBuscar) {
                sugerencias.style.display = 'none';
            }
        });

        anuncio.querySelector('.cancelar').onclick = () => {
            anuncio.style.display = 'none';
        };

        btnIngresar.onclick = async () => {
            try {
                const id = document.getElementById('idProductoSeleccionado').value;
                const cantidad = parseInt(document.getElementById('cantidadIngreso').value);

                if (!id || !cantidad || cantidad < 1) {
                    mostrarNotificacion('Por favor complete todos los campos correctamente', 'error');
                    return;
                }

                mostrarCarga();
                const response = await fetch('/ingresar-stock-almacen', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ id, cantidad })
                });

                const data = await response.json();
                if (data.success) {
                    mostrarNotificacion('Stock ingresado correctamente', 'success');
                    anuncio.style.display = 'none';
                    cargarAlmacen();
                } else {
                    throw new Error(data.error || 'Error al ingresar stock');
                }
            } catch (error) {
                console.error('Error:', error);
                mostrarNotificacion('Error al ingresar stock', 'error');
            } finally {
                ocultarCarga();
            }
        };
    } catch (error) {
        console.error('Error al mostrar formulario:', error);
        mostrarNotificacion('Error al cargar el formulario', 'error');
    }finally{
        ocultarCarga();
    }
}
export async function cargarAlmacen() {
    try {
        mostrarCarga();
        const response = await fetch('/obtener-almacen-general');
        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Error al cargar los productos');
        }

        const productsContainer = document.getElementById('productsContainer');
        window.productosAlmacen = data.pedidos;
        productsContainer.innerHTML = '';

        data.pedidos.forEach(producto => {
            const [id, nombre, gramaje, stock, cantidadTira, lista] = producto;

            let stockClass = '';
            if (stock < 100) {
                stockClass = 'low-stock';
            } else if (stock >= 100 && stock < 300) {
                stockClass = 'medium-stock';
            } else {
                stockClass = 'high-stock';
            }

            const productCard = document.createElement('div');
            productCard.className = `product-card ${stockClass}`;
            productCard.onclick = () => mostrarDetalleProductoGral(producto);
            productCard.innerHTML = `
                <div class="product-info">
                    <div class="product-name">
                        <i class="fas fa-box"></i>
                        <span>${nombre} ${gramaje} gr.</span>
                    </div>   
                    <div class="product-quantity">
                        ${stock} und.
                    </div>
                </div>
            `;

            productsContainer.appendChild(productCard);
        });

    } catch (error) {
        console.error('Error al cargar el almacén:', error);
        mostrarNotificacion('Error al cargar los productos', 'error');
    } finally {
        ocultarCarga();
    }
}
window.mostrarDetalleProductoGral = function (producto) {
    const [id, nombre, gramaje, stock, cantidadTira, lista] = producto;
    const anuncio = document.querySelector('.anuncio');
    const contenido = anuncio.querySelector('.anuncio-contenido');

    contenido.innerHTML = `
        <h2><i class="fas fa-box-open"></i> ${nombre}</h2>
        <div class="producto-detalles">
            <div class="detalle-seccion">
                <p>ID: ${id}</p>
                <div class="detalles-vista">
                    <p>Nombre: ${nombre}</p>
                    <p>Gramaje: ${gramaje} gr.</p>
                    <p>Stock: ${stock} unidades</p>
                    <p>Cantidad por Tira: ${cantidadTira}</p>
                    <p>Lista: ${lista}</p>
                </div>
                <div class="detalles-edicion" style="display: none;">
                    <div class="campo-form">
                        <label>Nombre:</label>
                        <input type="text" id="editNombre" value="${nombre}" class="edit-input">
                    </div>
                    <div class="campo-form">
                        <label>Gramaje:</label>
                        <input type="number" id="editGramaje" value="${gramaje}" class="edit-input">
                    </div>
                    <div class="campo-form">
                        <label>Stock:</label>
                        <input type="number" id="editStock" value="${stock}" class="edit-input">
                    </div>
                   <div class="campo-form">
                        <label>Cantidad por Tira:</label>
                        <input type="number" id="editCantidadTira" value="${cantidadTira}" class="edit-input">
                    </div>
                    <div class="campo-form">
                        <label>Lista:</label>
                        <input type="text" id="editLista" value="${lista}" class="edit-input">
                    </div>
                </div>
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
    
    const detallesVista = contenido.querySelector('.detalles-vista');
    const detallesEdicion = contenido.querySelector('.detalles-edicion');
    const btnEditar = contenido.querySelector('.editar');
    const btnGuardar = contenido.querySelector('.guardar');

    anuncio.querySelector('.cancelar').onclick = () => {
        anuncio.style.display = 'none';
    };

    anuncio.querySelector('.eliminar').onclick = () => {
        mostrarConfirmacionEliminar(id, nombre);
    };

    btnEditar.onclick = () => {
        detallesVista.style.display = 'none';
        detallesEdicion.style.display = 'block';
        btnEditar.style.display = 'none';
        btnGuardar.style.display = 'inline-block';
    };

    btnGuardar.onclick = async () => {
        try {
            mostrarCarga();
            const datosActualizados = {
                id,
                nombre: document.getElementById('editNombre').value,
                gramaje: document.getElementById('editGramaje').value,
                stock: document.getElementById('editStock').value,
                cantidadTira: document.getElementById('editCantidadTira').value,
                lista: document.getElementById('editLista').value
            };

            const response = await fetch('/actualizar-producto-almacen', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(datosActualizados)
            });

            const data = await response.json();
            if (data.success) {
                mostrarNotificacion('Producto actualizado correctamente', 'success');
                anuncio.style.display = 'none';
                cargarAlmacen();
            } else {
                throw new Error(data.error || 'Error al actualizar el producto');
            }
        } catch (error) {
            console.error('Error:', error);
            mostrarNotificacion('Error al actualizar el producto', 'error');
        } finally {
            ocultarCarga();
        }
    };
};
function mostrarFormularioAgregarProducto() {
    const anuncio = document.querySelector('.anuncio');
    const contenido = anuncio.querySelector('.anuncio-contenido');

    contenido.innerHTML = `
        <h2><i class="fas fa-plus-circle"></i> Nuevo Producto</h2>
        <div class="producto-detalles">
            <div class="detalle-seccion">
                <div class="campo-form">
                    <label>Nombre del Producto:</label>
                    <input type="text" id="nuevoNombre" class="edit-input" required>
                </div>
                <div class="campo-form">
                    <label>Gramaje:</label>
                    <input type="number" id="nuevoGramaje" class="edit-input" required>
                </div>
                <div class="campo-form">
                    <label>Stock Total:</label>
                    <input type="number" id="nuevoStock" class="edit-input" required>
                </div>
                <div class="campo-form">
                    <label>Cantidad por Tira:</label>
                    <input type="number" id="nuevoCantidadTira" class="edit-input" required>
                </div>
                <div class="campo-form">
                    <label>Lista:</label>
                    <input type="text" id="nuevoLista" class="edit-input" required>
                </div>
            </div>
        </div>
        <div class="anuncio-botones">
            <button class="anuncio-btn green guardar"><i class="fas fa-save"></i> Guardar</button>
            <button class="anuncio-btn close cancelar"><i class="fas fa-times"></i></button>
        </div>
    `;

    anuncio.style.display = 'flex';

    anuncio.querySelector('.cancelar').onclick = () => {
        anuncio.style.display = 'none';
    };

    anuncio.querySelector('.guardar').onclick = async () => {
        try {
            mostrarCarga();
            const nuevoProducto = {
                nombre: document.getElementById('nuevoNombre').value,
                gramaje: document.getElementById('nuevoGramaje').value,
                stock: document.getElementById('nuevoStock').value,
                cantidadTira: document.getElementById('nuevoCantidadTira').value,
                lista: document.getElementById('nuevoLista').value
            };

            const response = await fetch('/agregar-producto-almacen', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(nuevoProducto)
            });

            const data = await response.json();
            if (data.success) {
                mostrarNotificacion('Producto agregado correctamente', 'success');
                anuncio.style.display = 'none';
                cargarAlmacen();
            } else {
                throw new Error(data.error || 'Error al agregar el producto');
            }
        } catch (error) {
            console.error('Error:', error);
            mostrarNotificacion('Error al agregar el producto', 'error');
        } finally {
            ocultarCarga();
        }
    };
}
function mostrarConfirmacionEliminar(id, nombre) {
    const anuncio = document.querySelector('.anuncio');
    const contenido = anuncio.querySelector('.anuncio-contenido');

    contenido.innerHTML = `
        <h2><i class="fas fa-exclamation-triangle"></i> Confirmar Eliminación</h2>
        <div class="producto-detalles">
            <div class="detalle-seccion">
                <p>¿Está seguro que desea eliminar el producto "${nombre}"?</p>
                <p>Esta acción no se puede deshacer.</p>
            </div>
        </div>
        <div class="anuncio-botones">
            <button class="anuncio-btn red confirmar">Confirmar</button>
            <button class="anuncio-btn gray cancelar">Cancelar</button>
        </div>
    `;

    anuncio.querySelector('.cancelar').onclick = () => {
        anuncio.style.display = 'none';
    };

    anuncio.querySelector('.confirmar').onclick = async () => {
        try {
            mostrarCarga();
            const response = await fetch('/eliminar-producto-almacen', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ id })
            });

            const data = await response.json();
            if (data.success) {
                anuncio.style.display = 'none';
                mostrarNotificacion('Producto eliminado correctamente', 'success');
                document.getElementById('searchProductAcopio').value = '';
                cargarAlmacen();
            } else {
                throw new Error(data.error || 'Error al eliminar el producto');
            }
        } catch (error) {
            console.error('Error:', error);
            mostrarNotificacion('Error al eliminar el producto', 'error');
        } finally {
            ocultarCarga();
        }
    };
}
export function mostrarProductos() {
    const container = document.querySelector('.lista-productos');
    container.style.display = 'flex';

    container.innerHTML = `
        <div class="almacen-container">
            <div class="almacen-header">
                <div class="search-bar">
                    <input type="text" id="searchProductAcopio" placeholder="Buscar producto...">
                    <i class="fas fa-search"></i>
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
    cargarAlmacen();

    const searchInput = document.getElementById('searchProductAcopio');
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const products = document.querySelectorAll('.product-card');

        products.forEach(product => {
            const productName = product.querySelector('.product-name span').textContent.toLowerCase();
            product.style.display = productName.includes(searchTerm) ? 'grid' : 'none';
        });
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
}