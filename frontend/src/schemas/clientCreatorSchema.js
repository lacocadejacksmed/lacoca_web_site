import { z } from 'zod';

const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s.'-]+$/;
const onlyDigits = /^\d+$/;

export const clientCreatorSchema = z.object({
  nombre: z.string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(80, 'El nombre es demasiado largo')
    .regex(nameRegex, 'El nombre solo puede contener letras y espacios'),
  documento: z.string()
    .min(5, 'El documento debe tener al menos 5 dígitos')
    .max(12, 'El documento no puede tener más de 12 dígitos')
    .regex(onlyDigits, 'El documento solo puede contener números'),
  plan: z.string().min(1, 'Debes seleccionar un plan'),
  fecha_inicio: z.string().min(1, 'Debes seleccionar una fecha de inicio'),
  email: z.string()
    .min(1, 'El correo electrónico es obligatorio')
    .regex(emailRegex, 'El formato del correo no es válido (ej: nombre@correo.com)'),
  telefono: z.string()
    .length(10, 'El celular debe tener exactamente 10 dígitos')
    .regex(onlyDigits, 'El celular solo puede contener números')
    .refine(val => val.startsWith('3'), {
      message: 'El celular debe comenzar con 3 (formato colombiano)'
    }),
  alergias: z.string().optional(),
  restricciones: z.string().optional(),
  tipoEntrega: z.enum(['fija', 'hibrida']),
  direccion: z.string()
    .min(1, 'La dirección es obligatoria')
    .min(5, 'La dirección debe tener al menos 5 caracteres'),
  barrio: z.string()
    .min(1, 'El barrio es obligatorio')
    .min(2, 'El barrio debe tener al menos 2 caracteres'),
  days_address_1: z.string().optional(),
  direccion2: z.string().optional(),
  barrio2: z.string().optional(),
  days_address_2: z.string().optional(),
  zona_1: z.string().optional(),
  lat_1: z.number().optional(),
  lng_1: z.number().optional(),
  zona_2: z.string().optional(),
  lat_2: z.number().optional(),
  lng_2: z.number().optional(),
  tieneCocas: z.boolean(),
  paymentMethod: z.string().optional(),
  facturacion: z.boolean(),
  terms: z.boolean().refine(val => val === true, {
    message: 'Debes aceptar las políticas y condiciones',
  })
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
