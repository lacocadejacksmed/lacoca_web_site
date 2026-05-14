import { useState, useEffect } from 'react';
import { Menu, X, LogOut } from 'lucide-react';
// El logo se carga directamente desde la carpeta pública en el JSX

export default function Navbar({ onOpenWizard }) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 60);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 px-6 py-4 flex justify-between items-center ${
        isScrolled ? 'bg-orange-600/90 backdrop-blur-md shadow-lg py-3' : 'bg-transparent'
      }`}
    >
      <a href="#" className="flex items-center gap-4 no-underline group">
        <div className="relative">
          <img 
            src="/logoLaCoca.svg" 
            alt="La Coca de Jacks" 
            className="h-16 w-16 object-contain rounded-full border-2 border-white shadow-xl group-hover:scale-110 transition-transform duration-500" 
          />
          <div className="absolute -inset-2 bg-white/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </div>
        <div className="flex flex-col -space-y-1">
          <span className="text-white font-black text-2xl tracking-tighter leading-none" style={{ fontFamily: 'Outfit, sans-serif' }}>
            La Coca
          </span>
          <span className="text-orange-100 font-bold text-sm uppercase tracking-[0.2em] leading-none opacity-80">
            de Jacks
          </span>
        </div>
      </a>
      
      <div className="flex items-center gap-4">
        <div className="hidden md:flex items-center gap-6 mr-4">
          <a href="#menu" className="text-white font-medium text-sm hover:text-orange-200 transition-colors no-underline">Menú</a>
          <a href="#planes" className="text-white font-medium text-sm hover:text-orange-200 transition-colors no-underline">Planes</a>
          <a href="#beneficios" className="text-white font-medium text-sm hover:text-orange-200 transition-colors no-underline">Beneficios</a>
        </div>
        
        {localStorage.getItem('token') ? (
          <div className="flex items-center gap-3">
            <a 
              href={JSON.parse(localStorage.getItem('usuario') || '{}').rol === 'admin' ? '/admin' : '/dashboard'}
              className="text-white font-black text-xs uppercase tracking-widest no-underline hover:text-orange-200"
            >
              Panel
            </a>
            <button 
              onClick={() => { localStorage.clear(); window.location.reload(); }}
              className="p-2 text-white/60 hover:text-white transition-colors"
              title="Cerrar Sesión"
            >
              <LogOut size={18} />
            </button>
          </div>
        ) : (
          <a 
            href="/login" 
            className="text-white font-black text-xs uppercase tracking-widest no-underline hover:text-orange-200 border-b-2 border-transparent hover:border-white pb-1 transition-all"
          >
            Ingresar
          </a>
        )}

        <button 
          onClick={onOpenWizard}
          className="bg-white text-orange-600 hover:bg-orange-50 text-sm font-bold py-2.5 px-5 rounded-xl transition-all shadow-sm active:scale-95"
        >
          Reservar Cupo
        </button>
      </div>
    </nav>
  );
}
