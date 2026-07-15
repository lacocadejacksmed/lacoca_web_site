const Cliente = require("../models/Cliente");
const Suscripcion = require("../models/Suscripcion");
const Comprobante = require("../models/Comprobante");
const Configuracion = require("../models/Configuracion");
const Plan = require("../models/Plan");
const DireccionEntrega = require("../models/DireccionEntrega");
const Usuario = require("../models/Usuario");
const { sendTextMessage } = require('../services/whatsapp.service');
const { Op } = require("sequelize");
const Feriado = require("../models/Feriado");
const { calcularVencimiento } = require("../utils/dateUtils");

const fs = require("fs");
const path = require("path");

let ExcelJS;
let PDFDocument;
let hasExcel = true;
let hasPdf = true;

try {
  ExcelJS = require("exceljs");
} catch (err) {
  hasExcel = false;
  console.warn("Módulo exceljs no instalado. Exportación Excel deshabilitada.");
}

try {
  PDFDocument = require("pdfkit");
} catch (err) {
  hasPdf = false;
  console.warn("Módulo pdfkit no instalado. Exportación PDF deshabilitada.");
}

// Obtener estadísticas avanzadas para el dashboard
const getDashboardStats = async (req, res) => {
  try {
    const { period, date } = req.query;
    
    // Configurar fecha de filtro
    const now = new Date();
    let filterDate = new Date();
    
    if (period === 'hoy') filterDate.setHours(0,0,0,0);
    else if (period === 'semana') filterDate.setDate(now.getDate() - 7);
    else if (period === 'quincena') filterDate.setDate(now.getDate() - 15);
    else if (period === 'mes') filterDate.setMonth(now.getMonth() - 1);
    else filterDate = new Date(0); // 'total'
    
    const isMatch = (fechaStr) => {
      if (period === 'custom' && date) {
        return fechaStr.startsWith(date);
      }
      return new Date(fechaStr) >= filterDate;
    };

    // Obtener comprobantes
    const comprobantes = await Comprobante.findAll({
      attributes: ['estado', 'fecha_creacion', 'motivo_rechazo'],
      include: [{ model: Suscripcion, attributes: ['precio_total'] }]
    });

    let income = 0;
    let pending = 0;
    let byCocas = 0;
    let byFake = 0;
    let byNotReflected = 0;

    comprobantes.forEach(comp => {
      const fecha = comp.fecha_creacion.toISOString();
      const status = comp.estado.toLowerCase();
      const match = isMatch(fecha);

      if (status === 'aprobado' && match) {
        income += Number(comp.Suscripcion ? comp.Suscripcion.precio_total : 0);
      } else if (status === 'pendiente') {
        pending++; // Pendientes son globales usualmente, o podemos filtrarlos
      } else if (status === 'rechazado' && match) {
        if (comp.motivo_rechazo === 'Mentira Juego Cocas') byCocas++;
        else if (comp.motivo_rechazo === 'Comprobante Falso') byFake++;
        else if (comp.motivo_rechazo === 'No Reflejado') byNotReflected++;
      }
    });

    // Obtener clientes activos para "Activos" y "Por Vencer"
    const activeClients = await Suscripcion.findAll({
      where: { estado: 'Activo' },
      include: [Cliente, Plan]
    });

    const active = activeClients.length;
    let expiring = 0;

    const feriadosDocs = await Feriado.findAll({ attributes: ['fecha', 'activo'] });

    activeClients.forEach(sub => {
      const { diasRestantes } = calcularVencimiento(
        sub.fecha_inicio,
        sub.Plan ? sub.Plan.nombre : '',
        sub.Plan ? sub.Plan.dias_duracion : 0,
        feriadosDocs,
        sub.estado
      );
      if (diasRestantes <= 5 && diasRestantes > 0) {
        expiring++;
      }
    });

    res.json({
      success: true,
      stats: { income, active, pending, expiring, byCocas, byFake, byNotReflected }
    });
  } catch (error) {
    console.error("Error en getDashboardStats:", error);
    res.status(500).json({ success: false, message: "Error obteniendo estadísticas del dashboard" });
  }
};

