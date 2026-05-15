import React from 'react';
import { ExternalLink, Smartphone, Globe, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const BANK_DATA = {
  bancolombia: {
    name: 'Bancolombia',
    color: 'bg-[#FDDA24]',
    textColor: 'text-black',
    mobileScheme: 'bancolombia://',
    androidIntent: 'intent://#Intent;scheme=bancolombia;package=co.com.bancolombia.personas.superapp;end',
    webUrl: 'https://www.bancolombia.com/personas/sucursal-virtual-personas',
    playStore: 'https://play.google.com/store/apps/details?id=co.com.bancolombia.personas.superapp',
    appStore: 'https://apps.apple.com/co/app/bancolombia-personas/id561311135'
  },
  nequi: {
    name: 'Nequi',
    color: 'bg-[#7000FF]',
    textColor: 'text-white',
    mobileScheme: 'nequi://',
    webUrl: 'https://recarga.nequi.com.co',
    playStore: 'https://play.google.com/store/apps/details?id=com.nequi.MobileApp',
    appStore: 'https://apps.apple.com/co/app/nequi-colombia/id1043064744'
  },
  daviplata: {
    name: 'Daviplata',
    color: 'bg-[#E30613]',
    textColor: 'text-white',
    mobileScheme: 'daviplata://',
    webUrl: 'https://www.daviplata.com',
    playStore: 'https://play.google.com/store/apps/details?id=com.domisistemas.daviplata',
    appStore: 'https://apps.apple.com/co/app/daviplata/id892803273'
  }
};

const BankRedirect = ({ bankId, className = "" }) => {
  const bank = BANK_DATA[bankId];

  if (!bank) return null;

  const handleRedirect = () => {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (isMobile) {
      // Intentar abrir la app
      window.location.href = bank.mobileScheme;

      // Fallback si no abre en 2 segundos
      setTimeout(() => {
        if (confirm("¿No tienes la aplicación instalada? Pulsa OK para ir a la tienda de aplicaciones o Cancelar para usar la web.")) {
          const isAndroid = /Android/i.test(navigator.userAgent);
          window.location.href = isAndroid ? bank.playStore : bank.appStore;
        } else {
          window.open(bank.webUrl, '_blank');
        }
      }, 2500);
    } else {
      // Desktop: abrir web oficial
      window.open(bank.webUrl, '_blank');
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleRedirect}
      className={`w-full flex items-center justify-between p-4 rounded-2xl shadow-lg transition-all ${bank.color} ${bank.textColor} ${className}`}
    >
      <div className="flex items-center gap-3">
        <div className="bg-white/20 p-2 rounded-xl">
          {/Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ? (
            <Smartphone size={20} />
          ) : (
            <Globe size={20} />
          )}
        </div>
        <div className="text-left">
          <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Abrir App Oficial</p>
          <p className="text-sm font-black">{bank.name}</p>
        </div>
      </div>
      <ArrowRight size={20} strokeWidth={3} />
    </motion.button>
  );
};

export default BankRedirect;
