const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key_lacoca');
            req.user = await Usuario.findByPk(decoded.id, {
                attributes: { exclude: ['password'] }
            });
            
            if (!req.user) {
                return res.status(401).json({ success: false, message: 'Usuario no encontrado' });
            }
            
            next();
        } catch (error) {
            console.error('Token error:', error.name);
            if (error.name === 'TokenExpiredError') {
                return res.status(401).json({ success: false, message: 'Tu sesión ha expirado por seguridad. Por favor, vuelve a iniciar sesión.', expired: true });
            }
            return res.status(401).json({ success: false, message: 'No autorizado, token inválido' });
        }
    }

    if (!token) {
        res.status(401).json({ success: false, message: 'No autorizado, no hay token' });
    }
};

const admin = (req, res, next) => {
    if (req.user && req.user.rol === 'admin') {
        next();
    } else {
        res.status(403).json({ success: false, message: 'Acceso restringido a administradores' });
    }
};

module.exports = { protect, admin };
