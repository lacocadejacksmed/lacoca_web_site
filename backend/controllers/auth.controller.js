const Usuario = require('../models/Usuario');
const Cliente = require('../models/Cliente');
const jwt = require('jsonwebtoken');
const Suscripcion = require('../models/Suscripcion');
const Plan = require('../models/Plan');
const Comprobante = require('../models/Comprobante');
const DireccionEntrega = require('../models/DireccionEntrega');

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

exports.getMySubscriptions = async (req, res) => {
    try {
        const usuario = await Usuario.findByPk(req.user.id);
        if (!usuario || !usuario.cedula) {
            return res.json({ success: true, suscripciones: [] });
        }

        const suscripciones = await Suscripcion.findAll({
            where: { cliente_cedula: usuario.cedula },
            include: [
                { model: Plan },
                { model: Comprobante },
                { model: DireccionEntrega, as: 'direcciones' }
            ],
            order: [['fecha_creacion', 'DESC']]
        });

        // Lógica para comprobar si la suscripción ha vencido
        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);

        for (let sub of suscripciones) {
            if (sub.estado === 'Activo' && sub.fecha_inicio && sub.Plan) {
                const startDate = new Date(sub.fecha_inicio + 'T12:00:00');
                startDate.setHours(0, 0, 0, 0);
                
                // Calculamos duración en calendario. Asumimos Semanal = 7 días de calendario (aunque sean 5 hábiles)
                // Para una lógica más precisa, usaremos:
                // Semanal (5 hábiles) -> Vence a los 7 días
                // Quincenal (10 hábiles) -> Vence a los 14 días
                // Mensual (20 hábiles) -> Vence a los 28 días
                let diasCalendario = 0;
                if (sub.Plan.nombre === 'Semanal') diasCalendario = 7;
                else if (sub.Plan.nombre === 'Quincenal') diasCalendario = 14;
                else if (sub.Plan.nombre === 'Mensual') diasCalendario = 28;
                else diasCalendario = sub.Plan.dias_duracion; // Fallback
                
                const expirationDate = new Date(startDate);
                expirationDate.setDate(expirationDate.getDate() + diasCalendario);

                if (currentDate > expirationDate) {
                    sub.estado = 'Vencido';
                    await sub.save();
                }
            }
        }

        res.json({ success: true, suscripciones });
    } catch (error) {
        console.error("Error obteniendo mis suscripciones:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

