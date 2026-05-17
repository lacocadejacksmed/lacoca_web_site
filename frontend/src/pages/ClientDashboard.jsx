import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Package, Calendar, LogOut, Clock, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function ClientDashboard() {
  const [usuario] = useState(JSON.parse(localStorage.getItem('usuario') || '{}'));
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
        // Obtenemos las suscripciones
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

  return (
    <div className="min-h-screen bg-slate-50 font-['Outfit']">
      {/* Header */}
      <header className="bg-orange-600 text-white p-8 pb-32">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2 text-white/80 hover:text-white no-underline font-bold transition-colors">
            <ArrowLeft size={18} />
            Volver al inicio
          </Link>
          <button onClick={handleLogout} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl transition-all border border-white/20">
            <LogOut size={18} />
            <span className="text-sm font-bold">Cerrar Sesión</span>
          </button>
        </div>
        
        <div className="max-w-6xl mx-auto mt-10">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-4xl font-black tracking-tight"
          >
            ¡Hola, {usuario.nombre}! 👋
          </motion.h1>
          <p className="text-orange-100 font-medium opacity-80 mt-2">Bienvenido a tu panel personal de La Coca de Jacks</p>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 -mt-20 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Perfil */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[32px] p-8 shadow-xl shadow-orange-500/5 border border-gray-100"
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center">
                <User size={24} />
              </div>
              <div>
                <h3 className="font-black text-slate-900">Mis Datos</h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Información Personal</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Cédula</label>
                <div className="text-sm font-bold text-slate-700">{usuario.cedula || 'No registrada'}</div>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Email</label>
                <div className="text-sm font-bold text-slate-700">{usuario.email}</div>
              </div>
            </div>
          </motion.div>

          {/* Suscripciones */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 bg-white rounded-[32px] p-8 shadow-xl shadow-orange-500/5 border border-gray-100"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                  <Package size={24} />
                </div>
                <div>
                  <h3 className="font-black text-slate-900">Mis Pedidos</h3>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Historial de Suscripciones</p>
                </div>
              </div>
              <button className="bg-orange-500 text-white px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-orange-500/30 hover:bg-orange-600 transition-all">
                Nuevo Pedido
              </button>
            </div>

            {loading ? (
              <div className="py-20 text-center text-gray-400 font-medium animate-pulse">Cargando tus datos...</div>
            ) : suscripciones.length === 0 ? (
              <div className="bg-gray-50 rounded-2xl p-10 text-center">
                <Clock size={48} className="mx-auto text-gray-200 mb-4" />
                <p className="text-gray-400 font-medium italic">Aún no tienes suscripciones activas.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {suscripciones.map((sub) => (
                  <div key={sub.id} className="bg-white border border-gray-100 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-lg transition-all">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-bold text-lg text-slate-800">Plan {sub.Plan?.nombre}</span>
                        {sub.estado === 'Pendiente' && <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-xs font-bold">Pendiente</span>}
                        {sub.estado === 'Activo' && <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-xs font-bold">Activo</span>}
                        {sub.estado === 'Cancelado' && <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-bold">Cancelado</span>}
                        {sub.estado === 'Vencido' && <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-xs font-bold">Vencido</span>}
                      </div>
                      <p className="text-sm text-gray-500 mb-1">Inicia: <span className="font-semibold text-slate-700">{sub.fecha_inicio || 'Por definir'}</span></p>
                      <p className="text-sm text-gray-500">Precio Total: <span className="font-semibold text-slate-700">${parseFloat(sub.precio_total).toLocaleString('es-CO')}</span></p>
                    </div>
                    <div className="flex flex-col text-left md:text-right">
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Dirección Principal</p>
                      <p className="text-sm font-semibold text-slate-700 max-w-[200px] truncate" title={sub.direcciones?.[0]?.direccion}>
                        {sub.direcciones?.[0]?.direccion || 'No registrada'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
