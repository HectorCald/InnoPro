
export function inicializarAlmacenGral() {
    const container = document.querySelector('.almacen-view');
    container.innerHTML = `
        <div class="title">
            <h3><i class="fas fa-warehouse"></i> Gestión de Almacen</h3>
        </div>
        <div class="alamcenGral-container">
            <div class="almacen-botones">
                <div class="cuadro-btn"><button class="btn-agregar-pedido">
                        <i class="fas fa-arrow-circle-down"></i>
                    </button>
                    <p>Ingresos</p>
                </div>
                <div class="cuadro-btn"><button class="btn-agregar-pedido">
                        <i class="fas fa-arrow-circle-up"></i>
                    </button>
                    <p>Salidas</p>
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
                <div class="cuadro-btn"><button class="btn-agregar-pedido">
                        <i class="fas fa-clipboard-list"></i>
                    </button>
                    <p>Pedidos</p>
                </div>
            </div>    
            <div class="lista-productos"></div>
        </div>
    `;

    const btnIngresar = container.querySelector('.btn-agregar-pedido i.fa-arrow-circle-down').parentElement;
    btnIngresar.onclick = () => mostrarFormularioIngreso('');

    const btnSalidas = container.querySelector('.btn-agregar-pedido i.fa-arrow-circle-up').parentElement;
    btnSalidas.onclick = () => mostrarFormularioSalidas('');

    const btnAgregar = container.querySelector('.btn-agregar-pedido i.fa-box').parentElement;
    btnAgregar.onclick = mostrarFormularioAgregarProducto;

    const btnFormato = container.querySelector('.btn-agregar-pedido i.fa-cog').parentElement;
    btnFormato.onclick = mostrarFormularioFormato;

    const btnPedidos = container.querySelector('.btn-agregar-pedido i.fa-clipboard-list').parentElement;
    btnPedidos.onclick = () => mostrarFormularioPedidos('');

    mostrarProductos();
};
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
        <div class="productos-seleccionados">
            <p>Productos a ingresar:</p>
            <div class="lista-productos-seleccionados"></div>
        </div>
        <p>Buscar Producto:</p>
        <div class="form-grup">
            <div class="autocomplete-wrapper">
                <input type="text" id="buscarProducto" class="edit-input" placeholder="Escriba para buscar...">
                <div class="productos-sugeridos" style="display: none;"></div>
            </div>
        </div>
        <div class="producto-seleccionado form-grup" style="display: none;">
            <p><strong>Selección:</strong> <span id="nombreProductoSeleccionado"></span></p>
            <input type="hidden" id="idProductoSeleccionado">
            <div class="campo-form">
                <p>Cantidad:</p>
                <input type="number" id="cantidadIngreso" class="edit-input" min="1" placeholder="Cantidad">
            </div>
            <button class="anuncio-btn blue agregar-a-lista"><i class="fas fa-plus"></i> Agregar a la lista</button>
        </div>
    </div>
    <div class="anuncio-botones">
        <button class="anuncio-btn green ingresar" disabled><i class="fas fa-plus-circle"></i> Procesar Ingresos</button>
        <button class="anuncio-btn close cancelar"><i class="fas fa-times"></i></button>
    </div>