const getStrategyStats = async (req, res) => {
  try {
    // ── Traemos TODAS las suscripciones para análisis completo ──
    const allSubs = await Suscripcion.findAll({
      include: [Cliente, Plan, { model: DireccionEntrega, as: 'direcciones' }],
      order: [['fecha_creacion', 'ASC']]
    });

    const activeSubs = allSubs.filter(s => s.estado === 'Activo');
    const totalClientes = await Cliente.count();
    const totalSubs = allSubs.length;

    // ── MRR ──
    let mrr = 0;
    activeSubs.forEach(sub => {
      const price = Number(sub.precio_total) || 0;
      const days = sub.Plan?.dias_duracion || 7;
      mrr += (price / days) * 30;
    });

    // ── Plan Counts con porcentajes ──
    const planCounts = {};
    activeSubs.forEach(sub => {
      const planName = sub.Plan?.nombre || 'Otro';
      planCounts[planName] = (planCounts[planName] || 0) + 1;
    });
    const totalActive = activeSubs.length;
    const planData = Object.entries(planCounts)
      .map(([name, value]) => ({
        name,
        value,
        percent: totalActive > 0 ? Math.round((value / totalActive) * 100) : 0
      }))
      .sort((a, b) => b.value - a.value);

    // ── Modalidad de Entrega con porcentajes ──
    const deliveryCounts = { Fija: 0, Híbrida: 0 };
    activeSubs.forEach(sub => {
      const tipo = (sub.tipo_entrega || 'Fija');
      if (tipo === 'Hibrida') deliveryCounts['Híbrida']++;
      else deliveryCounts['Fija']++;
    });
    const deliveryData = Object.entries(deliveryCounts)
      .map(([name, value]) => ({
        name,
        value,
        percent: totalActive > 0 ? Math.round((value / totalActive) * 100) : 0
      }))
      .filter(d => d.value > 0);

    // ── Cocas con porcentajes ──
    let cocasCompradas = 0, cocasPropias = 0;
    activeSubs.forEach(sub => {
      if (sub.necesita_cocas) cocasCompradas++;
      else cocasPropias++;
    });
    const cocasData = [
      { name: 'Compraron', value: cocasCompradas, percent: totalActive > 0 ? Math.round((cocasCompradas / totalActive) * 100) : 0 },
      { name: 'Ya Tenían', value: cocasPropias, percent: totalActive > 0 ? Math.round((cocasPropias / totalActive) * 100) : 0 }
    ].filter(d => d.value > 0);

    // ── Top Barrios ──
    const barrioMap = {};
    activeSubs.forEach(sub => {
      if (sub.direcciones && sub.direcciones.length > 0) {
        const mainDir = sub.direcciones.find(d => d.es_principal) || sub.direcciones[0];
        if (mainDir.barrio) {
          const cleanBarrio = mainDir.barrio.trim().toUpperCase();
          barrioMap[cleanBarrio] = (barrioMap[cleanBarrio] || 0) + 1;
        }
      }
    });
    const topBarrios = Object.entries(barrioMap)
      .map(([name, cantidad]) => ({
        name,
        cantidad,
        percent: totalActive > 0 ? Math.round((cantidad / totalActive) * 100) : 0
      }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 10);

    // ── Restricciones y Alergias ──
    const restriccionesMap = {};
    activeSubs.forEach(sub => {
      const addRestrictions = (str) => {
        if (!str) return;
        str.split(',').forEach(s => {
          const clean = s.trim().toUpperCase();
          if (clean.length > 2) restriccionesMap[clean] = (restriccionesMap[clean] || 0) + 1;
        });
      };
      addRestrictions(sub.alergias);
      addRestrictions(sub.restricciones);
    });
    const topRestricciones = Object.entries(restriccionesMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 15);

    // ── RETENCIÓN DE CLIENTES ──
    // Agrupamos suscripciones por cédula del cliente
    const subsByClient = {};
    allSubs.forEach(sub => {
      const cedula = sub.cliente_cedula;
      if (!subsByClient[cedula]) subsByClient[cedula] = [];
      subsByClient[cedula].push(sub);
    });

    let loyalCount = 0;       // 3+ suscripciones (leales)
    let occasionalCount = 0;  // 2 suscripciones (volvieron al menos una vez)
    let oneTimeCount = 0;     // 1 sola suscripción
    let activeNow = 0;        // Tienen suscripción activa actualmente
    let churnedCount = 0;     // Tuvieron suscripciones pero ninguna está activa

    Object.entries(subsByClient).forEach(([cedula, subs]) => {
      const completedOrActive = subs.filter(s => s.estado === 'Activo' || s.estado === 'Cancelado' || s.estado === 'Vencido');
      const hasActive = subs.some(s => s.estado === 'Activo');
      const count = completedOrActive.length;

      if (hasActive) activeNow++;

      if (count >= 3) loyalCount++;
      else if (count === 2) occasionalCount++;
      else if (count >= 1) oneTimeCount++;

      if (count >= 1 && !hasActive) churnedCount++;
    });

    const totalWithHistory = Object.keys(subsByClient).length;
    const retentionData = [
      { name: 'Leales (3+)', value: loyalCount, percent: totalWithHistory > 0 ? Math.round((loyalCount / totalWithHistory) * 100) : 0 },
      { name: 'Volvieron (2)', value: occasionalCount, percent: totalWithHistory > 0 ? Math.round((occasionalCount / totalWithHistory) * 100) : 0 },
      { name: 'Una sola vez', value: oneTimeCount, percent: totalWithHistory > 0 ? Math.round((oneTimeCount / totalWithHistory) * 100) : 0 }
    ].filter(d => d.value > 0);

    // ── Tasa de retención vs churn ──
    const retentionRate = totalWithHistory > 0 ? Math.round(((totalWithHistory - churnedCount) / totalWithHistory) * 100) : 0;
    const churnRate = totalWithHistory > 0 ? Math.round((churnedCount / totalWithHistory) * 100) : 0;

    // ── Facturación electrónica ──
    let facturacionSi = 0, facturacionNo = 0;
    activeSubs.forEach(sub => {
      if (sub.facturacion_electronica) facturacionSi++;
      else facturacionNo++;
    });

    // ── Ticket promedio ──
    let totalRevenue = 0;
    activeSubs.forEach(sub => { totalRevenue += Number(sub.precio_total) || 0; });
    const avgTicket = totalActive > 0 ? Math.round(totalRevenue / totalActive) : 0;

    res.json({
      success: true,
      mrr: Math.round(mrr),
      avgTicket,
      totalClientes,
      totalSubs,
      totalActive,
      activeNow,
      churnedCount,
      retentionRate,
      churnRate,
      facturacionElectronica: {
        si: facturacionSi,
        no: facturacionNo,
        percentSi: totalActive > 0 ? Math.round((facturacionSi / totalActive) * 100) : 0
      },
      planData,
      deliveryData,
      cocasData,
      topBarrios,
      topRestricciones,
      retentionData
    });
  } catch (error) {
    console.error("Error en getStrategyStats:", error);
    res.status(500).json({ success: false, message: "Error obteniendo estadísticas de estrategia" });
  }
};

// Obtener estadísticas simples para compatibilidad
const getStats = async (req, res) => {
  try {
    const totalClientesActivos = await Cliente.count({
      where: { esta_activo: true },
    });
    const pendingComprobantes = await Comprobante.count({
      where: { estado: "Pendiente" },
    });

    // Sumar ventas de suscripciones activas
    const activas = await Suscripcion.findAll({ where: { estado: "Activo" } });
    const weeklySales = activas.reduce(
      (acc, sub) => acc + Number(sub.precio_total),
      0,
    );

    res.json({
      success: true,
      stats: {
        totalClientesActivos,
        pendingComprobantes,
        weeklySales: `$${weeklySales.toLocaleString("es-CO")}`,
      },
    });
  } catch (error) {
    console.error("Error obteniendo stats:", error);
    res.status(500).json({ success: false, message: "Error obteniendo estadísticas" });
  }
};

// Obtener todos los comprobantes con información de la suscripción y cliente
const getComprobantes = async (req, res) => {
  try {
    const comprobantes = await Comprobante.findAll({
      include: [
        {
          model: Suscripcion,
          include: [Cliente, Plan, { model: DireccionEntrega, as: 'direcciones' }],
        },
      ],
      order: [["fecha_creacion", "DESC"]],
    });

    const result = comprobantes.map((comp) => {
      const sub = comp.Suscripcion;
      const cli = sub ? sub.Cliente : null;
      const plan = sub ? sub.Plan : null;
      return {
        id: comp.id,
        imageUrl: comp.url_imagen,
        status: comp.estado,
        createdAt: comp.fecha_creacion,
        subscriptionId: sub ? sub.id : null,
        plan: plan ? plan.nombre : "N/A",
        amount: sub ? sub.precio_total : 0,
        clienteNombre: cli ? cli.nombre : "Desconocido",
        clienteCedula: cli ? cli.cedula : "N/A",
        clienteEmail: cli ? cli.correo : "",
        clienteCelular: cli ? cli.celular : "",
        necesitaCocas: sub ? sub.necesita_cocas : false,
        tipoEntrega: sub ? sub.tipo_entrega : "Fija",
        facturacionElectronica: sub ? sub.facturacion_electronica : false,
        alergias: sub ? sub.alergias : "",
        restricciones: sub ? sub.restricciones : "",
        direcciones: sub ? sub.direcciones : [],
        motivo_rechazo: comp.motivo_rechazo,
        observaciones: comp.observaciones,
        fecha_inicio: sub ? sub.fecha_inicio : null
      };
    });

    res.json({ success: true, comprobantes: result });
  } catch (error) {
    console.error("Error obteniendo comprobantes:", error);
    res.status(500).json({ success: false, message: "Error obteniendo comprobantes" });
  }
};

// Aprobar o rechazar un comprobante
const updateComprobanteStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, motivo_rechazo, observaciones } = req.body;

    const comprobante = await Comprobante.findByPk(id, {
      include: [{ model: Suscripcion, include: [Cliente, Plan] }],
    });

    if (!comprobante) {
      return res.status(404).json({ success: false, message: "Comprobante no encontrado" });
    }

    comprobante.estado = status;
    if (motivo_rechazo) comprobante.motivo_rechazo = motivo_rechazo;
    if (observaciones) comprobante.observaciones = observaciones;
    await comprobante.save();

    const sub = comprobante.Suscripcion;
    const cli = sub ? sub.Cliente : null;

    if (status === "Aprobado") {
      if (sub) {
        // Desactivar cualquier suscripción activa previa para este cliente
        if (cli) {
          const oldSub = await Suscripcion.findOne({
            where: { 
              cliente_cedula: cli.cedula, 
              estado: "Activo",
              id: { [Op.ne]: sub.id }
            }
          });

          await Suscripcion.update(
            { estado: "Cancelado" },
            { 
              where: { 
                cliente_cedula: cli.cedula, 
                estado: "Activo",
                id: { [Op.ne]: sub.id }
              } 
            }
          );

          // Heredar e inyectar la fecha_inicio si la nueva suscripción no la tiene
          if (!sub.fecha_inicio && oldSub && oldSub.fecha_inicio) {
             sub.fecha_inicio = oldSub.fecha_inicio;
          }
        }

        // Actualizar explícitamente para evitar que se sobrescriba o se pierda (quede en NULL)
        await Suscripcion.update(
          { 
            estado: "Activo", 
            fecha_inicio: sub.fecha_inicio // Forzamos inyectar la fecha
          },
          { where: { id: sub.id } }
        );
      }
      if (cli) {
        cli.esta_activo = true;
        await cli.save();
      }
    } else if (status === "Rechazado") {
      if (sub) {
        sub.estado = "Cancelado";
        await sub.save();
      }
    }

    res.json({ success: true, message: `Comprobante ${status.toLowerCase()} exitosamente` });
  } catch (error) {
    console.error("Error actualizando comprobante:", error);
    res.status(500).json({ success: false, message: "Error actualizando comprobante" });
  }
};

