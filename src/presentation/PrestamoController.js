const express = require('express');
const router = express.Router();
const PrestamoService = require('../business/PrestamoService');
const PrestamoRepository = require('../data/PrestamoRepository'); 
const db = require('../config/db');

// Obtener la bitácora filtrada (GET http://localhost:8080/api/prestamos)
router.get('/', async (req, res) => {
    try {
        // Desestructuramos los parámetros enviados por el dashboard.js
        const { rol, id_usuario, fechaInicio, fechaFin } = req.query;

        // Llamamos al método dinámico con sus filtros
        const historial = await PrestamoRepository.obtenerTodosConDetalles(rol, id_usuario, fechaInicio, fechaFin);
        res.status(200).json(historial);
    } catch (error) {
        console.error("🚨 Error al traer historial filtrado:", error);
        res.status(500).json({ error: error.message });
    }
});

// Registrar un préstamo (POST http://localhost:8080/api/prestamos)
router.post('/', async (req, res) => {
    try {
        const { id_usuario, id_libro, fecha_devolucion } = req.body;
        const resultado = await PrestamoService.crearPrestamo(id_usuario, id_libro, fecha_devolucion);
        res.status(201).json(resultado);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// 1. Lector solicita un libro (Crea el préstamo en estado 'Pendiente')
router.post('/solicitar', async (req, res) => {
    try {
        const { id_usuario, id_libro } = req.body;
        
        // Ponemos una fecha estimada de devolución automática (ej. 7 días a partir de hoy)
        const fecha_devolucion = new Date();
        fecha_devolucion.setDate(fecha_devolucion.getDate() + 7);

        const sql = `INSERT INTO prestamos (id_usuario, id_libro, fecha_prestamo, fecha_devolucion, estado) 
                     VALUES (?, ?, NOW(), ?, 'Pendiente')`;
        
        const [result] = await db.execute(sql, [id_usuario, id_libro, fecha_devolucion]);
        
        res.status(201).json({ message: 'Solicitud enviada con éxito. Espera aprobación del bibliotecario.' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// 2. Admin procesa la solicitud (Aprobar o Rechazar)
router.put('/procesar-solicitud/:id_prestamo', async (req, res) => {
    try {
        const { id_prestamo } = req.params;
        const { accion } = req.body; // Recibe 'Aprobar' o 'Rechazar'

        if (accion === 'Aprobar') {
            // Conseguimos el ID del libro vinculado a este préstamo
            const [prestamo] = await db.execute('SELECT id_libro FROM prestamos WHERE id_prestamo = ?', [id_prestamo]);
            const id_libro = prestamo[0].id_libro;

            // Validamos si aún queda stock disponible
            const [libro] = await db.execute('SELECT stock FROM libros WHERE id_libro = ?', [id_libro]);
            if (libro[0].stock <= 0) {
                throw new Error('No hay stock disponible para aprobar este préstamo.');
            }

            // Descontamos del stock y cambiamos el estado a 'Prestado'
            await db.execute('UPDATE libros SET stock = stock - 1 WHERE id_libro = ?', [id_libro]);
            await db.execute("UPDATE prestamos SET estado = 'Prestado', fecha_prestamo = NOW() WHERE id_prestamo = ?", [id_prestamo]);
            
            res.status(200).json({ message: 'Prestamo aprobado y stock actualizado.' });
        } else {
            // Si se rechaza, simplemente se elimina el registro o se marca como Devuelto/Cancelado. Lo eliminaremos para limpiar.
            await db.execute('DELETE FROM prestamos WHERE id_prestamo = ?', [id_prestamo]);
            res.status(200).json({ message: 'Solicitud rechazada y removida.' });
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;