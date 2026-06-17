import React from 'react';
import { motion } from 'framer-motion';
import { X, MapPin, CheckCircle, Clock, XCircle } from 'lucide-react';

const StatusBadge = ({ status }) => {
  const map = {
    activo: { label: 'Activo', cls: 'bg-green-100 text-green-700', Icon: CheckCircle },
    pendiente: { label: 'Pendiente', cls: 'bg-amber-100 text-amber-700', Icon: Clock },
    vencido: { label: 'Vencido', cls: 'bg-red-100 text-red-700', Icon: XCircle },
    cancelado: { label: 'Cancelado', cls: 'bg-slate-100 text-slate-500', Icon: XCircle },
    rechazado: { label: 'Rechazado', cls: 'bg-red-100 text-red-600', Icon: XCircle },
  };
  const s = map[status?.toLowerCase()] || map['pendiente'];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${s.cls}`}>
      <s.Icon size={10} /> {s.label}
    </span>
  );
};

const DetailItem = ({ label, value, className = "" }) => (
  <div className={`space-y-0.5 ${className}`}>
    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">{label}</span>
    <span className="text-sm font-bold text-slate-900 block">{value || '—'}</span>
  </div>
);

export default function ClientViewModal({ client, onClose, onEdit }) {
  const raw = client.raw;
  const subs = raw.Suscripcions || raw.Suscripciones || [];
  const sub = subs.sort((a, b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion))[0] || {};
  const dirs = sub.direcciones || [];
  const plan = sub.Plan || {};

  const fechaInicio = sub.fecha_inicio ? new Date(sub.fecha_inicio).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' }) : null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-4xl bg-white rounded-[32px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 bg-slate-950 text-white relative overflow-hidden flex justify-between items-center border-b border-slate-800">
          <div className="absolute top-0 right-0 w-40 h-40 bg-orange-500 rounded-full blur-3xl opacity-10 -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-600 flex items-center justify-center text-xl font-black text-white shadow-lg shadow-orange-500/20">
              {client.nombre?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-black">{client.nombre}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Ficha del Cliente</span>
                <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                <StatusBadge status={client.status} />
              </div>
            </div>
          </div>
          <div className="relative flex items-center gap-2 z-10">
            <button
              onClick={onEdit}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-black transition-all border border-orange-500 shadow-sm"
            >
              ✏️ Editar
            </button>
            <button onClick={onClose} className="p-2 bg-slate-900 hover:bg-red-600 text-white rounded-xl transition-all border border-slate-800">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto custom-scrollbar">
          {/* Column 1: Personal & Subscription */}
          <div className="space-y-6">
            {/* Info Personal */}
            <div className="border border-slate-100 rounded-2xl p-5 space-y-4 shadow-sm">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">
                Información Personal
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <DetailItem label="Cédula" value={client.cedula} />
                <DetailItem label="Celular" value={client.telefono} />
                <DetailItem label="Correo" value={client.correo} className="col-span-2" />
              </div>
            </div>

            {/* Suscripción */}
            <div className="border border-orange-100 bg-orange-50/5 rounded-2xl p-5 space-y-4 shadow-sm">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-orange-600 border-b border-orange-100/50 pb-2">
                Suscripción Activa
              </h3>
              {!sub.id ? (
                <p className="text-xs text-slate-400 font-bold italic">Sin suscripción registrada.</p>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <DetailItem label="Plan" value={plan.nombre} />
                  <DetailItem label="Fecha de Inicio" value={fechaInicio} />
                  <DetailItem label="Estado de Suscripción" value={sub.estado} />
                  <DetailItem label="Requiere Cocas" value={sub.necesita_cocas ? 'Sí' : 'No'} />
                </div>
              )}
            </div>
          </div>

          {/* Column 2: Addresses & Dietary Restrictions */}
          <div className="space-y-6">
            {/* Direcciones */}
            <div className="border border-blue-100 bg-blue-50/5 rounded-2xl p-5 space-y-4 shadow-sm">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-600 border-b border-blue-100/50 pb-2">
                Direcciones de Entrega
              </h3>
              {dirs.length === 0 ? (
                <p className="text-xs text-slate-400 font-bold italic">Sin direcciones registradas.</p>
              ) : (
                <div className="space-y-3">
                  {dirs.map((d, i) => (
                    <div key={i} className="text-xs border-b border-slate-100/80 pb-2 last:border-0 last:pb-0">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800">
                        <MapPin size={12} className="text-blue-500 flex-shrink-0" />
                        <span>{d.direccion}</span>
                        {d.es_principal && (
                          <span className="text-[8px] bg-blue-600 text-white px-1.5 py-0.5 rounded font-black uppercase tracking-wider">
                            Principal
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold mt-1 ml-4.5">
                        {d.barrio} • {d.dias_entrega}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Alergias & Restricciones */}
            {sub.id && (sub.alergias || sub.restricciones) && (
              <div className="border border-red-100 bg-red-50/5 rounded-2xl p-5 space-y-4 shadow-sm">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-red-500 border-b border-red-100/50 pb-2">
                  Restricciones de Cocina
                </h3>
                <div className="space-y-3">
                  {sub.alergias && (
                    <div>
                      <span className="text-[9px] font-black text-red-400 uppercase tracking-widest block">Alergias</span>
                      <span className="text-xs font-bold text-slate-800 bg-red-50 px-2 py-1 rounded-lg border border-red-100 inline-block mt-0.5">
                        ⚠️ {sub.alergias}
                      </span>
                    </div>
                  )}
                  {sub.restricciones && (
                    <div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Restricciones</span>
                      <span className="text-xs font-medium text-slate-700 block mt-0.5">{sub.restricciones}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
