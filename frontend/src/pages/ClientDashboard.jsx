import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, LogOut, Clock, ArrowLeft, Calendar, History, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import api from '../services/api';

export default function ClientDashboard() {
  const [usuario, setUsuario] = useState(JSON.parse(localStorage.getItem('usuario') || '{}'));
  const [suscripciones, setSuscripciones] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyData();
  }, []);

  const fetchMyData = async () => {
    try {
      const res = await api.get('/auth/me');
      if (res.data.success) {
        const subsRes = await api.get('/client/suscripciones');
        if (subsRes.data.success) {
          setSuscripciones(subsRes.data.suscripciones);
        }
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const handleRenovar = () => {
    navigate('/#reserva');
  };

  const activeOrPendingSubs = suscripciones.filter(sub => sub.estado === 'Activo' || sub.estado === 'Pendiente');
  const pastSubs = suscripciones.filter(sub => sub.estado === 'Vencido' || sub.estado === 'Cancelado');

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-slate-900 text-white p-6 md:p-8 pb-32 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 relative z-10">
          <Link to="/" className="flex items-center gap-2 text-white/80 hover:text-white no-underline font-bold transition-colors">
            <ArrowLeft size={18} />
            Volver al inicio
          </Link>
          <button onClick={handleLogout} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl transition-all border border-white/20 w-full md:w-auto justify-center">
            <LogOut size={18} />
            <span className="text-sm font-bold">Cerrar Sesión</span>
          </button>
        </div>
        
        <div className="max-w-4xl mx-auto mt-12 mb-16 text-center md:text-left relative z-10">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-5xl font-black tracking-tight"
          >
            Hola, {usuario.nombre}
          </motion.h1>
          <p className="text-slate-400 font-medium mt-2 text-lg">Este es el estado de tus suscripciones</p>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 -mt-16 md:-mt-24 pb-20 relative z-20">
        
        {/* Active Subscription Section */}
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-6 px-2">
            <Package className="text-orange-500" size={24} />
            <h2 className="text-xl font-black text-slate-800">Suscripción Actual</h2>
          </div>

          {loading ? (
             <div className="bg-white rounded-3xl p-10 text-center animate-pulse shadow-xl shadow-slate-200/50">
               <div className="h-4 bg-slate-200 rounded w-1/4 mx-auto mb-4"></div>
               <div className="h-8 bg-slate-200 rounded w-1/2 mx-auto"></div>
             </div>
          ) : activeOrPendingSubs.length === 0 ? (
             <div className="bg-white rounded-3xl p-12 text-center shadow-xl shadow-slate-200/50 border border-slate-100">
               <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                 <Package size={28} className="text-slate-400" />
               </div>
               <h3 className="text-lg font-bold text-slate-800 mb-2">No tienes ninguna suscripción activa</h3>
               <p className="text-slate-500 mb-6">Parece que es un buen momento para pedir tu próxima coca.</p>
               <button 
                 onClick={handleRenovar}
                 className="bg-orange-600 text-white px-8 py-3 rounded-xl font-black shadow-lg shadow-orange-500/30 hover:bg-orange-700 hover:-translate-y-1 transition-all"
               >
                 Suscribirse Ahora
               </button>
             </div>
          ) : (
             <div className="space-y-6">
               {activeOrPendingSubs.map(sub => {
                 const isExpiringSoon = sub.estado === 'Activo' && sub.dias_restantes <= 2;
                 
                 return (
                   <motion.div 
                     initial={{ opacity: 0, scale: 0.95 }}
                     animate={{ opacity: 1, scale: 1 }}
                     key={sub.id} 
                     className={`bg-white rounded-[32px] p-6 md:p-10 shadow-2xl border-2 relative overflow-hidden ${
                       isExpiringSoon ? 'border-orange-500 shadow-orange-500/20' : 'border-transparent shadow-slate-200/50'
                     }`}
                   >
                     {/* Indicator Bar */}
                     <div className={`absolute top-0 left-0 w-full h-2 ${
                       sub.estado === 'Pendiente' ? 'bg-amber-400' :
                       isExpiringSoon ? 'bg-orange-500' : 'bg-green-500'
                     }`}></div>

                     <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                       <div>
                         <div className="flex items-center gap-3 mb-2">
                           <h3 className="text-2xl font-black text-slate-900">Plan {sub.Plan?.nombre}</h3>
                           <span className={`px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest ${
                             sub.estado === 'Pendiente' ? 'bg-amber-100 text-amber-700' :
                             isExpiringSoon ? 'bg-orange-100 text-orange-700 animate-pulse' : 'bg-green-100 text-green-700'
                           }`}>
                             {sub.estado}
                           </span>
                         </div>
                         <p className="text-slate-500 font-medium flex items-center gap-2">
                           <Calendar size={16} />
                           Vence el {sub.fecha_vencimiento || sub.fecha_inicio || 'N/A'}
                         </p>
                       </div>

                       {sub.estado === 'Activo' && (
                         <div className="text-left md:text-right bg-slate-50 p-4 rounded-2xl w-full md:w-auto">
                           <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Días Restantes</p>
                           <p className={`text-4xl font-black ${isExpiringSoon ? 'text-orange-600' : 'text-slate-800'}`}>
                             {sub.dias_restantes}
                           </p>
                         </div>
                       )}
                     </div>

                     {/* Details Grid */}
                     <div className="grid grid-cols-2 gap-4 bg-slate-50 p-6 rounded-2xl">
                       <div>
                         <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Precio Total</p>
                         <p className="text-lg font-bold text-slate-800">${parseFloat(sub.precio_total).toLocaleString('es-CO')}</p>
                       </div>
                       <div>
                         <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Dirección de Entrega</p>
                         <p className="text-sm font-semibold text-slate-700 line-clamp-2">
                           {sub.direcciones?.[0]?.direccion || 'N/A'}
                         </p>
                       </div>
                     </div>

                     {/* Renewal Action */}
                     {isExpiringSoon && (
                       <div className="mt-8 bg-orange-50 border border-orange-100 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                         <div className="flex items-start gap-3">
                           <AlertCircle className="text-orange-600 shrink-0 mt-1" size={24} />
                           <div>
                             <h4 className="font-bold text-orange-900">¡Tu suscripción está a punto de terminar!</h4>
                             <p className="text-sm text-orange-700/80 mt-1">Renueva ahora para asegurar tus almuerzos la próxima semana.</p>
                           </div>
                         </div>
                         <button 
                           onClick={handleRenovar}
                           className="w-full md:w-auto shrink-0 bg-orange-600 text-white px-8 py-4 rounded-xl font-black shadow-xl shadow-orange-500/30 hover:bg-orange-700 hover:-translate-y-1 transition-all text-sm uppercase tracking-wider"
                         >
                           Renovar Suscripción
                         </button>
                       </div>
                     )}
                   </motion.div>
                 );
               })}
             </div>
          )}
        </section>

        {/* Past Subscriptions */}
        {pastSubs.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-6 px-2 opacity-60">
              <History className="text-slate-600" size={20} />
              <h2 className="text-lg font-bold text-slate-600">Historial de Suscripciones</h2>
            </div>
            
            <div className="space-y-4">
              {pastSubs.map(sub => (
                <div key={sub.id} className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 opacity-70 hover:opacity-100 transition-opacity">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-bold text-slate-800">Plan {sub.Plan?.nombre}</span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest ${
                        sub.estado === 'Cancelado' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {sub.estado}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-slate-400">
                      Finalizó el {sub.fecha_vencimiento || sub.fecha_inicio || 'N/A'}
                    </p>
                  </div>
                  <div className="text-left md:text-right">
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-0.5">Precio</p>
                    <p className="text-sm font-bold text-slate-700">${parseFloat(sub.precio_total).toLocaleString('es-CO')}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
