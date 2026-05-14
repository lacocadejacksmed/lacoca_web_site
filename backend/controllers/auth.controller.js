const Usuario = require('../models/Usuario');
const Cliente = require('../models/Cliente');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'secret_key_lacoca', {
        expiresIn: '30d'
    });
};

exports.register = async (req, res) => {
    try {
        const { nombre, email, password, cedula, celular } = req.body;

        const exists = await Usuario.findOne({ where: { email } });
        if (exists) {
            return res.status(400).json({ success: false, message: 'El usuario ya existe' });
        }

        // Forzamos el rol a 'cliente' para registros públicos
        const usuario = await Usuario.create({ 
            nombre, 
            email, 
            password, 
            rol: 'cliente', 
            cedula 
        });

        // Asegurar que existe en la tabla de clientes
        const [cliente, created] = await Cliente.findOrCreate({
            where: { cedula },
            defaults: { nombre, correo: email, celular, esta_activo: false }
        });

        if (!created) {
            await cliente.update({ nombre, correo: email, celular });
        }

        res.status(201).json({
            success: true,
            token: generateToken(usuario.id),
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                email: usuario.email,
                rol: usuario.rol,
                cedula: usuario.cedula
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const usuario = await Usuario.findOne({ where: { email } });
        if (!usuario || !(await usuario.comparePassword(password))) {
            return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
        }

        res.json({
            success: true,
            token: generateToken(usuario.id),
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                email: usuario.email,
                rol: usuario.rol
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getMe = async (req, res) => {
    try {
        const usuario = await Usuario.findByPk(req.user.id, {
            attributes: { exclude: ['password'] }
        });
        res.json({ success: true, usuario });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
