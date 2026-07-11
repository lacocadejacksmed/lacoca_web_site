import { z } from 'zod';

// ── Helpers reutilizables ──────────────────────────────────────────────────────

const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s.'-]+$/;
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const onlyDigits = /^\d+$/;

/** Campo nombre genérico (3-80 chars, solo letras/espacios/acentos) */
const nombreField = z
  .string()
  .min(1, 'El nombre es obligatorio')
  .min(3, 'El nombre debe tener al menos 3 caracteres')
  .max(80, 'El nombre es demasiado largo')
  .regex(nameRegex, 'El nombre solo puede contener letras y espacios')
  .refine(val => !['null', 'undefined', 'nan'].includes(val.toLowerCase().trim()), 'Nombre no permitido (palabra reservada)');

/** Campo email */
const emailField = z
  .string()
  .min(1, 'El correo electrónico es obligatorio')
  .regex(emailRegex, 'El formato del correo no es válido (ej: nombre@correo.com)');

/** Campo cédula / documento (5-12 dígitos) */
const documentoField = z
  .string()
  .min(1, 'El documento es obligatorio')
  .min(5, 'El documento debe tener al menos 5 dígitos')
  .max(12, 'El documento no puede tener más de 12 dígitos')
  .regex(onlyDigits, 'El documento solo puede contener números');

/** Campo celular colombiano (10 dígitos, empieza con 3) */
const celularField = z
  .string()
  .min(1, 'El celular es obligatorio')
  .length(10, 'El celular debe tener exactamente 10 dígitos')
  .regex(onlyDigits, 'El celular solo puede contener números')
  .refine(val => val.startsWith('3'), {
    message: 'El celular debe comenzar con 3 (formato colombiano)'
  });

/** Campo dirección */
const direccionField = z
  .string()
  .min(1, 'La dirección es obligatoria')
  .min(5, 'La dirección debe tener al menos 5 caracteres');

/** Campo barrio */
const barrioField = z
  .string()
  .min(1, 'El barrio es obligatorio')
  .min(2, 'El barrio debe tener al menos 2 caracteres');


// ── LOGIN ──────────────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, 'La contraseña es obligatoria')
});


// ── REGISTER ───────────────────────────────────────────────────────────────────

export const registerSchema = z.object({
  nombre: nombreField,
  email: emailField,
  cedula: documentoField,
  celular: celularField,
  password: z
    .string()
    .min(1, 'La contraseña es obligatoria')
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .regex(/\d/, 'La contraseña debe contener al menos un número'),
  confirmPassword: z.string().min(1, 'Debes confirmar la contraseña')
}).refine(data => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword']
});


// ── WIZARD PÚBLICO — por pasos ─────────────────────────────────────────────────

export const wizardStep1Schema = z.object({
  nombre: nombreField,
  documento: documentoField,
  fecha_inicio: z.string().min(1, 'Debes elegir en qué semana quieres empezar')
});

export const wizardStep2Schema = z.object({
  email: emailField,
  telefono: celularField
});

export const wizardStep3Schema = z.object({
  direccion: direccionField,
  barrio: barrioField,
  tipoEntrega: z.enum(['fija', 'hibrida']),
  direccion2: z.string().optional(),
  barrio2: z.string().optional()
}).superRefine((data, ctx) => {
  if (data.tipoEntrega === 'hibrida') {
    if (!data.direccion2 || data.direccion2.trim().length < 5) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'La dirección 2 es obligatoria para entrega híbrida (mín. 5 caracteres)',
        path: ['direccion2']
      });
    }
    if (!data.barrio2 || data.barrio2.trim().length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'El barrio 2 es obligatorio para entrega híbrida',
        path: ['barrio2']
      });
    }
  }
});

export const wizardStep4Schema = z.object({
  comprobanteFile: z.any().refine(val => val !== null && val !== undefined, {
    message: 'Por favor adjunta la captura o PDF de tu transferencia'
  }),
  terms: z.boolean().refine(val => val === true, {
    message: 'Es necesario que aceptes nuestras políticas de servicio'
  })
});

/** Helper para validar archivo de comprobante (tipo + tamaño) */
export function validateComprobanteFile(file) {
  if (!file) return 'Por favor adjunta la captura o PDF de tu transferencia';
  
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
  if (!allowedTypes.includes(file.type)) {
    return 'Solo se permiten imágenes (JPG, PNG, WebP) o PDF';
  }
  
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return 'El archivo no puede superar los 5MB';
  }
  
  return null; // válido
}


