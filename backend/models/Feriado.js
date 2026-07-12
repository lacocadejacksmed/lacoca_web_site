const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Feriado = sequelize.define('Feriado', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    fecha: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    descripcion: {
        type: DataTypes.STRING,
        allowNull: true
    },
    activo: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    timestamps: false,
    tableName: 'feriados',
    indexes: [
        {
            unique: true,
            fields: ['fecha']
        }
    ]
});

module.exports = Feriado;
