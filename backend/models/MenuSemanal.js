const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const MenuSemanal = sequelize.define('MenuSemanal', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    fechas: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'Del 11 al 15 de Mayo'
    },
    imagen_url: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    tableName: 'menu_semanal',
    timestamps: true
});

module.exports = MenuSemanal;
