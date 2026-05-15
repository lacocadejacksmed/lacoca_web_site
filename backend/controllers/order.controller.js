const multer = require('multer');
const path = require('path');
const Cliente = require('../models/Cliente');
const Suscripcion = require('../models/Suscripcion');
const Comprobante = require('../models/Comprobante');
const Configuracion = require('../models/Configuracion');
const Plan = require('../models/Plan');
const DireccionEntrega = require('../models/DireccionEntrega');
const Feriado = require('../models/Feriado');
const { Op } = require('sequelize');

// Helper para calcular días hábiles (L-V) en la semana de inicio seleccionada
const calculateBusinessDays = async (mondayDateStr) => {
    const monday = new Date(mondayDateStr + 'T12:00:00');
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);

    const fmt = (d) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const dayStr = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${dayStr}`;
    };

    const holidays = await Feriado.count({
        where: {
            fecha: {
                [Op.between]: [fmt(monday), fmt(friday)]
            }
        }
    });

    return 5 - holidays;
};
// Configuración de Multer para guardar imágenes
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../../uploads'));
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const prefix = file.fieldname === 'menu_image' ? 'menu-' : 'comprobante-';
        cb(null, prefix + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

const createOrder = async (req, res) => {
    try {
        const { 
            email, nombre, cedula, celular, 
            plan, needs_cocas, delivery_type,
            address_1, barrio_1, days_address_1,
            zona_1, lat_1, lng_1,
            address_2, barrio_2, days_address_2,
            zona_2, lat_2, lng_2,
            facturacionElectronica,
            alergias, restricciones,
            fecha_inicio
        } = req.body;

        // 1. Calcular Fecha de Inicio por defecto si no viene
        let targetStartDate = fecha_inicio;
        if (!targetStartDate) {
            const start = new Date();
            const day = start.getDay();
            const daysToNextMonday = (day === 0) ? 1 : (8 - day);
            const nextMonday = new Date(start);
            nextMonday.setDate(start.getDate() + daysToNextMonday);
            targetStartDate = nextMonday.toISOString().split('T')[0];
        }

        // 2. Validar Cupos para esa fecha de inicio
        const maxCuposConfig = await Configuracion.findByPk('max_cupos');
        if (maxCuposConfig) {
            const maxCupos = parseInt(maxCuposConfig.valor, 10);
            // Contamos cuántas suscripciones están activas o pendientes para esa semana específica
            // O de forma global si el usuario prefiere
            const activeInWeek = await Suscripcion.count({ 
                where: { 
                    estado: ['Activo', 'Pendiente'],
                    fecha_inicio: targetStartDate
                } 
            });

            if (activeInWeek >= maxCupos) {
                return res.status(400).json({ 
                    success: false, 
                    isFull: true,
                    nextAvailableDate: targetStartDate, // Podríamos calcular la siguiente aquí
                    message: `Lo sentimos, ya no hay cupos disponibles para la semana del ${targetStartDate}. Puedes asegurar tu cupo para la siguiente semana.` 
                });
            }
        }

        // 2. Buscar el Plan en la DB
        const planDb = await Plan.findOne({ where: { nombre: plan, esta_activo: true } });
        if (!planDb) {
            return res.status(400).json({ success: false, message: 'El plan seleccionado no es válido.' });
        }

        // 3. Validar o Crear Cliente
        let cliente = await Cliente.findByPk(cedula);
        
        if (!cliente) {
            // Si no existe por cédula, verificamos si el correo ya está en uso por OTRA cédula
            const clientePorEmail = await Cliente.findOne({ where: { correo: email } });
            if (clientePorEmail) {
                return res.status(400).json({ 
                    success: false, 
                    message: `El correo ${email} ya está registrado con otro número de documento (#${clientePorEmail.cedula}). Por favor usa tus datos correctos.` 
                });
            }

            cliente = await Cliente.create({
                cedula, nombre, correo: email, celular, esta_activo: false
            });
        } else {
            // Si existe por cédula, verificamos si tiene un pago PENDIENTE (esperando validación)
            // Bloqueamos sólo si ya envió un pago y el administrador no lo ha revisado
            const subPendiente = await Suscripcion.findOne({ 
                where: { 
                    cliente_cedula: cedula, 
                    estado: 'Pendiente' 
                } 
            });

            if (subPendiente) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Ya tienes una reserva pendiente de validación. Por favor espera a que validemos tu pago anterior para registrar uno nuevo.' 
                });
            }

            // Si está activo o vencido, le permitimos actualizar sus datos y crear una nueva suscripción (Renovación)
            cliente.nombre = nombre;
            cliente.correo = email;
            cliente.celular = celular;
            await cliente.save();
        }

        // 4. Calcular Precio Total con ajuste por festivos
        const businessDays = await calculateBusinessDays(targetStartDate);
        const planDays = parseInt(planDb.dias_duracion, 10);
        
        // El ajuste solo aplica si el plan es Semanal (5 días). 
        // Si quieres que aplique a todos, podemos generalizarlo.
        let precioAjustado = parseFloat(planDb.precio_base);
        
        if (planDb.nombre === 'Semanal' && businessDays < 5) {
            const valorDia = precioAjustado / 5;
            precioAjustado = valorDia * businessDays;
        }

        const requiresCocas = needs_cocas === 'true' || needs_cocas === true;
        const cocasPrice = requiresCocas ? 70000 : 0;
        const precio_total = precioAjustado + cocasPrice;

        // 5. Crear Suscripción
        const nuevaSuscripcion = await Suscripcion.create({
            cliente_cedula: cedula,
            plan_id: planDb.id,
            necesita_cocas: requiresCocas,
            tipo_entrega: delivery_type === 'Hibrida' ? 'Hibrida' : 'Fija',
            facturacion_electronica: facturacionElectronica === 'Si' || facturacionElectronica === true,
            precio_total,
            estado: 'Pendiente',
            alergias,
            restricciones,
            fecha_inicio: targetStartDate
        });

        // 6. Crear Direcciones de Entrega
        await DireccionEntrega.create({
            suscripcion_id: nuevaSuscripcion.id,
            direccion: address_1,
            barrio: barrio_1,
            dias_entrega: days_address_1 || 'Lunes,Martes,Miércoles,Jueves,Viernes',
            es_principal: true,
            zona: zona_1,
            latitud: lat_1,
            longitud: lng_1
        });

        if (delivery_type === 'Hibrida' && address_2) {
            await DireccionEntrega.create({
                suscripcion_id: nuevaSuscripcion.id,
                direccion: address_2,
                barrio: barrio_2 || barrio_1,
                dias_entrega: days_address_2 || 'A definir',
                es_principal: false,
                zona: zona_2,
                latitud: lat_2,
                longitud: lng_2
            });
        }

        // 7. Guardar Comprobante
        if (req.file) {
            await Comprobante.create({
                suscripcion_id: nuevaSuscripcion.id,
                url_imagen: `/uploads/${req.file.filename}`,
                estado: 'Pendiente'
            });
        }

        res.status(201).json({
            success: true,
            message: 'Reserva registrada exitosamente. Validaremos tu pago pronto.',
            subscriptionId: nuevaSuscripcion.id
        });
    } catch (error) {
        console.error('Error al crear el pedido:', error);
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ success: false, message: 'El correo electrónico ya está registrado.' });
        }
        res.status(500).json({ success: false, message: 'Error al registrar el pedido', error: error.message });
    }
};

