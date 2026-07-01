const xss = require('xss');

/**
 * Función recursiva para sanitizar todos los strings en un objeto anidado
 */
const sanitizeObject = (obj) => {
    if (typeof obj === 'string') {
        // Escapa las etiquetas HTML y scripts maliciosos del string
        return xss(obj);
    }
    
    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObject(item));
    }
    
    if (obj !== null && typeof obj === 'object') {
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
            sanitized[key] = sanitizeObject(value);
        }
        return sanitized;
    }
    
    return obj;
};

/**
 * Middleware Express para interceptar y sanitizar automáticamente 
 * el body, query y params de cada petición HTTP.
 */
const xssMiddleware = (req, res, next) => {
    if (req.body) req.body = sanitizeObject(req.body);
    if (req.query) req.query = sanitizeObject(req.query);
    if (req.params) req.params = sanitizeObject(req.params);
    next();
};

module.exports = xssMiddleware;
