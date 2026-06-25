const UsuarioRepository = require('../data/UsuarioRepository');
const bcrypt = require('bcryptjs');

class UsuarioService {
    // Lógica para registrar un usuario
    async registrarUsuario(nombre, correo, password) {
        // 1. Validaciones básicas de negocio
        if (!nombre || !correo || !password) {
            throw new Error('Todos los campos son obligatorios.');
        }

        // 2. Verificar si el correo ya está registrado
        const usuarioExistente = await UsuarioRepository.buscarPorCorreo(correo);
        if (usuarioExistente) {
            throw new Error('El correo electrónico ya está registrado.');
        }

        // 3. Encriptar la contraseña (Seguridad)
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // 4. Mandar los datos limpios a la Capa de Datos para guardar
        const nuevoUsuarioId = await UsuarioRepository.registrar({ nombre, correo, password_hash });
        return { message: 'Usuario registrado con éxito.', id_usuario: nuevoUsuarioId };
    }

    // Lógica para iniciar sesión (Sincronizado con el nombre que usa tu controlador)
    async loginUsuario(correo, password) {
        if (!correo || !password) {
            throw new Error('Correo y contraseña son obligatorios.');
        }

        // 1. Buscar si el usuario existe por correo
        const usuario = await UsuarioRepository.buscarPorCorreo(correo);
        if (!usuario) {
            throw new Error('Credenciales incorrectas.');
        }

        // 2. Verificar si la contraseña coincide con el hash de la BD
        const passwordCorrecto = await bcrypt.compare(password, usuario.password_hash);
        if (!passwordCorrecto) {
            throw new Error('Credenciales incorrectas.');
        }

        // 3. CORRECCIÓN CLAVE: Retornamos los datos estructurados con el ROL directo de MySQL
        return {
            usuario: {
                id_usuario: usuario.id_usuario,
                nombre: usuario.nombre,
                correo: usuario.correo,
                rol: usuario.rol // 👈 Mapeado nativo de la columna de tu base de datos
            }
        };
    }
}

module.exports = new UsuarioService();