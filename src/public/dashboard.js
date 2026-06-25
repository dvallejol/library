const API_URL = 'http://localhost:8080/api';

let listaPrestamosGlobal = []; // Guarda el historial completo
let paginaActualPrestamos = 1;  // Página donde inicia
const registrosPorPagina = 5;  // Cantidad de filas a mostrar por vista
let listaLibrosGlobal = [];

// 1. Verificar sesión de forma inmediata antes de renderizar nada
const usuarioLogueado = JSON.parse(sessionStorage.getItem('usuarioLogueado'));
if (!usuarioLogueado) {
    window.location.href = 'index.html';
}

// 2. Inicialización cuando el DOM está 100% listo (Previene que el JS se congele)
document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================
    // ANCLAJE DEL BOTÓN DE CERRAR SESIÓN
    // ==========================================
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            sessionStorage.clear(); // Limpia los datos de sesión y rol de la memoria
            window.location.href = 'index.html'; // Redirección inmediata al login
        });
    }

    // Pintar mensaje de bienvenida si existe el elemento
    const welcomeMessage = document.getElementById('welcomeMessage');
    if (welcomeMessage) {
        welcomeMessage.innerText = `Hola, ${usuarioLogueado.nombre} (${usuarioLogueado.rol || 'lector'})`;
    }
    
    const presNombreUsuario = document.getElementById('presNombreUsuario');
    if (presNombreUsuario) {
        presNombreUsuario.value = usuarioLogueado.nombre;
    }

    // APLICAR RESTRICCIONES VISUALES Y DE FLUJO SEGÚN EL ROL
    const esAdmin = usuarioLogueado.rol === 'admin';
    if (!esAdmin) {
        // 🔥 CORRECCIÓN: Ocultamos SOLO el formulario, NO la sección del catálogo completa
        const libroForm = document.getElementById('libroForm');
        if (libroForm) libroForm.style.display = 'none'; 

        // Ocultar formulario de préstamos si existe
        const prestamoForm = document.getElementById('prestamoForm');
        if (prestamoForm && prestamoForm.parentElement) prestamoForm.parentElement.style.display = 'none';

        // Ocultar filtros de fechas si existen
        const contenedorFiltros = document.getElementById('contenedorFiltrosFechas');
        if (contenedorFiltros) contenedorFiltros.style.display = 'none';

        // Ocultar panel de solicitudes pendientes para lectores
        const seccionSol = document.getElementById('seccionSolicitudesPendientes');
        if (seccionSol) seccionSol.style.display = 'none';
    } else {
        // SI ES ADMIN: Habilitamos visualmente el contenedor de solicitudes entrantes
        const seccionSol = document.getElementById('seccionSolicitudesPendientes');
        if (seccionSol) seccionSol.style.display = 'block';
        
        // Ejecutamos la carga inicial de solicitudes pendientes
        cargarSolicitudesPendientes();
    }

    // Escuchar botones de filtros de fecha por si acaso existen en el HTML
    document.getElementById('btnAplicarFiltroFecha')?.addEventListener('click', () => {
        paginaActualPrestamos = 1;
        cargarHistorialPrestamos();
    });

    document.getElementById('btnLimpiarFiltroFecha')?.addEventListener('click', () => {
        if (document.getElementById('filtroFechaInicio')) document.getElementById('filtroFechaInicio').value = '';
        if (document.getElementById('filtroFechaFin')) document.getElementById('filtroFechaFin').value = '';
        paginaActualPrestamos = 1;
        cargarHistorialPrestamos();
    });

    // Arrancar las cargas automáticas de datos de las tablas base
    cargarLibros();
    cargarHistorialPrestamos();
});

// 3. Cargar Catálogo de Libros
async function cargarLibros() {
    try {
        const response = await fetch(`${API_URL}/libros`);
        if (!response.ok) return;

        listaLibrosGlobal = await response.json();
        renderizarTabla(listaLibrosGlobal);
        actualizarSelectLibros(listaLibrosGlobal);
        
        // 🔥 CALCULAMOS LOS KPIs EN CALIENTE APENAS CARGAN LOS LIBROS
        if (typeof actualizarTarjetasEstadisticas === 'function') {
            actualizarTarjetasEstadisticas();
        }
    } catch (error) {
        console.error('Error al cargar libros:', error);
    }
}

