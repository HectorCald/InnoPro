import { cargarRegistrosAcopio } from "./regAcopio.js";

/* =============== FUNCIONES DE INICIO DE ALMACEN ACOPIO =============== */
async function obtnerMiRol(){
    const userResponse = await fetch('/obtener-mi-rol');
    const userData = await userResponse.json();
    window.rol = userData.rol;
}
obtnerMiRol();
let carritoProductos = new Map();
export function inicializarAlmacen() {
    const container = document.querySelector('.almAcopio-view');
    // Asegurarnos que el contenedor esté visible
    container.style.display = 'flex';
    const isAdmin = window.rol === 'Administración';

    container.innerHTML = `
        <div class="title">
            <h3><i class="fas fa-warehouse"></i> Gestión de Almacen</h3>
        </div>
        <div class="alamcenGral-container">
            <div class="almacen-botones">

                ${isAdmin ? `<div class="cuadro-btn">
                    <button class="btn-agregar-pedido">
                        <i class="fas fa-plus-circle"></i>
                    </button>
                    <p>Agregar</p>
                </div>` : ''}

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
                <div class="cuadro-btn"><button class="btn-agregar-pedido">
                       <i class="fas fa-shopping-cart"></i>
                    </button>
                    <p>Pedidos</p>
                </div>
            </div>    
            <div class="lista-productos acopio-productos"></div>
        </div>
    `;


    const btnIngresos = container.querySelector('.btn-agregar-pedido i.fa-arrow-circle-up').parentElement;
    btnIngresos.onclick = () => mostrarFormularioIngresoAcopio('');

    const btnSalidas = container.querySelector('.btn-agregar-pedido i.fa-arrow-circle-down').parentElement;
    btnSalidas.onclick = () => mostrarFormularioSalidaAcopio();

    const btnPedidos = container.querySelector('.btn-agregar-pedido i.fa-shopping-cart').parentElement;
    btnPedidos.onclick = mostrarCarrito;

    mostrarProductosBruto();
    window.agregarAlCarrito = (nombre) => {
        carritoProductos.set(nombre, 1);

        // Disable the button
        const button = document.querySelector(`.btn-card.pedido[onclick*="${nombre}"]`);
        if (button) {
            button.classList.add('disabled');
            button.disabled = true;
        }

        // Update cart counter and animate
        updateCartCounter();
        const carritoAbierto = document.querySelector('.anuncio').style.display === 'flex';
        if (carritoAbierto) {
            mostrarCarrito(); // Actualiza la lista sin cerrar el modal
        }
    };
    if (isAdmin) {
        const btnAgregarAcopio = container.querySelector('.btn-agregar-pedido i.fa-plus-circle').parentElement;
        if (btnAgregarAcopio) {
            btnAgregarAcopio.onclick = () => mostrarFormularioAgregarAcopio('');
        }
    }
}
export function mostrarProductosBruto() {
    const container = document.querySelector('.acopio-productos');
    container.style.display = 'flex';

    container.innerHTML = `
           <div class="almacen-container">
            <div class="almacen-header">
                <div class="search-bar-acopio">
                    <input type="text" id="searchProductAcopio" placeholder="Buscar producto...">
                    <i class="fas fa-search search-icon-acopio"></i>
                </div>
                <div class="filter-options">
                    <button class="filter-btn" data-filter="all">
                        <i class="fas fa-sort-amount-down"></i> <p>100-0</p>
                    </button>
                    <button class="filter-btn giro" data-filter="low">
                        <i class="fas fa-sort-amount-up"></i> <p>0-100</p>
                    </button>
                    <button class="filter-btn" data-view="both" title="Mostrar ambos">
                        <i class="fas fa-boxes"></i> <p>Todos</p>
                    </button>
                    <button class="filter-btn" data-view="bruto" title="Solo Bruto">
                        <i class="fas fa-cubes"></i> <p>Prima</p>
                    </button>
                    <button class="filter-btn" data-view="prima" title="Solo Prima">
                        <i class="fas fa-box"></i> <p>Bruto</p>
                    </button>
                </div>
            </div>
            <div class="products-grid" id="productsContainer">
            </div>
        </div>
    `;

    // Call cargarAlmacen after creating the container
    cargarAlmacenBruto();

    document.getElementById('productsContainer').addEventListener('click', (e) => {
        const productCard = e.target.closest('.product-card');
        if (productCard) {
            const productId = productCard.dataset.id;
            const producto = window.productosAlmacen.find(p => p[0] === productId);
            if (producto) mostrarDetalleProductoAcopio(producto);
        }
    });

    function normalizarTexto(texto) {
        return texto.toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Elimina tildes
            .replace(/\s+/g, ' ')            // Reduce espacios múltiples a uno
            .trim();                         // Elimina espacios al inicio y final
    }

    const searchInput = document.getElementById('searchProductAcopio');
    const searchIcon = document.querySelector('.search-icon-acopio');
    searchInput.addEventListener('focus', () => {
        const almacenView = document.querySelector('.almAcopio-view');
        if (almacenView) {
            const searchBarPosition = searchInput.getBoundingClientRect().top + window.scrollY;
            almacenView.scrollTo({
                top: searchBarPosition - 70, // 20px offset from top
                behavior: 'smooth'
            });
        }
        searchIcon.style.color = '#f37500';
    });
    searchInput.addEventListener('blur', () => {
        searchIcon.style.color = 'gray';
    });
    searchInput.addEventListener('input', (e) => {
        const searchTerm = normalizarTexto(e.target.value);
        const products = document.querySelectorAll('.product-card');
        const productsContainer = document.getElementById('productsContainer');
        let productsFound = false;

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
            if (productName.includes(searchTerm)) {
                product.style.display = 'grid';
                productsFound = true;
            } else {
                product.style.display = 'none';
            }
        });

        // Show/hide no results message
        const noResultsMessage = document.querySelector('.no-results-message');
        if (!productsFound && searchTerm) {
            if (!noResultsMessage) {
                productsContainer.innerHTML += `
                    <div class="no-results-message" style="width: 100%; text-align: center; padding: 20px; color: var(--primary-text);">
                        <i class="fas fa-search" style="font-size: 40px; margin-bottom: 10px;"></i>
                        <p>No se encontraron productos que contengan "${e.target.value}..."</p>
                    </div>
                `;
            }
        } else {
            if (noResultsMessage) {
                noResultsMessage.remove();
            }
        }
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
            productCard.dataset.id = producto[0];
            productCard.onclick = (e) => {
                if (!e.target.closest('.btn-card')) {
                    mostrarDetalleProductoAcopio(producto);
                }
            };

            productCard.innerHTML = `
    <div class="product-info">
        <div class="product-name">
            
            <span>${nombre || 'Sin nombre'}</span>
        </div>   
        <div class="acciones-rapidas-acopio">
        <div class="product-quantity">

            <div class="registro-estado-acopio estado-bruto">${totalBruto.toFixed(1)}</div>
            <div class="registro-estado-acopio estado-prima">${totalPrima.toFixed(1)}</div>
        </div>    
                <button class="btn-card pedido ${carritoProductos.has(nombre) ? 'disabled' : ''}" 
                        onclick="event.stopPropagation(); agregarAlCarrito('${nombre}')"
                        ${carritoProductos.has(nombre) ? 'disabled' : ''}>
                    <i class="fas fa-cart-plus"></i>
                </button>
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
function mostrarCarrito() {
    const anuncio = document.querySelector('.anuncio');
    const contenido = anuncio.querySelector('.anuncio-contenido');

    if (carritoProductos.size === 0) {
        mostrarNotificacion('No hay productos en el carrito', 'warning');
        return;
    }

    let productosHTML = '';
    carritoProductos.forEach((cantidad, nombre) => {
        productosHTML += `
            <div class="producto-carrito" data-nombre="${nombre}">
                <div class="producto-info form-grup" style="margin-top:5px; position: relative;">
                    <div class="cantidad-control campo-form">
                        <p class="nombre">${nombre}</p>
                        <div class="cantidad-control">
                            <button class="btn-cantidad anuncio-btn red" style="min-width:30px; height:30px; border-radius:50%; font-size:20px; padding:0; display:flex; align-items:center; justify-content:center; margin:0 5px;" onclick="cambiarCantidad('${nombre}', -1)">-</button>
                            <input type="number" value="${cantidad}" min="1" 
                                onchange="actualizarCantidad('${nombre}', this.value)" style="text-align:center; width: 70px; border:1px solid gray;padding: 10px">
                            <button class="btn-cantidad anuncio-btn green" style="min-width:30px; height:30px; border-radius:50%; font-size:20px; padding:0; display:flex; align-items:center; justify-content:center; margin:0 5px;" onclick="cambiarCantidad('${nombre}', 1)">+</button>
                            <select class="unidad-medida" style="width: 50px">
                                <option value="unidades">und.</option>
                                <option value="cajas">cj.</option>
                                <option value="bolsas">bls.</option>
                                <option value="quintales">qq</option>
                                <option value="kilos">kg.</option>
                                <option value="arroba">@</option>
                                <option value="libras">lbrs.</option>
                            </select>
                        </div>
                        
                    </div>
                    <textarea class="observaciones-pedido" placeholder="Observaciones..." rows="2" style="border: 1px solid gray;"></textarea>
                    <button class="btn-eliminar" style="background: none; border:none; position: absolute; top: 10px; right: 10px;" onclick="eliminarDelCarrito('${nombre}')">
                        <i class="fas fa-trash" style="color: red"></i>
                    </button>
                </div>
            </div>
        `;
    });


    contenido.innerHTML = `

        <div class="encabezado">
        <h2>Lista de pedidos</h2>
            <button class="anuncio-btn close" onclick="ocultarAnuncio()">
                <i class="fas fa-arrow-right"></i></button>
        </div>
        <div class="relleno">
            <div class="productos-carrito">
                ${productosHTML}
            </div>
        </div>
        <div class="anuncio-botones">
            <button class="anuncio-btn green finalizar" onclick="finalizarPedidosCarrito()">
                <i class="fas fa-check"></i> Finalizar Pedidos
            </button>
        </div>
    `;

    mostrarAnuncio();
}
function updateCartCounter() {
    const cartButton = document.querySelector('.btn-agregar-pedido i.fa-shopping-cart').parentElement;
    const cartSize = carritoProductos.size;

    // Remove existing counter if present
    const existingCounter = cartButton.querySelector('.cart-counter');
    if (existingCounter) {
        existingCounter.remove();
    }

    if (cartSize > 0) {
        // Add counter
        cartButton.insertAdjacentHTML('beforeend', `
            <span class="cart-counter">${cartSize}</span>
        `);

        // Add success color
        cartButton.classList.add('has-items');

        // Force reflow and trigger animation
        cartButton.classList.remove('bell-animation');
        void cartButton.offsetWidth; // Force reflow
        cartButton.classList.add('bell-animation');
    } else {
        cartButton.classList.remove('has-items', 'bell-animation');
    }
}
window.cambiarCantidad = (nombre, delta) => {
    const cantidad = (carritoProductos.get(nombre) || 0) + delta;
    if (cantidad >= 1) {
        carritoProductos.set(nombre, cantidad);
        const input = document.querySelector(`.producto-carrito[data-nombre="${nombre}"] input[type="number"]`);
        if (input) {
            input.value = cantidad;
        }
    }
};

window.actualizarCantidad = (nombre, valor) => {
    const cantidad = parseInt(valor) || 1;
    if (cantidad >= 1) {
        carritoProductos.set(nombre, cantidad);
        const input = document.querySelector(`.producto-carrito[data-nombre="${nombre}"] input[type="number"]`);
        if (input) {
            input.value = cantidad;
        }
    }
};

window.eliminarDelCarrito = (nombre) => {
    const productoElement = document.querySelector(`.producto-carrito[data-nombre="${nombre}"]`);
    if (productoElement) {
        // Animate removal
        productoElement.style.transition = 'all 0.3s ease';
        productoElement.style.opacity = '0';
        productoElement.style.height = '0';
        productoElement.style.margin = '0';
        productoElement.style.padding = '0';

        setTimeout(() => {
            productoElement.remove();
            carritoProductos.delete(nombre);

            // Reset the original add-to-cart button
            const button = document.querySelector(`.btn-card.pedido[onclick*="${nombre}"]`);
            if (button) {
                button.classList.remove('disabled');
                button.disabled = false;
            }

            updateCartCounter();

            // Close modal if cart is empty
            if (carritoProductos.size === 0) {
                ocultarAnuncio();
            }
        }, 300);
    }
};

window.finalizarPedidosCarrito = async () => {
    try {
        mostrarCarga();
        const pedidos = [];
        let mensajeWhatsApp = "PEDIDO DE MATERIA PRIMA\n\nPedido:\n";

        carritoProductos.forEach((cantidad, nombre) => {
            const unidad = document.querySelector(`.producto-carrito[data-nombre="${nombre}"] .unidad-medida`).value;
            const observaciones = document.querySelector(`.producto-carrito[data-nombre="${nombre}"] .observaciones-pedido`).value;

            pedidos.push({
                nombre,
                cantidad: `${cantidad} ${unidad}`,
                fecha: new Date().toLocaleDateString('es-ES'),
                observaciones: observaciones || ''
            });

            // Agregar al mensaje de WhatsApp
            mensajeWhatsApp += `• ${nombre} - ${cantidad} ${unidad}`;
            if (observaciones) {
                mensajeWhatsApp += ` (${observaciones})`;
            }
            mensajeWhatsApp += '\n';
        });

        // Agregar pie de mensaje
        mensajeWhatsApp += '\nEl pedido ya se encuentra en la aplicación de InnoPro';

        const response = await fetch('/finalizar-pedidos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ pedidos })
        });

        const data = await response.json();
        if (data.success) {
            mostrarNotificacion('Pedidos finalizados correctamente', 'success');
            carritoProductos.clear();
            ocultarAnuncio();

            // Codificar el mensaje para URL y abrir WhatsApp
            const mensajeCodificado = encodeURIComponent(mensajeWhatsApp);
            window.open(`https://wa.me/?text=${mensajeCodificado}`, '_blank');
        } else {
            throw new Error(data.error || 'Error al finalizar los pedidos');
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarNotificacion('Error al finalizar los pedidos', 'error');
    } finally {
        ocultarCarga();
        inicializarAlmacen();
        cargarRegistrosAcopio();
    }
};

