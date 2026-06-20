import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, Send } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import api from '../services/api';
import Swal from 'sweetalert2';

const forgotPasswordSchema = z.object({
  email: z.string().email('Debe ser un correo válido').min(1, 'El correo es requerido')
});

export default function ForgotPassword() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
    mode: 'onBlur'
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      // Endpoint sugerido para solicitar recuperación
      const res = await api.post('/auth/forgot-password', { email: data.email.trim() });
      if (res.data.success || res.status === 200) {
        Swal.fire({
          icon: 'success',
          title: 'Código Enviado',
          text: 'Revisa tu correo electrónico para obtener el código de recuperación.',
          confirmButtonColor: '#ea580c'
        });
        navigate('/reset-password', { 
          state: { 
            email: data.email.trim(),
            recoveryToken: res.data.recoveryToken // <--- Se envía el token
          } 
        });
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.response?.data?.message || 'No se pudo enviar el correo de recuperación'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-['Outfit']">
      <Link to="/login" className="absolute top-8 left-8 flex items-center gap-2 px-5 py-3 bg-white rounded-full shadow-sm border border-slate-200 text-slate-600 hover:text-orange-600 hover:border-orange-200 hover:bg-orange-50 transition-all no-underline font-black text-xs uppercase tracking-widest z-50">
        <ArrowLeft size={16} strokeWidth={3} />
        Volver al Login
      </Link>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-[40px] shadow-2xl shadow-orange-500/10 p-10 border border-gray-100"
      >
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-orange-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-orange-600/10">
            <Send className="text-orange-600" size={32} />
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Recuperar Contraseña</h2>
          <p className="text-slate-400 font-medium mt-2">Ingresa tu correo para recibir un código de recuperación</p>
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

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-orange-600 text-white rounded-2xl font-black text-sm hover:bg-orange-700 shadow-xl shadow-orange-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                Enviar Código
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
