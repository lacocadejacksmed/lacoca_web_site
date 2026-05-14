const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Cliente = require('./Cliente');
const Plan = require('./Plan');

const Suscripcion = sequelize.define('Suscripcion', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    cliente_cedula: {
        type: DataTypes.STRING(20),
        allowNull: false,
        references: {
            model: Cliente,
            key: 'cedula'
        }
    },
    plan_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Plan,
            key: 'id'
        }
    },
    necesita_cocas: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    tipo_entrega: {
        type: DataTypes.ENUM('Fija', 'Hibrida'),
        allowNull: false,
        defaultValue: 'Fija'
    },
    facturacion_electronica: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    precio_total: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    estado: {
        type: DataTypes.ENUM('Pendiente', 'Activo', 'Cancelado'),
        defaultValue: 'Pendiente'
    },
    alergias: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    restricciones: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    fecha_inicio: {
        type: DataTypes.DATEONLY,
        allowNull: true
    }
}, {
    timestamps: true,
    createdAt: 'fecha_creacion',
    updatedAt: 'fecha_actualizacion',
    tableName: 'suscripciones'
});

// Relationships
Cliente.hasMany(Suscripcion, { foreignKey: 'cliente_cedula' });
Suscripcion.belongsTo(Cliente, { foreignKey: 'cliente_cedula' });

Plan.hasMany(Suscripcion, { foreignKey: 'plan_id' });
Suscripcion.belongsTo(Plan, { foreignKey: 'plan_id' });

module.exports = Suscripcion;
