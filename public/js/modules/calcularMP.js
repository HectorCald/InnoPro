export function inicializarCalcularMP() {
    const container = document.querySelector('.calcularMP-view');
    container.style.display = 'flex';

    container.innerHTML = `
        <div class="title">
            <h3><i class="fas fa-calculator"></i> Cálculo de Materia Prima</h3>
        </div>
        <div class="mp-container">
            <div class="mp-botones">
                <div class="cuadro-btn">
                    <button class="btn-registrar-mp">
                        <i class="fas fa-plus-circle"></i>
                    </button>
                    <p>Registrar</p>
                </div>
            </div>    
            <div class="lista-registros">
                <div class="mp-header">
                    <div class="search-bar">
                        <input type="text" id="searchMP" placeholder="Buscar registro...">
                        <i class="fas fa-search search-icon"></i>
                    </div>
                </div>
                <div class="registros-grid" id="registrosContainer">
                </div>
            </div>
        </div>
    `;

    const btnRegistrar = container.querySelector('.btn-registrar-mp');
    btnRegistrar.onclick = mostrarFormularioRegistroMP;
    configurarBusqueda();

    // Cargar registros
    cargarRegistrosMP();
}
function configurarBusqueda() {
    const searchInput = document.getElementById('searchMP');
    const searchIcon = document.querySelector('.search-icon');

    searchInput.addEventListener('input', (e) => {
        const searchTerm = normalizarTexto(e.target.value);
        const registros = document.querySelectorAll('.registro-card');
        let registrosEncontrados = false;

        if (e.target.value.length > 0) {
            searchIcon.classList.remove('fa-search');
            searchIcon.classList.add('fa-times');
        } else {
            searchIcon.classList.remove('fa-times');
            searchIcon.classList.add('fa-search');
        }

        registros.forEach(registro => {
            const nombre = normalizarTexto(registro.querySelector('.registro-nombre span').textContent);
            const mp = normalizarTexto(registro.querySelector('.registro-mp').textContent);
            if (nombre.includes(searchTerm) || mp.includes(searchTerm)) {
                registro.style.display = 'block';
                registrosEncontrados = true;
            } else {
                registro.style.display = 'none';
            }
        });

        mostrarMensajeNoResultados(registrosEncontrados, e.target.value);
    });

    searchIcon.addEventListener('click', () => {
        if (searchInput.value.length > 0) {
            searchInput.value = '';
            searchIcon.classList.remove('fa-times');
            searchIcon.classList.add('fa-search');
            document.querySelectorAll('.registro-card').forEach(registro => {
                registro.style.display = 'block';
            });
            const noResultsMessage = document.querySelector('.no-results-message');
            if (noResultsMessage) noResultsMessage.remove();
        }
    });
}
function normalizarTexto(texto) {
    return texto.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}
function mostrarMensajeNoResultados(encontrados, busqueda) {
    const container = document.getElementById('registrosContainer');
    const mensajeExistente = document.querySelector('.no-results-message');

    if (!encontrados && busqueda) {
        if (!mensajeExistente) {
            container.innerHTML += `
                <div class="no-results-message">
                    <i class="fas fa-search"></i>
                    <p>No se encontraron registros que contengan "${busqueda}"</p>
                </div>
            `;
        }
    } else if (mensajeExistente) {
        mensajeExistente.remove();
    }
}
async function cargarRegistrosMP() {
    try {
        mostrarCarga();
        const response = await fetch('/obtener-registros-mp');
        if (!response.ok) throw new Error('Error al cargar registros');

        const data = await response.json();
        const container = document.getElementById('registrosContainer');

        if (!data.registros || data.registros.length === 0) {
            container.innerHTML = '<div class="no-results-message">No hay registros disponibles</div>';
            return;
        }

        // Ordenar registros por ID numérico (extraer número después de "RMP-")
        const registrosOrdenados = data.registros.sort((a, b) => {
            const numA = Number(a.id.split('-')[1]);
            const numB = Number(b.id.split('-')[1]);
            return numB - numA; // Orden descendente
        });

        container.innerHTML = '';
        registrosOrdenados.forEach(registro => {
            const card = crearRegistroCard(registro);
            container.appendChild(card);
        });

    } catch (error) {
        console.error('Error:', error);
        document.getElementById('registrosContainer').innerHTML =
            '<div class="no-results-message">Error al cargar los registros</div>';
    } finally {
        ocultarCarga();
    }
}
function crearRegistroCard(registro) {
    const div = document.createElement('div');
    div.className = 'registro-card';

    // Cálculos
    const cantidadIdeal = ((registro.pesoInicial * 1000 - registro.pesoFinal * 1000) / registro.gramaje).toFixed(2);
    const cantidadReal = registro.cantidadProducida;
    const pesoFinalIdeal = ((cantidadReal * registro.gramaje / 1000) - registro.pesoInicial).toFixed(2);

    // Determinar la clase basada en si tiene peso final
    const pesoFinalClass = registro.pesoFinal ? 'con-peso' : 'sin-peso';

    div.innerHTML = `
        <div class="registro-header">
            <span class="registro-id">${registro.id}</span>
            <span class="registro-fecha">${registro.fecha}</span>
        </div>
        <div class="registro-info">
            <div class="registro-nombre">
                <i class="fas fa-user"></i>
                <span>${registro.nombre}</span>
            </div>
            <div class="registro-mp ${pesoFinalClass}">${registro.materiaPrima}</div>
        </div>
    `;

    div.addEventListener('click', () => mostrarDetalleRegistroMP(registro));
    return div;
}