/* =============== FUNCIONES DE DETALLES Y EDICION DE PRODUCTOSA DEL ALMACEN =============== */
window.mostrarDetalleProductoAcopio = function (producto) {
    const isAdmin = window.rol === 'Administración';
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
        <div class="encabezado">
        <h2>Detalles del producto</h2>
         <button class="anuncio-btn close" onclick="ocultarAnuncio()">
            <i class="fas fa-arrow-right"></i></button>
    </div>
        <div class="relleno">
            <div class="producto-detalles">
                <div class="detalle-seccion">
                    <p class="subtitle">Información General:</p>               
                    <div class="detalles-grup">
                        <div class="detalle-item">
                            <p>Nombre:</p> <span>${nombre}</span>
                        </div>
                    </div>
                    <p class="subtitle">Materia Bruta:</p>  
                    <div class="detalles-grup">
                        ${formatearPesoLote(pesoBrutoLote)}
                    </div>
                    <p class="subtitle">Materia Prima:</p>  
                    <div class="detalles-grup">
                        ${formatearPesoLote(pesoPrimaLote)}
                    </div>
                </div>
                <div class="detalles-edicion relleno" style="display:none"></div>
            </div>
        </div>
        <div class="anuncio-botones">
            <button class="anuncio-btn blue editar"><i class="fas fa-edit"></i> Editar</button>
            <button class="anuncio-btn green guardar" style="display: none;"><i class="fas fa-save"></i> Guardar</button>
            ${isAdmin ? '<button class="anuncio-btn red eliminar"><i class="fas fa-trash"></i> Eliminar</button>' : ''}
        </div>
    `;

    mostrarAnuncio();

    const btnEditar = contenido.querySelector('.editar');
    const btnGuardar = contenido.querySelector('.guardar');
    btnEditar.onclick = () => {
        editarProductoAcopio(producto);
    };

    anuncio.querySelector('.eliminar').onclick = () => {
        mostrarConfirmacionEliminar(id, nombre);
    };

    
};
window.editarProductoAcopio = function (producto) {
    const [id, nombre, pesoBrutoLote, pesoPrimaLote] = producto;
    const anuncio = document.querySelector('.anuncio');
    const contenido = anuncio.querySelector('.anuncio-contenido');
    const detallesEdicion = contenido.querySelector('.detalles-edicion');
    const btnEditar = contenido.querySelector('.editar');
    const btnGuardar = contenido.querySelector('.guardar');
    const detallesGrup = contenido.querySelector('.detalle-seccion');

    detallesEdicion.innerHTML = `
        <p class="subtitle">Información:</p> 
            <p>Nombre del producto</p>
            <input type="text" id="editNombre" value="${nombre}" class="edit-input">


        <p class="subtitle">Materia Bruta:</p>
            <div class="form-grup" style="background:none">
                <div class="detalle-item">
                    <input type="number" step="0.01" id="nuevoPesoBruto" class="edit-input" placeholder="Peso (kg)">
                    <input type="number" id="nuevoLoteBruto" class="edit-input" placeholder="Lote">
                    <i class="fas fa-plus-circle add add-peso-bruto"></i>
                </div>
            </div>
            <div id="materiaBrutaEntries" style="background:none">
                ${pesoBrutoLote ? pesoBrutoLote.split(';').map((item, index) => {
        const [peso, lote] = item.split('-').map(val => val.trim());
        const pesoFormateado = peso.replace(',', '.');
        return `
                        <div class="campo-form entrada-peso" data-index="${index}" style="background:none">
                            <div class="detalle-item" style="background:none">
                                <input type="number" step="0.01" id="editPesoBruto_${index}" value="${pesoFormateado}" class="edit-input" placeholder="Peso">
                                <input type="number" id="editLoteBruto_${index}" value="${lote}" class="edit-input" placeholder="Lote">
                                <i class="fas fa-trash delete delete-entry" data-type="bruto"></i>
                            </div>
                        </div>`;
    }).join('') : ''}
            </div>

        <p class="subtitle">Materia Prima:</p>
            
            <div class="form-grup" style="background:none">
                <div class="detalle-item">
                    <input type="number" step="0.01" id="nuevoPesoPrima" class="edit-input" placeholder="Peso (kg)">
                    <input type="number" id="nuevoLotePrima" class="edit-input" placeholder="Lote">
                    <i class="fas fa-plus-circle add add-peso-prima"></i>
                </div>
            </div>
            <div id="materiaPrimaEntries" style="background:none">
                ${pesoPrimaLote ? pesoPrimaLote.split(';').map((item, index) => {
        const [peso, lote] = item.split('-').map(val => val.trim());
        const pesoFormateado = peso.replace(',', '.');
        return `
                            <div class="campo-form entrada-peso" data-index="${index}" style="background:none">
                            <div class="detalle-item" style="background:none">
                                <input type="number" step="0.01" id="editPesoPrima_${index}" value="${pesoFormateado}" class="edit-input" placeholder="Peso">
                                <input type="number" id="editLotePrima_${index}" value="${lote}" class="edit-input" placeholder="Lote">
                                <i class="fas fa-trash delete delete-entry" data-type="prima"></i>
                            </div>
                        </div>`;
    }).join('') : ''}
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

    setupEntryHandlers();
    setupGuardarHandler(id);
};

