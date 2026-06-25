class Usuario {
    constructor(id_usuario, nombre, correo, password_hash, fecha_registro, rol) {
        this.id_usuario = id_usuario;
        this.nombre = nombre;
        this.correo = correo;
        this.password_hash = password_hash;
        this.fecha_registro = fecha_registro;
        this.rol = rol; // 👈 Agregamos el rol a la entidad
    }
}

module.exports = Usuario;