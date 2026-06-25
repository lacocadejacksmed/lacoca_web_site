const { v2: cloudinary } = require('cloudinary');
const multer = require('multer');
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
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Storage engine personalizado para multer que sube directamente a Cloudinary v2.
 * Reemplaza multer-storage-cloudinary (que solo soporta Cloudinary v1).
 */
const cloudinaryStorage = {
  _handleFile(req, file, cb) {
    // Determinar la carpeta según el campo del formulario
    let folder = 'lacocadejacks';
    if (file.fieldname === 'menu_image') {
      folder += '/menus';
    } else if (file.fieldname === 'comprobante') {
      folder += '/comprobantes';
    }

    const public_id = `${file.fieldname}-${Date.now()}`;

    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, public_id },
      (error, result) => {
        if (error) return cb(error);
        cb(null, {
          path:     result.secure_url,   // URL pública de Cloudinary
          filename: result.public_id,    // ID para eliminar si hace falta
          size:     result.bytes,
        });
      }
    );

    file.stream.pipe(uploadStream);
  },

  _removeFile(req, file, cb) {
    cloudinary.uploader.destroy(file.filename, { invalidate: true }, cb);
  },
};

const storage = multer({ storage: cloudinaryStorage });

module.exports = {
  cloudinary,
  storage,
};
