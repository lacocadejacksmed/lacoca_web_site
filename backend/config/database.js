const { Sequelize } = require('sequelize');
require('dotenv').config();

const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

const sequelize = dbUrl
    ? new Sequelize(dbUrl, {
        dialect: 'postgres',
        logging: false,
        dialectOptions: {
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        }
    })
    : new Sequelize(
        process.env.DB_NAME || 'lacocadejacks',
        process.env.DB_USER || 'postgres',
        process.env.DB_PASSWORD || '123456',
        {
            host: process.env.DB_HOST || 'localhost',
            dialect: 'postgres',
            logging: false,
        }
    );

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('Conexión a la base de datos PostgreSQL establecida exitosamente.');
    } catch (error) {
        throw error; // Re-throw to handle it in startServer
    }
};

module.exports = { sequelize, connectDB };
