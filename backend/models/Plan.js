const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Plan = sequelize.define('Plan', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nombre: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    precio_base: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    dias_duracion: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    esta_activo: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    timestamps: true,
    createdAt: 'fecha_creacion',
    updatedAt: false,
    tableName: 'planes'
});

module.exports = Plan;
