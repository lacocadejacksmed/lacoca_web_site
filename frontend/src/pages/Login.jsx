import { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '../schemas/validationSchemas';
import api from '../services/api';
import Swal from 'sweetalert2';
import { useGoogleLogin } from '@react-oauth/google';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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

  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      try {
        const res = await api.post('/auth/google', { access_token: tokenResponse.access_token, flowType: 'login' });
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
    },
    onError: () => {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'El inicio de sesión con Google falló'
      });
    },
    ux_mode: 'redirect'
  });

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
                type={showPassword ? "text" : "password"}
                {...register('password')}
                placeholder="••••••••"
                className={`w-full bg-[#FFF6EA] border-2 rounded-2xl pl-14 pr-12 py-4 text-sm font-bold transition-all outline-none ${
                  errors.password ? 'border-red-100 ring-2 ring-red-50 bg-red-50/30 text-red-900' : 'border-transparent focus:ring-2 focus:ring-[#F2641A]'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-[#7A6B5C] hover:text-[#F2641A] transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
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
          
          <button
            type="button"
            onClick={() => loginWithGoogle()}
            disabled={loading}
            className="w-full py-4 bg-white border border-[#EFD9B4] text-[#2B2118] rounded-2xl font-bold text-sm hover:bg-[#FFF6EA] shadow-sm transition-all flex items-center justify-center gap-3"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continuar con Google
          </button>
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
