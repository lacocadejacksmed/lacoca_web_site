import { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, UserPlus, Users, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema } from '../schemas/validationSchemas';
import api from '../services/api';
import Swal from 'sweetalert2';
import { GoogleLogin } from '@react-oauth/google';

export default function Register() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      nombre: '',
      email: '',
      password: '',
      confirmPassword: '',
      cedula: '',
      celular: ''
    },
    mode: 'onChange'
  });

  // Helper to check if a field is valid for the green checkmark
  const isFieldValid = (name) => {
    const val = watch(name);
    if (!val || errors[name]) return false;
    switch(name) {
      case 'nombre': return val.trim().length >= 3;
      case 'email': return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(val);
      case 'cedula': return /^\d{5,12}$/.test(val);
      case 'celular': return /^3\d{9}$/.test(val);
      case 'password': return val.length >= 6 && /\d/.test(val);
      case 'confirmPassword': return val === watch('password') && val.length > 0;
      default: return false;
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const payload = {
        nombre: data.nombre.trim(),
        email: data.email.trim(),
        password: data.password,
        confirmPassword: data.confirmPassword,
        cedula: data.cedula,
        celular: data.celular,
        rol: 'cliente'
      };
      const res = await api.post('/auth/register', payload);
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
        title: 'Error de Registro',
        text: err.response?.data?.message || 'Hubo un problema al crear tu cuenta. Intenta de nuevo.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = useCallback(async (credentialResponse) => {
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
        text: err.response?.data?.message || 'No se pudo registrar/iniciar sesión con Google'
      });
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const handleGoogleError = useCallback(() => {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'El registro con Google falló'
    });
  }, []);

  // Render a field status icon
  const FieldStatus = ({ name }) => {
    if (isFieldValid(name)) {
      return <CheckCircle2 size={12} className="text-green-500 animate-in zoom-in" />;
    }
    const val = watch(name);
    if (val && val.length > 0) {
      return <AlertCircle size={10} className="text-orange-500" />;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
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

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 flex items-center gap-1">
                Nombre Completo <FieldStatus name="nombre" />
              </label>
              <div className="relative">
                <User className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${errors.nombre ? 'text-red-400' : 'text-slate-300'}`} size={16} />
                <input 
                  type="text"
                  {...register('nombre')}
                  className={`w-full bg-gray-50 border-2 rounded-xl pl-11 pr-4 py-3 text-sm font-bold transition-all outline-none ${
                    errors.nombre ? 'border-red-100 bg-red-50/30' : 'border-transparent focus:ring-2 focus:ring-orange-500'
                  }`}
                />
              </div>
              {errors.nombre && <p className="text-[8px] font-bold text-red-500 px-1">{errors.nombre.message}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 flex items-center gap-1">
                Correo Electrónico <FieldStatus name="email" />
              </label>
              <div className="relative">
                <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${errors.email ? 'text-red-400' : 'text-slate-300'}`} size={16} />
                <input 
                  type="email"
                  {...register('email')}
                  className={`w-full bg-gray-50 border-2 rounded-xl pl-11 pr-4 py-3 text-sm font-bold transition-all outline-none ${
                    errors.email ? 'border-red-100 bg-red-50/30' : 'border-transparent focus:ring-2 focus:ring-orange-500'
                  }`}
                />
              </div>
              {errors.email && <p className="text-[8px] font-bold text-red-500 px-1">{errors.email.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 flex items-center gap-1">
                Cédula <FieldStatus name="cedula" />
              </label>
              <div className="relative">
                <Users className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${errors.cedula ? 'text-red-400' : 'text-slate-300'}`} size={16} />
                <input 
                  type="text"
                  maxLength="12"
                  {...register('cedula', {
                    onChange: (e) => {
                      e.target.value = e.target.value.replace(/\D/g, '');
                    }
                  })}
                  className={`w-full bg-gray-50 border-2 rounded-xl pl-11 pr-4 py-3 text-sm font-bold transition-all outline-none ${
                    errors.cedula ? 'border-red-100 bg-red-50/30' : 'border-transparent focus:ring-2 focus:ring-orange-500'
                  }`}
                />
              </div>
              {errors.cedula && <p className="text-[8px] font-bold text-red-500 px-1">{errors.cedula.message}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 flex items-center gap-1">
                Celular <FieldStatus name="celular" />
              </label>
              <div className="relative">
                <div className={`absolute left-4 top-1/2 -translate-y-1/2 font-bold text-xs transition-colors ${errors.celular ? 'text-red-400' : 'text-slate-300'}`}>📞</div>
                <input 
                  type="text"
                  maxLength="10"
                  {...register('celular', {
                    onChange: (e) => {
                      e.target.value = e.target.value.replace(/\D/g, '');
                    }
                  })}
                  placeholder="3001234567"
                  className={`w-full bg-gray-50 border-2 rounded-xl pl-11 pr-4 py-3 text-sm font-bold transition-all outline-none ${
                    errors.celular ? 'border-red-100 bg-red-50/30' : 'border-transparent focus:ring-2 focus:ring-orange-500'
                  }`}
                />
              </div>
              {errors.celular && <p className="text-[8px] font-bold text-red-500 px-1">{errors.celular.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 flex items-center gap-1">
                Contraseña <FieldStatus name="password" />
              </label>
              <div className="relative">
                <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${errors.password ? 'text-red-400' : 'text-slate-300'}`} size={16} />
                <input 
                  type="password"
                  {...register('password')}
                  className={`w-full bg-gray-50 border-2 rounded-xl pl-11 pr-4 py-3 text-sm font-bold transition-all outline-none ${
                    errors.password ? 'border-red-100 bg-red-50/30' : 'border-transparent focus:ring-2 focus:ring-orange-500'
                  }`}
                />
              </div>
              {errors.password && <p className="text-[8px] font-bold text-red-500 px-1">{errors.password.message}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 flex items-center gap-1">
                Confirmar <FieldStatus name="confirmPassword" />
              </label>
              <div className="relative">
                <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${errors.confirmPassword ? 'text-red-400' : 'text-slate-300'}`} size={16} />
                <input 
                  type="password"
                  {...register('confirmPassword')}
                  className={`w-full bg-gray-50 border-2 rounded-xl pl-11 pr-4 py-3 text-sm font-bold transition-all outline-none ${
                    errors.confirmPassword ? 'border-red-100 bg-red-50/30' : 'border-transparent focus:ring-2 focus:ring-orange-500'
                  }`}
                />
              </div>
              {errors.confirmPassword && <p className="text-[8px] font-bold text-red-500 px-1">{errors.confirmPassword.message}</p>}
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
          
          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-bold uppercase tracking-widest">O</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>
          
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              useOneTap
              shape="pill"
              theme="outline"
              size="large"
            />
          </div>
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