/* =============== FUNCIONES DE AGREGAR UN NUEVO PRODUCTO Y ELIMINAR =============== */
function mostrarConfirmacionEliminar(id, nombre) {
    const anuncio = document.querySelector('.anuncio-down');
    const contenido = anuncio.querySelector('.anuncio-contenido');

    contenido.innerHTML = `
        <div class="encabezado">
            <h2>Eliminar?</h2>
                <button class="anuncio-btn close" onclick="ocultarAnuncioDown()">
                    <i class="fas fa-arrow-right"></i></button>
        </div>
        <div class="detalles-grup center">
            <p>¿Está seguro que desea eliminar el producto "${nombre}"?</p>
            <p>Esta acción no se puede deshacer.</p>
        </div>
        <div class="anuncio-botones">
            <button class="anuncio-btn red confirmar-eliminar">Eliminar</button>
        </div>
    `;

    mostrarAnuncioDown();
    ocultarAnuncio();

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
            <div class="campo-form entrada-peso" data-index="${nuevoIndex}" style="background:none">
                <div class="detalle-item" style="background:none">
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
            <div class="campo-form entrada-peso" data-index="${nuevoIndex}" style="background:none">
                <div class="detalle-item" style="background:none">
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
                ocultarAnuncio()
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
        <div class="encabezado">
            <h2>Nuevo Producto</h2>
            <button class="anuncio-btn close" onclick="ocultarAnuncio()">
                <i class="fas fa-arrow-right"></i></button>
        </div>
        <div class="relleno">
                <p class="subtitle">Nombre del Producto</p>
                <input type="text" id="nuevoNombre" class="edit-input" placeholder="Nombre del producto" required>
                
                <p class="subtitle">Materia Bruta</p>
                <div class="form-grup" style="background:none">
                    <div class="detalle-item" style="background:none">
                        <input type="number" step="0.01" id="nuevoPesoBruto" class="edit-input" placeholder="Peso (kg)">
                        <input type="number" id="nuevoLoteBruto" class="edit-input" placeholder="Lote">
                        <i class="fas fa-plus-circle add add-peso-bruto"></i>
                    </div>
                </div>
                <div id="materiaBrutaEntries"></div>

                <p class="subtitle">Materia Prima</p>
                <div class="form-grup" style="background:none">
                    <div class="detalle-item" style="background:none">
                        <input type="number" step="0.01" id="nuevoPesoPrima" class="edit-input" placeholder="Peso (kg)">
                        <input type="number" id="nuevoLotePrima" class="edit-input" placeholder="Lote">
                        <i class="fas fa-plus-circle add add-peso-prima"></i>
                    </div>
                </div>
                <div id="materiaPrimaEntries"></div>
        </div>
        <div class="anuncio-botones">
            <button class="anuncio-btn green guardar"><i class="fas fa-save"></i> Guardar</button>
        </div>
    `;

    mostrarAnuncio();

    setupEntryHandlers();


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
                ocultarAnuncio();
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


let listaIngresos = [];
/* =============== FUNCIONES DE INGRESO Y SALDIAS DEL ALMACEN ACOPIO =============== */
export function mostrarFormularioIngresoAcopio(productoSeleccionado = '') {
    if (!window.productosAlmacen) {
        mostrarNotificacion('Error: No se han cargado los productos', 'error');
        return;
    }
    const anuncio = document.querySelector('.anuncio');
    const anuncioContenido = anuncio.querySelector('.anuncio-contenido');

    anuncioContenido.innerHTML = `
        <div class="encabezado">
            <h2>Nuevo ingreso</h2>
            <button class="anuncio-btn close" onclick="ocultarAnuncio()">
                <i class="fas fa-arrow-right"></i></button>
        </div>
        <div class="relleno">
                <p>Nombre del producto</p>
                <div class="autocomplete-container">
                    <input type="text" id="productoIngreso" class="edit-input" 
                           placeholder="Escriba para buscar..." 
                           value="${productoSeleccionado}" required>
                    <div class="sugerencias-container">
                        <div id="sugerencias-productos" class="sugerencias-list"></div>
                    </div>
                </div>


                <p>Tipo de materia</p>
                <select id="tipoIngreso" class="edit-input" required>
                    <option value="bruto">Materia Bruta</option>
                    <option value="prima">Materia Prima</option>
                </select>

                <p>Peso (kg)</p>
                <input type="number" step="0.1" id="pesoIngreso" class="edit-input" placeholder="Ingresa el peso. Ej: 12" required>

                <p>Lote (Autogenerado)</p>
                <input type="text" id="loteIngreso" class="edit-input" readonly>

                <p>Razón:</p>
                <textarea style="min-height:100px" id="razonIngreso" class="edit-input" placeholder="Ingresa una razon del ingreso" required></textarea>

        </div>
        <div class="anuncio-botones">
            <button class="anuncio-btn green procesar">
                <i class="fas fa-check"></i> Procesar Ingreso
            </button>
        </div>
    `;
    mostrarAnuncio();

    const inputProducto = document.getElementById('productoIngreso');
    const sugerenciasLista = document.getElementById('sugerencias-productos');
    const tipoSelect = document.getElementById('tipoIngreso');
    const loteInput = document.getElementById('loteIngreso');


    inputProducto.addEventListener('input', () => {
        const busqueda = inputProducto.value.toLowerCase();
        const productos = window.productosAlmacen || [];

        // Clear suggestions if input is empty
        if (!busqueda) {
            sugerenciasLista.innerHTML = '';
            sugerenciasLista.style.display = 'none';
            return;
        }

        // Filter and show matching products
        const sugerencias = productos
            .map(producto => producto[1])
            .filter(nombre => nombre.toLowerCase().includes(busqueda));

        if (sugerencias.length > 0) {
            sugerenciasLista.innerHTML = sugerencias
                .map(nombre => `<li class="sugerencia-item">${nombre}</li>`)
                .join('');
            sugerenciasLista.style.display = 'flex';

            // Add click handlers to suggestions
            sugerenciasLista.querySelectorAll('.sugerencia-item').forEach(item => {
                item.addEventListener('click', () => {
                    inputProducto.value = item.textContent;
                    sugerenciasLista.style.display = 'none';
                    actualizarLote();
                });
            });
        } else {
            sugerenciasLista.innerHTML = '<div class="sugerencia-item no-results">No se encontraron productos</div>';
            sugerenciasLista.style.display = 'block';
        }
    });

    // Close suggestions when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.autocomplete-container')) {
            sugerenciasLista.style.display = 'none';
        }
    });


    // Función para obtener el siguiente número de lote
    const getNextLote = () => {
        const producto = window.productosAlmacen?.find(p => p[1] === inputProducto.value);
        if (!producto) return '1';

        const columnaIndex = tipoSelect.value === 'bruto' ? 2 : 3;
        const lotesExistentes = (producto[columnaIndex] || '').split(';')
            .map(item => parseInt(item.split('-')[1]) || 0);

        return Math.max(0, ...lotesExistentes) + 1;
    };

    // Actualizar lote cuando cambie el producto o tipo
    const actualizarLote = () => {
        if (inputProducto.value && tipoSelect.value) {
            loteInput.value = getNextLote();
        }
    };

    tipoSelect.addEventListener('change', actualizarLote);

    // Set initial lote if producto is preselected
    if (productoSeleccionado) {
        actualizarLote();
    }


    // Rest of your existing code...
    const btnProcesar = anuncioContenido.querySelector('.procesar');

    btnProcesar.onclick = async () => {
        try {
            const producto = document.getElementById('productoIngreso').value;
            const tipo = tipoSelect.value;
            const peso = document.getElementById('pesoIngreso').value;
            const lote = loteInput.value;
            const razon = document.getElementById('razonIngreso').value;

            if (!producto || !tipo || !peso || !razon) {
                mostrarNotificacion('Por favor complete todos los campos', 'error');
                return;
            }

            mostrarCarga();

            // Procesar el ingreso
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

            // Registrar el movimiento
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

            // Show ingress summary instead of closing the modal
            mostrarResumenIngreso({
                nombre: producto,
                tipo: tipo,
                peso: peso,  // Cambiamos el nombre de la propiedad
                lote: lote,
                observaciones: razon
            });

            cargarAlmacenBruto();
        } catch (error) {
            console.error('Error:', error);
            mostrarNotificacion(error.message, 'error');
        } finally {
            ocultarCarga();
        }
    };
}
window.mostrarFormularioIngresoAcopio = mostrarFormularioIngresoAcopio;
export async function mostrarFormularioSalidaAcopio() {
    const anuncio = document.querySelector('.anuncio');
    const contenido = anuncio.querySelector('.anuncio-contenido');

    contenido.innerHTML = `
        <div class="encabezado">
            <h2>Nueva salida</h2>
            <button class="anuncio-btn close" onclick="ocultarAnuncio()">
                <i class="fas fa-arrow-right"></i></button>
        </div>
        <div class="relleno">

                <p>Nombre del producto</p>
                <div class="autocomplete-container">
                    <input type="text" id="productoIngreso" class="edit-input" 
                           placeholder="Escriba para buscar..." 
                           value="" required>
                    <div class="sugerencias-container">
                        <div id="sugerencias-productos" class="sugerencias-list"></div>
                    </div>
                </div>


                <p>Tipo de materia</p>
                <select id="tipoSalida" class="edit-input" required>
                    <option value="bruto">Materia Bruta</option>
                    <option value="prima">Materia Prima</option>
                </select>

                <p>Lote (Seleccione uno disponible)</p>
                <select id="loteSalida" class="edit-input" required>
                    <option value="">Seleccione un lote</option>
                </select>

                <p>Peso (kg)</p>
                <input type="number" step="0.1" id="pesoSalida" class="edit-input" placeholder="Ingrese el peso. Ej: 13" required>

                <p>Operador</p>
                <input type="text" id="operarioSalida" class="edit-input" required>

                <p>Razón</p>
                <textarea id="razonSalida" class="edit-input" placeholder="Ingrese la razón" required></textarea>

        </div>
        <div class="anuncio-botones">
            <button class="anuncio-btn green procesar">Procesar Salida</button>
        </div>
    `;

    // Manejar cambios en producto y tipo para actualizar lotes
    const inputProducto = document.getElementById('productoIngreso');
    const sugerenciasLista = document.getElementById('sugerencias-productos');
    const tipoSelect = document.getElementById('tipoSalida');
    const loteSelect = document.getElementById('loteSalida');

    inputProducto.addEventListener('input', () => {
        const busqueda = inputProducto.value.toLowerCase();
        const productos = window.productosAlmacen || [];

        // Clear suggestions if input is empty
        if (!busqueda) {
            sugerenciasLista.innerHTML = '';
            sugerenciasLista.style.display = 'none';
            return;
        }

        // Filter and show matching products
        const sugerencias = productos
            .map(producto => producto[1])
            .filter(nombre => nombre.toLowerCase().includes(busqueda));

        if (sugerencias.length > 0) {
            sugerenciasLista.innerHTML = sugerencias
                .map(nombre => `<li class="sugerencia-item">${nombre}</li>`)
                .join('');
            sugerenciasLista.style.display = 'flex';

            // Add click handlers to suggestions
            sugerenciasLista.querySelectorAll('.sugerencia-item').forEach(item => {
                item.addEventListener('click', () => {
                    inputProducto.value = item.textContent;
                    sugerenciasLista.style.display = 'none';
                    actualizarLote();
                });
            });
        } else {
            sugerenciasLista.innerHTML = '<div class="sugerencia-item no-results">No se encontraron productos</div>';
            sugerenciasLista.style.display = 'block';
        }
    });

    // Close suggestions when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.autocomplete-container')) {
            sugerenciasLista.style.display = 'none';
        }
    });


    // ... existing code ...
    const actualizarLotes = () => {
        const producto = window.productosAlmacen?.find(p => p[1] === inputProducto.value);
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


    inputProducto.addEventListener('change', actualizarLotes);
    tipoSelect.addEventListener('change', actualizarLotes);


    sugerenciasLista.addEventListener('click', (e) => {
        if (e.target.classList.contains('sugerencia-item')) {
            setTimeout(actualizarLotes, 100); // Pequeño delay para asegurar que el valor del input se actualizó
        }
    });

    tipoSelect.onchange = actualizarLotes;

    mostrarAnuncio();


    contenido.querySelector('.procesar').onclick = async () => {
        try {
            const producto = document.getElementById('productoIngreso').value; // Este es el ID correcto
            const tipo = document.getElementById('tipoSalida').value;
            const lote = document.getElementById('loteSalida').value;
            const peso = document.getElementById('pesoSalida').value;
            const operario = document.getElementById('operarioSalida').value;
            const razon = document.getElementById('razonSalida').value;

            if (!producto || !tipo || !lote || !peso || !operario || !razon) {
                mostrarNotificacion('Por favor complete todos los campos', 'warning');
                return;
            }

            // Validar que el producto exista
            const productoExiste = window.productosAlmacen?.some(p => p[1] === producto);
            if (!productoExiste) {
                mostrarNotificacion('El producto seleccionado no es válido', 'error');
                return;
            }

            mostrarCarga();

            // Registrar el movimiento
            const movimientoResponse = await fetch('/registrar-movimiento-acopio', {
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

            if (!movimientoResponse.ok) {
                throw new Error('Error al registrar el movimiento');
            }

            // Procesar la salida
            const salidaResponse = await fetch('/procesar-salida-acopio', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ producto, tipo, peso, lote })
            });

            const data = await salidaResponse.json();
            if (data.success) {
                mostrarNotificacion('Salida procesada correctamente', 'success');
                ocultarAnuncio();
                cargarAlmacenBruto();
            } else {
                throw new Error(data.error || 'Error al procesar la salida');
            }
        } catch (error) {
            console.error('Error:', error);
            mostrarNotificacion(error.message, 'error');
        } finally {
            ocultarCarga();
        }
    };

}
function mostrarResumenIngreso(productoIngresado) {
    // Agregar el nuevo ingreso a la lista
    listaIngresos.push(productoIngresado);

    const anuncio = document.querySelector('.anuncio');
    const contenido = anuncio.querySelector('.anuncio-contenido');

    contenido.innerHTML = `
        <div class="encabezado">
            <h2>Ingresos Registrados</h2>
            <button class="anuncio-btn close" onclick="ocultarAnuncio()">
                <i class="fas fa-arrow-right"></i>
            </button>
        </div>
        <div class="relleno">
            <div class="detalles-grup">
                ${listaIngresos.map(producto => `
                    <div class="producto-ingresado">
                        <p class="subtitle">Detalles del ingreso:</p>
                        <div class="detalle-item">
                            <p>Producto:</p>
                            <span>${producto.nombre}</span>
                        </div>
                        <div class="detalle-item">
                            <p>Peso ${producto.tipo === 'bruto' ? 'Bruto' : 'Prima'}:</p>
                            <span>${producto.peso} kg</span>
                        </div>
                        <div class="detalle-item">
                            <p>Lote:</p>
                            <span>${producto.lote}</span>
                        </div>
                        ${producto.observaciones ? `
                            <div class="detalle-item">
                                <p>Observaciones:</p>
                                <span>${producto.observaciones}</span>
                            </div>
                        ` : ''}
                        <hr style="margin: 10px 0;">
                    </div>
                `).join('')}
            </div>
        </div>
        <div class="anuncio-botones">
            <button class="anuncio-btn red" onclick="limpiarListaIngresos()">
                <i class="fas fa-trash"></i> Limpiar
            </button>
            <button class="anuncio-btn blue" onclick="mostrarFormularioIngresoAcopio()">
                <i class="fas fa-plus"></i> Seguir
            </button>
            <button class="anuncio-btn green" onclick="compartirListaWhatsApp()">
                <i class="fab fa-whatsapp"></i> Enviar
            </button>
        </div>
    `;

    mostrarAnuncio();
}

window.limpiarListaIngresos = () => {
    listaIngresos = [];
    mostrarNotificacion('Lista de ingresos limpiada', 'success');
    ocultarAnuncio();
};
window.compartirListaWhatsApp = compartirListaWhatsApp;

function compartirListaWhatsApp() {
    let mensajeWhatsApp = "INGRESOS DE MATERIA PRIMA\n\n";

    listaIngresos.forEach((producto, index) => {
        mensajeWhatsApp += `=== Ingreso ${index + 1} ===\n`;
        mensajeWhatsApp += `Producto: ${producto.nombre}\n`;
        mensajeWhatsApp += `Peso: ${producto.peso} kg\n`;
        if (producto.observaciones) {
            mensajeWhatsApp += `Observaciones: ${producto.observaciones}\n`;
        }
        mensajeWhatsApp += '\n';
    });

    mensajeWhatsApp += '\nRegistrado en la aplicación de InnoPro';

    const mensajeCodificado = encodeURIComponent(mensajeWhatsApp);
    window.open(`https://wa.me/?text=${mensajeCodificado}`, '_blank');
}

