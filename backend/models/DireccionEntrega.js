const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Suscripcion = require('./Suscripcion');

const DireccionEntrega = sequelize.define('DireccionEntrega', {
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
    direccion: {
        type: DataTypes.STRING,
        allowNull: false
    },
    barrio: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    dias_entrega: {
        type: DataTypes.STRING,
        allowNull: false
    },
    es_principal: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    timestamps: false,
    tableName: 'direcciones_entrega'
});

// Relationships
Suscripcion.hasMany(DireccionEntrega, { foreignKey: 'suscripcion_id', as: 'direcciones' });
DireccionEntrega.belongsTo(Suscripcion, { foreignKey: 'suscripcion_id' });

module.exports = DireccionEntrega;
