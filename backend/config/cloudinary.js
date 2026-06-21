const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const dotenv = require('dotenv');

dotenv.config();

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
