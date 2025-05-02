/* ==================== FUNCIONES DE INICIO DE ALMACEN ==================== */
let productosParaIngresar = new Map();
let productosParaSalida = new Map();
async function obtnerMiRol() {
    const userResponse = await fetch('/obtener-mi-rol');
    const userData = await userResponse.json();
    window.rol = userData.rol;
}
obtnerMiRol();
export async function inicializarAlmacenGral() {
    const container = document.querySelector('.almacen-view');
    const isAdmin = window.rol === 'Administración';
    if (!container) return;
    container.innerHTML = '';
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
                        <i class="fas fa-clipboard-check"></i>
                    </button>
                    <p>Conteo</p>
                </div>
                ${isAdmin ? `<div class="cuadro-btn">
                    <button class="btn-agregar-pedido">
                        <i class="fas fa-box"></i>
                    </button>
                    <p>Agregar</p>
                </div>` : ''}
                ${isAdmin ? `<div class="cuadro-btn">
                    <button class="btn-agregar-pedido">
                        <i class="fas fa-cog"></i>
                    </button>
                    <p>Formato</p>
                </div>` : ''}
                ${isAdmin ? `<div class="cuadro-btn">
                    <button class="btn-agregar-pedido">
                        <i class="fas fa-dollar-sign"></i>
                    </button>
                    <p>Precios</p>
                </div>` : ''}
            </div>    
            <div class="almacen-general-productos"></div>
        </div>
    `;

    const btnIngresar = container.querySelector('.btn-agregar-pedido i.fa-arrow-circle-down').parentElement;
    btnIngresar.onclick = mostrarListaIngresos;

    const btnSalidas = container.querySelector('.btn-agregar-pedido i.fa-arrow-circle-up').parentElement;
    btnSalidas.onclick = mostrarListaSalidas;

    const btnConteo = container.querySelector('.btn-agregar-pedido i.fa-clipboard-check').parentElement;
    btnConteo.onclick = mostrarFormularioConteo;

    if (isAdmin) {
        const btnAgregar = container.querySelector('.btn-agregar-pedido i.fa-box').parentElement;
        if (btnAgregar) {
            btnAgregar.onclick = mostrarFormularioAgregarProducto;
        }
    }

    if (isAdmin) {
        const btnFormato = container.querySelector('.btn-agregar-pedido i.fa-cog').parentElement;
        if (btnFormato) {
            btnFormato.onclick = mostrarFormularioFormato;
        }
    }

    if (isAdmin) {
        const btnPrecios = container.querySelector('.btn-agregar-pedido i.fa-dollar-sign').parentElement;
        if (btnPrecios) {
            btnPrecios.onclick = () => mostrarFormularioPrecios('');
        }
    }



    await cargarAlmacen(); // Ensure data is loaded before showing products
    mostrarProductos();

    console.log("Almacen General Initialized");
};

export async function cargarAlmacen() {
    try {
        mostrarCarga();
        const response = await fetch('/obtener-almacen-general');
        const data = await response.json();

        if (!data.pedidos || data.pedidos.length === 0) {
            throw new Error(data.error || 'Error al cargar los productos');
        }
        window.almacen = data.pedidos;

        const productsContainer = document.getElementById('productsContainer-general');
        if (!productsContainer) {
            return;
        }

        window.productosAlmacen = data.pedidos;
        productsContainer.innerHTML = '';

        data.pedidos.slice(1).forEach(producto => {
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
            productCard.dataset.id = id;
            productCard.dataset.tags = (producto[8] || '') // Asegurar manejo de mayúsculas y espacios
                .split(';')
                .map(tag => tag.trim().toLowerCase())
                .join(';');
            productCard.onclick = () => mostrarDetalleProductoGral(producto);
            productCard.innerHTML = `
                <div class="product-info">
                    <div class="product-name">
                        <span>${nombre} ${gramaje} gr.</span>
                    </div>   
                    
                    <div class="acciones-rapidas">
                        <div class="product-quantity">
                            ${stock} und.
                        </div>
                        <button class="btn-card ingreso" onclick="event.stopPropagation(); agregarAIngresos('${id}', '${nombre}', ${gramaje})">
                            <i class="fas fa-arrow-circle-down"></i>
                        </button>
                        <button class="btn-card salida" onclick="event.stopPropagation(); agregarASalidas('${id}', '${nombre}', ${gramaje}, ${stock})">
                            <i class="fas fa-arrow-circle-up"></i>
                        </button>
                    </div>
                </div>
            `;

            productsContainer.appendChild(productCard);
        });

        const etiquetasContainer = document.querySelector('.filter-options-almacenGral');
        if (etiquetasContainer) {
            etiquetasContainer.innerHTML = obtenerEtiquetas();
            console.log("Etiquetas updated");
        }

    } catch (error) {
        mostrarNotificacion('Error al cargar los productos', 'error');
    } finally {
        ocultarCarga();
        scrollToTop('.almacen-view')
    }
};

function obtenerEtiquetas() {
    if (!window.productosAlmacen || window.productosAlmacen.length === 0) {
        return '<p>No hay etiquetas disponibles</p>';
    }

    // Limpiar y normalizar tags
    const etiquetas = window.productosAlmacen
        .flatMap(producto => (producto[8] || '').split(';'))
        .map(tag => tag.trim().toLowerCase())
        .filter(tag => tag.length > 0);

    // Eliminar duplicados usando Set
    const etiquetasUnicas = [...new Set(etiquetas)].sort();

    if (etiquetasUnicas.length === 0) {
        return '<p>No hay etiquetas disponibles</p>';
    }

    return `
        <button class="filter-btn-acopio active" data-tag="all">
            <i class="fas fa-layer-group"></i> <p>Todos</p>
        </button>
        ${etiquetasUnicas.map(tag => `
        <button class="filter-btn-acopio" data-tag="${tag}">
            <i class="fas fa-tag"></i> <p>${tag.charAt(0).toUpperCase() + tag.slice(1)}</p>
        </button>
        `).join('')}
    `;
}
window.agregarAIngresos = (id, nombre, gramaje) => {
    const button = document.querySelector(`.btn-card.ingreso[onclick*="${id}"]`);
    const anuncio = document.querySelector('.anuncio');
    const listaProductos = document.querySelector('.carrito-productos2');

    if (productosParaIngresar.has(id)) {
        // Si el producto existe, lo removemos
        productosParaIngresar.delete(id);
        if (button) {
            button.classList.remove('active', 'disabled');
            button.style.backgroundColor = '';
            button.style.color = '';
            button.disabled = false;
        }
        // Si la lista está abierta, removemos el elemento
        const itemExistente = document.querySelector(`.carrito-item[data-id="${id}"]`);
        if (itemExistente) itemExistente.remove();
    } else {
        // Agregamos el nuevo producto
        productosParaIngresar.set(id, { nombre, gramaje, cantidad: 1 });
        if (button) {
            button.classList.add('active', 'disabled');
            button.style.backgroundColor = '#808080'; // Changed to gray
            button.style.color = '#fff';
            button.disabled = true;
        }

        // Si la lista está abierta, agregamos el nuevo elemento
        if (anuncio.style.display !== 'none' && listaProductos) {
            const nuevoItem = document.createElement('div');
            nuevoItem.className = 'carrito-item form-grup';
            nuevoItem.dataset.id = id;
            nuevoItem.style = 'margin-top:5px; position: relative;';
            nuevoItem.innerHTML = `
                    
                <div class="item-actions campo-form">
                <p>${nombre} ${gramaje}gr</p>
                    <div class="cantidad-control">
                        <button class="btn-cantidad anuncio-btn red" style="min-width:30px; height:30px; border-radius:50%; font-size:20px; padding:0; display:flex; align-items:center; justify-content:center; margin:0 5px;" onclick="actualizarCantidadIngreso('${id}', 'restar')">
                            -
                        </button>
                        <input type="number" value="1" min="1" 
                            onchange="actualizarCantidadIngreso('${id}', this.value)" style="text-align:center; width: 70px; border:1px solid gray;padding: 10px">
                        <button class="btn-cantidad anuncio-btn green" style="min-width:30px; height:30px; border-radius:50%; font-size:20px; padding:0; display:flex; align-items:center; justify-content:center; margin:0 5px;" onclick="actualizarCantidadIngreso('${id}', 'sumar')">
                            +
                        </button>
                    </div>
                    <button class="btn-eliminar" style="background: none; border:none; position: absolute; top: -10px; left: 10px;" onclick="eliminarDeIngresos('${id}')">
                                <p style="color: red;font-size: 25px;">-</p>
                            </button>
                </div>
            `;
            listaProductos.appendChild(nuevoItem);
        } else {

        }
    }
    actualizarContadorIngresos();
};

window.agregarASalidas = (id, nombre, gramaje, stockActual) => {
    const button = document.querySelector(`.btn-card.salida[onclick*="${id}"]`);
    const anuncio = document.querySelector('.anuncio');
    const listaProductos = document.querySelector('.carrito-productos');

    if (productosParaSalida.has(id)) {
        // Si el producto existe, lo removemos
        productosParaSalida.delete(id);
        if (button) {
            button.classList.remove('active', 'disabled');
            button.style.backgroundColor = '';
            button.style.color = '';
            button.disabled = false;
        }
        // Si la lista está abierta, removemos el elemento
        const itemExistente = document.querySelector(`.carrito-item[data-id="${id}"]`);
        if (itemExistente) itemExistente.remove();
    } else {
        // Agregamos el nuevo producto
        productosParaSalida.set(id, { nombre, gramaje, cantidad: 1, stockActual });
        if (button) {
            button.classList.add('active', 'disabled');
            button.style.backgroundColor = '#808080'; // Changed to gray
            button.style.color = '#fff';
            button.disabled = true;
        }

        // Si la lista está abierta, agregamos el nuevo elemento
        if (anuncio.style.display !== 'none' && listaProductos) {
            const nuevoItem = document.createElement('div');
            nuevoItem.className = 'carrito-item form-grup';
            nuevoItem.dataset.id = id;
            nuevoItem.style = 'margin-top:5px; position: relative;';
            nuevoItem.innerHTML = `
                   
                <div class="item-actions campo-form">
                 <p>${nombre} ${gramaje}gr</p>
                    <div class="cantidad-control">
                        <button class="btn-cantidad anuncio-btn red" style="min-width:30px; height:30px; border-radius:50%; font-size:20px; padding:0; display:flex; align-items:center; justify-content:center; margin:0 5px;" onclick="actualizarCantidadSalida('${id}', 'restar')">
                            -
                        </button>
                        <input type="number" value="1" min="1" max="${stockActual}"
                            onchange="actualizarCantidadSalida('${id}', this.value)" style="text-align:center; width: 70px; border:1px solid gray;padding:10px">
                        <button class="btn-cantidad anuncio-btn green" style="min-width:30px; height:30px; border-radius:50%; font-size:20px; padding:0; display:flex; align-items:center; justify-content:center; margin:0 5px;" onclick="actualizarCantidadSalida('${id}', 'sumar')">
                            +
                        </button>
                    </div>
                    <button class="btn-eliminar" style="background: none; border:none; position: absolute; top: -10px; left: 10px;" onclick="eliminarDeSalidas('${id}')">
                        <p style="color: red;font-size: 25px;">-</p>
                    </button>
                </div>
                <small>Stock actual: ${stockActual}</small>
            `;
            listaProductos.appendChild(nuevoItem);
        } else {

        }
    }
    actualizarContadorSalidas();
};

function actualizarContadorIngresos() {
    const btnCuadro = document.querySelector('.almacen-view .cuadro-btn:has(.fa-arrow-circle-down)');
    const btnIngresar = btnCuadro?.querySelector('.btn-agregar-pedido');

    if (!btnCuadro || !btnIngresar) return;

    const contador = btnIngresar.querySelector('.contador') || document.createElement('span');
    contador.className = 'contador';
    contador.textContent = productosParaIngresar.size;

    contador.style.cssText = `
        position: absolute;
        top: -8px;
        right: -8px;
        background-color: #ff4444;
        color: white;
        border-radius: 50%;
        padding: 2px 6px;
        font-size: 12px;
        display: ${productosParaIngresar.size > 0 ? 'block' : 'none'};
        z-index: 1000;
    `;

    btnIngresar.style.position = 'relative';
    if (!btnIngresar.querySelector('.contador')) {
        btnIngresar.appendChild(contador);
    }

    if (productosParaIngresar.size > 0) {
        btnCuadro.classList.add('active');
        btnIngresar.style.backgroundColor = '#f37500';
        btnIngresar.style.color = '#ffffff';
        const icono = btnIngresar.querySelector('i');
        if (icono) icono.style.color = '#ffffff';
        const texto = btnCuadro.querySelector('p');
        if (texto) texto.style.color = '#ffffff';
    } else {
        btnCuadro.classList.remove('active');
        btnIngresar.style.backgroundColor = '';
        btnIngresar.style.color = '';
        const icono = btnIngresar.querySelector('i');
        if (icono) icono.style.color = '';
        const texto = btnCuadro.querySelector('p');
        if (texto) texto.style.color = '';
    }
}

function actualizarContadorSalidas() {
    const btnCuadro = document.querySelector('.almacen-view .cuadro-btn:has(.fa-arrow-circle-up)');
    const btnSalidas = btnCuadro?.querySelector('.btn-agregar-pedido');

    if (!btnCuadro || !btnSalidas) return;

    const contador = btnSalidas.querySelector('.contador') || document.createElement('span');
    contador.className = 'contador';
    contador.textContent = productosParaSalida.size;

    contador.style.cssText = `
        position: absolute;
        top: -8px;
        right: -8px;
        background-color: #ff4444;
        color: white;
        border-radius: 50%;
        padding: 2px 6px;
        font-size: 12px;
        display: ${productosParaSalida.size > 0 ? 'block' : 'none'};
        z-index: 1000;
    `;

    btnSalidas.style.position = 'relative';
    if (!btnSalidas.querySelector('.contador')) {
        btnSalidas.appendChild(contador);
    }

    if (productosParaSalida.size > 0) {
        btnCuadro.classList.add('active');
        btnSalidas.style.backgroundColor = '#f37500';
        btnSalidas.style.color = '#ffffff';
        const icono = btnSalidas.querySelector('i');
        if (icono) icono.style.color = '#ffffff';
        const texto = btnCuadro.querySelector('p');
        if (texto) texto.style.color = '#ffffff';
    } else {
        btnCuadro.classList.remove('active');
        btnSalidas.style.backgroundColor = '';
        btnSalidas.style.color = '';
        const icono = btnSalidas.querySelector('i');
        if (icono) icono.style.color = '';
        const texto = btnCuadro.querySelector('p');
        if (texto) texto.style.color = '';
    }
}


async function mostrarListaIngresos() {
    const anuncio = document.querySelector('.anuncio');
    const contenido = anuncio.querySelector('.anuncio-contenido');

    contenido.innerHTML = `
        <div class="encabezado">
            <h2>Lista ingresos</h2>
            <button class="anuncio-btn close" onclick="ocultarAnuncio()">
                <i class="fas fa-arrow-right"></i></button>
        </div>
            <div class="carrito-productos2 relleno">
                ${Array.from(productosParaIngresar.entries()).map(([id, { nombre, gramaje, cantidad }]) => `
                    <div class="carrito-item form-grup" data-id="${id}" style="margin-top:5px; position: relative;">
                        
                        <div class="item-actions campo-form">

                            <p>${nombre} ${gramaje}gr</p>
                        
                            <div class="cantidad-control">
                                <button class="btn-cantidad anuncio-btn red" style="min-width:30px; height:30px; border-radius:50%; font-size:20px; padding:0; display:flex; align-items:center; justify-content:center; margin:0 5px;" onclick="actualizarCantidadIngreso('${id}', 'restar')">
                                    -
                                </button>
                                <input type="number" value="${cantidad}" min="1" 
                                    onchange="actualizarCantidadIngreso('${id}', this.value)" style="text-align:center; width: 70px; border:1px solid gray; padding: 10px">
                                <button class="btn-cantidad anuncio-btn green" style="min-width:30px; height:30px; border-radius:50%; font-size:20px; padding:0; display:flex; align-items:center; justify-content:center; margin:0 5px;" onclick="actualizarCantidadIngreso('${id}', 'sumar')">
                                    +
                                </button>
                            </div>
                            <button class="btn-eliminar" style="background: none; border:none; position: absolute; top: -10px; left: 10px;" onclick="eliminarDeIngresos('${id}')">
                                <p style="color: red;font-size: 25px;">-</p>
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        <div class="anuncio-botones">
            <button class="anuncio-btn green procesar" onclick="procesarIngresos()">
                <i class="fas fa-check"></i> Procesar Ingresos
            </button>
        </div>
    `;
    mostrarAnuncio();
    window.actualizarCantidadIngreso = (id, accion) => {
        if (productosParaIngresar.has(id)) {
            const producto = productosParaIngresar.get(id);
            let nuevaCantidad;

            if (accion === 'sumar') {
                nuevaCantidad = producto.cantidad + 1;
            } else if (accion === 'restar') {
                nuevaCantidad = Math.max(1, producto.cantidad - 1);
            } else {
                // Si viene del input
                nuevaCantidad = parseInt(accion) || 1;
            }

            producto.cantidad = nuevaCantidad;
            productosParaIngresar.set(id, producto);

            // Actualizar solo el input
            const inputCantidad = document.querySelector(`.carrito-item[data-id="${id}"] input[type="number"]`);
            if (inputCantidad) {
                inputCantidad.value = nuevaCantidad;
            }
        }
    };
    window.eliminarDeIngresos = (id) => {
        try {
            const itemElement = document.querySelector(`.carrito-item[data-id="${id}"]`);
            if (itemElement) {
                // Remove from Map
                productosParaIngresar.delete(id);

                // Reset the original button state
                const button = document.querySelector(`.btn-card.ingreso[onclick*="${id}"]`);
                if (button) {
                    button.classList.remove('active', 'disabled');
                    button.style.backgroundColor = '';
                    button.style.color = '';
                    button.disabled = false;
                }

                // Animate and remove the item
                itemElement.style.transition = 'all 0.3s ease';
                itemElement.style.opacity = '0';
                itemElement.style.height = '0';
                itemElement.style.margin = '0';
                itemElement.style.padding = '0';

                setTimeout(() => {
                    itemElement.remove();
                    actualizarContadorIngresos();

                    // Close modal if no items left
                    if (productosParaIngresar.size === 0) {
                        ocultarAnuncio();
                    }
                }, 300);
            }
        } catch (error) {
            console.error('Error al eliminar item:', error);
            mostrarNotificacion('Error al eliminar el item', 'error');
        }
    };
    window.procesarIngresos = async () => {
        try {
            const anuncio = document.querySelector('.anuncio-down');
            const contenido = anuncio.querySelector('.anuncio-contenido');

            contenido.innerHTML = `
    <div class="encabezado">
        <h2>Confirmación de Ingreso</h2>
        <button class="anuncio-btn close" onclick="ocultarAnuncioDown()">
            <i class="fas fa-arrow-down"></i></button>
    </div>
    <div class="form-grup" style="background:none">
        <p>Por favor, indique la razón del ingreso:</p>
        <textarea id="razonMovimiento" class="edit-input" style="width: 100%; min-height: 100px;" placeholder="Escriba la razón..."></textarea>
    </div>
    <div class="anuncio-botones">
        <button class="anuncio-btn green finalizar">
            <i class="fas fa-check"></i> Finalizar Ingreso
        </button>
    </div>
    `;
            mostrarAnuncioDown();

            const btnFinalizar = contenido.querySelector('.finalizar');
            btnFinalizar.onclick = async () => {
                try {
                    const razon = document.getElementById('razonMovimiento').value.trim();
                    if (!razon) {
                        mostrarNotificacion('Por favor, indique la razón del ingreso', 'warning');
                        return;
                    }

                    mostrarCarga();

                    for (const [id, { cantidad, nombre, gramaje }] of productosParaIngresar) {
                        const response = await fetch('/ingresar-stock-almacen', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id, cantidad })
                        });

                        const data = await response.json();
                        if (!data.success) {
                            throw new Error(data.error || 'Error al procesar el ingreso');
                        }

                        const nombreCompleto = `${nombre} - ${gramaje}gr`;
                        await registrarMovimiento('Ingreso', nombreCompleto, cantidad, razon);
                    }

                    productosParaIngresar.clear();
                    actualizarContadorIngresos();
                    ocultarAnuncio();

                    await cargarAlmacen();
                    ocultarAnuncioDown();
                    mostrarNotificacion('Ingresos procesados correctamente', 'success');
                } catch (error) {
                    console.error('Error:', error);
                    mostrarNotificacion(error.message, 'error');
                } finally {
                    ocultarCarga();
                }
            };
        } catch (error) {
            console.error('Error:', error);
            mostrarNotificacion(error.message, 'error');
            ocultarCarga();
        }
    };
}
async function mostrarListaSalidas() {
    const anuncio = document.querySelector('.anuncio');
    const contenido = anuncio.querySelector('.anuncio-contenido');

    contenido.innerHTML = `
        <div class="encabezado">
            <h2>Lista salidas</h2>
            <button class="anuncio-btn close" onclick="ocultarAnuncio()">
                <i class="fas fa-arrow-right"></i></button>
        </div>

            <div class="carrito-productos relleno">
                ${Array.from(productosParaSalida.entries()).map(([id, { nombre, gramaje, cantidad, stockActual }]) => `
                <div class="carrito-item form-grup" data-id="${id}" style="margin-top:5px; position: relative;">
                            
                        <div class="item-actions campo-form">
                        <p>${nombre} ${gramaje}gr</p>
                            <div class="cantidad-control">
                                <button class="btn-cantidad anuncio-btn red" style="min-width:30px; height:30px; border-radius:50%; font-size:20px; padding:0; display:flex; align-items:center; justify-content:center; margin:0 5px;" onclick="actualizarCantidadSalida('${id}', 'restar')">
                                    -
                                </button>
                                <input type="number" value="${cantidad}" min="1" max="${stockActual}"
                                    onchange="actualizarCantidadSalida('${id}', this.value)" style="text-align:center; min-width: 70px; border:1px solid gray;padding:10px">
                                <button class="btn-cantidad anuncio-btn green" style="min-width:30px; height:30px; border-radius:50%; font-size:20px; padding:0; display:flex; align-items:center; justify-content:center; margin:0 5px;" onclick="actualizarCantidadSalida('${id}', 'sumar')">
                                    +
                                </button>
                            </div>
                            <button class="btn-eliminar" style="background: none; border:none; position: absolute; top: -10px; left: 10px;" onclick="eliminarDeSalidas('${id}')">
                                <p style="color: red;font-size: 25px;">-</p>
                            </button>
                        </div>
                         <small>Stock actual: ${stockActual}</small>
                    </div>
                `).join('')}
            </div>
        <div class="anuncio-botones">
            <button class="anuncio-btn green procesar" onclick="procesarSalidas()">
                <i class="fas fa-check"></i> Procesar Salidas
            </button>
        </div>
    `;
    mostrarAnuncio();
    window.actualizarCantidadSalida = (id, accion) => {
        if (productosParaSalida.has(id)) {
            const producto = productosParaSalida.get(id);
            let nuevaCantidad;

            if (accion === 'sumar') {
                nuevaCantidad = producto.cantidad + 1;
            } else if (accion === 'restar') {
                nuevaCantidad = Math.max(1, producto.cantidad - 1);
            } else {
                // Si viene del input
                nuevaCantidad = parseInt(accion) || 1;
            }

            // Validar contra stock
            if (nuevaCantidad > producto.stockActual) {
                nuevaCantidad = producto.stockActual;
                mostrarNotificacion('No hay suficiente stock', 'warning');
            }

            producto.cantidad = nuevaCantidad;
            productosParaSalida.set(id, producto);

            // Actualizar solo el input
            const inputCantidad = document.querySelector(`.carrito-item[data-id="${id}"] input[type="number"]`);
            if (inputCantidad) {
                inputCantidad.value = nuevaCantidad;
            }
        }
    };
    window.eliminarDeSalidas = (id) => {
        try {
            const itemElement = document.querySelector(`.carrito-item[data-id="${id}"]`);
            if (itemElement) {
                // Remove from Map
                productosParaSalida.delete(id);

                // Reset the original button state
                const button = document.querySelector(`.btn-card.salida[onclick*="${id}"]`);
                if (button) {
                    button.classList.remove('active', 'disabled');
                    button.style.backgroundColor = '';
                    button.style.color = '';
                    button.disabled = false;
                }

                // Animate and remove the item
                itemElement.style.transition = 'all 0.3s ease';
                itemElement.style.opacity = '0';
                itemElement.style.height = '0';
                itemElement.style.margin = '0';
                itemElement.style.padding = '0';

                setTimeout(() => {
                    itemElement.remove();
                    actualizarContadorSalidas();

                    // Close modal if no items left
                    if (productosParaSalida.size === 0) {
                        ocultarAnuncio();
                    }
                }, 300);
            }
        } catch (error) {
            console.error('Error al eliminar item:', error);
            mostrarNotificacion('Error al eliminar el item', 'error');
        }
    };

    window.procesarSalidas = async () => {
        try {
            const anuncio = document.querySelector('.anuncio-down');
            const contenido = anuncio.querySelector('.anuncio-contenido');

            contenido.innerHTML = `
            <div class="encabezado">
                <h2>Confirmación de Salida</h2>
                <button class="anuncio-btn close" onclick="ocultarAnuncioDown()">
                    <i class="fas fa-arrow-down"></i></button>
            </div>
            <div class="form-grup" style="background:none">
                <p>Por favor, indique la razón de la salida:</p>
                <textarea id="razonMovimiento" class="edit-input" style="width: 100%; min-height: 100px;" placeholder="Escriba la razón..."></textarea>
            </div>
            <div class="anuncio-botones">
                <button class="anuncio-btn green finalizar">
                    <i class="fas fa-check"></i> Finalizar Salida
                </button>
            </div>
        `;
            mostrarAnuncioDown();

            const btnFinalizar = contenido.querySelector('.finalizar');
            btnFinalizar.onclick = async () => {
                try {
                    const razon = document.getElementById('razonMovimiento').value.trim();
                    if (!razon) {
                        mostrarNotificacion('Por favor, indique la razón de la salida', 'warning');
                        return;
                    }

                    mostrarCarga();

                    for (const [id, { cantidad, nombre, gramaje }] of productosParaSalida) {
                        const response = await fetch('/retirar-stock-almacen', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id, cantidad })
                        });

                        const data = await response.json();
                        if (!data.success) {
                            throw new Error(data.error || `Error al procesar la salida de ${nombre}`);
                        }

                        const nombreCompleto = `${nombre} - ${gramaje}gr`;
                        await registrarMovimiento('Salida', nombreCompleto, cantidad, razon);
                    }

                    productosParaSalida.clear();
                    actualizarContadorSalidas();
                    ocultarAnuncio();

                    await cargarAlmacen();
                    ocultarAnuncioDown();
                    mostrarNotificacion('Salidas procesadas correctamente', 'success');
                } catch (error) {
                    console.error('Error:', error);
                    mostrarNotificacion(error.message, 'error');
                } finally {
                    ocultarCarga();
                }
            };
        } catch (error) {
            console.error('Error:', error);
            mostrarNotificacion(error.message, 'error');
            ocultarCarga();
        }
    };
}



