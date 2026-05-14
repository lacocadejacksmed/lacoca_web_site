import { motion } from 'framer-motion';
import { ArrowRight, Star, CheckCircle, Clock, Utensils } from 'lucide-react';

export default function Hero({ onOpenWizard }) {
  const features = [
    { icon: Utensils, title: "Comida Fresca Diaria", desc: "Preparada la noche anterior con ingredientes locales" },
    { icon: CheckCircle, title: "Menús Rotativos", desc: "Nueva variedad cada semana: Cerdo, Res y Pollo" },
    { icon: Clock, title: "Entrega Puntual", desc: "Te avisamos 5 minutos antes de llegar a tu ubicación" },
    { icon: Star, title: "Ahorra Tiempo", desc: "Olvídate de cocinar y empacar cada noche" }
  ];

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-orange-600 via-orange-500 to-amber-500 text-white overflow-hidden pt-24 pb-32">
      {/* Decorative blobs */}
      <div className="absolute top-[10%] right-[5%] w-72 h-72 bg-white/10 rounded-full blur-[80px] animate-pulse"></div>
      <div className="absolute bottom-[10%] left-[5%] w-96 h-96 bg-white/10 rounded-full blur-[80px] animate-pulse"></div>

      <div className="max-w-7xl mx-auto px-6 relative">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md border border-white/30 rounded-full px-5 py-2 text-sm font-bold mb-8 shadow-sm">
              <span className="w-2 h-2 bg-yellow-300 rounded-full animate-ping"></span>
              Almuerzos Ejecutivos en Medellín
            </span>

            <h1 className="text-5xl md:text-7xl font-black leading-tight mb-8 tracking-tight">
              Tu almuerzo <br />
              <span className="text-yellow-200">listo cada día</span>
            </h1>

            <p className="text-xl text-orange-50 leading-relaxed mb-10 max-w-lg font-medium opacity-90">
              Te cocinamos, empacamos y llevamos hasta tu trabajo. Comida fresca, menús rotativos y cero preocupaciones.
            </p>

            <div className="flex flex-wrap gap-4 mb-14">
              <button 
                onClick={onOpenWizard}
                className="bg-white text-orange-600 hover:bg-orange-50 font-black px-8 py-4 rounded-2xl flex items-center gap-3 transition-all shadow-xl hover:-translate-y-1 active:scale-95"
              >
                Reserva tu Cupo Ahora
                <ArrowRight size={22} strokeWidth={3} />
              </button>
              <a href="#planes" className="bg-transparent border-2 border-white/50 hover:bg-white/10 font-bold px-8 py-4 rounded-2xl transition-all no-underline text-white flex items-center">
                Ver Planes
              </a>
            </div>

            <div className="grid grid-cols-3 gap-8 border-t border-white/20 pt-10">
              <div>
                <div className="text-3xl font-black">900+</div>
                <div className="text-sm text-orange-100 font-bold">Clientes Activos</div>
              </div>
              <div>
                <div className="text-3xl font-black">100%</div>
                <div className="text-sm text-orange-100 font-bold">Comida Fresca</div>
              </div>
              <div>
                <div className="text-3xl font-black flex items-center gap-1">5<Star size={20} fill="currentColor" /></div>
                <div className="text-sm text-orange-100 font-bold">Satisfacción</div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="flex flex-col gap-4"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {features.map((f, i) => (
              <div key={i} className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20 hover:bg-white/20 transition-all cursor-default group shadow-sm">
                <div className="flex items-start gap-5">
                  <div className="bg-white/20 rounded-2xl p-4 group-hover:scale-110 transition-transform">
                    <f.icon size={28} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-1 tracking-tight">{f.title}</h3>
                    <p className="text-orange-50/80 text-sm leading-relaxed font-medium">{f.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>

        </div>
      </div>

      {/* Wave divider */}
      <div className="absolute bottom-0 left-0 right-0 h-24 overflow-hidden leading-[0]">
        <svg viewBox="0 0 1440 120" className="relative block w-full h-full" preserveAspectRatio="none">
          <path d="M0,120L60,105C120,90,240,60,360,45C480,30,600,30,720,37.5C840,45,960,60,1080,67.5C1200,75,1320,75,1380,75L1440,75V120H1380C1320,120,1200,120,1080,120C960,120,840,120,720,120C600,120,480,120,360,120C240,120,120,120,60,120H0Z" fill="white"></path>
        </svg>
      </div>
    </div>
  );
}