`;


        anuncio.style.display = 'flex';
        let productosParaProcesar = [];

        const inputBuscar = contenido.querySelector('#buscarProducto');
        const sugerencias = contenido.querySelector('.productos-sugeridos');
        const recomendacion = contenido.querySelector('.recomendacion');
        const btnAgregarLista = contenido.querySelector('.agregar-a-lista');
        const listaProductos = contenido.querySelector('.lista-productos-seleccionados');
        const btnProcesar = contenido.querySelector('.ingresar'); 

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
        btnAgregarLista.onclick = () => {
            const id = document.getElementById('idProductoSeleccionado').value;
            const nombre = document.getElementById('nombreProductoSeleccionado').textContent;
            const cantidad = parseInt(document.getElementById('cantidadIngreso').value);
        
            if (!id || !cantidad || cantidad < 1) {
                mostrarNotificacion('Complete los campos correctamente', 'error');
                return;
            }
        
            productosParaProcesar.push({ id, nombre, cantidad });
            actualizarListaProductos();
            
            // Limpiar campos
            document.getElementById('buscarProducto').value = '';
            document.getElementById('cantidadIngreso').value = '';
            document.querySelector('.producto-seleccionado').style.display = 'none';
            btnProcesar.disabled = false;
        };
        
        function actualizarListaProductos() {
            listaProductos.innerHTML = productosParaProcesar.map((prod, index) => `
                <div class="detalle-item" style="border-bottom:1px solid gray; margin-top:10px;margin-bottom:10px; padding:5px">
                    <p>${prod.nombre}</p>
                    <span>${prod.cantidad} und.</span>
                    <i class="fas fa-trash delete eliminar-de-lista" data-index="${index}"></i>
                </div>
            `).join('');
        
            // Agregar eventos para eliminar items
            listaProductos.querySelectorAll('.eliminar-de-lista').forEach(btn => {
                btn.onclick = (e) => {
                    const index = parseInt(e.target.dataset.index);
                    productosParaProcesar.splice(index, 1);
                    actualizarListaProductos();
                    btnProcesar.disabled = productosParaProcesar.length === 0;
                };
            });
        }
        
        // Modificar el evento onclick del botón procesar:
        btnProcesar.onclick = async () => {
            try {
                mostrarCarga();
                for (const producto of productosParaProcesar) {
                    const response = await fetch('/ingresar-stock-almacen', {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ 
                            id: producto.id, 
                            cantidad: producto.cantidad 
                        })
                    });
        
                    const data = await response.json();
                    if (!data.success) {
                        throw new Error(`Error al procesar ${producto.nombre}`);
                    }
        
                    // Registrar el movimiento después de procesar exitosamente
                    await registrarMovimiento('Ingreso', producto.nombre, producto.cantidad);
                }
        
                mostrarNotificacion('Productos procesados correctamente', 'success');
                anuncio.style.display = 'none';
                cargarAlmacen();
            } catch (error) {
                console.error('Error:', error);
                mostrarNotificacion(error.message, 'error');
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
};
export async function mostrarFormularioSalidas(producto) {
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
        <h2><i class="fas fa-minus"></i> Registrar Salida</h2>
        <div class="relleno">
            <div class="productos-seleccionados">
                <p>Productos a retirar:</p>
                <div class="lista-productos-seleccionados"></div>
            </div>
            <p>Buscar Producto:</p>
            <div class="form-grup">
                <div class="autocomplete-wrapper">
                    <input type="text" id="buscarProductoSalida" class="edit-input" placeholder="Escriba para buscar...">
                    <div class="productos-sugeridos" style="display: none;"></div>
                </div>
            </div>
            <div class="producto-seleccionado form-grup" style="display: none;">
                <p><strong>Selección:</strong> <span id="nombreProductoSeleccionado"></span></p>
                <p><strong>Stock actual:</strong> <span id="stockActual">0</span> unidades</p>
                <input type="hidden" id="idProductoSeleccionado">
                <div class="campo-form">
                    <p>Cantidad:</p>
                    <input type="number" id="cantidadSalida" class="edit-input" min="1" placeholder="Cantidad">
                </div>
                <button class="anuncio-btn blue agregar-a-lista"><i class="fas fa-plus"></i> Agregar a la lista</button>
            </div>
        </div>
        <div class="anuncio-botones">
            <button class="anuncio-btn red retirar" disabled><i class="fas fa-minus-circle"></i> Procesar Salidas</button>
            <button class="anuncio-btn close cancelar"><i class="fas fa-times"></i></button>
        </div>
    `;



        anuncio.style.display = 'flex';
        let productosParaProcesar = [];
        const inputBuscar = contenido.querySelector('#buscarProductoSalida');
        const sugerencias = contenido.querySelector('.productos-sugeridos');
        const btnRetirar = contenido.querySelector('.retirar');
        const recomendacion = contenido.querySelector('.recomendacion');
        const btnAgregarLista = contenido.querySelector('.agregar-a-lista');
        const listaProductos = contenido.querySelector('.lista-productos-seleccionados');
        const btnProcesar = contenido.querySelector('.retirar');

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
                    <div class="sugerencia-item" data-id="${producto[0]}" data-nombre="${producto[1]}" data-gramaje="${producto[2]}" data-stock="${producto[3]}">
                        ${producto[1]} - ${producto[2]}gr (Stock: ${producto[3]})
                    </div>
                `).join('');
                sugerencias.style.display = 'block';

                sugerencias.querySelectorAll('.sugerencia-item').forEach(item => {
                    item.addEventListener('click', () => {
                        const id = item.dataset.id;
                        const nombre = item.dataset.nombre;
                        const gramaje = item.dataset.gramaje;
                        const stock = item.dataset.stock;
                        document.getElementById('idProductoSeleccionado').value = id;
                        document.getElementById('nombreProductoSeleccionado').textContent = `${nombre} - ${gramaje}gr`;
                        document.getElementById('stockActual').textContent = stock;
                        document.querySelector('.producto-seleccionado').style.display = 'block';
                        inputBuscar.value = `${nombre} - ${gramaje}gr`;
                        sugerencias.style.display = 'none';
                        btnRetirar.disabled = false;
                        recomendacion.style.display = 'none';
                    });
                });
            } else {
                sugerencias.innerHTML = '<div class="no-resultados">No se encontraron productos</div>';
                sugerencias.style.display = 'block';
            }
        };

        inputBuscar.addEventListener('input', handleInput);

        if (producto) {
            inputBuscar.value = producto;
            setTimeout(() => {
                handleInput();
                if (sugerencias.children.length > 0) {
                    sugerencias.style.display = 'block';
                }
            }, 100);
        }

        document.addEventListener('click', (e) => {
            if (!sugerencias.contains(e.target) && e.target !== inputBuscar) {
                sugerencias.style.display = 'none';
            }
        });

        anuncio.querySelector('.cancelar').onclick = () => {
            anuncio.style.display = 'none';
        };
        btnAgregarLista.onclick = () => {
            const id = document.getElementById('idProductoSeleccionado').value;
            const nombre = document.getElementById('nombreProductoSeleccionado').textContent;
            const cantidad = parseInt(document.getElementById('cantidadSalida').value);
            const stockActual = parseInt(document.getElementById('stockActual').textContent);
    
            if (!id || !cantidad || cantidad < 1) {
                mostrarNotificacion('Complete los campos correctamente', 'error');
                return;
            }
    
            if (cantidad > stockActual) {
                mostrarNotificacion('La cantidad a retirar no puede ser mayor al stock actual', 'error');
                return;
            }
    
            productosParaProcesar.push({ id, nombre, cantidad });
            actualizarListaProductos();
            
            // Limpiar campos
            document.getElementById('buscarProductoSalida').value = '';
            document.getElementById('cantidadSalida').value = '';
            document.querySelector('.producto-seleccionado').style.display = 'none';
            btnProcesar.disabled = false;
        };
        
        function actualizarListaProductos() {
            listaProductos.innerHTML = productosParaProcesar.map((prod, index) => `
                <div class="detalle-item" style="border-bottom:1px solid gray; margin-top:10px;margin-bottom:10px; padding:5px">
                    <p>${prod.nombre}</p>
                    <span>${prod.cantidad} und.</span>
                    <i class="fas fa-trash delete eliminar-de-lista" data-index="${index}"></i>
                </div>
            `).join('');
        
            // Agregar eventos para eliminar items
            listaProductos.querySelectorAll('.eliminar-de-lista').forEach(btn => {
                btn.onclick = (e) => {
                    const index = parseInt(e.target.dataset.index);
                    productosParaProcesar.splice(index, 1);
                    actualizarListaProductos();
                    btnProcesar.disabled = productosParaProcesar.length === 0;
                };
            });
        }
        
        btnProcesar.onclick = async () => {
            try {
                mostrarCarga();
                for (const producto of productosParaProcesar) {
                    const response = await fetch('/retirar-stock-almacen', {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ 
                            id: producto.id, 
                            cantidad: producto.cantidad 
                        })
                    });
        
                    const data = await response.json();
                    if (!data.success) {
                        throw new Error(`Error al procesar ${producto.nombre}`);
                    }
        
                    // Registrar el movimiento después de procesar exitosamente
                    await registrarMovimiento('Salida', producto.nombre, producto.cantidad);
                }
        
                mostrarNotificacion('Productos procesados correctamente', 'success');
                anuncio.style.display = 'none';
                cargarAlmacen();
            } catch (error) {
                console.error('Error:', error);
                mostrarNotificacion(error.message, 'error');
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
};
function mostrarFormularioPedidos() {
    mostrarNotificacion('Esta opción aun esta en desarrollo', 'warning');
};
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
            const [id, nombre, gramaje, stock, cantidadTira, lista, codigob, precios, tag] = producto;

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
        scrollToTop('.almacen-view')
    }
};
window.mostrarDetalleProductoGral = function (producto) {
    const [id, nombre, gramaje, stock, cantidadTira, lista, codigob, precios, tag] = producto;
    const anuncio = document.querySelector('.anuncio');
    const contenido = anuncio.querySelector('.anuncio-contenido');
    const tagsSeleccionados = new Set(tag ? tag.split(';').filter(t => t.trim()) : []);

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
                        <div class="campo-form" style="padding:0; margin-top:0">
                            <input type="number" id="editPrice_${tipo}" value="${valor}" class="edit-input" data-tipo="${tipo}">
                            <input type="number" id="porcentaje_${tipo}" class="edit-input porcentaje" placeholder="%" min="0" max="100">
                        </div>
                    </div>`;
            }
        }).join('');
    }

    function formatearTags(tagsStr, num) {
        if (!tagsStr) return '<div class="detalle-item"><p>Este producto no tiene etiquetas</p></div>';
        
        return tagsStr.split(';').filter(Boolean).map(tag => {
            if (num == 1) {
                return `<div class="detalle-item">
                    <p class="tag">- ${tag}</p>
                </div>`;
            } else {
                return `<div class="detalle-item">
                    <p>${tag}</p>
                    <i class="fas fa-trash delete delete-tag-edit" data-nombre="${tag}"></i>
                </div>`;
            }
        }).join('');
    }

    // Tu HTML actual se mantiene igual...
    contenido.innerHTML = `
        <h2 class="titulo-modal"><i class="fas fa-info-circle"></i> Información</h2>
        <div class="relleno">
            <div class="producto-detalles">
                <div class="detalle-seccion">
                    <p>Informacion General:</p>               
                    <div class="detalles-grup">
                        <div class="detalle-item">
                            <p>Nombre:</p> <span>${nombre}</span>
                        </div>
                        <div class="detalle-item">
                            <p>Gramaje:</p> <span>${gramaje} gr.</span>
                        </div>
                        <div class="detalle-item">
                            <p>Stock:</p> <span>${stock} und.</span>
                        </div>
                        <div class="detalle-item">
                            <p>Cantidad por grupo:</p> <span>${cantidadTira === "No se maneja por tira" ? cantidadTira : cantidadTira + " und."}</span>
                        </div>
                        <div class="detalle-item">
                            <p>Lista:</p> <span>${lista}</span>
                        </div>
                        <div class="detalle-item">
                            <p>Codigo de barras:</p> <span>${codigob || 'No registrado'}</span>
                        </div>
                    </div>
                    <p>Precios:</p>  
                    <div class="detalles-grup">
                        <div class="detalle-item"><span>${formatearPrecios(precios, '1') || 'Este producto no tiene precios registrados'}</span></div>
                    </div>
                    <p>Etiquetas:</p> 
                    <div class="detalles-grup">
                        <div class="detalle-item"><span>${formatearTags(tag, '1') || 'Este producto no tiene etiquetas'}</span></div>
                    </div>
                </div>
                <div class="detalles-edicion" style="display: none; flex-direction:column; gap:5px">
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
                    <p>Etiquetas:</p>
                    <div id="tags-container" class="detalles-grup">
                        ${formatearTags(tag, '2') || 'Este producto no tiene etiquetas'}
                        
                    </div>
                    <div class="campo-form">
                        <label>Etiqueta:</label>
                        <select id="editTags" class="edit-input">
                            <option value="">Seleccionar</option>
                            ${window.productosAlmacen && window.productosAlmacen[0] && window.productosAlmacen[0][8] ? 
                                window.productosAlmacen[0][8].split(';')
                                    .filter(tag => tag.trim())
                                    .map(tag => `<option value="${tag}">${tag}</option>`)
                                    .join('')
                                : '<option disabled>No hay etiquetas disponibles</option>'
                            }
                        </select>
                        <div class="detalle-item">
                            <i class="fas fa-plus-circle add btn-add-tag-edit"></i>
                        </div>
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

    function actualizarTagsUI() {
        const tagsContainer = contenido.querySelector('#tags-container');
        tagsContainer.innerHTML = Array.from(tagsSeleccionados).map(tag => `
            <div class="detalle-item">
                <p>${tag}</p>
                <i class="fas fa-trash delete delete-tag-edit" data-nombre="${tag}"></i>
            </div>
        `).join('');

        tagsContainer.querySelectorAll('.delete-tag-edit').forEach(btn => {
            btn.addEventListener('click', function() {
                const tagToRemove = this.getAttribute('data-nombre');
                tagsSeleccionados.delete(tagToRemove);
                actualizarTagsUI();
            });
        });
    }

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

    contenido.querySelector('.btn-add-tag-edit')?.addEventListener('click', () => {
        const selectTag = document.getElementById('editTags');
        const selectedTag = selectTag.value;
        
        if (!selectedTag) {
            mostrarNotificacion('Seleccione una etiqueta', 'error');
            return;
        }
        
        if (!tagsSeleccionados.has(selectedTag)) {
            tagsSeleccionados.add(selectedTag);
            actualizarTagsUI();
            selectTag.value = '';
        } else {
            mostrarNotificacion('Esta etiqueta ya está agregada', 'warning');
        }
    });

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
        actualizarTagsUI();
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
                precios: preciosActualizados,
                tags: Array.from(tagsSeleccionados).join(';')
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
                            <div class="campo-form" style="padding:0; margin-top:0">
                                    <input type="number" id="editPrice_${tipo}" value="0" class="edit-input" data-tipo="${tipo}">
                                    <input type="number" id="porcentaje_${tipo}" class="edit-input porcentaje" placeholder="%" min="0" max="100">
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
                        <input type="text" id="nuevoNombre" class="edit-input" placeholder="Producto" required>
                    </div>
                    <div class="campo-form">
                        <label>Gramaje:</label>
                        <input type="number" id="nuevoGramaje" class="edit-input" value="0" placeholder="Opcional" required>
                    </div>
                    <div class="campo-form">
                        <label>Stock Total:</label>
                        <input type="number" id="nuevoStock" class="edit-input" placeholder="Stock" required>
                    </div>
                    <div class="campo-form">
                        <label>Cantidad por grupo:</label>
                        <input type="number" id="nuevoCantidadTira" value="0" placeholder="Opcional" class="edit-input">
                    </div>
                    <div class="campo-form">
                        <label>Lista:</label>
                        <input type="text" id="nuevoLista" class="edit-input" placeholder="Numero" required>
                    </div>
                    <div class="campo-form">
                        <label>Codigo de barras:</label>
                        <input type="number" id="nuevoCodigoBarras" class="edit-input" placeholder="Numero" required>
                    </div>
                <p>Precios:</p>
                ${formatearPrecios(preciosBase, '2')}
                <p>Etiquetas:</p>
                <div id="tags-container" class="detalles-grup">
                        <!-- Aquí se renderizarán los tags seleccionados -->
                </div>
                <div class="campo-form">
                    <label>Etiqueta:</label>
                    <select id="nuevoTags" class="edit-input">
                        <option value="">Seleccionar</option>
                        ${window.productosAlmacen && window.productosAlmacen[0] && window.productosAlmacen[0][8] ? 
                            window.productosAlmacen[0][8].split(';')
                                .filter(tag => tag.trim())
                                .map(tag => `<option value="${tag}">${tag}</option>`)
                                .join('')
                            : '<option disabled>No hay etiquetas disponibles</option>'
                        }
                    </select>
                    <div class="detalle-item">
                        <i class="fas fa-plus-circle add btn-add-tag"></i>
                    </div>
                </div>
        </div>
        <div class="anuncio-botones">
                <button class="anuncio-btn green guardar"><i class="fas fa-save"></i> Guardar</button>
                <button class="anuncio-btn close cancelar"><i class="fas fa-times"></i></button>
        </div>
    `;


    anuncio.style.display = 'flex';
    const tagsContainer = contenido.querySelector('#tags-container');
    const selectedTags = new Set();

    // Función para renderizar los tags
    function renderizarTags() {
        tagsContainer.innerHTML = Array.from(selectedTags).map(tag => `
            <div class="detalle-item">
                <p>${tag}</p>
                <i class="fas fa-trash delete delete-tag" data-nombre="${tag}"></i>
            </div>
        `).join('');

        // Agregar event listeners a los nuevos botones de eliminar
        tagsContainer.querySelectorAll('.delete-tag').forEach(deleteBtn => {
            deleteBtn.addEventListener('click', function() {
                const tagToRemove = this.getAttribute('data-nombre');
                selectedTags.delete(tagToRemove);
                renderizarTags();
            });
        });
    }

    // Event listener para el botón de agregar
    contenido.querySelector('.btn-add-tag').addEventListener('click', () => {
        const selectTag = document.getElementById('nuevoTags');
        const selectedTag = selectTag.value;
        
        if (!selectedTag) {
            mostrarNotificacion('Seleccione una etiqueta', 'error');
            return;
        }
        
        if (!selectedTags.has(selectedTag)) {
            selectedTags.add(selectedTag);
            renderizarTags();
            selectTag.value = ''; // Resetear el select
        } else {
            mostrarNotificacion('Esta etiqueta ya está agregada', 'warning');
        }
    });
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
                precios: preciosActualizados,
                tags: Array.from(selectedTags).join(';') // Agregar los tags al objeto
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
};
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
};
export function mostrarProductos() {
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
    cargarAlmacen();

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
function mostrarFormularioFormato() {
    const anuncio = document.querySelector('.anuncio');
    const contenido = anuncio.querySelector('.anuncio-contenido');
    const preciosBase = window.productosAlmacen && window.productosAlmacen[0] ? window.productosAlmacen[0][7] : '';
    const tagBase = window.productosAlmacen && window.productosAlmacen[0] ? window.productosAlmacen[0][8] : '';

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
            <p>Formato Etiquetas:</p>
            <div class="detalles-grup">
                ${formatearTags(tagBase, '1')}
            </div>
            <div class="form-grup">
                <div class="detalle-item">
                    <input type="text" id="nuevoFormatoTag" class="edit-input" placeholder="Nuevo formato etiqueta">
                    <i class="fas fa-plus-circle add add-tag"></i>
                </div>
            </div>
        </div>
        <div class="anuncio-botones">
            <button class="anuncio-btn close cancelar"><i class="fas fa-times"></i></button>
        </div>
    `;

    function formatearPrecios(preciosStr, num) {
        if (!preciosStr) return '<div class="detalle-item"><span>No registrado</span></div>';
        return preciosStr.split(';').map(precio => {
            const [tipo] = precio.split(',');
            return `<div class="detalle-item">
                <p>${tipo}</p>
                <i class="fas fa-trash delete delete-price" data-nombre="${tipo}"></i>
            </div>`;
        }).join('');
    }

    function formatearTags(tagsStr, num) {
        if (!tagsStr) return '<div class="detalle-item"><span>No registrado</span></div>';
        return tagsStr.split(';').filter(Boolean).map(tag => {
            return `<div class="detalle-item">
                <p>${tag}</p>
                <i class="fas fa-trash delete delete-tag" data-nombre="${tag}"></i>
            </div>`;
        }).join('');
    }
        // Event listener para agregar formato
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
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombreFormato })
            });

            const data = await response.json();
            
            // Actualizar datos locales
            if (window.productosAlmacen && window.productosAlmacen.length > 0) {
                window.productosAlmacen = window.productosAlmacen.map(producto => {
                    const nuevosPrecios = producto[7] ? `${producto[7]};${nombreFormato},0` : `${nombreFormato},0`;
                    return [...producto.slice(0, 7), nuevosPrecios, producto[8]];
                });
            }
            
            mostrarNotificacion('Formato agregado correctamente', 'success');
            document.getElementById('nuevoFormato').value = '';

            // Recargar datos del servidor y actualizar vista
            const refreshResponse = await fetch('/obtener-almacen-general');
            const refreshData = await refreshResponse.json();
            if (refreshData.pedidos) {
                window.productosAlmacen = refreshData.pedidos;
                mostrarFormularioFormato(); // Volver a renderizar todo el formulario
            }
        } catch (error) {
            console.error('Error:', error);
            mostrarNotificacion('Error al agregar el formato', 'error');
        } finally {
            ocultarCarga();
        }
    });

    // Event listener para agregar etiqueta (similar al anterior)
    contenido.querySelector('.add-tag').addEventListener('click', async () => {
        const nombreTag = document.getElementById('nuevoFormatoTag').value.trim();
        if (!nombreTag) {
            mostrarNotificacion('Ingrese un nombre para la etiqueta', 'error');
            return;
        }

        try {
            mostrarCarga();
            const response = await fetch('/agregar-tag', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombreTag })
            });

            const data = await response.json();
            
            // Actualizar datos locales
            if (window.productosAlmacen && window.productosAlmacen.length > 0) {
                window.productosAlmacen = window.productosAlmacen.map(producto => {
                    const nuevosTags = producto[8] ? `${producto[8]};${nombreTag}` : nombreTag;
                    return [...producto.slice(0, 8), nuevosTags];
                });
            }
            
            mostrarNotificacion('Etiqueta agregada correctamente', 'success');
            document.getElementById('nuevoFormatoTag').value = '';

            // Recargar datos del servidor y actualizar vista
            const refreshResponse = await fetch('/obtener-almacen-general');
            const refreshData = await refreshResponse.json();
            if (refreshData.pedidos) {
                window.productosAlmacen = refreshData.pedidos;
                mostrarFormularioFormato(); // Volver a renderizar todo el formulario
            }
        } catch (error) {
            console.error('Error:', error);
            mostrarNotificacion('Error al agregar la etiqueta', 'error');
        } finally {
            ocultarCarga();
        }
    });

    // Event listeners para eliminar
    document.querySelectorAll('.delete-price').forEach(icon => {
        icon.addEventListener('click', (e) => {
            const nombreTipo = e.target.getAttribute('data-nombre');
            mostrarConfirmacionEliminarPrecio(nombreTipo);
        });
    });

    document.querySelectorAll('.delete-tag').forEach(icon => {
        icon.addEventListener('click', (e) => {
            const tag = e.target.getAttribute('data-nombre');
            mostrarConfirmacionEliminarTag(tag);
        });
    });

    anuncio.style.display = 'flex';
    anuncio.querySelector('.cancelar').onclick = () => {
        anuncio.style.display = 'none';
    };
}
function mostrarConfirmacionEliminarTag(nombre) {
    const anuncio = document.querySelector('.anuncio');
    const contenido = anuncio.querySelector('.anuncio-contenido');

    contenido.innerHTML = `
        <h2><i class="fas fa-exclamation-triangle"></i> Confirmar Eliminación</h2>
        <div class="detalles-grup center">
                <p>¿Está seguro que desea eliminar la etiqueta "${nombre}"?</p>
                <p>Esta acción eliminará esta etiqueta de todos los productos.</p>
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
            const response = await fetch('/eliminar-tag', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ tag: nombre })
            });

            const data = await response.json();
            if (data.success) {
                // Update window.productosAlmacen with the new tags list
                if (window.productosAlmacen && window.productosAlmacen.length > 0) {
                    window.productosAlmacen = window.productosAlmacen.map(producto => {
                        const tags = producto[8] ? producto[8].split(';') : [];
                        const nuevosTags = tags.filter(tag => tag !== nombre).join(';');
                        return [...producto.slice(0, 8), nuevosTags];
                    });
                }

                mostrarNotificacion('Etiqueta eliminada correctamente', 'success');
                mostrarFormularioFormato();
                cargarAlmacen();
            } else {
                throw new Error(data.error || 'Error al eliminar la etiqueta');
            }
        } catch (error) {
            console.error('Error:', error);
            mostrarNotificacion('Error al eliminar la etiqueta', 'error');
        } finally {
            ocultarCarga();
            cargarAlmacen();
        }
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
                // Actualizar window.productosAlmacen manteniendo los tags
                if (window.productosAlmacen && window.productosAlmacen.length > 0) {
                    window.productosAlmacen = window.productosAlmacen.map(producto => {
                        const precios = producto[7].split(';');
                        const nuevosPrecios = precios.filter(precio => !precio.startsWith(nombre + ',')).join(';');
                        return [...producto.slice(0, 7), nuevosPrecios, producto[8]]; // Mantener producto[8] (tags)
                    });
                }

                mostrarNotificacion('Formato de precio eliminado correctamente', 'success');
                mostrarFormularioFormato();
            } else {
                throw new Error(data.error || 'Error al eliminar el formato de precio');
            }
        } catch (error) {
            console.error('Error:', error);
            mostrarNotificacion('Error al eliminar el formato de precio', 'error');
        } finally {
            ocultarCarga();
        }
    };
};
async function obtenerUsuarioActual() {
    try {
        const response = await fetch('/obtener-mi-rol');
        const data = await response.json();
        
        if (data.nombre) {
            return data.nombre;
        }
        
        if (data.error) {
            console.error('Error al obtener usuario:', data.error);
            return 'Sistema';
        }
        
        return 'Sistema';
    } catch (error) {
        console.error('Error al obtener usuario:', error);
        return 'Sistema';
    }
};
async function registrarMovimiento(tipo, producto, cantidad) {
    try {
        const operario = await obtenerUsuarioActual(); // Esperar a obtener el usuario
        const response = await fetch('/registrar-movimiento-almacen', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                tipo,
                producto,
                cantidad,
                operario
            })
        });

        const data = await response.json();
        if (!data.success) {
            throw new Error('Error al registrar movimiento');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error al registrar el movimiento', 'error');
    }
};