// 4. Renderizar Tabla del Catálogo (Condiciona la columna de acciones)
function renderizarTabla(libros) {
    const tbody = document.querySelector('#tablaLibros tbody');
    if (!tbody) return;
    tbody.innerHTML = ''; 

    const esAdmin = usuarioLogueado && usuarioLogueado.rol === 'admin';

    // Ahora la columna de acciones SIEMPRE se ve, pero cambia su contenido según el rol
    const thAcciones = document.querySelector('#tablaLibros th:nth-child(6)');
    if (thAcciones) thAcciones.style.display = ''; 

    libros.forEach(libro => {
        const tr = document.createElement('tr');
        const stockVisual = libro.stock > 0 
            ? `<span class="status-badge status-disponible">${libro.stock} unidades</span>` 
            : '<span class="status-badge status-prestado" style="background:#f8d7da; color:#721c24;">Agotado</span>';

        // Definimos qué botones pintar según el rol del que navega
        let botonesAccion = '';
        if (esAdmin) {
            botonesAccion = `
                <button class="btn-edit" onclick="prepararEdicion(${libro.id_libro}, '${libro.titulo}', '${libro.autor}', ${libro.anio}, ${libro.stock})">Editar</button>
                <button class="btn-return" style="margin-left:5px;" onclick="ejecutarDevolucion(${libro.id_libro})">Devolver</button>
            `;
        } else {
            // Botón para el Lector: Deshabilitado si el libro no tiene stock
            botonesAccion = libro.stock > 0 
                ? `<button class="btn-edit" style="background: #28a745;" onclick="solicitarPrestamo(${libro.id_libro})">Solicitar</button>`
                : `<button disabled style="background: #ccc; color:#666; border:none; padding:5px 10px; border-radius:4px; cursor:not-allowed;">No Disponible</button>`;
        }

        tr.innerHTML = `
            <td>${libro.id_libro}</td>
            <td>${libro.titulo}</td>
            <td>${libro.autor}</td>
            <td>${libro.anio}</td>
            <td>${stockVisual}</td>
            <td>${botonesAccion}</td>
        `;
        tbody.appendChild(tr);
    });
}
// 5. Actualizar Select de Libros
function actualizarSelectLibros(libros) {
    const select = document.getElementById('presSelectLibro');
    if (!select) return;
    select.innerHTML = '<option value="">-- Seleccione un libro --</option>';

    const disponibles = libros.filter(l => l.stock > 0);
    disponibles.forEach(libro => {
        const option = document.createElement('option');
        option.value = libro.id_libro;
        option.textContent = `[ID: ${libro.id_libro}] ${libro.titulo} (${libro.stock} ud.)`;
        select.appendChild(option);
    });
}

// 6. Cargar la bitácora enviando Query Params de Filtros y Rol
async function cargarHistorialPrestamos() {
    try {
        const fechaInicio = document.getElementById('filtroFechaInicio')?.value || '';
        const fechaFin = document.getElementById('filtroFechaFin')?.value || '';

        const queryParams = new URLSearchParams({
            rol: usuarioLogueado.rol || 'lector',
            id_usuario: usuarioLogueado.id_usuario,
            fechaInicio: fechaInicio,
            fechaFin: fechaFin
        });

        const response = await fetch(`${API_URL}/prestamos?${queryParams.toString()}`);
        if (!response.ok) return;

        listaPrestamosGlobal = await response.json();
        renderizarTablaHistorial();

        // 🔥 CALCULAMOS LOS KPIs EN CALIENTE APENAS CARGAN LOS PRÉSTAMOS
        if (typeof actualizarTarjetasEstadisticas === 'function') {
            actualizarTarjetasEstadisticas();
        }
    } catch (error) {
        console.error('Error al cargar la bitácora de auditoría:', error);
    }
}

