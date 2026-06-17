import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, User, MapPin, Package, AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { clientEditorSchema } from '../schemas/validationSchemas';
import api from '../services/api';
import Swal from 'sweetalert2';

const TABS = [
  { id: 'cliente', label: '👤 Info del Cliente' },
  { id: 'suscripcion', label: '📦 Suscripción' },
];

export default function ClientEditorModal({ client, onClose, onUpdate, plans }) {
  const raw = client.raw;
  const subs = raw.Suscripcions || raw.Suscripciones || [];
  const sub = subs.sort((a, b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion))[0] || {};
  const dirs = sub.direcciones || [];

  const [activeTab, setActiveTab] = React.useState('cliente');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(clientEditorSchema),
    defaultValues: {
      nombre: client.nombre,
      correo: client.correo || '',
      celular: client.telefono || '',
      esta_activo: client.status === 'activo',
      suscripcion_id: sub.id || null,
      plan_id: sub.plan_id || plans[0]?.id,
      necesita_cocas: sub.necesita_cocas || false,
      tipo_entrega: sub.tipo_entrega || 'Fija',
      alergias: sub.alergias || 'Ninguna',
      restricciones: sub.restricciones || 'Ninguna',
      fecha_inicio: sub.fecha_inicio ? sub.fecha_inicio.split('T')[0] : '',
      estado_sub: sub.estado || 'Pendiente',
      direcciones: dirs.length > 0 ? dirs.map(d => ({ ...d })) : [{
        direccion: '', barrio: '', dias_entrega: 'Lunes,Martes,Miércoles,Jueves,Viernes', es_principal: true, zona: 'por-asignar', latitud: 0, longitud: 0
      }]
    },
    mode: 'onBlur'
  });

  const formData = watch();

  const onSubmit = async (data) => {
    try {
      const res = await api.put(`/admin/clientes/${client.cedula}/full`, data);
      if (res.data.success) {
        Swal.fire('¡Guardado!', 'Cliente actualizado correctamente', 'success');
        onUpdate();
        onClose();
      }
    } catch (error) {
      Swal.fire('Error', error.response?.data?.message || 'Error al actualizar cliente', 'error');
    }
  };

  const inputCls = (fieldError) => `w-full p-3 rounded-xl border mt-1 bg-white text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 transition-all ${
    fieldError ? 'border-red-300 ring-2 ring-red-100 bg-red-50/30 focus:ring-red-400' : 'border-gray-200 focus:ring-orange-400'
  }`;
  const labelCls = "text-xs font-black text-slate-500 uppercase tracking-wider";

  // Helper for direction field updates
  const handleDirChange = (idx, field, value) => {
    const newDirs = [...formData.direcciones];
    newDirs[idx] = { ...newDirs[idx], [field]: value };
    setValue('direcciones', newDirs, { shouldValidate: true });
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-2xl bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 bg-slate-950 text-white relative overflow-hidden flex justify-between items-center border-b border-slate-800 flex-shrink-0">
          <div className="absolute top-0 right-0 w-40 h-40 bg-orange-500 rounded-full blur-3xl opacity-10 -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-600 flex items-center justify-center text-xl font-black text-white shadow-lg shadow-orange-500/20">
              {client.nombre?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Editando Cliente</p>
              <h2 className="text-xl font-black">{client.nombre}</h2>
              <p className="text-[10px] text-orange-400 font-bold mt-0.5">CC {client.cedula}</p>
            </div>
          </div>
          <button onClick={onClose} className="relative z-10 p-2 bg-slate-900 hover:bg-red-600 text-white rounded-xl transition-all border border-slate-800">
            <X size={16} />
          </button>
        </div>

        {/* Tab Bar */}
        <div className="flex border-b border-gray-100 bg-white flex-shrink-0">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all relative outline-none focus:outline-none ${
                activeTab === tab.id ? 'text-orange-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.div layoutId="editTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Body */}
        <form id="clientEditForm" onSubmit={handleSubmit(onSubmit)} className="overflow-y-auto flex-1 p-6">
          <AnimatePresence mode="wait">
            {activeTab === 'cliente' && (
              <motion.div
                key="cliente"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.15 }}
                className="space-y-4"
              >
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                    <User size={14} /> Datos Personales
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Cédula <span className="text-slate-300">(no editable)</span></label>
                      <input disabled type="text" className={`${inputCls(false)} bg-gray-100 cursor-not-allowed`} value={client.cedula} />
                    </div>
                    <div>
                      <label className={labelCls}>Nombre Completo</label>
                      <input type="text" className={inputCls(errors.nombre)} {...register('nombre')} />
                      {errors.nombre && <p className="text-[9px] font-bold text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.nombre.message}</p>}
                    </div>
                    <div>
                      <label className={labelCls}>Correo Electrónico</label>
                      <input type="email" className={inputCls(errors.correo)} {...register('correo')} />
                      {errors.correo && <p className="text-[9px] font-bold text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.correo.message}</p>}
                    </div>
                    <div>
                      <label className={labelCls}>Celular / WhatsApp</label>
                      <input 
                        type="text" 
                        className={inputCls(errors.celular)} 
                        {...register('celular', {
                          onChange: (e) => {
                            e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
                          }
                        })} 
                      />
                      {errors.celular && <p className="text-[9px] font-bold text-red-500 mt-1 flex items-center gap-1"><AlertCircle size={10} /> {errors.celular.message}</p>}
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-4">Estado de la Cuenta</h3>
                  <label className="flex items-center gap-3 cursor-pointer group w-fit">
                    <div className="relative">
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={formData.esta_activo}
                        onChange={e => setValue('esta_activo', e.target.checked)}
                      />
                      <div className={`w-12 h-6 rounded-full transition-all ${formData.esta_activo ? 'bg-green-500' : 'bg-slate-300'}`} />
                      <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${formData.esta_activo ? 'translate-x-6' : ''}`} />
                    </div>
                    <span className="text-sm font-bold text-slate-700 group-hover:text-slate-900">
                      {formData.esta_activo ? '✅ Cliente Activo' : '⛔ Cliente Inactivo'}
                    </span>
                  </label>
                </div>
              </motion.div>
            )}

            {activeTab === 'suscripcion' && (
              <motion.div
                key="suscripcion"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-4"
              >
                {!formData.suscripcion_id ? (
                  <div className="text-center py-12 text-slate-400">
                    <Package size={40} className="mx-auto mb-3 opacity-30" />
                    <p className="font-bold">Este cliente no tiene suscripción activa.</p>
                  </div>
                ) : (
                  <>
                    <div className="bg-orange-50 rounded-2xl p-5 border border-orange-100">
                      <h3 className="text-[11px] font-black uppercase tracking-widest text-orange-400 mb-4 flex items-center gap-2">
                        <Package size={14} /> Detalles del Plan
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className={`${labelCls} text-orange-600`}>Plan</label>
                          <select className={inputCls(false)} value={formData.plan_id} onChange={e => setValue('plan_id', e.target.value)}>
                            {plans.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className={`${labelCls} text-orange-600`}>Estado Suscripción</label>
                          <select className={inputCls(false)} value={formData.estado_sub} onChange={e => setValue('estado_sub', e.target.value)}>
                            <option value="Activo">Activo</option>
                            <option value="Pendiente">Pendiente</option>
                            <option value="Cancelado">Cancelado</option>
                            <option value="Vencido">Vencido</option>
                          </select>
                        </div>
                        <div>
                          <label className={`${labelCls} text-orange-600`}>Fecha de Inicio</label>
                          <input type="date" className={inputCls(false)} value={formData.fecha_inicio} onChange={e => setValue('fecha_inicio', e.target.value)} />
                        </div>
                        <div>
                          <label className={`${labelCls} text-orange-600`}>Tipo de Entrega</label>
                          <select className={inputCls(false)} value={formData.tipo_entrega} onChange={e => setValue('tipo_entrega', e.target.value)}>
                            <option value="Fija">Fija</option>
                            <option value="Flexible">Flexible</option>
                          </select>
                        </div>
                      </div>
                      <label className="flex items-center gap-3 cursor-pointer mt-4 w-fit">
                        <div className="relative">
                          <input type="checkbox" className="sr-only" checked={formData.necesita_cocas} onChange={e => setValue('necesita_cocas', e.target.checked)} />
                          <div className={`w-12 h-6 rounded-full transition-all ${formData.necesita_cocas ? 'bg-orange-500' : 'bg-slate-300'}`} />
                          <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${formData.necesita_cocas ? 'translate-x-6' : ''}`} />
                        </div>
                        <span className="text-sm font-bold text-slate-700">¿Requiere Cocas?</span>
                      </label>
                    </div>

                    <div className="bg-orange-50 rounded-2xl p-5 border border-orange-100">
                      <h3 className="text-[11px] font-black uppercase tracking-widest text-orange-400 mb-4">Restricciones Alimentarias</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className={`${labelCls} text-orange-600`}>Alergias</label>
                          <input type="text" className={inputCls(false)} placeholder="ej: maní, lactosa" {...register('alergias')} />
                        </div>
                        <div>
                          <label className={`${labelCls} text-orange-600`}>Restricciones</label>
                          <input type="text" className={inputCls(false)} placeholder="ej: sin gluten, vegetariano" {...register('restricciones')} />
                        </div>
                      </div>
                    </div>

                    {formData.direcciones && formData.direcciones.length > 0 && (
                      <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
                        <h3 className="text-[11px] font-black uppercase tracking-widest text-blue-400 mb-4 flex items-center gap-2">
                          <MapPin size={14} /> Direcciones de Entrega
                        </h3>
                        {formData.direcciones.map((dir, idx) => (
                          <div key={idx} className="mb-4 pb-4 border-b border-blue-100 last:border-0 last:mb-0 last:pb-0">
                            <p className="text-xs font-black text-blue-600 uppercase mb-3">
                              Dirección {idx + 1} {dir.es_principal && '— Principal'}
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="md:col-span-2">
                                <label className={`${labelCls} text-blue-600`}>Dirección Completa</label>
                                <input 
                                  type="text" 
                                  className={inputCls(errors.direcciones?.[idx]?.direccion)} 
                                  value={dir.direccion} 
                                  onChange={e => handleDirChange(idx, 'direccion', e.target.value)} 
                                />
                                {errors.direcciones?.[idx]?.direccion && (
                                  <p className="text-[9px] font-bold text-red-500 mt-1 flex items-center gap-1">
                                    <AlertCircle size={10} /> {errors.direcciones[idx].direccion.message}
                                  </p>
                                )}
                              </div>
                              <div>
                                <label className={`${labelCls} text-blue-600`}>Barrio</label>
                                <input 
                                  type="text" 
                                  className={inputCls(errors.direcciones?.[idx]?.barrio)} 
                                  value={dir.barrio} 
                                  onChange={e => handleDirChange(idx, 'barrio', e.target.value)} 
                                />
                                {errors.direcciones?.[idx]?.barrio && (
                                  <p className="text-[9px] font-bold text-red-500 mt-1 flex items-center gap-1">
                                    <AlertCircle size={10} /> {errors.direcciones[idx].barrio.message}
                                  </p>
                                )}
                              </div>
                              <div>
                                <label className={`${labelCls} text-blue-600`}>Días de Entrega</label>
                                <input 
                                  type="text" 
                                  className={inputCls(false)} 
                                  value={dir.dias_entrega} 
                                  onChange={e => handleDirChange(idx, 'dias_entrega', e.target.value)} 
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </form>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center flex-shrink-0">
          <button onClick={onClose} className="px-6 py-3 text-sm font-black text-slate-500 hover:text-slate-700 transition-all outline-none focus:outline-none">
            Cancelar
          </button>
          <button
            type="submit"
            form="clientEditForm"
            className="px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black text-sm flex items-center gap-2 transition-all shadow-lg shadow-orange-500/30 outline-none focus:outline-none"
          >
            <Check size={18} /> Guardar Cambios
          </button>
        </div>
      </motion.div>
    </div>
  );
}
