const PrestamoRepository = require('../data/PrestamoRepository');
const LibroRepository = require('../data/LibroRepository');
const db = require('../config/db'); // Importamos la conexión para actualizar el stock

class PrestamoService {
    
    // 1. NUEVO MÉTODO: Conecta el controlador con el repositorio para la bitácora
    async obtenerHistorial() {
        // Llama al método del repositorio que hace el INNER JOIN de usuarios y libros
        return await PrestamoRepository.obtenerTodosConDetalles(); 
    }

    // 2. Método existente de Crear Préstamo actualizado con reducción de stock automática
    async crearPrestamo(id_usuario, id_libro, fecha_devolucion) {
        // 1. Validaciones de campos obligatorios
        if (!id_usuario || !id_libro || !fecha_devolucion) {
            throw new Error('El ID de usuario, ID de libro y fecha de devolución son obligatorios.');
        }

        // 2. Verificar si el libro existe en la base de datos
        const libro = await LibroRepository.buscarPorId(id_libro);
        if (!libro) {
            throw new Error('El libro seleccionado no existe.');
        }

        // 3. Verificar si quedan ejemplares en el inventario (Stock)
        if (libro.stock <= 0) {
            throw new Error('No quedan ejemplares disponibles de este libro en stock (Agotado).');
        }

        // 4. Generar la fecha de préstamo automática (Día de hoy)
        const fecha_prestamo = new Date().toISOString().split('T')[0];

        // 5. Mandar a guardar en la tabla 'prestamos'
        const nuevoId = await PrestamoRepository.registrarPrestamo({
            id_usuario,
            id_libro,
            fecha_prestamo,
            fecha_devolucion
        });

        // 6. ACTUALIZACIÓN AUTOMÁTICA DEL STOCK: Restamos 1 unidad del inventario
        const nuevoStock = libro.stock - 1;
        await db.execute('UPDATE libros SET stock = ? WHERE id_libro = ?', [nuevoStock, id_libro]);

        return { message: 'Préstamo registrado exitosamente.', id_prestamo: nuevoId };
    }
}

module.exports = new PrestamoService();