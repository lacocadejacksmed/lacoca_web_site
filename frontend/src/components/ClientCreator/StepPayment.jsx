import React, { useRef } from 'react';
import { CreditCard, CheckCircle2, AlertCircle, Upload, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function StepPayment({ register, errors, watch, setValue, getAdjustedPriceInfo }) {
  const fileInputRef = useRef(null);
  
  const paymentMethod = watch('paymentMethod');
  const facturacion = watch('facturacion');
  const terms = watch('terms');
  const tieneCocas = watch('tieneCocas');
  const comprobanteName = watch('comprobanteName');

  const priceInfo = getAdjustedPriceInfo();

  const isFieldValid = (fieldName) => !errors[fieldName] && watch(fieldName);

  const paymentMethods = {
    bancolombia: { name: 'Bancolombia', type: 'Ahorros', icon: '/logoBancolombia.png' },
    efectivo: { name: 'Efectivo / Manual', type: 'Administrativo', icon: '/logoEfectivo.png' } // Mock icon or text
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setValue('comprobanteFile', file);
      setValue('comprobanteName', file.name);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 space-y-3">
        <label className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
          <CreditCard size={16} /> ¿Tiene los 2 juegos de cocas?
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button 
            type="button"
            onClick={() => setValue('tieneCocas', true)}
            className={`py-3 rounded-xl font-bold text-xs transition-all ${
              tieneCocas ? 'bg-orange-500 text-white shadow-md' : 'bg-white text-gray-500'
            }`}
          >
            Ya los tiene
          </button>
          <button 
            type="button"
            onClick={() => setValue('tieneCocas', false)}
            className={`py-3 rounded-xl font-bold text-xs transition-all ${
              !tieneCocas ? 'bg-orange-500 text-white shadow-md' : 'bg-white text-gray-500'
            }`}
          >
            Desea comprarlos
          </button>
        </div>
      </div>

      <div className="bg-slate-900 text-white p-6 rounded-2xl flex justify-between items-center shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
        <div>
          <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Total Final</div>
          <div className="text-3xl font-black">${priceInfo.total.toLocaleString()}</div>
          <div className="text-[10px] font-bold text-slate-400 mt-1">
            Plan + Cocas {priceInfo.discount > 0 && <span className="text-orange-400 font-black">• DESCUENTO</span>}
          </div>
        </div>
        {priceInfo.discount > 0 && (
          <div className="text-right">
            <div className="bg-orange-500 text-white px-3 py-1 rounded-full text-[10px] font-black animate-bounce mb-2">
              -${priceInfo.discount.toLocaleString()}
            </div>
            <div className="text-[9px] font-bold text-orange-200 uppercase">
              {priceInfo.holidaysFound} FESTIVO(S)
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <label className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] block ml-1">Método de Pago</label>
        <div className="flex bg-slate-100/50 p-1 rounded-2xl gap-1 border border-slate-100">
          {Object.entries(paymentMethods).map(([id, method]) => (
            <button
              key={id}
              type="button"
              onClick={() => setValue('paymentMethod', id)}
              className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all flex items-center justify-center gap-2 ${
                paymentMethod === id 
                  ? 'bg-white text-slate-900 shadow-sm' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {method.name}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {paymentMethod !== 'efectivo' && (
            <motion.div
              key="comprobante"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 pt-2"
            >
              <label className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] ml-1 flex items-center gap-1.5">
                Adjuntar Pago (Opcional Admin)
              </label>
              <div 
                onClick={() => fileInputRef.current.click()}
                className={`group border-2 border-dashed rounded-[32px] p-8 text-center cursor-pointer transition-all border-slate-200 hover:border-orange-400 bg-slate-50 hover:bg-orange-50`}
              >
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm group-hover:scale-110 transition-transform">
                  <Upload className="text-slate-300 group-hover:text-orange-500" size={28} />
                </div>
                <div className="text-sm font-black text-slate-600 group-hover:text-orange-700">
                  {comprobanteName || 'Subir Comprobante'}
                </div>
                <p className="text-[9px] text-slate-400 mt-2 font-black uppercase tracking-widest">Imagen o PDF</p>
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="space-y-4 pt-2">
        <label className="flex items-center gap-3 cursor-pointer group">
          <div className="relative">
            <input 
              type="checkbox" 
              className="peer hidden"
              {...register('facturacion')}
            />
            <div className="w-6 h-6 border-2 border-slate-200 rounded-lg flex items-center justify-center transition-all duration-300 group-active:scale-90 peer-checked:bg-orange-500 peer-checked:border-orange-500 peer-checked:shadow-lg peer-checked:shadow-orange-500/30">
              <Check size={16} strokeWidth={4} className={`text-white transition-transform duration-300 ${facturacion ? 'scale-100' : 'scale-0'}`} />
            </div>
          </div>
          <span className="text-xs font-bold text-gray-500 group-hover:text-slate-900 transition-colors">
            ¿Requiere Facturación Electrónica? <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter ml-1">(Opcional)</span>
          </span>
        </label>

        <div className="space-y-2">
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative">
              <input 
                type="checkbox" 
                className="peer hidden"
                {...register('terms')}
              />
              <div className={`w-6 h-6 border-2 rounded-lg flex items-center justify-center transition-all duration-300 group-active:scale-90 ${
                errors.terms 
                  ? 'border-orange-500 bg-orange-50' 
                  : 'border-slate-200 peer-checked:bg-orange-500 peer-checked:border-orange-500 peer-checked:shadow-lg peer-checked:shadow-orange-500/30'
              }`}>
                <Check size={16} strokeWidth={4} className={`text-white transition-transform duration-300 ${terms ? 'scale-100' : 'scale-0'}`} />
              </div>
            </div>
            <span className={`text-xs font-bold transition-colors flex items-center gap-1.5 ${errors.terms ? 'text-orange-600' : 'text-gray-500 group-hover:text-slate-900'}`}>
              He leído y acepto las <span className="text-orange-500 font-bold underline">Políticas y Condiciones</span> del servicio.
              {isFieldValid('terms') ? (
                <CheckCircle2 size={12} className="text-green-500 animate-in zoom-in" />
              ) : (
                <AlertCircle size={10} className="text-orange-500" />
              )}
            </span>
          </label>
          {errors.terms && <p className="text-[10px] font-bold text-orange-600 mt-1 ml-8 flex items-center gap-1"><AlertCircle size={10} /> {errors.terms.message}</p>}
        </div>
      </div>
    </motion.div>
  );
}
