import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Package, Calendar, LogOut, Clock, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import api from '../services/api';

export default function ClientDashboard() {
  const [usuario, setUsuario] = useState(JSON.parse(localStorage.getItem('usuario') || '{}'));
  const [suscripciones, setSuscripciones] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Profile edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ 
    nombre: usuario.nombre || '', 
    email: usuario.email || '', 
    celular: '', 
    password: '' 
  });
  const [isSaving, setIsSaving] = useState(false);
  
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

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await api.put('/auth/me', editForm);
      if (res.data.success) {
        Swal.fire({ icon: 'success', title: 'Perfil actualizado', text: 'Tus datos se guardaron correctamente', toast: true, position: 'bottom-end', showConfirmButton: false, timer: 3000 });
        const updatedUser = { ...usuario, nombre: editForm.nombre, email: editForm.email };
        setUsuario(updatedUser);
        localStorage.setItem('usuario', JSON.stringify(updatedUser));
        setEditForm({ ...editForm, password: '' });
        setIsEditing(false);
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error', text: err.response?.data?.message || 'Error actualizando perfil' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleNewOrder = () => {
    const activeSub = suscripciones.find(sub => sub.estado === 'Activo');
    const pendingSub = suscripciones.find(sub => sub.estado === 'Pendiente');

    if (pendingSub) {
      return Swal.fire({
        icon: 'warning',
        title: 'Pedido en Proceso',
        text: 'Ya tienes un pedido pendiente de validación. Por favor espera a que sea aprobado.'
      });
    }

    if (activeSub) {
      const isExpiringSoon = activeSub.dias_restantes <= 5;
      const today = new Date().getDay(); // 0=Sun, 1=Mon, 2=Tue, 3=Wed, ...

      if (!isExpiringSoon) {
        return Swal.fire({
          icon: 'info',
          title: 'Suscripción Vigente',
          text: `Tu suscripción actual aún tiene ${activeSub.dias_restantes} días. Solo puedes renovar cuando falten 5 días o menos.`
        });
      }

      // Si le faltan <= 5 días, verificamos que sea de Miércoles a Domingo (3, 4, 5, 6, 0)
      if (today === 1 || today === 2) {
        return Swal.fire({
          icon: 'info',
          title: 'Aún es pronto',
          text: 'Las renovaciones para la próxima semana se habilitan a partir de cada miércoles. ¡Vuelve pronto!'
        });
      }
    }

    // Si todo está bien (es miércoles o no tiene subs activas), lo llevamos al home o wizard
    navigate('/#reserva'); // O la ruta de tu wizard de pedido
  };

  return (
    <div className="min-h-screen bg-slate-50 font-['Outfit']">
      {/* Header */}
      <header className="bg-orange-600 text-white p-6 md:p-8 pb-32">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <Link to="/" className="flex items-center gap-2 text-white/80 hover:text-white no-underline font-bold transition-colors">
            <ArrowLeft size={18} />
            Volver al inicio
          </Link>
          <button onClick={handleLogout} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl transition-all border border-white/20 w-full md:w-auto justify-center">
            <LogOut size={18} />
            <span className="text-sm font-bold">Cerrar Sesión</span>
          </button>
        </div>
        
        <div className="max-w-6xl mx-auto mt-12 mb-16 text-center md:text-left">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-3xl md:text-4xl font-black tracking-tight"
          >
            ¡Hola, {usuario.nombre}! 👋
          </motion.h1>
          <p className="text-orange-100 font-medium opacity-80 mt-2">Bienvenido a tu panel personal de La Coca de Jacks</p>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-6 -mt-8 md:-mt-12 pb-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Perfil */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[32px] p-6 md:p-8 shadow-xl shadow-orange-500/5 border border-gray-100"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center shrink-0">
                  <User size={24} />
                </div>
                <div>
                  <h3 className="font-black text-slate-900">Mis Datos</h3>
                  <p className="text-[10px] md:text-xs text-gray-400 font-bold uppercase tracking-widest">Información Personal</p>
                </div>
              </div>
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className="text-orange-500 text-xs font-black uppercase tracking-widest hover:text-orange-600 bg-orange-50 px-3 py-1.5 rounded-lg"
              >
                {isEditing ? 'Cancelar' : 'Editar'}
              </button>
            </div>
            
            {isEditing ? (
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Nombre</label>
                  <input type="text" value={editForm.nombre} onChange={e=>setEditForm({...editForm, nombre: e.target.value})} className="w-full border-none bg-gray-50 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-orange-500" required />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Email</label>
                  <input type="email" value={editForm.email} onChange={e=>setEditForm({...editForm, email: e.target.value})} className="w-full border-none bg-gray-50 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-orange-500" required />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Celular</label>
                  <input type="text" value={editForm.celular} onChange={e=>setEditForm({...editForm, celular: e.target.value})} className="w-full border-none bg-gray-50 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-orange-500" placeholder="Ej. 3001234567" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Nueva Contraseña (opcional)</label>
                  <input type="password" placeholder="Mínimo 6 caracteres" value={editForm.password} onChange={e=>setEditForm({...editForm, password: e.target.value})} className="w-full border-none bg-gray-50 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-orange-500" />
                </div>
                <button disabled={isSaving} type="submit" className="w-full mt-4 bg-orange-600 text-white rounded-xl py-3 text-sm font-black disabled:opacity-50 hover:bg-orange-700 transition-all shadow-lg shadow-orange-500/20">
                  {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Cédula</label>
                  <div className="text-sm font-bold text-slate-700">{usuario.cedula || 'No registrada'}</div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Nombre</label>
                  <div className="text-sm font-bold text-slate-700">{usuario.nombre}</div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Email</label>
                  <div className="text-sm font-bold text-slate-700">{usuario.email}</div>
                </div>
              </div>
            )}
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
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                  <Package size={24} />
                </div>
                <div>
                  <h3 className="font-black text-slate-900">Mis Pedidos</h3>
                  <p className="text-[10px] md:text-xs text-gray-400 font-bold uppercase tracking-widest">Historial de Suscripciones</p>
                </div>
              </div>
              <button 
                onClick={handleNewOrder}
                className="bg-orange-500 text-white px-4 md:px-6 py-2.5 md:py-3 rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-widest shadow-lg shadow-orange-500/30 hover:bg-orange-600 hover:scale-105 active:scale-95 transition-all"
              >
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
                  <div key={sub.id} className="bg-white border border-gray-100 p-5 md:p-6 rounded-2xl flex flex-col justify-between items-start gap-4 hover:shadow-lg transition-all relative overflow-hidden">
                    {sub.estado === 'Activo' && sub.dias_restantes <= 5 && sub.dias_restantes > 0 && (
                       <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>
                    )}
                    <div className="flex-1 w-full">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <span className="font-bold text-base md:text-lg text-slate-800">Plan {sub.Plan?.nombre}</span>
                        {sub.estado === 'Pendiente' && <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Pendiente</span>}
                        {sub.estado === 'Activo' && <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Activo</span>}
                        {sub.estado === 'Cancelado' && <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Cancelado</span>}
                        {sub.estado === 'Vencido' && <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Vencido</span>}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 bg-gray-50 rounded-xl p-4">
                        <div>
                           <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Días Restantes</p>
                           <p className={`text-sm font-black ${sub.estado === 'Activo' && sub.dias_restantes <= 5 ? 'text-red-500 animate-pulse' : 'text-slate-700'}`}>
                              {sub.estado === 'Activo' ? `${sub.dias_restantes} días` : 'N/A'}
                           </p>
                        </div>
                        <div>
                           <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Vencimiento</p>
                           <p className="text-sm font-bold text-slate-700">{sub.fecha_vencimiento || sub.fecha_inicio || 'N/A'}</p>
                        </div>
                        <div>
                           <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Precio Total</p>
                           <p className="text-sm font-bold text-slate-700">${parseFloat(sub.precio_total).toLocaleString('es-CO')}</p>
                        </div>
                        <div>
                           <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Dirección</p>
                           <p className="text-sm font-semibold text-slate-700 truncate" title={sub.direcciones?.[0]?.direccion}>
                             {sub.direcciones?.[0]?.direccion || 'N/A'}
                           </p>
                        </div>
                      </div>
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