export function mostrarProductos() {
    const container = document.querySelector('.almacen-general-productos');
    if (!container) return;
    container.innerHTML = '';
    container.style.display = 'flex';

    container.innerHTML = `
        <div class="almacen-container-general">
            <div class="almacen-header-general">
                <div class="search-bar">
                    <input type="text" id="searchProduct" placeholder="Buscar producto...">
                    <i class="fas fa-search search-icon2"></i>
                </div>
                <div class="filter-options">
                    <button class="filter-btn" data-filter="all">
                        <p><i class="fas fa-sort-amount-down"></i> Mayor a menor</p>
                    </button>
                    <button class="filter-btn giro" data-filter="low">
                        <p><i class="fas fa-sort-amount-up"></i> Menor a mayor</p>
                   </button>
                </div>
            </div>
            <div class="filter-options-almacenGral">
                ${obtenerEtiquetas()}
            </div>
            <div class="products-grid" id="productsContainer-general">
            </div>
        </div>
    `;

    // Call cargarAlmacen after creating the container
    cargarAlmacen();

    document.getElementById('productsContainer-general').addEventListener('click', (e) => {
        const productCard = e.target.closest('.product-card');
        if (productCard) {
            const productId = productCard.dataset.id;
            const producto = window.productosAlmacen.find(p => p[0] === productId);
            if (producto) mostrarDetalleProductoGral(producto);
        }
    });
    const tagsContainer = document.querySelector('.filter-options-almacenGral');
    if (tagsContainer) {
        tagsContainer.addEventListener('click', (e) => {
            const tagButton = e.target.closest('.filter-btn-acopio');
            if (tagButton) {
                const selectedTag = tagButton.dataset.tag;

                document.querySelectorAll('.filter-btn-acopio').forEach(btn =>
                    btn.classList.remove('active'));
                tagButton.classList.add('active');

                tagButton.scrollIntoView({
                    behavior: 'smooth',
                    inline: 'center',
                    block: 'nearest'
                });

                const allProducts = document.querySelectorAll('.product-card');
                const productsContainer = document.getElementById('productsContainer-general');
                let anyVisible = false;

                allProducts.forEach(product => {
                    if (selectedTag === 'all') {
                        product.style.display = 'grid';
                        anyVisible = true;
                    } else {
                        // Modificar esta parte para manejar múltiples etiquetas
                        const productTags = product.dataset.tags?.toLowerCase().split(';') || [];
                        const match = productTags.some(tag => tag.trim() === selectedTag);
                        product.style.display = match ? 'grid' : 'none';
                        if (match) anyVisible = true;
                    }
                });

                // Mostrar mensaje si no hay resultados
                const noResultsMessage = productsContainer.querySelector('.no-results-message');
                if (!anyVisible) {
                    if (!noResultsMessage) {
                        productsContainer.innerHTML += `
                    <div class="no-results-message" style="width: 100%; text-align: center; padding: 20px; color: var(--primary-text);">
                        <i class="fas fa-tag" style="font-size: 40px; margin-bottom: 10px;"></i>
                        <p>No hay productos con la etiqueta "${selectedTag}"</p>
                    </div>
                `;
                    }
                } else if (noResultsMessage) {
                    noResultsMessage.remove();
                }
            }
        });
    }


    function normalizarTexto(texto) {
        return texto.toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Elimina tildes
            .replace(/\s+/g, ' ')            // Reduce espacios múltiples a uno
            .trim();                         // Elimina espacios al inicio y final
    }

    const searchInput = document.getElementById('searchProduct');
    const searchIcon = document.querySelector('.search-icon2');


    // Add focus event handler
    searchInput.addEventListener('focus', () => {
        const almacenView = document.querySelector('.almacen-view');
        if (almacenView) {
            const searchBarPosition = searchInput.getBoundingClientRect().top + window.scrollY;
            almacenView.scrollTo({
                top: searchBarPosition - 70,
                behavior: 'smooth'
            });
            searchIcon.style.color = '#f37500';
        }
    });
    searchInput.addEventListener('blur', () => {
        searchIcon.style.color = 'gray';
    });

    searchInput.addEventListener('input', (e) => {
        const searchTerm = normalizarTexto(e.target.value);
        const products = document.querySelectorAll('.product-card');
        const productsContainer = document.getElementById('productsContainer-general');
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

        // Mostrar mensaje si no se encuentran productos
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
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const filter = button.dataset.filter;
            // Modificar el selector para que solo seleccione productos del contenedor general
            const products = Array.from(document.querySelector('#productsContainer-general').querySelectorAll('.product-card'));

            products.sort((a, b) => {
                const stockA = parseInt(a.querySelector('.product-quantity').textContent.trim().match(/\d+/) || [0]);
                const stockB = parseInt(b.querySelector('.product-quantity').textContent.trim().match(/\d+/) || [0]);

                const numA = isNaN(stockA) ? 0 : stockA;
                const numB = isNaN(stockB) ? 0 : stockB;

                if (filter === 'all') {
                    return numB - numA; // Mayor a menor
                } else {
                    return numA - numB; // Menor a mayor
                }
            });

            const container = document.getElementById('productsContainer-general');
            container.innerHTML = '';
            products.forEach(product => container.appendChild(product));
        });
    });
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

