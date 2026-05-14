const MenuSemanal = require('../models/MenuSemanal');
const path = require('path');
const fs = require('fs');

exports.getMenu = async (req, res) => {
    try {
        let menu = await MenuSemanal.findOne({ order: [['createdAt', 'DESC']] });
        res.json({ success: true, menu });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getMenus = async (req, res) => {
    try {
        const menus = await MenuSemanal.findAll({ order: [['createdAt', 'DESC']] });
        res.json({ success: true, menus });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateMenu = async (req, res) => {
    try {
        const { fechas } = req.body;
        
        const newData = { fechas: fechas };
        
        if (req.file) {
            newData.imagen_url = `/uploads/${req.file.filename}`;
            console.log("Nueva entrada de menú histórico:", req.file.filename);
        }

        // Siempre creamos uno nuevo para guardar el histórico
        const menu = await MenuSemanal.create(newData);

        res.json({ success: true, message: 'Menú registrado en el histórico', menu });
    } catch (error) {
        console.error("Error registrando menú:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
