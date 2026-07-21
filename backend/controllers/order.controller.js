const axios = require('axios');
const path = require('path');
const fs = require('fs');
const Cliente = require('../models/Cliente');
const Suscripcion = require('../models/Suscripcion');
const Comprobante = require('../models/Comprobante');
const Configuracion = require('../models/Configuracion');
const Plan = require('../models/Plan');
const DireccionEntrega = require('../models/DireccionEntrega');
const Feriado = require('../models/Feriado');
const { Op } = require('sequelize');
const { getHolidaysInRange } = require('../utils/colombianHolidays');

    // calculateBusinessDays is no longer needed since we use calcularVencimiento for holidays logic
const getCoberturaData = () => {
    try {
        const filePath = path.join(__dirname, "../data/cobertura.json");
        const data = fs.readFileSync(filePath, "utf8");
        return JSON.parse(data);
    } catch (e) {
        return null;
    }
};

const isBarrioCompatibleWithZone = (barrio, zoneName) => {
  if (!barrio || !zoneName) return true;
  
  const normalize = (text) => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  };

  const cleanBarrio = normalize(barrio);
  const cleanZoneName = normalize(zoneName);

  const cobertura = getCoberturaData();
  if (!cobertura || !cobertura.features) return true;

  const zoneFeature = cobertura.features.find(f => {
      const name = normalize(f.properties.name || f.properties.nombre || "");
      return name === cleanZoneName;
  });

  if (!zoneFeature) return true; 

  const keywordsStr = zoneFeature.properties.keywords || "";
  let keywords = keywordsStr.split(',').map(normalize).filter(k => k);
  
  if (cleanZoneName && !keywords.includes(cleanZoneName)) {
      keywords.push(cleanZoneName);
  }
  
  const isMatch = keywords.some(kw => cleanBarrio.includes(kw));
  return isMatch;
};

