import { motion } from 'framer-motion';
import { Zap, TrendingUp, Star, Check, ArrowRight } from 'lucide-react';

export default function Plans({ onOpenWizard, selectedPlan, setSelectedPlan, plans: dynamicPlans }) {
  const staticPlans = [
    {
      id: 'semanal',
      name: 'Plan Semanal',
      price: 75000,
      days: 5,
      daily: 15000,
      icon: Zap,
      color: 'blue',
      gradient: 'from-blue-500 to-cyan-500',
      features: ['Ideal para probar el servicio', '5 días de almuerzos', 'Menú rotativo semanal', 'Entrega lunes a viernes', 'Sistema de intercambio']
    },
    {
      id: 'quincenal',
      name: 'Plan Quincenal',
      price: 150000,
      days: 10,
      daily: 15000,
      popular: true,
      icon: TrendingUp,
      color: 'orange',
      gradient: 'from-orange-500 to-amber-500',
      features: ['El más popular', '10 días de almuerzos', 'Mejor relación calidad-precio', 'Menús variados quincenales', 'Grupo WhatsApp exclusivo', 'Prioridad en reservas']
    },
    {
      id: 'mensual',
      name: 'Plan Mensual',
      price: 285000,
      days: 20,
      daily: 14250,
      save: 15000,
      icon: Star,
      color: 'purple',
      gradient: 'from-purple-500 to-pink-500',
      features: ['Máximo ahorro ($15.000)', '20 días de almuerzos', 'Mejor precio por día', 'Planificación completa del mes', 'Atención prioritaria', 'Flexibilidad en menús']
    }
  ];

  const plans = staticPlans.map(staticPlan => {
    if (dynamicPlans && Array.isArray(dynamicPlans) && dynamicPlans.length > 0) {
      const dynamicPlan = dynamicPlans.find(
        dp => (dp.nombre || dp.name || '').toLowerCase() === staticPlan.id ||
              (dp.nombre || dp.name || '').toLowerCase().includes(staticPlan.id)
      );
      if (dynamicPlan) {
        const price = Number(dynamicPlan.precio_base || dynamicPlan.precio || dynamicPlan.price || staticPlan.price);
        const days = Number(dynamicPlan.dias_duracion || dynamicPlan.dias || dynamicPlan.days || staticPlan.days);
        const daily = Math.round(price / days);
        return {
          ...staticPlan,
          name: dynamicPlan.nombre || dynamicPlan.name || staticPlan.name,
          price,
          days,
          daily
        };
      }
    }
    return staticPlan;
  });

  // Calculate dynamic maximum savings for Monthly plan compared to Weekly daily price
  const weeklyPlan = plans.find(p => p.id === 'semanal');
  const monthlyPlan = plans.find(p => p.id === 'mensual');
  if (weeklyPlan && monthlyPlan) {
    const standardCostFor20Days = weeklyPlan.daily * monthlyPlan.days;
    const saveAmount = standardCostFor20Days - monthlyPlan.price;
    if (saveAmount > 0) {
      monthlyPlan.save = saveAmount;
      monthlyPlan.features[0] = `Máximo ahorro ($${saveAmount.toLocaleString('es-CO')})`;
    } else {
      monthlyPlan.save = null;
      monthlyPlan.features[0] = `Planificación completa del mes`;
    }
  }

  const currentPlanData = plans.find(p => p.id === selectedPlan) || plans[1];

  return (
    <section id="planes" className="py-24 bg-gradient-to-b from-white to-orange-50/50">
      <div className="max-w-7xl mx-auto px-6">

        <div className="text-center mb-16">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="inline-block bg-orange-100 text-orange-700 rounded-full px-5 py-1.5 text-xs font-black uppercase tracking-wider mb-4"
          >
            Planes Flexibles
          </motion.span>
          <h2 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">Elige el plan perfecto para ti</h2>
          <p className="text-lg text-gray-600 max-w-xl mx-auto font-medium">
            Todos los planes incluyen comida fresca, entrega diaria y sistema de intercambio de envases
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan) => (
            <motion.div
              key={plan.id}
              whileHover={{ y: -10 }}
              onClick={() => setSelectedPlan(plan.id)}
              className={`relative bg-white rounded-3xl p-8 shadow-xl cursor-pointer transition-all border-2 flex flex-col ${selectedPlan === plan.id ? 'border-orange-500 scale-105 z-10' : 'border-transparent hover:border-orange-200'
                }`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-[10px] font-black px-4 py-1.5 rounded-b-xl uppercase tracking-widest">
                  Más Popular
                </div>
              )}
              {plan.save && (
                <div className="absolute top-4 right-4 bg-green-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase">
                  Ahorra ${plan.save.toLocaleString()}
                </div>
              )}

              <div className={`w-14 h-14 bg-gradient-to-br ${plan.gradient} rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-orange-500/20`}>
                <plan.icon size={28} />
              </div>

              <h3 className="text-2xl font-black mb-2">{plan.name}</h3>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-4xl font-black tracking-tight">${(plan.price / 1000).toFixed(0)}K</span>
                <span className="text-gray-400 font-bold text-sm">/ {plan.days} días</span>
              </div>
              <div className="text-green-600 font-black text-sm mb-8">${plan.daily.toLocaleString()} por día</div>

              <ul className="space-y-4 mb-10 flex-1">
                {plan.features.map((feat, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm font-semibold text-gray-600">
                    <div className={`shrink-0 w-5 h-5 rounded-full bg-gradient-to-br ${plan.gradient} flex items-center justify-center mt-0.5`}>
                      <Check size={12} strokeWidth={4} className="text-white" />
                    </div>
                    {feat}
                  </li>
                ))}
              </ul>

              <button
                onClick={(e) => { e.stopPropagation(); onOpenWizard(plan.id); }}
                className={`w-full py-4 rounded-2xl font-black transition-all flex items-center justify-center gap-2 ${selectedPlan === plan.id
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/40 hover:bg-orange-600'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
              >
                {selectedPlan === plan.id ? 'Seleccionado ✓' : 'Seleccionar Plan'}
                <ArrowRight size={18} />
              </button>
            </motion.div>
          ))}
        </div>

        {/* Investment Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-orange-200 rounded-[32px] p-8 md:p-12"
        >
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            <div className="max-w-xl text-center lg:text-left">
              <h3 className="text-3xl font-black mb-4">¿Primera vez? Inversión inicial</h3>
              <p className="text-gray-700 font-medium leading-relaxed mb-8">
                Para iniciar el servicio necesitas adquirir el juego de cocas (envases reutilizables) que intercambiarás diariamente.
              </p>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
                <div className="bg-white border-2 border-orange-100 rounded-2xl px-6 py-4">
                  <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Plan elegido</div>
                  <div className="text-xl font-black text-gray-800">${currentPlanData.price.toLocaleString('es-CO')}</div>
                </div>
                <div className="text-3xl font-black text-orange-500">+</div>
                <div className="bg-white border-2 border-orange-100 rounded-2xl px-6 py-4">
                  <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Juego de cocas</div>
                  <div className="text-xl font-black text-gray-800">$70.000</div>
                </div>
                <div className="text-3xl font-black text-orange-500">=</div>
                <div className="bg-orange-500 text-white rounded-2xl px-8 py-5 shadow-lg shadow-orange-500/30">
                  <div className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-80">Total a invertir</div>
                  <div className="text-2xl font-black tracking-tight">${(currentPlanData.price + 70000).toLocaleString('es-CO')}</div>
                </div>
              </div>
            </div>

            <button
              onClick={() => onOpenWizard(selectedPlan)}
              className="bg-slate-900 text-white hover:bg-slate-800 px-10 py-5 rounded-2xl font-black text-lg transition-all shadow-xl hover:-translate-y-1 active:scale-95 flex items-center gap-3 shrink-0"
            >
              Continuar con Reserva
              <ArrowRight size={22} strokeWidth={3} />
            </button>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