// Actualizar datos básicos de un cliente
const updateCliente = async (req, res) => {
  try {
    const { cedula } = req.params;
    const { nombre, correo, celular } = req.body;
    const cliente = await Cliente.findByPk(cedula);

    if (!cliente) {
      return res.status(404).json({ success: false, message: "Cliente no encontrado" });
    }

    await cliente.update({ nombre, correo, celular });
    res.json({ success: true, message: "Información del cliente actualizada" });
  } catch (error) {
    console.error("Error actualizando cliente:", error);
    res.status(500).json({ success: false, message: "Error al actualizar cliente" });
  }
};

// Crear cliente manualmente (Admin)
const createClienteManual = async (req, res) => {
  try {
    const { 
      cedula, nombre, correo, celular, 
      plan_id, necesita_cocas, tipo_entrega,
      alergias, restricciones, fecha_inicio,
      direcciones, facturacion_electronica
    } = req.body;

    let cliente = await Cliente.findByPk(cedula);
    if (!cliente) {
      cliente = await Cliente.create({ cedula, nombre, correo, celular, esta_activo: true });
    } else {
      await cliente.update({ nombre, correo, celular, esta_activo: true });
    }

    const planDb = await Plan.findByPk(plan_id);
    if (!planDb) return res.status(400).json({ success: false, message: "Plan inválido" });

    const { calcularVencimiento } = require('../utils/dateUtils');
    const feriadosDocs = await Feriado.findAll();
    
    const vencimientoResult = calcularVencimiento(
        fecha_inicio,
        planDb.nombre,
        parseInt(planDb.dias_duracion, 10),
        feriadosDocs,
        'Activo'
    );
    
    const planDays = parseInt(planDb.dias_duracion, 10) || 5;
    let precioAjustado = parseFloat(planDb.precio_base);
    
    if (vencimientoResult.holidaysInWindow > 0) {
        const valorDia = precioAjustado / planDays;
        precioAjustado = precioAjustado - (valorDia * vencimientoResult.holidaysInWindow);
    }

    const configCocas = await Configuracion.findOne({ where: { clave: 'juego_cocas' } });
    const priceCocas = configCocas ? parseFloat(configCocas.valor) : 70000;
    const precio_total = precioAjustado + (necesita_cocas ? priceCocas : 0);

    const sub = await Suscripcion.create({
      cliente_cedula: cedula,
      plan_id,
      necesita_cocas,
      tipo_entrega,
      facturacion_electronica: facturacion_electronica || false,
      precio_total,
      estado: "Activo",
      alergias,
      restricciones,
      fecha_inicio
    });

    if (direcciones && direcciones.length > 0) {
      for (const dir of direcciones) {
        await DireccionEntrega.create({
          suscripcion_id: sub.id,
          direccion: dir.direccion,
          barrio: dir.barrio,
          dias_entrega: dir.dias_entrega,
          es_principal: dir.es_principal,
          zona: dir.zona || 'por-asignar',
          latitud: dir.latitud || 0,
          longitud: dir.longitud || 0
        });
      }
    }

    res.json({ success: true, message: "Cliente creado manualmente exitosamente" });
  } catch (error) {
    console.error("Error creando cliente manual:", error);
    res.status(500).json({ success: false, message: "Error al crear cliente manual" });
  }
};

