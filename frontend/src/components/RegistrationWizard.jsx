import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowLeft, ArrowRight, Check, User, Phone, CreditCard, Upload, Download, ExternalLink, Copy } from 'lucide-react';
import api from '../services/api';
import Swal from 'sweetalert2';

export default function RegistrationWizard({ isOpen, onClose, initialPlan = 'quincenal' }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    nombre: '',
    documento: '',
    facturacion: false,
    telefono: '',
    email: '',
    tipoEntrega: 'fija',
    direccion: '',
    barrio: '',
    days_address_1: 'Lunes,Martes,Miércoles,Jueves,Viernes',
    direccion2: '',
    barrio2: '',
    days_address_2: '',
    plan: initialPlan,
    alergias: '',
    restricciones: '',
    tieneCocas: false,
    comprobanteFile: null,
    comprobanteName: '',
    fecha_inicio: '',
    paymentMethod: 'bancolombia'
  });
  const [copied, setCopied] = useState(false);
  const [recognizedClient, setRecognizedClient] = useState(null);
  const [holidays, setHolidays] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [selectedQr, setSelectedQr] = useState(null);

  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        const res = await api.get('/feriados');
        if (res.data.success) setHolidays(res.data.feriados.map(h => h.fecha));
      } catch (err) {
        console.error("Error al cargar festivos:", err);
      }
    };
    const fetchAvailability = async () => {
      try {
        const res = await api.get('/availability');
        if (res.data.success) {
          setAvailability(res.data.availability);
          // Seleccionar el primero disponible por defecto
          const firstAvailable = res.data.availability.find(a => a.disponible);
          if (firstAvailable) {
            setFormData(prev => ({ ...prev, fecha_inicio: firstAvailable.fecha }));
          }
        }
      } catch (err) {
        console.error("Error al cargar disponibilidad:", err);
      }
    };
    fetchHolidays();
    fetchAvailability();
  }, []);

  useEffect(() => {
    if (isOpen) {
      setFormData(prev => ({ ...prev, plan: initialPlan }));
    }
  }, [isOpen, initialPlan]);

  const totalSteps = 4;
  const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

  const checkExistingClient = async (cedula) => {
    if (!cedula || cedula.length < 5) return;
    try {
      const res = await api.get(`/check-client/${cedula}`);
      if (res.data.success && res.data.found) {
        const c = res.data.cliente;
        setRecognizedClient(c);
        setFormData(prev => ({
          ...prev,
          nombre: c.nombre,
          email: c.correo,
          telefono: c.celular,
          direccion: c.ultimaDireccion?.direccion || prev.direccion,
          barrio: c.ultimaDireccion?.barrio || prev.barrio
        }));
        Swal.fire({
          icon: 'success',
          title: `¡Hola de nuevo, ${c.nombre.split(' ')[0]}!`,
          text: 'Hemos recuperado tus datos para que tu renovación sea más rápida.',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 4000
        });
      }
    } catch (err) {
      console.error("Error checking client:", err);
    }
  };

  const plans = {
    semanal: { name: 'Semanal', price: 75000 },
    quincenal: { name: 'Quincenal', price: 150000 },
    mensual: { name: 'Mensual', price: 285000 }
  };

  const handleNext = () => {
    if (validateStep()) {
      if (step < totalSteps) setStep(step + 1);
      else handleSubmit();
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const validateStep = () => {
    if (step === 1) {
      if (!formData.nombre.trim() || formData.nombre.length < 3) {
        showError('Ingresa un nombre válido'); return false;
      }
      if (!formData.documento.trim() || formData.documento.length < 5) {
        showError('Documento inválido'); return false;
      }
      if (!formData.fecha_inicio) {
        showError('Selecciona una fecha de inicio'); return false;
      }
    }
    if (step === 2) {
      if (!formData.email.includes('@')) {
        showError('Correo electrónico inválido'); return false;
      }
      if (formData.telefono.length !== 10) {
        showError('El celular debe tener 10 números'); return false;
      }
    }
    if (step === 3) {
      if (!formData.direccion.trim() || !formData.barrio.trim()) {
        showError('Completa los datos de dirección'); return false;
      }
      if (formData.tipoEntrega === 'hibrida') {
        if (!formData.direccion2.trim() || !formData.barrio2.trim()) {
          showError('Completa la segunda dirección'); return false;
        }
      }
    }
    if (step === 4) {
      if (!formData.comprobanteFile) {
        showError('Debes adjuntar el comprobante'); return false;
      }
      if (!formData.terms) {
        showError('Debes aceptar los términos'); return false;
      }
    }
    return true;
  };

  const showError = (msg) => {
    Swal.fire({ toast: true, position: 'bottom-end', icon: 'error', title: msg, showConfirmButton: false, timer: 3000 });
  };

  const toggleDay = (day) => {
    let currentDays = formData.days_address_1 ? formData.days_address_1.split(',') : [];
    if (currentDays.includes(day)) {
      currentDays = currentDays.filter(d => d !== day);
    } else {
      currentDays.push(day);
    }
    const d1 = daysOfWeek.filter(d => currentDays.includes(d)).join(',');
    const d2 = daysOfWeek.filter(d => !currentDays.includes(d)).join(',');
    setFormData({ ...formData, days_address_1: d1, days_address_2: d2 });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, comprobanteFile: file, comprobanteName: file.name });
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Copiado al portapapeles',
      showConfirmButton: false,
      timer: 1500
    });
  };

  const downloadQr = (url, name) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `QR_Jacks_${name}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Iniciando descarga...', showConfirmButton: false, timer: 1500 });
  };

  const paymentMethods = {
    bancolombia: {
      name: 'Bancolombia',
      icon: '/logoBancolombia.png',
      account: '238-000045-84',
      type: 'Ahorros',
      holder: 'Alejandro Gómez Mesa',
      qr: '/qr_bancolombia.png',
      appUrl: 'bancolombia://'
    },
    nequi: {
      name: 'Nequi',
      icon: '/LogoNequi.jpg',
      account: '3116437887',
      type: 'Nequi',
      holder: 'Alejandro Gómez Mesa',
      qr: '/qr_nequi.png',
      appUrl: 'nequi://'
    },
    daviplata: {
      name: 'Daviplata',
      icon: '/LogoDaviplata.jpg',
      account: '3116437887',
      type: 'Daviplata',
      holder: 'Alejandro Gómez Mesa',
      qr: '/qr_daviplata.png',
      appUrl: 'daviplata://'
    }
  };

  const openBankApp = (scheme) => {
    window.location.href = scheme;
    setTimeout(() => {
      // Si después de 2 segundos no se abrió nada, es probable que no esté instalada o estemos en PC
      Swal.fire({
        toast: true,
        position: 'bottom-end',
        icon: 'info',
        title: 'Intentando abrir la app...',
        text: 'Si no abre, asegúrate de tener la app instalada en tu móvil.',
        showConfirmButton: false,
        timer: 3000
      });
    }, 500);
  };

  const getAdjustedPriceInfo = () => {
    const currentPlan = plans[formData.plan];
    if (!currentPlan) return { total: 0, discount: 0, effectiveDays: 5 };

    const cocasPrice = formData.tieneCocas ? 0 : 70000;
    
    if (!formData.fecha_inicio) return { total: currentPlan.price + cocasPrice, discount: 0, effectiveDays: 5 };

    const monday = new Date(formData.fecha_inicio + 'T12:00:00');
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);

    const fmt = (d) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dayStr = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${dayStr}`;
    };
    
    let holidaysFound = 0;
    const current = new Date(monday);
    while (current <= friday) {
      if (holidays.includes(fmt(current))) holidaysFound++;
      current.setDate(current.getDate() + 1);
    }
    
    // Solo ajustamos para el plan Semanal (5 días) por ahora, según la regla
    let planPrice = currentPlan.price;
    let discount = 0;
    if (formData.plan === 'semanal' && holidaysFound > 0) {
      const dailyRate = currentPlan.price / 5;
      discount = dailyRate * holidaysFound;
      planPrice = currentPlan.price - discount;
    }

    return {
      total: planPrice + cocasPrice,
      discount,
      effectiveDays: 5 - holidaysFound,
      holidaysFound
    };
  };

  const priceInfo = getAdjustedPriceInfo();

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'comprobanteFile') {
          data.append('comprobante', formData[key]);
        } else {
          data.append(key, formData[key]);
        }
      });
      
      data.set('cedula', formData.documento);
      data.set('celular', formData.telefono);
      data.set('plan', formData.plan.charAt(0).toUpperCase() + formData.plan.slice(1));
      data.set('needs_cocas', !formData.tieneCocas);
      data.set('delivery_type', formData.tipoEntrega === 'fija' ? 'Fija' : 'Hibrida');
      data.set('address_1', formData.direccion);
      data.set('barrio_1', formData.barrio);
      data.set('days_address_1', formData.days_address_1);
      
      if (formData.tipoEntrega === 'hibrida') {
        data.set('address_2', formData.direccion2);
        data.set('barrio_2', formData.barrio2);
        data.set('days_address_2', formData.days_address_2);
      }
      
      data.set('facturacionElectronica', formData.facturacion ? 'Si' : 'No');
      data.set('fecha_inicio', formData.fecha_inicio);

      const res = await api.post('/orders', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.status === 200 || res.status === 201) {
        Swal.fire({ icon: 'success', title: '¡Reserva Exitosa!', text: 'Te contactaremos por WhatsApp para validar tu pago.', confirmButtonColor: '#ea580c' });
        
        // Reset Form
        setFormData({
          nombre: '', documento: '', facturacion: false, telefono: '', email: '',
          tipoEntrega: 'fija', direccion: '', barrio: '',
          days_address_1: 'Lunes,Martes,Miércoles,Jueves,Viernes',
          direccion2: '', barrio2: '', days_address_2: '',
          plan: initialPlan, alergias: '', restricciones: '',
          tieneCocas: false, terms: false, comprobanteFile: null, comprobanteName: ''
        });
        setStep(1);
        onClose();
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Error desconocido al enviar reserva';
      showError(msg);
      console.error('Error en submit:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const currentPlan = plans[formData.plan];
  const totalPrice = currentPlan.price + (formData.tieneCocas ? 0 : 70000);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-xl rounded-[24px] md:rounded-[32px] shadow-2xl relative flex flex-col max-h-[95vh] md:max-h-[90vh] overflow-hidden"
      >
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 z-10">
          <X size={24} />
        </button>

        <div className="flex-1 overflow-y-auto p-6 md:p-8 pb-4 custom-scrollbar">
          <h2 className="text-2xl font-black mb-1">Reserva tu Cupo</h2>
          <p className="text-gray-500 text-sm font-medium mb-6">Completa los pasos para asegurar tu lugar</p>

          <div className="mb-8">
            <div className="flex justify-between text-[11px] font-black uppercase tracking-wider text-gray-400 mb-2">
              <span>Paso {step} de {totalSteps}</span>
              <span>{Math.round((step/totalSteps)*100)}% Completado</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-orange-500"
                initial={{ width: 0 }}
                animate={{ width: `${(step/totalSteps)*100}%` }}
              />
            </div>
          </div>

          <div className="flex justify-between mb-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className={`flex flex-col items-center gap-2 flex-1 relative`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black transition-colors ${
                  step >= i ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' : 'bg-gray-100 text-gray-400'
                }`}>
                  {step > i ? <Check size={18} strokeWidth={4} /> : i}
                </div>
                {i < 4 && (
                  <div className={`absolute top-5 left-[60%] w-[80%] h-0.5 ${step > i ? 'bg-orange-500' : 'bg-gray-100'}`}></div>
                )}
              </div>
            ))}
          </div>

          <div className="min-h-[350px]">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div 
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="bg-orange-50 p-4 rounded-2xl flex gap-3 border border-orange-100 text-slate-900">
                    <User className="text-orange-500 shrink-0" size={20} />
                    <p className="text-xs font-bold text-orange-800 leading-relaxed">
                      Información Personal: Comencemos con tus datos legales y el plan
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Nombre Completo</label>
                      <input 
                        className="w-full bg-gray-50 border-none rounded-xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-orange-500 transition-all font-medium text-slate-900"
                        value={formData.nombre}
                        onChange={e => setFormData({...formData, nombre: e.target.value})}
                        placeholder="Ej: María Pérez"
                      />
                    </div>
                    <div className="space-y-2 relative">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Documento / CC</label>
                      <input 
                        className="w-full bg-gray-50 border-none rounded-xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-orange-500 transition-all font-medium text-slate-900"
                        value={formData.documento}
                        onChange={e => setFormData({...formData, documento: e.target.value.replace(/\D/g,'')})}
                        onBlur={e => checkExistingClient(e.target.value)}
                        placeholder="Ej: 1017..."
                      />
                      {recognizedClient && (
                         <div className="absolute -top-1 right-0 text-[9px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100 flex items-center gap-1">
                            <Check size={10} /> RECONOCIDO
                         </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Selecciona tu Plan</label>
                    <div className="grid grid-cols-3 gap-3">
                      {Object.entries(plans).map(([id, p]) => (
                        <button 
                          key={id}
                          onClick={() => setFormData({...formData, plan: id})}
                          className={`p-4 rounded-2xl border-2 transition-all text-left ${
                            formData.plan === id ? 'border-orange-500 bg-orange-50 shadow-sm' : 'border-gray-100 hover:border-orange-200'
                          }`}
                        >
                          <div className="text-[10px] font-black uppercase text-gray-400 mb-1">{p.name}</div>
                          <div className="text-lg font-black text-orange-600">${(p.price/1000).toFixed(0)}K</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">¿Cuándo deseas iniciar?</label>
                    <div className="grid grid-cols-2 gap-3">
                      {availability.map((a, idx) => (
                        <button 
                          key={a.fecha}
                          disabled={!a.disponible}
                          onClick={() => setFormData({...formData, fecha_inicio: a.fecha})}
                          className={`p-3 rounded-xl border-2 transition-all text-left relative ${
                            formData.fecha_inicio === a.fecha 
                              ? 'border-orange-500 bg-orange-50 shadow-sm' 
                              : a.disponible 
                                ? 'border-gray-100 hover:border-orange-200' 
                                : 'border-gray-50 bg-gray-50 opacity-50 cursor-not-allowed'
                          }`}
                        >
                          <div className="text-[9px] font-black uppercase text-gray-400 mb-1">
                            Semana del {new Date(a.fecha + 'T12:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                          </div>
                          <div className={`text-xs font-black ${!a.disponible ? 'text-gray-400' : 'text-slate-700'}`}>
                            {!a.disponible ? 'AGOTADO' : (idx === 0 ? 'Próxima Semana' : 'Reserva Futura')}
                          </div>
                          {formData.fecha_inicio === a.fecha && (
                            <div className="absolute top-2 right-2 text-orange-500">
                              <Check size={14} strokeWidth={4} />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                    {availability[0] && !availability[0].disponible && formData.fecha_inicio !== availability[0].fecha && (
                       <p className="text-[10px] font-bold text-orange-600 bg-orange-50 p-2 rounded-lg border border-orange-100">
                         ⚠️ La próxima semana está llena. Hemos seleccionado la siguiente fecha disponible para ti.
                       </p>
                    )}
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div 
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="bg-blue-50 p-4 rounded-2xl flex gap-3 border border-blue-100 text-slate-900">
                    <Phone className="text-blue-500 shrink-0" size={20} />
                    <p className="text-xs font-bold text-blue-800 leading-relaxed">
                      Contacto: Vital para enviarte el menú semanal por WhatsApp
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Correo Electrónico</label>
                    <input 
                      type="email"
                      className="w-full bg-gray-50 border-none rounded-xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-orange-500 transition-all font-medium text-slate-900"
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                      placeholder="ejemplo@correo.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Celular (WhatsApp)</label>
                    <input 
                      type="tel"
                      className="w-full bg-gray-50 border-none rounded-xl px-4 py-3.5 text-sm focus:ring-2 focus:ring-orange-500 transition-all font-medium text-slate-900"
                      value={formData.telefono}
                      onChange={e => setFormData({...formData, telefono: e.target.value.replace(/\D/g,'').slice(0,10)})}
                      placeholder="3001234567"
                    />
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div 
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setFormData({...formData, tipoEntrega: 'fija'})}
                      className={`flex-1 p-5 rounded-[28px] border-2 transition-all text-left relative overflow-hidden ${
                        formData.tipoEntrega === 'fija' ? 'border-orange-500 bg-orange-50/50 shadow-sm' : 'border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-3 ${formData.tipoEntrega === 'fija' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                        <Check size={16} strokeWidth={3} />
                      </div>
                      <div className="text-sm font-black text-slate-900">Punto Fijo</div>
                      <div className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Oficina o Casa</div>
                    </button>
                    <button 
                      onClick={() => setFormData({...formData, tipoEntrega: 'hibrida'})}
                      className={`flex-1 p-5 rounded-[28px] border-2 transition-all text-left relative overflow-hidden ${
                        formData.tipoEntrega === 'hibrida' ? 'border-blue-500 bg-blue-50/50 shadow-sm' : 'border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-3 ${formData.tipoEntrega === 'hibrida' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                        <Check size={16} strokeWidth={3} />
                      </div>
                      <div className="text-sm font-black text-slate-900">Híbrida</div>
                      <div className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Dos Lugares</div>
                    </button>
                  </div>

                  {formData.tipoEntrega === 'hibrida' && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-4 bg-blue-600 rounded-3xl text-white shadow-xl shadow-blue-200"
                    >
                       <div className="text-xs font-black uppercase mb-1 flex items-center gap-2">
                         ✨ Modo Híbrido Activado
                       </div>
                       <p className="text-[10px] font-bold text-blue-100 leading-tight">
                         Podrás repartir tus días entre dos lugares. Por ejemplo: Oficina Lun/Mie y Casa Mar/Jue.
                       </p>
                    </motion.div>
                  )}

                  <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-4">
                    <h5 className="text-xs font-black uppercase text-gray-400 tracking-widest">
                      {formData.tipoEntrega === 'hibrida' ? 'Dirección 1' : 'Dirección de Entrega'}
                    </h5>
                    <div className="grid grid-cols-2 gap-3">
                      <input 
                        className="bg-white border-none rounded-xl px-4 py-3 text-sm font-medium text-slate-900"
                        value={formData.direccion}
                        onChange={e => setFormData({...formData, direccion: e.target.value})}
                        placeholder="Dirección"
                      />
                      <input 
                        className="bg-white border-none rounded-xl px-4 py-3 text-sm font-medium text-slate-900"
                        value={formData.barrio}
                        onChange={e => setFormData({...formData, barrio: e.target.value})}
                        placeholder="Barrio"
                      />
                    </div>
                    {formData.tipoEntrega === 'hibrida' && (
                      <div className="flex flex-wrap gap-2 pt-2">
                        {daysOfWeek.map(d => (
                          <button 
                            key={d}
                            onClick={() => toggleDay(d)}
                            className={`px-3 py-1.5 rounded-full text-[10px] font-black transition-all ${
                              formData.days_address_1.includes(d) ? 'bg-orange-500 text-white' : 'bg-white text-gray-400 border border-gray-100'
                            }`}
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {formData.tipoEntrega === 'hibrida' && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-4"
                    >
                      <h5 className="text-xs font-black uppercase text-gray-400 tracking-widest">Dirección 2</h5>
                      <div className="grid grid-cols-2 gap-3">
                        <input 
                          className="bg-white border-none rounded-xl px-4 py-3 text-sm font-medium text-slate-900"
                          value={formData.direccion2}
                          onChange={e => setFormData({...formData, direccion2: e.target.value})}
                          placeholder="Dirección"
                        />
                        <input 
                          className="bg-white border-none rounded-xl px-4 py-3 text-sm font-medium text-slate-900"
                          value={formData.barrio2}
                          onChange={e => setFormData({...formData, barrio2: e.target.value})}
                          placeholder="Barrio"
                        />
                      </div>
                      <div className="flex flex-wrap gap-2 pt-2 opacity-60">
                        {formData.days_address_2.split(',').map(d => d && (
                          <span key={d} className="px-3 py-1.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-700">
                            {d}
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {step === 4 && (
                <motion.div 
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 space-y-3">
                    <label className="text-xs font-black text-amber-800 uppercase tracking-widest flex items-center gap-2">
                      <CreditCard size={16} /> ¿Tienes los 2 juegos de cocas?
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={() => setFormData({...formData, tieneCocas: true})}
                        className={`py-3 rounded-xl font-bold text-xs transition-all ${
                          formData.tieneCocas ? 'bg-orange-500 text-white shadow-md' : 'bg-white text-gray-500'
                        }`}
                      >
                        Ya los tengo
                      </button>
                      <button 
                        onClick={() => setFormData({...formData, tieneCocas: false})}
                        className={`py-3 rounded-xl font-bold text-xs transition-all ${
                          !formData.tieneCocas ? 'bg-orange-500 text-white shadow-md' : 'bg-white text-gray-500'
                        }`}
                      >
                        Deseo comprarlos
                      </button>
                    </div>
                  </div>

                  {/* 1. Total Final */}
                  <div className="bg-slate-900 text-white p-6 rounded-2xl flex justify-between items-center shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                    <div>
                      <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Total Final</div>
                      <div className="text-3xl font-black">${priceInfo.total.toLocaleString()}</div>
                      <div className="text-[10px] font-bold text-slate-400 mt-1">
                        Plan + Cocas {priceInfo.discount > 0 && <span className="text-orange-400 font-black">• DESCUENTO APLICADO</span>}
                      </div>
                    </div>
                    {priceInfo.discount > 0 && (
                      <div className="text-right">
                        <div className="bg-orange-500 text-white px-3 py-1 rounded-full text-[10px] font-black animate-bounce mb-2">
                          -${priceInfo.discount.toLocaleString()}
                        </div>
                        <div className="text-[9px] font-bold text-orange-200 uppercase">
                          {priceInfo.holidaysFound} DÍA(S) FESTIVO(S)
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 2. Métodos de Pago */}
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block ml-1">Selecciona cómo pagar</label>
                    <div className="flex bg-slate-100/50 p-1 rounded-2xl gap-1 border border-slate-100">
                      {Object.entries(paymentMethods).map(([id, method]) => (
                        <button
                          key={id}
                          onClick={() => setFormData({ ...formData, paymentMethod: id })}
                          className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all flex items-center justify-center gap-2 ${
                            formData.paymentMethod === id 
                              ? 'bg-white text-slate-900 shadow-sm' 
                              : 'text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          <img src={method.icon} alt={method.name} className="h-4 w-4 object-contain opacity-80" />
                          {method.name}
                        </button>
                      ))}
                    </div>

                    <AnimatePresence mode="wait">
                      <motion.div
                        key={formData.paymentMethod}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="space-y-4"
                      >
                        {/* Info Card */}
                        <div className="bg-white border border-slate-100 rounded-[28px] p-6 shadow-sm space-y-5">
                          <div className="flex justify-between items-center">
                            <div className="space-y-1">
                              <div className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Cuenta {paymentMethods[formData.paymentMethod].type}</div>
                              <div className="flex items-center gap-3">
                                <span className="text-2xl font-black text-slate-900 tracking-tighter">
                                  {paymentMethods[formData.paymentMethod].account}
                                </span>
                                <button 
                                  onClick={() => copyToClipboard(paymentMethods[formData.paymentMethod].account)}
                                  className={`p-2.5 rounded-xl transition-all shadow-sm ${copied ? 'bg-green-500 text-white' : 'bg-slate-50 text-slate-400 hover:text-orange-500 hover:bg-orange-50'}`}
                                >
                                  {copied ? <Check size={16} strokeWidth={3} /> : <Copy size={16} strokeWidth={3} />}
                                </button>
                              </div>
                            </div>
                            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center p-2 border border-slate-100 shadow-inner">
                              <img src={paymentMethods[formData.paymentMethod].icon} alt="logo" className="w-full h-full object-contain" />
                            </div>
                          </div>

                          <div className="flex items-end justify-between pt-4 border-t border-slate-50">
                            <div className="space-y-3">
                              <div>
                                <div className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Titular</div>
                                <div className="text-sm font-black text-slate-700">{paymentMethods[formData.paymentMethod].holder}</div>
                              </div>
                              <button 
                                onClick={() => downloadQr(paymentMethods[formData.paymentMethod].qr, paymentMethods[formData.paymentMethod].name)}
                                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-orange-600 transition-colors bg-slate-50 px-4 py-2 rounded-xl border border-slate-100"
                              >
                                 <Download size={14} strokeWidth={3} /> Guardar QR
                              </button>
                            </div>
                            
                            <div 
                              onClick={() => {
                                setSelectedQr(paymentMethods[formData.paymentMethod]);
                                setIsQrModalOpen(true);
                              }}
                              className="relative w-20 h-20 bg-slate-50 rounded-2xl border border-slate-100 p-2 shadow-sm cursor-pointer group hover:border-orange-200 transition-all"
                            >
                               <img src={paymentMethods[formData.paymentMethod].qr} alt="QR" className="w-full h-full object-contain opacity-40 group-hover:opacity-100 transition-opacity" />
                               <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                                  <div className="bg-white/90 backdrop-blur-sm p-1.5 rounded-lg shadow-xl">
                                     <ExternalLink size={12} className="text-orange-500" />
                                  </div>
                               </div>
                               <div className="absolute -bottom-1 -right-1 bg-orange-500 text-white p-1 rounded-lg shadow-lg">
                                  <Check size={8} strokeWidth={4} />
                                </div>
                            </div>
                          </div>
                        </div>

                        {/* Botón Abrir App AFUERA de la card y más redondo */}
                        <button 
                          onClick={() => openBankApp(paymentMethods[formData.paymentMethod].appUrl)}
                          className="w-full py-4 bg-slate-900 hover:bg-orange-600 text-white rounded-full font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl shadow-slate-900/10 active:scale-95 group"
                        >
                          <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center group-hover:bg-white/20 transition-colors">
                            <ExternalLink size={16} strokeWidth={3} />
                          </div>
                          Ir a la App de {paymentMethods[formData.paymentMethod].name}
                        </button>
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  {/* 3. Subida de Comprobante */}
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block ml-1">Adjuntar Pago</label>
                    <div 
                      onClick={() => fileInputRef.current.click()}
                      className="group border-2 border-dashed border-slate-200 hover:border-orange-400 rounded-[32px] p-8 text-center cursor-pointer transition-all bg-slate-50 hover:bg-orange-50"
                    >
                      <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm group-hover:scale-110 transition-transform">
                        <Upload className="text-slate-300 group-hover:text-orange-500 transition-colors" size={28} />
                      </div>
                      <div className="text-sm font-black text-slate-600 group-hover:text-orange-700">
                        {formData.comprobanteName || 'Subir Comprobante de Pago'}
                      </div>
                      <p className="text-[9px] text-slate-400 mt-2 font-black uppercase tracking-widest">Imagen o PDF del recibo</p>
                      <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative">
                        <input 
                          type="checkbox" 
                          className="peer hidden"
                          checked={formData.facturacion}
                          onChange={e => setFormData({...formData, facturacion: e.target.checked})}
                        />
                        <div className="w-5 h-5 border-2 border-gray-200 rounded-md peer-checked:bg-orange-500 peer-checked:border-orange-500 transition-all flex items-center justify-center">
                          <Check size={14} className="text-white scale-0 peer-checked:scale-100 transition-transform" />
                        </div>
                      </div>
                      <span className="text-xs font-bold text-gray-500 group-hover:text-slate-900 transition-colors">¿Requiere Facturación Electrónica?</span>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      className="mt-1 w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                      checked={formData.terms}
                      onChange={e => setFormData({...formData, terms: e.target.checked})}
                    />
                    <span className="text-xs font-medium text-gray-500 leading-relaxed group-hover:text-gray-700">
                      He leído y acepto las <span className="text-orange-500 font-bold underline">Políticas y Condiciones</span> del servicio.
                    </span>
                  </label>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="p-6 md:p-8 pt-4 border-t border-gray-50 flex gap-4 bg-white shrink-0">
          <button 
            disabled={step === 1 || loading}
            onClick={handleBack}
            className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-2xl font-black transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <ArrowLeft size={18} strokeWidth={3} />
            Atrás
          </button>
          <button 
            disabled={loading}
            onClick={handleNext}
            className="flex-[2] py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/30"
          >
            {loading ? (
              <span className="animate-spin text-xl">↻</span>
            ) : (
              <>
                {step === totalSteps ? 'Confirmar Reserva' : 'Siguiente'}
                <ArrowRight size={18} strokeWidth={3} />
              </>
            )}
          </button>
        </div>

        {/* QR Expansion Modal */}
        <AnimatePresence>
           {isQrModalOpen && selectedQr && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-[250] flex items-center justify-center p-6 bg-slate-900/95 backdrop-blur-xl rounded-[inherit]"
              >
                 <motion.div 
                   initial={{ scale: 0.9, y: 20 }}
                   animate={{ scale: 1, y: 0 }}
                   exit={{ scale: 0.9, y: 20 }}
                   className="bg-white p-8 rounded-[40px] shadow-2xl max-w-sm w-full text-center relative"
                 >
                    <button 
                      onClick={() => setIsQrModalOpen(false)}
                      className="absolute -top-4 -right-4 bg-orange-500 text-white p-3 rounded-2xl shadow-xl hover:bg-orange-600 transition-colors"
                    >
                       <X size={24} strokeWidth={3} />
                    </button>

                    <div className="mb-6">
                       <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full mb-4">
                          <img src={selectedQr.icon} alt="logo" className="h-4 w-4 object-contain" />
                          <span className="text-xs font-black uppercase tracking-widest text-slate-900">{selectedQr.name}</span>
                       </div>
                       <h3 className="text-xl font-black text-slate-900">Código QR de Pago</h3>
                    </div>

                    <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 mb-8 shadow-inner">
                       <img src={selectedQr.qr} alt="QR Pago" className="w-full h-auto rounded-2xl" />
                    </div>

                    <div className="space-y-4">
                       <button 
                         onClick={() => downloadQr(selectedQr.qr, selectedQr.name)}
                         className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-orange-500 transition-all shadow-xl shadow-slate-900/10 active:scale-95"
                       >
                          <Download size={20} strokeWidth={3} /> Guardar Imagen
                       </button>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Escanea desde tu app de banco</p>
                    </div>
                 </motion.div>
              </motion.div>
           )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
