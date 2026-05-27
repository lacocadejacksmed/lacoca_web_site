import React from 'react';
import { Phone, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function StepContactInfo({ register, errors, watch, setValue }) {
  const isFieldValid = (fieldName) => {
    if (fieldName === 'email') {
      const email = watch('email');
      return email && email.includes('@') && email.includes('.') && !errors.email;
    }
    if (fieldName === 'telefono') {
      const tel = watch('telefono');
      return tel && tel.length === 10 && !errors.telefono;
    }
    return false;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="bg-blue-50 p-4 rounded-2xl flex gap-3 border border-blue-100 text-slate-900">
        <Phone className="text-blue-500 shrink-0" size={20} />
        <p className="text-xs font-bold text-blue-800 leading-relaxed">
          Contacto: Información de contacto y dietas especiales.
        </p>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
          Correo Electrónico
          {isFieldValid('email') ? (
            <CheckCircle2 size={12} className="text-green-500 animate-in zoom-in" />
          ) : (
            <AlertCircle size={10} className="text-orange-500" />
          )}
        </label>
        <input 
          type="email"
          {...register('email')}
          className={`w-full bg-gray-50 border-none rounded-xl px-4 py-3.5 text-sm focus:ring-2 transition-all font-medium text-slate-900 ${
            errors.email ? 'ring-2 ring-orange-500 bg-orange-50/50 shadow-inner' : 'focus:ring-orange-500'
          }`}
          placeholder="ejemplo@correo.com"
        />
        {errors.email && <p className="text-[10px] font-bold text-orange-600 mt-1 ml-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.email.message}</p>}
      </div>

      <div className="space-y-2">
        <label className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
          Celular (WhatsApp)
          {isFieldValid('telefono') ? (
            <CheckCircle2 size={12} className="text-green-500 animate-in zoom-in" />
          ) : (
            <AlertCircle size={10} className="text-orange-500" />
          )}
        </label>
        <input 
          type="tel"
          {...register('telefono', {
            onChange: (e) => {
              setValue('telefono', e.target.value.replace(/\D/g, '').slice(0, 10));
            }
          })}
          className={`w-full bg-gray-50 border-none rounded-xl px-4 py-3.5 text-sm focus:ring-2 transition-all font-medium text-slate-900 ${
            errors.telefono ? 'ring-2 ring-orange-500 bg-orange-50/50 shadow-inner' : 'focus:ring-orange-500'
          }`}
          placeholder="3001234567"
        />
        {errors.telefono && <p className="text-[10px] font-bold text-orange-600 mt-1 ml-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.telefono.message}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-black text-slate-900 uppercase tracking-widest">¿Alergias?</label>
          <textarea 
            {...register('alergias')}
            className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-xs focus:ring-2 focus:ring-orange-500 transition-all font-medium text-slate-900 resize-none"
            rows="2"
            placeholder="Ej: Maní, mariscos..."
          ></textarea>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-black text-slate-900 uppercase tracking-widest">Restricciones</label>
          <textarea 
            {...register('restricciones')}
            className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-xs focus:ring-2 focus:ring-orange-500 transition-all font-medium text-slate-900 resize-none"
            rows="2"
            placeholder="Ej: No como cerdo, soy vegano..."
          ></textarea>
        </div>
      </div>
    </motion.div>
  );
}