// 7. Renderizar Tabla Historial con Paginación Local
function renderizarTablaHistorial() {
    const tbody = document.querySelector('#tablaHistorialPrestamos tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (listaPrestamosGlobal.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:15px; color:#999;">No hay registros de préstamos en el sistema.</td></tr>`;
        return;
    }

    const indiceInicio = (paginaActualPrestamos - 1) * registrosPorPagina;
    const indiceFin = indiceInicio + registrosPorPagina;
    const prestamosPagina = listaPrestamosGlobal.slice(indiceInicio, indiceFin);

    prestamosPagina.forEach(reg => {
        const tr = document.createElement('tr');
        // Busca esta línea dentro de renderizarTablaHistorial() y déjala así:
    const badgeEstado = reg.estado === 'Pendiente'
        ? `<span style="background: #ffeeba; color: #856404; padding: 4px 8px; border-radius: 4px; font-size: 13px; font-weight: bold;">⏳ Pendiente</span>`
        : reg.estado === 'Prestado'
            ? `<span style="background: #fff3cd; color: #856404; padding: 4px 8px; border-radius: 4px; font-size: 13px; font-weight: bold;">⚠️ Prestado</span>`
            : `<span style="background: #d4edda; color: #155724; padding: 4px 8px; border-radius: 4px; font-size: 13px; font-weight: bold;">✅ Devuelto</span>`;

        tr.innerHTML = `
            <td>${reg.id_prestamo}</td>
            <td style="font-weight: bold;">${reg.nombre_usuario}</td>
            <td>${reg.titulo_libro}</td>
            <td>${reg.fecha_prestamo}</td>
            <td>${reg.fecha_devolucion}</td>
            <td>${badgeEstado}</td>
        `;
        tbody.appendChild(tr);
    });

    // Controles de Paginación seguros
    const controlesViejos = document.getElementById('controlesPaginacionPrestamos');
    if (controlesViejos) controlesViejos.remove();

    const totalPaginas = Math.ceil(listaPrestamosGlobal.length / registrosPorPagina);
    const tableContainer = document.getElementById('tablaHistorialPrestamos').parentElement;
    
    const divControles = document.createElement('div');
    divControles.id = 'controlesPaginacionPrestamos';
    divControles.style = 'display: flex; justify-content: space-between; align-items: center; margin-top: 15px; padding: 10px 5px;';

    divControles.innerHTML = `
        <button id="btnPrevPrestamo" ${paginaActualPrestamos === 1 ? 'disabled' : ''} style="padding: 6px 12px; background: #6c757d; color:#fff; border:none; border-radius:4px; cursor:pointer; opacity: ${paginaActualPrestamos === 1 ? '0.5' : '1'}">Anterior</button>
        <span style="font-size: 13px; font-weight: bold; color: #555;">Página ${paginaActualPrestamos} de ${totalPaginas}</span>
        <button id="btnNextPrestamo" ${paginaActualPrestamos === totalPaginas ? 'disabled' : ''} style="padding: 6px 12px; background: #007bff; color:#fff; border:none; border-radius:4px; cursor:pointer; opacity: ${paginaActualPrestamos === totalPaginas ? '0.5' : '1'}">Siguiente</button>
    `;

    tableContainer.appendChild(divControles);

    document.getElementById('btnPrevPrestamo').addEventListener('click', () => {
        if (paginaActualPrestamos > 1) {
            paginaActualPrestamos--;
            renderizarTablaHistorial();
        }
    });

    document.getElementById('btnNextPrestamo').addEventListener('click', () => {
        if (paginaActualPrestamos < totalPaginas) {
            paginaActualPrestamos++;
            renderizarTablaHistorial();
        }
    });
}

// 8. Ejecutar Devolución (Admin)
window.ejecutarDevolucion = async function(id_libro) {
    const resultadoConfirm = await Swal.fire({
        title: '¿Confirmar Devolución?',
        text: "El ejemplar se reintegrará al stock de la biblioteca.",
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#007bff',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Sí, devolver',
        cancelButtonText: 'Cancelar'
    });

    if (!resultadoConfirm.isConfirmed) return;

    try {
        const response = await fetch(`${API_URL}/libros/devolver/${id_libro}`, { method: 'PUT' });
        const data = await response.json();

        if (response.ok) {
            Swal.fire({ icon: 'success', title: '¡Devolución exitosa!', text: data.message, timer: 2000, showConfirmButton: false });
            cargarLibros();
            cargarHistorialPrestamos();
        }
    } catch (error) {
        console.error(error);
    }
};

