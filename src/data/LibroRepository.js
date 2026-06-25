const db = require('../config/db');
const Libro = require('../entities/Libro');

class LibroRepository {
    // 1. Registrar un libro
    async registrar(libroData) {
        // Reemplazamos el valor estático por un '?' dinámico para guardar las unidades reales
        const sql = 'INSERT INTO libros (titulo, autor, anio, stock) VALUES (?, ?, ?, ?)';
        const [result] = await db.execute(sql, [libroData.titulo, libroData.autor, libroData.anio, libroData.stock]);
        return result.insertId;
    }

    // 2. Listar todos los libros
    async listarTodos() {
        const sql = 'SELECT * FROM libros';
        const [rows] = await db.execute(sql);
        return rows.map(row => new Libro(row.id_libro, row.titulo, row.autor, row.anio, row.stock));
    }

    // 3. Buscar un libro por ID
    async buscarPorId(id_libro) {
        const sql = 'SELECT * FROM libros WHERE id_libro = ?';
        const [rows] = await db.execute(sql, [id_libro]);
        if (rows.length === 0) return null;
        const row = rows[0];
        return new Libro(row.id_libro, row.titulo, row.autor, row.anio, row.stock);
    }

    // 4. Actualizar información de un libro
    async actualizar(id_libro, libroData) {
        const sql = 'UPDATE libros SET titulo = ?, autor = ?, anio = ?, stock = ? WHERE id_libro = ?';
        const [result] = await db.execute(sql, [libroData.titulo, libroData.autor, libroData.anio, libroData.stock, id_libro]);
        return result.affectedRows > 0;
    }
}

module.exports = new LibroRepository();