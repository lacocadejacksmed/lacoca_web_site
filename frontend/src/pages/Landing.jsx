import { useState, useEffect } from 'react';
import api from '../services/api';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Plans from '../components/Plans';
import FAQ from '../components/FAQ';
import RegistrationWizard from '../components/RegistrationWizard';
import PaymentInfo from '../components/PaymentInfo';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Shield, 
  TrendingUp, 
  Clock, 
  Heart, 
  Users, 
  MessageCircle, 
  MapPin, 
  Mail, 
  Phone,
  CreditCard,
  Calendar,
  Truck,
  RefreshCw,
  Share2,
  Check,
  X
} from 'lucide-react';

export default function Landing() {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isPaymentInfoOpen, setIsPaymentInfoOpen] = useState(false);
  const [isNavbarMenuOpen, setIsNavbarMenuOpen] = useState(false);
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('quincenal');
  const [weeklyMenu, setWeeklyMenu] = useState({ fechas: 'Del 11 al 15 de Mayo', imagen_url: '/weekly_menu_preview_1778475988702.png' });

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const res = await api.get('/menu');
        if (res.data.success && res.data.menu) {
          setWeeklyMenu(res.data.menu);
        }
      } catch (err) {
        console.error("Error al cargar menú:", err);
      }
    };
    fetchMenu();
  }, []);

  const openWizard = (planId) => {
    if (planId) setSelectedPlan(planId);
    setIsWizardOpen(true);
  };

  return (
    <div className="bg-white selection:bg-orange-100 selection:text-orange-600">
      <Navbar 
        onOpenWizard={() => openWizard()} 
        onOpenPaymentInfo={() => setIsPaymentInfoOpen(true)} 
        onMenuToggle={(isOpen) => setIsNavbarMenuOpen(isOpen)}
      />
      
      <main>
        <Hero onOpenWizard={() => openWizard()} />
        
        {/* Weekly Menu Section */}
        <section id="menu" className="py-24 bg-gray-50/50 overflow-hidden">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col lg:flex-row items-center gap-16">
              <motion.div 
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="lg:w-1/2 space-y-8"
              >
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-600 rounded-full text-xs font-black uppercase tracking-widest">
                  <Calendar size={14} /> Menú Actualizado
                </div>
                <h2 className="text-4xl md:text-6xl font-black tracking-tight text-slate-900 leading-[1.1]">
                  Menú de la <span className="text-orange-500">Semana</span>
                </h2>
                <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-gray-100 inline-block">
                   <p className="text-lg font-black text-slate-700">{weeklyMenu.fechas}</p>
                </div>
                <p className="text-xl text-gray-500 font-medium leading-relaxed">
                  Variedad, frescura y el toque casero que te encanta, entregado directamente en tu oficina. Cada plato es una experiencia diferente.
                </p>
                <div className="pt-4 flex flex-wrap gap-6">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-orange-500"><Check size={20} strokeWidth={3} /></div>
                      <span className="text-sm font-bold text-slate-700">Ingredientes frescos</span>
                   </div>
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-orange-500"><Check size={20} strokeWidth={3} /></div>
                      <span className="text-sm font-bold text-slate-700">Sabor 100% casero</span>
                   </div>
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, x: 50 }}
                whileInView={{ opacity: 1, scale: 1, x: 0 }}
                viewport={{ once: true }}
                className="lg:w-1/2 relative group cursor-zoom-in"
                onClick={() => setIsMenuExpanded(true)}
              >
                <div className="absolute inset-0 bg-orange-500/20 blur-[100px] rounded-full group-hover:bg-orange-500/30 transition-all"></div>
                <div className="relative bg-white p-4 rounded-[40px] shadow-2xl border border-gray-100 overflow-hidden transform group-hover:-rotate-1 transition-all duration-500">
                  <img 
                    src={weeklyMenu.imagen_url || '/weekly_menu_preview_1778475988702.png'} 
                    alt={`Menú de la Semana ${weeklyMenu.fechas}`} 
                    className="w-full h-auto rounded-[32px] shadow-sm"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-all flex items-end p-10">
                     <div className="text-white">
                        <p className="text-xs font-black uppercase tracking-widest text-orange-400 mb-1">Haz clic para ampliar</p>
                        <h4 className="text-2xl font-black">Ver Menú Completo</h4>
                     </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
        
        {/* How it works */}
        <section className="py-24 bg-white relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 relative">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">¿Cómo funciona?</h2>
              <p className="text-lg text-gray-500 font-medium max-w-lg mx-auto leading-relaxed">
                Empezar es súper fácil. Sigue estos 6 pasos y tendrás almuerzos resueltos.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: "1. Regístrate", desc: "Completa el formulario y elige tu plan ideal", icon: Users, gradient: "from-blue-500 to-cyan-500" },
                { title: "2. Paga y Confirma", desc: "Realiza el pago y sube el comprobante", icon: CreditCard, gradient: "from-purple-500 to-pink-500" },
                { title: "3. Recibe el Menú", desc: "Cada miércoles enviamos el menú por WhatsApp", icon: Calendar, gradient: "from-orange-500 to-amber-500" },
                { title: "4. Primera Entrega", desc: "El lunes inicia tu servicio. Te llamamos antes", icon: Truck, gradient: "from-green-500 to-emerald-500" },
                { title: "5. Intercambio Diario", desc: "Recibes la llena y entregas la anterior limpia", icon: RefreshCw, gradient: "from-indigo-500 to-violet-500" },
                { title: "6. ¡Disfruta!", desc: "Almuerzo rico y fresco de lunes a viernes", icon: Heart, gradient: "from-red-500 to-pink-500" }
              ].map((step, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-gray-50/50 p-8 rounded-[32px] border border-gray-100 hover:shadow-xl transition-all group"
                >
                  <div className={`w-14 h-14 bg-gradient-to-br ${step.gradient} rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg transition-transform group-hover:scale-110`}>
                    <step.icon size={28} />
                  </div>
                  <h3 className="text-xl font-black mb-3">{step.title}</h3>
                  <p className="text-gray-500 font-medium leading-relaxed">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <Plans 
          selectedPlan={selectedPlan} 
          setSelectedPlan={setSelectedPlan} 
          onOpenWizard={openWizard} 
        />

        {/* Benefits Section */}
        <section id="beneficios" className="py-24 bg-slate-900 text-white rounded-[40px] md:rounded-[80px] mx-4 my-10 overflow-hidden relative">
           <div className="max-w-7xl mx-auto px-6 text-center">
              <h2 className="text-4xl md:text-6xl font-black mb-8">¿Por qué elegir Jacks?</h2>
              <p className="text-xl text-slate-400 mb-16 max-w-2xl mx-auto">Más que un servicio de almuerzos, es tu aliado para una vida práctica</p>
              
              <div className="grid md:grid-cols-3 gap-12">
                 <div className="space-y-4">
                    <div className="text-5xl font-black text-orange-500">5+</div>
                    <div className="text-lg font-black uppercase tracking-widest text-slate-500">Horas ahorradas</div>
                    <p className="text-slate-400 text-sm">Recupera tiempo valioso que gastabas cocinando</p>
                 </div>
                 <div className="space-y-4">
                    <div className="text-5xl font-black text-orange-500">25%</div>
                    <div className="text-lg font-black uppercase tracking-widest text-slate-500">Más económico</div>
                    <p className="text-slate-400 text-sm">Ahorra dinero comparado con comer fuera</p>
                 </div>
                 <div className="space-y-4">
                    <div className="text-5xl font-black text-orange-500">900</div>
                    <div className="text-lg font-black uppercase tracking-widest text-slate-500">Clientes felices</div>
                    <p className="text-slate-400 text-sm">Únete a nuestra comunidad de profesionales</p>
                 </div>
              </div>
           </div>
        </section>

        <FAQ />

        {/* Footer */}
         <footer className="bg-white pt-16 pb-8 border-t border-gray-100">
            <div className="max-w-6xl mx-auto px-6">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16 items-start">
                  <div className="space-y-6">
                     <h3 className="text-2xl font-black text-slate-900 leading-tight">
                        La Coca de <span className="text-orange-500">Jacks</span>
                     </h3>
                     <p className="text-gray-500 font-medium leading-relaxed text-sm">
                        Tu aliado para almuerzos ejecutivos. Comida casera, fresca y entregada directamente en tu oficina.
                     </p>
                     <div className="flex gap-3">
                        <a href="#" className="w-9 h-9 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:bg-orange-500 hover:text-white transition-all shadow-sm"><Share2 size={16} /></a>
                        <a href="#" className="w-9 h-9 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:bg-orange-500 hover:text-white transition-all shadow-sm"><MessageCircle size={16} /></a>
                     </div>
                  </div>

                  <div className="space-y-6">
                     <h4 className="font-black uppercase text-[10px] tracking-[0.2em] text-slate-400">Contacto</h4>
                     <div className="space-y-4">
                        <a href="tel:3116437887" className="group flex items-center gap-3 text-slate-600 hover:text-orange-600 transition-colors">
                           <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-orange-50 transition-colors"><Phone size={14} /></div>
                           <span className="text-sm font-bold">311 643 7887</span>
                        </a>
                        <a href="mailto:hola@lacocadejacks.com" className="group flex items-center gap-3 text-slate-600 hover:text-orange-600 transition-colors">
                           <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-orange-50 transition-colors"><Mail size={14} /></div>
                           <span className="text-sm font-bold">hola@lacocadejacks.com</span>
                        </a>
                     </div>
                  </div>

                  <div className="space-y-6">
                     <h4 className="font-black uppercase text-[10px] tracking-[0.2em] text-slate-400">Servicio</h4>
                     <div className="space-y-4">
                        <div className="flex items-center gap-3 text-slate-600">
                           <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center"><Clock size={14} /></div>
                           <span className="text-sm font-bold">Lun-Vie: 8am - 5pm</span>
                        </div>
                        <div className="p-4 bg-orange-50/50 rounded-2xl border border-orange-100/50 inline-block">
                           <div className="text-[9px] font-black uppercase tracking-widest text-orange-400 mb-1">Entregas</div>
                           <div className="text-sm font-black text-orange-700">11:30am - 1:30pm</div>
                        </div>
                     </div>
                  </div>

                  <div className="space-y-6">
                     <h4 className="font-black uppercase text-[10px] tracking-[0.2em] text-slate-400">Ubicación</h4>
                     <a 
                        href="https://www.google.com/maps/search/?api=1&query=Cl.+27+%23+65B-28+Guayabal+Medellin+Antioquia+Colombia" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="group block space-y-3"
                     >
                        <div className="flex items-start gap-3 text-slate-600 group-hover:text-orange-600 transition-colors">
                           <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-orange-50 transition-colors shrink-0"><MapPin size={14} /></div>
                           <span className="text-sm font-bold leading-tight">Cl. 27 # 65B-28, Guayabal</span>
                        </div>
                        <div className="relative rounded-2xl overflow-hidden border border-slate-100 shadow-md group-hover:shadow-xl transition-all duration-500">
                           <img 
                              src="/mapa_ubicacion.jpg" 
                              alt="Ubicación La Coca de Jacks" 
                              className="w-full h-28 object-cover"
                           />
                           <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-[8px] font-black uppercase text-orange-600 shadow-sm">
                              Google Maps
                           </div>
                        </div>
                     </a>
                  </div>
               </div>
               <div className="pt-8 border-t border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                     © 2026 La Coca de Jacks.
                  </p>
                  <div className="flex gap-6 text-[10px] font-black uppercase tracking-widest text-slate-400">
                     <a href="#" className="hover:text-orange-500 transition-colors">Términos</a>
                     <a href="#" className="hover:text-orange-500 transition-colors">Privacidad</a>
                  </div>
               </div>
            </div>
         </footer>
      </main>

      <RegistrationWizard 
        isOpen={isWizardOpen} 
        onClose={() => setIsWizardOpen(false)} 
        initialPlan={selectedPlan}
      />

      <PaymentInfo 
        isOpen={isPaymentInfoOpen} 
        onClose={() => setIsPaymentInfoOpen(false)}
        onReturn={() => {
          setIsPaymentInfoOpen(false);
          setIsWizardOpen(true);
        }}
      />

      {/* Floating CTA for Mobile - Hidden when menu is open */}
      <AnimatePresence>
        {!isNavbarMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className="fixed bottom-8 left-1/2 z-[150] md:hidden"
          >
             <button 
               onClick={() => openWizard()}
               className="bg-orange-500 text-white px-8 py-4 rounded-full font-black shadow-2xl flex items-center gap-3 animate-bounce border-none cursor-pointer"
             >
                <MessageCircle size={20} fill="currentColor" />
                Reserva tu Cupo
             </button>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Menu Expansion Modal */}
      <AnimatePresence>
        {isMenuExpanded && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-xl"
            onClick={() => setIsMenuExpanded(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center"
              onClick={e => e.stopPropagation()}
            >
               <button 
                 onClick={() => setIsMenuExpanded(false)}
                 className="absolute -top-4 -right-4 md:-top-10 md:-right-10 bg-white text-slate-900 p-3 rounded-full shadow-2xl hover:bg-orange-500 hover:text-white transition-all z-10"
               >
                  <X size={24} strokeWidth={3} />
               </button>
               
               <div className="bg-white p-2 md:p-4 rounded-[32px] md:rounded-[48px] shadow-2xl overflow-hidden overflow-y-auto w-full">
                  <img 
                    src={weeklyMenu.imagen_url || '/weekly_menu_preview_1778475988702.png'} 
                    alt="Menú semanal completo" 
                    className="w-full h-auto rounded-[24px] md:rounded-[40px]"
                  />
               </div>
               
               <div className="mt-6 text-center">
                  <p className="text-white/60 text-xs font-bold uppercase tracking-[0.3em]">Menú Semanal • Medellín</p>
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
