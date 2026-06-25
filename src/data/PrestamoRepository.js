const db = require('../config/db');
const Prestamo = require('../entities/Prestamo');

class PrestamoRepository {
    // Registrar el préstamo y actualizar la disponibilidad del libro
    async registrarPrestamo(prestamoData) {
        // Usamos una conexión del pool para asegurar que ambas operaciones ocurran seguidas
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction(); // Iniciamos transacción por seguridad

            // 1. CORRECCIÓN: Insertar el préstamo incluyendo explícitamente la columna 'estado'
            const sqlPrestamo = 'INSERT INTO prestamos (id_usuario, id_libro, fecha_prestamo, fecha_devolucion, estado) VALUES (?, ?, ?, ?, "Prestado")';
            const [result] = await connection.execute(sqlPrestamo, [
                prestamoData.id_usuario,
                prestamoData.id_libro,
                prestamoData.fecha_prestamo,
                prestamoData.fecha_devolucion
            ]);

            // 2. Cambiar disponibilidad del libro restando 1 al stock actual
            const sqlLibro = 'UPDATE libros SET stock = stock - 1 WHERE id_libro = ?';
            await connection.execute(sqlLibro, [prestamoData.id_libro]);

            await connection.commit(); // Confirmamos los cambios en la BD o Transacción exitosa
            return result.insertId;
        } catch (error) {
            await connection.rollback(); // Si algo falla, deshacemos todo
            throw error;
        } finally {
            connection.release(); // Liberamos la conexión
        }
    }


    async obtenerTodosConDetalles(rol, id_usuario, fechaInicio, fechaFin) {
        let sql = `
            SELECT 
                p.id_prestamo,
                u.nombre AS nombre_usuario,
                l.titulo AS titulo_libro,
                DATE_FORMAT(p.fecha_prestamo, '%Y-%m-%d') AS fecha_prestamo,
                DATE_FORMAT(p.fecha_devolucion, '%Y-%m-%d') AS fecha_devolucion,
                p.estado
            FROM prestamos p
            INNER JOIN usuarios u ON p.id_usuario = u.id_usuario
            INNER JOIN libros l ON p.id_libro = l.id_libro
        `;
        
        const params = [];
        const condiciones = [];

        // REQUISITO: Si es lector, OBLIGATORIO filtrar solo sus registros
        if (rol === 'lector') {
            condiciones.push('p.id_usuario = ?');
            params.push(id_usuario);
        }

        // REQUISITO: Filtro por rango de fechas opcional (para el admin o reportes)
        if (fechaInicio && fechaFin) {
            condiciones.push('p.fecha_prestamo BETWEEN ? AND ?');
            params.push(fechaInicio, fechaFin);
        }

        if (condiciones.length > 0) {
            sql += ' WHERE ' + condiciones.join(' AND ');
        }

        sql += ' ORDER BY p.id_prestamo DESC';

        const [rows] = await db.execute(sql, params);
        return rows;
    }
}

module.exports = new PrestamoRepository();