

class Prestamo {
    constructor(id_prestamo, id_usuario, id_libro, fecha_prestamo, fecha_devolucion, estado) {
        this.id_prestamo = id_prestamo;
        this.id_usuario = id_usuario;
        this.id_libro = id_libro;
        this.fecha_prestamo = fecha_prestamo;
        this.fecha_devolucion = fecha_devolucion;
        this.estado = estado; // 'Prestado' o 'Devuelto'
    }
}

module.exports = Prestamo;