// Configuración de Multer para guardar imágenes usando Cloudinary
const { storage: upload } = require('../config/cloudinary');

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
            alergias, restricciones, tipo_proteina,
            fecha_inicio
        } = req.body;

        // 0. Validar compatibilidad de Barrio y Zona de Cobertura
        if (zona_1 && barrio_1 && !isBarrioCompatibleWithZone(barrio_1, zona_1)) {
            return res.status(400).json({ 
                success: false, 
                message: `Discrepancia detectada: El barrio '${barrio_1}' no es compatible con la zona de cobertura geolocalizada '${zona_1}'.` 
            });
        }
        if (delivery_type === 'Hibrida' && zona_2 && barrio_2 && !isBarrioCompatibleWithZone(barrio_2, zona_2)) {
            return res.status(400).json({ 
                success: false, 
                message: `Discrepancia detectada en la dirección 2: El barrio '${barrio_2}' no es compatible con la zona de cobertura geolocalizada '${zona_2}'.` 
            });
        }

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
        const planDb = await Plan.findOne({ where: { nombre: { [Op.iLike]: plan }, esta_activo: true } });
        if (!planDb) {
            return res.status(400).json({ success: false, message: 'El plan seleccionado no es válido.' });
        }

        // 3. Validar o Crear Cliente
        let cliente = await Cliente.findByPk(cedula);
        
        if (!cliente) {
            // Si no existe por cédula, verificamos si el correo ya está en uso por OTRA cédula
            const clientePorEmail = await Cliente.findOne({ where: { correo: email } });
            if (clientePorEmail) {
                // Verificar si la cuenta asociada al email es fraudulenta
                const fraudeEmail = await Suscripcion.findOne({
                    where: { cliente_cedula: clientePorEmail.cedula },
                    include: [{
                        model: Comprobante,
                        where: { estado: 'Rechazado', motivo_rechazo: 'Comprobante Falso' },
                        required: true
                    }]
                });

                if (fraudeEmail) {
                    return res.status(400).json({ 
                        success: false, 
                        message: 'No es posible procesar reservas para este usuario en este momento. Por favor contacta a soporte.' 
                    });
                }

                return res.status(400).json({ 
                    success: false, 
                    message: `El correo ${email} ya está registrado con otro número de documento (#${clientePorEmail.cedula}). Por favor usa tus datos correctos.` 
                });
            }

            cliente = await Cliente.create({
                cedula, nombre, correo: email, celular, esta_activo: false
            });
        } else {
            // Verificar fraude en el cliente encontrado por cédula
            const fraudeCedula = await Suscripcion.findOne({
                where: { cliente_cedula: cedula },
                include: [{
                    model: Comprobante,
                    where: { estado: 'Rechazado', motivo_rechazo: 'Comprobante Falso' },
                    required: true
                }]
            });

            if (fraudeCedula) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'No es posible procesar reservas para este usuario en este momento. Por favor contacta a soporte.' 
                });
            }

            // Si existe por cédula, verificamos si tiene un pago PENDIENTE (esperando validación)
            const subPendiente = await Suscripcion.findOne({ 
                where: { 
                    cliente_cedula: cedula, 
                    estado: 'Pendiente' 
                },
                include: [{ model: Comprobante }]
            });

            if (subPendiente) {
                if (!subPendiente.Comprobantes || subPendiente.Comprobantes.length === 0) {
                    // Es un pedido fantasma (sin comprobante), lo borramos para que no estorbe
                    await DireccionEntrega.destroy({ where: { suscripcion_id: subPendiente.id }});
                    await subPendiente.destroy();
                } else {
                    return res.status(400).json({ 
                        success: false, 
                        message: 'Ya tienes una reserva pendiente de validación. Por favor espera a que validemos tu pago anterior para registrar uno nuevo.' 
                    });
                }
            }

            // Si está activo o vencido, le permitimos actualizar sus datos y crear una nueva suscripción (Renovación)
            cliente.nombre = nombre;
            cliente.correo = email;
            cliente.celular = celular;
            await cliente.save();
        }

        // 4. Calcular Precio Total con ajuste por festivos usando calcularVencimiento
        const { calcularVencimiento } = require('../utils/dateUtils');
        const feriadosDocs = await Feriado.findAll();
        
        const vencimientoResult = calcularVencimiento(
            targetStartDate,
            planDb.nombre,
            parseInt(planDb.dias_duracion, 10),
            feriadosDocs,
            'Pendiente'
        );
        
        const planDays = parseInt(planDb.dias_duracion, 10) || 5;
        let precioAjustado = parseFloat(planDb.precio_base);
        
        if (vencimientoResult.holidaysInWindow > 0) {
            const valorDia = precioAjustado / planDays;
            precioAjustado = precioAjustado - (valorDia * vencimientoResult.holidaysInWindow);
        }

        const requiresCocas = needs_cocas === 'true' || needs_cocas === true;
        // Fetch juego_cocas price from Config
        const configCocas = await Configuracion.findOne({ where: { clave: 'juego_cocas' } });
        const priceCocas = configCocas ? parseFloat(configCocas.valor) : 70000;
        
        const cocasPrice = requiresCocas ? priceCocas : 0;
        
        // 4.5 Calcular Cobro Extra de Proteína
        const proteinaExtra = (tipo_proteina && tipo_proteina !== 'ninguna') ? 10000 : 0;
        const precio_total = precioAjustado + cocasPrice + proteinaExtra;
        
        // 4.6 Interpolar Proteína en Restricciones
        let finalRestricciones = restricciones || '';
        if (tipo_proteina && tipo_proteina !== 'ninguna') {
            finalRestricciones = finalRestricciones 
                ? `${tipo_proteina}, ${finalRestricciones}`
                : tipo_proteina;
        }

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
            restricciones: finalRestricciones,
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

        if (req.file) {
            await Comprobante.create({
                suscripcion_id: nuevaSuscripcion.id,
                url_imagen: req.file.path,
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

        const availability = [];
        const now = new Date();
        const start = new Date(now.toLocaleString("en-US", { timeZone: "America/Bogota" }));
        
        const day = start.getDay();
        const hour = start.getHours();
        let daysToNextMonday = (day === 0) ? 1 : (8 - day);
        
        // 1. Determinar si el "próximo lunes" a evaluar es festivo
        const { getHolidaysInRange } = require('../utils/colombianHolidays');
        const FeriadoModel = require('../models/Feriado');
        
        const tempNextMonday = new Date(start);
        tempNextMonday.setDate(start.getDate() + daysToNextMonday);
        const y_nm = tempNextMonday.getFullYear();
        const m_nm = String(tempNextMonday.getMonth() + 1).padStart(2, '0');
        const d_nm = String(tempNextMonday.getDate()).padStart(2, '0');
        const nextMondayStr = `${y_nm}-${m_nm}-${d_nm}`;
        
        const feriadosDocsNext = await FeriadoModel.findAll({ where: { fecha: nextMondayStr } });
        const isDbHolidayNext = feriadosDocsNext.some(f => f.activo !== false);
        const isIgnoredNext = feriadosDocsNext.some(f => f.activo === false);
        const autoHolidaysNext = getHolidaysInRange(y_nm, y_nm).map(h => h.date);
        const isAutoHolidayNext = autoHolidaysNext.includes(nextMondayStr);
        const isNextMondayHoliday = (isAutoHolidayNext && !isIgnoredNext) || isDbHolidayNext;

        // 2. Aplicar límites de cierre (Cutoff)
        let isPastCutoff = false;
        
        if (isNextMondayHoliday) {
            // Límite: Domingo hasta las 10 PM
            if (day === 0 && hour >= 22) {
                isPastCutoff = true;
            }
        } else {
            // Límite: Sábado hasta las 10 PM
            if (day === 6 && hour >= 22) {
                isPastCutoff = true;
            } else if (day === 0) {
                isPastCutoff = true; // Todo el domingo ya está bloqueado
            }
        }

        // Si ya pasó el límite, el usuario no puede comprar para el próximo lunes, sino para el de arriba
        if (isPastCutoff) {
            daysToNextMonday += 7;
        }
        
        let currentMonday = new Date(start);
        currentMonday.setDate(start.getDate() + daysToNextMonday);

        for (let i = 0; i < 4; i++) {
            const y = currentMonday.getFullYear();
            const m = String(currentMonday.getMonth() + 1).padStart(2, '0');
            const d = String(currentMonday.getDate()).padStart(2, '0');
            const dateStr = `${y}-${m}-${d}`;
            
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

    // Verificación de fraude
    const Comprobante = require('../models/Comprobante');
    const fraudeCedula = await Suscripcion.findOne({
        where: { cliente_cedula: cedula },
        include: [{
            model: Comprobante,
            where: { estado: 'Rechazado', motivo_rechazo: 'Comprobante Falso' },
            required: true
        }]
    });
    if (fraudeCedula) {
        return res.json({ 
            success: true, found: true, blocked: true,
            message: 'No es posible procesar reservas para este usuario en este momento. Por favor contacta a soporte.'
        });
    }

    // Verificación de pedido pendiente
    const subPendiente = await Suscripcion.findOne({ 
        where: { cliente_cedula: cedula, estado: 'Pendiente' },
        include: [{ model: Comprobante }]
    });
    
    if (subPendiente) {
        if (!subPendiente.Comprobantes || subPendiente.Comprobantes.length === 0) {
            // Es un pedido fantasma, lo borramos
            await DireccionEntrega.destroy({ where: { suscripcion_id: subPendiente.id }});
            await subPendiente.destroy();
        } else {
            return res.json({
                success: true, found: true, blocked: true,
                message: 'Ya tienes un pedido en proceso de validación. Por favor espera a que sea aprobado.'
            });
        }
    }

    // Verificación de reglas de renovación
    const Plan = require('../models/Plan');
    const subActiva = await Suscripcion.findOne({ 
        where: { cliente_cedula: cedula, estado: 'Activo' },
        include: [{ model: Plan }]
    });

    if (subActiva) {
        const Feriado = require('../models/Feriado');
        const feriadosDocs = await Feriado.findAll({ attributes: ['fecha', 'activo'] });
        const { calcularVencimiento } = require('../utils/dateUtils');
        const planNombre = subActiva.Plan ? subActiva.Plan.nombre : null;
        const planDias = subActiva.Plan ? subActiva.Plan.dias_duracion : 5;
        const calc = calcularVencimiento(subActiva.fecha_inicio, planNombre, planDias, feriadosDocs, subActiva.estado);

        const isExpiringSoon = calc.diasRestantes <= 5;
        const today = new Date().getDay();

        if (!isExpiringSoon) {
            return res.json({
                success: true, found: true, blocked: true,
                message: `Tu suscripción actual aún tiene ${calc.diasRestantes} días. Solo puedes renovar cuando falten 5 días o menos.`
            });
        }

    }

    // Si llegamos hasta aquí sin bloqueos, verificamos si realmente tiene historial válido
    // para saludarlo. Si solo tenía el pedido fantasma que acabamos de borrar, lo tratamos como nuevo.
    const validSubs = await Suscripcion.count({ 
      where: { 
        cliente_cedula: cedula, 
        estado: { [Op.ne]: 'Pendiente' } 
      } 
    });

    if (validSubs === 0) {
      // El cliente existe en DB pero no tiene un historial real (solo intentos fallidos o fantasmas)
      return res.json({ success: false, found: false });
    }

    // Extraer última dirección si existe (para pre-llenado)
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

// Proxy de geocodificación para evitar errores de CORS
const geocodeAddress = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ success: false, message: "Consulta vacía" });

    // Cambiamos Nominatim por Photon (Komoot) que es más permisivo con el rate limit
    const response = await axios.get(`https://photon.komoot.io/api/`, {
      params: { 
        q, 
        limit: 1
      }
    });

    // Photon devuelve un GeoJSON FeatureCollection directamente.
    // Lo mapeamos al formato que espera el frontend (array de objetos con lat/lon)
    const results = response.data.features.map(f => ({
      lat: f.geometry.coordinates[1],
      lon: f.geometry.coordinates[0],
      display_name: f.properties.name || f.properties.street || q
    }));

    res.json(results);
  } catch (error) {
    console.error("Geocoding proxy error detail:", error.response?.data || error.message);
    res.status(500).json({ 
      success: false, 
      message: "Error en el servicio de geocodificación",
      error: error.message 
    });
  }
};

module.exports = {
  upload,
  createOrder,
  getAvailability,
  checkClient,
  geocodeAddress
};
