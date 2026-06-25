const express = require('express');
const router = express.Router();
const LibroService = require('../business/LibroService');


// 1. Agregar un libro (POST http://localhost:8080/api/libros)
router.post('/', async (req, res) => {
    try {
        // Extraemos 'stock' enviado desde el fetch de dashboard.js
        const { titulo, autor, anio, stock } = req.body; 
        
        const resultado = await LibroService.crearLibro(titulo, autor, anio, stock);
        res.status(201).json(resultado);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// 2. Listar catálogo completo (GET http://localhost:8080/api/libros)
router.get('/', async (req, res) => {
    try {
        // Cambiamos obtenerCatalogo() por listarTodos()
        const catalogo = await LibroService.listarTodos();
        res.status(200).json(catalogo);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 3. Actualizar un libro (PUT http://localhost:8080/api/libros/:id)
router.put('/:id', async (req, res) => {
    try {
        const id_libro = req.params.id;
        const resultado = await LibroService.modificarLibro(id_libro, req.body);
        res.status(200).json(resultado);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Registrar la devolución de un libro (PUT http://localhost:8080/api/libros/devolver/:id)
router.put('/devolver/:id', async (req, res) => {
    try {
        const id_libro = req.params.id;
        const resultado = await LibroService.devolverLibro(id_libro);
        res.status(200).json(resultado);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;