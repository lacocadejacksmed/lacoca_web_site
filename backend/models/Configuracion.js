const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Configuracion = sequelize.define('Configuracion', {
    clave: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false
    },
    valor: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    timestamps: true,
    createdAt: 'fecha_creacion',
    updatedAt: 'fecha_actualizacion',
    tableName: 'configuraciones'
});

module.exports = Configuracion;
