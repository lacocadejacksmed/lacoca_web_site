const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const dotenv = require('dotenv');

dotenv.config();

// Validación fail-fast de credenciales de Cloudinary
const requiredVars = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
const missing = requiredVars.filter(v => !process.env[v]);

if (missing.length > 0) {
  const msg = `❌ Faltan variables de entorno de Cloudinary: ${missing.join(', ')}`;
  if (process.env.NODE_ENV === 'production') {
    throw new Error(msg + '. El servidor no puede arrancar sin estas credenciales.');
  }
  console.warn(`⚠️  ${msg}. Las subidas de imágenes NO funcionarán.`);
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // Definimos la carpeta y formato base
    let folder = 'lacocadejacks';
    if (file.fieldname === 'menu_image') {
      folder += '/menus';
    } else if (file.fieldname === 'comprobante') {
      folder += '/comprobantes';
    }

    return {
      folder: folder,
      public_id: file.fieldname + '-' + Date.now(),
    };
  },
});

module.exports = {
  cloudinary,
  storage
};