// ── CLIENT EDITOR (Admin) ──────────────────────────────────────────────────────

export const clientEditorSchema = z.object({
  nombre: nombreField,
  correo: z.string()
    .regex(emailRegex, 'El formato del correo no es válido')
    .or(z.literal('')),
  celular: z.string()
    .refine(val => !val || (val.length === 10 && onlyDigits.test(val)), {
      message: 'El celular debe tener exactamente 10 dígitos numéricos'
    }),
  esta_activo: z.boolean(),
  // Suscripción fields (opcionales, solo si tiene suscripción)
  plan_id: z.any().optional(),
  estado_sub: z.string().optional(),
  fecha_inicio: z.string().optional(),
  tipo_entrega: z.string().optional(),
  necesita_cocas: z.boolean().optional(),
  alergias: z.string().optional(),
  restricciones: z.string().optional(),
  suscripcion_id: z.any().optional(),
  direcciones: z.array(z.object({
    direccion: z.string().min(1, 'La dirección es obligatoria'),
    barrio: z.string().min(1, 'El barrio es obligatorio'),
    dias_entrega: z.string().optional(),
    es_principal: z.boolean().optional(),
    zona: z.string().optional(),
    latitud: z.any().optional(),
    longitud: z.any().optional(),
    id: z.any().optional()
  })).optional()
});


// ── COMPROBANTE MODAL (Admin inline editing) ───────────────────────────────────

export function validateComprobanteEdit(data) {
  const errors = {};
  
  if (!data.clienteNombre || data.clienteNombre.trim().length < 3) {
    errors.clienteNombre = 'El nombre debe tener al menos 3 caracteres';
  }
  
  if (data.clienteEmail && !emailRegex.test(data.clienteEmail)) {
    errors.clienteEmail = 'El formato del correo no es válido';
  }
  
  if (data.clienteCelular) {
    const clean = data.clienteCelular.replace(/\D/g, '');
    if (clean.length !== 10) {
      errors.clienteCelular = 'El celular debe tener exactamente 10 dígitos';
    }
  }
  
  if (data.direcciones && Array.isArray(data.direcciones)) {
    data.direcciones.forEach((dir, i) => {
      if (!dir.direccion || dir.direccion.trim() === '') {
        errors[`direccion_${i}`] = 'La dirección es obligatoria';
      }
      if (!dir.barrio || dir.barrio.trim() === '') {
        errors[`barrio_${i}`] = 'El barrio es obligatorio';
      }
    });
  }
  
  return Object.keys(errors).length > 0 ? errors : null;
}


// ── ADMIN SWAL VALIDATORS ──────────────────────────────────────────────────────

/** Validar formulario de nueva configuración */
export function validateConfig(clave, valor) {
  if (!clave || clave.trim() === '') return 'La clave es obligatoria';
  if (!/^[a-zA-Z0-9_]+$/.test(clave.trim())) return 'La clave solo puede tener letras, números y guiones bajos';
  if (!valor || valor.trim() === '') return 'El valor es obligatorio';
  return null;
}

/** Validar formulario de editar valor de configuración */
export function validateConfigValue(valor) {
  if (valor === undefined || valor === null || String(valor).trim() === '') return 'El valor es obligatorio';
  return null;
}

/** Validar formulario de nuevo/editar plan */
export function validatePlan(nombre, precio, dias) {
  if (!nombre || nombre.trim() === '') return 'El nombre del plan es obligatorio';
  if (!precio || isNaN(parseFloat(precio)) || parseFloat(precio) <= 0) return 'El precio debe ser un número mayor a 0';
  if (!dias || isNaN(parseInt(dias)) || parseInt(dias) <= 0) return 'Los días deben ser un número mayor a 0';
  return null;
}

/** Validar formulario de feriado */
export function validateFeriado(fecha, descripcion) {
  if (!fecha) return 'La fecha es obligatoria';
  if (!descripcion || descripcion.trim() === '') return 'La descripción es obligatoria';
  return null;
}

/** Validar formulario de menú semanal */
export function validateMenu(fechas) {
  if (!fechas || fechas.trim() === '') return 'El rango de fechas es obligatorio';
  return null;
}


// ── Exports de helpers individuales ────────────────────────────────────────────

export {
  nombreField,
  emailField,
  documentoField,
  celularField,
  direccionField,
  barrioField,
  nameRegex,
  emailRegex,
  onlyDigits
};
