import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Check, User, MapPin, Package, AlertTriangle } from 'lucide-react';
import api from '../services/api';
import Swal from 'sweetalert2';

export default function ClientEditorModal({ client, onClose, onUpdate, plans }) {
  const raw = client.raw;
  const subs = raw.Suscripcions || raw.Suscripciones || [];
  const sub = subs.sort((a,b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion))[0] || {};
  const dirs = sub.direcciones || [];

  const [activeTab, setActiveTab] = useState('perfil');
  const [formData, setFormData] = useState({
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
    fecha_inicio: sub.fecha_inicio || '',
    estado_sub: sub.estado || 'Pendiente',
    direcciones: dirs.length > 0 ? dirs.map(d => ({...d})) : [{
      direccion: '', barrio: '', dias_entrega: 'Lunes,Martes,Miércoles,Jueves,Viernes', es_principal: true, zona: 'por-asignar', latitud: 0, longitud: 0
    }]
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put(`/admin/clientes/${client.cedula}/full`, formData);
      if (res.data.success) {
        Swal.fire('Éxito', 'Cliente actualizado correctamente', 'success');
        onUpdate();
        onClose();
      }
    } catch (error) {
      Swal.fire('Error', error.response?.data?.message || 'Error al actualizar cliente', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm" onClick={onClose}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-4xl bg-white rounded-[40px] shadow-2xl overflow-hidden h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
          <h2 className="text-2xl font-black">Editar Cliente: {client.nombre}</h2>
          <button onClick={onClose} className="p-2 bg-white/10 hover:bg-red-500 rounded-xl transition-all">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-8 pt-6 flex gap-6 border-b border-gray-100">
          {['perfil', 'suscripcion', 'direcciones'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`pb-4 text-[11px] font-black uppercase tracking-widest relative ${activeTab === tab ? 'text-orange-600' : 'text-slate-400 hover:text-slate-600'}`}>
              {tab}
              {activeTab === tab && <motion.div layoutId="editorTab" className="absolute bottom-0 left-0 right-0 h-1 bg-orange-600 rounded-full" />}
            </button>
          ))}
        </div>

        <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
          <form id="editorForm" onSubmit={handleSubmit} className="space-y-8">
            
            {activeTab === 'perfil' && (
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2"><User size={18}/> Perfil del Cliente</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Cédula (No editable)</label>
                    <input disabled type="text" className="w-full p-3 rounded-xl border border-gray-200 mt-1 bg-gray-100" value={client.cedula} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Nombre Completo</label>
                    <input required type="text" className="w-full p-3 rounded-xl border border-gray-200 mt-1 bg-white" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Correo</label>
                    <input type="email" className="w-full p-3 rounded-xl border border-gray-200 mt-1 bg-white" value={formData.correo} onChange={e => setFormData({...formData, correo: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Celular</label>
                    <input required type="text" className="w-full p-3 rounded-xl border border-gray-200 mt-1 bg-white" value={formData.celular} onChange={e => setFormData({...formData, celular: e.target.value})} />
                  </div>
                  <div className="md:col-span-2 flex items-center gap-2 mt-2">
                    <input type="checkbox" className="w-5 h-5 rounded text-orange-600" checked={formData.esta_activo} onChange={e => setFormData({...formData, esta_activo: e.target.checked})} />
                    <label className="text-sm font-bold text-slate-800">¿Cliente Activo?</label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'suscripcion' && (
              <div className="bg-orange-50 p-6 rounded-3xl border border-orange-100">
                <h3 className="text-lg font-black text-orange-900 mb-4 flex items-center gap-2"><Package size={18}/> Suscripción Actual</h3>
                {!formData.suscripcion_id ? (
                  <p className="text-sm text-red-500 font-bold">El cliente no tiene suscripciones.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-orange-600 uppercase">Plan</label>
                      <select className="w-full p-3 rounded-xl border border-orange-200 mt-1 bg-white" value={formData.plan_id} onChange={e => setFormData({...formData, plan_id: e.target.value})}>
                        {plans.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-orange-600 uppercase">Estado Suscripción</label>
                      <select className="w-full p-3 rounded-xl border border-orange-200 mt-1 bg-white" value={formData.estado_sub} onChange={e => setFormData({...formData, estado_sub: e.target.value})}>
                        <option value="Activo">Activo</option>
                        <option value="Pendiente">Pendiente</option>
                        <option value="Cancelado">Cancelado</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-orange-600 uppercase">Fecha de Inicio</label>
                      <input required type="date" className="w-full p-3 rounded-xl border border-orange-200 mt-1 bg-white" value={formData.fecha_inicio} onChange={e => setFormData({...formData, fecha_inicio: e.target.value})} />
                    </div>
                    <div className="flex items-center gap-2 pt-6">
                      <input type="checkbox" className="w-5 h-5 rounded text-orange-600" checked={formData.necesita_cocas} onChange={e => setFormData({...formData, necesita_cocas: e.target.checked})} />
                      <label className="text-sm font-bold text-orange-800">¿Requiere Cocas?</label>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-orange-600 uppercase">Alergias</label>
                      <input type="text" className="w-full p-3 rounded-xl border border-orange-200 mt-1 bg-white" value={formData.alergias} onChange={e => setFormData({...formData, alergias: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-orange-600 uppercase">Restricciones</label>
                      <input type="text" className="w-full p-3 rounded-xl border border-orange-200 mt-1 bg-white" value={formData.restricciones} onChange={e => setFormData({...formData, restricciones: e.target.value})} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'direcciones' && (
              <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100">
                <h3 className="text-lg font-black text-blue-900 mb-4 flex items-center gap-2"><MapPin size={18}/> Direcciones de Entrega</h3>
                {!formData.suscripcion_id ? (
                  <p className="text-sm text-red-500 font-bold">El cliente no tiene suscripciones.</p>
                ) : formData.direcciones.map((dir, idx) => (
                  <div key={idx} className="mb-6 pb-6 border-b border-blue-200 last:border-0 last:pb-0 last:mb-0">
                    <h4 className="text-sm font-bold text-blue-800 mb-2">Dirección {idx + 1} {dir.es_principal && '(Principal)'}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="text-xs font-bold text-blue-600 uppercase">Dirección Completa</label>
                        <input required type="text" className="w-full p-3 rounded-xl border border-blue-200 mt-1 bg-white" value={dir.direccion} onChange={e => {
                          const newDirs = [...formData.direcciones];
                          newDirs[idx].direccion = e.target.value;
                          setFormData({...formData, direcciones: newDirs});
                        }} />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-blue-600 uppercase">Barrio</label>
                        <input required type="text" className="w-full p-3 rounded-xl border border-blue-200 mt-1 bg-white" value={dir.barrio} onChange={e => {
                          const newDirs = [...formData.direcciones];
                          newDirs[idx].barrio = e.target.value;
                          setFormData({...formData, direcciones: newDirs});
                        }} />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-blue-600 uppercase">Días de Entrega</label>
                        <input required type="text" className="w-full p-3 rounded-xl border border-blue-200 mt-1 bg-white" value={dir.dias_entrega} onChange={e => {
                          const newDirs = [...formData.direcciones];
                          newDirs[idx].dias_entrega = e.target.value;
                          setFormData({...formData, direcciones: newDirs});
                        }} />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-blue-600 uppercase">Zona (Asignada)</label>
                        <input type="text" className="w-full p-3 rounded-xl border border-blue-200 mt-1 bg-gray-100" value={dir.zona} onChange={e => {
                          const newDirs = [...formData.direcciones];
                          newDirs[idx].zona = e.target.value;
                          setFormData({...formData, direcciones: newDirs});
                        }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </form>
        </div>

        <div className="p-6 border-t border-gray-100 flex justify-end">
          <button type="submit" form="editorForm" className="px-8 py-4 bg-orange-600 text-white rounded-2xl font-black flex items-center gap-2 hover:bg-orange-700 transition-all shadow-xl shadow-orange-500/30">
            <Check size={20} /> Guardar Todos los Cambios
          </button>
        </div>
      </motion.div>
    </div>
  );
}
