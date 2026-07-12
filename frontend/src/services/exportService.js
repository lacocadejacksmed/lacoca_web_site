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

export async function exportExcel(configOrType, clients = [], payments = [], plans = []) {
  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'La Coca De Jacks';
    workbook.created = new Date();

    const today = new Date().toISOString().split('T')[0];
    
    // Si es un string ('produccion' o 'cocina_logistica'), usamos la lógica estática
    if (typeof configOrType === 'string') {
      
      if (configOrType === 'produccion') {
        const activeClients = clients.filter(c => c.status === 'activo');
        const wsResumen = workbook.addWorksheet('Resumen Producción');
        wsResumen.columns = [{ header: 'Plan', key: 'plan', width: 25 }, { header: 'Cantidad', key: 'cantidad', width: 25 }];

        const resumen = { semanal: 0, quincenal: 0, mensual: 0 };
        activeClients.forEach(c => { 
          const p = c.plan.toLowerCase();
          if(resumen[p] !== undefined) resumen[p]++; 
        });

        wsResumen.addRow({ plan: 'SEMANAL', cantidad: resumen.semanal });
        wsResumen.addRow({ plan: 'QUINCENAL', cantidad: resumen.quincenal });
        wsResumen.addRow({ plan: 'MENSUAL', cantidad: resumen.mensual });
        wsResumen.addRow({ plan: 'TOTAL HOY', cantidad: activeClients.length });
        
        styleHeader(wsResumen, 'FF9333EA');
        applyBorders(wsResumen);

        showToast(`Generando resumen de producción...`);
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, `Resumen_Produccion_${today}.xlsx`);
        showToast(`Reporte generado con éxito.`);
        return;
      }

      if (configOrType === 'cocina_logistica') {
        const activeClients = clients.filter(c => c.status === 'activo');
        const wsLogistica = workbook.addWorksheet('Logística y Cocina');
        
        wsLogistica.columns = [
          { header: 'Cliente', key: 'nombre', width: 25 },
          { header: 'Teléfono', key: 'telefono', width: 15 },
          { header: 'Plan', key: 'plan', width: 15 },
          { header: 'Modalidad Entrega', key: 'tipoEntrega', width: 20 },
          { header: 'Dir. Principal', key: 'dir1', width: 35 },
          { header: 'Barrio Principal', key: 'barrio1', width: 20 },
          { header: 'Días Principal', key: 'dias1', width: 25 },
          { header: 'Dir. Secundaria', key: 'dir2', width: 35 },
          { header: 'Barrio Secundario', key: 'barrio2', width: 20 },
          { header: 'Días Secundaria', key: 'dias2', width: 25 },
          { header: 'Alergias', key: 'alergias', width: 25 },
          { header: 'Restricciones', key: 'restricciones', width: 25 }
        ];

        activeClients.forEach(c => {
          let dir1 = '', barrio1 = '', dias1 = '', dir2 = '', barrio2 = '', dias2 = '', tipoEntrega = 'Fija';
          
          if (c.raw && (c.raw.Suscripcions || c.raw.Suscripciones)) {
            const subs = c.raw.Suscripcions || c.raw.Suscripciones;
            const activeSub = subs.sort((a,b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion))[0];
            if (activeSub) {
              tipoEntrega = activeSub.modalidad_entrega || 'Fija';
              const direcciones = activeSub.direcciones || [];
              const d1 = direcciones.find(d => d.es_principal) || direcciones[0];
              const d2 = direcciones.find(d => !d.es_principal && d.id !== d1?.id) || (direcciones.length > 1 ? direcciones[1] : null);
              
              if (d1) {
                dir1 = d1.direccion;
                barrio1 = d1.barrio;
                dias1 = d1.dias_entrega || 'Todos los días';
              }
              if (d2 && tipoEntrega.toLowerCase() === 'hibrida') {
                dir2 = d2.direccion;
                barrio2 = d2.barrio;
                dias2 = d2.dias_entrega || '';
              }
            }
          } else {
            // Fallback to client main fields
            dir1 = c.direccion;
            barrio1 = c.barrio;
            dias1 = 'Todos los días';
          }

          wsLogistica.addRow({
            nombre: c.nombre,
            telefono: c.telefono,
            plan: (c.plan || '').toUpperCase(),
            tipoEntrega: tipoEntrega,
            dir1: dir1,
            barrio1: barrio1,
            dias1: dias1,
            dir2: dir2,
            barrio2: barrio2,
            dias2: dias2,
            alergias: c.alergias || 'Ninguna',
            restricciones: c.restricciones || 'Ninguna'
          });
        });

        styleHeader(wsLogistica, 'FFEA580C'); // Naranja
        applyBorders(wsLogistica);

        showToast(`Generando reporte logístico...`);
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(blob, `Reporte_Cocina_Logistica_${today}.xlsx`);
        showToast(`Reporte generado con éxito.`);
        return;
      }
    }

    // Lógica dinámica del Modal
    const config = configOrType;
    let fileName = `Reporte_${config.entity}_${today}.xlsx`;
    let data = [];
    let sheetName = config.entity;
    let headerColor = 'FF2563EB'; // Azul por defecto

    if (config.entity === 'clientes') {
      if (config.group === 'todos') {
        data = clients;
        sheetName = 'Todos los Clientes';
      } else if (config.group === 'activos') {
        data = clients.filter(c => c.status === 'activo');
        sheetName = 'Clientes Activos';
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
    } else if (config.entity === 'pagos') {
      if (config.group === 'todos') {
        data = payments;
        sheetName = 'Todos los Pagos';
      } else if (config.group === 'aprobado') {
        data = payments.filter(p => p.status === 'aprobado');
        sheetName = 'Pagos Aprobados';
        headerColor = 'FF16A34A';
      } else if (config.group === 'pendiente') {
        data = payments.filter(p => p.status === 'pendiente');
        sheetName = 'Pagos Pendientes';
        headerColor = 'FFEAB308'; // Amarillo
      } else if (config.group === 'rechazado') {
        data = payments.filter(p => p.status === 'rechazado');
        sheetName = 'Pagos Rechazados';
        headerColor = 'FFDC2626';
      }
    } else if (config.entity === 'planes') {
      if (config.group === 'todos') {
        data = plans;
        sheetName = 'Todos los Planes';
      } else if (config.group === 'activos') {
        data = plans.filter(p => p.esta_activo);
        sheetName = 'Planes Activos';
        headerColor = 'FF16A34A';
      } else if (config.group === 'inactivos') {
        data = plans.filter(p => !p.esta_activo);
        sheetName = 'Planes Inactivos';
        headerColor = 'FFDC2626';
      }
    }

    const worksheet = workbook.addWorksheet(sheetName.substring(0, 31)); // Max 31 chars para nombre de hoja Excel

    // Mapeo unificado de todas las columnas posibles
    const COLUMNS_DEF = {
      // Clientes
      nombre: { header: 'Nombre', key: 'nombre', width: 25 },
      cedula: { header: 'Cédula', key: 'cedula', width: 15 },
      telefono: { header: 'Teléfono', key: 'telefono', width: 15 },
      correo: { header: 'Correo', key: 'correo', width: 25 },
      status: { header: 'Estado', key: 'status', width: 12 },
      plan: { header: 'Plan', key: 'plan', width: 15 },
      diasRestantes: { header: 'Días Rest.', key: 'dias', width: 10 },
      fechaVencimiento: { header: 'Vencimiento', key: 'vencimiento', width: 15 },
      direccion: { header: 'Dir. Principal', key: 'direccion', width: 30 },
      barrio: { header: 'Barrio Principal', key: 'barrio', width: 20 },
      dias_dir1: { header: 'Días Principal', key: 'dias_dir1', width: 25 },
      direccion2: { header: 'Dir. Secundaria', key: 'direccion2', width: 30 },
      barrio2: { header: 'Barrio Secundario', key: 'barrio2', width: 20 },
      dias_dir2: { header: 'Días Secundaria', key: 'dias_dir2', width: 25 },
      facturacion: { header: 'Fact. Electrónica', key: 'facturacion', width: 15 },
      alergias: { header: 'Alergias', key: 'alergias', width: 25 },
      restricciones: { header: 'Restricciones', key: 'restricciones', width: 25 },
      // Pagos
      clienteNombre: { header: 'Nombre Cliente', key: 'clienteNombre', width: 25 },
      clienteCedula: { header: 'Cédula', key: 'clienteCedula', width: 15 },
      clienteEmail: { header: 'Correo', key: 'clienteEmail', width: 25 },
      clienteCelular: { header: 'Teléfono', key: 'clienteCelular', width: 15 },
      monto: { header: 'Monto', key: 'monto', width: 15 },
      fecha: { header: 'Fecha', key: 'fecha', width: 15 },
      motivo_rechazo: { header: 'Motivo Rechazo', key: 'motivo_rechazo', width: 30 },
      tipoEntrega: { header: 'Tipo Entrega', key: 'tipoEntrega', width: 15 },
      // Planes
      precio_base: { header: 'Precio Base', key: 'precio_base', width: 15 },
      dias_duracion: { header: 'Días Duración', key: 'dias_duracion', width: 15 },
      esta_activo: { header: 'Activo', key: 'esta_activo', width: 10 }
    };

    // Agregar solo las columnas seleccionadas en el config
    worksheet.columns = config.columns.map(colId => COLUMNS_DEF[colId]).filter(Boolean);

    // Llenar datos
    data.forEach(item => {
      const rowData = {};
      config.columns.forEach(colId => {
        // Logica para leer correctamente de cualquier objeto (Cliente, Pago, Plan)
        switch (colId) {
          // Clientes & Planes
          case 'nombre': rowData.nombre = item.nombre; break;
          // Clientes
          case 'cedula': rowData.cedula = item.cedula; break;
          case 'telefono': rowData.telefono = item.telefono; break;
          case 'correo': rowData.correo = item.correo; break;
          case 'diasRestantes': rowData.dias = item.diasRestantes > 0 ? item.diasRestantes : 'Vencido'; break;
          case 'fechaVencimiento': rowData.vencimiento = formatDate(item.fechaVencimiento); break;
          case 'direccion': 
          case 'barrio': 
          case 'dias_dir1':
          case 'direccion2':
          case 'barrio2':
          case 'dias_dir2': {
            let d1 = null, d2 = null, tipo = 'Fija';
            if (item.raw && item.raw.Suscripcions) {
              const activeSub = item.raw.Suscripcions.sort((a,b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion))[0];
              if (activeSub) {
                tipo = activeSub.modalidad_entrega || 'Fija';
                const direcciones = activeSub.direcciones || [];
                d1 = direcciones.find(d => d.es_principal) || direcciones[0];
                d2 = direcciones.find(d => !d.es_principal && d.id !== d1?.id) || (direcciones.length > 1 ? direcciones[1] : null);
              }
            }
            if (colId === 'direccion') rowData.direccion = d1 ? d1.direccion : item.direccion;
            if (colId === 'barrio') rowData.barrio = d1 ? d1.barrio : item.barrio;
            if (colId === 'dias_dir1') rowData.dias_dir1 = d1 ? (d1.dias_entrega || 'Todos los días') : 'Todos los días';
            if (colId === 'direccion2') rowData.direccion2 = (d2 && tipo.toLowerCase() === 'hibrida') ? d2.direccion : '';
            if (colId === 'barrio2') rowData.barrio2 = (d2 && tipo.toLowerCase() === 'hibrida') ? d2.barrio : '';
            if (colId === 'dias_dir2') rowData.dias_dir2 = (d2 && tipo.toLowerCase() === 'hibrida') ? d2.dias_entrega : '';
            break;
          }
          case 'facturacion': rowData.facturacion = item.facturacionElectronica || item.facturacion; break;
          case 'alergias': rowData.alergias = item.alergias || 'Ninguna'; break;
          case 'restricciones': rowData.restricciones = item.restricciones || 'Ninguna'; break;
          // Pagos
          case 'clienteNombre': rowData.clienteNombre = item.clienteNombre; break;
          case 'clienteCedula': rowData.clienteCedula = item.clienteCedula; break;
          case 'clienteEmail': rowData.clienteEmail = item.clienteEmail; break;
          case 'clienteCelular': rowData.clienteCelular = item.clienteCelular; break;
          case 'monto': rowData.monto = item.monto; break;
          case 'fecha': rowData.fecha = formatDate(item.fecha) || item.fecha; break;
          case 'motivo_rechazo': rowData.motivo_rechazo = item.motivo_rechazo || 'N/A'; break;
          case 'tipoEntrega': rowData.tipoEntrega = item.tipoEntrega; break;
          // Planes
          case 'precio_base': rowData.precio_base = item.precio_base; break;
          case 'dias_duracion': rowData.dias_duracion = item.dias_duracion; break;
          case 'esta_activo': rowData.esta_activo = item.esta_activo ? 'Si' : 'No'; break;
          // Compartidos (Clientes / Pagos / Planes)
          case 'status': rowData.status = (item.status || '').toUpperCase(); break;
          case 'plan': rowData.plan = (item.plan || '').toUpperCase(); break;
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
