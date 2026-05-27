const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Cliente = sequelize.define('Cliente', {
    cedula: {
        type: DataTypes.STRING(20),
        primaryKey: true,
        allowNull: false
    },
    nombre: {
        type: DataTypes.STRING,
        allowNull: false
    },
    correo: {
        type: DataTypes.STRING,
        allowNull: false
    },
    celular: {
        type: DataTypes.STRING(20),
        allowNull: false
    },
    esta_activo: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    timestamps: true,
    createdAt: 'fecha_creacion',
    updatedAt: 'fecha_actualizacion',
    tableName: 'clientes',
    indexes: [
        {
            unique: true,
            fields: ['correo']
        }
    ]
});

module.exports = Cliente;
