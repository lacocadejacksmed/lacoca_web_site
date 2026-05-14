const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Suscripcion = require('./Suscripcion');

const Comprobante = sequelize.define('Comprobante', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    suscripcion_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Suscripcion,
            key: 'id'
        }
    },
    url_imagen: {
        type: DataTypes.STRING,
        allowNull: false
    },
    estado: {
        type: DataTypes.ENUM('Pendiente', 'Aprobado', 'Rechazado'),
        defaultValue: 'Pendiente'
    },
    motivo_rechazo: {
        type: DataTypes.STRING,
        allowNull: true
    },
    observaciones: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    timestamps: true,
    createdAt: 'fecha_creacion',
    updatedAt: 'fecha_actualizacion',
    tableName: 'comprobantes'
});

// Relationships
Suscripcion.hasMany(Comprobante, { foreignKey: 'suscripcion_id' });
Comprobante.belongsTo(Suscripcion, { foreignKey: 'suscripcion_id' });

module.exports = Comprobante;
