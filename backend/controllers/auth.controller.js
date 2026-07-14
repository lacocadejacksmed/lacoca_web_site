const Usuario = require('../models/Usuario');
const Cliente = require('../models/Cliente');
const jwt = require('jsonwebtoken');
const Suscripcion = require('../models/Suscripcion');
const Plan = require('../models/Plan');
const Comprobante = require('../models/Comprobante');
const DireccionEntrega = require('../models/DireccionEntrega');
const Feriado = require('../models/Feriado');
const { calcularVencimiento } = require('../utils/dateUtils');
const { Resend } = require('resend');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');

const resend = new Resend(process.env.RESEND_API_KEY || 're_default');
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'secret_key_lacoca', {
        expiresIn: '1h' // Expira exactamente en 1 hora por seguridad
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
        const feriadosDocs = await Feriado.findAll({ attributes: ['fecha', 'activo'] });

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

exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ success: false, message: 'El correo es obligatorio' });

        const usuario = await Usuario.findOne({ where: { email } });
        
        // Generar código de 6 dígitos siempre (para no dar pistas si el correo existe o no)
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const hashedCode = await bcrypt.hash(code, 10);
        
        // Crear token de recuperación (expira en 10 minutos)
        const recoveryToken = jwt.sign(
            { email, code: hashedCode },
            process.env.JWT_SECRET || 'secret_key_lacoca',
            { expiresIn: '10m' }
        );

        if (!usuario) {
            // Retornamos 200 igual con el token, pero no enviamos correo real.
            return res.json({ success: true, message: 'Código enviado si el correo está registrado', recoveryToken });
        }

        // Enviar correo con Resend
        if (process.env.RESEND_API_KEY) {
            await resend.emails.send({
                from: 'Acme <onboarding@resend.dev>', // Usa tu dominio verificado aquí en producción
                to: email,
                subject: 'Código de Recuperación de Contraseña',
                html: `
                    <div style="font-family: sans-serif; text-align: center; padding: 20px;">
                        <h2>Recuperación de Contraseña</h2>
                        <p>Has solicitado restablecer tu contraseña. Tu código de verificación es:</p>
                        <h1 style="color: #ea580c; font-size: 36px; letter-spacing: 4px;">${code}</h1>
                        <p>Este código expira en 15 minutos.</p>
                        <p>Si no fuiste tú, ignora este correo.</p>
                    </div>
                `
            });
        }

        res.json({ success: true, message: 'Código enviado si el correo está registrado', recoveryToken });
    } catch (error) {
        console.error('Error en forgotPassword:', error);
        res.status(500).json({ success: false, message: 'No se pudo enviar el correo' });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { email, code, newPassword, recoveryToken } = req.body;

        if (!email || !code || !newPassword || !recoveryToken) {
            return res.status(400).json({ success: false, message: 'Código de recuperación inválido o expirado' });
        }

        try {
            const decoded = jwt.verify(recoveryToken, process.env.JWT_SECRET || 'secret_key_lacoca');
            
            if (decoded.email !== email) {
                return res.status(400).json({ success: false, message: 'Código de recuperación inválido o expirado' });
            }

            const isMatch = await bcrypt.compare(code, decoded.code);
            if (!isMatch) {
                return res.status(400).json({ success: false, message: 'Código incorrecto' });
            }
        } catch (error) {
            return res.status(400).json({ success: false, message: 'Código de recuperación inválido o expirado' });
        }

        const usuario = await Usuario.findOne({ where: { email } });
        if (!usuario) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }

        // Actualizar contraseña
        usuario.password = newPassword;
        await usuario.save();

        res.json({ success: true, message: 'Contraseña actualizada exitosamente' });
    } catch (error) {
        console.error('Error en resetPassword:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};

exports.googleLogin = async (req, res) => {
    try {
        const { credential, access_token, flowType } = req.body;
        if (!credential && !access_token) {
            return res.status(400).json({ success: false, message: 'Falta el token de Google' });
        }

        let email, name;

        if (credential) {
            const ticket = await googleClient.verifyIdToken({
                idToken: credential,
                audience: process.env.GOOGLE_CLIENT_ID
            });
            const payload = ticket.getPayload();
            email = payload.email;
            name = payload.name;
        } else if (access_token) {
            const axios = require('axios');
            const { data } = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${access_token}` }
            });
            email = data.email;
            name = data.name;
        }

        let usuario = await Usuario.findOne({ where: { email } });
        
        if (flowType === 'login' && !usuario) {
            return res.status(404).json({ success: false, message: 'No existe una cuenta con este correo. Por favor regístrate.' });
        }
        
        if (flowType === 'register' && usuario) {
            return res.status(400).json({ success: false, message: 'Este correo ya está registrado. Por favor inicia sesión.' });
        }

        if (!usuario) {
            // Contraseña aleatoria imposible de adivinar para forzar que siempre use Google (o "olvidaste tu contraseña")
            const randomPassword = await bcrypt.hash(Math.random().toString(36).slice(-15) + Date.now().toString(), 10);
            
            usuario = await Usuario.create({
                nombre: name,
                email: email,
                password: randomPassword,
                rol: 'cliente',
                cedula: null
            });

            // Creamos un Cliente base. 
            // La app deberá pedirle la cédula/celular más adelante si necesita hacer compras.
            await Cliente.create({ nombre: name, correo: email, esta_activo: false });
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
        console.error('Error verificando Google Token:', error);
        res.status(401).json({ success: false, message: 'Error de autenticación con Google' });
    }
};


