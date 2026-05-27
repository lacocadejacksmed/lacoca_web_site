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
  UserPlus
} from 'lucide-react';
import api from '../services/api';
import { exportExcel } from '../services/exportService';
import { jsPDF } from "jspdf";
import Swal from 'sweetalert2';
import ClientEditorModal from '../components/ClientEditorModal';
import RegistrationWizard from '../components/RegistrationWizard';
import CoverageMap from '../components/CoverageMap';

export default function Admin() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [clients, setClients] = useState([]);
  const [payments, setPayments] = useState([]);
  const [statsPeriod, setStatsPeriod] = useState('mes');
  const [loading, setLoading] = useState(true);
  const [repartidores, setRepartidores] = useState([]);
  const [repartidorAsignado, setRepartidorAsignado] = useState(null);
  const [plans, setPlans] = useState([]);
  
  // Filters
  const [clientSearch, setClientSearch] = useState('');
  const [clientStatus, setClientStatus] = useState('');
  const [paymentSearch, setPaymentSearch] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('pendiente');

  const [selectedClient, setSelectedClient] = useState(null);
  const [isCreatorModalOpen, setIsCreatorModalOpen] = useState(false);
  const [selectedComprobante, setSelectedComprobante] = useState(null);
  const [feriados, setFeriados] = useState([]);
  const [newFeriado, setNewFeriado] = useState({ fecha: '', descripcion: '' });
  
  const [weeklyMenu, setWeeklyMenu] = useState({ fechas: '', imagen_url: '' });
  const [menuImage, setMenuImage] = useState(null);
  const [menuPreview, setMenuPreview] = useState(null);
  const [menuHistory, setMenuHistory] = useState([]);
  const [menuLoading, setMenuLoading] = useState(false);
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

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resClients, resPayments, resPlans] = await Promise.all([
        api.get('/admin/clientes'),
        api.get('/admin/comprobantes'),
        api.get('/planes')
      ]);

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
            const venc = new Date(sub.fecha_creacion);
            const duracion = plan.dias_duracion || (planNombre === 'semanal' ? 7 : planNombre === 'quincenal' ? 15 : 30);
            venc.setDate(venc.getDate() + duracion);
            fechaVenc = venc.toISOString().split('T')[0];
            const hoy = new Date();
            dias = Math.ceil((venc - hoy) / (1000 * 60 * 60 * 24));
          }

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
        setFeriados(resFeriados.data.feriados);
      }

      const resMenu = await api.get('/menu');
      if (resMenu.data.success) {
        setWeeklyMenu(resMenu.data.menu);
      }

      const resMenus = await api.get('/admin/menus');
      if (resMenus.data.success) {
        setMenuHistory(resMenus.data.menus);
      }

      await fetchRepartidores();
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

  const getStats = () => {
    const now = new Date();
    let filterDate = new Date();
    if (statsPeriod === 'hoy') filterDate.setHours(0,0,0,0);
    else if (statsPeriod === 'semana') filterDate.setDate(now.getDate() - 7);
    else if (statsPeriod === 'quincena') filterDate.setDate(now.getDate() - 15);
    else if (statsPeriod === 'mes') filterDate.setMonth(now.getMonth() - 1);
    else filterDate = new Date(0);

    const approved = payments.filter(p => p.status === 'aprobado' && new Date(p.fecha) >= filterDate);
    const income = approved.reduce((s, p) => s + p.monto, 0);
    const active = clients.filter(c => c.status === 'activo').length;
    const pending = payments.filter(p => p.status === 'pendiente').length;
    const expiring = clients.filter(c => c.status === 'activo' && c.diasRestantes <= 5).length;

    // Rechazos por motivo (respetando el filtro de fecha)
    const rejected = payments.filter(p => p.status === 'rechazado' && new Date(p.fecha) >= filterDate);

    const byCocas = rejected.filter(p => p.motivo_rechazo === 'Mentira Juego Cocas').length;
    const byFake = rejected.filter(p => p.motivo_rechazo === 'Comprobante Falso').length;
    const byNotReflected = rejected.filter(p => p.motivo_rechazo === 'No Reflejado').length;

    return { income, active, pending, expiring, byCocas, byFake, byNotReflected };
  };

  const filteredClients = clients.filter(c => 
    (c.nombre.toLowerCase().includes(clientSearch.toLowerCase()) || c.cedula.includes(clientSearch)) &&
    (clientStatus === '' || c.status === clientStatus)
  );

  const filteredPayments = payments.filter(p => 
    (p.clienteNombre.toLowerCase().includes(paymentSearch.toLowerCase()) || p.plan.toLowerCase().includes(paymentSearch.toLowerCase())) &&
    (paymentStatusFilter === '' || p.status === paymentStatusFilter)
  );

  const stats = getStats();

  return (
    <div className="flex min-h-screen bg-gray-50 text-slate-900">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white fixed h-full z-50 overflow-y-auto">
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
              { id: 'cocina', label: 'Cocina en Vivo', icon: ChefHat },
              { id: 'pagos', label: 'Validar Pagos', icon: CreditCard, badge: payments.filter(p => p.status === 'pendiente').length },
              { id: 'clientes', label: 'Lista Clientes', icon: Users },
              { id: 'repartidores', label: 'Repartidores', icon: MapPin },
              { id: 'feriados', label: 'Festivos', icon: CalendarDays },
              { id: 'mapa', label: 'Mapa Cobertura', icon: MapPin },
              { id: 'menu', label: 'Menú Semanal', icon: ImageIcon }
            ].map(item => (
              <button 
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-black transition-all ${
                  activeTab === item.id ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/30' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <item.icon size={18} />
                {item.label}
                {item.badge > 0 && (
                  <span className="ml-auto bg-red-500 text-[10px] px-2 py-0.5 rounded-full animate-pulse">{item.badge}</span>
                )}
              </button>
            ))}
          </nav>

          <div className="mt-12 pt-8 border-t border-slate-800">
            <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest px-4 mb-4 block">Reportes Rápidos</span>
            <div className="space-y-1">
              {['todos', 'activos', 'cocina', 'produccion'].map(type => (
                <button 
                  key={type}
                  onClick={() => exportExcel(type, clients, payments)}
                  className="w-full text-left px-4 py-2 text-xs text-slate-400 hover:text-white transition-colors font-bold uppercase tracking-tight flex items-center gap-2"
                >
                  <FileDown size={14} />
                  {type.replace('todos', 'Clientes').replace('activos', 'Sólo Activos').replace('cocina', 'Planilla Cocina').replace('produccion', 'Producción')}
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-10">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              {activeTab === 'dashboard' ? 'Resumen de Negocio' : 
               activeTab === 'cocina' ? 'Planilla de Cocina (En Vivo)' :
               activeTab === 'pagos' ? 'Validación de Pagos' : 
               activeTab === 'clientes' ? 'Gestión de Clientes' : 
               activeTab === 'repartidores' ? 'Gestión de Repartidores' : 
               activeTab === 'feriados' ? 'Calendario de Festivos' : 
               'Configuración de Menú'}
            </h2>
            <p className="text-gray-500 font-medium">Panel centralizado de operaciones</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right mr-4">
               <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Actualizado</div>
               <div className="text-xs font-bold text-slate-900">{new Date().toLocaleTimeString()}</div>
            </div>
            <button 
              onClick={fetchData}
              className={`p-3 bg-white rounded-xl shadow-sm border border-gray-100 text-slate-400 hover:text-orange-500 transition-all ${loading ? 'animate-spin' : ''}`}
              title="Sincronizar datos"
            >
               <Clock size={20} />
            </button>

            <button 
              onClick={handleLogout}
              className="p-3 bg-red-50 rounded-xl shadow-sm border border-red-100 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center gap-2"
              title="Cerrar sesión"
            >
               <LogOut size={20} />
               <span className="text-xs font-black uppercase tracking-tight hidden lg:block">Salir</span>
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
            >
              <div className="flex items-center justify-between mb-8">
                <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-100 flex">
                  {['hoy', 'semana', 'mes', 'total'].map(p => (
                    <button 
                      key={p}
                      onClick={() => setStatsPeriod(p)}
                      className={`px-4 py-2 text-xs font-black uppercase rounded-lg transition-all ${
                        statsPeriod === p ? 'bg-orange-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                 <StatCard title="Ingresos Aprobados" value={`$${stats.income.toLocaleString()}`} icon={DollarSign} color="bg-green-500" desc="Ventas netas aprobadas" />
                 <StatCard title="Clientes Activos" value={stats.active} icon={Users} color="bg-blue-500" desc="Suscripciones vigentes" />
                 <StatCard title="Pendientes" value={stats.pending} icon={CreditCard} color="bg-amber-500" desc="Pagos por verificar" urgent={stats.pending > 0} />
                 <StatCard title="Por Vencer" value={stats.expiring} icon={AlertTriangle} color="bg-red-500" desc="Vencen en menos de 5 días" urgent={stats.expiring > 0} />
              </div>

              {/* Rejections Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">

                <StatCard 
                  title="Mentira Cocas" 
                  value={stats.byCocas} 
                  icon={Package} 
                  color="bg-amber-500" 
                  desc="Nuevos sin juego" 
                />
                <StatCard 
                  title="Comp. Falsos" 
                  value={stats.byFake} 
                  icon={AlertTriangle} 
                  color="bg-red-600" 
                  desc="Posible fraude" 
                />
                <StatCard 
                  title="No Reflejados" 
                  value={stats.byNotReflected} 
                  icon={Clock} 
                  color="bg-slate-700" 
                  desc="Error bancario" 
                />
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              <div className="p-10">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="text-xl font-black text-slate-900">Gestión de Festivos</h3>
                    <p className="text-sm text-gray-500 font-medium">Define los días que no hay servicio para el descuento automático</p>
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="date"
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
                        if(!newFeriado.fecha) return;
                        await api.post('/admin/feriados', newFeriado);
                        setNewFeriado({ fecha: '', descripcion: '' });
                        fetchData();
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
                            <button 
                              onClick={async () => {
                                await api.delete(`/admin/feriados/${f.id}`);
                                fetchData();
                              }}
                              className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            >
                              <X size={16} strokeWidth={3} />
                            </button>
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

          {activeTab === 'mapa' && (
            <motion.div 
              key="mapa"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden"
            >
              <div className="p-10">
                <div className="mb-10">
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
              <div className="p-10">
                <div className="mb-10">
                  <h3 className="text-xl font-black text-slate-900">Menú de la Semana</h3>
                  <p className="text-sm text-gray-500 font-medium">Actualiza la imagen y las fechas que verán los clientes en la landing page</p>
                </div>

                <form onSubmit={handleMenuUpdate} className="grid grid-cols-1 lg:grid-cols-2 gap-12">
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
                            setMenuImage(file);
                            if (file) setMenuPreview(URL.createObjectURL(file));
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
                          src={menuPreview || weeklyMenu.imagen_url}
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
                                  <img src={m.imagen_url} className="w-full h-full object-cover" />
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
              <div className="p-8 border-b border-gray-50 flex items-center gap-4">
                 <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl text-sm font-medium"
                      placeholder="Buscar por cliente o plan..."
                      value={paymentSearch}
                      onChange={e => setPaymentSearch(e.target.value)}
                    />
                 </div>
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
                             <img src={p.comprobante} alt="Comprobante" className="w-full h-full object-cover" />
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
              <div className="p-10">
                <div className="flex justify-between items-center mb-8">
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
              <div className="p-8 border-b border-gray-50 flex items-center gap-4">
                 <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-orange-500 transition-all"
                      placeholder="Buscar cliente por nombre o cédula..."
                      value={clientSearch}
                      onChange={e => setClientSearch(e.target.value)}
                    />
                 </div>
                 <select 
                    className="bg-gray-50 border-none rounded-2xl px-6 py-3 text-sm font-bold focus:ring-2 focus:ring-orange-500 transition-all"
                    value={clientStatus}
                    onChange={e => setClientStatus(e.target.value)}
                 >
                    <option value="">Todos los Estados</option>
                    <option value="activo">Activos</option>
                    <option value="pendiente">Pendientes</option>
                    <option value="vencido">Vencidos</option>
                 </select>
                 <button 
                   onClick={() => setIsCreatorModalOpen(true)}
                   className="bg-slate-900 text-white rounded-2xl px-6 py-3 text-sm font-black flex items-center gap-2 hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
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
                      <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-8 py-5">
                          <div className="font-bold text-slate-900">{c.nombre}</div>
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
                          <div className="text-sm font-bold text-slate-600 uppercase tracking-tight">{c.plan}</div>
                        </td>
                        <td className="px-8 py-5">
                          <div className={`text-sm font-black ${c.diasRestantes <= 5 ? 'text-red-500 animate-pulse' : 'text-slate-900'}`}>
                            {c.diasRestantes}d
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <button 
                            onClick={() => setSelectedClient(c)}
                            className="p-2 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-xl transition-all"
                          >
                            <MoreHorizontal size={20} />
                          </button>
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

      {/* Full Client Detail Modal */}
      {selectedClient && (
        <ClientEditorModal 
          client={selectedClient} 
          onClose={() => setSelectedClient(null)} 
          onUpdate={fetchData}
          plans={plans}
        />
      )}
      {/* Creator Modal */}
      <RegistrationWizard 
        isOpen={isCreatorModalOpen}
        onClose={() => setIsCreatorModalOpen(false)} 
        onUpdate={fetchData}
        initialPlan="quincenal"
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

  const handleSave = async () => {
    try {
      const response = await api.put(`/api/admin/suscripciones/${comprobante.subscriptionId}`, {
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
                src={comprobante.comprobante} 
                alt="Comprobante Full" 
                className="max-w-full max-h-full object-contain rounded-3xl shadow-2xl border-4 border-white" 
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-all rounded-3xl pointer-events-none"></div>
            </div>
          </div>

          {/* Right Side: Detailed Info & Edit Form */}
          <div className="md:w-1/2 p-8 bg-white overflow-y-auto custom-scrollbar">
            <div className="mb-8">
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Verificando Reserva de:</div>
              {isEditing ? (
                <input 
                  className="text-2xl font-black text-slate-900 w-full border-b-2 border-orange-200 focus:border-orange-500 bg-transparent outline-none py-1"
                  value={editedData.clienteNombre}
                  onChange={e => setEditedData({...editedData, clienteNombre: e.target.value})}
                />
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
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Email</label>
                  {isEditing ? (
                    <input 
                      className="w-full text-sm font-bold text-slate-700 bg-gray-50 p-2 rounded-xl border border-gray-200"
                      value={editedData.clienteEmail}
                      onChange={e => setEditedData({...editedData, clienteEmail: e.target.value})}
                    />
                  ) : (
                    <div className="text-sm font-bold text-slate-700 break-all">{editedData.clienteEmail}</div>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">WhatsApp</label>
                  {isEditing ? (
                    <input 
                      className="w-full text-sm font-bold text-slate-700 bg-gray-50 p-2 rounded-xl border border-gray-200"
                      value={editedData.clienteCelular}
                      onChange={e => setEditedData({...editedData, clienteCelular: e.target.value})}
                    />
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
                            className="w-full text-sm font-black text-slate-900 bg-white p-2 rounded-lg border border-gray-200"
                            value={dir.direccion}
                            onChange={e => handleDirChange(i, 'direccion', e.target.value)}
                          />
                          <input 
                            placeholder="Barrio"
                            className="w-full text-xs font-bold text-gray-500 bg-white p-2 rounded-lg border border-gray-200"
                            value={dir.barrio}
                            onChange={e => handleDirChange(i, 'barrio', e.target.value)}
                          />
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

              {/* Repartidor Assignment */}
              <div className="bg-slate-50 p-6 rounded-[32px] border border-gray-100">
                 <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Asignación de Reparto</h5>
                 <div className="flex gap-4">
                    <select 
                      className="flex-1 bg-white border-none rounded-xl px-4 py-3 text-sm font-bold shadow-sm"
                      value={selectedRepartidor}
                      onChange={e => setSelectedRepartidor(e.target.value)}
                    >
                       <option value="">Seleccionar Repartidor...</option>
                       {repartidores.map(r => (
                         <option key={r.id} value={r.id}>{r.nombre} ({r.zona_asignada || 'Sin zona'})</option>
                       ))}
                    </select>
                    <button 
                      onClick={() => onAssignRepartidor(comprobante.subscriptionId, selectedRepartidor)}
                      disabled={!selectedRepartidor}
                      className="bg-slate-900 text-white px-6 rounded-xl font-black text-xs hover:bg-orange-600 transition-all disabled:opacity-50"
                    >
                       Asignar
                    </button>
                 </div>
              </div>

              {/* Preferences & Restrictions */}
              <div className="grid grid-cols-2 gap-4">
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
                    <div className="grid grid-cols-2 gap-3 w-full">
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
