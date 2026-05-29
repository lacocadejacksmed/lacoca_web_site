const Usuario = require('../models/Usuario');
const Cliente = require('../models/Cliente');
const jwt = require('jsonwebtoken');
const Suscripcion = require('../models/Suscripcion');
const Plan = require('../models/Plan');
const Comprobante = require('../models/Comprobante');
const DireccionEntrega = require('../models/DireccionEntrega');
const Feriado = require('../models/Feriado');
const { calcularVencimiento } = require('../utils/dateUtils');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'secret_key_lacoca', {
        expiresIn: '30d'
    });
};

const validateEmail = (email) => {
    return /\S+@\S+\.\S+/.test(email);
};

exports.register = async (req, res) => {
    try {
        const { nombre, email, password, cedula, celular } = req.body;

        // Validaciones Robustas
        if (!nombre || !email || !password || !cedula || !celular) {
            return res.status(400).json({ success: false, message: 'Todos los campos son obligatorios' });
        }

        if (!validateEmail(email)) {
            return res.status(400).json({ success: false, message: 'Formato de correo inválido' });
        }

        if (password.length < 6) {
            return res.status(400).json({ success: false, message: 'La contraseña debe tener al menos 6 caracteres' });
        }

        if (!/^\d{6,12}$/.test(cedula)) {
            return res.status(400).json({ success: false, message: 'Cédula debe tener entre 6 y 12 dígitos' });
        }

        if (!/^\d{10}$/.test(celular)) {
            return res.status(400).json({ success: false, message: 'Celular debe tener 10 dígitos' });
        }

        const exists = await Usuario.findOne({ where: { email } });
        if (exists) {
            return res.status(400).json({ success: false, message: 'Este correo electrónico ya está registrado' });
        }

        const existsCedula = await Usuario.findOne({ where: { cedula } });
        if (existsCedula) {
            return res.status(400).json({ success: false, message: 'Esta cédula ya está registrada' });
        }

        const usuario = await Usuario.create({ 
            nombre, 
            email, 
            password, 
            rol: 'cliente', 
            cedula 
        });

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
        console.error('Error en registro:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Correo y contraseña son obligatorios' });
        }

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
                rol: usuario.rol,
                cedula: usuario.cedula
            }
        });
    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
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

exports.updateProfile = async (req, res) => {
    try {
        const { nombre, email, password, celular } = req.body;
        const usuarioId = req.user.id;

        const usuario = await Usuario.findByPk(usuarioId);
        if (!usuario) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }

        // Check if email is being changed and if it already exists
        if (email && email !== usuario.email) {
            const emailExists = await Usuario.findOne({ where: { email } });
            if (emailExists) {
                return res.status(400).json({ success: false, message: 'El correo ya está en uso' });
            }
        }

        // Update Usuario
        if (nombre) usuario.nombre = nombre;
        if (email) usuario.email = email;
        if (password && password.length >= 6) usuario.password = password; 

        await usuario.save();

        // Update Cliente if cedula exists
        if (usuario.cedula) {
            const cliente = await Cliente.findByPk(usuario.cedula);
            if (cliente) {
                if (nombre) cliente.nombre = nombre;
                if (email) cliente.correo = email;
                if (celular) cliente.celular = celular;
                await cliente.save();
            }
        }

        res.json({ success: true, message: 'Perfil actualizado exitosamente' });
    } catch (error) {
        console.error('Error actualizando perfil:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};

exports.getMySubscriptions = async (req, res) => {
    try {
        const usuario = await Usuario.findByPk(req.user.id);
        if (!usuario || !usuario.cedula) {
            return res.json({ success: true, suscripciones: [] });
        }

        let suscripciones = await Suscripcion.findAll({
            where: { cliente_cedula: usuario.cedula },
            include: [
                { model: Plan },
                { model: Comprobante },
                { model: DireccionEntrega, as: 'direcciones' }
            ],
            order: [['fecha_creacion', 'DESC']]
        });

        // Obtener feriados para el cálculo exacto de días
        const feriadosDB = await Feriado.findAll();
        const feriadosArray = feriadosDB.map(f => f.fecha);

        const responseSubs = [];

        // Refinamos las suscripciones con fecha_vencimiento y dias_restantes
        for (let sub of suscripciones) {
            const planNombre = sub.Plan ? sub.Plan.nombre : null;
            const planDias = sub.Plan ? sub.Plan.dias_duracion : 5;
            
            const calc = calcularVencimiento(
                sub.fecha_inicio,
                planNombre,
                planDias,
                feriadosArray,
                sub.estado
            );

            let statusChanged = false;

            if (calc.diasRestantes <= 0 && sub.estado === 'Activo') {
                sub.estado = 'Vencido';
                statusChanged = true;
            }

            if (statusChanged) {
                await sub.save();
            }

            const plainSub = sub.get({ plain: true });
            plainSub.fecha_vencimiento = calc.fechaVencimiento;
            plainSub.dias_restantes = calc.diasRestantes;
            responseSubs.push(plainSub);
        }

        res.json({ success: true, suscripciones: responseSubs });
    } catch (error) {
        console.error("Error obteniendo mis suscripciones:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

