class Libro {
    // Cambiamos 'disponible' por 'stock' en los parámetros del constructor
    constructor(id_libro, titulo, autor, anio, stock) {
        this.id_libro = id_libro;
        this.titulo = titulo;
        this.autor = autor;
        this.anio = anio;
        this.stock = stock; // Ahora guarda el número real de unidades (ej: 5)
    }
}

module.exports = Libro;