const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const crypto = require('crypto');
const { sequelize } = require('../config/database');
const Cliente = require('../models/Cliente');
const Suscripcion = require('../models/Suscripcion');
const DireccionEntrega = require('../models/DireccionEntrega');
const Plan = require('../models/Plan');

const baseDir = path.join(__dirname, '../../base_de_datos');

async function getCsvFiles() {
    if (!fs.existsSync(baseDir)) return [];
    const files = fs.readdirSync(baseDir);
    return files.filter(f => f.endsWith('.csv'));
}

exports.runImport = async (req, res) => {
    try {
        const files = await getCsvFiles();
        if (files.length === 0) {
            return res.json({ success: true, message: "No se encontraron archivos CSV en el directorio base_de_datos." });
        }
        
        // Find or create a default plan for missing ones
        let defaultPlan = await Plan.findOne();
        if (!defaultPlan) {
            defaultPlan = await Plan.create({
                nombre: 'Default Import',
                precio_base: 0,
                dias_duracion: 1,
                esta_activo: false
            });
        }

        let totales = 0;
        let insertados = 0;
        let duplicados = 0;
        let errores = 0;

        for (const file of files) {
            const results = [];
            
            await new Promise((resolve, reject) => {
                fs.createReadStream(path.join(baseDir, file))
                    .pipe(csv({ skipLines: 1 }))
                    .on('data', (data) => results.push(data))
                    .on('end', () => resolve())
                    .on('error', (error) => reject(error));
            });

            for (const row of results) {
                const keys = Object.keys(row);
                const getVal = (search) => {
                    const key = keys.find(k => k.toLowerCase().includes(search.toLowerCase()));
                    return key ? row[key]?.trim() : null;
                };

                const nombre = getVal('nombre');
                let telefono = getVal('telefono');
                const direccion = getVal('direcci');
                const observaciones = getVal('observaciones');

                if (!nombre) continue; // Skip empty rows
                
                totales++;

                try {
                    const existing = await Cliente.findOne({
                        where: { 
                            nombre: sequelize.where(sequelize.fn('LOWER', sequelize.col('nombre')), nombre.toLowerCase())
                        }
                    });

                    if (existing) {
                        duplicados++;
                        continue;
                    }

                    if (telefono) {
                        telefono = telefono.replace(/[^0-9+]/g, '');
                    }
                    
                    const uniqueId = crypto.randomBytes(4).toString('hex');
                    const finalTelefono = telefono || `0000000000-${uniqueId}`;
                    const cedula = `CSV-${uniqueId}`;
                    const correo = `no-email-${uniqueId}@lacocadejacks.com`;

                    const cliente = await Cliente.create({
                        cedula,
                        nombre,
                        correo,
                        celular: finalTelefono,
                        esta_activo: true
                    });

                    if (direccion) {
                        const suscripcion = await Suscripcion.create({
                            cliente_cedula: cedula,
                            plan_id: defaultPlan.id,
                            precio_total: 0,
                            estado: 'Pendiente',
                            restricciones: observaciones || ''
                        });

                        await DireccionEntrega.create({
                            suscripcion_id: suscripcion.id,
                            direccion: direccion,
                            barrio: file.replace('.csv', ''),
                            dias_entrega: 'Lunes,Martes,Miércoles,Jueves,Viernes',
                            es_principal: true,
                            zona: ''
                        });
                    }

                    insertados++;

                } catch (err) {
                    errores++;
                }
            }
        }

        return res.json({
            success: true,
            resumen: {
                archivos: files.length,
                leidos: totales,
                insertados,
                duplicados,
                errores
            }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
