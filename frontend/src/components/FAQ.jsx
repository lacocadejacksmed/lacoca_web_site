import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, MessageCircle } from 'lucide-react';

const faqs = [
  { q: '¿Cómo funciona el sistema de intercambio de cocas?', a: 'Las "cocas" son envases reutilizables que te entregamos con tu almuerzo. Cuando recibes la coca llena para el día siguiente, entregas la del día anterior limpia y seca. Son dos juegos en rotación para que siempre tengas uno disponible.' },
  { q: '¿Qué pasa si un día no necesito el servicio?', a: 'No se hacen ajustes ni reembolsos por días no utilizados. El plan se contrata por adelantado y no se puede pausar. Si sabes que no necesitarás el servicio ciertos días, te recomendamos el plan semanal.' },
  { q: '¿Puedo elegir el menú cada día?', a: 'El menú es rotativo y fijo para todos. Cada miércoles compartimos el menú de la siguiente semana en el grupo de WhatsApp. Solo aceptamos restricciones principales (no cerdo, no pollo) pero no personalizaciones específicas como "sin cilantro".' },
  { q: '¿A qué hora llega el domiciliario?', a: 'El domiciliario te llama 5 minutos antes de llegar. El horario de entrega es durante la jornada laboral (generalmente entre 11:30am y 1:30pm). El encuentro es en la calle, no subimos a apartamentos u oficinas.' },
  { q: '¿Qué incluye cada almuerzo?', a: 'Cada almuerzo incluye sopa, seco (arroz, proteína y ensalada) y jugo natural. Las proteínas rotan: 3 días cerdo, 1 día res, 1 día pollo semanalmente.' },
  { q: '¿Cómo hago el pago?', a: 'Después de registrarte, te enviamos por WhatsApp los datos para transferencia (Nequi, Bancolombia, Daviplata). Envías el comprobante y validamos tu pago. Para iniciar necesitas pagar el plan + las cocas (total $145.000). Las renovaciones solo incluyen el plan.' }
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <section id="faq" className="py-24 bg-white">
      <div className="max-w-3xl mx-auto px-6">
        
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black mb-4 tracking-tight">Preguntas Frecuentes</h2>
          <p className="text-lg text-gray-500 font-medium">Todo lo que necesitas saber antes de reservar</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
              <button 
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50/50 transition-colors"
              >
                <span className="font-bold text-gray-800 pr-8">{faq.q}</span>
                <ChevronDown 
                  className={`text-orange-500 transition-transform duration-300 ${openIndex === i ? 'rotate-180' : ''}`} 
                  size={20} 
                  strokeWidth={3}
                />
              </button>
              <AnimatePresence>
                {openIndex === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="px-6 pb-6 text-gray-600 leading-relaxed font-medium">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        {/* CTA Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="mt-16 bg-gradient-to-br from-orange-500 to-amber-500 text-white rounded-[32px] p-10 text-center shadow-2xl shadow-orange-500/20"
        >
          <h3 className="text-3xl font-black mb-4">¿Tienes más preguntas?</h3>
          <p className="text-orange-50 font-medium mb-8 max-w-md mx-auto leading-relaxed">
            Estamos aquí para ayudarte. Contáctanos por WhatsApp y te responderemos rápidamente.
          </p>
          <a 
            href="https://wa.me/573116437887" 
            target="_blank" 
            className="inline-flex items-center gap-3 bg-white text-orange-600 hover:bg-orange-50 px-10 py-4 rounded-2xl font-black text-lg transition-all shadow-xl hover:-translate-y-1 active:scale-95 no-underline"
          >
            <MessageCircle size={24} fill="currentColor" />
            Contactar por WhatsApp
          </a>
        </motion.div>

      </div>
    </section>
  );
}
