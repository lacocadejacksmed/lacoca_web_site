import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import api from '../services/api';
import Swal from 'sweetalert2';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { clientCreatorSchema } from '../schemas/clientCreatorSchema';

import StepPersonalData from './ClientCreator/StepPersonalData';
import StepContactInfo from './ClientCreator/StepContactInfo';
import StepDelivery from './ClientCreator/StepDelivery';
import StepPayment from './ClientCreator/StepPayment';

export default function ClientCreatorModal({ onClose, onUpdate, plans }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [holidays, setHolidays] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [recognizedClient, setRecognizedClient] = useState(null);

  const initialPlanId = plans && Object.keys(plans).length > 0 ? Object.keys(plans)[0] : 'quincenal';

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors, isValid }
  } = useForm({
    resolver: zodResolver(clientCreatorSchema),
    defaultValues: {
      nombre: '',
      documento: '',
      plan: initialPlanId,
      fecha_inicio: '',
      email: '',
      telefono: '',
      alergias: '',
      restricciones: '',
      tipoEntrega: 'fija',
      direccion: '',
      barrio: '',
      days_address_1: 'Lunes,Martes,Miércoles,Jueves,Viernes',
      direccion2: '',
      barrio2: '',
      days_address_2: '',
      zona_1: '',
      lat_1: undefined,
      lng_1: undefined,
      zona_2: '',
      lat_2: undefined,
      lng_2: undefined,
      tieneCocas: false,
      paymentMethod: 'bancolombia',
      facturacion: false,
      terms: false,
      comprobanteFile: null,
      comprobanteName: ''
    },
    mode: 'onChange'
  });

  const totalSteps = 4;

  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        const res = await api.get('/feriados');
        if (res.data?.success) setHolidays(res.data.feriados.map(h => h.fecha));
      } catch (err) {
        console.error("Error al cargar festivos:", err);
      }
    };
    fetchHolidays();
  }, []);

  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        const res = await api.get('/availability');
        if (res.data?.success) {
          setAvailability(res.data.availability);
          const firstAvailable = res.data.availability.find(a => a.disponible);
          if (firstAvailable) {
            setValue('fecha_inicio', firstAvailable.fecha);
          }
        }
      } catch (err) {
        console.error("Error al cargar disponibilidad:", err);
        const fallback = [];
        const start = new Date();
        const day = start.getDay();
        const daysToNextMonday = (day === 0) ? 1 : (8 - day);
        let currentMonday = new Date(start);
        currentMonday.setDate(start.getDate() + daysToNextMonday);
        for(let i=0; i<4; i++) {
          fallback.push({ fecha: currentMonday.toISOString().split('T')[0], disponible: true });
          currentMonday.setDate(currentMonday.getDate() + 7);
        }
        setAvailability(fallback);
      }
    };
    fetchAvailability();
  }, [setValue]);

  const checkExistingClient = async (cedula) => {
    if (!cedula || cedula.length < 5) return;
    try {
      const res = await api.get(`/check-client/${cedula}`);
      if (res.data && res.data.success && res.data.found) {
        const c = res.data.cliente;
        setRecognizedClient(c);
        if (c.nombre) setValue('nombre', c.nombre);
        if (c.correo) setValue('email', c.correo);
        if (c.celular) setValue('telefono', c.celular.replace(/\D/g, '').slice(0, 10));
        if (c.ultimaDireccion?.direccion) setValue('direccion', c.ultimaDireccion.direccion);
        if (c.ultimaDireccion?.barrio) setValue('barrio', c.ultimaDireccion.barrio);
        
        Swal.fire({
          icon: 'success',
          title: `¡Hola de nuevo, ${c.nombre.split(' ')[0]}!`,
          text: 'Hemos recuperado los datos para una renovación más rápida.',
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

  const validateCurrentStep = async () => {
    let fieldsToValidate = [];
    if (step === 1) fieldsToValidate = ['nombre', 'documento', 'plan', 'fecha_inicio'];
    if (step === 2) fieldsToValidate = ['email', 'telefono'];
    if (step === 3) {
      const tipo = watch('tipoEntrega');
      fieldsToValidate = ['direccion', 'barrio'];
      if (tipo === 'hibrida') fieldsToValidate.push('direccion2', 'barrio2');
    }
    if (step === 4) fieldsToValidate = ['terms'];
    
    return await trigger(fieldsToValidate);
  };

  const handleNext = async () => {
    const isStepValid = await validateCurrentStep();
    if (isStepValid) {
      if (step < totalSteps) setStep(step + 1);
      else {
        // En lugar de llamar a handleSubmit aquí, handleSubmit de react-hook-form lo envuelve en onSubmit
        // pero necesitamos disparar el submit programáticamente o usar el form
      }
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const getAdjustedPriceInfo = () => {
    const planId = watch('plan');
    const currentPlan = plans[planId];
    const tieneCocas = watch('tieneCocas');
    const fechaInicio = watch('fecha_inicio');

    if (!currentPlan) return { total: 0, discount: 0, effectiveDays: 5 };

    const cocasPrice = tieneCocas ? 0 : 70000;
    
    if (!fechaInicio) return { total: currentPlan.price + cocasPrice, discount: 0, effectiveDays: 5, holidaysFound: 0 };

    const monday = new Date(fechaInicio + 'T12:00:00');
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
    
    let planPrice = currentPlan.price;
    let discount = 0;
    if (currentPlan.name.toLowerCase() === 'semanal' && holidaysFound > 0) {
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

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const formData = new FormData();
      
      const payload = {
        nombre: data.nombre,
        cedula: data.documento,
        email: data.email,
        celular: data.telefono,
        plan: data.plan.charAt(0).toUpperCase() + data.plan.slice(1),
        needs_cocas: !data.tieneCocas,
        delivery_type: data.tipoEntrega === 'fija' ? 'Fija' : 'Hibrida',
        address_1: data.direccion,
        barrio_1: data.barrio,
        days_address_1: data.days_address_1,
        zona_1: data.zona_1 || '',
        lat_1: data.lat_1 || '',
        lng_1: data.lng_1 || '',
        facturacionElectronica: data.facturacion ? 'Si' : 'No',
        fecha_inicio: data.fecha_inicio,
        alergias: data.alergias,
        restricciones: data.restricciones
      };

      if (data.tipoEntrega === 'hibrida') {
        payload.address_2 = data.direccion2;
        payload.barrio_2 = data.barrio2;
        payload.days_address_2 = data.days_address_2;
        payload.zona_2 = data.zona_2 || '';
        payload.lat_2 = data.lat_2 || '';
        payload.lng_2 = data.lng_2 || '';
      }

      // Añadir campos al FormData
      Object.keys(payload).forEach(key => {
        if (payload[key] !== undefined && payload[key] !== null) {
          formData.append(key, payload[key]);
        }
      });
      
      if (data.paymentMethod === 'efectivo') {
        // Marcamos de alguna forma que es efectivo, quiza añadiendo a formData
        formData.append('metodo_pago', 'Efectivo');
        formData.append('aprobado_admin', 'true');
      } else if (data.comprobanteFile) {
        formData.append('comprobante', data.comprobanteFile);
        formData.append('metodo_pago', data.paymentMethod);
      }

      const res = await api.post('/orders', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.status === 200 || res.status === 201) {
        Swal.fire({ 
          icon: 'success', 
          title: '¡Cliente Registrado!', 
          text: 'La creación fue exitosa.', 
          confirmButtonColor: '#ea580c' 
        }).then(() => {
          onUpdate();
          onClose();
        });
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Error desconocido';
      Swal.fire({ icon: 'error', title: 'Error', text: msg });
      console.error('Error en submit:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-xl rounded-[24px] md:rounded-[32px] shadow-2xl relative flex flex-col max-h-[98vh] sm:max-h-[95vh] md:max-h-[90vh] overflow-hidden"
      >
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 z-10">
          <X size={24} />
        </button>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 pb-4 custom-scrollbar">
            <h2 className="text-2xl font-black mb-1">Registrar Nuevo Cliente</h2>
            <p className="text-gray-500 text-sm font-medium mb-6">Completa los pasos para crear la suscripción</p>

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
                  <StepPersonalData 
                    key="step1"
                    register={register} 
                    errors={errors} 
                    watch={watch} 
                    setValue={setValue} 
                    plans={plans}
                    availability={availability}
                    recognizedClient={recognizedClient}
                    checkExistingClient={checkExistingClient}
                  />
                )}
                {step === 2 && (
                  <StepContactInfo 
                    key="step2"
                    register={register} 
                    errors={errors} 
                    watch={watch}
                    setValue={setValue} 
                  />
                )}
                {step === 3 && (
                  <StepDelivery 
                    key="step3"
                    register={register} 
                    errors={errors} 
                    watch={watch} 
                    setValue={setValue} 
                  />
                )}
                {step === 4 && (
                  <StepPayment 
                    key="step4"
                    register={register} 
                    errors={errors} 
                    watch={watch} 
                    setValue={setValue} 
                    getAdjustedPriceInfo={getAdjustedPriceInfo}
                  />
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="p-4 sm:p-6 md:p-8 pt-4 border-t border-gray-50 flex gap-4 bg-white shrink-0 items-center">
            {step > 1 && (
              <button 
                type="button"
                disabled={loading}
                onClick={handleBack}
                className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-2xl font-black transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <ArrowLeft size={18} strokeWidth={3} />
                Atrás
              </button>
            )}
            
            {step < totalSteps ? (
              <button 
                type="button"
                disabled={loading}
                onClick={handleNext}
                className="flex-[2] py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-2 shadow-lg bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/30 active:scale-95"
              >
                Siguiente
                <ArrowRight size={18} strokeWidth={3} />
              </button>
            ) : (
              <button 
                type="submit"
                disabled={loading}
                className="flex-[2] py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-2 shadow-lg bg-green-500 hover:bg-green-600 text-white shadow-green-500/30 active:scale-95"
              >
                {loading ? (
                  <span className="animate-spin text-xl">↻</span>
                ) : (
                  <>
                    Crear Cliente
                    <Check size={18} strokeWidth={3} />
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </motion.div>
    </div>
  );
}