// Actualización en cascada de Cliente, Suscripción y Direcciones
const updateClienteFull = async (req, res) => {
  try {
    const { cedula } = req.params;
    const {
      nombre, correo, celular, esta_activo,
      suscripcion_id,
      plan_id, necesita_cocas, tipo_entrega,
      alergias, restricciones, fecha_inicio, estado_sub,
      direcciones
    } = req.body;

    const cliente = await Cliente.findByPk(cedula);
    if (!cliente) return res.status(404).json({ success: false, message: "Cliente no encontrado" });

    await cliente.update({ nombre, correo, celular, esta_activo });

    if (suscripcion_id) {
      const sub = await Suscripcion.findByPk(suscripcion_id);
      if (sub) {
        await sub.update({
          plan_id, necesita_cocas, tipo_entrega,
          alergias, restricciones, fecha_inicio, estado: estado_sub || sub.estado
        });

        if (direcciones && direcciones.length > 0) {
          await DireccionEntrega.destroy({ where: { suscripcion_id: sub.id } });
          for (const dir of direcciones) {
            await DireccionEntrega.create({
              suscripcion_id: sub.id,
              direccion: dir.direccion,
              barrio: dir.barrio,
              dias_entrega: dir.dias_entrega,
              es_principal: dir.es_principal,
              zona: dir.zona || 'por-asignar',
              latitud: dir.latitud || 0,
              longitud: dir.longitud || 0
            });
          }
        }
      }
    }

    res.json({ success: true, message: "Información completa del cliente actualizada" });
  } catch (error) {
    console.error("Error actualizando cliente completo:", error);
    res.status(500).json({ success: false, message: "Error al actualizar cliente completo" });
  }
};

