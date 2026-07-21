const ExcelJS = require('exceljs');
const Suscripcion = require('../models/Suscripcion');
const Cliente = require('../models/Cliente');
const Plan = require('../models/Plan');
const DireccionEntrega = require('../models/DireccionEntrega');

exports.exportarProduccion = async (req, res) => {
    try {
        // Fetch config for modo_hibrida
        const Configuracion = require('../models/Configuracion');
        const configHibrida = await Configuracion.findOne({ where: { clave: 'modo_hibrida' } });
        const modoHibrida = configHibrida ? configHibrida.valor === 'true' : true;

        // Traer suscripciones activas
        const suscripciones = await Suscripcion.findAll({
            where: { estado: 'Activo' },
            include: [
                { model: Cliente },
                { model: Plan },
                { model: DireccionEntrega, as: 'direcciones' }
            ]
        });

        // Agrupar por ruta/zona
        const rutas = {};
        
        suscripciones.forEach(sub => {
            const cliente = sub.Cliente;
            const plan = sub.Plan ? sub.Plan.nombre : 'N/A';
            const alergias = sub.alergias || '';
            const restricciones = sub.restricciones || '';
            const obs = [alergias, restricciones].filter(Boolean).join(' | ');

            sub.direcciones.forEach(dir => {
                // If hybrid mode is disabled, skip any secondary address
                if (!modoHibrida && !dir.es_principal) return;

                const zona = dir.zona || 'Sin Zona';
                if (!rutas[zona]) rutas[zona] = [];
                
                rutas[zona].push({
                    id: sub.id,
                    nombre: cliente ? `${cliente.nombre} ${cliente.apellido}`.trim() : 'Sin Nombre',
                    plan: plan,
                    dias: dir.dias_entrega || '',
                    cocas: sub.necesita_cocas ? 'SI' : '',
                    observaciones: obs,
                    direccion: `${dir.direccion} ${dir.barrio}`,
                    telefono: cliente ? cliente.telefono : ''
                });
            });
        });

        // Crear Workbook de Excel
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'La Coca de Jacks';
        workbook.created = new Date();

        // Iterar por cada zona y crear una hoja
        for (const [zona, clientes] of Object.entries(rutas)) {
            // Reemplazar caracteres inválidos para nombres de hoja
            const safeZona = zona.replace(/[\\\/\?\*\[\]]/g, '').substring(0, 31);
            const sheet = workbook.addWorksheet(safeZona);

            // Definir columnas
            sheet.columns = [
                { header: 'ID', key: 'id', width: 5 },
                { header: 'NOMBRE', key: 'nombre', width: 25 },
                { header: 'PLAN', key: 'plan', width: 15 },
                { header: 'L', key: 'l', width: 4 },
                { header: 'M', key: 'm', width: 4 },
                { header: 'MI', key: 'mi', width: 4 },
                { header: 'J', key: 'j', width: 4 },
                { header: 'V', key: 'v', width: 4 },
                { header: 'COCAS', key: 'cocas', width: 8 },
                { header: 'OBSERVACIONES', key: 'observaciones', width: 35 },
                { header: 'DIRECCIÓN', key: 'direccion', width: 35 },
                { header: 'TELÉFONO', key: 'telefono', width: 15 },
            ];

            // Estilos de cabecera
            sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
            sheet.getRow(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFF97316' } // Naranja corporativo tailwind
            };
            sheet.getRow(1).alignment = { horizontal: 'center' };

            // Agregar filas
            clientes.forEach((c) => {
                const diasArr = c.dias.split(',').map(d => d.trim().toLowerCase());
                
                const row = sheet.addRow({
                    id: c.id,
                    nombre: c.nombre.toUpperCase(),
                    plan: c.plan.toUpperCase(),
                    l: diasArr.includes('lunes') ? 'X' : '',
                    m: diasArr.includes('martes') ? 'X' : '',
                    mi: diasArr.includes('miercoles') || diasArr.includes('miércoles') ? 'X' : '',
                    j: diasArr.includes('jueves') ? 'X' : '',
                    v: diasArr.includes('viernes') ? 'X' : '',
                    cocas: c.cocas,
                    observaciones: c.observaciones.toUpperCase(),
                    direccion: c.direccion.toUpperCase(),
                    telefono: c.telefono
                });

                // Si tiene observaciones/restricciones, pintar la celda de rojo claro
                if (c.observaciones) {
                    row.getCell('observaciones').fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: 'FFFFCCCC' } // Rojo muy clarito
                    };
                    row.getCell('observaciones').font = { bold: true, color: { argb: 'FF990000' } };
                }
            });
            
            // Filtros automáticos
            sheet.autoFilter = {
                from: 'A1',
                to: 'L1'
            };
        }

        // Si no hay rutas activas, crear hoja vacía
        if (Object.keys(rutas).length === 0) {
            workbook.addWorksheet('Sin Datos');
        }

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="Rutas_Produccion.xlsx"');

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error("Error generando Excel de producción:", error);
        res.status(500).json({ success: false, message: 'Error generando el archivo Excel.' });
    }
};
