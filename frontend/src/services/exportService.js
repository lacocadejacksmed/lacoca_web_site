import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import Swal from 'sweetalert2';

const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('es-CO');
};

const showToast = (msg, icon = 'success') => {
  Swal.fire({ toast: true, position: 'bottom-end', icon, title: msg, showConfirmButton: false, timer: 3000 });
};

const styleHeader = (worksheet, bgColor = 'FF2563EB') => {
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: bgColor }
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
};

const applyBorders = (worksheet) => {
  worksheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
  });
};

const extractAddressInfo = (c) => {
  let dir1 = '', barrio1 = '', dias1 = '', zona1 = '', dir2 = '', barrio2 = '', dias2 = '', zona2 = '', tipoEntrega = 'Fija', cocas = 'No', fechaIni = '';
  
  if (c.raw && (c.raw.Suscripcions || c.raw.Suscripciones)) {
    const subs = c.raw.Suscripcions || c.raw.Suscripciones;
    const activeSub = subs.sort((a,b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion))[0];
    if (activeSub) {
      tipoEntrega = activeSub.modalidad_entrega || activeSub.tipo_entrega || 'Fija';
      cocas = activeSub.necesita_cocas ? 'Sí' : 'No';
      fechaIni = activeSub.fecha_inicio || '';
      const direcciones = activeSub.direcciones || [];
      const d1 = direcciones.find(d => d.es_principal) || direcciones[0];
      const d2 = direcciones.find(d => !d.es_principal && d.id !== d1?.id) || (direcciones.length > 1 ? direcciones[1] : null);
      
      if (d1) {
        dir1 = d1.direccion;
        barrio1 = d1.barrio;
        zona1 = d1.zona || '';
        dias1 = d1.dias_entrega || 'Todos los días';
      }
      if (d2 && tipoEntrega.toLowerCase() === 'hibrida') {
        dir2 = d2.direccion;
        barrio2 = d2.barrio;
        zona2 = d2.zona || '';
        dias2 = d2.dias_entrega || '';
      }
    }
  } else {
    // Fallback to client main fields
    dir1 = c.direccion || '';
    barrio1 = c.barrio || '';
    dias1 = 'Todos los días';
  }
  return { dir1, barrio1, zona1, dias1, dir2, barrio2, zona2, dias2, tipoEntrega, cocas, fechaIni };
};

