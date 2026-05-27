import React from 'react';
import { User, CheckCircle2, AlertCircle, Check } from 'lucide-react';
import { motion } from 'framer-motion';

export default function StepPersonalData({ register, errors, watch, setValue, plans, availability, recognizedClient, checkExistingClient }) {
  const isFieldValid = (fieldName) => !errors[fieldName] && watch(fieldName)?.length >= (fieldName === 'documento' ? 5 : 3);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="bg-orange-50 p-4 rounded-2xl flex gap-3 border border-orange-100 text-slate-900">
        <User className="text-orange-500 shrink-0" size={20} />
        <p className="text-xs font-bold text-orange-800 leading-relaxed">
          Información Personal: Comencemos con los datos legales y el plan del cliente.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
            Nombre Completo
            {isFieldValid('nombre') ? (
              <CheckCircle2 size={12} className="text-green-500 animate-in zoom-in" />
            ) : (
              <AlertCircle size={10} className="text-orange-500" />
            )}
          </label>
          <input 
            {...register('nombre')}
            className={`w-full bg-gray-50 border-none rounded-xl px-4 py-3.5 text-sm focus:ring-2 transition-all font-medium text-slate-900 ${
              errors.nombre ? 'ring-2 ring-orange-500 bg-orange-50/50 shadow-inner' : 'focus:ring-orange-500'
            }`}
            placeholder="Ej: María Pérez"
          />
          {errors.nombre && <p className="text-[10px] font-bold text-orange-600 mt-1 ml-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.nombre.message}</p>}
        </div>
        <div className="space-y-2 relative">
          <label className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
            Documento / CC
            {isFieldValid('documento') ? (
              <CheckCircle2 size={12} className="text-green-500 animate-in zoom-in" />
            ) : (
              <AlertCircle size={10} className="text-orange-500" />
            )}
          </label>
          <input 
            {...register('documento', {
              onChange: (e) => {
                setValue('documento', e.target.value.replace(/\D/g, ''));
              },
              onBlur: (e) => checkExistingClient(e.target.value)
            })}
            className={`w-full bg-gray-50 border-none rounded-xl px-4 py-3.5 text-sm focus:ring-2 transition-all font-medium text-slate-900 ${
              errors.documento ? 'ring-2 ring-orange-500 bg-orange-50/50 shadow-inner' : 'focus:ring-orange-500'
            }`}
            placeholder="Ej: 1017..."
          />
          {errors.documento && <p className="text-[10px] font-bold text-orange-600 mt-1 ml-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.documento.message}</p>}
          {recognizedClient && (
             <div className="absolute -top-1 right-0 text-[9px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100 flex items-center gap-1">
                <Check size={10} /> RECONOCIDO
             </div>
          )}
        </div>
      </div>
      
      <div className="space-y-3">
        <label className="text-xs font-black text-slate-900 uppercase tracking-widest">Selecciona el Plan</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {Object.entries(plans).map(([id, p]) => (
            <button 
              key={id}
              type="button"
              onClick={() => setValue('plan', id)}
              className={`p-4 rounded-2xl border-2 transition-all text-left ${
                watch('plan') === id ? 'border-orange-500 bg-orange-50 shadow-sm' : 'border-gray-100 hover:border-orange-200'
              }`}
            >
              <div className="text-[10px] font-black uppercase text-gray-400 mb-1">{p.name}</div>
              <div className="text-lg font-black text-orange-600">${(p.price/1000).toFixed(0)}K</div>
            </button>
          ))}
        </div>
        {errors.plan && <p className="text-[10px] font-bold text-orange-600 mt-1 ml-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.plan.message}</p>}
      </div>

      <div className="space-y-3">
        <label className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
          ¿Cuándo desea iniciar?
          {watch('fecha_inicio') && !errors.fecha_inicio ? (
            <CheckCircle2 size={12} className="text-green-500 animate-in zoom-in" />
          ) : (
            <AlertCircle size={10} className="text-orange-500" />
          )}
        </label>
        <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 p-1 rounded-2xl transition-all ${errors.fecha_inicio ? 'ring-2 ring-orange-500 bg-orange-50/30' : ''}`}>
          {availability.map((a, idx) => (
            <button 
              key={a.fecha}
              type="button"
              disabled={!a.disponible}
              onClick={() => setValue('fecha_inicio', a.fecha)}
              className={`p-3 rounded-xl border-2 transition-all text-left relative ${
                watch('fecha_inicio') === a.fecha 
                  ? 'border-orange-500 bg-orange-50 shadow-sm' 
                  : a.disponible 
                    ? 'border-gray-100 hover:border-orange-200 bg-white' 
                    : 'border-gray-50 bg-gray-50 opacity-50 cursor-not-allowed'
              }`}
            >
              <div className="text-[9px] font-black uppercase text-gray-400 mb-1">
                Semana del {new Date(a.fecha + 'T12:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
              </div>
              <div className={`text-xs font-black ${!a.disponible ? 'text-gray-400' : 'text-slate-700'}`}>
                {!a.disponible ? 'AGOTADO' : (idx === 0 ? 'Próxima Semana' : 'Reserva Futura')}
              </div>
              {watch('fecha_inicio') === a.fecha && (
                <div className="absolute top-2 right-2 text-orange-500">
                  <Check size={14} strokeWidth={4} />
                </div>
              )}
            </button>
          ))}
        </div>
        {errors.fecha_inicio && <p className="text-[10px] font-bold text-orange-600 mt-1 ml-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.fecha_inicio.message}</p>}
      </div>
    </motion.div>
  );
}