// Desactivar a un cliente
const deactivateCliente = async (req, res) => {
  try {
    const { cedula } = req.params;
    const cliente = await Cliente.findByPk(cedula);

    if (!cliente) {
      return res.status(404).json({ success: false, message: "Cliente no encontrado" });
    }

    cliente.esta_activo = false;
    await cliente.save();

    const sub = await Suscripcion.findOne({
      where: { cliente_cedula: cedula, estado: "Activo" },
    });
    if (sub) {
      sub.estado = "Cancelado";
      await sub.save();
    }

    res.json({ success: true, message: "Cliente desactivado exitosamente" });
  } catch (error) {
    console.error("Error desactivando cliente:", error);
    res.status(500).json({ success: false, message: "Error desactivando cliente" });
  }
};

// Obtener resumen de cupos
const getCupos = async (req, res) => {
  try {
    const maxCuposConfig = await Configuracion.findByPk("max_cupos");
    const maxCupos = maxCuposConfig ? parseInt(maxCuposConfig.valor, 10) : null;

    const reserved = await Suscripcion.count({
      where: { estado: ["Pendiente", "Activo"] },
    });
    const available = maxCupos !== null ? Math.max(0, maxCupos - reserved) : null;

    res.json({ success: true, cupos: { maxCupos, reserved, available } });
  } catch (error) {
    console.error("Error obteniendo cupos:", error);
    res.status(500).json({ success: false, message: "Error obteniendo cupos" });
  }
};

