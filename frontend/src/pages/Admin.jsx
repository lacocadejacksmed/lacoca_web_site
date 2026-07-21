import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  CreditCard, 
  Users, 
  Search, 
  FileDown, 
  MoreHorizontal, 
  Check, 
  X, 
  TrendingUp,
  Clock,
  AlertTriangle,
  DollarSign,
  Calendar,
  CalendarDays,
  Trash2,
  Plus,
  Image as ImageIcon,
  Upload,
  LogOut,
  MessageCircle,
  AlertCircle,
  ExternalLink,
  Package,
  MapPin,
  Mail,
  ChefHat,
  Utensils,
  UserPlus,
  PieChart as PieChartIcon,
  Settings,
  Eye,
  Pencil,
  Menu
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);
import api, { API_URL } from '../services/api';
import { exportExcel } from '../services/exportService';
import { getHolidaysInRange } from '../utils/colombianHolidays';
import { jsPDF } from "jspdf";
import Swal from 'sweetalert2';
import { validateComprobanteEdit, validateConfig, validateConfigValue, validatePlan, validateMenu, validateFeriado } from '../schemas/validationSchemas';
import ClientEditorModal from '../components/ClientEditorModal';
import ClientViewModal from '../components/ClientViewModal';
import RegistrationWizard from '../components/RegistrationWizard';
import CoverageMap from '../components/CoverageMap';