/* ==================== FUNCIONES DE INGRESO, SALIDA, FORMATO, AGREGAR PRODUCTO Y PEDIDOS DEL ALMACEN  ==================== */
function mostrarFormularioFormato() {
    const anuncio = document.querySelector('.anuncio');
    const contenido = anuncio.querySelector('.anuncio-contenido');
    const preciosBase = window.productosAlmacen && window.productosAlmacen[0] ? window.productosAlmacen[0][7] : '';
    const tagBase = window.productosAlmacen && window.productosAlmacen[0] ? window.productosAlmacen[0][8] : '';

    contenido.innerHTML = `
        <div class="encabezado">
        <h2>Formatos</h2>
         <button class="anuncio-btn close" onclick="ocultarAnuncio()">
            <i class="fas fa-arrow-right"></i></button>
    </div>
        <div class="relleno">
            <div class="form-grup" style="background:none">
                 <p>Formato Precios:</p>
                <div class="detalles-grup">
                    ${formatearPrecios(preciosBase, '1')}
                </div>
                <div style="margin-top:5px">
                    <div class="detalle-item">
                        <input type="text" id="nuevoFormato" class="edit-input" placeholder="Nuevo formato precio">
                        <i class="fas fa-plus-circle add add-format"></i>
                    </div>
                </div>
                <p>Formato Etiquetas:</p>
                <div class="detalles-grup">
                    ${formatearTags(tagBase, '1')}
                </div>
                <div  style="margin-top:5px">
                    <div class="detalle-item">
                        <input type="text" id="nuevoFormatoTag" class="edit-input" placeholder="Nuevo formato etiqueta">
                        <i class="fas fa-plus-circle add add-tag"></i>
                    </div>
                </div>
            </div>
           
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
            ocultarAnuncio();
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
            await cargarAlmacen();
            ocultarAnuncio();
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

    mostrarAnuncio();
}
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
                return `<div>
                <p>${nombreTipo}:</p>
                <span>Bs. ${valor}</span>
            </div>`;
            }
            else {
                return `<div class="campo-form" style="background:none">
                            <p>${nombreTipo}:</p>
                            <div class="campo-form" style="padding:0; margin-top:0; background:none">
                                    <input type="number" id="editPrice_${tipo}" value="0" class="edit-input" data-tipo="${tipo}">
                                    <input type="number" id="porcentaje_${tipo}" class="edit-input porcentaje" placeholder="%" min="0" max="100">
                            </div>
                        </div>`;
            }
        }).join('');
    }
    async function cargarProductosAcopio() {
        try {
            const response = await fetch('/obtener-almacen-acopio');
            const data = await response.json();

            if (data.success) {
                const selectIndex = document.getElementById('nuevoIndex');
                if (!selectIndex) {
                    console.error('Select element not found');
                    return;
                }

                selectIndex.innerHTML = '<option value="">Seleccionar</option>';

                data.pedidos.forEach(producto => {
                    const [id, nombre] = producto;
                    selectIndex.innerHTML += `
                    <option value="${id}|${nombre}">
                        ${nombre}
                    </option>
                `;
                });
            }
        } catch (error) {
            console.error('Error:', error);
            mostrarNotificacion('Error al cargar productos de acopio', 'error');
        }
    }
    contenido.innerHTML = `
        <div class="encabezado">
        <h2>Nuevo Producto</h2>
         <button class="anuncio-btn close" onclick="ocultarAnuncio()">
            <i class="fas fa-arrow-right"></i></button>
        </div>
        <div class="relleno">
                <p style="color:white">Informacion General:</p>
                <div class="form-grup" style="background:none">
                    <p>Nombre*</label>
                    <input type="text" id="nuevoNombre" class="edit-input" placeholder="Ingresa el nombre del producto" required>

                    <p>Gramaje*</label>
                    <input type="number" id="nuevoGramaje" class="edit-input" value="0" placeholder="Ingresa el gramaje del producto. Ej: 13" required>

                    <p>Stock Total*</label>
                    <input type="number" id="nuevoStock" class="edit-input" placeholder="Stock inicial del producto. Ej: 1" required>

                    <p>Cantidad por grupo* (Opcional)</label>
                    <input type="number" id="nuevoCantidadTira" value="0" placeholder="Cantidad que hay en cada grupo" class="edit-input">

                    <p>Lista* (Opcional)</label>
                    <input type="text" id="nuevoLista" class="edit-input" placeholder="Numero de lista del producto" required>

                    <p>Codigo de barras*</label>
                    <input type="number" id="nuevoCodigoBarras" class="edit-input" placeholder="Codigo de barras del producto" required>
                </div>
                <p style="color:white">Precios:</p>
                ${formatearPrecios(preciosBase, '2')}
                <p style="color:white">Etiquetas:</p>
                <div id="tags-container" class="detalles-grup">
                        <!-- Aquí se renderizarán los tags seleccionados -->
                </div>
                <div class="campo-form" style="background:none">
                    <p>Etiqueta:</p>
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
                <p style="color:white">Almacen Index:</p>
                <div id="tags-container" class="detalles-grup">
                        <!-- Aquí se renderizarán los tags seleccionados -->
                </div>
                <div class="campo-form"style="background:none">
                    <p>Almacen Index:</p>
                    <select id="nuevoIndex" class="edit-input">
                        <option value="">Seleccionar</option>
                    </select>
                    <div class="detalle-item">
                        <i class="fas fa-plus-circle add btn-add-tag"></i>
                    </div>
                </div>
        </div>
        <div class="anuncio-botones">
                <button class="anuncio-btn green guardar"><i class="fas fa-save"></i> Guardar</button>
        </div>
    `;

    cargarProductosAcopio();


    mostrarAnuncio();
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
            deleteBtn.addEventListener('click', function () {
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


    anuncio.querySelector('.guardar').onclick = async () => {
        try {
            mostrarCarga();
            const preciosInputs = Array.from(contenido.querySelectorAll('.campo-form input[id^="editPrice_"]'));
            const preciosActualizados = preciosInputs.map(input => {
                const tipo = input.dataset.tipo;
                const valor = input.value;
                return `${tipo},${valor}`;
            }).join(';');
            const indexSeleccionado = document.getElementById('nuevoIndex').value;
            const [indexId, indexNombre] = indexSeleccionado ? indexSeleccionado.split('|') : ['', ''];

            const cantidadTira = document.getElementById('nuevoCantidadTira').value;

            const nuevoProducto = {
                nombre: document.getElementById('nuevoNombre').value,
                gramaje: document.getElementById('nuevoGramaje').value,
                stock: document.getElementById('nuevoStock').value,
                cantidadTira: cantidadTira === "0" ? "No se maneja por tira" : cantidadTira,
                lista: document.getElementById('nuevoLista').value,
                codigob: document.getElementById('nuevoCodigoBarras')?.value || '',
                precios: preciosActualizados,
                tags: Array.from(selectedTags).join(';'), // Agregar los tags al objeto
                indexId: indexId,
                indexNombre: indexNombre,
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
                ocultarAnuncio();
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

window.mostrarFormularioPrecios = function () {
    const btnPrecios = document.querySelector('.btn-agregar-pedido i.fa-dollar-sign').parentElement;
    const accionesRapidas = document.querySelectorAll('.acciones-rapidas');
    const modoPrecios = !btnPrecios.classList.contains('active');

    btnPrecios.classList.toggle('active');
    btnPrecios.style.backgroundColor = modoPrecios ? '#f37500' : '';

    accionesRapidas.forEach(accion => {
        const card = accion.closest('.product-info');
        if (!card) return;

        // Asegurarse de que exista el div de precios, si no, crearlo
        let accionPrecios = card.querySelector('.acciones-precios');
        if (!accionPrecios) {
            accionPrecios = document.createElement('div');
            accionPrecios.className = 'acciones-precios';
            accionPrecios.innerHTML = `
                <div class="product-quantity">${accion.querySelector('.product-quantity').textContent}</div>
                <button class="btn-card precios" onclick="verPrecios('${card.dataset.id}')">
                    <i class="fas fa-dollar-sign"></i>
                </button>
            `;
            card.appendChild(accionPrecios);
        }

        // Alternar visibilidad
        if (modoPrecios) {
            accion.style.display = 'none';
            accionPrecios.style.display = 'flex';
        } else {
            accion.style.display = 'flex';
            accionPrecios.style.display = 'none';
        }
    });
};
window.verPrecios = function (productId) {
    // Aquí puedes implementar la lógica para mostrar los precios del producto
    console.log(`Ver precios del producto ${productId}`);
};


/* ==================== FUNCIONES DE LOS DETALLES Y ELIMINACION DE TAGS Y PRECIOS ==================== */
window.mostrarDetalleProductoGral = function (producto) {
    const [id, nombre, gramaje, stock, cantidadTira, lista, codigob, precios, tag, indexId, indexNombre] = producto;
    const anuncio = document.querySelector('.anuncio');
    const contenido = anuncio.querySelector('.anuncio-contenido');
    const tagsSeleccionados = new Set(tag ? tag.split(';').filter(t => t.trim()) : []);
    const isAdmin = window.rol === 'Administración';

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
                    <div class="campo-form" style="background: none">
                        <p>${nombreTipo}:</p>
                        <div class="campo-form" style="padding:0; margin-top:0; background: none">
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
                return `<div class="detalle-item" style="background: none">
                    <p>${tag}</p>
                    <i class="fas fa-trash delete delete-tag-edit" data-nombre="${tag}"></i>
                </div>`;
            }
        }).join('');
    }
    function formatearIndex(indexNombre, num) {
        if (!indexNombre) return '<div class="detalle-item"><p>Este producto no tiene índice</p></div>';

        if (num == 1) {
            return `<div class="detalle-item">
            <p class="tag" data-id="${indexId}">- ${indexNombre}</p>
        </div>`;
        } else {
            return `<div class="detalle-item">
            <p data-id="${indexId}">${indexNombre}</p>
            <i class="fas fa-trash delete delete-index" data-id="${indexId}"></i>
        </div>`;
        }
    }
    async function cargarProductosAcopio() {
        try {
            const response = await fetch('/obtener-almacen-acopio');
            const data = await response.json();

            if (data.success) {
                const selectIndex = document.getElementById('editIndex');
                if (!selectIndex) {
                    console.error('Select element not found');
                    return;
                }

                selectIndex.innerHTML = '<option value="">Seleccionar</option>';

                data.pedidos.forEach(producto => {
                    const [id, nombre] = producto;
                    const selected = id === indexId ? 'selected' : '';
                    selectIndex.innerHTML += `
                    <option value="${id}|${nombre}" ${selected}>
                        ${nombre}
                    </option>
                `;
                });
            }
        } catch (error) {
            console.error('Error:', error);
            mostrarNotificacion('Error al cargar productos de acopio', 'error');
        }
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
                    <p class="subtitle">Informacion General:</p>               
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
                    <p class="subtitle">Precios:</p>  
                    <div class="detalles-grup">
                        <div class="detalle-item"><span>${formatearPrecios(precios, '1') || 'Este producto no tiene precios registrados'}</span></div>
                    </div>
                    <p class="subtitle">Etiquetas:</p> 
                    <div class="detalles-grup">
                        <div class="detalle-item"><span>${formatearTags(tag, '1') || 'Este producto no tiene etiquetas'}</span></div>
                    </div>
                    <p class="subtitle">Almcen Index:</p> 
                    <div class="detalles-grup">
                        <div class="detalle-item"><span>${formatearIndex(indexNombre, '1') || 'Este producto no tiene etiquetas'}</span></div>
                    </div>
                </div>
                <div class="detalles-edicion" style="display: none; flex-direction:column; gap:5px">
                    <p class="subtitle">Informacion General:</p> 
                        <p>Nombre:</p>
                        <input type="text" id="editNombre" value="${nombre}" class="edit-input">

                        <p>Gramaje:</p>
                        <input type="number" id="editGramaje" value="${gramaje}" class="edit-input">

                        <p>Stock:</p>
                        <input type="number" id="editStock" value="${stock}" class="edit-input">

                        <p>Cantidad por Tira:</p>
                        <input type="number" id="editCantidadTira" value="${cantidadTira}" class="edit-input">

                        <p>Lista:</p>
                        <input type="text" id="editLista" value="${lista}" class="edit-input">

                        <p>Codigo de barras:</p>
                        <input type="text" id="editCodigoBarras" value="${codigob}" class="edit-input">
                    <p class="subtitle">Precios:</p>
                    ${formatearPrecios(precios, '2') || 'No registrado'}
                    <p class="subtitle">Etiquetas:</p>
                    <div id="tags-container" class="detalles-grup">
                        ${formatearTags(tag, '2') || 'Este producto no tiene etiquetas'}
                    </div>
                    <div class="campo-form" style="background: none">
                        <p>Etiqueta:</p>
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
                    <p class="subtitle">Almacen Index:</p>
                    <div id="index-container" class="detalles-grup">
                        <!-- Index will be rendered here -->
                    </div>
                    <div class="campo-form" style="background: none">
                        <p>Almacen Index:</p>
                        <select id="editIndex" class="edit-input">
                            <option value="">Seleccionar</option>
                        </select>
                        <div class="detalle-item">
                            <i class="fas fa-plus-circle add btn-add-index"></i>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="anuncio-botones">
            
            <button class="anuncio-btn green guardar" style="display: none;">Guardar</button>
            ${isAdmin ? '<button class="anuncio-btn blue editar">Editar</button>' : ''}
            ${isAdmin ? '<button class="anuncio-btn red eliminar">Eliminar</button>' : ''}
        </div>
    `;
    mostrarAnuncio();

    function actualizarTagsUI() {
        const tagsContainer = contenido.querySelector('#tags-container');
        tagsContainer.innerHTML = Array.from(tagsSeleccionados).map(tag => `
            <div class="detalle-item">
                <p>${tag}</p>
                <i class="fas fa-trash delete delete-tag-edit" data-nombre="${tag}"></i>
            </div>
        `).join('');

        tagsContainer.querySelectorAll('.delete-tag-edit').forEach(btn => {
            btn.addEventListener('click', function () {
                const tagToRemove = this.getAttribute('data-nombre');
                tagsSeleccionados.delete(tagToRemove);
                actualizarTagsUI();
            });
        });
    }
    function actualizarIndexUI() {
        const indexContainer = contenido.querySelector('#index-container');
        if (indexId && indexNombre) {
            indexContainer.innerHTML = `
                <div class="detalle-item">
                    <p data-id="${indexId}">${indexNombre}</p>
                    <i class="fas fa-trash delete delete-index" data-id="${indexId}"></i>
                </div>
            `;

            indexContainer.querySelector('.delete-index').addEventListener('click', function () {
                indexId = '';
                indexNombre = '';
                actualizarIndexUI();
            });
        } else {
            indexContainer.innerHTML = '<div class="detalle-item"><p>No hay índice seleccionado</p></div>';
        }
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

    const detallesEdicion = contenido.querySelector('.detalles-edicion');
    const btnEditar = contenido.querySelector('.editar');
    const btnGuardar = contenido.querySelector('.guardar');
    if (btnEditar) {
        btnEditar.addEventListener('click', () => {
            const detallesGrup = contenido.querySelector('.detalle-seccion');
            if (detallesGrup && detallesEdicion) {
                detallesGrup.style.display = 'none';
                detallesEdicion.style.display = 'flex';
                btnEditar.style.display = 'none';
                btnGuardar.style.display = 'inline-block';
                actualizarTagsUI();
                actualizarIndexUI();
                cargarProductosAcopio();
            }
        });
    }

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
    contenido.querySelector('.btn-add-index')?.addEventListener('click', () => {
        const selectIndex = document.getElementById('editIndex');
        const selectedValue = selectIndex.value;

        if (!selectedValue) {
            mostrarNotificacion('Seleccione un índice', 'error');
            return;
        }

        const [newIndexId, newIndexNombre] = selectedValue.split('|');

        // Actualizar el contenedor directamente
        const indexContainer = document.getElementById('index-container');
        indexContainer.innerHTML = `
        <div class="detalle-item">
            <p data-id="${newIndexId}">${newIndexNombre}</p>
            <i class="fas fa-trash delete delete-index" data-id="${newIndexId}"></i>
        </div>
    `;

        // Guardar los valores globalmente
        indexId = newIndexId;
        indexNombre = newIndexNombre;

        // Agregar el event listener para eliminar
        indexContainer.querySelector('.delete-index')?.addEventListener('click', () => {
            indexId = '';
            indexNombre = '';
            indexContainer.innerHTML = '<div class="detalle-item"><p>No hay índice seleccionado</p></div>';
        });

        selectIndex.value = '';
    });

    anuncio.querySelector('.eliminar').onclick = () => {
        mostrarConfirmacionEliminar(id, nombre);
    };

    btnEditar.onclick = () => {
        const detallesGrup = contenido.querySelector('.detalle-seccion');
        detallesGrup.style.display = 'none';
        detallesEdicion.style.display = 'flex';
        btnEditar.style.display = 'none';
        btnGuardar.style.display = 'inline-block';
        actualizarTagsUI();
        actualizarIndexUI();
        cargarProductosAcopio();
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

            // Obtener el index del contenedor en lugar del select
            const indexElement = document.querySelector('#index-container .detalle-item p');
            const indexNombreActual = indexElement ? indexElement.textContent : '';
            const indexIdActual = document.querySelector('#index-container .delete-index')?.getAttribute('data-id') || '';

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
                tags: Array.from(tagsSeleccionados).join(';'),
                indexId: indexIdActual,
                indexNombre: indexNombreActual
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
                ocultarAnuncio();
                cargarAlmacen();
            } else {
                throw new Error(data.error || 'Error al actualizar el producto');
            }
        } catch (error) {
            console.error('Error:', error);
            mostrarNotificacion('Error al actualizar el producto', 'error');
        } finally {
            ocultarCarga();
            document.getElementById('searchProduct').value = '';
        }
    };
};
function mostrarConfirmacionEliminar(id, nombre) {
    const anuncio = document.querySelector('.anuncio-down');
    const contenido = anuncio.querySelector('.anuncio-contenido');

    contenido.innerHTML = `
        <div class="encabezado">
            <h2>Eliminar Producto</h2>
            <button class="anuncio-btn close" onclick="ocultarAnuncioDown()">
                <i class="fas fa-arrow-right"></i></button>
        </div>
        <div class="detalles-grup center">
            <p>¿Está seguro que desea eliminar el producto "${nombre}"?</p>
            <p>Esta acción no se puede deshacer.</p>
        </div>
        <div class="anuncio-botones">
            <button class="anuncio-btn red confirmar">Confirmar</button>
        </div>
    `;

    mostrarAnuncioDown();
    ocultarAnuncio();

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

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.success) {
                mostrarNotificacion('Producto eliminado correctamente', 'success');
                document.getElementById('searchProduct').value = '';
                await cargarAlmacen();
            } else {
                throw new Error(data.message || 'Error al eliminar el producto');
            }
        } catch (error) {
            console.error('Error:', error);
            mostrarNotificacion(error.message || 'Error al eliminar el producto', 'error');
        } finally {
            ocultarCarga();
            ocultarAnuncioDown();
        }
    };
}
function mostrarConfirmacionEliminarTag(nombre) {
    const anuncio = document.querySelector('.anuncio-down');
    const contenido = anuncio.querySelector('.anuncio-contenido');

    contenido.innerHTML = `
        <div class="encabezado">
        <h2>Eliminar formato tag?</h2>
            <button class="anuncio-btn close" onclick="ocultarAnuncioDown()">
                <i class="fas fa-arrow-right"></i></button>
        </div>
        <div class="detalles-grup center">
                <p>¿Está seguro que desea eliminar la etiqueta "${nombre}"?</p>
                <p>Esta acción eliminará esta etiqueta de todos los productos.</p>
        </div>
        <div class="anuncio-botones">
            <button class="anuncio-btn red confirmar">Confirmar</button>
        </div>
    `;
    mostrarAnuncioDown();
    ocultarAnuncio();

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
            ocultarAnuncioDown();
        }
    };
}
function mostrarConfirmacionEliminarPrecio(nombre) {
    const anuncio = document.querySelector('.anuncio-down');
    const contenido = anuncio.querySelector('.anuncio-contenido');
    const preciosBase = window.productosAlmacen && window.productosAlmacen[0] ? window.productosAlmacen[0][7] : '';

    contenido.innerHTML = `
       <div class="encabezado">
        <h2>Eliminar formato precio?</h2>
            <button class="anuncio-btn close" onclick="ocultarAnuncioDown()">
                <i class="fas fa-arrow-right"></i></button>
        </div>
        <div class="detalles-grup center">
                <p>¿Está seguro que desea eliminar el formato de precio "${nombre}"?</p>
                <p>Esta acción eliminará este formato de todos los productos.</p>
        </div>
        <div class="anuncio-botones">
            <button class="anuncio-btn red confirmar">Confirmar</button>
        </div>
    `;

    mostrarAnuncioDown();
    ocultarAnuncio();

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
            ocultarAnuncioDown();
        }
    };
};

