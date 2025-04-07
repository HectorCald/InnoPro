
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
                       <i class="fas fa-box"></i>
                    </button>
                    <p>Agregar</p>
                </div>
                <div class="cuadro-btn"><button class="btn-agregar-pedido">
                        <i class="fas fa-cog"></i>
                    </button>
                    <p>Formato</p>
                </div>
            </div>    
            <div class="lista-productos"></div>
        </div>
    `;

    const btnIngresar = container.querySelector('.btn-agregar-pedido i.fa-plus').parentElement;
    btnIngresar.onclick = () => mostrarFormularioIngreso('');

    const btnAgregar = container.querySelector('.btn-agregar-pedido i.fa-box').parentElement;
    btnAgregar.onclick = mostrarFormularioAgregarProducto;

    const btnFormato = container.querySelector('.btn-agregar-pedido i.fa-cog').parentElement;
    btnFormato.onclick = mostrarFormularioFormato;

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
            <div class="relleno">
                    <p>Buscar Producto:</p>
                    <div class="form-grup">
                        <div class="autocomplete-wrapper">
                            <input type="text" id="buscarProducto" class="edit-input" placeholder="Escriba para buscar...">
                            <div class="productos-sugeridos" style="display: none;">
                            <!-- Las sugerencias se mostrarán aquí -->
                            </div>
                        </div>
                    </div>
                    <p class="recomendacion">Selecciona un prodcuto:</p>
                    <div class="producto-seleccionado form-grup" style="display: none;">
                        <p><strong>Selección:</strong> <span id="nombreProductoSeleccionado"></span></p>
                        <input type="hidden" id="idProductoSeleccionado">
                    </div>
                    
                    <div class="campo-form">
                    <p>Cantidad a Ingresar:</p>
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
    } finally {
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
            const [id, nombre, gramaje, stock, cantidadTira, lista, codigob, precios] = producto;

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
    const [id, nombre, gramaje, stock, cantidadTira, lista, codigob, precios] = producto;
    const anuncio = document.querySelector('.anuncio');
    const contenido = anuncio.querySelector('.anuncio-contenido');
    function formatearPrecios(preciosStr, num) {
        if (!preciosStr) return '<div class="detalle-item"><span>No registrado</span></div>';

        return preciosStr.split(';').map(precio => {
            const [tipo, valor] = precio.split(',');
            let nombreTipo = tipo;
            if (num == 1) {
                return `<div class="detalle-item">
                    <p>${nombreTipo}:</p>
                    <span>Bs. ${valor}</span>
                </div>`;
            }
            else {
                return `
                        <div class="campo-form">
                            <label>${nombreTipo}:</label>
                            <div class="campo-form" style="padding:0; margin-top:0; gap:0">
                                    <input type="number" id="editPrice_${tipo}" value="${valor}" class="edit-input" data-tipo="${tipo}">
                                    <input type="number" id="porcentaje_${tipo}" class="edit-input porcentaje" placeholder="%" min="0" max="100">
                                    <span>%</span>
                            </div>
                        </div>`;
                        
            }
        }).join('');
    }
    contenido.innerHTML = `
        <h2 class="titulo-modal"><i class="fas fa-info-circle"></i> Información</h2>
        <div class="relleno">
            <div class="producto-detalles">
                    <div class="detalle-seccion" >
                        <p>Informacion General:</p>               
                        <div class="detalles-grup">
                            <div class="detalle-item">
                                <p>Nombre:</p> <span>${nombre}</span>
                            </div>
                            <div class="detalle-item">
                                <p>Gramaje:</p> <span>${gramaje} gramos</span>
                            </div>
                            <div class="detalle-item">
                                <p>Stock:</p> <span>${stock} Unidades</span>
                            </div>
                            <div class="detalle-item">
                                <p>Cantidad por Tira:</p> <span>${cantidadTira === "No se maneja por tira" ? cantidadTira : cantidadTira + " Unidades"}</span>
                            </div>
                            <div class="detalle-item">
                                <p>Lista:</p> <span>${lista}</span>
                            </div>
                            <div class="detalle-item">
                                <p>Codigo de barras:</p> <span>${codigob || 'No registrado'}</span>
                            </div>
                        </div>
                        <p >Precios:</p>  
                        <div class="detalles-grup">
                                <div class="detalle-item"><span>${formatearPrecios(precios, '1') || 'No registrado'}</span></div>
                        </div>
                    </div>
                    <div class="detalles-edicion" style="display: none; flex-direction:column; gap:5px"">
                        <p>Informacion General:</p> 
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
                        <div class="campo-form">
                            <label>Codigo de barras:</label>
                            <input type="text" id="editCodigoBarras" value="${codigob}" class="edit-input">
                        </div>
                        <p>Precios:</p>
                        ${formatearPrecios(precios, '2') || 'No registrado'}
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
    document.querySelectorAll('.porcentaje').forEach(input => {
        input.addEventListener('input', function () {
            const tipo = this.id.split('_')[1];
            const precioInput = document.getElementById(`editPrice_${tipo}`);
            const porcentaje = parseFloat(this.value) || 0;
            const precioBase = parseFloat(precioInput.value) || 0;
            

            if (porcentaje > 0) {
                const aumento = precioBase * (porcentaje / 100);
                const precioFinal = precioBase + aumento;
                precioInput.value = precioFinal.toFixed(2);
            }
        });
    });

    const detallesVista = contenido.querySelectorAll('.detalles-vista');
    const detallesEdicion = contenido.querySelector('.detalles-edicion');
    const btnEditar = contenido.querySelector('.editar');
    const btnGuardar = contenido.querySelector('.guardar');
    const tituloModal = contenido.querySelector('.titulo-modal');

    anuncio.querySelector('.cancelar').onclick = () => {
        anuncio.style.display = 'none';
    };

    anuncio.querySelector('.eliminar').onclick = () => {
        mostrarConfirmacionEliminar(id, nombre);
    };

    btnEditar.onclick = () => {
        const detallesGrup = contenido.querySelector('.detalle-seccion');
        detallesGrup.style.display = 'none';
        detallesEdicion.style.display = 'flex';
        btnEditar.style.display = 'none';
        btnGuardar.style.display = 'inline-block';
        tituloModal.innerHTML = '<i class="fas fa-edit"></i> Editar Información';
    };

    btnGuardar.onclick = async () => {
        try {
            mostrarCarga();
            const preciosInputs = Array.from(contenido.querySelectorAll('.campo-form input[id^="editPrice_"]'));
            const preciosActualizados = preciosInputs.map(input => {
                const tipo = input.dataset.tipo;
                const valor = input.value;
                return `${tipo},${valor}`;
            }).join(';');
            const cantidadTira = document.getElementById('editCantidadTira').value;
            const datosActualizados = {
                id,
                nombre: document.getElementById('editNombre').value,
                gramaje: document.getElementById('editGramaje').value,
                stock: document.getElementById('editStock').value,
                cantidadTira: cantidadTira === "" ? "No se maneja por tira" : cantidadTira,
                lista: document.getElementById('editLista').value,
                codigob: document.getElementById('editCodigoBarras').value,
                precios: preciosActualizados
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
    const preciosBase = window.productosAlmacen && window.productosAlmacen[0] ? window.productosAlmacen[0][7] : 'Normal,0;Mayorista,0';
    function formatearPrecios(preciosStr, num) {
        if (!preciosStr) return '<div class="detalle-item"><span>No registrado</span></div>';

        return preciosStr.split(';').map(precio => {
            const [tipo, valor] = precio.split(',');
            let nombreTipo = tipo;
            if (num == 1) {
                return `<div class="detalle-item">
                <p>${nombreTipo}:</p>
                <span>Bs. ${valor}</span>
            </div>`;
            }
            else {
                return `<div class="campo-form">
                            <label>${nombreTipo}:</label>
                            <div class="campo-form" style="padding:0; margin-top:0; gap:0">
                                    <input type="number" id="editPrice_${tipo}" value="0" class="edit-input" data-tipo="${tipo}">
                                    <input type="number" id="porcentaje_${tipo}" class="edit-input porcentaje" placeholder="%" min="0" max="100">
                                    <span>%</span>
                            </div>
                        </div>`;
            }
        }).join('');
    }
    contenido.innerHTML = `
        <h2><i class="fas fa-plus-circle"></i> Nuevo Producto</h2>
        <div class="relleno">
                <p>Informacion General:</p>
                    <div class="campo-form">
                        <label>Nombre:</label>
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
                        <input type="number" id="nuevoCantidadTira" value="0" class="edit-input">
                    </div>
                    <div class="campo-form">
                        <label>Lista:</label>
                        <input type="text" id="nuevoLista" class="edit-input" required>
                    </div>
                    <div class="campo-form">
                        <label>Codigo de barras:</label>
                        <input type="number" id="nuevoCodigoBarras" class="edit-input" required>
                    </div>
                <p>Precios:</p>
                ${formatearPrecios(preciosBase, '2')}
        </div>
        <div class="anuncio-botones">
                <button class="anuncio-btn green guardar"><i class="fas fa-save"></i> Guardar</button>
                <button class="anuncio-btn close cancelar"><i class="fas fa-times"></i></button>
        </div>
    `;


    anuncio.style.display = 'flex';
    // Agregar después de que el formulario se muestre
    document.querySelectorAll('.porcentaje').forEach(input => {
        input.addEventListener('input', function () {
            const tipo = this.id.split('_')[1];
            const precioInput = document.getElementById(`editPrice_${tipo}`);
            const porcentaje = parseFloat(this.value) || 0;
            const precioBase = parseFloat(precioInput.value) || 0;

            if (porcentaje > 0) {
                const aumento = precioBase * (porcentaje / 100);
                const precioFinal = precioBase + aumento;
                precioInput.value = precioFinal.toFixed(2);
            }
        });
    });
    anuncio.querySelector('.cancelar').onclick = () => {
        anuncio.style.display = 'none';
    };

    anuncio.querySelector('.guardar').onclick = async () => {
        try {
            mostrarCarga();
            const preciosInputs = Array.from(contenido.querySelectorAll('.campo-form input[id^="editPrice_"]'));
            const preciosActualizados = preciosInputs.map(input => {
                const tipo = input.dataset.tipo;
                const valor = input.value;
                return `${tipo},${valor}`;
            }).join(';');

            const cantidadTira = document.getElementById('nuevoCantidadTira').value;

            const nuevoProducto = {
                nombre: document.getElementById('nuevoNombre').value,
                gramaje: document.getElementById('nuevoGramaje').value,
                stock: document.getElementById('nuevoStock').value,
                cantidadTira: cantidadTira === "0" ? "No se maneja por tira" : cantidadTira,
                lista: document.getElementById('nuevoLista').value,
                codigob: document.getElementById('nuevoCodigoBarras')?.value || '',
                precios: preciosActualizados
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
            <div class="detalles-grup center">
                <p>¿¿Está seguro que desea eliminar el producto "${nombre}"?</p>
                <p>Esta acción no se puede deshacer.</p>
            </div>
        <div class="anuncio-botones">
            <button class="anuncio-btn red confirmar">Confirmar</button>
            <button class="anuncio-btn close cancelar"><i class="fas fa-times"></i></button>
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
function mostrarFormularioFormato() {
    const anuncio = document.querySelector('.anuncio');
    const contenido = anuncio.querySelector('.anuncio-contenido');
    const preciosBase = window.productosAlmacen && window.productosAlmacen[0] ? window.productosAlmacen[0][7] : 'Normal,0;Mayorista,0';

    function actualizarListaFormatos(preciosStr) {
        const detallesGrup = contenido.querySelector('.detalles-grup');
        detallesGrup.innerHTML = formatearPrecios(preciosStr, '1');
        
        // Reattach event listeners for delete buttons
        document.querySelectorAll('.delete-price').forEach(icon => {
            icon.addEventListener('click', (e) => {
                const nombreTipo = e.target.getAttribute('data-nombre');
                mostrarConfirmacionEliminarPrecio(nombreTipo);
            });
        });
    }

    function formatearPrecios(preciosStr, num) {
        if (!preciosStr) return '<div class="detalle-item"><span>No registrado</span></div>';

        return preciosStr.split(';').map(precio => {
            const [tipo, valor] = precio.split(',');
            let nombreTipo = tipo;
            if (num == 1) {
                return `<div class="detalle-item">
                    <p>${nombreTipo}:</p>
                    <i class="fas fa-trash delete delete-price" data-nombre="${nombreTipo}"></i>
                </div>`;
            }
            else {
                return `<div class="campo-form">
                    <label>${nombreTipo}:</label>
                    <div class="precio-container">
                        <div class="campo-form">
                            <i class="fas fa-trash"></i>
                        </div>
                    </div>
                </div>`;
            }
        }).join('');
    }

    contenido.innerHTML = `
        <h2><i class="fas fa-cog"></i> Formatos</h2>
        <div class="relleno">
            <p>Formato Precios:</p>
            <div class="detalles-grup">
                ${formatearPrecios(preciosBase, '1')}
            </div>
            <div class="form-grup">
                <div class="detalle-item">
                    <input type="text" id="nuevoFormato" class="edit-input" placeholder="Nuevo formato precio">
                    <i class="fas fa-plus-circle add add-format"></i>
                </div>
            </div>
        </div>
        <div class="anuncio-botones">
            <button class="anuncio-btn close cancelar"><i class="fas fa-times"></i></button>
        </div>
    `;

    // Event listener para agregar nuevo formato
    contenido.querySelector('.add-format').addEventListener('click', async () => {
        const nombreFormato = document.getElementById('nuevoFormato').value.trim();
        if (!nombreFormato) {
            mostrarNotificacion('Ingrese un nombre para el formato', 'error');
            return;
        }

        try {
            mostrarCarga();
            const response = await fetch('/agregar-formato-precio', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ nombreFormato })
            });

            const data = await response.json();
            if (data.success) {
                // Actualizar la lista de precios base con el nuevo formato
                const nuevoPreciosBase = preciosBase ? `${preciosBase};${nombreFormato},0` : `${nombreFormato},0`;
                actualizarListaFormatos(nuevoPreciosBase);
                document.getElementById('nuevoFormato').value = '';
                mostrarNotificacion('Formato agregado correctamente', 'success');
            } else {
                throw new Error(data.error || 'Error al agregar el formato');
            }
        } catch (error) {
            console.error('Error:', error);
            mostrarNotificacion('Error al agregar el formato', 'error');
        } finally {
            ocultarCarga();
            cargarAlmacen();
        }
    });

    // Initial event listeners for delete buttons
    document.querySelectorAll('.delete-price').forEach(icon => {
        icon.addEventListener('click', (e) => {
            const nombreTipo = e.target.getAttribute('data-nombre');
            mostrarConfirmacionEliminarPrecio(nombreTipo);
        });
    });

    anuncio.style.display = 'flex';
    
    anuncio.querySelector('.cancelar').onclick = () => {
        anuncio.style.display = 'none';
    };
}
function mostrarConfirmacionEliminarPrecio(nombre) {
    const anuncio = document.querySelector('.anuncio');
    const contenido = anuncio.querySelector('.anuncio-contenido');
    const preciosBase = window.productosAlmacen && window.productosAlmacen[0] ? window.productosAlmacen[0][7] : '';

    contenido.innerHTML = `
        <h2><i class="fas fa-exclamation-triangle"></i> Confirmar Eliminación</h2>
        <div class="detalles-grup center">
                <p>¿Está seguro que desea eliminar el formato de precio "${nombre}"?</p>
                <p>Esta acción eliminará este formato de todos los productos.</p>
        </div>
        <div class="anuncio-botones">
            <button class="anuncio-btn red confirmar">Confirmar</button>
            <button class="anuncio-btn close cancelar"><i class="fas fa-times"></i></button>
        </div>
    `;

    anuncio.querySelector('.cancelar').onclick = () => {
        mostrarFormularioFormato();
    };

    anuncio.querySelector('.confirmar').onclick = async () => {
        try {
            mostrarCarga();
            const response = await fetch('/eliminar-formato-precio', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ tipo: nombre })
            });

            const data = await response.json();
            if (data.success) {
                // Update window.productosAlmacen with the new format list
                if (window.productosAlmacen && window.productosAlmacen.length > 0) {
                    window.productosAlmacen = window.productosAlmacen.map(producto => {
                        const precios = producto[7].split(';');
                        const nuevosPrecios = precios.filter(precio => !precio.startsWith(nombre + ',')).join(';');
                        return [...producto.slice(0, 7), nuevosPrecios];
                    });
                }
                
                mostrarNotificacion('Formato de precio eliminado correctamente', 'success');
                mostrarFormularioFormato();
                cargarAlmacen(); // Reload the products to reflect the changes
            } else {
                throw new Error(data.error || 'Error al eliminar el formato de precio');
            }
        } catch (error) {
            console.error('Error:', error);
            mostrarNotificacion('Error al eliminar el formato de precio', 'error');
        } finally {
            ocultarCarga();
            cargarAlmacen();
        }
    };
}
