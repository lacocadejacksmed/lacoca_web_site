import { useState, useEffect } from 'react';
import { Menu, X, LogOut, User, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar({ onOpenWizard, onMenuToggle }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const menuLinks = [
    { name: 'Menú', href: '#menu' },
    { name: 'Planes', href: '#planes' },
    { name: 'Beneficios', href: '#beneficios' },
    { name: 'Preguntas', href: '#faq' },
  ];

  const isLoggedIn = !!localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('usuario') || '{}');

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-[200] transition-all duration-500 ${isScrolled
          ? 'bg-orange-600/95 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.12)] py-3 px-4 md:px-8'
          : 'bg-transparent py-6 px-6 md:px-12'
          }`}
      >
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          {/* Brand Section */}
          <a href="/" className="flex items-center gap-3 no-underline group">
            {/* Image - Hidden on Mobile, visible from LG */}
            <div className="relative hidden lg:block">
              <img
                src="/logoLaCoca.svg"
                alt="Logo"
                className={`object-contain rounded-full border-2 border-white shadow-xl group-hover:scale-105 transition-all duration-500 ${isScrolled ? 'h-12 w-12' : 'h-16 w-16'
                  }`}
              />
              <div className="absolute -inset-1 bg-white/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
            {/* Title - Always visible */}
            <div className="flex flex-col">
              <span className={`font-bold leading-[0.7] tracking-tight transition-all ${isScrolled ? 'text-white text-xl' : 'text-slate-900 text-2xl md:text-3xl'}`} style={{ fontFamily: 'Fredoka, sans-serif' }}>
                La Coca
              </span>
              <span className={`self-end transition-all ${isScrolled ? 'text-orange-100 text-sm' : 'text-orange-500 text-xl md:text-2xl'}`} style={{ fontFamily: 'Alex Brush, cursive' }}>
                de Jacks
              </span>
            </div>
          </a>

          {/* Desktop Navigation */}
          <div className={`hidden lg:flex items-center gap-8 backdrop-blur-sm px-8 py-3 rounded-full border transition-all ${isScrolled ? 'bg-white/10 border-white/20' : 'bg-slate-900/5 border-slate-900/10'}`}>
            {menuLinks.map((link) => (
              link.href ? (
                <a key={link.name} href={link.href} className={`font-black text-[11px] uppercase tracking-widest transition-colors no-underline ${isScrolled ? 'text-white hover:text-orange-200' : 'text-slate-600 hover:text-orange-600'}`}>
                  {link.name}
                </a>
              ) : (
                <button key={link.name} onClick={link.onClick} className={`font-black text-[11px] uppercase tracking-widest transition-colors bg-transparent border-none cursor-pointer ${isScrolled ? 'text-white hover:text-orange-200' : 'text-slate-600 hover:text-orange-600'}`}>
                  {link.name}
                </button>
              )
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* Login / Panel Button - Visible on Mobile S, M, L */}
            <div className="flex items-center">
              {isLoggedIn ? (
                <div className="flex items-center gap-2">
                  <a
                    href={user.rol === 'admin' ? '/admin' : '/dashboard'}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all no-underline ${isScrolled ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-slate-900/5 hover:bg-slate-900/10 text-slate-700'}`}
                  >
                    <User size={16} />
                    <span className="hidden sm:inline text-[10px] font-black uppercase tracking-widest">Panel</span>
                  </a>
                  <button
                    onClick={() => { localStorage.clear(); window.location.reload(); }}
                    title="Cerrar Sesión"
                    className={`p-2.5 rounded-xl transition-all duration-300 hidden md:flex items-center justify-center border-none cursor-pointer ${isScrolled
                        ? 'bg-white/10 hover:bg-white/20 text-white/80 hover:text-white'
                        : 'bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-600 shadow-sm shadow-red-500/5'
                      }`}
                  >
                    <LogOut size={16} strokeWidth={2.5} />
                  </button>
                </div>
              ) : (
                <a
                  href="/login"
                  className="bg-orange-500 hover:bg-orange-400 text-white px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.15em] no-underline shadow-lg shadow-orange-900/20 active:scale-95 transition-all flex items-center gap-2"
                >
                  <User size={14} strokeWidth={3} />
                  Ingresar
                </a>
              )}
            </div>

            {/* CTA Reservar - Hidden on very small mobile, visible from M up */}
            <button
              onClick={onOpenWizard}
              className={`hidden sm:flex text-[10px] font-black uppercase tracking-widest py-3 px-6 rounded-full transition-all shadow-xl active:scale-95 border-none cursor-pointer ${isScrolled ? 'bg-white text-orange-600 hover:bg-orange-50' : 'bg-orange-500 text-white hover:bg-orange-600 shadow-orange-500/20'}`}
            >
              Reservar
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => {
                const newState = !isMenuOpen;
                setIsMenuOpen(newState);
                onMenuToggle?.(newState);
              }}
              className={`lg:hidden p-3 rounded-2xl transition-all border ${isScrolled ? 'bg-white/10 hover:bg-white/20 text-white border-white/20' : 'bg-slate-900/5 hover:bg-slate-900/10 text-slate-800 border-slate-900/10'}`}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[300] lg:hidden"
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md" onClick={() => {
              setIsMenuOpen(false);
              onMenuToggle?.(false);
            }} />

            {/* Content Card */}
            <div className="absolute right-0 top-0 bottom-0 w-[85%] max-w-sm bg-white shadow-2xl flex flex-col p-8 pt-20">
              {/* Close Button - Absolute for visibility */}
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  onMenuToggle?.(false);
                }}
                className="absolute top-6 right-6 p-3 bg-orange-500 text-white rounded-2xl shadow-lg hover:bg-orange-600 transition-all z-[350]"
              >
                <X size={24} strokeWidth={3} />
              </button>

              {/* Centered Logo Section */}
              <div className="flex flex-col items-center justify-center mb-12 text-center">
                <div className="relative mb-4">
                  <img src="/logoLaCoca.svg" alt="Logo" className="h-20 w-20 rounded-full border-4 border-orange-500 shadow-xl" />
                  <div className="absolute -bottom-1 -right-1 bg-green-500 w-5 h-5 rounded-full border-4 border-white"></div>
                </div>
                <div className="flex flex-col items-center">
                  <h3 className="text-3xl font-bold text-slate-900 leading-[0.7] tracking-tight" style={{ fontFamily: 'Fredoka, sans-serif' }}>La Coca</h3>
                  <span className="text-4xl text-orange-500 self-end" style={{ fontFamily: 'Alex Brush, cursive' }}>de Jacks</span>
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-4">Premium Food</p>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4 mb-4">Navegación</p>
                {menuLinks.map((link, idx) => (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    key={link.name}
                  >
                    {link.href ? (
                      <a
                        href={link.href}
                        onClick={() => {
                          setIsMenuOpen(false);
                          onMenuToggle?.(false);
                        }}
                        className="flex items-center justify-between p-4 rounded-2xl hover:bg-orange-50 group transition-all no-underline text-slate-700 hover:text-orange-600"
                      >
                        <span className="text-lg font-black tracking-tight">{link.name}</span>
                        <ChevronRight className="text-slate-300 group-hover:text-orange-400 group-hover:translate-x-1 transition-all" size={20} />
                      </a>
                    ) : (
                      <button
                        onClick={() => {
                          link.onClick();
                          setIsMenuOpen(false);
                          onMenuToggle?.(false);
                        }}
                        className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-orange-50 group transition-all no-underline text-slate-700 hover:text-orange-600 border-none bg-transparent text-left"
                      >
                        <span className="text-lg font-black tracking-tight">{link.name}</span>
                        <ChevronRight className="text-slate-300 group-hover:text-orange-400 group-hover:translate-x-1 transition-all" size={20} />
                      </button>
                    )}
                  </motion.div>
                ))}
              </div>

              <div className="mt-auto space-y-4">
                <button
                  onClick={() => {
                    onOpenWizard();
                    setIsMenuOpen(false);
                    onMenuToggle?.(false);
                  }}
                  className="w-full py-5 bg-orange-500 text-white rounded-3xl font-black text-sm uppercase tracking-widest shadow-xl shadow-orange-500/30 flex items-center justify-center gap-3 active:scale-95 transition-all"
                >
                  Reservar Ahora
                  <ChevronRight size={18} strokeWidth={3} />
                </button>

                {isLoggedIn && (
                  <button
                    onClick={() => { localStorage.clear(); window.location.reload(); }}
                    className="w-full py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-red-500 transition-colors flex items-center justify-center gap-2"
                  >
                    <LogOut size={16} /> Cerrar Sesión
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
