/**
 * seed.js — Inyección de 100 clientes de prueba con datos colombianos realistas.
 * Crea clientes, suscripciones, direcciones y comprobantes variados.
 * Uso: node seed.js
 */
const { sequelize } = require('./config/database');
const Cliente = require('./models/Cliente');
const Suscripcion = require('./models/Suscripcion');
const DireccionEntrega = require('./models/DireccionEntrega');
const Comprobante = require('./models/Comprobante');
const Plan = require('./models/Plan');

// ── Datos base colombianos ──────────────────────────────────────────────────
const nombres = [
  'Santiago Gómez','María Fernanda López','Andrés Felipe Martínez','Valentina Rodríguez',
  'Sebastián Torres','Camila Herrera','Juan David Vargas','Laura Milena Castillo',
  'Daniel Alejandro Ruiz','Isabella Moreno','Mateo García','Sofía Jiménez',
  'Samuel Díaz','Luciana Peña','Nicolás Ramírez','Gabriela Sánchez',
  'Diego Armando Flores','Valeria Mendoza','Alejandro Cruz','Natalia Suárez',
  'Emilio Restrepo','Carolina Medina','Felipe Ortega','Andrea Ríos',
  'David Cortés','Paulina Aguilar','Tomás Pardo','Mariana Guzmán',
  'Sergio Molina','Tatiana Castro','Javier Bermúdez','Adriana Silva',
  'Christian Rojas','Stefanía Ibáñez','Óscar Pineda','Diana Carrillo',
  'Ricardo León','Claudia Muñoz','Fabián Salazar','Estefanía Valencia',
  'Germán Castaño','Mónica Ocampo','Wilson Giraldo','Paola Acosta',
  'Gustavo Bernal','Ximena Patiño','Hernán Zúñiga','Sandra Meza',
  'Carlos Alberto Nieto','Alejandra Cárdenas','Edwin Tovar','Liliana Espinosa',
  'Jhon Alexander Roa','Gloria Velásquez','Mauricio Arango','Patricia Quintero',
  'Héctor Vásquez','Lina Marcela Urrego','Rafael Echeverri','Marcela Ospina',
  'Giovanny Londoño','Adriana Moncada','Álvaro Hurtado','Nataly Arbeláez',
  'Rodrigo Chaparro','Manuela Betancur','Luis Miguel Cano','Yessica Vergara',
  'Esteban Lozano','Catalina Bedoya','Julián Esteban Holguín','Karen Sofía Arias',
  'Ángel Estrada','Lorena Montoya','Brian Palomino','Yolanda Trujillo',
  'Kevin Andrés Sierra','Angie Lorena Tobón','Pipe Alvarado','Jennifer Caballero',
  'Stiven Zapata','Yudy Carrasco','Jhoan Toro','Leidy Marcela Mora',
  'Emanuel Arenas','Claudia Patricia Ávila','Yeison Macías','Marisol Sandoval',
  'Nicolás Gutiérrez','Tatiana Garzón','Álvaro Henao','Pilar Naranjo',
  'Jhon Jairo Sepúlveda','Luz Marina Cárdenas','Ferney Duque','Amparo Villegas',
  'Gustavo Adolfo Marín','Olga Lucía Calle'
];

const barrios = [
  'Laureles','El Poblado','Envigado','Belén','Sabaneta','Itagüí','Bello',
  'Aranjuez','Castilla','San Antonio de Prado','Robledo','La América',
  'Buenos Aires','Guayabal','Manrique','Popular','Doce de Octubre',
  'Altavista','San Javier','La Candelaria'
];

const diasOpciones = [
  'Lunes,Martes,Miércoles,Jueves,Viernes',
  'Lunes,Miércoles,Viernes',
  'Martes,Jueves',
  'Lunes,Martes,Miércoles,Jueves,Viernes,Sábado',
];

const alergias = ['Ninguna','Ninguna','Ninguna','Lactosa','Maní','Mariscos','Gluten','Huevo','Fructosa'];
const restricciones = ['Ninguna','Ninguna','Ninguna','Vegetariano','Sin gluten','Vegano','Sin lácteos','Sin mariscos'];
const zonas = ['norte','sur','oriente','occidente','por-asignar'];
const estadosSub = ['Activo','Activo','Activo','Pendiente','Pendiente','Cancelado'];
const estadosComp = ['Aprobado','Aprobado','Pendiente','Rechazado'];
const motivosRechazo = ['Comprobante ilegible','Monto incorrecto','Banco no coincide','Comprobante duplicado'];