/* ==================== FUNCIONES DE LOS DETALLES Y ELIMINACION DE TAGS Y PRECIOS ==================== */
function mostrarFormularioConteo() {
    const anuncio = document.querySelector('.anuncio');
    const contenido = anuncio.querySelector('.anuncio-contenido');
    const conteoPrevio = JSON.parse(localStorage.getItem('conteoAlmacen') || '{}');

    contenido.innerHTML = `
        <div class="encabezado">
            <h2>Conteo de Productos</h2>
            <button class="anuncio-btn close" onclick="ocultarAnuncio()">
                <i class="fas fa-arrow-right"></i>
            </button>
        </div>
        <div class="relleno" style="gap:5px">
                <input type="text" 
                    id="searchConteo" 
                    placeholder="Buscar producto..." 
                    onkeyup="filtrarProductosConteo(this.value)"
                    onfocus="this.select()">

                ${window.almacen.slice(1).map(([id, nombre, gramaje, stock]) => `
                    <div class="item-conteo form-grup" data-id="${id}" data-nombre="${nombre}" style="border-radius:10px; padding:10px;">
                        <div class="producto-info" style="margin-bottom: 10px">
                            <p>${nombre} ${gramaje}gr</p>
                        </div>
                        <div class="conteo-control" style="display:flex; align-items: center;justify-content:space-between; width:100%;">
                            <small style="min-width: 100px">Ideal: ${stock}</small>
                            <input type="number" 
                                class="cantidad-real" 
                                value="${conteoPrevio[id] || ''}" 
                                placeholder="0"
                                min="0"
                                onchange="actualizarDiferenciaConteo('${id}', ${stock}, this.value)" style="min-width:100px; text-align:center;background-color:rgb(61, 61, 61)">
                            <p class="diferencia" style="margin-left: 10px; ${getDiferenciaStyle(stock, conteoPrevio[id])}; width: auto; min-width:100px; text-align:center; height:100%">
                                ${calcularDiferencia(stock, conteoPrevio[id])}
                            </p>
                        </div>
                    </div>
                `).join('')}
        </div>
        <div class="anuncio-botones">
            <button class="anuncio-btn red limpiar">
                <i class="fas fa-eraser"></i> Limpiar
            </button>
            <button class="anuncio-btn green registrar">
                <i class="fas fa-save"></i> Registrar
            </button>
        </div>
    `;

    // Add the filter function to window scope
    window.filtrarProductosConteo = (searchTerm) => {
        const normalizeString = (str) => {
            return str.toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/[-\s]/g, "");
        };

        const items = document.querySelectorAll('.item-conteo');
        const searchNormalized = normalizeString(searchTerm);

        items.forEach(item => {
            const nombre = normalizeString(item.getAttribute('data-nombre'));
            if (nombre.includes(searchNormalized)) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        });
    };

    window.actualizarDiferenciaConteo = (id, stockActual, cantidadReal) => {
        const diferencia = calcularDiferencia(stockActual, cantidadReal);
        const diferenciaElement = document.querySelector(`.item-conteo[data-id="${id}"] .diferencia`);
        if (diferenciaElement) {
            diferenciaElement.textContent = diferencia;
            diferenciaElement.style.color = cantidadReal == stockActual ? '#4CAF50' :
                cantidadReal < stockActual ? '#f44336' : '#4CAF50';
        }

        // Guardar en localStorage
        const conteoGuardado = JSON.parse(localStorage.getItem('conteoAlmacen') || '{}');
        conteoGuardado[id] = cantidadReal;
        localStorage.setItem('conteoAlmacen', JSON.stringify(conteoGuardado));
    };

    // Event Listeners
    contenido.querySelector('.limpiar').addEventListener('click', () => {
        localStorage.removeItem('conteoAlmacen');
        document.querySelectorAll('.cantidad-real').forEach(input => {
            input.value = '';
        });
        document.querySelectorAll('.diferencia').forEach(diff => {
            diff.textContent = '';
        });
    });
    contenido.querySelector('.registrar').addEventListener('click', () => {
        const productos = [];
        document.querySelectorAll('.item-conteo').forEach(item => {
            const id = item.dataset.id;
            const cantidadReal = item.querySelector('.cantidad-real').value;

            if (cantidadReal) {
                const nombreCompleto = item.querySelector('.producto-info p').textContent;
                const ideal = item.querySelector('small').textContent.split(': ')[1];
                const diferencia = calcularDiferencia(ideal, cantidadReal);

                productos.push({
                    idProducto: id,
                    nombre: nombreCompleto,
                    ideal,
                    real: cantidadReal,
                    diferencia: diferencia === 'Coincide' ? '0' : diferencia
                });
            }
        });

        if (productos.length === 0) {
            mostrarNotificacion('No hay productos para registrar', 'error');
            return;
        }

        const anuncio = document.querySelector('.anuncio-down');
        const contenido = anuncio.querySelector('.anuncio-contenido');

        contenido.innerHTML = `
            <div class="encabezado">
                <h2>Detalles del Conteo</h2>
                <button class="anuncio-btn close" onclick="ocultarAnuncioDown()">
                    <i class="fas fa-arrow-down"></i>
                </button>
            </div>
            <div class="detalles-grup">
                <textarea id="detallesConteo" 
                    placeholder="Ingrese detalles del conteo..."
                    style="width: 100%; min-height: 100px; padding: 8px;"></textarea>
            </div>
            <div class="anuncio-botones">
                <button class="anuncio-btn blue descargar-pdf">
                    <i class="fas fa-file-pdf"></i> PDF
                </button>
                <button class="anuncio-btn green descargar-excel">
                    <i class="fas fa-file-excel"></i> Excel
                </button>
            </div>
        `;

        mostrarAnuncioDown();

        // Handle PDF download
        anuncio.querySelector('.descargar-pdf').onclick = () => {
            const detalles = document.getElementById('detallesConteo').value || 'Ninguna';
            const fecha = new Date().toLocaleString();
            const id = Date.now(); // Generate unique ID

            const rows = productos.map(p => [
                p.idProducto,
                p.nombre,
                p.ideal,
                p.real,
                p.diferencia,
                detalles
            ]);

            // Create conteo array in the format expected by descargarConteo
            const conteo = [id, fecha, '', '', '', '', '', detalles];
            descargarConteo(conteo, rows);
        };

        // Handle Excel download
        anuncio.querySelector('.descargar-excel').onclick = () => {
            const detalles = document.getElementById('detallesConteo').value || 'Ninguna';
            const fecha = new Date().toLocaleString();
            const id = Date.now(); // Generate unique ID

            const rows = productos.map(p => [
                p.idProducto,
                p.nombre,
                p.ideal,
                p.real,
                p.diferencia,
                detalles
            ]);

            // Generate Excel file
            const wb = XLSX.utils.book_new();

            // Add title rows and data to Excel
            const excelData = [
                [`Conteo de Stock ${id}`],
                [`Fecha: ${fecha}`],
                [], // Empty row
                ['ID', 'Producto', 'S. Ideal', 'S. Real', 'Dif.', 'Detalles'],
                ...rows,
                [], // Empty row
                [`Generado el: ${fecha}`]
            ];

            const ws = XLSX.utils.aoa_to_sheet(excelData);

            // Style the header row
            const headerRange = XLSX.utils.decode_range(ws['!ref']);
            for (let C = headerRange.s.c; C <= headerRange.e.c; ++C) {
                const headerCell = XLSX.utils.encode_cell({ r: 3, c: C });
                if (!ws[headerCell]) ws[headerCell] = {};
                ws[headerCell].s = {
                    fill: { fgColor: { rgb: "2980B9" } },
                    font: { color: { rgb: "FFFFFF" }, bold: true },
                    alignment: { horizontal: "center" },
                    border: {
                        top: { style: "thin", color: { rgb: "505050" } },
                        bottom: { style: "thin", color: { rgb: "505050" } },
                        left: { style: "thin", color: { rgb: "505050" } },
                        right: { style: "thin", color: { rgb: "505050" } }
                    }
                };
            }

            XLSX.utils.book_append_sheet(wb, ws, "Conteo");
            XLSX.writeFile(wb, `conteo-${id}.xlsx`);
        };
    });

    mostrarAnuncio();

    function calcularDiferencia(stockActual, cantidadReal) {
        if (!cantidadReal) return '';
        const diferencia = cantidadReal - stockActual;
        if (diferencia === 0) return 'Coincide';
        return diferencia > 0 ? `+${diferencia}` : diferencia.toString();
    }
    function getDiferenciaStyle(stockActual, cantidadReal) {
        if (!cantidadReal) return '';
        const diferencia = cantidadReal - stockActual;
        return diferencia === 0 ? 'color: #4CAF50;' :
            diferencia < 0 ? 'color: #f44336;' :
                'color: #4CAF50;';
    }
    function descargarConteo(conteo, customRows = null) {
        const [id, fecha, idProducto, producto, ideal, real, diferencia, detalles] = conteo;

        // Use custom rows if provided, otherwise get from DOM
        let rows;
        if (customRows) {
            rows = customRows;
        } else {
            const registrosContainer = document.querySelector('.registros-conteos-grupo');
            rows = Array.from(registrosContainer.querySelectorAll('.registro-card-acopio'))
                .filter(card => card.dataset.id === id)
                .map(card => {
                    const detalles = card.querySelector('.registro-detalles');
                    const producto = card.querySelector('.registro-header .registro-producto-acopio').textContent;
                    return [
                        detalles.querySelector('p:nth-child(3)').textContent.split(':')[1].trim(),
                        producto,
                        detalles.querySelector('p:nth-child(4)').textContent.split(':')[1].trim(),
                        detalles.querySelector('p:nth-child(5)').textContent.split(':')[1].trim(),
                        detalles.querySelector('p:nth-child(6)').textContent.split(':')[1].trim(),
                        detalles.querySelector('p:nth-child(7)').textContent.split(':')[1].trim()
                    ];
                });

            if (rows.length === 0) {
                rows = [[idProducto, producto, ideal, real, diferencia, detalles]];
            }
        }

        const headers = ['ID', 'Producto', 'S. Ideal', 'S. Real', 'Dif.', 'Detalles'];
        const timestamp = new Date().toLocaleString();

        // Generate Excel
        const wb = XLSX.utils.book_new();
        const excelData = [
            [`Conteo de Stock ${id}`],
            [`Fecha: ${fecha}`],
            [],
            headers,
            ...rows,
            [],
            [`Generado el: ${timestamp}`]
        ];

        const ws = XLSX.utils.aoa_to_sheet(excelData);


        // Style Excel headers
        const headerRange = XLSX.utils.decode_range(ws['!ref']);
        for (let C = headerRange.s.c; C <= headerRange.e.c; ++C) {
            const headerCell = XLSX.utils.encode_cell({ r: 3, c: C });
            if (!ws[headerCell]) ws[headerCell] = {};
            ws[headerCell].s = {
                fill: { fgColor: { rgb: "2980B9" } },
                font: { color: { rgb: "FFFFFF" }, bold: true },
                alignment: { horizontal: "center" },
                border: {
                    top: { style: "thin", color: { rgb: "505050" } },
                    bottom: { style: "thin", color: { rgb: "505050" } },
                    left: { style: "thin", color: { rgb: "505050" } },
                    right: { style: "thin", color: { rgb: "505050" } }
                }
            };
        }

        XLSX.utils.book_append_sheet(wb, ws, "Conteo");
        XLSX.writeFile(wb, `conteo-${id}.xlsx`);
        

        // Generate PDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.text(`Conteo de Stock ${id}`, 105, 20, { align: 'center' });
        doc.text(`Fecha: ${fecha}`, 105, 30, { align: 'center' });

        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);

        doc.autoTable({
            head: [headers],
            body: rows,
            startY: 40,
            styles: {
                fontSize: 10,
                cellPadding: 3
            },
            headStyles: {
                fillColor: [41, 128, 185],
                textColor: 255,
                lineWidth: 0.1,
                lineColor: [80, 80, 80]
            },
            bodyStyles: {
                textColor: 0,
                lineWidth: 0.1,
                lineColor: [80, 80, 80]
            },
            alternateRowStyles: {
                fillColor: [245, 245, 245]
            },
            margin: { top: 40 },
            columnStyles: {
                0: { cellWidth: 20 },
                1: { cellWidth: 50 },
                2: { cellWidth: 20 },
                3: { cellWidth: 20 },
                4: { cellWidth: 20 },
                5: { cellWidth: 50 }
            },
            tableLineColor: [80, 80, 80],
            tableLineWidth: 0.1,
            didDrawPage: function (data) {
                doc.setFontSize(10);
                doc.text(`Generado el: ${timestamp}`, 105, 285, { align: 'center' });
            }
        });

        doc.save(`conteo-${id}.pdf`);

    }

}


/* ==================== FUNCIONES DE REGISTRO DEL MOVIMIENTO SALIDA O INGRESO DE ALMACEN ==================== */
async function registrarMovimiento(tipo, producto, cantidad, razon = '') {
    try {
        const operario = await obtenerUsuarioActual();
        const response = await fetch('/registrar-movimiento-almacen', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                tipo,
                producto,
                cantidad,
                operario,
                razon
            })
        });

        const data = await response.json();
        if (!data.success) {
            throw new Error('Error al registrar movimiento');
        }
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}