const getAvailability = async (req, res) => {
    try {
        const maxCuposConfig = await Configuracion.findByPk('max_cupos');
        const maxCupos = maxCuposConfig ? parseInt(maxCuposConfig.valor, 10) : 1500;

        // Calcular los próximos 4 lunes
        const availability = [];
        const start = new Date();
        const day = start.getDay();
        const daysToNextMonday = (day === 0) ? 1 : (8 - day);
        
        let currentMonday = new Date(start);
        currentMonday.setDate(start.getDate() + daysToNextMonday);

        for (let i = 0; i < 4; i++) {
            const dateStr = currentMonday.toISOString().split('T')[0];
            
            const count = await Suscripcion.count({
                where: {
                    estado: ['Activo', 'Pendiente'],
                    fecha_inicio: dateStr
                }
            });

            availability.push({
                fecha: dateStr,
                cupos_totales: maxCupos,
                cupos_reservados: count,
                disponible: count < maxCupos
            });

            // Siguiente lunes
            currentMonday.setDate(currentMonday.getDate() + 7);
        }

        res.json({ success: true, availability });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Verificar si un cliente existe y devolver datos públicos para pre-llenado
const checkClient = async (req, res) => {
  try {
    const { cedula } = req.params;
    const cliente = await Cliente.findByPk(cedula, {
      include: [{
        model: Suscripcion,
        limit: 1,
        order: [['fecha_creacion', 'DESC']],
        include: [{ model: DireccionEntrega, as: 'direcciones' }]
      }]
    });

    if (!cliente) {
      return res.json({ success: false, found: false });
    }

    // Extraer última dirección si existe
    const ultimaSub = cliente.Suscripcions?.[0];
    const ultimaDireccion = ultimaSub?.direcciones?.[0];

    res.json({
      success: true,
      found: true,
      cliente: {
        nombre: cliente.nombre,
        correo: cliente.correo,
        celular: cliente.celular,
        ultimaDireccion: ultimaDireccion ? {
          direccion: ultimaDireccion.direccion,
          barrio: ultimaDireccion.barrio
        } : null
      }
    });
  } catch (error) {
    console.error("Error al verificar cliente:", error);
    res.status(500).json({ success: false, message: "Error al verificar cliente" });
  }
};

module.exports = {
  upload,
  createOrder,
  getAvailability,
  checkClient
};
