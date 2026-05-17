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
    rol: 'cliente'
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validate = () => {
    const newErrors = {};
    if (!formData.nombre.trim()) newErrors.nombre = 'El nombre es obligatorio';
    if (!formData.email) {
      newErrors.email = 'El correo es obligatorio';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El formato del correo no es válido';
    }
    
    if (!formData.cedula) {
      newErrors.cedula = 'La cédula es obligatoria';
    } else if (!/^\d{6,12}$/.test(formData.cedula)) {
      newErrors.cedula = 'Cédula inválida (6-12 dígitos)';
    }

    if (!formData.celular) {
      newErrors.celular = 'El celular es obligatorio';
    } else if (!/^\d{10}$/.test(formData.celular)) {
      newErrors.celular = 'Celular debe tener 10 dígitos';
    }

    if (!formData.password) {
      newErrors.password = 'La contraseña es obligatoria';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mínimo 6 caracteres';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validate()) return;

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
        title: 'Error de Registro',
        text: err.response?.data?.message || 'Hubo un problema al crear tu cuenta. Intenta de nuevo.'
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
                <User className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${errors.nombre ? 'text-red-400' : 'text-slate-300'}`} size={16} />
                <input 
                  type="text"
                  value={formData.nombre}
                  onChange={e => {
                    setFormData({...formData, nombre: e.target.value});
                    if (errors.nombre) setErrors({...errors, nombre: null});
                  }}
                  className={`w-full bg-gray-50 border-2 rounded-xl pl-11 pr-4 py-3 text-sm font-bold transition-all outline-none ${
                    errors.nombre ? 'border-red-100 bg-red-50/30' : 'border-transparent focus:ring-2 focus:ring-orange-500'
                  }`}
                />
              </div>
              {errors.nombre && <p className="text-[8px] font-bold text-red-500 px-1">{errors.nombre}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Correo Electrónico</label>
              <div className="relative">
                <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${errors.email ? 'text-red-400' : 'text-slate-300'}`} size={16} />
                <input 
                  type="email"
                  value={formData.email}
                  onChange={e => {
                    setFormData({...formData, email: e.target.value});
                    if (errors.email) setErrors({...errors, email: null});
                  }}
                  className={`w-full bg-gray-50 border-2 rounded-xl pl-11 pr-4 py-3 text-sm font-bold transition-all outline-none ${
                    errors.email ? 'border-red-100 bg-red-50/30' : 'border-transparent focus:ring-2 focus:ring-orange-500'
                  }`}
                />
              </div>
              {errors.email && <p className="text-[8px] font-bold text-red-500 px-1">{errors.email}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Cédula</label>
              <div className="relative">
                <Users className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${errors.cedula ? 'text-red-400' : 'text-slate-300'}`} size={16} />
                <input 
                  type="text"
                  value={formData.cedula}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, '');
                    setFormData({...formData, cedula: val});
                    if (errors.cedula) setErrors({...errors, cedula: null});
                  }}
                  className={`w-full bg-gray-50 border-2 rounded-xl pl-11 pr-4 py-3 text-sm font-bold transition-all outline-none ${
                    errors.cedula ? 'border-red-100 bg-red-50/30' : 'border-transparent focus:ring-2 focus:ring-orange-500'
                  }`}
                />
              </div>
              {errors.cedula && <p className="text-[8px] font-bold text-red-500 px-1">{errors.cedula}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Celular</label>
              <div className="relative">
                <div className={`absolute left-4 top-1/2 -translate-y-1/2 font-bold text-xs transition-colors ${errors.celular ? 'text-red-400' : 'text-slate-300'}`}>📞</div>
                <input 
                  type="text"
                  value={formData.celular}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setFormData({...formData, celular: val});
                    if (errors.celular) setErrors({...errors, celular: null});
                  }}
                  className={`w-full bg-gray-50 border-2 rounded-xl pl-11 pr-4 py-3 text-sm font-bold transition-all outline-none ${
                    errors.celular ? 'border-red-100 bg-red-50/30' : 'border-transparent focus:ring-2 focus:ring-orange-500'
                  }`}
                />
              </div>
              {errors.celular && <p className="text-[8px] font-bold text-red-500 px-1">{errors.celular}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Contraseña</label>
              <div className="relative">
                <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${errors.password ? 'text-red-400' : 'text-slate-300'}`} size={16} />
                <input 
                  type="password"
                  value={formData.password}
                  onChange={e => {
                    setFormData({...formData, password: e.target.value});
                    if (errors.password) setErrors({...errors, password: null});
                  }}
                  className={`w-full bg-gray-50 border-2 rounded-xl pl-11 pr-4 py-3 text-sm font-bold transition-all outline-none ${
                    errors.password ? 'border-red-100 bg-red-50/30' : 'border-transparent focus:ring-2 focus:ring-orange-500'
                  }`}
                />
              </div>
              {errors.password && <p className="text-[8px] font-bold text-red-500 px-1">{errors.password}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Confirmar</label>
              <div className="relative">
                <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${errors.confirmPassword ? 'text-red-400' : 'text-slate-300'}`} size={16} />
                <input 
                  type="password"
                  value={formData.confirmPassword}
                  onChange={e => {
                    setFormData({...formData, confirmPassword: e.target.value});
                    if (errors.confirmPassword) setErrors({...errors, confirmPassword: null});
                  }}
                  className={`w-full bg-gray-50 border-2 rounded-xl pl-11 pr-4 py-3 text-sm font-bold transition-all outline-none ${
                    errors.confirmPassword ? 'border-red-100 bg-red-50/30' : 'border-transparent focus:ring-2 focus:ring-orange-500'
                  }`}
                />
              </div>
              {errors.confirmPassword && <p className="text-[8px] font-bold text-red-500 px-1">{errors.confirmPassword}</p>}
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
