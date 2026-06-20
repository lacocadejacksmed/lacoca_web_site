import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { KeyRound, Lock, ArrowLeft, ShieldCheck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import api from '../services/api';
import Swal from 'sweetalert2';

const resetPasswordSchema = z.object({
  code: z.string().min(1, 'El código es requerido'),
  newPassword: z.string().min(6, 'Mínimo 6 caracteres')
});

export default function ResetPassword() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';
  const recoveryToken = location.state?.recoveryToken || '';

  useEffect(() => {
    if (!email || !recoveryToken) {
      Swal.fire({
        icon: 'warning',
        title: 'Atención',
        text: 'Debes iniciar el proceso desde la pantalla de recuperar contraseña',
        confirmButtonColor: '#ea580c'
      });
      navigate('/forgot-password');
    }
  }, [email, recoveryToken, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { code: '', newPassword: '' },
    mode: 'onBlur'
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      // Endpoint sugerido para reestablecer contraseña
      const res = await api.post('/auth/reset-password', { 
        email, 
        code: data.code, 
        newPassword: data.newPassword,
        recoveryToken // <--- Se envía el token
      });
      
      if (res.data.success || res.status === 200) {
        Swal.fire({
          icon: 'success',
          title: 'Contraseña Actualizada',
          text: 'Tu contraseña ha sido cambiada exitosamente. Inicia sesión.',
          confirmButtonColor: '#ea580c'
        });
        navigate('/login');
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error de Verificación',
        text: err.response?.data?.message || 'Código incorrecto o expirado'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-['Outfit']">
      <Link to="/forgot-password" className="absolute top-8 left-8 flex items-center gap-2 px-5 py-3 bg-white rounded-full shadow-sm border border-slate-200 text-slate-600 hover:text-orange-600 hover:border-orange-200 hover:bg-orange-50 transition-all no-underline font-black text-xs uppercase tracking-widest z-50">
        <ArrowLeft size={16} strokeWidth={3} />
        Volver
      </Link>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-[40px] shadow-2xl shadow-orange-500/10 p-10 border border-gray-100"
      >
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-green-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-green-600/10">
            <ShieldCheck className="text-green-600" size={32} />
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Crear Nueva Contraseña</h2>
          <p className="text-slate-400 font-medium mt-2">Ingresa el código que enviamos a {email}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Código de Recuperación</label>
            <div className="relative">
              <KeyRound className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors ${errors.code ? 'text-red-400' : 'text-slate-300'}`} size={18} />
              <input 
                type="text"
                {...register('code')}
                placeholder="Ej. 123456"
                className={`w-full bg-gray-50 border-2 rounded-2xl pl-14 pr-6 py-4 text-sm font-bold transition-all outline-none ${
                  errors.code ? 'border-red-100 ring-2 ring-red-50 bg-red-50/30 text-red-900' : 'border-transparent focus:ring-2 focus:ring-orange-500'
                }`}
              />
            </div>
            {errors.code && <p className="text-[10px] font-bold text-red-500 px-1 animate-in slide-in-from-top-1">{errors.code.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Nueva Contraseña</label>
            <div className="relative">
              <Lock className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors ${errors.newPassword ? 'text-red-400' : 'text-slate-300'}`} size={18} />
              <input 
                type="password"
                {...register('newPassword')}
                placeholder="••••••••"
                className={`w-full bg-gray-50 border-2 rounded-2xl pl-14 pr-6 py-4 text-sm font-bold transition-all outline-none ${
                  errors.newPassword ? 'border-red-100 ring-2 ring-red-50 bg-red-50/30 text-red-900' : 'border-transparent focus:ring-2 focus:ring-orange-500'
                }`}
              />
            </div>
            {errors.newPassword && <p className="text-[10px] font-bold text-red-500 px-1 animate-in slide-in-from-top-1">{errors.newPassword.message}</p>}
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-green-600 text-white rounded-2xl font-black text-sm hover:bg-green-700 shadow-xl shadow-green-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                Restablecer Contraseña
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