function calcularDatosProducto(cantidadReal, gramaje) {
    const pesoUsadoIdeal = (cantidadReal * gramaje / 1000).toFixed(2);
    return {
        pesoUsadoIdeal,
        cantidadReal,
        gramaje
    };
}
function calcularPesoFinalIdeal(pesoInicial, productosCalculados) {
    const pesoUsadoIdealTotal = productosCalculados.reduce((sum, prod) =>
        sum + Number(prod.pesoUsadoIdeal), 0);

    return {
        pesoUsadoIdealTotal: pesoUsadoIdealTotal.toFixed(2),
        pesoFinalIdeal: (pesoInicial - pesoUsadoIdealTotal).toFixed(2)
    };
}
function generarFormatoCalculo(producto, pesoInicial, pesoFinal, cantidadIdeal) {
    return {
        cantidadIdeal: {
            formula: `(${pesoInicial} kg × 1000) ÷ ${producto.gramaje}g`,
            resultado: `${cantidadIdeal} und.`
        },
        cantidadReal: {
            formula: `Cantidad registrada en producción`,
            resultado: `${producto.cantidadReal} und.`
        },
        pesoUsadoIdeal: {
            formula: `${producto.cantidadReal} unidades × ${producto.gramaje}g ÷ 1000`,
            resultado: `${producto.pesoUsadoIdeal} kg`
        }
    };
}
function mostrarDetalleRegistroMP(registro) {
    // Separar datos de múltiples productos
    const productos = {
        nombres: registro.materiaPrima.split('-'),
        gramajes: registro.gramaje.split('-').map(Number),
        cantidades: registro.cantidadProducida.toString().split('-').map(Number)
    };

    // Calcular datos para cada producto usando las funciones auxiliares
    const productosCalculados = productos.nombres.map((nombre, index) => {
        const datosProducto = calcularDatosProducto(
            productos.cantidades[index],
            productos.gramajes[index]
        );

        return {
            nombre,
            ...datosProducto,
            formatoCalculo: generarFormatoCalculo(
                datosProducto,
                registro.pesoInicial,
                registro.pesoFinal,
                ((registro.pesoInicial * 1000) / datosProducto.gramaje).toFixed(2)
            )
        };
    });

    // Calcular totales usando la función auxiliar
    const { pesoUsadoIdealTotal, pesoFinalIdeal } = calcularPesoFinalIdeal(
        registro.pesoInicial,
        productosCalculados
    );
    const diferenciaPesoFinal = (registro.pesoFinal - pesoFinalIdeal).toFixed(2);

    const anuncio = document.querySelector('.anuncio');
    const contenido = anuncio.querySelector('.anuncio-contenido');

    contenido.innerHTML = `
        <h2 class="titulo-modal"><i class="fas fa-calculator"></i> Detalle de Registro</h2>
        <div class="relleno">
            <div class="producto-detalles">
                <div class="detalle-seccion">
                    <p>Información General:</p>               
                    <div class="detalles-grup">
                        <div class="detalle-item">
                            <p>ID:</p> <span>${registro.id}</span>
                        </div>
                        <div class="detalle-item">
                            <p>Fecha:</p> <span>${registro.fecha}</span>
                        </div>
                        <div class="detalle-item">
                            <p>Nombre:</p> <span>${registro.nombre}</span>
                        </div>
                        <div class="detalle-item">
                            <p>Responsable:</p> <span>${registro.responsable}</span>
                        </div>
                    </div>
                    <p>Datos Generales de Producción:</p>  
                    <div class="detalles-grup">
                        <div class="detalle-item">
                            <p>Peso Inicial Total:</p> <span>${registro.pesoInicial} kg</span>
                        </div>
                        <div class="detalle-item">
                            <p>Peso Final Total:</p> <span>${registro.pesoFinal} kg</span>
                        </div>
                        <div class="detalle-item">
                            <p>Peso Merma Total:</p> <span>${registro.pesoMerma} kg</span>
                        </div>
                    </div>
                    <p>Totales Calculados:</p>
                    <div class="detalles-grup">
                        <div class="detalle-item calculo">
                            <div class="calculo-header">
                                <p>Peso Usado Ideal Total:</p>
                                <button class="btn-info" title="Ver proceso">
                                    <i class="fas fa-info-circle" style="border:none"></i>
                                </button>
                            </div>
                            <div class="calculo-detalle">
                                <div class="resultado">${pesoUsadoIdealTotal} kg</div>
                                <div class="formula" style="display: none;">
                                    ${productosCalculados.map(p =>
        `${p.nombre}: ${p.pesoUsadoIdeal} kg`
    ).join(' + ')}
                                </div>
                            </div>
                        </div>
                        <div class="detalle-item calculo">
                            <div class="calculo-header">
                                <p>Peso Final Ideal:</p>
                                <button class="btn-info" title="Ver proceso">
                                    <i class="fas fa-info-circle"  style="border:none"></i>
                                </button>
                            </div>
                            <div class="calculo-detalle">
                                <div class="resultado">${pesoFinalIdeal} kg</div>
                                <div class="formula" style="display: none;">
                                    ${registro.pesoInicial} kg - ${pesoUsadoIdealTotal} kg
                                </div>
                            </div>
                        </div>
                        <div class="detalle-item calculo">
                            <div class="calculo-header">
                                <p>Diferencia en Peso Final:</p>
                                <button class="btn-info" title="Ver proceso">
                                    <i class="fas fa-info-circle" style="border:none"></i>
                                </button>
                            </div>
                            <div class="calculo-detalle">
                                <div class="resultado ${diferenciaPesoFinal > 0 ? 'positivo' : 'negativo'}">
                                    ${diferenciaPesoFinal} kg
                                </div>
                                <div class="formula" style="display: none;">
                                    ${registro.pesoFinal} kg - ${pesoFinalIdeal} kg
                                </div>
                            </div>
                        </div>
                    </div>
                    <p>Observaciones:</p>  
                    <div class="detalles-grup">
                        <div class="detalle-item">
                            <span>${registro.observaciones || 'Ninguna'}</span>
                        </div>
                    </div>
                    ${productosCalculados.map((producto, index) => `
                        <div class="producto-section">
                            <p>Producto ${index + 1}: ${producto.nombre}</p>
                            <div class="detalles-grup">
                                <div class="detalle-item">
                                    <p>Gramaje:</p> <span>${producto.gramaje} g</span>
                                </div>
                                <div class="detalle-item">
                                    <p>Cantidad Producida:</p> <span>${producto.cantidadReal} unidades</span>
                                </div>
                                <div class="detalle-item calculo">
                                    <div class="calculo-header">
                                        <p>Peso Usado Ideal:</p>
                                        <button class="btn-info" title="Ver proceso">
                                            <i class="fas fa-info-circle"   style="border:none"></i>
                                        </button>
                                    </div>
                                    <div class="calculo-detalle">
                                        <div class="resultado">${producto.pesoUsadoIdeal} kg</div>
                                        <div class="formula" style="display: none;">
                                            ${producto.formatoCalculo.pesoUsadoIdeal.formula}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
        <div class="anuncio-botones">
            <button class="anuncio-btn blue editar">
                <i class="fas fa-edit"></i> Editar
            </button>
            <button class="anuncio-btn green guardar" style="display: none;">
                <i class="fas fa-save"></i> Guardar
            </button>
            <button class="anuncio-btn red eliminar">
                <i class="fas fa-trash"></i> Eliminar
            </button>
            <button class="anuncio-btn close cancelar">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;

    anuncio.style.display = 'flex';

    // Event listeners
    const btnEditar = contenido.querySelector('.editar');
    const btnEliminar = contenido.querySelector('.eliminar');
    const btnCancelar = contenido.querySelector('.cancelar');

    contenido.querySelectorAll('.btn-info').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const formula = e.target.closest('.detalle-item').querySelector('.formula');
            formula.style.display = formula.style.display === 'none' ? 'block' : 'none';
        });
    });

    btnCancelar.onclick = () => {
        anuncio.style.display = 'none';
    };

    btnEditar.onclick = () => {
        editarRegistroMP(registro);
    };

    btnEliminar.onclick = () => {
        mostrarConfirmacionEliminarMP(registro.id, registro.nombre);
    };
}



