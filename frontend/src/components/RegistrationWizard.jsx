import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ArrowLeft, ArrowRight, Check, Calendar as CalIcon, MapPin, ChefHat, Upload, Clock, CreditCard, Copy, X, User, Phone, Download, ExternalLink, AlertCircle, CheckCircle2, Smartphone, Globe } from 'lucide-react';
import api from '../services/api';
import Swal from 'sweetalert2';
import { calculateEndDate } from '../utils/dateLogic';
import { getHolidaysInRange } from '../utils/colombianHolidays';
import BankRedirect from './BankRedirect';
import { isBarrioCompatibleWithZone, validateAddressNumbers } from '../hooks/useCoverage';
import * as turf from '@turf/turf';
import { wizardStep1Schema, wizardStep2Schema, wizardStep3Schema, wizardStep4Schema, validateComprobanteFile } from '../schemas/validationSchemas';
import axios from 'axios';




const plans = {
  semanal: { name: 'Semanal (1 Semana)', price: 75000, days: 5 },
  quincenal: { name: 'Quincenal (2 Semanas)', price: 150000, days: 10 },
  mensual: { name: 'Mensual (4 Semanas)', price: 285000, days: 20 }
};

export default function RegistrationWizard({ isOpen, onClose, initialPlan = '', onUpdate, plans: dynamicPlans }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [coberturaData, setCoberturaData] = useState({ type: 'FeatureCollection', features: [] });
  const fileInputRef = useRef(null);
  const [fetchedPlans, setFetchedPlans] = useState([]);
  const [juegoCocasPrice, setJuegoCocasPrice] = useState(70000);

  useEffect(() => {
    if (isOpen && (!dynamicPlans || dynamicPlans.length === 0)) {
      const fetchPlanes = async () => {
        try {
          const res = await api.get('/planes');
          if (res.data?.success && res.data.planes) {
            setFetchedPlans(res.data.planes);
            if (res.data.juegoCocasPrice) setJuegoCocasPrice(res.data.juegoCocasPrice);
          }
        } catch (err) {
          console.error("Error al cargar planes en wizard:", err);
        }
      };
      fetchPlanes();
    }
  }, [isOpen, dynamicPlans]);

  const activePlans = useMemo(() => {
    const sourcePlans = (dynamicPlans && dynamicPlans.length > 0) ? dynamicPlans : fetchedPlans;
    if (sourcePlans && Array.isArray(sourcePlans) && sourcePlans.length > 0) {
      const formatted = {};
      sourcePlans.forEach(p => {
        const id = (p.nombre || p.name || '').toLowerCase();
        let name = p.nombre || p.name;
        if (id === 'semanal') name += ' (1 Semana)';
        else if (id === 'quincenal') name += ' (2 Semanas)';
        else if (id === 'mensual') name += ' (4 Semanas)';
        
        formatted[id] = {
          name,
          price: Number(p.precio || p.price || p.precio_base || 0),
          days: Number(p.dias_duracion || p.dias || p.days || 0)
        };
      });
      return formatted;
    }
    return plans; // Fallback to static plans defined outside
  }, [dynamicPlans, fetchedPlans]);

  const [formData, setFormData] = useState({
    nombre: '', documento: '', facturacion: false, telefono: '', email: '',
    tipoEntrega: 'fija', direccion: '', detalles: '', barrio: '',
    days_address_1: 'Lunes,Martes,Miércoles,Jueves,Viernes',
    direccion2: '', detalles2: '', barrio2: '', days_address_2: '',
    plan: initialPlan,
    alergias: '', restricciones: '', tieneCocas: false,
    comprobanteFile: null, comprobanteName: '', fecha_inicio: '',
    paymentMethod: 'bancolombia', terms: false
  });

  const isInitialLoad = useRef(true);

  // Prevenir scroll de la landing (fondo) cuando el wizard está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Persistencia: Guardar progreso en sessionStorage (invitados)
  useEffect(() => {
    if (isInitialLoad.current) return; // No guardar durante la carga inicial
    
    const dataToSave = { ...formData };
    delete dataToSave.comprobanteFile;
    delete dataToSave.comprobanteName;
    sessionStorage.setItem('wizard_progress', JSON.stringify(dataToSave));
  }, [formData]);

  // Cargar progreso al montar
  useEffect(() => {
    const saved = sessionStorage.getItem('wizard_progress');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFormData(prev => ({ ...prev, ...parsed }));
      } catch (err) {
        console.error("Error al cargar progreso guardado:", err);
      }
    }
    isInitialLoad.current = false; // Ya podemos empezar a guardar cambios
  }, []);

  const [copied, setCopied] = useState(false);
  const [recognizedClient, setRecognizedClient] = useState(null);
  const [holidays, setHolidays] = useState([]);
  const [availability, setAvailability] = useState([]);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [selectedQr, setSelectedQr] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [coverage1, setCoverage1] = useState({ status: 'pending', zone: null });
  const [coverage2, setCoverage2] = useState({ status: 'pending', zone: null });


  const totalSteps = 4;
  const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        const currentYear = new Date().getFullYear();
        let autoHolidays = getHolidaysInRange(currentYear, currentYear + 1).map(h => h.date);
        
        let dbHolidays = [];
        try {
          const res = await api.get('/feriados');
          if (res.data?.success) {
            // Filtrar los que no están activos y formatear la fecha correctamente (ej. "2026-07-13T00:00:00.000Z" -> "2026-07-13")
            dbHolidays = res.data.feriados
              .filter(h => h.activo !== false)
              .map(h => h.fecha.split('T')[0]);
              
            const disabledHolidays = new Set(
              res.data.feriados
                .filter(h => h.activo === false)
                .map(h => h.fecha.split('T')[0])
            );
            
            // Si el admin deshabilitó un festivo automático, lo sacamos del arreglo
            autoHolidays = autoHolidays.filter(h => !disabledHolidays.has(h));
          }
        } catch(e) { console.error(e); }
        
        const combined = [...new Set([...autoHolidays, ...dbHolidays])];
        setHolidays(combined);
      } catch (err) {
        console.error("Error al cargar festivos:", err);
      }
    };
    fetchHolidays();
  }, []);

  useEffect(() => {
    if (isOpen) {
      // Reiniciar estado si se abre de nuevo
      setStep(1);
      setFieldErrors({});
      setFormData(prev => ({ ...prev, plan: initialPlan }));

      // Cargar disponibilidad fresca cada vez que se abre
      const fetchAvailability = async () => {
        try {
          const res = await api.get('/availability');
          if (res.data?.success) {
            setAvailability(res.data.availability);
            const firstAvailable = res.data.availability.find(a => a.disponible);
            if (firstAvailable) {
              setFormData(prev => ({ ...prev, fecha_inicio: firstAvailable.fecha }));
            }
          }
        } catch (err) {
          console.error("Error al cargar disponibilidad:", err);
          // Fallback manual si el API falla, para no dejar el wizard vacío
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
      
      const token = localStorage.getItem('token');
      if (token) {
        const fetchMe = async () => {
          try {
            const res = await api.get('/auth/me');
            if (res.data?.success) {
              const u = res.data.usuario;
              if (u) {
                setFormData(prev => ({
                  ...prev,
                  nombre: u.nombre || prev.nombre,
                  documento: u.cedula || prev.documento,
                  email: u.email || prev.email,
                  telefono: (u.celular || prev.telefono).replace(/\D/g, '').slice(0, 10)
                }));
                if (u.cedula) checkExistingClient(u.cedula, true);
              }
            }
          } catch (err) {
            console.error("Sesión inválida o expirada:", err);
          }
        };
        fetchMe();
      }
    }
  }, [isOpen, initialPlan]);

  // Autocorrección: Emparejar el plan corto con el ID largo de la BD, o limpiarlo si no existe
  useEffect(() => {
    if (formData.plan && Object.keys(activePlans).length > 0) {
      if (!activePlans[formData.plan]) {
        const matchedKey = Object.keys(activePlans).find(key => key.includes(formData.plan));
        if (matchedKey) {
          setFormData(prev => ({ ...prev, plan: matchedKey }));
        } else {
          setFormData(prev => ({ ...prev, plan: '' }));
        }
      }
    }
  }, [formData.plan, activePlans]);

  // Cargar zonas de cobertura desde el servidor en tiempo real
  useEffect(() => {
    const fetchCobertura = async () => {
      try {
        const res = await api.get('/cobertura');
        if (res.data) setCoberturaData(res.data);
      } catch (err) {
        console.error("Error cargando zonas de cobertura:", err);
      }
    };
    fetchCobertura();
  }, []);

  const checkExistingClient = async (cedula, silent = false) => {
    if (!cedula || cedula.length < 5) return;
    try {
      const res = await api.get(`/check-client/${cedula}`);
      if (res.data && res.data.success && res.data.found) {
        if (res.data.blocked) {
          Swal.fire({
            icon: 'warning',
            title: 'No es posible continuar',
            text: res.data.message
          });
          setFormData(prev => ({ ...prev, cedula: '' }));
          return;
        }

        const c = res.data.cliente;
        setRecognizedClient(c);
        setFormData(prev => ({
          ...prev,
          nombre: c.nombre || prev.nombre,
          email: c.correo || prev.email,
          telefono: (c.celular || prev.telefono).replace(/\D/g, '').slice(0, 10),
          direccion: c.ultimaDireccion?.direccion || prev.direccion,
          barrio: c.ultimaDireccion?.barrio || prev.barrio
        }));
        
        if (!silent && c.nombre) {
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
      }
    } catch (err) {
      console.error("Error checking client:", err);
    }
  };

  const checkCoverage = async (address, barrio, setStatus, num) => {
    if (!address || address.length < 5) {
      const target = num === 1 ? 'direccion' : 'direccion2';
      setFieldErrors(prev => ({ ...prev, [target]: 'Ingresa una dirección más larga para validar.' }));
      return { status: null, zone: null };
    }
    setStatus({ status: 'loading', zone: null });

    // Mejorar la nomenclatura colombiana para Mapbox
    let cleanAddress = address
      .replace(/[#-]/g, ' ')
      .replace(/\b(cl|cll)\.?\s+/i, 'Calle ')
      .replace(/\b(cra|cr)\.?\s+/i, 'Carrera ')
      .replace(/\b(av)\.?\s+/i, 'Avenida ')
      .replace(/\b(dg|diag)\.?\s+/i, 'Diagonal ')
      .replace(/\b(tr|trans)\.?\s+/i, 'Transversal ')
      .replace(/\b(cq|circ)\.?\s+/i, 'Circular ')
      .replace(/(\d+)(sur|norte|este|oeste)\b/gi, '$1 $2') // Separar "9SUR" a "9 SUR" para Mapbox
      .replace(/(\d+)\s+([a-zA-Z]{1,2})\b/g, '$1$2'); // Mapbox odia los espacios en ej: "65 B", lo pasa a "65B"
      
    // Limpiamos # y - porque Mapbox en Colombia suele fallar y devolver 0 resultados con ellos.
    
    // Detectar municipio para no forzar Medellín si están en otra ciudad del Valle de Aburrá
    let needsMunicipio = true;
    if (barrio) {
      const bLower = barrio.toLowerCase();
      if (
        bLower.includes('itagüí') || bLower.includes('itagui') ||
        bLower.includes('bello') || bLower.includes('envigado') ||
        bLower.includes('sabaneta') || bLower.includes('estrella') ||
        bLower.includes('copacabana') || bLower.includes('medellín') || bLower.includes('medellin')
      ) {
        needsMunicipio = false;
      }
    }
    
    // Un solo query preciso usando el Bounding Box del Valle de Aburrá
    const query = needsMunicipio 
      ? `${cleanAddress}, ${barrio}, Medellín, Antioquia, Colombia`
      : `${cleanAddress}, ${barrio}, Antioquia, Colombia`;

    const apiKey = import.meta.env.VITE_MAPBOX_API_KEY;

    if (!apiKey) {
      console.error("Falta la API Key de Mapbox (VITE_MAPBOX_API_KEY)");
      setStatus({ status: 'api_error', zone: null });
      return { status: 'api_error', zone: null };
    }

    try {
      const res = await axios.get(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`, {
        params: {
          access_token: apiKey,
          country: 'co',
          limit: 1,
          bbox: '-75.75,6.05,-75.45,6.45'
        }
      });

      if (res.data && res.data.features && res.data.features.length > 0) {
        const firstFeat = res.data.features[0];
        if (!validateAddressNumbers(address, firstFeat)) {
          setStatus({ status: 'no_coverage', zone: null });
          return { status: 'no_coverage', zone: null };
        }

        const [lng, lat] = firstFeat.center;
        const pt = turf.point([parseFloat(lng), parseFloat(lat)]);
        let zoneName = null;
        let zoneFeature = null;

        coberturaData.features.forEach(f => {
          if (turf.booleanPointInPolygon(pt, f)) {
            const nameKey = Object.keys(f.properties).find(k => k.trim().toLowerCase() === 'nombre' || k.trim().toLowerCase() === 'name');
            if (nameKey) zoneName = f.properties[nameKey];
            zoneFeature = f;
          }
        });

        if (zoneName) {
          if (barrio && !isBarrioCompatibleWithZone(barrio, zoneFeature)) {
            setStatus({ status: 'mismatch', zone: zoneName });
            return { status: 'mismatch', zone: zoneName };
          } else {
            setStatus({ status: 'ok', zone: zoneName });
            setFormData(prev => ({ 
              ...prev, 
              [`zona_${num}`]: zoneName, 
              [`lat_${num}`]: lat, 
              [`lng_${num}`]: lng 
            }));
            return { status: 'ok', zone: zoneName };
          }
        } else {
          // Encontró la coordenada, pero cae fuera de los polígonos de entrega
          setStatus({ status: 'no_coverage', zone: null });
          return { status: 'no_coverage', zone: null };
        }
      } else {
        // Mapbox no encontró ningún lugar con esa dirección
        setStatus({ status: 'not_found', zone: null });
        return { status: 'not_found', zone: null };
      }
    } catch (err) {
      console.error("Geocoding fatal error:", err);
      const msg = err.response?.data?.message || err.message || "Error desconocido";
      setStatus({ status: 'api_error', zone: null, errorMsg: msg });
      return { status: 'api_error', zone: null, errorMsg: msg };
    }
  };

  const handleNext = async () => {
    let cov1 = coverage1;
    let cov2 = coverage2;

    if (step === 3) {
      if (formData.direccion && (!cov1.status || cov1.status === 'loading' || cov1.status === 'pending')) {
         cov1 = await checkCoverage(formData.direccion, formData.barrio, setCoverage1, 1) || cov1;
      }
      if (formData.tipoEntrega === 'hibrida' && formData.direccion2 && (!cov2.status || cov2.status === 'loading' || cov2.status === 'pending')) {
         cov2 = await checkCoverage(formData.direccion2, formData.barrio2, setCoverage2, 2) || cov2;
      }
    }

    if (validateStep(cov1, cov2)) {
      setFieldErrors({});
      if (step < totalSteps) setStep(step + 1);
      else handleSubmit();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setFieldErrors({});
      setStep(step - 1);
    }
  };

  const setError = (errors) => {
    setFieldErrors(errors);
    // Auto-scroll to first error field
    const firstKey = Object.keys(errors)[0];
    if (firstKey) {
      setTimeout(() => {
        const el = document.getElementById(`field-${firstKey}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const input = el?.querySelector('input, select, textarea');
        if (input) input.focus();
      }, 50);
    }
  };

  const validateStep = (cov1 = coverage1, cov2 = coverage2) => {
    const errors = {};

    if (step === 1) {
      const result = wizardStep1Schema.safeParse({
        nombre: formData.nombre,
        documento: formData.documento,
        fecha_inicio: formData.fecha_inicio
      });
      if (!result.success) {
        result.error.issues.forEach(issue => {
          errors[issue.path[0]] = issue.message;
        });
      }
      if (!formData.plan || !activePlans[formData.plan]) {
        errors.plan = 'Por favor selecciona un plan para continuar';
      }
      // Validate documento is only digits
      if (!errors.documento && formData.documento && !/^\d+$/.test(formData.documento)) {
        errors.documento = 'El documento solo puede contener números';
      }
    }

    if (step === 2) {
      const result = wizardStep2Schema.safeParse({
        email: formData.email,
        telefono: formData.telefono.replace(/\D/g, '')
      });
      if (!result.success) {
        result.error.issues.forEach(issue => {
          errors[issue.path[0]] = issue.message;
        });
      }
    }

    if (step === 3) {
      const result = wizardStep3Schema.safeParse({
        direccion: formData.direccion,
        barrio: formData.barrio,
        tipoEntrega: formData.tipoEntrega,
        direccion2: formData.direccion2,
        barrio2: formData.barrio2
      });
      if (!result.success) {
        result.error.issues.forEach(issue => {
          errors[issue.path[0]] = issue.message;
        });
      }

      // Coverage checks layered on top of schema validation
      // BLOQUEAR estrictamente si no fue validada correctamente
      if (cov1?.status === 'no_coverage') {
        errors.direccion = 'La dirección 1 se encuentra fuera de nuestra zona de cobertura actual.';
      } else if (cov1?.status === 'mismatch') {
        errors.direccion = `La dirección no coincide con el barrio ingresado (geolocalizada en: ${cov1.zone}). Por favor verifica la dirección.`;
      } else if (cov1?.status !== 'ok') {
        errors.direccion = 'Por favor presiona "Validar Cobertura" y asegúrate de que la dirección sea correcta.';
      }

      if (formData.tipoEntrega === 'hibrida') {
        if (cov2?.status === 'no_coverage') {
          errors.direccion2 = 'La dirección 2 se encuentra fuera de nuestra zona de cobertura actual.';
        } else if (cov2?.status === 'mismatch') {
          errors.direccion2 = `La dirección no coincide con el barrio ingresado (geolocalizada en: ${cov2.zone}). Por favor verifica la dirección.`;
        } else if (cov2?.status !== 'ok') {
          errors.direccion2 = 'Por favor presiona "Validar Cobertura" para la segunda dirección.';
        }
      }
    }

    if (step === 4) {
      // Validate file type and size
      const fileError = validateComprobanteFile(formData.comprobanteFile);
      if (fileError) errors.comprobante = fileError;

      if (!formData.terms) errors.terms = 'Es necesario que aceptes nuestras políticas de servicio';
    }

    if (Object.keys(errors).length > 0) {
      setError(errors);
      return false;
    }
    return true;
  };

  // Compute if current step is valid (for disabling Next button reactively)
  const isStepValid = () => {
    if (step === 1) {
      return formData.nombre.trim().length >= 3 &&
             formData.documento.trim().length >= 5 &&
             !!formData.fecha_inicio &&
             !!formData.plan && !!activePlans[formData.plan];
    }
    if (step === 2) {
      const cleanedPhone = formData.telefono.replace(/\D/g, '');
      return formData.email.includes('@') && formData.email.includes('.') &&
             cleanedPhone.length === 10;
    }
    if (step === 3) {
      const base = formData.direccion.trim() && formData.barrio.trim();
      if (formData.tipoEntrega === 'hibrida')
        return base && formData.direccion2.trim() && formData.barrio2.trim();
      return !!base;
    }
    if (step === 4) {
      return !!formData.plan && !!activePlans[formData.plan] && !!formData.comprobanteFile && !!formData.terms;
    }
    return true;
  };

  // Helper to check if a specific field is valid for real-time icon swapping
  const isFieldValid = (name) => {
    switch(name) {
      case 'nombre': return formData.nombre.trim().length >= 3 && /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s.'-]+$/.test(formData.nombre.trim());
      case 'documento': return formData.documento.trim().length >= 5 && /^\d+$/.test(formData.documento.trim());
      case 'fecha_inicio': return !!formData.fecha_inicio;
      case 'email': return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.email);
      case 'telefono': {
        const cleaned = formData.telefono.replace(/\D/g, '');
        return cleaned.length === 10 && cleaned.startsWith('3');
      }
      case 'direccion': return formData.direccion.trim().length >= 5;
      case 'barrio': return formData.barrio.trim().length >= 2;
      case 'direccion2': return formData.direccion2.trim().length >= 5;
      case 'barrio2': return formData.barrio2.trim().length >= 2;
      case 'comprobante': return !!formData.comprobanteFile && !validateComprobanteFile(formData.comprobanteFile);
      case 'terms': return !!formData.terms;
      default: return false;
    }
  };

  const stepValid = isStepValid();


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
      holder: 'Daniel',
      qr: '/qr_bancolombia.png',
      appUrl: 'bancolombia://'
    }
  };


  const getPlanPriceDetails = (planId) => {
    const currentPlan = activePlans[planId];
    if (!currentPlan) return { planPrice: 0, discount: 0, effectiveDays: 5, holidaysFound: 0, endDateStr: '' };
    
    if (!formData.fecha_inicio) return { planPrice: currentPlan.price, discount: 0, effectiveDays: 5, holidaysFound: 0, endDateStr: '' };

    const planName = (planId || '').toLowerCase();
    let weeks = 1;
    let baseDays = 5;
    
    if (planName === 'semanal') { weeks = 1; baseDays = 5; }
    else if (planName === 'quincenal') { weeks = 2; baseDays = 10; }
    else if (planName === 'mensual') { weeks = 4; baseDays = 20; }
    else if (currentPlan.days) {
      baseDays = currentPlan.days;
      weeks = Math.ceil(baseDays / 5) || 1;
    }

    const endDate = calculateEndDate(formData.fecha_inicio, weeks);
    let formattedEndDate = '';
    
    if (endDate) {
      formattedEndDate = endDate.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' }).replace(',', '');
    }

    let holidaysFound = 0;
    const start = new Date(formData.fecha_inicio + 'T12:00:00');
    
    const dayOfWeek = start.getDay();
    const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const current = new Date(start);
    current.setDate(start.getDate() - daysSinceMonday);
    
    const end = new Date(endDate);
    
    const fmt = (d) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dayStr = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${dayStr}`;
    };
    
    while (current <= end) {
      const isWeekend = current.getDay() === 0 || current.getDay() === 6;
      if (!isWeekend) {
        if (holidays.includes(fmt(current))) {
          holidaysFound++;
        }
      }
      current.setDate(current.getDate() + 1);
    }

    let planPrice = currentPlan.price;
    let discount = 0;
    
    if (holidaysFound > 0) {
      const dailyRate = currentPlan.price / baseDays;
      discount = dailyRate * holidaysFound;
      planPrice = currentPlan.price - discount;
    }

    return {
      planPrice,
      discount,
      effectiveDays: baseDays - holidaysFound,
      holidaysFound,
      endDateStr: formattedEndDate,
      weeks
    };
  };

  const getAdjustedPriceInfo = () => {
    const details = getPlanPriceDetails(formData.plan);
    const cocasPrice = formData.tieneCocas ? 0 : juegoCocasPrice;
    
    return {
      total: details.planPrice + cocasPrice,
      discount: details.discount,
      effectiveDays: details.effectiveDays,
      holidaysFound: details.holidaysFound
    };
  };

  const priceInfo = getAdjustedPriceInfo();

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const data = new FormData();
      
      // Mapeo estructurado para el backend
      const payload = {
        nombre: formData.nombre,
        cedula: formData.documento,
        email: formData.email,
        celular: formData.telefono,
        plan: formData.plan.charAt(0).toUpperCase() + formData.plan.slice(1),
        needs_cocas: !formData.tieneCocas,
        delivery_type: formData.tipoEntrega === 'fija' ? 'Fija' : 'Hibrida',
        address_1: formData.detalles ? `${formData.direccion} (${formData.detalles})` : formData.direccion,
        barrio_1: formData.barrio,
        days_address_1: formData.days_address_1,
        zona_1: formData.zona_1 || '',
        lat_1: formData.lat_1 || '',
        lng_1: formData.lng_1 || '',
        facturacionElectronica: formData.facturacion ? 'Si' : 'No',
        fecha_inicio: formData.fecha_inicio,
        alergias: formData.alergias,
        restricciones: formData.restricciones
      };

      if (formData.tipoEntrega === 'hibrida') {
        payload.address_2 = formData.detalles2 ? `${formData.direccion2} (${formData.detalles2})` : formData.direccion2;
        payload.barrio_2 = formData.barrio2;
        payload.days_address_2 = formData.days_address_2;
        payload.zona_2 = formData.zona_2 || '',
        payload.lat_2 = formData.lat_2 || '',
        payload.lng_2 = formData.lng_2 || ''
      }

      // Añadir campos al FormData, asegurando que no se manden 'undefined'
      Object.keys(payload).forEach(key => {
        if (payload[key] !== undefined && payload[key] !== null) {
          data.append(key, payload[key]);
        }
      });
      
      // Añadir archivo
      if (formData.comprobanteFile) {
        data.append('comprobante', formData.comprobanteFile);
      }

      const res = await api.post('/orders', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.status === 200 || res.status === 201) {
        Swal.fire({ 
          icon: 'success', 
          title: '¡Reserva Exitosa!', 
          text: 'Hemos recibido tu pago. En breve aparecerá en tu panel de usuario.', 
          confirmButtonColor: '#ea580c' 
        }).then(() => {
          if (onUpdate) {
            onUpdate();
            onClose();
          } else {
            // Si el cliente ya existe o está logueado, lo llevamos a su panel
            const token = localStorage.getItem('token');
            if (token || recognizedClient) {
              navigate('/dashboard');
            } else {
              onClose();
            }
          }
          
          // Reset Form
          setFormData({
            nombre: '', documento: '', facturacion: false, telefono: '', email: '',
            tipoEntrega: 'fija', direccion: '', detalles: '', barrio: '',
            days_address_1: 'Lunes,Martes,Miércoles,Jueves,Viernes',
            direccion2: '', detalles2: '', barrio2: '', days_address_2: '',
            plan: initialPlan, alergias: '', restricciones: '',
            tieneCocas: false, terms: false, comprobanteFile: null, comprobanteName: ''
          });
          setStep(1);
          localStorage.removeItem('wizard_progress');
        });
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Error desconocido al enviar reserva';
      Swal.fire({ icon: 'error', title: 'Error en la reserva', text: msg, confirmButtonColor: '#ea580c' });
      console.error('Error en submit:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const currentPlan = activePlans[formData.plan] || activePlans['quincenal'] || Object.values(activePlans)[0];
  const totalPrice = (currentPlan?.price || 0) + (formData.tieneCocas ? 0 : juegoCocasPrice);

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

        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 md:p-8 pb-4 custom-scrollbar">
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2" id="field-nombre">
                        <label className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
                          Nombre Completo
                          {isFieldValid('nombre') ? (
                            <CheckCircle2 size={12} className="text-green-500 animate-in zoom-in" />
                          ) : (
                            <AlertCircle size={10} className="text-orange-500" />
                          )}
                        </label>
                        <input 
                          className={`w-full bg-gray-50 border-none rounded-xl px-4 py-3.5 text-sm focus:ring-2 transition-all font-medium text-slate-900 ${
                            fieldErrors.nombre ? 'ring-2 ring-orange-500 bg-orange-50/50 shadow-inner' : 'focus:ring-orange-500'
                          }`}
                          value={formData.nombre}
                          onChange={e => {
                            setFormData({...formData, nombre: e.target.value});
                            if(fieldErrors.nombre) setFieldErrors({...fieldErrors, nombre: null});
                          }}
                          placeholder="Ej: María Pérez"
                        />
                        {fieldErrors.nombre && <p className="text-[10px] font-bold text-orange-600 mt-1 ml-1 flex items-center gap-1"><AlertCircle size={10} /> {fieldErrors.nombre}</p>}
                      </div>
                      <div className="space-y-2 relative" id="field-documento">
                        <label className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
                          Documento / CC
                          {isFieldValid('documento') ? (
                            <CheckCircle2 size={12} className="text-green-500 animate-in zoom-in" />
                          ) : (
                            <AlertCircle size={10} className="text-orange-500" />
                          )}
                        </label>
                        <input 
                          className={`w-full bg-gray-50 border-none rounded-xl px-4 py-3.5 text-sm focus:ring-2 transition-all font-medium text-slate-900 ${
                            fieldErrors.documento ? 'ring-2 ring-orange-500 bg-orange-50/50 shadow-inner' : 'focus:ring-orange-500'
                          }`}
                          value={formData.documento}
                          onChange={e => {
                            setFormData({...formData, documento: e.target.value.replace(/\D/g,'')});
                            if(fieldErrors.documento) setFieldErrors({...fieldErrors, documento: null});
                          }}
                          onBlur={e => checkExistingClient(e.target.value)}
                          placeholder="Ej: 1017..."
                        />
                        {fieldErrors.documento && <p className="text-[10px] font-bold text-orange-600 mt-1 ml-1 flex items-center gap-1"><AlertCircle size={10} /> {fieldErrors.documento}</p>}
                      {recognizedClient && (
                         <div className="absolute -top-1 right-0 text-[9px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-100 flex items-center gap-1">
                            <Check size={10} /> RECONOCIDO
                         </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-3" id="field-plan">
                    <label className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
                      Selecciona tu Plan
                      {formData.plan ? (
                        <CheckCircle2 size={12} className="text-green-500 animate-in zoom-in" />
                      ) : (
                        <AlertCircle size={10} className="text-orange-500" />
                      )}
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {Object.entries(activePlans).map(([id, p]) => {
                        const priceDetails = getPlanPriceDetails(id);
                        return (
                          <button 
                            key={id}
                            type="button"
                            onClick={() => setFormData({...formData, plan: id})}
                            className={`p-4 rounded-2xl border-2 transition-all text-left relative overflow-hidden ${
                              formData.plan === id ? 'border-orange-500 ring-2 ring-orange-500 bg-orange-50 shadow-md' : 'border-gray-200 bg-white hover:border-orange-300'
                            }`}
                          >
                            <div className={`text-[10px] font-black uppercase mb-1 ${formData.plan === id ? 'text-orange-700' : 'text-gray-400'}`}>{p.name}</div>
                            <div className="text-lg font-black text-orange-600">${(priceDetails.planPrice/1000).toFixed(0)}K</div>
                            {formData.plan === id && (
                              <div className="absolute top-2 right-2 text-orange-500 animate-in zoom-in">
                                <CheckCircle2 size={18} />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    {fieldErrors.plan && <p className="text-[10px] font-bold text-orange-600 mt-1 ml-1 flex items-center gap-1"><AlertCircle size={10} /> {fieldErrors.plan}</p>}
                  </div>

                  <div className="space-y-3" id="field-fecha_inicio">
                    <div className="bg-green-50 p-4 rounded-2xl flex items-center gap-3 border border-green-100 text-slate-900">
                      <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-green-600 shrink-0">
                        <Check size={20} strokeWidth={3} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-0.5">Inicio del Plan</p>
                        <p className="text-sm font-bold text-slate-800 leading-snug">
                          {(() => {
                            if (!availability.length || !formData.fecha_inicio) return 'Calculando fecha de inicio...';
                            
                            let current = new Date(formData.fecha_inicio + 'T12:00:00');
                            
                            for (let i = 0; i < 5; i++) {
                              const y = current.getFullYear();
                              const m = String(current.getMonth() + 1).padStart(2, '0');
                              const d = String(current.getDate()).padStart(2, '0');
                              const dateStr = `${y}-${m}-${d}`;
                              
                              if (holidays.includes(dateStr) || current.getDay() === 0 || current.getDay() === 6) {
                                current.setDate(current.getDate() + 1);
                              } else {
                                break;
                              }
                            }
                            
                            const formattedDate = current.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' }).replace(',', '');
                            const { endDateStr, weeks } = getPlanPriceDetails(formData.plan);
                            
                            if (formData.plan) {
                              return `Tu plan de ${weeks} semana${weeks > 1 ? 's' : ''} iniciará el ${formattedDate} y terminará el ${endDateStr}.`;
                            } else {
                              return `Selecciona un plan para ver tu fecha de finalización.`;
                            }
                          })()}
                        </p>
                      </div>
                    </div>
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
                  <div className="space-y-2" id="field-email">
                    <label className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
                      Correo Electrónico
                      {isFieldValid('email') ? (
                        <CheckCircle2 size={12} className="text-green-500 animate-in zoom-in" />
                      ) : (
                        <AlertCircle size={10} className="text-orange-500" />
                      )}
                    </label>
                    <input 
                      type="email"
                      className={`w-full bg-gray-50 border-none rounded-xl px-4 py-3.5 text-sm focus:ring-2 transition-all font-medium text-slate-900 ${
                        fieldErrors.email ? 'ring-2 ring-orange-500 bg-orange-50/50 shadow-inner' : 'focus:ring-orange-500'
                      }`}
                      value={formData.email}
                      onChange={e => {
                        setFormData({...formData, email: e.target.value});
                        if(fieldErrors.email) setFieldErrors({...fieldErrors, email: null});
                      }}
                      placeholder="ejemplo@correo.com"
                    />
                    {fieldErrors.email && <p className="text-[10px] font-bold text-orange-600 mt-1 ml-1 flex items-center gap-1"><AlertCircle size={10} /> {fieldErrors.email}</p>}
                  </div>
                  <div className="space-y-2" id="field-telefono">
                    <label className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
                      Celular (WhatsApp)
                      {isFieldValid('telefono') ? (
                        <CheckCircle2 size={12} className="text-green-500 animate-in zoom-in" />
                      ) : (
                        <AlertCircle size={10} className="text-orange-500" />
                      )}
                    </label>
                    <input 
                      type="tel"
                      className={`w-full bg-gray-50 border-none rounded-xl px-4 py-3.5 text-sm focus:ring-2 transition-all font-medium text-slate-900 ${
                        fieldErrors.telefono ? 'ring-2 ring-orange-500 bg-orange-50/50 shadow-inner' : 'focus:ring-orange-500'
                      }`}
                      value={formData.telefono}
                      onChange={e => {
                        setFormData({...formData, telefono: e.target.value.replace(/\D/g,'').slice(0,10)});
                        if(fieldErrors.telefono) setFieldErrors({...fieldErrors, telefono: null});
                      }}
                      placeholder="3001234567"
                    />
                    {fieldErrors.telefono && <p className="text-[10px] font-bold text-orange-600 mt-1 ml-1 flex items-center gap-1"><AlertCircle size={10} /> {fieldErrors.telefono}</p>}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-900 uppercase tracking-widest">¿Tienes Alergias?</label>
                      <textarea 
                        className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-xs focus:ring-2 focus:ring-orange-500 transition-all font-medium text-slate-900 resize-none"
                        rows="2"
                        value={formData.alergias}
                        onChange={e => setFormData({...formData, alergias: e.target.value})}
                        placeholder="Ej: Maní, mariscos..."
                      ></textarea>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-900 uppercase tracking-widest">Restricciones</label>
                      <textarea 
                        className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-xs focus:ring-2 focus:ring-orange-500 transition-all font-medium text-slate-900 resize-none"
                        rows="2"
                        value={formData.restricciones}
                        onChange={e => setFormData({...formData, restricciones: e.target.value})}
                        placeholder="Ej: No como cerdo, soy vegano..."
                      ></textarea>
                    </div>
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
                  <div className="flex flex-col sm:flex-row gap-3">
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

                  <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-4" id="field-direccion">
                    <h5 className="text-xs font-black uppercase text-slate-900 tracking-widest flex items-center gap-1.5">
                      {formData.tipoEntrega === 'hibrida' ? 'Dirección 1' : 'Dirección de Entrega'}
                      {isFieldValid('direccion') && isFieldValid('barrio') ? (
                        <CheckCircle2 size={12} className="text-green-500 animate-in zoom-in" />
                      ) : (
                        <AlertCircle size={10} className="text-orange-500" />
                      )}
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex flex-col space-y-1">
                        <input 
                          className={`bg-white border-none rounded-xl px-4 py-3 text-sm font-medium text-slate-900 transition-all w-full ${
                            fieldErrors.direccion ? 'ring-2 ring-orange-500 bg-orange-50/50 shadow-inner' : 'focus:ring-2 focus:ring-orange-500'
                          }`}
                          value={formData.direccion}
                          onChange={e => {
                            setFormData({...formData, direccion: e.target.value});
                            if(fieldErrors.direccion) setFieldErrors({...fieldErrors, direccion: null});
                            setCoverage1({ status: 'pending', zone: null });
                          }}
                          placeholder="Dirección"
                        />
                        {fieldErrors.direccion && (
                          <p className="text-[10px] font-bold text-orange-600 mt-1 ml-1 flex items-center gap-1">
                            <AlertCircle size={10} /> {fieldErrors.direccion}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col space-y-1">
                        <input 
                          className={`bg-white border-none rounded-xl px-4 py-3 text-sm font-medium text-slate-900 transition-all w-full ${
                            fieldErrors.barrio ? 'ring-2 ring-orange-500 bg-orange-50/50 shadow-inner' : 'focus:ring-2 focus:ring-orange-500'
                          }`}
                          value={formData.barrio}
                          onChange={e => {
                            setFormData({...formData, barrio: e.target.value});
                            if(fieldErrors.barrio) setFieldErrors({...fieldErrors, barrio: null});
                            setCoverage1({ status: 'pending', zone: null });
                          }}
                          placeholder="ej: envigado, sabaneta, poblado, robledo, itagui"
                        />
                        {fieldErrors.barrio && (
                          <p className="text-[10px] font-bold text-orange-600 mt-1 ml-1 flex items-center gap-1">
                            <AlertCircle size={10} /> {fieldErrors.barrio}
                          </p>
                        )}
                      </div>
                    </div>
                    <button 
                      onClick={() => checkCoverage(formData.direccion, formData.barrio, setCoverage1, 1)}
                      className="w-full mt-2 py-3 bg-[#F2641A]/10 text-[#F2641A] font-black rounded-xl hover:bg-[#F2641A]/20 active:scale-95 active:bg-[#F2641A]/30 transition-all duration-200 flex justify-center items-center gap-2"
                    >
                      {coverage1.status === 'loading' ? <div className="w-4 h-4 border-2 border-[#F2641A] border-t-transparent rounded-full animate-spin"></div> : <MapPin size={16} />}
                      {coverage1.status === 'loading' ? 'Verificando...' : 'Validar Cobertura'}
                    </button>
                    {coverage1.status === 'api_error' && (
                      <div className="mt-2 bg-red-50 p-2 rounded-lg flex flex-col gap-1">
                        <p className="text-[10px] font-bold text-red-600 flex items-center gap-1">
                          <AlertCircle size={12} /> Hubo un error al validar tu dirección.
                        </p>
                        <p className="text-[9px] text-red-500 font-mono break-all">{coverage1.errorMsg}</p>
                      </div>
                    )}
                    {coverage1.status === 'ok' && (
                      <p className="text-[10px] font-bold text-green-600 mt-2 flex items-center gap-1 bg-green-50 p-2 rounded-lg">
                        <CheckCircle2 size={12} /> Zona confirmada: {coverage1.zone}
                      </p>
                    )}
                    {coverage1.status === 'not_found' && (
                      <p className="text-[10px] font-bold text-orange-600 mt-2 flex items-center gap-1 bg-orange-50 p-2 rounded-lg">
                        <AlertCircle size={12} /> No encontramos esta dirección en el mapa. Verifica que esté bien escrita.
                      </p>
                    )}
                    {coverage1.status === 'no_coverage' && (
                      <p className="text-[10px] font-bold text-red-600 mt-2 flex items-center gap-1 bg-red-50 p-2 rounded-lg">
                        <AlertCircle size={12} /> Fuera de nuestra zona de cobertura.
                      </p>
                    )}
                    {coverage1.status === 'mismatch' && (
                      <p className="text-[10px] font-bold text-orange-600 mt-2 flex items-center gap-1 bg-orange-50 p-2 rounded-lg">
                        <AlertCircle size={12} /> La dirección parece estar en la zona "{coverage1.zone}", pero el barrio no coincide.
                      </p>
                    )}

                    <div className="mt-3">
                      <input 
                        type="text"
                        className="bg-white border-none rounded-xl px-4 py-3 text-sm font-medium text-slate-900 transition-all w-full focus:ring-2 focus:ring-orange-500"
                        value={formData.detalles}
                        onChange={e => setFormData({...formData, detalles: e.target.value})}
                        placeholder="Detalles (Apto, Torre, Oficina, etc.) - Opcional"
                      />
                      <p className="text-[10px] text-gray-400 mt-1 ml-1">Escribe aquí especificaciones si usaste el mapa para ubicarte.</p>
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
                      id="field-direccion2"
                    >
                      <h5 className="text-xs font-black uppercase text-slate-900 tracking-widest flex items-center gap-1.5">
                        Dirección 2
                        {isFieldValid('direccion2') && isFieldValid('barrio2') ? (
                          <CheckCircle2 size={12} className="text-green-500 animate-in zoom-in" />
                        ) : (
                          <AlertCircle size={10} className="text-orange-500" />
                        )}
                      </h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="flex flex-col space-y-1">
                          <input 
                            className={`bg-white border-none rounded-xl px-4 py-3 text-sm font-medium text-slate-900 transition-all w-full ${
                              fieldErrors.direccion2 ? 'ring-2 ring-orange-500 bg-orange-50/50 shadow-inner' : 'focus:ring-2 focus:ring-orange-500'
                            }`}
                            value={formData.direccion2}
                            onChange={e => {
                              setFormData({...formData, direccion2: e.target.value});
                              if(fieldErrors.direccion2) setFieldErrors({...fieldErrors, direccion2: null});
                              setCoverage2({ status: 'pending', zone: null });
                            }}
                            placeholder="Dirección 2"
                          />
                          {fieldErrors.direccion2 && (
                            <p className="text-[10px] font-bold text-orange-600 mt-1 ml-1 flex items-center gap-1">
                              <AlertCircle size={10} /> {fieldErrors.direccion2}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col space-y-1">
                          <input 
                            className={`bg-white border-none rounded-xl px-4 py-3 text-sm font-medium text-slate-900 transition-all w-full ${
                              fieldErrors.barrio2 ? 'ring-2 ring-orange-500 bg-orange-50/50 shadow-inner' : 'focus:ring-2 focus:ring-orange-500'
                            }`}
                            value={formData.barrio2}
                            onChange={e => {
                              setFormData({...formData, barrio2: e.target.value});
                              if(fieldErrors.barrio2) setFieldErrors({...fieldErrors, barrio2: null});
                              setCoverage2({ status: 'pending', zone: null });
                            }}
                            placeholder="ej: envigado, sabaneta, poblado, robledo, itagui"
                          />
                          {fieldErrors.barrio2 && (
                            <p className="text-[10px] font-bold text-orange-600 mt-1 ml-1 flex items-center gap-1">
                              <AlertCircle size={10} /> {fieldErrors.barrio2}
                            </p>
                          )}
                        </div>
                      </div>
                      <button 
                        onClick={() => checkCoverage(formData.direccion2, formData.barrio2, setCoverage2, 2)}
                        className="w-full mt-2 py-3 bg-[#F2641A]/10 text-[#F2641A] font-black rounded-xl hover:bg-[#F2641A]/20 active:scale-95 active:bg-[#F2641A]/30 transition-all duration-200 flex justify-center items-center gap-2"
                      >
                        {coverage2.status === 'loading' ? <div className="w-4 h-4 border-2 border-[#F2641A] border-t-transparent rounded-full animate-spin"></div> : <MapPin size={16} />}
                        {coverage2.status === 'loading' ? 'Verificando...' : 'Validar Cobertura 2'}
                      </button>
                      {coverage2.status === 'api_error' && (
                        <p className="text-[10px] font-bold text-red-600 mt-2 flex items-center gap-1 bg-red-50 p-2 rounded-lg">
                          <AlertCircle size={12} /> Hubo un error al validar tu dirección. Intenta de nuevo o contacta soporte.
                        </p>
                      )}
                      {coverage2.status === 'ok' && (
                        <p className="text-[10px] font-bold text-green-600 mt-2 flex items-center gap-1 bg-green-50 p-2 rounded-lg">
                          <CheckCircle2 size={12} /> Zona confirmada: {coverage2.zone}
                        </p>
                      )}
                      {coverage2.status === 'not_found' && (
                        <p className="text-[10px] font-bold text-orange-600 mt-2 flex items-center gap-1 bg-orange-50 p-2 rounded-lg">
                          <AlertCircle size={12} /> No encontramos esta dirección en el mapa. Verifica que esté bien escrita.
                        </p>
                      )}
                      {coverage2.status === 'no_coverage' && (
                        <p className="text-[10px] font-bold text-red-600 mt-2 flex items-center gap-1 bg-red-50 p-2 rounded-lg">
                          <AlertCircle size={12} /> Fuera de nuestra zona de cobertura.
                        </p>
                      )}
                      {coverage2.status === 'mismatch' && (
                        <p className="text-[10px] font-bold text-orange-600 mt-2 flex items-center gap-1 bg-orange-50 p-2 rounded-lg">
                          <AlertCircle size={12} /> La dirección parece estar en la zona "{coverage2.zone}", pero el barrio no coincide.
                        </p>
                      )}
                      
                      <div className="mt-3">
                        <input 
                          type="text"
                          className="bg-white border-none rounded-xl px-4 py-3 text-sm font-medium text-slate-900 transition-all w-full focus:ring-2 focus:ring-orange-500"
                          value={formData.detalles2}
                          onChange={e => setFormData({...formData, detalles2: e.target.value})}
                          placeholder="Detalles (Apto, Torre, Oficina, etc.) - Opcional"
                        />
                        <p className="text-[10px] text-gray-400 mt-1 ml-1">Escribe aquí especificaciones si usaste el mapa para ubicarte.</p>
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
                    <label className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
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
                        Deseo comprarlo
                      </button>
                    </div>
                  </div>

                  {/* Contenedor Unificado de Pago */}
                  <div className="bg-slate-900 text-white rounded-[24px] p-6 shadow-xl space-y-6 relative overflow-hidden border border-slate-800">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/10 rounded-full -mr-24 -mt-24 blur-3xl pointer-events-none"></div>
                    
                    {/* Fila 1: Total y Cuenta */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-white/10 relative z-10">
                      <div>
                        <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">Total a Transferir</div>
                        <div className="text-3xl font-black text-white">${priceInfo.total.toLocaleString()}</div>
                        <div className="text-[10px] font-bold text-slate-400 mt-1">
                          Plan + Cocas {priceInfo.discount > 0 && <span className="text-orange-400 font-black">• DESCUENTO APLICADO</span>}
                        </div>
                        {priceInfo.discount > 0 && (
                          <div className="mt-2 flex items-center gap-2">
                            <span className="bg-orange-500 text-white px-2 py-0.5 rounded-full text-[9px] font-black">
                              -${priceInfo.discount.toLocaleString()}
                            </span>
                            <span className="text-[9px] font-bold text-orange-200 uppercase">
                              {priceInfo.holidaysFound} festivo(s)
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-1 md:text-right md:flex md:flex-col md:items-end md:justify-center">
                        <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Bancolombia Ahorros</div>
                        <div className="flex items-center gap-2 md:justify-end">
                          <span className="text-xl font-black text-white tracking-tight">238-000045-84</span>
                          <button 
                            type="button"
                            onClick={() => copyToClipboard('238-000045-84')}
                            className={`p-2.5 rounded-xl transition-all ${copied ? 'bg-green-500 text-white' : 'bg-white/10 text-slate-300 hover:text-white hover:bg-white/20'}`}
                            title="Copiar cuenta"
                          >
                            {copied ? <Check size={14} strokeWidth={3} /> : <Copy size={14} strokeWidth={3} />}
                          </button>
                        </div>
                        <div className="text-[10px] font-bold text-slate-400 mt-1">Titular: Daniel</div>
                      </div>
                    </div>

                    {/* Fila 2: Subida de comprobante compacta */}
                    <div className="space-y-3 relative z-10" id="field-comprobante">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-1.5">
                          Sube el pantallazo parcero!
                          {isFieldValid('comprobante') ? (
                            <CheckCircle2 size={12} className="text-green-500 animate-in zoom-in" />
                          ) : (
                            <AlertCircle size={10} className="text-orange-500" />
                          )}
                        </label>
                        {formData.comprobanteName && (
                          <span className="text-[9px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Listo</span>
                        )}
                      </div>
                      
                      <div 
                        onClick={() => fileInputRef.current.click()}
                        className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                          fieldErrors.comprobante 
                            ? 'border-orange-500 bg-orange-500/5' 
                            : 'border-white/20 hover:border-orange-500 bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center justify-center gap-3">
                          <Upload className={fieldErrors.comprobante ? 'text-orange-500' : 'text-slate-400 group-hover:text-white'} size={20} />
                          <span className="text-xs font-black text-slate-200">
                            {formData.comprobanteName || 'Haz clic para subir la foto del pago'}
                          </span>
                        </div>
                        <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={(e) => {
                          handleFileChange(e);
                          if(fieldErrors.comprobante) setFieldErrors({...fieldErrors, comprobante: null});
                        }} />
                      </div>
                      {fieldErrors.comprobante && (
                        <p className="text-[10px] font-bold text-orange-400 mt-1 flex items-center gap-1">
                          <AlertCircle size={10} /> {fieldErrors.comprobante}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4 pt-2">
                    {/* Facturación Electrónica - No obligatorio */}
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative">
                        <input 
                          type="checkbox" 
                          className="peer hidden"
                          checked={formData.facturacion}
                          onChange={e => setFormData({...formData, facturacion: e.target.checked})}
                        />
                        <div className="w-6 h-6 border-2 border-slate-200 rounded-lg flex items-center justify-center transition-all duration-300 group-active:scale-90 peer-checked:bg-orange-500 peer-checked:border-orange-500 peer-checked:shadow-lg peer-checked:shadow-orange-500/30">
                          <Check size={16} strokeWidth={4} className={`text-white transition-transform duration-300 ${formData.facturacion ? 'scale-100' : 'scale-0'}`} />
                        </div>
                      </div>
                      <span className="text-xs font-bold text-gray-500 group-hover:text-slate-900 transition-colors">
                        ¿Requiere Facturación Electrónica? <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter ml-1">(Opcional)</span>
                      </span>
                    </label>

                    {/* Políticas y Condiciones - OBLIGATORIO */}
                    <div className="space-y-2" id="field-terms">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <div className="relative">
                          <input 
                            type="checkbox" 
                            className="peer hidden"
                            checked={formData.terms}
                            onChange={e => {
                              setFormData({...formData, terms: e.target.checked});
                              if(fieldErrors.terms) setFieldErrors({...fieldErrors, terms: null});
                            }}
                          />
                          <div className={`w-6 h-6 border-2 rounded-lg flex items-center justify-center transition-all duration-300 group-active:scale-90 ${
                            fieldErrors.terms 
                              ? 'border-orange-500 bg-orange-50' 
                              : 'border-slate-200 peer-checked:bg-orange-500 peer-checked:border-orange-500 peer-checked:shadow-lg peer-checked:shadow-orange-500/30'
                          }`}>
                            <Check size={16} strokeWidth={4} className={`text-white transition-transform duration-300 ${formData.terms ? 'scale-100' : 'scale-0'}`} />
                          </div>
                        </div>
                        <span className={`text-xs font-bold transition-colors flex items-center gap-1.5 ${fieldErrors.terms ? 'text-orange-600' : 'text-gray-500 group-hover:text-slate-900'}`}>
                          He leído y acepto las <span className="text-orange-500 font-bold underline">Políticas y Condiciones</span> del servicio.
                          {isFieldValid('terms') ? (
                            <CheckCircle2 size={12} className="text-green-500 animate-in zoom-in" />
                          ) : (
                            <AlertCircle size={10} className="text-orange-500" />
                          )}
                        </span>
                      </label>
                      {fieldErrors.terms && <p className="text-[10px] font-bold text-orange-600 mt-1 ml-8 flex items-center gap-1"><AlertCircle size={10} /> {fieldErrors.terms}</p>}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="p-4 sm:p-6 md:p-8 pt-4 pb-10 sm:pb-8 border-t border-gray-50 flex gap-4 bg-white shrink-0 items-center">
          {step > 1 && (
            <button 
              disabled={loading}
              onClick={handleBack}
              className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-2xl font-black transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <ArrowLeft size={18} strokeWidth={3} />
              Atrás
            </button>
          )}
          <button 
            disabled={loading || !stepValid}
            onClick={handleNext}
            className={`flex-[2] py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-2 shadow-lg ${
              stepValid 
                ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/30 active:scale-95' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-70'
            }`}
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
