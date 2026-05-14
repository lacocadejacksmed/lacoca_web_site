import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, UserPlus, Users, ArrowLeft } from 'lucide-react';
import api from '../services/api';
import Swal from 'sweetalert2';

export default function Register() {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    confirmPassword: '',
    cedula: '',
    celular: '',
    rol: 'cliente' // Default for public register
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return Swal.fire({ icon: 'error', title: 'Error', text: 'Las contraseñas no coinciden' });
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/register', formData);
      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('usuario', JSON.stringify(res.data.usuario));
        Swal.fire({
          icon: 'success',
          title: 'Cuenta creada',
          text: res.data.usuario.rol === 'admin' ? 'Bienvenido al equipo de La Coca de Jacks' : 'Bienvenido a La Coca de Jacks',
          timer: 2000,
          showConfirmButton: false
        });
        navigate(res.data.usuario.rol === 'admin' ? '/admin' : '/dashboard');
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.response?.data?.message || 'Error al registrarse'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-['Outfit']">
      <Link to="/" className="absolute top-8 left-8 flex items-center gap-2 px-5 py-3 bg-white rounded-full shadow-sm border border-slate-200 text-slate-600 hover:text-orange-600 hover:border-orange-200 hover:bg-orange-50 transition-all no-underline font-black text-xs uppercase tracking-widest z-50">
        <ArrowLeft size={16} strokeWidth={3} />
        Volver al inicio
      </Link>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-[40px] shadow-2xl shadow-orange-500/10 p-10 border border-gray-100"
      >
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-orange-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-orange-500/20">
            <UserPlus className="text-white" size={32} />
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Crea tu Cuenta</h2>
          <p className="text-slate-400 font-medium mt-2">Únete a La Coca de Jacks</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Nombre Completo</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                <input 
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={e => setFormData({...formData, nombre: e.target.value})}
                  className="w-full bg-gray-50 border-none rounded-xl pl-11 pr-4 py-3 text-sm font-bold focus:ring-2 focus:ring-orange-500 transition-all outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Correo Electrónico</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                <input 
                  type="email"
                  required
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-gray-50 border-none rounded-xl pl-11 pr-4 py-3 text-sm font-bold focus:ring-2 focus:ring-orange-500 transition-all outline-none"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Cédula</label>
              <div className="relative">
                <Users className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                <input 
                  type="text"
                  required
                  value={formData.cedula}
                  onChange={e => setFormData({...formData, cedula: e.target.value})}
                  className="w-full bg-gray-50 border-none rounded-xl pl-11 pr-4 py-3 text-sm font-bold focus:ring-2 focus:ring-orange-500 transition-all outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Celular</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 font-bold text-xs">📞</div>
                <input 
                  type="text"
                  required
                  value={formData.celular}
                  onChange={e => setFormData({...formData, celular: e.target.value})}
                  className="w-full bg-gray-50 border-none rounded-xl pl-11 pr-4 py-3 text-sm font-bold focus:ring-2 focus:ring-orange-500 transition-all outline-none"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                <input 
                  type="password"
                  required
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  className="w-full bg-gray-50 border-none rounded-xl pl-11 pr-4 py-3 text-sm font-bold focus:ring-2 focus:ring-orange-500 transition-all outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Confirmar</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                <input 
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                  className="w-full bg-gray-50 border-none rounded-xl pl-11 pr-4 py-3 text-sm font-bold focus:ring-2 focus:ring-orange-500 transition-all outline-none"
                />
              </div>
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-slate-800 shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <UserPlus size={18} strokeWidth={3} />
                Crear Cuenta
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-slate-400 font-medium">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-orange-500 font-black no-underline hover:underline">
              Inicia sesión
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