export default function Admin() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [clients, setClients] = useState([]);
  const [payments, setPayments] = useState([]);
  const [statsPeriod, setStatsPeriod] = useState('mes');
  const [customDate, setCustomDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [repartidores, setRepartidores] = useState([]);
  const [repartidorAsignado, setRepartidorAsignado] = useState(null);
  const [plans, setPlans] = useState([]);
  const [selectedComprobante, setSelectedComprobante] = useState(null);

  // Stats
  const [dashboardStats, setDashboardStats] = useState({
    income: 0, active: 0, pending: 0, expiring: 0, byCocas: 0, byFake: 0, byNotReflected: 0
  });
  const [strategyStats, setStrategyStats] = useState({
    mrr: 0, avgTicket: 0, totalClientes: 0, totalSubs: 0, totalActive: 0, activeNow: 0,
    churnedCount: 0, retentionRate: 0, churnRate: 0,
    facturacionElectronica: { si: 0, no: 0, percentSi: 0 },
    planData: [], deliveryData: [], cocasData: [], topBarrios: [], topRestricciones: [],
    retentionData: []
  });
  
  // Filters
  const [clientSearch, setClientSearch] = useState('');
  const [clientStatus, setClientStatus] = useState('');
  const [paymentSearch, setPaymentSearch] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('pendiente');

  const [selectedClient, setSelectedClient] = useState(null);
  const [viewingClient, setViewingClient] = useState(null);
  const [isCreatorModalOpen, setIsCreatorModalOpen] = useState(false);
  const [feriados, setFeriados] = useState([]);
  const [newFeriado, setNewFeriado] = useState({ fecha: '', descripcion: '' });
  
  const [weeklyMenu, setWeeklyMenu] = useState({ fechas: '', imagen_url: '' });
  const [menuImage, setMenuImage] = useState(null);
  const [menuPreview, setMenuPreview] = useState(null);
  const [menuHistory, setMenuHistory] = useState([]);
  const [menuLoading, setMenuLoading] = useState(false);
  const [configuraciones, setConfiguraciones] = useState([]);
  const [adminPlanes, setAdminPlanes] = useState([]);
  const navigate = useNavigate();
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    navigate('/login');
  };

  useEffect(() => {
    if (usuario.rol !== 'admin') {
      navigate('/dashboard');
      return;
    }
    fetchData();
  }, []);

  const handleAddConfig = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Nueva Configuración',
      html:
        '<input id="swal-input1" class="swal2-input" placeholder="Clave (ej: max_cupos)">' +
        '<input id="swal-input2" class="swal2-input" placeholder="Valor (Texto o número)">',
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const key = document.getElementById('swal-input1').value;
        const val = document.getElementById('swal-input2').value;
        const configError = validateConfig(key, val);
        if (configError) {
          Swal.showValidationMessage(configError);
          return false;
        }
        return [key, val];
      }
    });

    if (formValues && formValues[0] && formValues[1]) {
      try {
        await api.post('/admin/configuraciones', { clave: formValues[0], valor: formValues[1] });
        Swal.fire('Éxito', 'Configuración guardada', 'success');
        fetchData();
      } catch (error) {
        Swal.fire('Error', error.response?.data?.message || 'Error al guardar', 'error');
      }
    }
  };

  const handleToggleModoHibrida = async (currentVal) => {
    const newVal = currentVal === 'true' ? 'false' : 'true';
    try {
      const token = localStorage.getItem('token');
      await api.post('/admin/configuraciones', { clave: 'modo_hibrida', valor: newVal }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConfiguraciones(configuraciones.map(c => c.clave === 'modo_hibrida' ? { ...c, valor: newVal } : c));
      Swal.fire({ icon: 'success', title: 'Actualizado', toast: true, position: 'top-end', timer: 1500, showConfirmButton: false });
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Error al actualizar', text: e.response?.data?.message || e.message });
    }
  };

  const handleEditConfig = async (config) => {
    const { value: newVal } = await Swal.fire({
      title: `Editar ${config.clave}`,
      input: 'text',
      inputValue: config.valor,
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
      preConfirm: (value) => {
        const valError = validateConfigValue(value);
        if (valError) {
          Swal.showValidationMessage(valError);
          return false;
        }
        return value;
      }
    });

    if (newVal !== undefined && newVal !== config.valor) {
      try {
        await api.post('/admin/configuraciones', { clave: config.clave, valor: newVal });
        Swal.fire('Éxito', 'Configuración actualizada', 'success');
        fetchData();
      } catch (error) {
        Swal.fire('Error', error.response?.data?.message || 'Error al guardar', 'error');
      }
    }
  };

  const handleDeleteConfig = async (clave) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: `Se eliminará la configuración ${clave}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/admin/configuraciones/${clave}`);
        Swal.fire('Eliminado', 'La configuración ha sido eliminada', 'success');
        fetchData();
      } catch (error) {
        Swal.fire('Error', error.response?.data?.message || 'Error al eliminar', 'error');
      }
    }
  };

  const handleDownloadProduccion = async () => {
    try {
      Swal.fire({
        title: 'Generando Reporte...',
        text: 'Por favor espera mientras compilamos las rutas y agrupamos a los clientes.',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });
      const response = await api.get('/admin/export-excel', {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Rutas_Produccion_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      Swal.close();
      Swal.fire('¡Éxito!', 'Reporte descargado correctamente', 'success');
    } catch (error) {
      console.error(error);
      Swal.close();
      Swal.fire('Error', 'Hubo un problema al generar el reporte desde el servidor', 'error');
    }
  };

  const handleAddPlan = async () => {
    const { value: formValues } = await Swal.fire({
      title: 'Nuevo Plan',
      html:
        '<input id="swal-p1" class="swal2-input" placeholder="Nombre (ej: Semanal)">' +
        '<input id="swal-p2" type="number" min="0" class="swal2-input" placeholder="Precio Base">' +
        '<input id="swal-p3" type="number" min="0" class="swal2-input" placeholder="Días de Duración">',
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const name = document.getElementById('swal-p1').value;
        const price = document.getElementById('swal-p2').value;
        const days = document.getElementById('swal-p3').value;
        const planError = validatePlan(name, price, days);
        if (planError) {
          Swal.showValidationMessage(planError);
          return false;
        }
        return [name, price, days];
      }
    });

    if (formValues && formValues[0] && formValues[1] && formValues[2]) {
      try {
        await api.post('/admin/planes', {
          nombre: formValues[0],
          precio_base: parseFloat(formValues[1]),
          dias_duracion: parseInt(formValues[2], 10),
          esta_activo: true
        });
        Swal.fire('Éxito', 'Plan creado', 'success');
        fetchData();
      } catch (error) {
        Swal.fire('Error', error.response?.data?.message || 'Error al guardar', 'error');
      }
    }
  };

  const handleEditPlan = async (plan) => {
    const { value: formValues } = await Swal.fire({
      title: `Editar Plan ${plan.nombre}`,
      html:
        `<input id="swal-p1" class="swal2-input" placeholder="Nombre" value="${plan.nombre}">` +
        `<input id="swal-p2" type="number" min="0" class="swal2-input" placeholder="Precio Base" value="${plan.precio_base}">` +
        `<input id="swal-p3" type="number" min="0" class="swal2-input" placeholder="Días de Duración" value="${plan.dias_duracion}">`,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const name = document.getElementById('swal-p1').value;
        const price = document.getElementById('swal-p2').value;
        const days = document.getElementById('swal-p3').value;
        const planError = validatePlan(name, price, days);
        if (planError) {
          Swal.showValidationMessage(planError);
          return false;
        }
        return [name, price, days];
      }
    });

    if (formValues && formValues[0] && formValues[1] && formValues[2]) {
      try {
        await api.post('/admin/planes', {
          id: plan.id,
          nombre: formValues[0],
          precio_base: parseFloat(formValues[1]),
          dias_duracion: parseInt(formValues[2], 10),
          esta_activo: plan.esta_activo
        });
        Swal.fire('Éxito', 'Plan actualizado', 'success');
        fetchData();
      } catch (error) {
        Swal.fire('Error', error.response?.data?.message || 'Error al guardar', 'error');
      }
    }
  };

  const handleTogglePlanState = async (plan) => {
    try {
      await api.post('/admin/planes', {
        id: plan.id,
        nombre: plan.nombre,
        precio_base: plan.precio_base,
        dias_duracion: plan.dias_duracion,
        esta_activo: !plan.esta_activo
      });
      Swal.fire('Éxito', `Plan ${!plan.esta_activo ? 'activado' : 'desactivado'}`, 'success');
      fetchData();
    } catch (error) {
      Swal.fire('Error', error.response?.data?.message || 'Error al actualizar', 'error');
    }
  };

  const handleDeletePlan = async (id, nombre) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: `Se intentará eliminar el plan ${nombre}. Si tiene suscripciones, se ocultará en su lugar.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, proceder',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        const res = await api.delete(`/admin/planes/${id}`);
        Swal.fire('Operación Exitosa', res.data.message, 'success');
        fetchData();
      } catch (error) {
        Swal.fire('Error', error.response?.data?.message || 'Error al eliminar', 'error');
      }
    }
  };

  const handleDeactivateClient = async (cedula, nombre) => {
    const result = await Swal.fire({
      title: '¿Desactivar Cliente?',
      text: `El cliente ${nombre} será desactivado y pasará a estado inactivo.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, desactivar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/admin/clientes/${cedula}/desactivar`);
        Swal.fire('Desactivado', 'El cliente ha sido desactivado', 'success');
        fetchData();
      } catch (error) {
        Swal.fire('Error', error.response?.data?.message || 'Error al desactivar', 'error');
      }
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resClients, resPayments, resPlans, resConfig, resAdminPlanes] = await Promise.all([
        api.get('/admin/clientes'),
        api.get('/admin/comprobantes'),
        api.get('/planes'),
        api.get('/admin/configuraciones'),
        api.get('/admin/planes')
      ]);

      if (resConfig.data?.success) {
        let configs = resConfig.data.configuraciones || [];
        if (!configs.find(c => c.clave === 'modo_hibrida')) {
          configs.unshift({ clave: 'modo_hibrida', valor: 'true' });
        }
        setConfiguraciones(configs);
      }
      if (resAdminPlanes.data?.success) setAdminPlanes(resAdminPlanes.data.planes || []);

      if (resClients.data.success) {
        const mappedClients = resClients.data.clientes.map(c => {
          const subs = c.Suscripcions || c.Suscripciones || [];
          const sub = subs.length > 0 ? [...subs].sort((a,b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion))[0] : null;
          let dias = 0;
          let planNombre = 'N/A';
          let subStatus = c.esta_activo ? 'activo' : 'inactivo';
          let fechaVenc = '';

          if (sub) {
            const plan = sub.Plan || {};
            planNombre = (plan.nombre || 'N/A').toLowerCase();
            subStatus = (sub.estado || 'pendiente').toLowerCase();
            
            // Usar valores calculados inteligentemente por el backend
            fechaVenc = sub.fecha_vencimiento || '';
            dias = sub.dias_restantes || 0;
            
            // Reflejo inmediato en UI si los días se agotaron
            if (dias <= 0 && subStatus === 'activo') {
               subStatus = 'vencido';
            }
          }

          let esFraudulento = false;
          subs.forEach(s => {
             const comps = s.Comprobantes || (s.Comprobante ? [s.Comprobante] : []);
             comps.forEach(comp => {
                if (comp.estado === 'Rechazado' && comp.motivo_rechazo === 'Comprobante Falso') {
                   esFraudulento = true;
                }
             });
          });

          const mainDir = (sub && sub.direcciones && sub.direcciones.length > 0) ? (sub.direcciones.find(d => d.es_principal) || sub.direcciones[0]) : null;

          return {
            id: c.cedula,
            nombre: c.nombre,
            correo: c.correo,
            cedula: c.cedula,
            telefono: c.celular,
            direccion: mainDir ? mainDir.direccion : '',
            barrio: mainDir ? mainDir.barrio : '',
            facturacionElectronica: sub ? (sub.facturacion_electronica ? 'Si' : 'No') : 'No',
            plan: planNombre,
            status: subStatus,
            diasRestantes: dias,
            fechaVencimiento: fechaVenc,
            alergias: sub?.alergias,
            restricciones: sub?.restricciones,
            esFraudulento,
            raw: c // Keep full data
          };
        });
        setClients(mappedClients);
      }

      if (resPayments.data.success) {
        const mappedPayments = resPayments.data.comprobantes.map(p => ({
          id: p.id,
          clienteNombre: p.clienteNombre,
          clienteCedula: p.clienteCedula,
          plan: p.plan,
          monto: parseFloat(p.amount) || 0,
          fecha: p.createdAt ? p.createdAt.split('T')[0] : '',
          comprobante: p.imageUrl,
          status: p.status.toLowerCase(),
          necesitaCocas: p.necesitaCocas,
          tipoEntrega: p.tipoEntrega,
          facturacionElectronica: p.facturacionElectronica,
          alergias: p.alergias,
          restricciones: p.restricciones,
          direcciones: p.direcciones,
          clienteEmail: p.clienteEmail,
          clienteCelular: p.clienteCelular,
          subscriptionId: p.subscriptionId,
          motivo_rechazo: p.motivo_rechazo
        }));
        setPayments(mappedPayments);
      }

      if (resPlans.data.success) {
        setPlans(resPlans.data.planes);
      }

      const resFeriados = await api.get('/admin/feriados');
      if (resFeriados.data.success) {
        const currentYear = new Date().getFullYear();
        const autoHolidays = getHolidaysInRange(currentYear, currentYear + 1).map(h => ({
          id: `auto-${h.date}`,
          fecha: h.date,
          descripcion: `${h.name} (Automático Ley Emiliani)`,
          isAuto: true
        }));
        
        const dbHolidays = resFeriados.data.feriados || [];
        const dbDates = dbHolidays.map(d => d.fecha);
        const filteredAuto = autoHolidays.filter(a => !dbDates.includes(a.fecha));
        
        const combined = [...filteredAuto, ...dbHolidays].sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
        setFeriados(combined);
      }

      const resMenu = await api.get('/menu');
      if (resMenu.data.success && resMenu.data.menu) {
        setWeeklyMenu(resMenu.data.menu);
      }

      const resMenus = await api.get('/admin/menus');
      if (resMenus.data.success) {
        setMenuHistory(resMenus.data.menus);
      }

      await fetchRepartidores();
      await fetchStrategyStats();
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: 'error', title: 'Error de conexión', toast: true, position: 'bottom-end', showConfirmButton: false, timer: 3000 });
    } finally {
      setLoading(false);
    }
  };

  const fetchRepartidores = async () => {
    try {
      const res = await api.get('/admin/repartidores');
      if (res.data.success) {
        setRepartidores(res.data.repartidores);
      }
    } catch (err) {
      console.error("Error fetching repartidores:", err);
    }
  };

  const assignRepartidor = async (subscriptionId, repartidorId) => {
    try {
      const res = await api.post('/admin/asignar-repartidor', { subscriptionId, repartidorId });
      if (res.data.success) {
        Swal.fire({ icon: 'success', title: 'Repartidor asignado', toast: true, position: 'bottom-end', showConfirmButton: false, timer: 2000 });
        fetchData();
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error al asignar repartidor' });
    }
  };

  const handleMenuUpdate = async (e) => {
    e.preventDefault();
    const menuError = validateMenu(weeklyMenu.fechas);
    if (menuError) {
      Swal.fire('Validación', menuError, 'warning');
      return;
    }
    setMenuLoading(true);
    try {
      const data = new FormData();
      data.append('fechas', weeklyMenu.fechas);
      if (menuImage) data.append('menu_image', menuImage);

      const res = await api.post('/admin/menu', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        Swal.fire({ icon: 'success', title: 'Menú actualizado', toast: true, position: 'bottom-end', showConfirmButton: false, timer: 2000 });
        setWeeklyMenu(res.data.menu);
        setMenuImage(null);
        setMenuPreview(null);
        // Refresh history
        const resMenus = await api.get('/admin/menus');
        if (resMenus.data.success) setMenuHistory(resMenus.data.menus);
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error al actualizar menú' });
    } finally {
      setMenuLoading(false);
    }
  };

  const validatePayment = async (id, status, motivo = null, observaciones = null) => {
    try {
      const res = await api.post(`/admin/comprobantes/${id}/estado`, { 
        status: status === 'aprobado' ? 'Aprobado' : 'Rechazado',
        motivo_rechazo: motivo,
        observaciones: observaciones
      });
      if (res.data.success) {
        Swal.fire({ icon: 'success', title: `Pago ${status}`, toast: true, position: 'bottom-end', showConfirmButton: false, timer: 2000 });
        fetchData();
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error al procesar', toast: true, position: 'bottom-end', showConfirmButton: false, timer: 3000 });
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const res = await api.get(`/admin/dashboard-stats?period=${statsPeriod}&date=${customDate}`);
      if (res.data.success) {
        setDashboardStats(res.data.stats);
      }
    } catch (err) {
      console.error("Error fetching dashboard stats:", err);
    }
  };

  const fetchStrategyStats = async () => {
    try {
      const res = await api.get(`/admin/strategy-stats`);
      if (res.data.success) {
        setStrategyStats(res.data);
      }
    } catch (err) {
      console.error("Error fetching strategy stats:", err);
    }
  };

  useEffect(() => {
    if (usuario.rol === 'admin') {
      fetchDashboardStats();
    }
  }, [statsPeriod, customDate]);

  const filteredClients = clients.filter(c => {
    const searchMatch = c.nombre.toLowerCase().includes(clientSearch.toLowerCase()) || c.cedula.includes(clientSearch);
    if (!searchMatch) return false;
    if (clientStatus === '' || clientStatus === 'todos') return true;

    let isRunning = true;
    if (c.status === 'activo') {
       const subs = c.raw && (c.raw.Suscripcions || c.raw.Suscripciones) ? (c.raw.Suscripcions || c.raw.Suscripciones) : [];
       const activeSub = subs.sort((a,b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion))[0];
       if (activeSub && activeSub.fecha_inicio) {
         const [y, m, d] = activeSub.fecha_inicio.split('-');
         const start = new Date(y, m - 1, d);
         const today = new Date();
         today.setHours(0, 0, 0, 0);
         isRunning = start <= today;
       }
    }

    if (clientStatus === 'activo') return c.status === 'activo' && isRunning;
    if (clientStatus === 'futuro') return c.status === 'activo' && !isRunning;
    
    return c.status === clientStatus;
  });

  const filteredPayments = payments.filter(p => 
    (p.clienteNombre.toLowerCase().includes(paymentSearch.toLowerCase()) || p.plan.toLowerCase().includes(paymentSearch.toLowerCase())) &&
    (paymentStatusFilter === '' || p.status === paymentStatusFilter)
  );

  const stats = dashboardStats;
  const COLORS = ['#f97316', '#3b82f6', '#10b981', '#f43f5e', '#8b5cf6'];

  return (
    <div className="flex min-h-screen bg-gray-50 text-slate-900 overflow-x-hidden relative">
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`w-64 bg-slate-900 text-white fixed h-full z-50 overflow-y-auto transition-transform duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="p-8">
          <div className="flex items-center gap-4 mb-10">
            <img src="/logoLaCoca.svg" className="w-12 h-12 rounded-xl object-contain" />
            <div>
              <h1 className="text-sm font-black leading-tight tracking-tight uppercase">La Coca <br /> de Jacks</h1>
              <span className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">Admin Panel</span>
            </div>
          </div>

          <a 
            href="/" 
            className="flex items-center gap-3 px-4 py-3 mb-6 bg-slate-800/50 hover:bg-slate-800 text-orange-400 rounded-2xl text-[10px] font-black uppercase tracking-widest no-underline transition-all border border-slate-700/50"
          >
            <ExternalLink size={14} />
            Ver Sitio Web
          </a>

          <nav className="space-y-2">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'estrategia', label: 'Estrategia (BI)', icon: TrendingUp },
              { id: 'pagos', label: 'Validar Pagos', icon: CreditCard, badge: payments.filter(p => p.status === 'pendiente').length },
              { id: 'clientes', label: 'Lista Clientes', icon: Users },
              { id: 'mapa', label: 'Mapa Cobertura', icon: MapPin },
              { id: 'feriados', label: 'Festivos', icon: CalendarDays },
              { id: 'configuraciones', label: 'Configuraciones', icon: Settings },
              { id: 'menu', label: 'Menú Semanal', icon: ImageIcon },
              { id: 'repartidores', label: 'Repartidores', icon: MapPin, proximamente: true },
              { id: 'cocina', label: 'Cocina en Vivo', icon: ChefHat, proximamente: true }
            ].map(item => (
              <button 
                key={item.id}
                onClick={() => !item.proximamente && setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-black transition-all ${
                  item.proximamente ? 'opacity-60 cursor-not-allowed text-slate-500' :
                  activeTab === item.id ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <div className="shrink-0">
                  <item.icon size={18} />
                </div>
                <span className="truncate">{item.label}</span>
                {item.proximamente && (
                  <span className="ml-auto bg-slate-800 text-slate-400 text-[9px] px-1.5 py-0.5 rounded uppercase font-bold">Pronto</span>
                )}
                {item.badge > 0 && !item.proximamente && (
                  <span className="ml-auto bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full animate-pulse">{item.badge}</span>
                )}
              </button>
            ))}
          </nav>

            <div className="mt-12 pt-8 border-t border-slate-800">
            <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest px-4 mb-4 block">Reportes Rápidos</span>
            <div className="space-y-1">
              {['completo', 'cocina', 'logistica', 'produccion'].map(type => (
                <button 
                  key={type}
                  onClick={() => type === 'produccion' ? handleDownloadProduccion() : exportExcel(type, clients, payments, adminPlanes)}
                  className="w-full text-left px-4 py-2 text-xs text-slate-400 hover:text-white transition-colors font-bold uppercase tracking-tight flex items-center gap-2"
                >
                  <FileDown size={14} />
                  {type === 'completo' ? 'Todos los Clientes' : 
                   type === 'cocina' ? 'Cocina y Restricciones' : 
                   type === 'logistica' ? 'Despachos (Logística)' : 
                   'Rutas (Producción Oficial)'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 w-full lg:ml-64 p-4 lg:p-10 transition-all duration-300">
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 lg:gap-0 mb-6 lg:mb-10">
          <div className="flex items-center gap-4 w-full lg:w-auto">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 bg-white rounded-xl shadow-sm border border-gray-100 text-slate-600 lg:hidden hover:bg-gray-50"
            >
              <Menu size={24} />
            </button>
            <div>
              <h2 className="text-xl lg:text-3xl font-black text-slate-900 tracking-tight">
                {activeTab === 'dashboard' ? 'Resumen de Negocio' : 
                 activeTab === 'cocina' ? 'Planilla de Cocina (En Vivo)' :
                 activeTab === 'pagos' ? 'Validación de Pagos' : 
                 activeTab === 'clientes' ? 'Gestión de Clientes' : 
                 activeTab === 'repartidores' ? 'Gestión de Repartidores' : 
                 activeTab === 'feriados' ? 'Calendario de Festivos' : 
                 activeTab === 'configuraciones' ? 'Configuraciones del Sistema' : 
                 'Configuración de Menú'}
              </h2>
              <p className="text-xs lg:text-sm text-gray-500 font-medium">Panel centralizado de operaciones</p>
            </div>
          </div>
          <div className="flex items-center gap-2 lg:gap-4 self-end lg:self-auto">
            <div className="text-right mr-2 lg:mr-4">
               <div className="text-[9px] lg:text-[10px] font-black text-slate-400 uppercase tracking-widest">Actualizado</div>
               <div className="text-[10px] lg:text-xs font-bold text-slate-900">{new Date().toLocaleTimeString()}</div>
            </div>
            <button 
              onClick={fetchData}
              className={`p-2 lg:p-3 bg-white rounded-xl shadow-sm border border-gray-100 text-slate-400 hover:text-orange-500 transition-all ${loading ? 'animate-spin' : ''}`}
              title="Sincronizar datos"
            >
               <Clock size={16} className="lg:w-5 lg:h-5" />
            </button>

            <button 
              onClick={handleLogout}
              className="p-2 lg:p-3 bg-red-50 rounded-xl shadow-sm border border-red-100 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center gap-2"
              title="Cerrar sesión"
            >
               <LogOut size={16} className="lg:w-5 lg:h-5" />
               <span className="text-xs font-black uppercase tracking-tight hidden sm:block">Salir</span>
            </button>
          </div>
        </header>

        <AnimatePresence mode="wait">

          {activeTab === 'dashboard' && (
            <motion.div 
              key="dash"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-100 flex items-center flex-wrap gap-2">
                  <div className="flex">
                    {['hoy', 'semana', 'mes', 'total'].map(p => (
                      <button 
                        key={p}
                        onClick={() => { setStatsPeriod(p); setCustomDate(''); }}
                        className={`px-4 py-2 text-xs font-black uppercase rounded-lg transition-all ${
                          statsPeriod === p ? 'bg-orange-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  <div className="hidden sm:block h-6 w-px bg-gray-200 mx-1"></div>
                  <div className="flex items-center gap-2 px-2 pb-1 sm:pb-0">
                    <span className="text-xs font-bold text-slate-400 uppercase">Día:</span>
                    <input 
                      type="date"
                      value={customDate}
                      onChange={e => {
                        setCustomDate(e.target.value);
                        if (e.target.value) setStatsPeriod('custom');
                        else setStatsPeriod('mes');
                      }}
                      className="bg-gray-50 border-none rounded-lg px-3 py-1.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
              </div>

              {/* STATS RAPIDOS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                 <StatCard title="Ingresos Aprobados" value={`$${stats.income.toLocaleString()}`} icon={DollarSign} color="bg-green-500" desc="Ventas netas" />
                 <StatCard title="Clientes Activos" value={stats.active} icon={Users} color="bg-blue-500" desc="Suscripciones vigentes" />
                 <StatCard title="Pagos Pendientes" value={stats.pending} icon={CreditCard} color="bg-amber-500" desc="Por verificar" urgent={stats.pending > 0} />
                 <StatCard title="Rechazos (Fraude)" value={stats.byFake} icon={AlertTriangle} color="bg-red-600" desc="Comprobantes falsos" urgent={stats.byFake > 0} />
              </div>

              {/* ZONA DE ALERTAS Y ACTIVIDAD */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
                 
                 {/* Alertas Urgentes */}
                 <div className="md:col-span-1 space-y-4">
                    <div className="bg-red-50 p-5 rounded-3xl border border-red-100 shadow-sm relative overflow-hidden">
                       <div className="absolute -top-4 -right-4 text-red-100/50">
                          <AlertCircle size={100} />
                       </div>
                       <h3 className="text-xs font-black uppercase text-red-600 tracking-widest mb-4 relative z-10 flex items-center gap-2">
                         <AlertTriangle size={16}/> Alertas Urgentes
                       </h3>
                       
                       <div className="space-y-3 relative z-10">
                          {(() => {
                             const expiring = clients.filter(c => c.status === 'activo' && c.diasRestantes <= 3);
                             const pendingPayments = payments.filter(p => p.status === 'pendiente');
                             
                             return (
                               <>
                                 <div className="bg-white p-3 rounded-2xl shadow-sm border border-red-100 flex justify-between items-center cursor-pointer hover:border-red-300 transition-colors" onClick={() => setActiveTab('pagos')}>
                                   <div>
                                     <div className="text-xs font-black text-slate-800">Validar Pagos</div>
                                     <div className="text-[10px] text-slate-500 font-bold">Comprobantes subidos</div>
                                   </div>
                                   <div className={`px-2 py-1 rounded-lg text-xs font-black ${pendingPayments.length > 0 ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                     {pendingPayments.length}
                                   </div>
                                 </div>
                                 
                                 <div className="bg-white p-3 rounded-2xl shadow-sm border border-red-100 flex justify-between items-center cursor-pointer hover:border-red-300 transition-colors" onClick={() => setActiveTab('clientes')}>
                                   <div>
                                     <div className="text-xs font-black text-slate-800">Vencimientos</div>
                                     <div className="text-[10px] text-slate-500 font-bold">Planes por vencer (≤ 3 días)</div>
                                   </div>
                                   <div className={`px-2 py-1 rounded-lg text-xs font-black ${expiring.length > 0 ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                     {expiring.length}
                                   </div>
                                 </div>
                               </>
                             );
                          })()}
                       </div>
                    </div>

                    <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
                       <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-4">Otros Rechazos</h3>
                       <div className="flex justify-between items-center border-b border-gray-50 pb-2 mb-2">
                         <span className="text-xs font-bold text-slate-700 flex items-center gap-2"><Package size={14} className="text-amber-500"/> Mentira Cocas</span>
                         <span className="text-xs font-black text-slate-900">{stats.byCocas}</span>
                       </div>
                       <div className="flex justify-between items-center">
                         <span className="text-xs font-bold text-slate-700 flex items-center gap-2"><Clock size={14} className="text-slate-400"/> No Reflejados</span>
                         <span className="text-xs font-black text-slate-900">{stats.byNotReflected}</span>
                       </div>
                    </div>
                 </div>

                 {/* Actividad Reciente */}
                 <div className="md:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col h-full">
                    <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                       <h3 className="text-xs font-black uppercase text-slate-900 tracking-widest">Actividad Reciente</h3>
                       <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-50 px-2 py-1 rounded-lg">Últimos Pagos</span>
                    </div>
                    <div className="p-2 flex-1">
                       {(() => {
                         const recent = [...payments].sort((a,b) => b.id - a.id).slice(0, 6);
                         if (recent.length === 0) return <div className="p-5 text-center text-xs text-slate-400 font-bold">No hay actividad reciente</div>;
                         return recent.map(p => (
                           <div key={p.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-2xl transition-colors cursor-pointer group" onClick={() => setActiveTab('pagos')}>
                             <div className="flex items-center gap-3">
                               <div className={`w-10 h-10 rounded-full flex items-center justify-center ${p.status === 'aprobado' ? 'bg-green-100 text-green-600' : p.status === 'rechazado' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                                 {p.status === 'aprobado' ? <Check size={16} /> : p.status === 'rechazado' ? <X size={16} /> : <Clock size={16} />}
                               </div>
                               <div>
                                 <div className="text-sm font-black text-slate-900 group-hover:text-orange-500 transition-colors">{p.clienteNombre}</div>
                                 <div className="text-[10px] font-bold text-slate-500 uppercase">{p.plan} • {p.fecha}</div>
                               </div>
                             </div>
                             <div className="text-right">
                               <div className="text-sm font-black text-slate-900">${p.monto.toLocaleString()}</div>
                               <div className={`text-[10px] font-bold uppercase tracking-widest ${p.status === 'aprobado' ? 'text-green-500' : p.status === 'rechazado' ? 'text-red-500' : 'text-amber-500'}`}>{p.status}</div>
                             </div>
                           </div>
                         ));
                       })()}
                    </div>
                 </div>

              </div>
            </motion.div>
          )}

          {activeTab === 'estrategia' && (
            <motion.div 
              key="estrategia"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* HERO KPIs */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                <div className="bg-slate-900 p-5 lg:p-6 rounded-3xl text-white shadow-xl relative overflow-hidden col-span-2">
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-orange-500 rounded-full blur-3xl opacity-30"></div>
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-orange-400 mb-1">Ingreso Mensual Recurrente</h3>
                  <div className="text-2xl lg:text-3xl font-black">${strategyStats.mrr.toLocaleString()} <span className="text-sm text-slate-400">COP</span></div>
                  <div className="flex items-center gap-4 mt-3">
                    <div className="text-[10px] text-slate-400"><span className="text-white font-black">{strategyStats.totalActive}</span> clientes activos</div>
                    <div className="text-[10px] text-slate-400">Ticket Prom: <span className="text-white font-black">${strategyStats.avgTicket.toLocaleString()}</span></div>
                  </div>
                </div>
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Retención</h3>
                  <div className="text-3xl font-black text-emerald-500">{strategyStats.retentionRate}%</div>
                  <p className="text-[10px] text-slate-400 font-bold mt-1">{strategyStats.activeNow} clientes siguen activos</p>
                </div>
                <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Churn (Abandono)</h3>
                  <div className="text-3xl font-black text-red-500">{strategyStats.churnRate}%</div>
                  <p className="text-[10px] text-slate-400 font-bold mt-1">{strategyStats.churnedCount} no renovaron</p>
                </div>
              </div>

              {/* SNAPSHOT */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: 'Total Registrados', value: strategyStats.totalClientes, color: 'text-slate-900' },
                  { label: 'Suscripciones Históricas', value: strategyStats.totalSubs, color: 'text-blue-600' },
                  { label: 'Activos Ahora', value: strategyStats.totalActive, color: 'text-emerald-600' },
                  { label: 'Facturación E.', value: `${strategyStats.facturacionElectronica.percentSi}%`, sub: `${strategyStats.facturacionElectronica.si} de ${strategyStats.totalActive}`, color: 'text-violet-600' }
                ].map((kpi, i) => (
                  <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{kpi.label}</div>
                    <div className={`text-xl lg:text-2xl font-black ${kpi.color}`}>{typeof kpi.value === 'number' ? kpi.value.toLocaleString() : kpi.value}</div>
                    {kpi.sub && <div className="text-[10px] text-slate-400 mt-0.5">{kpi.sub}</div>}
                  </div>
                ))}
              </div>

              {/* RETENCIÓN + PLANES */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                  <h3 className="text-xs font-black uppercase text-slate-900 tracking-widest mb-2">Retención de Clientes</h3>
                  <p className="text-[10px] text-slate-400 mb-6">¿Cuántos vuelven a suscribirse?</p>
                  {strategyStats.retentionData.length > 0 ? (
                    <div className="space-y-4">
                      {strategyStats.retentionData.map((item, i) => {
                        const colors = ['#10b981', '#3b82f6', '#f97316'];
                        const bgColors = ['bg-emerald-50', 'bg-blue-50', 'bg-orange-50'];
                        const textColors = ['text-emerald-600', 'text-blue-600', 'text-orange-600'];
                        return (
                          <div key={i}>
                            <div className="flex justify-between items-center mb-1.5">
                              <span className="text-xs font-black text-slate-700">{item.name}</span>
                              <div className="flex items-center gap-2">
                                <span className={`${bgColors[i]} ${textColors[i]} px-2 py-0.5 rounded-full text-[10px] font-black`}>{item.value} clientes</span>
                                <span className="text-xs font-black text-slate-900">{item.percent}%</span>
                              </div>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${item.percent}%` }}
                                transition={{ duration: 1, delay: i * 0.2 }}
                                className="h-full rounded-full"
                                style={{ backgroundColor: colors[i] }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 text-center py-8">No hay datos suficientes</p>
                  )}
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                  <h3 className="text-xs font-black uppercase text-slate-900 tracking-widest mb-2">Distribución de Planes</h3>
                  <p className="text-[10px] text-slate-400 mb-4">Solo clientes activos</p>
                  <div className="h-48">
                    <Pie 
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { display: false },
                          tooltip: { backgroundColor: '#fff', titleColor: '#0f172a', bodyColor: '#64748b', borderColor: '#f1f5f9', borderWidth: 1, padding: 12, cornerRadius: 16 }
                        }
                      }}
                      data={{
                        labels: strategyStats.planData.map(d => `${d.name} (${d.percent}%)`),
                        datasets: [{
                          data: strategyStats.planData.map(d => d.value),
                          backgroundColor: COLORS.slice(0, strategyStats.planData.length),
                          borderWidth: 0,
                          hoverOffset: 4
                        }]
                      }}
                    />
                  </div>
                  <div className="mt-4 space-y-1.5">
                    {strategyStats.planData.map((d, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }}></div>
                          <span className="font-bold text-slate-700">{d.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">{d.value}</span>
                          <span className="font-black text-slate-900 bg-slate-50 px-2 py-0.5 rounded-lg">{d.percent}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* BARRIOS HEATMAP */}
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-xs font-black uppercase text-slate-900 tracking-widest">Top Barrios</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Concentración geográfica de clientes activos</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="h-64">
                    <Bar 
                      options={{
                        indexAxis: 'y',
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { display: false },
                          tooltip: { 
                            backgroundColor: '#fff', titleColor: '#0f172a', bodyColor: '#64748b', borderColor: '#f1f5f9', borderWidth: 1, padding: 12, cornerRadius: 16,
                            callbacks: {
                              label: (ctx) => {
                                const barrio = strategyStats.topBarrios[ctx.dataIndex];
                                return barrio ? `${barrio.cantidad} clientes (${barrio.percent}%)` : '';
                              }
                            }
                          }
                        },
                        scales: {
                          x: { display: false },
                          y: { border: { display: false }, grid: { display: false }, ticks: { font: { size: 10, weight: 'bold' }, color: '#64748b' } }
                        }
                      }} 
                      data={{
                        labels: strategyStats.topBarrios.map(b => b.name),
                        datasets: [{
                          data: strategyStats.topBarrios.map(b => b.cantidad),
                          backgroundColor: '#f97316',
                          borderRadius: 8,
                          barPercentage: 0.6
                        }]
                      }} 
                    />
                  </div>
                  <div className="space-y-2">
                    {strategyStats.topBarrios.map((b, i) => (
                      <div key={i} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                        <div className="flex items-center gap-2.5">
                          <span className="w-5 h-5 rounded-lg bg-orange-100 text-orange-600 text-[10px] font-black flex items-center justify-center">{i + 1}</span>
                          <span className="text-xs font-bold text-slate-700 capitalize">{b.name.toLowerCase()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400">{b.cantidad}</span>
                          <span className="bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full text-[10px] font-black">{b.percent}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ENTREGA, COCAS, RESTRICCIONES */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                  <h3 className="text-xs font-black uppercase text-slate-900 tracking-widest mb-1">Modalidad de Entrega</h3>
                  <p className="text-[10px] text-slate-400 mb-4">Fija vs Híbrida</p>
                  <div className="h-40">
                    <Pie 
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { display: false },
                          tooltip: { backgroundColor: '#fff', titleColor: '#0f172a', bodyColor: '#64748b', borderColor: '#f1f5f9', borderWidth: 1, padding: 12, cornerRadius: 16 }
                        }
                      }}
                      data={{
                        labels: strategyStats.deliveryData.map(d => d.name),
                        datasets: [{
                          data: strategyStats.deliveryData.map(d => d.value),
                          backgroundColor: ['#3b82f6', '#8b5cf6'],
                          borderWidth: 0,
                          hoverOffset: 4
                        }]
                      }}
                    />
                  </div>
                  <div className="mt-4 space-y-1.5">
                    {strategyStats.deliveryData.map((d, i) => (
                      <div key={i} className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ['#3b82f6', '#8b5cf6'][i] }}></div>
                          <span className="font-bold text-slate-700">{d.name}</span>
                        </div>
                        <span className="font-black text-slate-900">{d.percent}%<span className="text-slate-400 font-normal ml-1">({d.value})</span></span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                  <h3 className="text-xs font-black uppercase text-slate-900 tracking-widest mb-1">Demanda de Cocas</h3>
                  <p className="text-[10px] text-slate-400 mb-4">Compraron vs ya tenían</p>
                  <div className="h-40">
                    <Pie 
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { display: false },
                          tooltip: { backgroundColor: '#fff', titleColor: '#0f172a', bodyColor: '#64748b', borderColor: '#f1f5f9', borderWidth: 1, padding: 12, cornerRadius: 16 }
                        }
                      }}
                      data={{
                        labels: strategyStats.cocasData.map(d => d.name),
                        datasets: [{
                          data: strategyStats.cocasData.map(d => d.value),
                          backgroundColor: ['#f43f5e', '#10b981'],
                          borderWidth: 0,
                          hoverOffset: 4
                        }]
                      }}
                    />
                  </div>
                  <div className="mt-4 space-y-1.5">
                    {strategyStats.cocasData.map((d, i) => (
                      <div key={i} className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ['#f43f5e', '#10b981'][i] }}></div>
                          <span className="font-bold text-slate-700">{d.name}</span>
                        </div>
                        <span className="font-black text-slate-900">{d.percent}%<span className="text-slate-400 font-normal ml-1">({d.value})</span></span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 overflow-y-auto max-h-[360px]">
                  <h3 className="text-xs font-black uppercase text-slate-900 tracking-widest mb-1 sticky top-0 bg-white z-10 pb-1">Alergias & Restricciones</h3>
                  <p className="text-[10px] text-slate-400 mb-4">Frecuencia entre clientes activos</p>
                  <div className="space-y-2">
                    {strategyStats.topRestricciones.map((r, i) => (
                      <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                        <span className="text-xs font-bold text-slate-700 capitalize">{r.name.toLowerCase()}</span>
                        <span className="bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full text-[10px] font-black">{r.value}</span>
                      </div>
                    ))}
                    {strategyStats.topRestricciones.length === 0 && (
                      <p className="text-xs text-slate-400 text-center py-4">No hay datos suficientes</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'cocina' && (
            <motion.div 
              key="cocina"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {(() => {
                // Cálculo en tiempo real de la cocina
                const hoyStr = new Date().toISOString().split('T')[0];
                const esFeriado = feriados.some(f => f.fecha === hoyStr);
                
                const clientesActivos = clients.filter(c => c.status === 'activo');
                const totalAlmuerzos = esFeriado ? 0 : clientesActivos.length;
                
                // Extraer restricciones y alergias
                const restriccionesTotales = {};
                const alergiasTotales = {};
                let cocasNuevas = 0;

                clientesActivos.forEach(c => {
                  if (c.raw && (c.raw.Suscripcions || c.raw.Suscripciones)) {
                    const rawSubs = c.raw.Suscripcions || c.raw.Suscripciones;
                    const sub = rawSubs.sort((a,b) => new Date(b.fecha_creacion) - new Date(a.fecha_creacion))[0];
                    if (sub) {
                      if (sub.necesita_cocas) cocasNuevas++;
                      
                      if (sub.restricciones && sub.restricciones !== 'Ninguna') {
                        sub.restricciones.split(',').forEach(r => {
                          const trimR = r.trim();
                          if (trimR) restriccionesTotales[trimR] = (restriccionesTotales[trimR] || 0) + 1;
                        });
                      }
                      
                      if (sub.alergias && sub.alergias !== 'Ninguna') {
                        const alerg = sub.alergias.trim();
                        if (alerg) alergiasTotales[alerg] = (alergiasTotales[alerg] || 0) + 1;
                      }
                    }
                  }
                });

                return (
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                      <div className={`p-8 rounded-[32px] text-white shadow-xl ${esFeriado ? 'bg-red-500' : 'bg-slate-900'}`}>
                        <div className="flex justify-between items-start mb-4">
                          <div className="p-3 bg-white/10 rounded-2xl">
                            <ChefHat size={32} className="text-orange-400" />
                          </div>
                          <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                            {new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
                          </span>
                        </div>
                        <h3 className="text-5xl font-black mb-2">{totalAlmuerzos}</h3>
                        <p className="text-slate-400 font-medium text-sm">Almuerzos totales a preparar HOY</p>
                        {esFeriado && <p className="mt-4 text-xs font-black bg-white/20 text-white p-2 rounded-lg inline-block">HOY ES FESTIVO - NO HAY SERVICIO</p>}
                      </div>
                      
                      <div className="p-8 rounded-[32px] bg-orange-50 border border-orange-100 shadow-sm flex flex-col justify-center">
                        <div className="flex items-center gap-4 mb-2">
                          <Package size={24} className="text-orange-500" />
                          <h4 className="text-lg font-black text-orange-900">Juegos de Cocas Nuevos</h4>
                        </div>
                        <p className="text-4xl font-black text-orange-600 mb-2">{cocasNuevas}</p>
                        <p className="text-sm font-medium text-orange-700">Clientes nuevos que requieren entrega de recipientes hoy.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                      <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
                        <h4 className="text-lg font-black text-slate-900 flex items-center gap-2 mb-6">
                          <Utensils size={20} className="text-amber-500" /> Restricciones (Dietas)
                        </h4>
                        {Object.keys(restriccionesTotales).length === 0 ? (
                          <p className="text-sm text-gray-400 italic">No hay dietas especiales hoy.</p>
                        ) : (
                          <div className="space-y-3">
                            {Object.entries(restriccionesTotales).map(([res, count]) => (
                              <div key={res} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                                <span className="font-bold text-slate-700 capitalize">{res}</span>
                                <span className="bg-amber-100 text-amber-700 font-black px-3 py-1 rounded-lg">{count}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
                        <h4 className="text-lg font-black text-slate-900 flex items-center gap-2 mb-6">
                          <AlertTriangle size={20} className="text-red-500" /> Alergias Reportadas
                        </h4>
                        {Object.keys(alergiasTotales).length === 0 ? (
                          <p className="text-sm text-gray-400 italic">No hay alergias reportadas hoy.</p>
                        ) : (
                          <div className="space-y-3">
                            {Object.entries(alergiasTotales).map(([alerg, count]) => (
                              <div key={alerg} className="flex justify-between items-center p-3 bg-red-50 rounded-xl">
                                <span className="font-bold text-red-700 capitalize">{alerg}</span>
                                <span className="bg-red-500 text-white font-black px-3 py-1 rounded-lg">{count}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          )}

          {activeTab === 'feriados' && (
            <motion.div 
              key="feriados"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden"
            >
              <div className="p-4 lg:p-10">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-8">
                  <div>
                    <h3 className="text-xl font-black text-slate-900">Gestión de Festivos</h3>
                    <p className="text-sm text-gray-500 font-medium">Define los días que no hay servicio para el descuento automático</p>
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      className="bg-gray-50 border-none rounded-xl px-4 py-2 text-sm font-medium"
                      value={newFeriado.fecha}
                      onChange={e => setNewFeriado({...newFeriado, fecha: e.target.value})}
                    />
                    <input 
                      placeholder="Descripción"
                      className="bg-gray-50 border-none rounded-xl px-4 py-2 text-sm font-medium"
                      value={newFeriado.descripcion}
                      onChange={e => setNewFeriado({...newFeriado, descripcion: e.target.value})}
                    />
                    <button 
                      onClick={async () => {
                        const feriadoError = validateFeriado(newFeriado.fecha, newFeriado.descripcion);
                        if (feriadoError) {
                          Swal.fire('Validación', feriadoError, 'warning');
                          return;
                        }
                        try {
                          await api.post('/admin/feriados', newFeriado);
                          setNewFeriado({ fecha: '', descripcion: '' });
                          Swal.fire({ icon: 'success', title: 'Festivo registrado', toast: true, position: 'bottom-end', showConfirmButton: false, timer: 2000 });
                          fetchData();
                        } catch (error) {
                          Swal.fire('Error', error.response?.data?.message || 'Error al guardar', 'error');
                        }
                      }}
                      className="bg-orange-600 text-white p-3 rounded-xl hover:bg-orange-700 transition-all"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                </div>

                <div className="bg-gray-50/50 rounded-3xl border border-gray-100 overflow-hidden">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-white border-b border-gray-100">
                        <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Fecha</th>
                        <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Descripción / Motivo</th>
                        <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {feriados.map(f => (
                        <tr key={f.id} className="hover:bg-gray-50/30 transition-colors">
                          <td className="px-8 py-4">
                            <div className="flex items-center gap-3">
                               <div className="w-8 h-8 rounded-lg bg-red-50 text-red-500 flex items-center justify-center">
                                  <Calendar size={14} />
                               </div>
                               <span className="text-sm font-black text-slate-800">{f.fecha}</span>
                            </div>
                          </td>
                          <td className="px-8 py-4">
                            <span className="text-sm font-bold text-slate-500">{f.descripcion}</span>
                          </td>
                          <td className="px-8 py-4">
                            <div className="flex items-center gap-2">
                              {!f.isAuto && f.activo !== false && (
                                <button 
                                  onClick={async () => {
                                    await api.delete(`/admin/feriados/${f.id}`);
                                    fetchData();
                                  }}
                                  className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                  title="Eliminar festivo manual"
                                >
                                  <X size={16} strokeWidth={3} />
                                </button>
                              )}
                              
                              {(f.isAuto || f.activo === false) && (
                                <button
                                  onClick={async () => {
                                    await api.post('/admin/feriados/toggle', { fecha: f.fecha, descripcion: f.descripcion });
                                    fetchData();
                                  }}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    f.activo !== false
                                      ? 'bg-red-50 text-red-600 hover:bg-red-100'
                                      : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                                  }`}
                                >
                                  {f.activo !== false ? 'Deshabilitar' : 'Rehabilitar'}
                                </button>
                              )}
                              
                              {f.isAuto && f.activo !== false && (
                                <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded-full border border-gray-200">
                                  Sistema
                                </span>
                              )}
                              {f.activo === false && (
                                <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-1 rounded-full border border-red-200">
                                  Ignorado
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {feriados.length === 0 && (
                        <tr>
                          <td colSpan="3" className="text-center py-20 text-gray-400 font-medium italic">No hay festivos registrados</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'configuraciones' && (
            <motion.div 
              key="configuraciones"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden"
            >
              <div className="p-4 lg:p-10 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 bg-slate-50/50">
                <div>
                  <h3 className="text-xl font-black text-slate-900">Variables de Sistema</h3>
                  <p className="text-sm text-gray-500 font-medium">Gestiona parámetros globales y límites</p>
                </div>
                <button 
                  onClick={handleAddConfig}
                  className="bg-orange-600 text-white px-6 py-3 rounded-2xl font-black text-xs hover:bg-orange-700 shadow-lg shadow-orange-500/30 transition-all flex items-center gap-2"
                >
                  <Plus size={16} strokeWidth={3} />
                  Nueva Variable
                </button>
              </div>
              <div className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-y border-gray-100">
                      <tr>
                        <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Clave</th>
                        <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Valor</th>
                        <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {configuraciones.map(config => (
                        <tr key={config.clave} className="hover:bg-gray-50/30 transition-colors">
                          <td className="px-8 py-4">
                            <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-black uppercase tracking-widest">{config.clave}</span>
                          </td>
                          <td className="px-8 py-4">
                            {config.clave === 'modo_hibrida' ? (
                              <button
                                onClick={() => handleToggleModoHibrida(config.valor)}
                                className={`w-12 h-6 rounded-full transition-colors relative flex items-center ${config.valor === 'true' ? 'bg-orange-500' : 'bg-gray-300'}`}
                              >
                                <span className={`absolute w-4 h-4 rounded-full bg-white transition-transform ${config.valor === 'true' ? 'translate-x-7' : 'translate-x-1'}`}></span>
                              </button>
                            ) : (
                              <span className="text-xs font-bold text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                                {config.valor}
                              </span>
                            )}
                          </td>
                          <td className="px-8 py-4 text-right">
                            <button 
                              onClick={() => handleEditConfig(config)}
                              className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all mr-2"
                              title="Editar"
                            >
                              <Settings size={16} strokeWidth={2} />
                            </button>
                            <button 
                              onClick={() => handleDeleteConfig(config.clave)}
                              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                              title="Eliminar"
                            >
                              <X size={16} strokeWidth={3} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {configuraciones.length === 0 && (
                        <tr>
                          <td colSpan="3" className="text-center py-20 text-gray-400 font-medium italic">No hay configuraciones registradas</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* TABLA DE PLANES */}
              <div className="p-4 lg:p-10 border-y border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 bg-slate-50/50 mt-8">
                <div>
                  <h3 className="text-xl font-black text-slate-900">Configuración de Planes</h3>
                  <p className="text-sm text-gray-500 font-medium">Gestiona los planes de suscripción disponibles</p>
                </div>
                <button 
                  onClick={handleAddPlan}
                  className="bg-orange-600 text-white px-6 py-3 rounded-2xl font-black text-xs hover:bg-orange-700 shadow-lg shadow-orange-500/30 transition-all flex items-center gap-2"
                >
                  <Plus size={16} strokeWidth={3} />
                  Nuevo Plan
                </button>
              </div>
              <div className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-y border-gray-100">
                      <tr>
                        <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Nombre</th>
                        <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Precio Base</th>
                        <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Días</th>
                        <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Estado</th>
                        <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {adminPlanes.map(plan => (
                        <tr key={plan.id} className={`hover:bg-gray-50/30 transition-colors ${!plan.esta_activo ? 'opacity-50' : ''}`}>
                          <td className="px-8 py-4">
                            <span className="text-sm font-black text-slate-800 uppercase tracking-widest">{plan.nombre}</span>
                          </td>
                          <td className="px-8 py-4">
                            <span className="text-sm font-bold text-slate-600">${parseFloat(plan.precio_base).toLocaleString()}</span>
                          </td>
                          <td className="px-8 py-4">
                            <span className="text-sm font-bold text-slate-600">{plan.dias_duracion}</span>
                          </td>
                          <td className="px-8 py-4 text-center">
                            <button
                              onClick={() => handleTogglePlanState(plan)}
                              className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                                plan.esta_activo 
                                  ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                                  : 'bg-slate-200 text-slate-500 hover:bg-slate-300'
                              }`}
                            >
                              {plan.esta_activo ? 'Activo' : 'Inactivo'}
                            </button>
                          </td>
                          <td className="px-8 py-4 text-right">
                            <button 
                              onClick={() => handleEditPlan(plan)}
                              className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all mr-2"
                              title="Editar"
                            >
                              <Settings size={16} strokeWidth={2} />
                            </button>
                            <button 
                              onClick={() => handleDeletePlan(plan.id, plan.nombre)}
                              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                              title="Eliminar / Ocultar"
                            >
                              <X size={16} strokeWidth={3} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {adminPlanes.length === 0 && (
                        <tr>
                          <td colSpan="5" className="text-center py-20 text-gray-400 font-medium italic">No hay planes registrados</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'mapa' && (
            <motion.div 
              key="mapa"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden"
            >
              <div className="p-4 lg:p-10">
                <div className="mb-6 lg:mb-10">
                  <h3 className="text-xl font-black text-slate-900">Mapa de Cobertura Geográfica</h3>
                  <p className="text-sm text-gray-500 font-medium">Visualización de los polígonos de entrega en Medellín (Poblado, Laureles, Envigado, Belén y Centro)</p>
                </div>
                
                <CoverageMap />
                
                <div className="mt-8 p-6 bg-orange-50 rounded-2xl border border-orange-100">
                  <h4 className="text-sm font-black text-orange-800 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <AlertCircle size={16} /> Información Técnica
                  </h4>
                  <p className="text-xs font-medium text-orange-700 leading-relaxed">
                    Este mapa utiliza los datos del archivo <code className="bg-orange-100 px-1 rounded">cobertura.json</code>. 
                    Cualquier dirección ingresada por un cliente es validada contra estos polígonos usando la librería Turf.js para asegurar que estemos dentro de la zona de servicio.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'menu' && (
            <motion.div 
              key="menu"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden"
            >
              <div className="p-4 lg:p-10">
                <div className="mb-6 lg:mb-10">
                  <h3 className="text-xl font-black text-slate-900">Menú de la Semana</h3>
                  <p className="text-sm text-gray-500 font-medium">Actualiza la imagen y las fechas que verán los clientes en la landing page</p>
                </div>

                <form onSubmit={handleMenuUpdate} className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Fechas del Menú</label>
                      <input 
                        type="text"
                        value={weeklyMenu.fechas}
                        onChange={e => setWeeklyMenu({...weeklyMenu, fechas: e.target.value})}
                        placeholder="Ej: Del 11 al 15 de Mayo"
                        className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-orange-500 transition-all"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Imagen del Menú</label>
                      <div className="relative group">
                        <input 
                          type="file" 
                          onChange={e => {
                            const file = e.target.files[0];
                            if (file) {
                              const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
                              if (!allowedTypes.includes(file.type)) {
                                Swal.fire('Error de Archivo', 'Solo se permiten imágenes (JPG, PNG, WebP, GIF)', 'warning');
                                return;
                              }
                              const maxSize = 5 * 1024 * 1024; // 5MB
                              if (file.size > maxSize) {
                                Swal.fire('Error de Archivo', 'La imagen no puede superar los 5MB', 'warning');
                                return;
                              }
                              setMenuImage(file);
                              setMenuPreview(URL.createObjectURL(file));
                            }
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer z-10"
                          accept="image/*"
                        />
                        <div className="border-2 border-dashed border-gray-200 rounded-[32px] p-12 text-center group-hover:border-orange-500 transition-all bg-gray-50">
                          <Upload className="mx-auto text-gray-300 group-hover:text-orange-500 mb-4 transition-colors" size={40} />
                          <div className="text-sm font-black text-slate-600">
                            {menuImage ? menuImage.name : 'Subir nueva imagen'}
                          </div>
                          <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase tracking-widest">Click para seleccionar archivo</p>
                        </div>
                      </div>
                    </div>

                    <button 
                      type="submit"
                      disabled={menuLoading}
                      className="w-full py-5 bg-orange-600 text-white rounded-[24px] font-black text-sm hover:bg-orange-700 shadow-xl shadow-orange-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                      {menuLoading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <Check size={18} strokeWidth={3} />
                          Actualizar Menú Completo
                        </>
                      )}
                    </button>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 block">Vista Previa Actual</label>
                    <div className="bg-slate-900 rounded-[40px] p-2 aspect-[4/5] overflow-hidden shadow-2xl relative group">
                      {(menuPreview || weeklyMenu.imagen_url) ? (
                        <img 
                          src={menuPreview || (weeklyMenu.imagen_url ? (weeklyMenu.imagen_url.startsWith('http') ? weeklyMenu.imagen_url : API_URL + weeklyMenu.imagen_url) : '')}
                          alt="Vista previa menú"
                          className="w-full h-full object-cover rounded-[32px]"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-700">
                          <ImageIcon size={64} className="mb-4 opacity-20" />
                          <span className="text-xs font-black uppercase tracking-widest">Sin imagen cargada</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent p-10 flex flex-col justify-end">
                         <div className="text-orange-500 text-[10px] font-black uppercase tracking-widest mb-1">Landing Page Preview</div>
                         <div className="text-white text-2xl font-black">{weeklyMenu.fechas}</div>
                      </div>
                    </div>
                  </div>
                </form>

                {/* Histórico de Menús */}
                <div className="mt-20">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-1.5 h-6 bg-orange-500 rounded-full"></div>
                    <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight">Histórico de Menús</h4>
                  </div>
                  
                  <div className="bg-gray-50/50 rounded-3xl border border-gray-100 overflow-hidden">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-white border-b border-gray-100">
                          <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Miniatura</th>
                          <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Semanas / Fechas</th>
                          <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Fecha de Registro</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                        {menuHistory.map((m, idx) => (
                          <tr key={m.id} className="hover:bg-gray-50/30 transition-colors">
                            <td className="px-8 py-4">
                              <div className="w-12 h-16 bg-slate-900 rounded-lg overflow-hidden border border-gray-100">
                                {m.imagen_url ? (
                                  <img src={m.imagen_url.startsWith('http') ? m.imagen_url : API_URL + m.imagen_url} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-[8px] text-white font-black">N/A</div>
                                )}
                              </div>
                            </td>
                            <td className="px-8 py-4">
                              <div className="text-sm font-black text-slate-800">{m.fechas}</div>
                              {idx === 0 && <span className="text-[9px] font-black bg-green-100 text-green-600 px-2 py-0.5 rounded-full uppercase tracking-widest">Actual</span>}
                            </td>
                            <td className="px-8 py-4">
                              <div className="text-xs font-bold text-gray-400">
                                {new Date(m.createdAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'pagos' && (
            <motion.div 
              key="payments"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden"
            >
              <div className="p-4 md:p-8 border-b border-gray-50 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                 <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl text-sm font-medium"
                      placeholder="Buscar por cliente o plan..."
                      value={paymentSearch}
                      onChange={e => setPaymentSearch(e.target.value)}
                    />
                 </div>
                 <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                   <select 
                      className="bg-gray-50 border-none rounded-2xl px-6 py-3 text-sm font-bold"
                      value={paymentStatusFilter}
                      onChange={e => setPaymentStatusFilter(e.target.value)}
                   >
                      <option value="pendiente">Pendientes</option>
                      <option value="aprobado">Aprobados</option>
                      <option value="rechazado">Rechazados</option>
                      <option value="">Todos</option>
                   </select>
                   <button 
                     onClick={() => exportExcel('pagos', clients, filteredPayments, adminPlanes)}
                     className="bg-green-50 text-green-600 px-4 py-3 rounded-2xl text-sm font-bold flex items-center gap-2 hover:bg-green-100 transition-all"
                     title="Exportar vista actual a Excel"
                   >
                     <FileDown size={18} />
                     Exportar
                   </button>
                 </div>
              </div>
              <div className="p-8 space-y-4">
                {filteredPayments.length === 0 ? (
                  <div className="text-center py-20 text-gray-400 font-bold uppercase tracking-widest text-sm">No hay resultados</div>
                ) : (
                  filteredPayments.map(p => (
                    <div 
                      key={p.id} 
                      onClick={() => setSelectedComprobante(p)}
                      className="bg-gray-50/50 p-6 rounded-3xl flex items-center justify-between group hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all border border-transparent hover:border-gray-100 cursor-pointer"
                    >
                       <div className="flex items-center gap-6">
                          <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center overflow-hidden transition-all group-hover:scale-105">
                             <img src={p.comprobante ? (p.comprobante.startsWith('http') ? p.comprobante : API_URL + p.comprobante) : ''} alt="Comprobante" className="w-full h-full object-cover" />
                          </div>
                          <div>
                             <h4 className="font-black text-slate-900 group-hover:text-orange-600 transition-colors">{p.clienteNombre}</h4>
                             <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-tight">
                                <span>{p.plan}</span>
                                <span>•</span>
                                <span className="text-orange-600 font-black">${p.monto.toLocaleString()}</span>
                                <span>•</span>
                                <span>{p.fecha}</span>
                             </div>
                          </div>
                       </div>
                       <div className="flex items-center gap-4">
                          <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                            p.status === 'aprobado' ? 'bg-green-100 text-green-700' : 
                            p.status === 'rechazado' ? 'bg-red-100 text-red-700' : 
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {p.status}
                          </span>
                          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-orange-50 group-hover:text-orange-600 transition-all">
                             <MoreHorizontal size={18} />
                          </div>
                       </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'repartidores' && (
            <motion.div 
              key="repartidores"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden"
            >
              <div className="p-4 lg:p-10">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-8">
                   <div>
                      <h3 className="text-xl font-black text-slate-900">Equipo de Reparto</h3>
                      <p className="text-sm text-gray-500 font-medium">Asigna repartidores a zonas específicas para optimizar entregas</p>
                   </div>
                </div>

                <div className="bg-gray-50/50 rounded-3xl border border-gray-100 overflow-hidden">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-white border-b border-gray-100">
                        <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Repartidor</th>
                        <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Zona Asignada</th>
                        <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {repartidores.map(r => (
                        <tr key={r.id} className="hover:bg-gray-50/30 transition-colors">
                          <td className="px-8 py-4">
                             <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-xs uppercase">
                                   {r.nombre.charAt(0)}
                                </div>
                                <span className="text-sm font-black text-slate-800">{r.nombre}</span>
                             </div>
                          </td>
                          <td className="px-8 py-4">
                             <span className="text-xs font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
                                {r.zona_asignada || 'Sin asignar'}
                             </span>
                          </td>
                          <td className="px-8 py-4">
                             <span className="text-[10px] font-black text-green-600 uppercase tracking-widest">Disponible</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'clientes' && (
            <motion.div 
              key="clients"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden"
            >
              <div className="p-4 md:p-8 border-b border-gray-50 flex flex-col lg:flex-row items-stretch lg:items-center gap-4">
                 <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-orange-500 transition-all"
                      placeholder="Buscar cliente por nombre o cédula..."
                      value={clientSearch}
                      onChange={e => setClientSearch(e.target.value)}
                    />
                 </div>
                 <div className="flex flex-wrap gap-2 w-full lg:w-auto">
                   <select 
                      className="bg-gray-50 border-none rounded-2xl px-6 py-3 text-sm font-bold focus:ring-2 focus:ring-orange-500 transition-all"
                      value={clientStatus}
                      onChange={e => setClientStatus(e.target.value)}
                   >
                      <option value="todos">Todos los Estados</option>
                      <option value="activo">Activos (Semana Actual)</option>
                      <option value="futuro">Nuevos (Próxima Semana)</option>
                      <option value="pendiente">Pendientes</option>
                      <option value="vencido">Vencidos / Inactivos</option>
                   </select>
                   <button 
                     onClick={() => exportExcel('logistica', clients, payments, adminPlanes)}
                     className="bg-orange-50 text-orange-600 px-4 py-3 rounded-2xl text-sm font-bold flex items-center gap-2 hover:bg-orange-100 transition-all"
                     title="Exporta clientes activos con direcciones para logística"
                   >
                     <FileDown size={18} />
                     Logística
                   </button>
                   <button 
                     onClick={() => exportExcel('cocina', clients, payments, adminPlanes)}
                     className="bg-red-50 text-red-600 px-4 py-3 rounded-2xl text-sm font-bold flex items-center gap-2 hover:bg-red-100 transition-all"
                     title="Exporta clientes activos con restricciones"
                   >
                     <FileDown size={18} />
                     Cocina
                   </button>
                   <button 
                     onClick={() => exportExcel('completo', clients, payments, adminPlanes)}
                     className="bg-blue-50 text-blue-600 px-4 py-3 rounded-2xl text-sm font-bold flex items-center gap-2 hover:bg-blue-100 transition-all"
                     title="Exporta todos los datos del cliente"
                   >
                     <FileDown size={18} />
                     Completo
                   </button>
                 </div>
                 <button 
                   onClick={() => setIsCreatorModalOpen(true)}
                   className="bg-slate-900 w-full lg:w-auto justify-center text-white rounded-2xl px-6 py-3 text-sm font-black flex items-center gap-2 hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                 >
                   <UserPlus size={18} /> Registrar Cliente Manual
                 </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-gray-50/50">
                      <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Cliente</th>
                      <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Estado</th>
                      <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Plan</th>
                      <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Días Rest.</th>
                      <th className="px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredClients.map(c => (
                      <tr key={c.id} className={`${c.esFraudulento ? 'bg-red-50/50 hover:bg-red-100/50' : 'hover:bg-gray-50/50'} transition-colors`}>
                        <td className="px-8 py-5">
                          <div className="font-bold text-slate-900 flex items-center gap-2">
                             {c.nombre}
                             {c.esFraudulento && (
                               <span className="bg-red-500 text-white text-[8px] px-1.5 py-0.5 rounded uppercase font-black tracking-widest" title="Historial de comprobantes falsos">Fraude</span>
                             )}
                          </div>
                          <div className="text-xs text-gray-400">{c.cedula}</div>
                        </td>
                        <td className="px-8 py-5">
                           <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                             c.status === 'activo' ? 'bg-green-100 text-green-700' : c.status === 'pendiente' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                           }`}>
                             {c.status}
                           </span>
                        </td>
                        <td className="px-8 py-5">
                          {['cancelado', 'rechazado'].includes(c.status?.toLowerCase()) ? (
                            <span className="text-sm font-bold text-slate-300">-</span>
                          ) : (
                            <div className="text-sm font-bold text-slate-600 uppercase tracking-tight">{c.plan}</div>
                          )}
                        </td>
                        <td className="px-8 py-5">
                          {['cancelado', 'rechazado'].includes(c.status?.toLowerCase()) ? (
                            <span className="text-sm font-bold text-slate-300">-</span>
                          ) : c.diasRestantes <= 0 ? (
                            <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-xs font-black uppercase">Vencido</span>
                          ) : (
                            <div className={`text-sm font-black ${c.diasRestantes <= 5 ? 'text-red-500 animate-pulse' : 'text-slate-900'}`}>
                              {c.diasRestantes}d
                            </div>
                          )}
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => setViewingClient(c)}
                              className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                              title="Ver Detalles"
                            >
                              <Eye size={18} />
                            </button>
                            <button 
                              onClick={() => setSelectedClient(c)}
                              className="p-2 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-xl transition-all"
                              title="Editar"
                            >
                              <Pencil size={18} />
                            </button>
                            <button 
                              onClick={() => handleDeactivateClient(c.cedula, c.nombre)}
                              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                              title="Desactivar / Eliminar"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Modal Ver Detalles (read-only) */}
      {viewingClient && (
        <ClientViewModal
          client={viewingClient}
          onClose={() => setViewingClient(null)}
          onEdit={() => { setSelectedClient(viewingClient); setViewingClient(null); }}
        />
      )}

      {/* Modal Editar */}
      {selectedClient && (
        <ClientEditorModal 
          client={selectedClient} 
          onClose={() => setSelectedClient(null)} 
          onUpdate={fetchData}
          plans={plans}
        />
      )}
      <RegistrationWizard 
        isOpen={isCreatorModalOpen}
        onClose={() => setIsCreatorModalOpen(false)} 
        onUpdate={fetchData}
        initialPlan=""
        plans={plans}
      />
      {/* Comprobante Modal (Full Data & Edit) */}
      {selectedComprobante && (
        <ComprobanteModal 
          comprobante={selectedComprobante} 
          onClose={() => setSelectedComprobante(null)} 
          onValidate={validatePayment}
          onUpdate={fetchData}
          repartidores={repartidores}
          onAssignRepartidor={assignRepartidor}
        />
      )}
    </div>
  );
}

function ComprobanteModal({ comprobante, onClose, onValidate, onUpdate, repartidores, onAssignRepartidor }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({ 
    ...comprobante,
    facturacionElectronica: comprobante.facturacionElectronica === true || comprobante.facturacionElectronica === 'Si' ? 'Si' : 'No'
  });
  const [selectedRepartidor, setSelectedRepartidor] = useState(comprobante.repartidorId || '');
  const [editErrors, setEditErrors] = useState({});

  const handleSave = async () => {
    // Validate before saving
    const validationErrors = validateComprobanteEdit(editedData);
    if (validationErrors) {
      setEditErrors(validationErrors);
      Swal.fire({ icon: 'warning', title: 'Datos incompletos', text: 'Por favor corrige los campos marcados en rojo.', toast: true, position: 'bottom-end', showConfirmButton: false, timer: 3000 });
      return;
    }
    setEditErrors({});
    try {
      const response = await api.put(`/admin/suscripciones/${comprobante.subscriptionId}`, {
        nombre: editedData.clienteNombre,
        email: editedData.clienteEmail,
        celular: editedData.clienteCelular,
        necesita_cocas: editedData.necesitaCocas,
        tipo_entrega: editedData.tipoEntrega,
        facturacion_electronica: editedData.facturacionElectronica === 'Si' || editedData.facturacionElectronica === true,
        alergias: editedData.alergias,
        restricciones: editedData.restricciones,
        direcciones: editedData.direcciones,
        fecha_inicio: editedData.fecha_inicio
      });

      if (response.data.success) {
        Swal.fire({ icon: 'success', title: 'Actualizado', toast: true, position: 'bottom-end', showConfirmButton: false, timer: 3000 });
        setIsEditing(false);
        onUpdate();
      }
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: 'error', title: 'Error al actualizar', text: 'No se pudieron guardar los cambios.' });
    }
  };

  const handleDirChange = (index, field, value) => {
    const newDirs = [...editedData.direcciones];
    newDirs[index] = { ...newDirs[index], [field]: value };
    setEditedData({ ...editedData, direcciones: newDirs });
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-6 bg-slate-900/90 backdrop-blur-sm" onClick={onClose}>
       <motion.div 
         initial={{ opacity: 0, y: 50, scale: 0.95 }}
         animate={{ opacity: 1, y: 0, scale: 1 }}
         className="relative w-full max-w-5xl bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col md:flex-row h-[90vh]"
         onClick={e => e.stopPropagation()}
       >
          {/* Header Actions (Floating) */}
          <div className="absolute top-6 right-6 z-20 flex gap-3">
            <button 
              onClick={() => setIsEditing(!isEditing)} 
              className={`px-6 py-3 rounded-2xl transition-all shadow-xl flex items-center gap-2 font-black text-[10px] uppercase tracking-widest border-2 ${
                isEditing 
                ? 'bg-red-500 text-white border-red-400' 
                : 'bg-orange-600 text-white border-orange-500 hover:bg-orange-700'
              }`}
            >
              {isEditing ? 'Cancelar' : 'Editar Datos'}
            </button>
            <button 
              onClick={onClose} 
              className="bg-slate-900 text-white p-3 rounded-2xl hover:bg-red-500 transition-all shadow-xl border-2 border-slate-800"
            >
              <X size={20} strokeWidth={3} />
            </button>
          </div>

          {/* Left Side: Image (Large) */}
          <div className="md:w-1/2 bg-gray-100 flex items-center justify-center p-6 min-h-[300px]">
            <div className="relative group w-full h-full flex items-center justify-center">
              <img 
                src={comprobante.comprobante ? (comprobante.comprobante.startsWith('http') ? comprobante.comprobante : API_URL + comprobante.comprobante) : ''} 
                alt="Comprobante Full" 
                className="max-w-full max-h-full object-contain rounded-3xl shadow-2xl border-4 border-white" 
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-all rounded-3xl pointer-events-none"></div>
            </div>
          </div>

          {/* Right Side: Detailed Info & Edit Form */}
          <div className="md:w-1/2 p-4 md:p-8 bg-white overflow-y-auto custom-scrollbar">
            <div className="mb-8">
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Verificando Reserva de:</div>
              {isEditing ? (
                <>
                  <input 
                    className={`text-2xl font-black text-slate-900 w-full border-b-2 focus:border-orange-500 bg-transparent outline-none py-1 ${editErrors.clienteNombre ? 'border-red-400' : 'border-orange-200'}`}
                    value={editedData.clienteNombre}
                    onChange={e => { setEditedData({...editedData, clienteNombre: e.target.value}); if(editErrors.clienteNombre) setEditErrors({...editErrors, clienteNombre: null}); }}
                  />
                  {editErrors.clienteNombre && <p className="text-[9px] font-bold text-red-500 mt-1">{editErrors.clienteNombre}</p>}
                </>
              ) : (
                <h3 className="text-3xl font-black text-slate-900 leading-tight mb-2">{editedData.clienteNombre}</h3>
              )}
              <div className="flex gap-2 flex-wrap mt-3">
                 <span className="text-[10px] font-black text-orange-600 bg-orange-50 px-3 py-2 rounded-xl border border-orange-100 uppercase tracking-tight">{comprobante.plan}</span>
                 <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-2 rounded-xl border border-blue-100 uppercase tracking-tight">Inicia: {editedData.fecha_inicio || 'N/A'}</span>
                 <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100 uppercase tracking-tight">#{comprobante.clienteCedula}</span>
              </div>
            </div>

            <div className="space-y-8">
              {/* Contact Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Email</label>
                  {isEditing ? (
                    <>
                      <input 
                        className={`w-full text-sm font-bold text-slate-700 bg-gray-50 p-2 rounded-xl border ${editErrors.clienteEmail ? 'border-red-300 bg-red-50/30' : 'border-gray-200'}`}
                        value={editedData.clienteEmail}
                        onChange={e => { setEditedData({...editedData, clienteEmail: e.target.value}); if(editErrors.clienteEmail) setEditErrors({...editErrors, clienteEmail: null}); }}
                      />
                      {editErrors.clienteEmail && <p className="text-[9px] font-bold text-red-500 mt-1">{editErrors.clienteEmail}</p>}
                    </>
                  ) : (
                    <div className="text-sm font-bold text-slate-700 break-all">{editedData.clienteEmail}</div>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">WhatsApp</label>
                  {isEditing ? (
                    <>
                      <input 
                        className={`w-full text-sm font-bold text-slate-700 bg-gray-50 p-2 rounded-xl border ${editErrors.clienteCelular ? 'border-red-300 bg-red-50/30' : 'border-gray-200'}`}
                        value={editedData.clienteCelular}
                        onChange={e => { 
                          const cleaned = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setEditedData({...editedData, clienteCelular: cleaned}); 
                          if(editErrors.clienteCelular) setEditErrors({...editErrors, clienteCelular: null}); 
                        }}
                      />
                      {editErrors.clienteCelular && <p className="text-[9px] font-bold text-red-500 mt-1">{editErrors.clienteCelular}</p>}
                    </>
                  ) : (
                    <div className="text-sm font-bold text-slate-700">{editedData.clienteCelular}</div>
                  )}
                </div>
              </div>

              {/* Direcciones Section */}
              <div>
                <h5 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                  Direcciones de Entrega
                </h5>
                <div className="space-y-3">
                  {editedData.direcciones?.map((dir, i) => (
                    <div key={i} className="bg-gray-50 p-4 rounded-2xl border border-gray-100 relative group">
                      {isEditing ? (
                        <div className="space-y-2">
                          <input 
                            placeholder="Dirección"
                            className={`w-full text-sm font-black text-slate-900 bg-white p-2 rounded-lg border ${editErrors[`direccion_${i}`] ? 'border-red-400 bg-red-50/30' : 'border-gray-200'}`}
                            value={dir.direccion}
                            onChange={e => {
                              handleDirChange(i, 'direccion', e.target.value);
                              if (editErrors[`direccion_${i}`]) {
                                const newErrs = { ...editErrors };
                                delete newErrs[`direccion_${i}`];
                                setEditErrors(newErrs);
                              }
                            }}
                          />
                          {editErrors[`direccion_${i}`] && (
                            <p className="text-[9px] font-bold text-red-500 mt-1 flex items-center gap-1">
                              <AlertCircle size={10} /> {editErrors[`direccion_${i}`]}
                            </p>
                          )}
                          <input 
                            placeholder="Barrio"
                            className={`w-full text-xs font-bold text-gray-500 bg-white p-2 rounded-lg border ${editErrors[`barrio_${i}`] ? 'border-red-400 bg-red-50/30' : 'border-gray-200'}`}
                            value={dir.barrio}
                            onChange={e => {
                              handleDirChange(i, 'barrio', e.target.value);
                              if (editErrors[`barrio_${i}`]) {
                                const newErrs = { ...editErrors };
                                delete newErrs[`barrio_${i}`];
                                setEditErrors(newErrs);
                              }
                            }}
                          />
                          {editErrors[`barrio_${i}`] && (
                            <p className="text-[9px] font-bold text-red-500 mt-1 flex items-center gap-1">
                              <AlertCircle size={10} /> {editErrors[`barrio_${i}`]}
                            </p>
                          )}
                          <input 
                            placeholder="Días de entrega"
                            className="w-full text-[10px] font-black text-slate-400 bg-white p-2 rounded-lg border border-gray-200"
                            value={dir.dias_entrega}
                            onChange={e => handleDirChange(i, 'dias_entrega', e.target.value)}
                          />
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-between items-start mb-1">
                             <div className="font-black text-slate-900 text-sm">{dir.direccion}</div>
                             <span className="text-[9px] font-black bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full uppercase">{dir.es_principal ? 'Principal' : 'Secundaria'}</span>
                          </div>
                          <div className="text-xs font-bold text-gray-500 mb-2">{dir.barrio}</div>
                          {dir.zona && (
                            <div className="text-[10px] font-black text-green-600 bg-green-50 px-2 py-1 rounded-lg border border-green-100 inline-block mb-2">
                              📍 ZONA: {dir.zona}
                            </div>
                          )}
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-tight">Días: {dir.dias_entrega}</div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Preferences & Restrictions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100">
                  <h5 className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-1">Juego de Cocas</h5>
                  {isEditing ? (
                    <select 
                      className="w-full text-xs font-black text-slate-900 bg-white p-1 rounded border-none"
                      value={editedData.necesitaCocas}
                      onChange={e => setEditedData({...editedData, necesitaCocas: e.target.value === 'true'})}
                    >
                      <option value="true">Necesita Comprar</option>
                      <option value="false">Ya tiene el juego</option>
                    </select>
                  ) : (
                    <div className="text-sm font-black text-slate-900">
                      {editedData.necesitaCocas ? 'Necesita Comprar' : 'Ya tiene el juego'}
                    </div>
                  )}
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Tipo de Entrega</h5>
                  {isEditing ? (
                    <select 
                      className="w-full text-xs font-black text-slate-900 bg-white p-1 rounded border-none"
                      value={editedData.tipoEntrega}
                      onChange={e => setEditedData({...editedData, tipoEntrega: e.target.value})}
                    >
                      <option value="Fija">Fija</option>
                      <option value="Hibrida">Híbrida</option>
                    </select>
                  ) : (
                    <div className="text-sm font-black text-slate-900">{editedData.tipoEntrega}</div>
                  )}
                </div>
                <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100">
                  <h5 className="text-[9px] font-black text-orange-600 uppercase tracking-widest mb-1">Fecha de Inicio</h5>
                  {isEditing ? (
                    <input 
                      type="date"
                      className="w-full text-xs font-black text-slate-900 bg-white p-1 rounded border-none"
                      value={editedData.fecha_inicio || ''}
                      onChange={e => setEditedData({...editedData, fecha_inicio: e.target.value})}
                    />
                  ) : (
                    <div className="text-sm font-black text-slate-900">{editedData.fecha_inicio || 'N/A'}</div>
                  )}
                </div>
              </div>

              <div className="bg-red-50/50 p-4 rounded-2xl border border-red-100">
                <h5 className="text-[9px] font-black text-red-600 uppercase tracking-widest mb-2">Restricciones Alimentarias</h5>
                {isEditing ? (
                  <div className="space-y-2">
                    <input 
                      placeholder="Alergias"
                      className="w-full text-xs font-bold text-slate-700 bg-white p-2 rounded-lg border border-gray-200"
                      value={editedData.alergias}
                      onChange={e => setEditedData({...editedData, alergias: e.target.value})}
                    />
                    <input 
                      placeholder="Restricciones"
                      className="w-full text-xs font-bold text-slate-700 bg-white p-2 rounded-lg border border-gray-200"
                      value={editedData.restricciones}
                      onChange={e => setEditedData({...editedData, restricciones: e.target.value})}
                    />
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="text-xs font-bold text-slate-700"><span className="opacity-50">Alergias:</span> {editedData.alergias || 'Ninguna'}</div>
                    <div className="text-xs font-bold text-slate-700"><span className="opacity-50">Restr.:</span> {editedData.restricciones || 'Ninguna'}</div>
                  </div>
                )}
              </div>

              {/* Billing & Payment Info */}
              <div className="bg-blue-50/30 p-5 rounded-[32px] border border-blue-100/50 space-y-4">
                 <div className="flex justify-between items-center">
                    <div>
                      <h5 className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Facturación Electrónica</h5>
                      {isEditing ? (
                        <select 
                          className="text-sm font-black text-slate-900 bg-transparent border-none outline-none"
                          value={editedData.facturacionElectronica}
                          onChange={e => setEditedData({...editedData, facturacionElectronica: e.target.value})}
                        >
                          <option value="Si">Si</option>
                          <option value="No">No</option>
                        </select>
                      ) : (
                        <div className="text-sm font-black text-slate-900">{editedData.facturacionElectronica}</div>
                      )}
                    </div>
                    <div className="text-right">
                      <h5 className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Total a Pagar</h5>
                      <div className="text-xl font-black text-slate-900">${editedData.monto.toLocaleString()}</div>
                    </div>
                 </div>
              </div>

              {/* Final Actions */}
              <div className="pt-6 border-t border-gray-100 flex gap-4">
                {isEditing ? (
                  <button 
                    onClick={handleSave}
                    className="w-full px-8 py-4 bg-orange-600 text-white rounded-2xl font-black text-xs hover:bg-orange-700 shadow-xl shadow-orange-500/30 transition-all flex items-center justify-center gap-2"
                  >
                    Guardar Cambios
                  </button>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                      <button 
                        onClick={() => {
                          const msg = "Hola, lamentamos informarte que tu comprobante parece ser falso o alterado. Esta acción puede llevar al bloqueo permanente. ⚠️";
                          const phone = comprobante.clienteCelular;
                          onValidate(comprobante.id, 'rechazado', 'Comprobante Falso');
                          window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
                          onClose();
                        }}
                        className="px-4 py-4 bg-red-50 text-red-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-2"
                      >
                        <AlertTriangle size={14} />
                        Falso
                      </button>
                      <button 
                        onClick={() => {
                          const msg = "Hola, el comprobante que enviaste no se refleja en nuestros movimientos bancarios. Por favor verifica con tu banco. 🏦";
                          const phone = comprobante.clienteCelular;
                          onValidate(comprobante.id, 'rechazado', 'No Reflejado');
                          window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
                          onClose();
                        }}
                        className="px-4 py-4 bg-gray-50 text-gray-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center gap-2"
                      >
                        <Clock size={14} />
                        No Reflejado
                      </button>

                      <button 
                        onClick={() => {
                          const msg = "Hola, notamos que indicaste tener el juego de cocas pero no registras suscripciones previas. Por favor realiza el pago de los recipientes. 🍱";
                          const phone = comprobante.clienteCelular;
                          onValidate(comprobante.id, 'rechazado', 'Mentira Juego Cocas');
                          window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
                          onClose();
                        }}
                        className="px-4 py-4 bg-gray-50 text-gray-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-500 hover:text-white transition-all flex items-center justify-center gap-2"
                      >
                        <Package size={14} />
                        Mentira Cocas
                      </button>
                      <button 
                        onClick={() => {
                          const msg = "Hola, lamentamos informarte que tu pago no pudo ser validado. Por favor, revisa el comprobante y vuelve a intentarlo. ❌";
                          const phone = comprobante.clienteCelular;
                          onValidate(comprobante.id, 'rechazado');
                          window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
                          onClose();
                        }}
                        className="px-6 py-4 bg-red-50 text-red-500 rounded-2xl font-black text-xs hover:bg-red-500 hover:text-white transition-all"
                      >
                        Rechazar Pago
                      </button>
                      <button 
                        onClick={() => {
                          const msg = `¡Hola ${comprobante.clienteNombre}! 👋 Tu pago en La Coca de Jacks ha sido aprobado. ¡Prepárate para disfrutar de los mejores almuerzos! 🍱`;
                          const phone = comprobante.clienteCelular;
                          onValidate(comprobante.id, 'aprobado');
                          window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
                          onClose();
                        }}
                        className="px-8 py-4 bg-green-500 text-white rounded-2xl font-black text-xs hover:bg-green-600 shadow-xl shadow-green-500/30 transition-all flex items-center justify-center gap-2"
                      >
                        <Check size={18} strokeWidth={3} />
                        Aprobar y Enviar WA
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
       </motion.div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, desc, urgent }) {
  return (
    <div className={`bg-white p-8 rounded-[32px] shadow-sm border-2 transition-all ${urgent ? 'border-red-100 bg-red-50/10' : 'border-transparent'}`}>
      <div className="flex items-center justify-between mb-6">
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{title}</span>
        <div className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center text-white shadow-lg`}>
          <Icon size={22} />
        </div>
      </div>
      <div className="text-3xl font-black text-slate-900 mb-2">{value}</div>
      <p className="text-xs font-bold text-gray-400">{desc}</p>
    </div>
  );
}
