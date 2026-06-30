import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, ArrowLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '../schemas/validationSchemas';
import api from '../services/api';
import Swal from 'sweetalert2';
import { GoogleLogin } from '@react-oauth/google';

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

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/google', { credential: credentialResponse.credential });
      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('usuario', JSON.stringify(res.data.usuario));
        Swal.fire({
          icon: 'success',
          title: 'Bienvenido con Google',
          text: `Hola, ${res.data.usuario.nombre}`,
          timer: 1500,
          showConfirmButton: false
        });
        navigate(res.data.usuario.rol === 'admin' ? '/admin' : '/dashboard');
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error de Google',
        text: err.response?.data?.message || 'No se pudo iniciar sesión con Google'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF6EA] flex items-center justify-center p-6">
      <Link to="/" className="absolute top-8 left-8 flex items-center gap-2 px-5 py-3 bg-white rounded-full shadow-sm border border-[#EFD9B4] text-[#2B2118] hover:text-[#F2641A] hover:border-[#F2641A]/30 hover:bg-[#FFF6EA] transition-all no-underline font-black text-xs uppercase tracking-widest z-50">
        <ArrowLeft size={16} strokeWidth={3} />
        Volver al inicio
      </Link>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-[40px] shadow-2xl shadow-[#F2641A]/10 p-10 border border-[#EFD9B4]/30"
      >
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-[#F2641A] rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-[#F2641A]/30">
            <LogIn className="text-white" size={32} />
          </div>
          <h2 className="text-3xl font-black text-[#2B2118] tracking-tight">Iniciar Sesión</h2>
          <p className="text-[#7A6B5C] font-medium mt-2">Accede a tu cuenta de La Coca de Jacks</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-[#7A6B5C] uppercase tracking-widest px-1">Correo Electrónico</label>
            <div className="relative">
              <Mail className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors ${errors.email ? 'text-red-400' : 'text-[#EFD9B4]'}`} size={18} />
              <input 
                type="email"
                {...register('email')}
                placeholder="ejemplo@correo.com"
                className={`w-full bg-[#FFF6EA] border-2 rounded-2xl pl-14 pr-6 py-4 text-sm font-bold transition-all outline-none ${
                  errors.email ? 'border-red-100 ring-2 ring-red-50 bg-red-50/30 text-red-900' : 'border-transparent focus:ring-2 focus:ring-[#F2641A]'
                }`}
              />
            </div>
            {errors.email && <p className="text-[10px] font-bold text-red-500 px-1 animate-in slide-in-from-top-1">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-[#7A6B5C] uppercase tracking-widest px-1">Contraseña</label>
            <div className="relative">
              <Lock className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors ${errors.password ? 'text-red-400' : 'text-[#EFD9B4]'}`} size={18} />
              <input 
                type="password"
                {...register('password')}
                placeholder="••••••••"
                className={`w-full bg-[#FFF6EA] border-2 rounded-2xl pl-14 pr-6 py-4 text-sm font-bold transition-all outline-none ${
                  errors.password ? 'border-red-100 ring-2 ring-red-50 bg-red-50/30 text-red-900' : 'border-transparent focus:ring-2 focus:ring-[#F2641A]'
                }`}
              />
            </div>
            {errors.password && <p className="text-[10px] font-bold text-red-500 px-1 animate-in slide-in-from-top-1">{errors.password.message}</p>}
            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-xs font-bold text-[#7A6B5C] hover:text-[#F2641A] transition-colors no-underline">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-[#F2641A] text-white rounded-2xl font-black text-sm hover:bg-[#F2641A]/90 shadow-xl shadow-[#F2641A]/20 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
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
          
          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-[#EFD9B4]"></div>
            <span className="flex-shrink-0 mx-4 text-[#7A6B5C] text-xs font-bold uppercase tracking-widest">O</span>
            <div className="flex-grow border-t border-[#EFD9B4]"></div>
          </div>
          
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => {
                Swal.fire({
                  icon: 'error',
                  title: 'Error',
                  text: 'El inicio de sesión con Google falló'
                });
              }}
              useOneTap
              shape="pill"
              theme="outline"
              size="large"
            />
          </div>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-[#7A6B5C] font-medium">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="text-[#F2641A] font-black no-underline hover:underline">
              Regístrate aquí
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