export async function exportExcel(type, clients = [], payments = [], plans = []) {
  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'La Coca De Jacks';
    workbook.created = new Date();

    const today = new Date().toISOString().split('T')[0];
    let fileName = `Reporte_${today}.xlsx`;
    let worksheet;

    if (type === 'cocina') {
      const activeClients = clients.filter(c => c.status === 'activo' && (c.alergias || c.restricciones));
      worksheet = workbook.addWorksheet('Cocina - Restricciones');
      worksheet.columns = [
        { header: 'Cliente', key: 'nombre', width: 30 },
        { header: 'Cédula', key: 'cedula', width: 15 },
        { header: 'Alergias', key: 'alergias', width: 40 },
        { header: 'Restricciones', key: 'restricciones', width: 40 }
      ];

      activeClients.forEach(c => {
        worksheet.addRow({
          nombre: c.nombre,
          cedula: c.cedula,
          alergias: c.alergias || 'Ninguna',
          restricciones: c.restricciones || 'Ninguna'
        });
      });
      styleHeader(worksheet, 'FFDC2626'); // Rojo
      fileName = `Reporte_Cocina_${today}.xlsx`;

    } else if (type === 'logistica') {
      const activeClients = clients.filter(c => c.status === 'activo');
      worksheet = workbook.addWorksheet('Logística y Despachos');
      worksheet.columns = [
        { header: 'Cliente', key: 'nombre', width: 30 },
        { header: 'Cédula', key: 'cedula', width: 15 },
        { header: 'Teléfono', key: 'telefono', width: 15 },
        { header: 'Plan', key: 'plan', width: 15 },
        { header: 'Modalidad Entrega', key: 'tipoEntrega', width: 20 },
        { header: 'Requiere Cocas', key: 'cocas', width: 15 },
        { header: 'Dir. Principal', key: 'dir1', width: 35 },
        { header: 'Barrio Principal', key: 'barrio1', width: 20 },
        { header: 'Días Principal', key: 'dias1', width: 25 },
        { header: 'Dir. Secundaria', key: 'dir2', width: 35 },
        { header: 'Barrio Secundario', key: 'barrio2', width: 20 },
        { header: 'Días Secundaria', key: 'dias2', width: 25 }
      ];

      activeClients.forEach(c => {
        const addr = extractAddressInfo(c);
        worksheet.addRow({
          nombre: c.nombre,
          cedula: c.cedula,
          telefono: c.telefono,
          plan: (c.plan || '').toUpperCase(),
          tipoEntrega: addr.tipoEntrega,
          cocas: addr.cocas,
          dir1: addr.dir1,
          barrio1: addr.barrio1,
          dias1: addr.dias1,
          dir2: addr.dir2,
          barrio2: addr.barrio2,
          dias2: addr.dias2
        });
      });
      styleHeader(worksheet, 'FFEA580C'); // Naranja
      fileName = `Reporte_Logistica_${today}.xlsx`;

    } else if (type === 'completo') {
      worksheet = workbook.addWorksheet('Todos los Clientes');
      worksheet.columns = [
        { header: 'Nombre', key: 'nombre', width: 30 },
        { header: 'Cédula', key: 'cedula', width: 15 },
        { header: 'Correo', key: 'correo', width: 30 },
        { header: 'Teléfono', key: 'telefono', width: 15 },
        { header: 'Estado', key: 'status', width: 15 },
        { header: 'Plan', key: 'plan', width: 15 },
        { header: 'Días Restantes', key: 'dias', width: 15 },
        { header: 'Fecha Vencimiento', key: 'vencimiento', width: 20 },
        { header: 'Fecha Inicio', key: 'fechaIni', width: 20 },
        { header: 'Tipo Entrega', key: 'tipoEntrega', width: 15 },
        { header: 'Requiere Cocas', key: 'cocas', width: 15 },
        { header: 'Dir Principal', key: 'dir1', width: 30 },
        { header: 'Barrio Principal', key: 'barrio1', width: 20 },
        { header: 'Días Principal', key: 'dias1', width: 25 },
        { header: 'Dir Secundaria', key: 'dir2', width: 30 },
        { header: 'Barrio Secundario', key: 'barrio2', width: 20 },
        { header: 'Días Secundaria', key: 'dias2', width: 25 },
        { header: 'Alergias', key: 'alergias', width: 30 },
        { header: 'Restricciones', key: 'restricciones', width: 30 }
      ];

      clients.forEach(c => {
        const addr = extractAddressInfo(c);
        worksheet.addRow({
          nombre: c.nombre,
          cedula: c.cedula,
          correo: c.correo,
          telefono: c.telefono,
          status: (c.status || '').toUpperCase(),
          plan: (c.plan || '').toUpperCase(),
          dias: c.diasRestantes > 0 ? c.diasRestantes : 'Vencido',
          vencimiento: formatDate(c.fechaVencimiento),
          fechaIni: formatDate(addr.fechaIni),
          tipoEntrega: addr.tipoEntrega,
          cocas: addr.cocas,
          dir1: addr.dir1,
          barrio1: addr.barrio1,
          dias1: addr.dias1,
          dir2: addr.dir2,
          barrio2: addr.barrio2,
          dias2: addr.dias2,
          alergias: c.alergias || 'Ninguna',
          restricciones: c.restricciones || 'Ninguna'
        });
      });
      styleHeader(worksheet, 'FF2563EB'); // Azul
      fileName = `Reporte_Completo_Clientes_${today}.xlsx`;

    } else if (type === 'produccion') {
      const activeClients = clients.filter(c => c.status === 'activo');
      worksheet = workbook.addWorksheet('Resumen Producción');
      worksheet.columns = [
        { header: 'Categoría', key: 'categoria', width: 45 }, 
        { header: 'Cantidad', key: 'cantidad', width: 20 }
      ];

      const resumen = { semanal: 0, quincenal: 0, mensual: 0, cocasVidrio: 0 };
      
      activeClients.forEach(c => { 
        const p = (c.plan || '').toLowerCase();
        if (p.includes('semanal')) resumen.semanal++;
        else if (p.includes('quincenal')) resumen.quincenal++;
        else if (p.includes('mensual')) resumen.mensual++;
        
        const addr = extractAddressInfo(c);
        if (addr.cocas === 'Sí') {
          resumen.cocasVidrio++;
        }
      });

      worksheet.addRow({ categoria: 'TOTAL COMIDAS A PREPARAR HOY (Clientes Activos)', cantidad: activeClients.length });
      worksheet.addRow({ categoria: 'Cocas de Vidrio Necesarias (Para despachar)', cantidad: resumen.cocasVidrio });
      worksheet.addRow({ categoria: '', cantidad: '' }); // Espacio en blanco
      worksheet.addRow({ categoria: 'Detalle por Plan: SEMANAL', cantidad: resumen.semanal });
      worksheet.addRow({ categoria: 'Detalle por Plan: QUINCENAL', cantidad: resumen.quincenal });
      worksheet.addRow({ categoria: 'Detalle por Plan: MENSUAL', cantidad: resumen.mensual });
      
      styleHeader(worksheet, 'FF9333EA'); // Morado
      fileName = `Resumen_Produccion_${today}.xlsx`;

    } else if (type === 'pagos') {
      worksheet = workbook.addWorksheet('Pagos');
      worksheet.columns = [
        { header: 'Nombre Cliente', key: 'nombre', width: 30 },
        { header: 'Cédula', key: 'cedula', width: 15 },
        { header: 'Teléfono', key: 'telefono', width: 15 },
        { header: 'Plan', key: 'plan', width: 15 },
        { header: 'Monto', key: 'monto', width: 15 },
        { header: 'Estado', key: 'status', width: 15 },
        { header: 'Fecha', key: 'fecha', width: 20 },
        { header: 'Motivo Rechazo', key: 'motivo', width: 30 }
      ];

      payments.forEach(p => {
        worksheet.addRow({
          nombre: p.clienteNombre,
          cedula: p.clienteCedula,
          telefono: p.clienteCelular,
          plan: (p.plan || '').toUpperCase(),
          monto: p.monto,
          status: (p.status || '').toUpperCase(),
          fecha: formatDate(p.fecha) || p.fecha,
          motivo: p.motivo_rechazo || 'N/A'
        });
      });
      styleHeader(worksheet, 'FF16A34A'); // Verde
      fileName = `Reporte_Pagos_${today}.xlsx`;
    }

    if (worksheet) {
      applyBorders(worksheet);
    }

    showToast(`Generando reporte...`);
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, fileName);
    showToast(`Reporte descargado con éxito.`);

  } catch (error) {
    console.error('Error exportando Excel:', error);
    showToast('Error al generar Excel', 'error');
  }
}
