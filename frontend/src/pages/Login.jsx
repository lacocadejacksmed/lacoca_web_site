import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, ArrowLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '../schemas/validationSchemas';
import api from '../services/api';
import Swal from 'sweetalert2';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onBlur'
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email: data.email.trim(), password: data.password });
      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('usuario', JSON.stringify(res.data.usuario));
        Swal.fire({
          icon: 'success',
          title: 'Bienvenido',
          text: `Hola, ${res.data.usuario.nombre}`,
          timer: 1500,
          showConfirmButton: false
        });
        navigate(res.data.usuario.rol === 'admin' ? '/admin' : '/dashboard');
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error de Acceso',
        text: err.response?.data?.message || 'Credenciales incorrectas o problema de conexión'
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
          <div className="w-20 h-20 bg-orange-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-orange-600/30">
            <LogIn className="text-white" size={32} />
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Iniciar Sesión</h2>
          <p className="text-slate-400 font-medium mt-2">Accede a tu cuenta de La Coca de Jacks</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Correo Electrónico</label>
            <div className="relative">
              <Mail className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors ${errors.email ? 'text-red-400' : 'text-slate-300'}`} size={18} />
              <input 
                type="email"
                {...register('email')}
                placeholder="ejemplo@correo.com"
                className={`w-full bg-gray-50 border-2 rounded-2xl pl-14 pr-6 py-4 text-sm font-bold transition-all outline-none ${
                  errors.email ? 'border-red-100 ring-2 ring-red-50 bg-red-50/30 text-red-900' : 'border-transparent focus:ring-2 focus:ring-orange-500'
                }`}
              />
            </div>
            {errors.email && <p className="text-[10px] font-bold text-red-500 px-1 animate-in slide-in-from-top-1">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Contraseña</label>
            <div className="relative">
              <Lock className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors ${errors.password ? 'text-red-400' : 'text-slate-300'}`} size={18} />
              <input 
                type="password"
                {...register('password')}
                placeholder="••••••••"
                className={`w-full bg-gray-50 border-2 rounded-2xl pl-14 pr-6 py-4 text-sm font-bold transition-all outline-none ${
                  errors.password ? 'border-red-100 ring-2 ring-red-50 bg-red-50/30 text-red-900' : 'border-transparent focus:ring-2 focus:ring-orange-500'
                }`}
              />
            </div>
            {errors.password && <p className="text-[10px] font-bold text-red-500 px-1 animate-in slide-in-from-top-1">{errors.password.message}</p>}
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-orange-600 text-white rounded-2xl font-black text-sm hover:bg-orange-700 shadow-xl shadow-orange-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <LogIn size={18} strokeWidth={3} />
                Iniciar Sesión
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-slate-400 font-medium">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="text-orange-500 font-black no-underline hover:underline">
              Regístrate aquí
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
