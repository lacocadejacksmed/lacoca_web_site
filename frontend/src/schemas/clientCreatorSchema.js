import { z } from 'zod';

export const clientCreatorSchema = z.object({
  nombre: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  documento: z.string().min(5, 'El documento debe tener al menos 5 caracteres'),
  plan: z.string().min(1, 'Debes seleccionar un plan'),
  fecha_inicio: z.string().min(1, 'Debes seleccionar una fecha de inicio'),
  email: z.string().email('Debe ser un correo electrónico válido'),
  telefono: z.string().length(10, 'El teléfono debe tener exactamente 10 dígitos numéricos'),
  alergias: z.string().optional(),
  restricciones: z.string().optional(),
  tipoEntrega: z.enum(['fija', 'hibrida']),
  direccion: z.string().min(1, 'La dirección es obligatoria'),
  barrio: z.string().min(1, 'El barrio es obligatorio'),
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
    if (!data.direccion2 || data.direccion2.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'La dirección 2 es obligatoria para entrega híbrida',
        path: ['direccion2']
      });
    }
    if (!data.barrio2 || data.barrio2.trim() === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'El barrio 2 es obligatorio para entrega híbrida',
        path: ['barrio2']
      });
    }
  }
});
