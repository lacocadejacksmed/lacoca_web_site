import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api, { API_URL } from '../services/api';
import Navbar from '../components/Navbar';
import RegistrationWizard from '../components/RegistrationWizard';

import FAQ from '../components/FAQ';
import Plans from '../components/Plans';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, 
  Check, 
  Clock, 
  Star, 
  Shield, 
  TrendingUp, 
  Heart, 
  Calendar,
  Truck,
  MessageCircle,
  X,
  MapPin,
  Mail,
  Phone,
  Share2
} from 'lucide-react';

export default function Landing2({ defaultWizardOpen = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isWizardOpen, setIsWizardOpen] = useState(defaultWizardOpen);

  const [selectedPlan, setSelectedPlan] = useState('quincenal');
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const [weeklyMenu, setWeeklyMenu] = useState({ 
    fechas: 'Del 11 al 15 de Mayo', 
    imagen_url: '/weekly_menu_preview_1778475988702.png' 
  });
  const [planes, setPlanes] = useState([]);

  useEffect(() => {
    const fetchMenuAndPlanes = async () => {
      try {
        const res = await api.get('/menu');
        if (res.data.success && res.data.menu) {
          setWeeklyMenu(res.data.menu);
        }
      } catch (err) {
        console.error("Error al cargar menú:", err);
      }
      
      try {
        const res = await api.get('/planes');
        if (res.data.success && res.data.planes) {
          setPlanes(res.data.planes);
        }
      } catch (err) {
        console.error("Error al cargar planes:", err);
      }
    };
    fetchMenuAndPlanes();
  }, []);

  const openWizard = (planId) => {
    if (planId) setSelectedPlan(planId);
    setIsWizardOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#FFF6EA] selection:bg-[#F2641A] selection:text-white overflow-x-hidden">
      <Navbar 
        onOpenWizard={() => openWizard()} 
      />

      {/* --- HERO SECTION 2.0 --- */}
      <section className="relative min-h-[95vh] flex items-center pt-32 lg:pt-40 pb-16 px-6 overflow-hidden bg-[#FFF6EA]">
        {/* Abstract Background Elements */}
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-[#F2641A]/15 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#F5D89A]/30 rounded-full blur-[100px] animate-pulse delay-700"></div>
        
        <div className="max-w-7xl mx-auto w-full grid lg:grid-cols-2 gap-12 items-center relative z-10">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#F2641A]/10 text-[#F2641A] rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-6 border border-[#F2641A]/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F2641A] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#F2641A]"></span>
              </span>
              Almuerzos Ejecutivos • Medellín
            </div>

            <h1 className="flex flex-col mb-8 w-fit">
              <span className="text-7xl md:text-[110px] font-extrabold leading-[0.8] tracking-tight text-[#2B2118] font-display">
                La Coca
              </span>
              <span className="self-end text-5xl md:text-[80px] text-[#F2641A] mt-2 font-display font-bold">
                de Jacks
              </span>
            </h1>

            <p className="text-xl text-[#7A6B5C] font-medium leading-relaxed mb-10 max-w-lg">
              Te cocinamos, empacamos y llevamos hasta tu trabajo. Comida casera premium para gente que valora su tiempo.
            </p>

            <div className="flex flex-wrap gap-5">
              <button 
                onClick={() => openWizard()}
                className="group relative bg-[#2B2118] text-white px-10 py-5 rounded-[24px] font-black text-sm tracking-tight overflow-hidden transition-all hover:shadow-2xl hover:shadow-[#2B2118]/20 active:scale-95 border-none cursor-pointer"
              >
                <span className="relative z-10 flex items-center gap-3">
                  Reserva tu Cupo Ahora
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-[#F2641A] to-[#F2A922] opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </button>

              <a href="#menu" className="px-10 py-5 rounded-[24px] border-2 border-[#EFD9B4] text-[#2B2118] font-black text-sm hover:bg-[#FFF9F0] transition-all no-underline flex items-center">
                Ver Menú Semanal
              </a>
            </div>

            <div className="mt-12 flex flex-wrap items-center gap-2 lg:gap-6 -ml-4">
               <motion.div 
                 whileHover={{ y: -5, scale: 1.05 }}
                 className="group cursor-pointer p-4 rounded-3xl hover:bg-white hover:shadow-xl hover:shadow-[#F2641A]/10 transition-all border border-transparent hover:border-[#F2641A]/20"
               >
                  <div className="text-3xl font-black text-[#2B2118] group-hover:text-[#F2641A] transition-colors">900+</div>
                  <div className="text-[10px] font-black uppercase text-[#7A6B5C] group-hover:text-[#F2641A] tracking-widest mt-1 transition-colors">Clientes</div>
               </motion.div>
               
               <div className="w-px h-8 bg-[#EFD9B4] hidden sm:block"></div>
               
               <motion.div 
                 whileHover={{ y: -5, scale: 1.05 }}
                 className="group cursor-pointer p-4 rounded-3xl hover:bg-white hover:shadow-xl hover:shadow-[#92CB94]/10 transition-all border border-transparent hover:border-[#92CB94]/30"
               >
                  <div className="text-3xl font-black text-[#2B2118] group-hover:text-[#5A9E5E] transition-colors">100%</div>
                  <div className="text-[10px] font-black uppercase text-[#7A6B5C] group-hover:text-[#92CB94] tracking-widest mt-1 transition-colors">Fresco</div>
               </motion.div>
               
               <div className="w-px h-8 bg-[#EFD9B4] hidden sm:block"></div>
               
               <motion.div 
                 whileHover={{ y: -5, scale: 1.05 }}
                 className="group cursor-pointer p-4 rounded-3xl hover:bg-white hover:shadow-xl hover:shadow-[#F2A922]/10 transition-all border border-transparent hover:border-[#F5D89A]"
               >
                  <div className="text-3xl font-black text-[#2B2118] flex items-center gap-1 group-hover:text-[#F2A922] transition-colors">
                    5.0 <Star size={18} fill="#F2641A" className="text-[#F2641A] group-hover:text-[#F2A922] group-hover:scale-110 transition-all duration-300" />
                  </div>
                  <div className="text-[10px] font-black uppercase text-[#7A6B5C] group-hover:text-[#F2A922] tracking-widest mt-1 transition-colors">Rating</div>
               </motion.div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotate: 2 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative"
          >
            {/* Visual Representation of a Plate or Meal */}
            <div className="relative aspect-square rounded-[60px] bg-white shadow-2xl overflow-hidden border-[12px] border-white ring-1 ring-[#EFD9B4] group">
               <img 
                 src="/hero.jpg" 
                 alt="Almuerzo Premium Jacks" 
                 className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
               />
            </div>

            {/* Floating Badges */}
            <motion.div 
              animate={{ y: [-12, 12] }}
              transition={{ duration: 3.5, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
              className="absolute top-4 -right-6 lg:-right-10 bg-white p-6 rounded-3xl shadow-xl border border-[#EFD9B4]/50 z-20 hidden md:block"
            >
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#92CB94]/20 text-[#5A9E5E] rounded-xl flex items-center justify-center">
                     <Truck size={20} />
                  </div>
                  <div>
                     <p className="text-[10px] font-black text-[#7A6B5C] uppercase tracking-widest">Entrega</p>
                     <p className="text-sm font-black text-[#2B2118] tracking-tight">Directo a tu oficina</p>
                  </div>
               </div>
            </motion.div>

            <motion.div 
              animate={{ y: [12, -12] }}
              transition={{ duration: 4, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
              className="absolute bottom-4 -left-6 lg:-left-10 bg-white p-6 rounded-3xl shadow-xl border border-[#EFD9B4]/50 z-20 hidden md:block"
            >
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#F2641A]/10 text-[#F2641A] rounded-xl flex items-center justify-center">
                     <Heart size={20} fill="currentColor" />
                  </div>
                  <div>
                     <p className="text-[10px] font-black text-[#7A6B5C] uppercase tracking-widest">Sabor</p>
                     <p className="text-sm font-black text-[#2B2118] tracking-tight">100% Casero</p>
                  </div>
               </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* --- MENU SECTION --- */}
      <section id="menu" className="py-32 bg-[#FFF9F0] relative">
         <div className="max-w-7xl mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-20 items-center">
               <motion.div
                 initial={{ opacity: 0, x: -50 }}
                 whileInView={{ opacity: 1, x: 0 }}
                 viewport={{ once: true }}
                 className="order-2 lg:order-1"
               >
                  <div className="relative group cursor-zoom-in" onClick={() => setIsMenuExpanded(true)}>
                     <div className="absolute -inset-4 bg-orange-500/5 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-all duration-700"></div>
                     <div className="relative bg-[#FFF6EA] p-4 rounded-[48px] shadow-2xl border border-[#EFD9B4]/50 overflow-hidden">
                        <img 
                          src={weeklyMenu.imagen_url ? (weeklyMenu.imagen_url.startsWith('http') ? weeklyMenu.imagen_url : API_URL + weeklyMenu.imagen_url) : '/weekly_menu_preview_1778475988702.png'} 
                          alt="Menú Semanal Jacks" 
                          className="w-full h-auto rounded-[36px] shadow-sm transform transition-transform duration-700 group-hover:scale-[1.02]"
                        />
                        <div className="absolute inset-0 bg-[#2B2118]/0 group-hover:bg-[#2B2118]/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                           <button className="bg-white text-[#2B2118] px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest flex items-center gap-2">
                              Ampliar Menú
                           </button>
                        </div>
                     </div>
                  </div>
               </motion.div>

               <motion.div
                 initial={{ opacity: 0, x: 50 }}
                 whileInView={{ opacity: 1, x: 0 }}
                 viewport={{ once: true }}
                 className="order-1 lg:order-2 space-y-8"
               >
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#2B2118]/5 text-[#2B2118] rounded-full text-[10px] font-black uppercase tracking-[0.2em]">
                    <Calendar size={14} /> Programación Semanal
                  </div>
                  <h2 className="text-4xl md:text-6xl font-black text-[#2B2118] tracking-tight leading-tight">
                    Variedad que <br />
                    <span className="text-[#F2641A] italic">te sorprende</span>
                  </h2>
                  <div className="bg-[#F2641A]/10 px-6 py-3 rounded-2xl border border-[#F2641A]/20 inline-block">
                    <p className="text-lg font-black text-[#F2641A] uppercase tracking-tight">{weeklyMenu.fechas}</p>
                  </div>
                  <p className="text-xl text-[#7A6B5C] font-medium leading-relaxed">
                    Rotamos nuestra proteína (Cerdo, Res y Pollo) para que nunca te aburras. Cada día es una nueva aventura gastronómica.
                  </p>
                  
                  <div className="space-y-6 pt-4">
                     {[
                       { t: "Cero Plásticos", d: "Usamos recipientes retornables de alta durabilidad", icon: Shield },
                       { t: "Nutrición Balanceada", d: "Diseñado por expertos para darte energía sin pesadez", icon: TrendingUp },
                       { t: "Ahorro Real", d: "Menos de la mitad de lo que gastas en apps de comida", icon: Star }
                     ].map((item, i) => (
                        <div key={i} className="flex gap-4 group">
                           <div className="w-12 h-12 bg-white shadow-md border border-[#EFD9B4]/50 rounded-2xl flex items-center justify-center text-[#F2641A] group-hover:bg-[#F2641A] group-hover:text-white transition-all">
                              <item.icon size={20} />
                           </div>
                           <div>
                              <h4 className="font-black text-[#2B2118] group-hover:text-[#F2641A] transition-colors">{item.t}</h4>
                              <p className="text-[#7A6B5C] text-sm font-medium">{item.d}</p>
                           </div>
                        </div>
                     ))}
                  </div>
               </motion.div>
            </div>
         </div>
      </section>

      {/* --- PLANS SECTION --- */}
      <Plans 
        plans={planes}
        selectedPlan={selectedPlan} 
        setSelectedPlan={setSelectedPlan} 
        onOpenWizard={openWizard} 
      />

      {/* --- HOW IT WORKS 2.0 --- */}
      <section id="beneficios" className="py-32 bg-[#FFF6EA] relative overflow-hidden">
         <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-[#FFF9F0] to-transparent"></div>
         
         <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
            <div className="mb-20 max-w-2xl mx-auto">
               <h2 className="text-5xl font-black text-[#2B2118] tracking-tight mb-6">Tu camino al éxito</h2>
               <p className="text-lg text-[#7A6B5C] font-medium leading-relaxed">Olvídate de la cocina. Nosotros nos encargamos de todo en 6 pasos simples.</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
               {[
                 { i: "01", t: "Regístrate", d: "Elige tu plan y danos tus datos de entrega", icon: MessageCircle },
                 { i: "02", t: "Paga Fácil", d: "Sube tu comprobante de Bancolombia en segundos", icon: Shield },
                 { i: "03", t: "Recibe Menú", d: "Cada miércoles te enviamos la propuesta por WhatsApp", icon: Calendar },
                 { i: "04", t: "Primer Almuerzo", d: "El lunes iniciamos. Te llamamos al llegar", icon: Truck },
                 { i: "05", t: "Intercambio", d: "Entregas la coca anterior y recibes la nueva", icon: Shield },
                 { i: "06", t: "Felicidad", d: "Almuerzo casero, caliente y sin esfuerzo", icon: Heart }
               ].map((step, i) => (
                  <motion.div
                    key={i}
                    whileHover={{ y: -10 }}
                    className="bg-white p-10 rounded-[40px] shadow-sm border border-[#EFD9B4]/30 text-left group transition-all hover:shadow-2xl hover:shadow-[#F2641A]/5 hover:border-[#F2641A]/30"
                  >
                     <div className="flex justify-between items-start mb-8">
                        <div className="w-16 h-16 bg-[#FFF6EA] rounded-2xl flex items-center justify-center text-[#2B2118] group-hover:bg-[#F2641A] group-hover:text-white transition-all">
                           <step.icon size={28} />
                        </div>
                        <span className="text-4xl font-black text-[#EFD9B4] group-hover:text-[#F2641A]/20 transition-colors">{step.i}</span>
                     </div>
                     <h3 className="text-2xl font-black text-[#2B2118] mb-4 tracking-tight">{step.t}</h3>
                     <p className="text-[#7A6B5C] font-medium leading-relaxed">{step.d}</p>
                  </motion.div>
               ))}
            </div>
         </div>
      </section>

      {/* --- FAQ SECTION --- */}
      <FAQ />

      {/* --- FOOTER 2.0 --- */}
      <footer className="bg-[#2B2118] text-white pt-32 pb-12 rounded-t-[60px] md:rounded-t-[100px] mt-10">
         <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-24">
               <div className="space-y-8">
                  <h3 className="text-3xl font-black text-white tracking-tighter font-display">
                    La <span className="text-[#F2641A]">Coca</span> <br />
                    <span className="text-[#7A6B5C] text-3xl lowercase">de</span> <br />
                    <span className="text-[#F2641A]">Jacks</span>
                  </h3>
                  <p className="text-[#7A6B5C] font-medium leading-relaxed">
                     Transformando la hora del almuerzo en Medellín. Comida casera, consciente y entregada con amor.
                  </p>
                  <div className="flex gap-4">
                     <a href="#" className="w-12 h-12 rounded-2xl bg-[#2B2118] border border-[#7A6B5C]/20 flex items-center justify-center text-white hover:bg-[#F2641A] transition-all"><Share2 size={20} /></a>
                     <a href="#" className="w-12 h-12 rounded-2xl bg-[#2B2118] border border-[#7A6B5C]/20 flex items-center justify-center text-white hover:bg-[#F2641A] transition-all"><MessageCircle size={20} /></a>
                  </div>
               </div>

               <div className="space-y-8">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#F2641A]">Contacto</h4>
                  <div className="space-y-6">
                     <a href="tel:3116437887" className="group flex items-center gap-4 text-[#EFD9B4] hover:text-white transition-colors no-underline">
                        <div className="w-10 h-10 rounded-xl bg-[#2B2118] border border-[#7A6B5C]/20 flex items-center justify-center group-hover:bg-[#F2641A] transition-all"><Phone size={16} /></div>
                        <span className="font-black text-sm tracking-tight">311 643 7887</span>
                     </a>
                     <a href="mailto:hola@lacocadejacks.com" className="group flex items-center gap-4 text-[#EFD9B4] hover:text-white transition-colors no-underline">
                        <div className="w-10 h-10 rounded-xl bg-[#2B2118] border border-[#7A6B5C]/20 flex items-center justify-center group-hover:bg-[#F2641A] transition-all"><Mail size={16} /></div>
                        <span className="font-black text-sm tracking-tight">hola@lacocadejacks.com</span>
                     </a>
                  </div>
               </div>

               <div className="space-y-8">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#F2641A]">Horarios</h4>
                  <div className="space-y-6">
                     <div className="flex items-center gap-4 text-[#EFD9B4]">
                        <div className="w-10 h-10 rounded-xl bg-[#2B2118] border border-[#7A6B5C]/20 flex items-center justify-center"><Clock size={16} /></div>
                        <div>
                           <p className="font-black text-sm tracking-tight">Lun - Vie</p>
                           <p className="text-xs text-[#7A6B5C] font-bold uppercase">8:00 AM - 5:00 PM</p>
                        </div>
                     </div>
                     <div className="p-5 bg-[#F2641A]/10 rounded-3xl border border-[#F2641A]/20">
                        <p className="text-[9px] font-black uppercase tracking-widest text-[#F2641A] mb-1">Entregas Diarias</p>
                        <p className="text-lg font-black text-[#FFF6EA]">11:30 AM - 1:30 PM</p>
                     </div>
                  </div>
               </div>

               <div className="space-y-8">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#F2641A]">Ubicación</h4>
                  <div className="space-y-6">
                     <div className="flex items-center gap-4 text-[#EFD9B4]">
                        <div className="w-10 h-10 rounded-xl bg-[#2B2118] border border-[#7A6B5C]/20 flex items-center justify-center"><MapPin size={16} /></div>
                        <span className="font-black text-sm tracking-tight">Guayabal, Medellín</span>
                     </div>
                     <div className="relative rounded-[32px] overflow-hidden border border-[#7A6B5C]/30 group cursor-pointer">
                        <img src="/mapa_ubicacion.jpg" alt="Mapa Jacks" className="w-full h-24 object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute inset-0 flex items-center justify-center bg-[#2B2118]/40 group-hover:bg-[#2B2118]/0 transition-all">
                           <span className="bg-white text-[#2B2118] px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-xl">Google Maps</span>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            <div className="pt-12 border-t border-[#7A6B5C]/20 flex flex-col md:flex-row justify-between items-center gap-8">
               <p className="text-xs font-bold text-[#7A6B5C] uppercase tracking-widest">© 2026 La Coca de Jacks. All rights reserved.</p>
               <div className="flex gap-10">
                  <a href="#" className="text-xs font-bold text-[#7A6B5C] hover:text-white uppercase tracking-widest transition-colors no-underline">Términos</a>
                  <a href="#" className="text-xs font-bold text-[#7A6B5C] hover:text-white uppercase tracking-widest transition-colors no-underline">Privacidad</a>
               </div>
            </div>
         </div>
      </footer>

      {/* --- MODALS --- */}
      <RegistrationWizard 
        isOpen={isWizardOpen} 
        onClose={() => {
          setIsWizardOpen(false);
          if (location.pathname === '/registro') {
            navigate('/');
          }
        }} 
        initialPlan={selectedPlan}
        plans={planes}
      />



      {/* Floating CTA Mobile */}
      <AnimatePresence>
         <motion.div 
            initial={{ opacity: 0, y: 100, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            className="fixed bottom-10 left-1/2 z-[200] md:hidden"
         >
            <button 
              onClick={() => openWizard()}
              className="bg-[#F2641A] text-white px-10 py-5 rounded-full font-black shadow-2xl flex items-center gap-3 active:scale-95 border-none"
            >
               <MessageCircle size={24} fill="currentColor" />
               Reservar Cupo
            </button>
         </motion.div>
      </AnimatePresence>

      {/* Menu Zoom Modal */}
      <AnimatePresence>
        {isMenuExpanded && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-[#2B2118]/95 backdrop-blur-2xl"
            onClick={() => setIsMenuExpanded(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="relative max-w-4xl w-full"
              onClick={e => e.stopPropagation()}
            >
               <button 
                 onClick={() => setIsMenuExpanded(false)}
                 className="absolute -top-12 right-0 text-white hover:text-[#F2641A] transition-colors"
               >
                  <X size={40} strokeWidth={3} />
               </button>
               <div className="bg-white p-2 rounded-[40px] shadow-2xl overflow-hidden">
                  <img 
                    src={weeklyMenu.imagen_url ? (weeklyMenu.imagen_url.startsWith('http') ? weeklyMenu.imagen_url : API_URL + weeklyMenu.imagen_url) : '/weekly_menu_preview_1778475988702.png'} 
                    alt="Menú semanal completo" 
                    className="w-full h-auto rounded-[32px]"
                  />
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
