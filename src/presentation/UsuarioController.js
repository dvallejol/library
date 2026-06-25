const express = require('express');
const router = express.Router();
const UsuarioService = require('../business/UsuarioService');

// Ruta para Registrar Usuario (POST http://localhost:8080/api/usuarios/registrar)
router.post('/registrar', async (req, res) => {
    try {
        const { nombre, correo, password } = req.body;
        const resultado = await UsuarioService.registrarUsuario(nombre, correo, password);
        res.status(201).json(resultado);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Ruta para Iniciar Sesión (POST http://localhost:8080/api/usuarios/login) - CORREGIDA
router.post('/login', async (req, res) => {
    try {
        const { correo, password } = req.body;
        
        // Llamamos al servicio para que haga las consultas y validaciones correspondientes
        const resultado = await UsuarioService.loginUsuario(correo, password);

        // Retornamos la respuesta con los datos que nos entregue el servicio (que ya incluye el rol de la BD)
        res.status(200).json({
            message: 'Inicio de sesión exitoso',
            usuario: resultado.usuario
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;