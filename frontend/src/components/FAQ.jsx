import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, MessageCircle, Search, Package, CreditCard, MapPin, ChefHat, Info } from 'lucide-react';

const faqs = [
  { 
    category: 'Funcionamiento',
    icon: Package,
    q: '¿Cómo funciona el sistema de intercambio de cocas?', 
    a: <>Las "cocas" son envases reutilizables que te entregamos con tu almuerzo. Cuando recibes la coca llena para el día siguiente, entregas la del día anterior limpia y seca. Son <strong className="text-gray-900 font-black">dos juegos en rotación</strong> para que siempre tengas uno disponible.</> 
  },
  { 
    category: 'Funcionamiento',
    icon: Info,
    q: '¿Qué pasa si un día no necesito el servicio?', 
    a: <>No se hacen ajustes ni reembolsos por días no utilizados. El plan se contrata por adelantado y <strong className="text-gray-900 font-black">no se puede pausar</strong>. Si sabes que no necesitarás el servicio ciertos días, te recomendamos el plan semanal.</> 
  },
  { 
    category: 'Funcionamiento',
    icon: Info,
    q: '¿Cómo funcionan las entregas los días festivos?', 
    a: <>No realizamos entregas los días festivos. Esos días no se descuentan de tu plan contratado; tu servicio simplemente <strong className="text-gray-900 font-black">se extenderá</strong> para compensar los días festivos en los que no hubo entrega.</> 
  },
  { 
    category: 'Menú',
    icon: ChefHat,
    q: '¿Puedo elegir el menú cada día?', 
    a: <>El menú es rotativo y fijo para todos. Cada miércoles compartimos el menú de la siguiente semana en el grupo de WhatsApp. Solo aceptamos <strong className="text-gray-900 font-black">restricciones principales</strong> (no cerdo, no pollo) pero no personalizaciones específicas como "sin cilantro".</> 
  },
  { 
    category: 'Entregas',
    icon: MapPin,
    q: '¿A qué hora llega el domiciliario?', 
    a: <>El domiciliario te llama <strong className="text-gray-900 font-black">5 minutos antes de llegar</strong>. El horario de entrega es durante la jornada laboral (generalmente entre 11:30am y 1:30pm). El encuentro es en la calle, no subimos a apartamentos u oficinas.</> 
  },
  { 
    category: 'Menú',
    icon: ChefHat,
    q: '¿Qué incluye cada almuerzo?', 
    a: <>Cada almuerzo incluye sopa, seco (arroz, proteína y ensalada) y jugo natural. Las proteínas rotan: <strong className="text-gray-900 font-black">3 días cerdo, 1 día res, 1 día pollo</strong> semanalmente.</> 
  },
  { 
    category: 'Pagos',
    icon: CreditCard,
    q: '¿Cómo hago el pago?', 
    a: <>Después de registrarte, te enviamos por WhatsApp los datos para transferencia (Nequi, Bancolombia, Daviplata). Envías el comprobante y validamos tu pago. Para iniciar necesitas pagar el plan + las cocas (<strong className="text-gray-900 font-black">total $145.000 para plan quincenal</strong>). Las renovaciones solo incluyen el plan.</> 
  }
];

const categories = ['Todas', 'Funcionamiento', 'Pagos', 'Entregas', 'Menú'];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todas');

  const normalize = (str) => {
    return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  };

  const getRoot = (word) => {
    let w = normalize(word);
    if (w.endsWith('es') && w.length > 4) return w.slice(0, -2);
    if (w.endsWith('s') && w.length > 3) return w.slice(0, -1);
    return w;
  };

  const getText = (node) => {
    if (typeof node === 'string') return node;
    if (Array.isArray(node)) return node.map(getText).join('');
    if (node && node.props && node.props.children) return getText(node.props.children);
    return '';
  };

  const highlightMatch = (text) => {
    if (!searchQuery.trim()) return text;
    const words = searchQuery.split(' ').filter(w => w.trim() !== '');
    const regex = new RegExp(`(${words.join('|')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) => 
      regex.test(part) ? <mark key={i} className="bg-orange-200 text-orange-900 px-1 rounded-sm font-black">{part}</mark> : part
    );
  };

  const filteredFaqs = faqs.filter(faq => {
    // Filter by category
    if (activeCategory !== 'Todas' && faq.category !== activeCategory) return false;

    // Filter by search query
    if (!searchQuery.trim()) return true;
    const queryWords = searchQuery.split(' ').filter(w => w.trim() !== '');
    const searchRoots = queryWords.map(getRoot);
    const textToSearch = normalize(faq.q + ' ' + getText(faq.a));
    
    return searchRoots.every(root => textToSearch.includes(root));
  });

  return (
    <section id="faq" className="py-24 bg-white">
      <div className="max-w-3xl mx-auto px-6">

        <div className="text-center mb-16">
          <h2 className="text-4xl font-black mb-4 tracking-tight">Preguntas Frecuentes</h2>
          <p className="text-lg text-gray-500 font-medium mb-8">Todo lo que necesitas saber antes de reservar</p>
          
          {/* Búsqueda Inteligente */}
          <div className="max-w-xl mx-auto relative mb-8">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="text-gray-400" size={20} />
            </div>
            <input
              type="text"
              placeholder="Ej. ¿A qué hora llega el almuerzo?, pagos, cocas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all font-medium text-gray-700 placeholder:text-gray-400"
            />
          </div>

          {/* Categorías (Tabs) */}
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => {
                  setActiveCategory(cat);
                  setOpenIndex(null);
                }}
                className={`px-5 py-2 rounded-full text-sm font-black transition-all ${
                  activeCategory === cat 
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' 
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq, i) => (
              <div key={i} className={`border rounded-2xl overflow-hidden transition-all duration-300 ${openIndex === i ? 'border-orange-200 shadow-md bg-orange-50/30' : 'border-gray-100 shadow-sm bg-white'}`}>
                <button
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50/50 transition-colors"
                >
                  <div className="flex items-center gap-4 pr-8">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${openIndex === i ? 'bg-orange-100 text-orange-600' : 'bg-gray-50 text-gray-400'}`}>
                      <faq.icon size={20} strokeWidth={2.5} />
                    </div>
                    <span className="font-bold text-gray-800 text-lg">{highlightMatch(faq.q)}</span>
                  </div>
                  <ChevronDown
                    className={`text-orange-500 shrink-0 transition-transform duration-300 ${openIndex === i ? 'rotate-180' : ''}`}
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
                      <div className="px-6 pb-6 pt-2 pl-[88px] text-gray-600 leading-relaxed font-medium">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))
          ) : (
            <div className="text-center py-16 bg-gray-50 rounded-3xl border border-gray-100">
              <MessageCircle className="mx-auto text-gray-300 mb-4" size={48} strokeWidth={1.5} />
              <p className="text-gray-500 font-medium mb-6">No encontramos respuestas para "{searchQuery}" en esta categoría.</p>
              <a
                href="https://wa.me/573116437887"
                target="_blank"
                className="inline-flex items-center gap-2 bg-white border border-gray-200 text-orange-600 hover:border-orange-500 px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-sm no-underline"
              >
                Pregúntanos por WhatsApp
              </a>
            </div>
          )}
        </div>

        {/* CTA Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
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