// 9. Buscador en tiempo real
document.getElementById('txtBuscar')?.addEventListener('input', (e) => {
    const terminoBusqueda = e.target.value.toLowerCase();
    const librosFiltrados = listaLibrosGlobal.filter(libro => {
        return libro.titulo.toLowerCase().includes(terminoBusqueda) || libro.autor.toLowerCase().includes(terminoBusqueda);
    });
    renderizarTabla(librosFiltrados);
});

// 10. Registrar o Editar Libro Form Submit (Admin)
document.getElementById('libroForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const idLibro = document.getElementById('idLibroEditar').value;
    const titulo = document.getElementById('libTitulo').value.trim();
    const autor = document.getElementById('libAutor').value.trim();
    const anio = parseInt(document.getElementById('libAnio').value);
    const stock = parseInt(document.getElementById('libStock').value);

    const esEdicion = idLibro !== '';
    const url = esEdicion ? `${API_URL}/libros/${idLibro}` : `${API_URL}/libros`;
    const method = esEdicion ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ titulo, autor, anio, stock })
        });
        if (response.ok) {
            document.getElementById('libroForm').reset();
            document.getElementById('idLibroEditar').value = '';
            const btn = document.getElementById('btnGuardarLibro');
            if (btn) btn.innerText = 'Agregar Libro';
            cargarLibros();
        }
    } catch (error) {
        console.error(error);
    }
});

window.prepararEdicion = function(id, titulo, autor, anio, stock) {
    if (document.getElementById('idLibroEditar')) document.getElementById('idLibroEditar').value = id;
    if (document.getElementById('libTitulo')) document.getElementById('libTitulo').value = titulo;
    if (document.getElementById('libAutor')) document.getElementById('libAutor').value = autor;
    if (document.getElementById('libAnio')) document.getElementById('libAnio').value = anio;
    if (document.getElementById('libStock')) document.getElementById('libStock').value = stock;
    const btn = document.getElementById('btnGuardarLibro');
    if (btn) btn.innerText = 'Actualizar Datos';
};

// 11. Registrar Préstamo Form Submit (Admin)
document.getElementById('prestamoForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id_usuario = usuarioLogueado.id_usuario; 
    const id_libro = parseInt(document.getElementById('presSelectLibro').value);
    const fecha_devolucion = document.getElementById('presFechaDevolucion').value;

    try {
        const response = await fetch(`${API_URL}/prestamos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_usuario, id_libro, fecha_devolucion })
        });
        if (response.ok) {
            document.getElementById('prestamoForm').reset();
            if (document.getElementById('presNombreUsuario')) document.getElementById('presNombreUsuario').value = usuarioLogueado.nombre;
            cargarLibros();
            paginaActualPrestamos = 1;
            cargarHistorialPrestamos();
        }
    } catch (error) {
        console.error(error);
    }
});

window.solicitarPrestamo = async function(id_libro) {
    try {
        const response = await fetch(`${API_URL}/prestamos/solicitar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id_usuario: usuarioLogueado.id_usuario,
                id_libro: id_libro
            })
        });

        const data = await response.json();
        if (response.ok) {
            Swal.fire({ icon: 'success', title: '¡Solicitud Enviada!', text: data.message, confirmButtonColor: '#28a745' });
            cargarHistorialPrestamos(); // Refresca su bitácora para que vea el estado "⚠️ Pendiente"
        } else {
            Swal.fire({ icon: 'error', title: 'Error', text: data.error });
        }
    } catch (error) {
        console.error(error);
    }
};

// Cargar solo los préstamos que están en estado 'Pendiente'
// 1. Cargar solo los préstamos que están en estado 'Pendiente' desde el backend
async function cargarSolicitudesPendientes() { // 👈 Corregido 'async'
    if (!usuarioLogueado || usuarioLogueado.rol !== 'admin') return;
    try {
        const response = await fetch(`${API_URL}/prestamos?rol=admin`);
        if (!response.ok) return;

        const todosLosPrestamos = await response.json();
        
        // Validamos que sea un arreglo antes de filtrar
        if (Array.isArray(todosLosPrestamos)) {
            const pendientes = todosLosPrestamos.filter(p => p.estado === 'Pendiente');
            renderizarTablaSolicitudes(pendientes);
        }
    } catch (error) {
        console.error('Error al cargar solicitudes pendientes:', error);
    }
}