const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

function fechaISO(diasAtras) {
  const d = new Date();
  d.setDate(d.getDate() - diasAtras);
  return d.toISOString().split('T')[0];
}

// ── Ejecución ───────────────────────────────────────────────────────────────
async function seed() {
  try {
    await sequelize.authenticate();
    console.log('✅ DB conectada. Iniciando seed...\n');

    const planes = await Plan.findAll({ raw: true });
    if (!planes.length) throw new Error('No hay planes en la BD. Ejecuta el schema primero.');

    let creados = 0, fallidos = 0;
    const errores = [];

    for (let i = 0; i < 100; i++) {
      const nombre = nombres[i % nombres.length];
      const cedula = String(10000000 + i * 97 + randInt(1, 50));
      const celular = `3${String(randInt(0,9))}${String(randInt(1000000,9999999))}`;
      const correo = `test.cliente${i + 1}@prueba.co`;
      const plan = rand(planes);
      const estadoSub = rand(estadosSub);
      const diasAtras = randInt(1, 120);
      const fechaInicio = fechaISO(diasAtras);
      const barrio = rand(barrios);

      try {
        // 1. Cliente
        const cliente = await Cliente.create({
          cedula,
          nombre,
          correo,
          celular,
          esta_activo: estadoSub === 'Activo',
        });

        // 2. Suscripción
        const sub = await Suscripcion.create({
          cliente_cedula: cedula,
          plan_id: plan.id,
          necesita_cocas: Math.random() > 0.6,
          tipo_entrega: Math.random() > 0.3 ? 'Fija' : 'Hibrida',
          precio_total: parseFloat(plan.precio_base),
          estado: estadoSub,
          alergias: rand(alergias),
          restricciones: rand(restricciones),
          fecha_inicio: fechaInicio,
        });

        // 3. Dirección
        await DireccionEntrega.create({
          suscripcion_id: sub.id,
          direccion: `Calle ${randInt(1, 120)} #${randInt(1, 80)}-${randInt(1, 99)}`,
          barrio,
          dias_entrega: rand(diasOpciones),
          es_principal: true,
          zona: rand(zonas),
          latitud: 6.2 + Math.random() * 0.3,
          longitud: -75.6 - Math.random() * 0.2,
        });

        // 4. Comprobante (siempre uno; si cancelado puede ser rechazado)
        const estadoComp = estadoSub === 'Cancelado' ? rand(['Rechazado', 'Pendiente']) : rand(estadosComp);
        const compData = {
          suscripcion_id: sub.id,
          url_imagen: `https://picsum.photos/seed/${cedula}/400/600`,
          estado: estadoComp,
          observaciones: estadoComp === 'Aprobado' ? 'Verificado correctamente' : null,
        };
        if (estadoComp === 'Rechazado') compData.motivo_rechazo = rand(motivosRechazo);
        await Comprobante.create(compData);

        creados++;
        process.stdout.write(`\r📦 Progreso: ${creados}/100 clientes creados...`);
      } catch (err) {
        fallidos++;
        errores.push({ i, cedula, error: err.message });
      }
    }

    console.log(`\n\n✅ Seed completado:`);
    console.log(`   → ${creados} clientes creados exitosamente`);
    console.log(`   → ${fallidos} fallos`);

    if (errores.length) {
      console.log('\n⚠️  Errores encontrados:');
      errores.forEach(e => console.log(`   #${e.i} (${e.cedula}): ${e.error}`));
    }

    // ── Resumen de distribución ─────────────────────────────────────────────
    console.log('\n📊 Verificando distribución en BD...');
    const [rows] = await sequelize.query(`
      SELECT 
        p.nombre AS plan,
        s.estado AS estado_sub,
        COUNT(*) AS cantidad
      FROM suscripciones s
      JOIN planes p ON s.plan_id = p.id
      GROUP BY p.nombre, s.estado
      ORDER BY p.nombre, s.estado;
    `);
    console.table(rows);

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error fatal:', error.message);
    process.exit(1);
  }
}

seed();
