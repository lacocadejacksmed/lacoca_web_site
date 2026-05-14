const Cliente = require("../models/Cliente");
const Suscripcion = require("../models/Suscripcion");
const Comprobante = require("../models/Comprobante");
const Configuracion = require("../models/Configuracion");
const Plan = require("../models/Plan");
const DireccionEntrega = require("../models/DireccionEntrega");
const { Op } = require("sequelize");

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

// Obtener estadísticas para el dashboard
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
      include: [{ model: Suscripcion, include: [Cliente] }],
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
        }

        sub.estado = "Activo";
        await sub.save();
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
    res.json({ success: true, clientes });
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
    res.json({ success: true, subscriptions: subs });
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

const Feriado = require("../models/Feriado");

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

module.exports = {
  getStats,
  getComprobantes,
  getCupos,
  getComprobanteById,
  getClientes,
  getSubscriptions,
  getSubscriptionById,
  updateComprobanteStatus,
  updateSubscription,
  updateCliente,
  deactivateCliente,
  exportDailyExcel,
  exportDailyPdf,
  getFeriados,
  addFeriado,
  deleteFeriado,
};