// 2. Pintar la tabla de solicitudes para el Admin
function renderizarTablaSolicitudes(solicitudes) {
    const tbody = document.querySelector('#tablaSolicitudesPendientes tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (solicitudes.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:15px; color:#999; font-style: italic;">No hay solicitudes de préstamo pendientes por procesar.</td></tr>`;
        return;
    }

    solicitudes.forEach(sol => {
        const tr = document.createElement('tr');
        tr.style.borderBottom = '1px solid #e3e6f0';

        tr.innerHTML = `
            <td style="padding: 10px;">${sol.id_prestamo}</td>
            <td style="padding: 10px; font-weight:bold;">${sol.nombre_usuario || 'Lector'}</td>
            <td style="padding: 10px;">${sol.titulo_libro || 'Libro'}</td>
            <td style="padding: 10px;">${sol.fecha_prestamo || 'Reciente'}</td>
            <td style="padding: 10px; text-align: center;">
                <button onclick="procesarSolicitud(${sol.id_prestamo}, 'Aprobar')" style="background:#28a745; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer; font-weight:bold;">Aprobar ✔</button>
                <button onclick="procesarSolicitud(${sol.id_prestamo}, 'Rechazar')" style="background:#dc3545; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer; font-weight:bold; margin-left:5px;">Rechazar ✖</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// 3. Enviar la decisión al backend
window.procesarSolicitud = async function(id_prestamo, accion) {
    const confirmacion = await Swal.fire({
        title: `¿Seguro que deseas ${accion.toLowerCase()} esta solicitud?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: accion === 'Aprobar' ? '#28a745' : '#dc3545',
        confirmButtonText: `Sí, ${accion}`,
        cancelButtonText: 'Cancelar'
    });

    if (!confirmacion.isConfirmed) return;

    try {
        const response = await fetch(`${API_URL}/prestamos/procesar-solicitud/${id_prestamo}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accion: accion })
        });

        const data = await response.json();

        if (response.ok) {
            Swal.fire({ icon: 'success', title: 'Procesado', text: data.message, timer: 1500, showConfirmButton: false });
            // Recargamos todo para ver los cambios reflejados en tiempo real
            cargarSolicitudesPendientes();
            cargarLibros();
            cargarHistorialPrestamos();
        } else {
            Swal.fire({ icon: 'error', title: 'Error', text: data.error });
        }
    } catch (error) {
        console.error(error);
    }
};

// =========================================================================
// 📊 MOTOR DE INDICADORES ESTADÍSTICOS (KPIs)
// =========================================================================
function actualizarTarjetasEstadisticas() {
    const esAdmin = usuarioLogueado && usuarioLogueado.rol === 'admin';

    // 1. Cálculos basados en el Catálogo de Libros
    if (listaLibrosGlobal && Array.isArray(listaLibrosGlobal)) {
        const totalTitulos = listaLibrosGlobal.length;
        const agotados = listaLibrosGlobal.filter(l => l.stock <= 0).length;

        document.getElementById('cardTotalLibros').innerText = totalTitulos;
        document.getElementById('cardLibrosAgotados').innerText = agotados;
    }

    // 2. Cálculos basados en la Bitácora de Préstamos
    if (listaPrestamosGlobal && Array.isArray(listaPrestamosGlobal)) {
        
        // Ajustamos las etiquetas según el rol del que está mirando
        if (!esAdmin) {
            document.getElementById('lblCardPendientes').innerText = "Mis Solicitudes Pendientes";
            document.getElementById('lblCardActivos').innerText = "Mis Libros Prestados";
        } else {
            document.getElementById('lblCardPendientes').innerText = "Solicitudes por Aprobar";
            document.getElementById('lblCardActivos').innerText = "Préstamos Activos";
        }

        // Contamos los estados reales en caliente
        const pendientes = listaPrestamosGlobal.filter(p => p.estado === 'Pendiente').length;
        const activos = listaPrestamosGlobal.filter(p => p.estado === 'Prestado').length;

        document.getElementById('cardSolicitudesPendientes').innerText = pendientes;
        document.getElementById('cardPrestamosActivos').innerText = activos;
    }
}