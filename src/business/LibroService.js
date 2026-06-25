const LibroRepository = require('../data/LibroRepository');
const db = require('../config/db'); // Importamos la conexión desde arriba

class LibroService {
    // 1. Validar y registrar libro
    async crearLibro(titulo, autor, anio, stock) {
        // Validamos que el stock venga incluido en la petición
        if (!titulo || !autor || !anio || stock === undefined) {
            throw new Error('Todos los campos, incluyendo el stock inicial, son obligatorios.');
        }
        
        const anioActual = new Date().getFullYear();
        if (anio < 0 || anio > anioActual) {
            throw new Error('El año de publication no es válido.');
        }

        // Validación extra de seguridad: que no metan stock negativo
        if (stock < 0) {
            throw new Error('El stock inicial no puede ser un número negativo.');
        }

        // Le pasamos el objeto completo con el stock al repositorio
        const nuevoId = await LibroRepository.registrar({ titulo, autor, anio, stock });
        return { message: 'Libro agregado al catálogo con éxito.', id_libro: nuevoId };
    }

    // 2. CAMBIO DE NOMBRE CLAVE: Ahora se llama listarTodos para encajar con tu controlador
    async listarTodos() {
        return await LibroRepository.listarTodos();
    }

    // 3. Validar y actualizar datos del libro (Corregido para usar stock)
    async modificarLibro(id_libro, datosActualizados) {
        if (!id_libro) throw new Error('El ID del libro es requerido.');

        // Verificar si el libro de verdad existe en la base de datos
        const libroExistente = await LibroRepository.buscarPorId(id_libro);
        if (!libroExistente) {
            throw new Error('El libro que intenta actualizar no existe.');
        }

        // Mantener valores antiguos si no se envían nuevos (Unificado con stock)
        const titulo = datosActualizados.titulo || libroExistente.titulo;
        const autor = datosActualizados.autor || libroExistente.autor;
        const anio = datosActualizados.anio || libroExistente.anio;
        const stock = datosActualizados.stock !== undefined ? datosActualizados.stock : libroExistente.stock;

        await LibroRepository.actualizar(id_libro, { titulo, autor, anio, stock });
        return { message: 'Información del libro actualizada correctamente.' };
    }

    // 4. Modifica el método devolverLibro para que incremente el inventario y actualice la bitácora
    async devolverLibro(id_libro) {
        if (!id_libro) throw new Error('El ID del libro es requerido.');
        
        const libro = await LibroRepository.buscarPorId(id_libro);
        if (!libro) throw new Error('El libro no existe.');

        // Usamos una conexión del pool para asegurar que ambas operaciones se hagan en una sola transacción
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // PASO A: Buscar el último préstamo activo de este libro ('Prestado' o 'Pendiente')
            const [prestamosActivos] = await connection.execute(
                'SELECT id_prestamo FROM prestamos WHERE id_libro = ? AND (estado = "Prestado" OR estado = "Pendiente") ORDER BY id_prestamo DESC LIMIT 1',
                [id_libro]
            );

            // PASO B: Si encontramos el registro enlazado, lo pasamos a 'Devuelto'
            if (prestamosActivos.length > 0) {
                const id_prestamo = prestamosActivos[0].id_prestamo;
                await connection.execute(
                    'UPDATE prestamos SET estado = "Devuelto" WHERE id_prestamo = ?',
                    [id_prestamo]
                );
            }

            // PASO C: Sumamos 1 al stock actual del libro
            const nuevoStock = libro.stock + 1;
            await connection.execute('UPDATE libros SET stock = ? WHERE id_libro = ?', [nuevoStock, id_libro]);

            await connection.commit();
            return { message: 'Devolución procesada. Inventario e historial actualizados con éxito.' };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
}

module.exports = new LibroService();