function mostrarFormularioRegistroMP() {
    const anuncio = document.querySelector('.anuncio');
    const contenido = anuncio.querySelector('.anuncio-contenido');

    contenido.innerHTML = `
        <h2><i class="fas fa-calculator"></i> Registrar</h2>
        <div class="relleno">
            <div class="form-grup">
                <div class="campo-form">
                    <p>Fecha:</p>
                    <input type="date" id="fechaMP" class="edit-input" value="${new Date().toISOString().split('T')[0]}">
                </div>
                <div class="campo-form">
                    <p>Nombre:</p>
                    <select id="nombreMP" class="edit-input">
                        <option value="">Seleccione un usuario...</option>
                    </select>
                </div>
                <div class="campo-form">
                    <p>Responsable:</p>
                    <select id="responsableMP" class="edit-input">
                        <option value="">Seleccione un responsable...</option>
                    </select>
                </div>
                <div class="campo-form">
                    <p>Peso Inicial:</p>
                    <input type="number" id="pesoInicialMP" class="edit-input" step="0.01" min="0" placeholder="(Kg)">
                </div>
            </div>
            <p>Materias Primas:</p>
            <div class="form-grup">
                
                <div class="lista-productos-seleccionados"></div>
            </div>
            <p>Agregar Materia Prima:</p>
            <div class="form-grup">
                <div class="autocomplete-wrapper">
                    <input type="text" id="buscarProducto" class="edit-input" placeholder="Escriba para buscar...">
                    <div class="sugerencias-container" style="display: none;"></div>
                </div>
            </div>
            <div class="producto-seleccionado form-grup" style="display: none;">
                <p><strong>Selección:</strong> <span id="nombreProductoSeleccionado"></span></p>
                <input type="hidden" id="idProductoSeleccionado">
                <div class="campo-form">
                    <p>Gramaje:</p>
                    <input type="number" id="gramajeMP" class="edit-input" min="1">
                </div>
                <div class="campo-form">
                    <p>Cantidad:</p>
                    <input type="number" id="cantidadMP" class="edit-input" min="1">
                </div>
                <button class="anuncio-btn blue agregar-a-lista">
                    <i class="fas fa-plus"></i> Agregar a la lista
                </button>
            </div>
        </div>
        <div class="anuncio-botones">
            <button class="anuncio-btn green guardar" disabled>
                <i class="fas fa-save"></i> Guardar
            </button>
            <button class="anuncio-btn close cancelar">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;

    anuncio.style.display = 'flex';
    let materiasSeleccionadas = [];

    // Cargar usuarios
    cargarUsuarios();

    // Cargar productos
    cargarProductosAlmacen();

    // Configurar eventos
    configurarBuscadorProductos();
    configurarBotonAgregar();
    configurarBotonesGuardarCancelar();

    async function cargarUsuarios() {
        try {
            const response = await fetch('/obtener-usuarios');
            const data = await response.json();
            const selectNombre = document.getElementById('nombreMP');
            const selectResponsable = document.getElementById('responsableMP');

            data.usuarios.forEach(usuario => {
                const option = new Option(usuario.nombre, usuario.nombre);
                selectNombre.add(option.cloneNode(true));
                selectResponsable.add(option);
            });
        } catch (error) {
            console.error('Error al cargar usuarios:', error);
        }
    }

    async function cargarProductosAlmacen() {
        try {
            const response = await fetch('/obtener-almacen-general');
            const data = await response.json();
            window.productosAlmacen = data.pedidos;
        } catch (error) {
            console.error('Error al cargar productos:', error);
        }
    }

    function configurarBuscadorProductos() {
        const inputBuscar = document.getElementById('buscarProducto');
        const sugerencias = document.querySelector('.sugerencias-container');
        const productoSeleccionado = document.querySelector('.producto-seleccionado');

        // Cargar productos al inicio
        let productos = [];

        async function cargarProductos() {
            try {
                const response = await fetch('/obtener-productos');
                const data = await response.json();
                productos = data.productos;
            } catch (error) {
                console.error('Error al cargar productos:', error);
            }
        }

        cargarProductos();

        inputBuscar.addEventListener('input', () => {
            const busqueda = inputBuscar.value.toLowerCase().trim();

            if (busqueda.length < 2) {
                sugerencias.style.display = 'none';
                return;
            }

            const productosFiltrados = productos.filter(producto =>
                producto.toLowerCase().includes(busqueda)
            );

            if (productosFiltrados.length > 0) {
                sugerencias.innerHTML = `
                <ul class="sugerencias-list">
                    ${productosFiltrados.map(producto => `
                        <li class="sugerencia-item">${producto}</li>
                    `).join('')}
                </ul>
            `;
                sugerencias.style.display = 'block';

                // Manejar clics en sugerencias
                sugerencias.querySelectorAll('.sugerencia-item').forEach(item => {
                    item.addEventListener('click', () => {
                        const nombreProducto = item.textContent;
                        document.getElementById('nombreProductoSeleccionado').textContent = nombreProducto;
                        inputBuscar.value = '';
                        sugerencias.style.display = 'none';
                        productoSeleccionado.style.display = 'block';
                    });
                });
            } else {
                sugerencias.innerHTML = '<div class="no-sugerencias">No se encontraron productos</div>';
                sugerencias.style.display = 'block';
            }
        });

        // Cerrar sugerencias al hacer clic fuera
        document.addEventListener('click', (e) => {
            if (!inputBuscar.contains(e.target) && !sugerencias.contains(e.target)) {
                sugerencias.style.display = 'none';
            }
        });
    }

    function configurarBotonAgregar() {
        const btnAgregar = document.querySelector('.agregar-a-lista');
        const listaProductos = document.querySelector('.lista-productos-seleccionados');

        btnAgregar.onclick = () => {
            const nombre = document.getElementById('nombreProductoSeleccionado').textContent;
            const gramaje = document.getElementById('gramajeMP').value;
            const cantidad = document.getElementById('cantidadMP').value;

            if (!nombre || !gramaje || !cantidad) {
                mostrarNotificacion('Por favor complete todos los campos', 'error');

                return;
            }

            const materiaprima = {
                nombre,
                gramaje: Number(gramaje),
                cantidad: Number(cantidad)
            };

            materiasSeleccionadas.push(materiaprima);
            actualizarListaProductos();

            // Limpiar campos
            document.querySelector('.producto-seleccionado').style.display = 'none';
            document.getElementById('gramajeMP').value = '';
            document.getElementById('cantidadMP').value = '';

            // Habilitar botón guardar si hay al menos un producto
            document.querySelector('.guardar').disabled = false;
        };

        function actualizarListaProductos() {
            listaProductos.innerHTML = `
        <div class="pedidos-agregados detalles-grup" style="background:none;">
            ${materiasSeleccionadas.map((mp, index) => `
                <div class="campo-form">
                    <div class="detalle-item">
                        <p>${mp.nombre}</p>
                    </div>
                    <div class="detalle-item">
                        <span>${mp.gramaje}g. - ${mp.cantidad}u.</span>
                        <div class="detalle-item">
                            <i class="fas fa-times btn-eliminar delete" data-index="${index}"></i>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;

            listaProductos.querySelectorAll('.btn-eliminar').forEach(btn => {
                btn.onclick = (e) => {
                    const index = e.currentTarget.dataset.index;
                    materiasSeleccionadas.splice(index, 1);
                    actualizarListaProductos();
                    document.querySelector('.guardar').disabled = materiasSeleccionadas.length === 0;
                };
            });
        }
    }

    function configurarBotonesGuardarCancelar() {
        const btnGuardar = document.querySelector('.guardar');
        const btnCancelar = document.querySelector('.cancelar');

        btnGuardar.onclick = async () => {
            const fecha = document.getElementById('fechaMP').value;
            const nombre = document.getElementById('nombreMP').value;
            const responsable = document.getElementById('responsableMP').value;
            const pesoInicial = document.getElementById('pesoInicialMP').value;

            if (!fecha || !nombre || !responsable || !pesoInicial || materiasSeleccionadas.length === 0) {
                mostrarNotificacion('Por favor complete todos los campos', 'error');
                return;
            }

            const registro = {
                fecha,
                nombre,
                responsable,
                pesoInicial,
                materiaPrima: materiasSeleccionadas.map(mp => mp.nombre).join('-'),
                gramaje: materiasSeleccionadas.map(mp => mp.gramaje).join('-'),
                cantidadProducida: materiasSeleccionadas.map(mp => mp.cantidad).join('-')
            };

            try {
                mostrarCarga();
                const response = await fetch('/registrar-calculo-mp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(registro)
                });

                if (!response.ok) throw new Error('Error al guardar');

                mostrarNotificacion('¡Registro guardado exitosamente!', 'success');
                anuncio.style.display = 'none';
                cargarRegistrosMP(); // Recargar lista de registros
            } catch (error) {
                console.error('Error:', error);
                mostrarNotificacion('Error al guardar el registro', 'error');
            } finally {
                ocultarCarga();
            }
        };

        btnCancelar.onclick = () => {
            anuncio.style.display = 'none';
        };
    }
}
function mostrarConfirmacionEliminarMP(id, nombre) {
    const anuncio = document.querySelector('.anuncio');
    const contenido = anuncio.querySelector('.anuncio-contenido');

    contenido.innerHTML = `
        <h2 class="titulo-modal"><i class="fas fa-trash"></i> Eliminar Registro</h2>
        <div class="relleno">
            <p>¿Está seguro que desea eliminar el registro de ${nombre}?</p>
            <p class="text-danger"><strong>Esta acción no se puede deshacer.</strong></p>
        </div>
        <div class="anuncio-botones">
            <button class="anuncio-btn red confirmar">
                <i class="fas fa-trash"></i> Eliminar
            </button>
            <button class="anuncio-btn close cancelar">
                 <i class="fas fa-times"></i>
            </button>
        </div>
    `;

    anuncio.style.display = 'flex';

    const btnConfirmar = contenido.querySelector('.confirmar');
    const btnCancelar = contenido.querySelector('.cancelar');

    btnConfirmar.onclick = async () => {
        try {
            mostrarCarga();
            const response = await fetch(`/eliminar-registro-mp/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Error al eliminar');

            mostrarNotificacion('Registro eliminado exitosamente', 'success');
            anuncio.style.display = 'none';
            cargarRegistrosMP(); // Recargar lista
        } catch (error) {
            console.error('Error:', error);
            mostrarNotificacion('Error al eliminar el registro', 'error');
        } finally {
            ocultarCarga();
        }
    };

    btnCancelar.onclick = () => {
        anuncio.style.display = 'none';
    };
}
function editarRegistroMP(registro) {
    const anuncio = document.querySelector('.anuncio');
    const contenido = anuncio.querySelector('.anuncio-contenido');

    // Split the joined strings back into arrays
    const productos = {
        nombres: registro.materiaPrima.split('-'),
        gramajes: registro.gramaje.split('-').map(Number),
        cantidades: registro.cantidadProducida.toString().split('-').map(Number)
    };

    // Create array of product objects
    let materiasSeleccionadas = productos.nombres.map((nombre, i) => ({
        nombre: nombre,
        gramaje: productos.gramajes[i],
        cantidad: productos.cantidades[i]
    }));

    // Set up HTML template
    contenido.innerHTML = `
        <h2><i class="fas fa-edit"></i> Editar Registro</h2>
        <div class="relleno">
            <div class="form-grup">
                <div class="campo-form">
                    <p>Fecha:</p>
                    <input type="date" id="fechaMP" class="edit-input" value="${registro.fecha}">
                </div>
                <div class="campo-form">
                    <p>Nombre:</p>
                    <select id="nombreMP" class="edit-input">
                        <option value="${registro.nombre}">${registro.nombre}</option>
                    </select>
                </div>
                <div class="campo-form">
                    <p>Responsable:</p>
                    <select id="responsableMP" class="edit-input">
                        <option value="${registro.responsable}">${registro.responsable}</option>
                    </select>
                </div>
                <div class="campo-form">
                    <p>Peso Inicial:</p>
                    <input type="number" id="pesoInicialMP" class="edit-input" step="0.01" min="0" value="${registro.pesoInicial}">
                </div>
                <div class="campo-form">
                    <p>Peso Final:</p>
                    <input type="number" id="pesoFinalMP" class="edit-input" step="0.01" min="0" value="${registro.pesoFinal}">
                </div>
            </div>
            <div class="productos-seleccionados">
                <p>Materias Primas:</p>
                <div class="lista-productos-seleccionados"></div>
            </div>
            <p>Agregar Materia Prima:</p>
            <div class="form-grup">
                <div class="autocomplete-wrapper">
                    <input type="text" id="buscarProducto" class="edit-input" placeholder="Escriba para buscar...">
                    <div class="sugerencias-container" style="display: none;"></div>
                </div>
            </div>
            <div class="producto-seleccionado form-grup" style="display: none;">
                <p><strong>Selección:</strong> <span id="nombreProductoSeleccionado"></span></p>
                <div class="campo-form">
                    <p>Gramaje:</p>
                    <input type="number" id="gramajeMP" class="edit-input" min="1">
                </div>
                <div class="campo-form">
                    <p>Cantidad:</p>
                    <input type="number" id="cantidadMP" class="edit-input" min="1">
                </div>
                <button class="anuncio-btn blue agregar-a-lista">
                    <i class="fas fa-plus"></i> Agregar a la lista
                </button>
            </div>
        </div>
        <div class="anuncio-botones">
            <button class="anuncio-btn green guardar">
                <i class="fas fa-save"></i> Guardar
            </button>
            <button class="anuncio-btn close cancelar">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;

    anuncio.style.display = 'flex';

    async function cargarUsuarios() {
        try {
            mostrarCarga();
            const response = await fetch('/obtener-usuarios');
            if (!response.ok) throw new Error('Error al cargar usuarios');

            const data = await response.json();
            const selectNombre = document.getElementById('nombreMP');
            const selectResponsable = document.getElementById('responsableMP');

            selectNombre.innerHTML = '';
            selectResponsable.innerHTML = '';

            data.usuarios.forEach(usuario => {
                selectNombre.add(new Option(usuario.nombre, usuario.nombre));
                selectResponsable.add(new Option(usuario.nombre, usuario.nombre));
            });

            selectNombre.value = registro.nombre;
            selectResponsable.value = registro.responsable;
        } catch (error) {
            console.error('Error al cargar usuarios:', error);
            mostrarNotificacion('Error al cargar usuarios', 'error');
        }finally {
            ocultarCarga();
        }
    }

    async function cargarProductosAlmacen() {
        try {
            mostrarCarga();
            const response = await fetch('/obtener-almacen-general');
            if (!response.ok) throw new Error('Error al cargar productos');

            const data = await response.json();
            window.productosAlmacen = data.pedidos;
        } catch (error) {
            console.error('Error al cargar productos:', error);
            mostrarNotificacion('Error al cargar productos', 'error');
        }finally {
            ocultarCarga();
        }
    }

    function configurarBuscadorProductos() {
        const inputBuscar = document.getElementById('buscarProducto');
        const sugerencias = document.querySelector('.sugerencias-container');
        const productoSeleccionado = document.querySelector('.producto-seleccionado');
        let productos = [];

        async function cargarProductos() {
            try {
                mostrarCarga();
                const response = await fetch('/obtener-productos');
                if (!response.ok) throw new Error('Error al cargar productos');
                const data = await response.json();
                productos = data.productos;
            } catch (error) {
                console.error('Error al cargar productos:', error);
                mostrarNotificacion('Error al cargar productos', 'error');
            }finally{
                ocultarCarga();
            }
        }

        // Load products when initializing
        cargarProductos();

        inputBuscar.addEventListener('input', () => {
            const busqueda = inputBuscar.value.toLowerCase().trim();

            if (busqueda.length < 2) {
                sugerencias.style.display = 'none';
                return;
            }

            const productosFiltrados = productos.filter(producto =>
                producto.toLowerCase().includes(busqueda)
            );

            if (productosFiltrados.length > 0) {
                sugerencias.innerHTML = `
                    <ul class="sugerencias-list">
                        ${productosFiltrados.map(producto => `
                            <li class="sugerencia-item">${producto}</li>
                        `).join('')}
                    </ul>
                `;
                sugerencias.style.display = 'block';

                sugerencias.querySelectorAll('.sugerencia-item').forEach(item => {
                    item.addEventListener('click', () => {
                        document.getElementById('nombreProductoSeleccionado').textContent = item.textContent;
                        inputBuscar.value = '';
                        sugerencias.style.display = 'none';
                        productoSeleccionado.style.display = 'block';
                    });
                });
            } else {
                sugerencias.innerHTML = '<div class="no-sugerencias">No se encontraron productos</div>';
                sugerencias.style.display = 'block';
            }
        });

        // Close suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (!inputBuscar.contains(e.target) && !sugerencias.contains(e.target)) {
                sugerencias.style.display = 'none';
            }
        });

        // Close suggestions when pressing Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                sugerencias.style.display = 'none';
            }
        });
    }

    function configurarBotonAgregar() {
        const btnAgregar = document.querySelector('.agregar-a-lista');

        btnAgregar.onclick = () => {
            const nombre = document.getElementById('nombreProductoSeleccionado').textContent;
            const gramaje = document.getElementById('gramajeMP').value;
            const cantidad = document.getElementById('cantidadMP').value;

            if (!nombre || !gramaje || !cantidad) {
                mostrarNotificacion('Por favor complete todos los campos', 'error');
                return;
            }

            materiasSeleccionadas.push({
                nombre,
                gramaje: Number(gramaje),
                cantidad: Number(cantidad)
            });

            actualizarListaProductos();
            document.querySelector('.producto-seleccionado').style.display = 'none';
            document.getElementById('gramajeMP').value = '';
            document.getElementById('cantidadMP').value = '';
        };
    }

    function actualizarListaProductos() {
        const listaProductos = document.querySelector('.lista-productos-seleccionados');
        listaProductos.innerHTML = `
            <div class="pedidos-agregados detalles-grup" style="background:none;">
                ${materiasSeleccionadas.map((mp, index) => `
                    <div class="campo-form">
                        <div class="detalle-item">
                            <p>${mp.nombre}</p>
                        </div>
                        <div class="detalle-item">
                            <span>${mp.gramaje}g. - ${mp.cantidad}u.</span>
                            <div class="detalle-item">
                                <i class="fas fa-times btn-eliminar delete" data-index="${index}"></i>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        listaProductos.querySelectorAll('.btn-eliminar').forEach(btn => {
            btn.onclick = (e) => {
                const index = e.currentTarget.dataset.index;
                materiasSeleccionadas.splice(index, 1);
                actualizarListaProductos();
            };
        });
    }

    // Load initial data and configure events
    Promise.all([cargarUsuarios(), cargarProductosAlmacen()])
        .then(() => {
            actualizarListaProductos();
            configurarBuscadorProductos();
            configurarBotonAgregar();
        })
        .catch(error => {
            console.error('Error loading initial data:', error);
            mostrarNotificacion('Error al cargar datos iniciales', 'error');
        });

    // Configure save and cancel buttons
    const btnGuardar = contenido.querySelector('.guardar');
    const btnCancelar = contenido.querySelector('.cancelar');

    btnGuardar.onclick = async () => {
        const fecha = document.getElementById('fechaMP').value;
        const nombre = document.getElementById('nombreMP').value;
        const responsable = document.getElementById('responsableMP').value;
        const pesoInicial = document.getElementById('pesoInicialMP').value;
        const pesoFinal = document.getElementById('pesoFinalMP').value;

        if (!fecha || !nombre || !responsable || !pesoInicial || !pesoFinal || materiasSeleccionadas.length === 0) {
            mostrarNotificacion('Por favor complete todos los campos', 'error');
            return;
        }

        const registroActualizado = {
            id: registro.id,
            fecha,
            nombre,
            responsable,
            pesoInicial,
            pesoFinal,
            materiaPrima: materiasSeleccionadas.map(mp => mp.nombre).join('-'),
            gramaje: materiasSeleccionadas.map(mp => mp.gramaje).join('-'),
            cantidadProducida: materiasSeleccionadas.map(mp => mp.cantidad).join('-')
        };

        try {
            mostrarCarga();
            const response = await fetch('/actualizar-registro-mp', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(registroActualizado)
            });

            if (!response.ok) throw new Error('Error al actualizar');

            mostrarNotificacion('¡Registro actualizado exitosamente!', 'success');
            anuncio.style.display = 'none';
            cargarRegistrosMP();
        } catch (error) {
            console.error('Error:', error);
            mostrarNotificacion('Error al actualizar el registro', 'error');
        }finally {
            ocultarCarga();
        }
    };

    btnCancelar.onclick = () => {
        anuncio.style.display = 'none';
    };
}