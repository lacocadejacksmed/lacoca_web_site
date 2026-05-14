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

export async function exportExcel(type, clients, payments) {
  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'La Coca De Jacks';
    workbook.created = new Date();

    const today = new Date().toISOString().split('T')[0];
    let fileName = `Reporte_${type}_${today}.xlsx`;

    const styleHeader = (worksheet, color = 'FF16A34A') => {
      const headerRow = worksheet.getRow(1);
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
      });
      headerRow.height = 25;
    };

    const applyBorders = (worksheet) => {
      worksheet.eachRow((row, rowNumber) => {
        row.eachCell((cell) => {
          cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
          if (rowNumber > 1) cell.alignment = { vertical: 'middle' };
        });
      });
    };

    if (['todos', 'activos', 'vencer'].includes(type)) {
      let data = clients;
      let sheetName = 'Clientes';
      let headerColor = 'FF2563EB';

      if (type === 'activos') {
        data = clients.filter(c => c.status === 'activo');
        sheetName = 'Activos';
        headerColor = 'FF16A34A';
      } else if (type === 'vencer') {
        data = clients.filter(c => c.status === 'activo' && c.diasRestantes <= 5);
        sheetName = 'Por Vencer';
        headerColor = 'FFEA580C';
      }

      const worksheet = workbook.addWorksheet(sheetName);
      worksheet.columns = [
        { header: 'Nombre', key: 'nombre', width: 25 },
        { header: 'Cédula', key: 'cedula', width: 15 },
        { header: 'Teléfono', key: 'telefono', width: 15 },
        { header: 'Correo', key: 'correo', width: 25 },
        { header: 'Estado', key: 'status', width: 12 },
        { header: 'Plan', key: 'plan', width: 15 },
        { header: 'Días Rest.', key: 'dias', width: 10 },
        { header: 'Vencimiento', key: 'vencimiento', width: 15 },
        { header: 'Dirección', key: 'direccion', width: 30 },
        { header: 'Barrio', key: 'barrio', width: 20 },
        { header: 'Fact. Electrónica', key: 'facturacion', width: 15 },
        { header: 'Alergias/Restr.', key: 'restricciones', width: 30 }
      ];

      data.forEach(c => {
        worksheet.addRow({
          nombre: c.nombre,
          cedula: c.cedula,
          telefono: c.telefono,
          correo: c.correo,
          status: (c.status || '').toUpperCase(),
          plan: (c.plan || '').toUpperCase(),
          dias: c.diasRestantes > 0 ? c.diasRestantes : 'Vencido',
          vencimiento: formatDate(c.fechaVencimiento),
          direccion: c.direccion,
          barrio: c.barrio,
          facturacion: c.facturacionElectronica,
          restricciones: [c.alergias ? `ALERGIA: ${c.alergias}` : '', c.restricciones ? `RESTRICCION: ${c.restricciones}` : ''].filter(Boolean).join(' | ')
        });
      });

      styleHeader(worksheet, headerColor);
      applyBorders(worksheet);
    }

    else if (type === 'cocina') {
      const activeClients = clients.filter(c => c.status === 'activo');
      const worksheet = workbook.addWorksheet('Planilla Cocina');
      worksheet.columns = [
        { header: 'Cliente', key: 'nombre', width: 25 },
        { header: 'Plan', key: 'plan', width: 12 },
        { header: 'Alergias', key: 'alergias', width: 25 },
        { header: 'Restricciones', key: 'restricciones', width: 25 },
        { header: 'Notas Especiales', key: 'notas', width: 30 }
      ];

      activeClients.forEach(c => {
        worksheet.addRow({
          nombre: c.nombre,
          plan: (c.plan || '').toUpperCase(),
          alergias: c.alergias || 'Ninguna',
          restricciones: c.restricciones || 'Ninguna',
          notas: (c.alergias || c.restricciones) ? '¡ATENCIÓN!' : '-'
        });
      });

      styleHeader(worksheet, 'FFDC2626');
      applyBorders(worksheet);
    }

    else if (type === 'produccion') {
      const activeClients = clients.filter(c => c.status === 'activo');
      const wsResumen = workbook.addWorksheet('Resumen Producción');
      wsResumen.columns = [{ header: 'Plan', key: 'plan', width: 25 }, { header: 'Cantidad', key: 'cantidad', width: 25 }];

      const resumen = { semanal: 0, quincenal: 0, mensual: 0 };
      activeClients.forEach(c => { if(resumen[c.plan] !== undefined) resumen[c.plan]++; });

      wsResumen.addRow({ plan: 'SEMANAL', cantidad: resumen.semanal });
      wsResumen.addRow({ plan: 'QUINCENAL', cantidad: resumen.quincenal });
      wsResumen.addRow({ plan: 'MENSUAL', cantidad: resumen.mensual });
      wsResumen.addRow({ plan: 'TOTAL HOY', cantidad: activeClients.length });
      
      styleHeader(wsResumen, 'FF9333EA');
      applyBorders(wsResumen);
    }

    showToast(`Generando reporte de ${type}...`);
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, fileName);
    showToast(`Reporte ${fileName} descargado con éxito.`);

  } catch (error) {
    console.error('Error exportando Excel:', error);
    showToast('Error al generar Excel', 'error');
  }
}
