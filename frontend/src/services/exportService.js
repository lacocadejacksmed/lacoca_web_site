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

export async function exportExcel(configOrType, clients, payments) {
  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'La Coca De Jacks';
    workbook.created = new Date();

    const today = new Date().toISOString().split('T')[0];
    
    // Si es un string ('produccion'), usamos la lógica estática
    if (typeof configOrType === 'string') {
      if (configOrType === 'produccion') {
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

        showToast(`Generando reporte de producción...`);
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, `Reporte_Produccion_${today}.xlsx`);
        showToast(`Reporte generado con éxito.`);
        return;
      }
    }

    // Lógica dinámica para el Modal
    const config = configOrType;
    let fileName = `Reporte_Clientes_${today}.xlsx`;
    let data = clients;
    let sheetName = 'Clientes';
    let headerColor = 'FF2563EB'; // Azul por defecto

    // Filtrar por grupo
    if (config.group === 'activos') {
      data = clients.filter(c => c.status === 'activo');
      sheetName = 'Activos';
      headerColor = 'FF16A34A'; // Verde
    } else if (config.group === 'vencer') {
      data = clients.filter(c => c.status === 'activo' && c.diasRestantes <= 5);
      sheetName = 'Por Vencer';
      headerColor = 'FFEA580C'; // Naranja
    } else if (config.group === 'inactivos') {
      data = clients.filter(c => c.status === 'inactivo' || c.status === 'vencido');
      sheetName = 'Inactivos';
      headerColor = 'FFDC2626'; // Rojo
    }

    const worksheet = workbook.addWorksheet(sheetName);

    // Mapeo de todas las columnas posibles
    const COLUMNS_DEF = {
      nombre: { header: 'Nombre', key: 'nombre', width: 25 },
      cedula: { header: 'Cédula', key: 'cedula', width: 15 },
      telefono: { header: 'Teléfono', key: 'telefono', width: 15 },
      correo: { header: 'Correo', key: 'correo', width: 25 },
      status: { header: 'Estado', key: 'status', width: 12 },
      plan: { header: 'Plan', key: 'plan', width: 15 },
      diasRestantes: { header: 'Días Rest.', key: 'dias', width: 10 },
      fechaVencimiento: { header: 'Vencimiento', key: 'vencimiento', width: 15 },
      direccion: { header: 'Dirección', key: 'direccion', width: 30 },
      barrio: { header: 'Barrio', key: 'barrio', width: 20 },
      facturacion: { header: 'Fact. Electrónica', key: 'facturacion', width: 15 },
      alergias: { header: 'Alergias', key: 'alergias', width: 25 },
      restricciones: { header: 'Restricciones', key: 'restricciones', width: 25 }
    };

    // Agregar solo las columnas seleccionadas en el config
    worksheet.columns = config.columns.map(colId => COLUMNS_DEF[colId]).filter(Boolean);

    // Llenar datos
    data.forEach(c => {
      const rowData = {};
      config.columns.forEach(colId => {
        switch (colId) {
          case 'nombre': rowData.nombre = c.nombre; break;
          case 'cedula': rowData.cedula = c.cedula; break;
          case 'telefono': rowData.telefono = c.telefono; break;
          case 'correo': rowData.correo = c.correo; break;
          case 'status': rowData.status = (c.status || '').toUpperCase(); break;
          case 'plan': rowData.plan = (c.plan || '').toUpperCase(); break;
          case 'diasRestantes': rowData.dias = c.diasRestantes > 0 ? c.diasRestantes : 'Vencido'; break;
          case 'fechaVencimiento': rowData.vencimiento = formatDate(c.fechaVencimiento); break;
          case 'direccion': rowData.direccion = c.direccion; break;
          case 'barrio': rowData.barrio = c.barrio; break;
          case 'facturacion': rowData.facturacion = c.facturacionElectronica; break;
          case 'alergias': rowData.alergias = c.alergias || 'Ninguna'; break;
          case 'restricciones': rowData.restricciones = c.restricciones || 'Ninguna'; break;
        }
      });
      worksheet.addRow(rowData);
    });

    styleHeader(worksheet, headerColor);
    applyBorders(worksheet);

    showToast(`Generando reporte...`);
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, fileName);
    showToast(`Reporte ${fileName} descargado con éxito.`);

  } catch (error) {
    console.error('Error exportando Excel:', error);
    showToast('Error al generar Excel', 'error');
  }
}