// Obtener todos los clientes
const getClientes = async (req, res) => {
  try {
    const clientes = await Cliente.findAll({
      include: [{ 
        model: Suscripcion, 
        include: [Comprobante, Plan, { model: DireccionEntrega, as: 'direcciones' }] 
      }],
      order: [["fecha_creacion", "DESC"]],
    });

    // Calcular vencimientos de forma centralizada
    const feriadosDocs = await Feriado.findAll({ attributes: ['fecha', 'activo'] });

    const clientesConVencimiento = clientes.map(cliente => {
      const c = cliente.toJSON();
      if (c.Suscripcions && c.Suscripcions.length > 0) {
        c.Suscripcions = c.Suscripcions.map(sub => {
          const { fechaVencimiento, diasRestantes } = calcularVencimiento(
            sub.fecha_inicio,
            sub.Plan ? sub.Plan.nombre : '',
            sub.Plan ? sub.Plan.dias_duracion : 0,
            feriadosDocs,
            sub.estado
          );
          return { ...sub, fecha_vencimiento: fechaVencimiento, dias_restantes: diasRestantes };
        });
      }
      return c;
    });

    res.json({ success: true, clientes: clientesConVencimiento });
  } catch (error) {
    console.error("Error obteniendo clientes:", error);
    res.status(500).json({ success: false, message: "Error obteniendo clientes" });
  }
};

// Obtener todas las suscripciones
const getSubscriptions = async (req, res) => {
  try {
    const subs = await Suscripcion.findAll({
      include: [Cliente, Comprobante, Plan, { model: DireccionEntrega, as: 'direcciones' }],
      order: [["fecha_creacion", "DESC"]],
    });

    const feriadosDocs = await Feriado.findAll({ attributes: ['fecha', 'activo'] });

    const subsConVencimiento = subs.map(subModel => {
      const sub = subModel.toJSON();
      const { fechaVencimiento, diasRestantes } = calcularVencimiento(
        sub.fecha_inicio,
        sub.Plan ? sub.Plan.nombre : '',
        sub.Plan ? sub.Plan.dias_duracion : 0,
        feriadosDocs,
        sub.estado
      );
      return { ...sub, fecha_vencimiento: fechaVencimiento, dias_restantes: diasRestantes };
    });

    res.json({ success: true, subscriptions: subsConVencimiento });
  } catch (error) {
    console.error("Error obteniendo suscripciones:", error);
    res.status(500).json({ success: false, message: "Error obteniendo suscripciones" });
  }
};

// Obtener un comprobante por id
const getComprobanteById = async (req, res) => {
  try {
    const { id } = req.params;
    const comprobante = await Comprobante.findByPk(id, {
      include: [{ model: Suscripcion, include: [Cliente, Plan] }],
    });
    if (!comprobante) return res.status(404).json({ success: false, message: "Comprobante no encontrado" });
    res.json({ success: true, comprobante });
  } catch (error) {
    console.error("Error obteniendo comprobante:", error);
    res.status(500).json({ success: false, message: "Error obteniendo comprobante" });
  }
};

// Obtener una suscripción por id
const getSubscriptionById = async (req, res) => {
  try {
    const { id } = req.params;
    const subscription = await Suscripcion.findByPk(id, {
      include: [Cliente, Comprobante, Plan, { model: DireccionEntrega, as: 'direcciones' }],
    });
    if (!subscription) return res.status(404).json({ success: false, message: "Suscripción no encontrada" });
    res.json({ success: true, subscription });
  } catch (error) {
    console.error("Error obteniendo suscripción:", error);
    res.status(500).json({ success: false, message: "Error obteniendo suscripción" });
  }
};

