const db = require('../config/db');
const Usuario = require('../entities/Usuario');

class UsuarioRepository {
    // 1. Guardar un nuevo usuario en la base de datos
    async registrar(usuarioData) {
        const sql = 'INSERT INTO usuarios (nombre, correo, password_hash) VALUES (?, ?, ?)';
        const [result] = await db.execute(sql, [usuarioData.nombre, usuarioData.correo, usuarioData.password_hash]);
        return result.insertId; // Retorna el ID generado por MySQL
    }

    // 2. Buscar un usuario por su correo electrónico (para el Login)
    async buscarPorCorreo(correo) {
        const sql = 'SELECT * FROM usuarios WHERE correo = ?';
        const [rows] = await db.execute(sql, [correo]);
        
        if (rows.length === 0) return null;

        // Mapeamos el resultado de la BD a nuestra Entidad (Incluyendo el ROL)
        const row = rows[0];
        return new Usuario(row.id_usuario, row.nombre, row.correo, row.password_hash, row.fecha_registro, row.rol); // 👈 Pasamos row.rol al final
    }
}

module.exports = new UsuarioRepository();