// Exportar datos diarios a Excel
const exportDailyExcel = async (req, res) => {
  if (!hasExcel) return res.status(501).json({ success: false, message: "Módulo exceljs no disponible." });
  try {
    const date = req.query.date || new Date().toISOString().slice(0, 10);
    const start = new Date(date); start.setHours(0, 0, 0, 0);
    const end = new Date(date); end.setHours(23, 59, 59, 999);

    const subs = await Suscripcion.findAll({
      where: { fecha_creacion: { [Op.between]: [start, end] } },
      include: [Cliente, Plan],
      order: [["fecha_creacion", "ASC"]],
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Registros");

    sheet.columns = [
      { header: "ID", key: "id", width: 8 },
      { header: "Nombre", key: "nombre", width: 30 },
      { header: "Cédula", key: "cedula", width: 18 },
      { header: "Email", key: "email", width: 30 },
      { header: "Celular", key: "celular", width: 18 },
      { header: "Plan", key: "plan", width: 12 },
      { header: "Total", key: "total", width: 12 },
      { header: "Estado", key: "status", width: 12 },
      { header: "Fecha", key: "fecha", width: 22 },
    ];

    subs.forEach((s) => {
      const c = s.Cliente || {};
      const p = s.Plan || {};
      sheet.addRow({
        id: s.id,
        nombre: c.nombre || "",
        cedula: c.cedula || s.cliente_cedula,
        email: c.correo || "",
        celular: c.celular || "",
        plan: p.nombre || "N/A",
        total: s.precio_total,
        status: s.estado,
        fecha: s.fecha_creacion.toISOString(),
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    res.setHeader("Content-Disposition", `attachment; filename="registros-${date}.xlsx"`);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.send(buffer);
  } catch (error) {
    console.error("Error exportando Excel:", error);
    res.status(500).json({ success: false, message: "Error generando Excel" });
  }
};

// Exportar datos diarios a PDF
const exportDailyPdf = async (req, res) => {
  if (!hasPdf) return res.status(501).json({ success: false, message: "Módulo pdfkit no disponible." });
  try {
    const date = req.query.date || new Date().toISOString().slice(0, 10);
    const start = new Date(date); start.setHours(0, 0, 0, 0);
    const end = new Date(date); end.setHours(23, 59, 59, 999);

    const subs = await Suscripcion.findAll({
      where: { fecha_creacion: { [Op.between]: [start, end] } },
      include: [Cliente, Plan, { model: DireccionEntrega, as: 'direcciones' }],
      order: [["fecha_creacion", "ASC"]],
    });

    const doc = new PDFDocument({ margin: 40 });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => {
      const result = Buffer.concat(chunks);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="registros-${date}.pdf"`);
      res.send(result);
    });

    doc.fontSize(18).text(`Reportes de registros - ${date}`, { align: "center" });
    doc.moveDown();

    subs.forEach((s, idx) => {
      const c = s.Cliente || {};
      const p = s.Plan || {};
      doc.fontSize(12).fillColor("black").text(`${idx + 1}. ID: ${s.id} — ${c.nombre || "Sin nombre"} (${c.cedula || s.cliente_cedula})`);
      doc.fontSize(10).text(`   Email: ${c.correo || "-"}  Celular: ${c.celular || "-"}  Plan: ${p.nombre || "N/A"}  Total: ${s.precio_total}  Estado: ${s.estado}`);
      
      if (s.direcciones && s.direcciones.length) {
        s.direcciones.forEach((dir, dIdx) => {
          doc.text(`   Dirección ${dIdx + 1}: ${dir.direccion} — Barrio: ${dir.barrio} (${dir.dias_entrega})`);
        });
      }
      doc.moveDown(0.5);
      doc.moveTo(doc.x, doc.y).lineTo(doc.page.width - doc.page.margins.right, doc.y).strokeOpacity(0.05).stroke();
      doc.moveDown(0.5);
    });

    doc.end();
  } catch (error) {
    console.error("Error exportando PDF:", error);
    res.status(500).json({ success: false, message: "Error generando PDF" });
  }
};

// Actualizar datos de una suscripción y su cliente
const updateSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      nombre, email, celular, 
      plan_id, necesita_cocas, tipo_entrega,
      alergias, restricciones, direcciones,
      fecha_inicio
    } = req.body;

    const sub = await Suscripcion.findByPk(id, { include: [Cliente] });
    if (!sub) return res.status(404).json({ success: false, message: "Suscripción no encontrada" });

    // Actualizar Cliente
    if (sub.Cliente) {
      await sub.Cliente.update({ nombre, correo: email, celular });
    }

    // Actualizar Suscripción
    await sub.update({ 
      plan_id, 
      necesita_cocas, 
      tipo_entrega, 
      alergias, 
      restricciones,
      fecha_inicio
    });

    // Actualizar Direcciones (Simple: borrar y recrear)
    if (direcciones && direcciones.length > 0) {
      await DireccionEntrega.destroy({ where: { suscripcion_id: id } });
      for (const dir of direcciones) {
        await DireccionEntrega.create({
          suscripcion_id: id,
          direccion: dir.direccion,
          barrio: dir.barrio,
          dias_entrega: dir.dias_entrega,
          es_principal: dir.es_principal
        });
      }
    }

    res.json({ success: true, message: "Datos actualizados correctamente" });
  } catch (error) {
    console.error("Error actualizando suscripción:", error);
    res.status(500).json({ success: false, message: "Error al actualizar los datos" });
  }
};

// ... existing code ...

const getFeriados = async (req, res) => {
  try {
    const feriados = await Feriado.findAll({ order: [['fecha', 'ASC']] });
    res.json({ success: true, feriados });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const addFeriado = async (req, res) => {
  try {
    const { fecha, descripcion } = req.body;
    const feriado = await Feriado.create({ fecha, descripcion });
    res.json({ success: true, feriado });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteFeriado = async (req, res) => {
  try {
    await Feriado.destroy({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const toggleFeriado = async (req, res) => {
  try {
    const { fecha, descripcion } = req.body;
    if (!fecha) return res.status(400).json({ success: false, message: 'Falta la fecha' });
    
    let feriado = await Feriado.findOne({ where: { fecha } });
    if (feriado) {
      feriado.activo = !feriado.activo;
      await feriado.save();
    } else {
      feriado = await Feriado.create({ 
        fecha, 
        descripcion: descripcion || 'Ignorado por Administrador', 
        activo: false 
      });
    }
    res.json({ success: true, feriado });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getRepartidores = async (req, res) => {
  try {
    const repartidores = await Usuario.findAll({
      where: { rol: 'repartidor' },
      attributes: ['id', 'nombre', 'zona_asignada']
    });
    res.json({ success: true, repartidores });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const assignRepartidor = async (req, res) => {
  try {
    const { subscriptionId, repartidorId } = req.body;
    const sub = await Suscripcion.findByPk(subscriptionId);
    if (!sub) return res.status(404).json({ success: false, message: 'Suscripción no encontrada' });
    
    sub.repartidor_id = repartidorId;
    await sub.save();
    
    res.json({ success: true, message: 'Repartidor asignado correctamente' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Obtener planes
const getPlanes = async (req, res) => {
  try {
    const planes = await Plan.findAll({ where: { esta_activo: true } });
    const configCocas = await Configuracion.findOne({ where: { clave: 'juego_cocas' } });
    const juegoCocasPrice = configCocas ? parseFloat(configCocas.valor) : 70000;
    res.json({ success: true, planes, juegoCocasPrice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getCoverage = async (req, res) => {
  try {
    const filePath = path.join(__dirname, "../data/cobertura.json");
    const data = fs.readFileSync(filePath, "utf8");
    res.json(JSON.parse(data));
  } catch (error) {
    console.error("Error leyendo cobertura:", error);
    res.status(500).json({ success: false, message: "Error al leer el archivo de cobertura" });
  }
};

const updateCoverage = async (req, res) => {
  try {
    const filePath = path.join(__dirname, "../data/cobertura.json");
    fs.writeFileSync(filePath, JSON.stringify(req.body, null, 2), "utf8");
    res.json({ success: true, message: "Mapa de cobertura actualizado correctamente" });
  } catch (error) {
    console.error("Error guardando cobertura:", error);
    res.status(500).json({ success: false, message: "Error al guardar el archivo de cobertura" });
  }
};

const getConfiguraciones = async (req, res) => {
  try {
    const configuraciones = await Configuracion.findAll();
    res.json({ success: true, configuraciones });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const upsertConfiguracion = async (req, res) => {
  try {
    const { clave, valor } = req.body;
    let config = await Configuracion.findByPk(clave);
    if (config) {
      config.valor = valor;
      await config.save();
    } else {
      await Configuracion.create({ clave, valor });
    }
    res.json({ success: true, message: 'Configuración guardada correctamente' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteConfiguracion = async (req, res) => {
  try {
    const { clave } = req.params;
    await Configuracion.destroy({ where: { clave } });
    res.json({ success: true, message: 'Configuración eliminada' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAllPlanesAdmin = async (req, res) => {
  try {
    const planes = await Plan.findAll();
    res.json({ success: true, planes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const upsertPlan = async (req, res) => {
  try {
    const { id, nombre, precio_base, dias_duracion, esta_activo } = req.body;
    if (id) {
      const plan = await Plan.findByPk(id);
      if (!plan) return res.status(404).json({ success: false, message: 'Plan no encontrado' });
      await plan.update({ nombre, precio_base, dias_duracion, esta_activo });
    } else {
      await Plan.create({ nombre, precio_base, dias_duracion, esta_activo });
    }
    res.json({ success: true, message: 'Plan guardado correctamente' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deletePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const plan = await Plan.findByPk(id);
    if (!plan) return res.status(404).json({ success: false, message: 'Plan no encontrado' });
    
    const subCount = await Suscripcion.count({ where: { plan_id: id } });
    if (subCount > 0) {
      await plan.update({ esta_activo: false });
      return res.json({ success: true, message: 'Plan ocultado ya que tiene suscripciones asociadas.' });
    } else {
      await plan.destroy();
      return res.json({ success: true, message: 'Plan eliminado definitivamente.' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getStats,
  getDashboardStats,
  getStrategyStats,
  getComprobantes,
  getCupos,
  getComprobanteById,
  getClientes,
  getSubscriptions,
  getSubscriptionById,
  updateComprobanteStatus,
  updateSubscription,
  updateCliente,
  createClienteManual,
  updateClienteFull,
  deactivateCliente,
  exportDailyExcel,
  exportDailyPdf,
  getFeriados,
  addFeriado,
  deleteFeriado,
  toggleFeriado,
  getRepartidores,
  assignRepartidor,
  getCoverage,
  getPlanes,
  updateCoverage,
  getConfiguraciones,
  upsertConfiguracion,
  deleteConfiguracion,
  getAllPlanesAdmin,
  upsertPlan,
  deletePlan
};
