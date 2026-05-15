import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowLeft, Copy, Check, Download, ExternalLink, ShieldCheck, Info } from 'lucide-react';
import { useState } from 'react';
import Swal from 'sweetalert2';
import BankRedirect from './BankRedirect';

export default function PaymentInfo({ isOpen, onClose, onReturn }) {
  const [copiedId, setCopiedId] = useState(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [selectedQr, setSelectedQr] = useState(null);

  const paymentMethods = [
    {
      id: 'bancolombia',
      name: 'Bancolombia',
      icon: '/logoBancolombia.png',
      account: '238-000045-84',
      type: 'Ahorros',
      holder: 'Alejandro Gómez Mesa',
      qr: '/qr_bancolombia.png',
      appUrl: 'bancolombia://'
    }
  ];

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Copiado al portapapeles',
      showConfirmButton: false,
      timer: 1500
    });
  };

  const downloadQr = (url, name) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `QR_Jacks_${name}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-0 md:p-4 bg-slate-900/90 backdrop-blur-xl">
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white w-full max-w-5xl md:rounded-[48px] shadow-2xl relative flex flex-col h-full md:h-auto md:max-h-[90vh] overflow-hidden"
      >
        {/* Header Section */}
        <div className="p-8 md:p-12 pb-0 flex justify-between items-start">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
              <ShieldCheck size={14} /> Transacciones Seguras
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none mb-4">
              Métodos de <span className="text-orange-500">Pago</span>
            </h2>
            <p className="text-slate-500 font-medium text-sm md:text-base max-w-sm">
              Selecciona tu plataforma preferida y completa tu reserva de forma sencilla.
            </p>
          </div>
          <button onClick={onClose} className="p-3 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl transition-all hover:bg-slate-100">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 md:p-12 pt-8 custom-scrollbar">
          {/* Main Grid/List */}
          <div className="max-w-md mx-auto mb-12">
            {paymentMethods.map((method) => (
              <motion.div 
                key={method.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-[32px] border border-slate-100 p-6 flex flex-col group transition-all hover:border-orange-200 hover:shadow-xl relative"
              >
                <div className="flex justify-between items-start mb-8">
                  <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center p-2 border border-slate-100 shadow-inner group-hover:bg-white transition-colors">
                    <img src={method.icon} alt={method.name} className="w-full h-full object-contain" />
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{method.type}</span>
                    <h3 className="text-lg font-black text-slate-900">{method.name}</h3>
                  </div>
                </div>

                <div className="space-y-6 flex-1">
                  <div className="space-y-2">
                    <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Número de Cuenta</div>
                    <div className="flex items-center justify-between bg-slate-50 rounded-2xl p-4 border border-slate-100 group-hover:bg-white transition-all">
                      <span className="text-xl font-black text-slate-900 tracking-tight">{method.account}</span>
                      <button 
                        onClick={() => copyToClipboard(method.account, method.id)}
                        className={`p-2.5 rounded-xl transition-all shadow-sm ${
                          copiedId === method.id ? 'bg-green-500 text-white' : 'bg-white text-slate-400 hover:text-orange-500 hover:shadow-md'
                        }`}
                      >
                        {copiedId === method.id ? <Check size={16} strokeWidth={3} /> : <Copy size={16} strokeWidth={3} />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Titular</div>
                      <div className="text-sm font-black text-slate-700">{method.holder}</div>
                    </div>
                    <div 
                      onClick={() => {
                        setSelectedQr(method);
                        setIsQrModalOpen(true);
                      }}
                      className="relative w-16 h-16 bg-slate-50 rounded-xl border border-slate-100 p-2 cursor-pointer group/qr overflow-hidden"
                    >
                      <img src={method.qr} alt="QR" className="w-full h-full object-contain opacity-30 group-hover/qr:opacity-100 transition-opacity" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/qr:opacity-100 transition-all bg-slate-900/5 backdrop-blur-[1px]">
                        <ExternalLink size={12} className="text-orange-500" />
                      </div>
                    </div>
                  </div>
                </div>

                 <div className="mt-8 pt-6 border-t border-slate-50 flex flex-col gap-3">
                   <button 
                     onClick={() => downloadQr(method.qr, method.name)}
                     className="w-full py-3 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                   >
                     <Download size={14} strokeWidth={3} /> Guardar QR
                   </button>
                   <BankRedirect bankId={method.id} />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Footer Helper */}
          <div className="bg-slate-900 text-white rounded-[40px] p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
            <div className="flex gap-6 items-center relative">
               <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-orange-500 border border-white/10">
                  <Info size={32} />
               </div>
               <div className="max-w-md">
                  <h4 className="text-xl font-black mb-1">¿Listo para subir tu comprobante?</h4>
                  <p className="text-sm font-medium text-slate-400">Una vez realizada la transferencia, regresa al asistente para finalizar tu reserva.</p>
               </div>
            </div>
            <button 
              onClick={onReturn}
              className="w-full md:w-auto px-10 py-5 bg-orange-500 hover:bg-white hover:text-orange-600 text-white rounded-[24px] font-black shadow-2xl transition-all flex items-center justify-center gap-3 active:scale-95 group relative overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">
                <ArrowLeft size={20} strokeWidth={4} />
                Volver al Asistente
              </span>
            </button>
          </div>
        </div>

        {/* QR MODAL (Internal) */}
        <AnimatePresence>
           {isQrModalOpen && selectedQr && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-[300] flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-xl"
              >
                 <motion.div 
                   initial={{ scale: 0.9, y: 20 }}
                   animate={{ scale: 1, y: 0 }}
                   className="bg-white p-8 md:p-10 rounded-[48px] shadow-2xl max-w-sm w-full text-center relative"
                 >
                    <button 
                      onClick={() => setIsQrModalOpen(false)}
                      className="absolute -top-4 -right-4 bg-orange-500 text-white p-4 rounded-2xl shadow-xl hover:bg-orange-600 transition-colors"
                    >
                       <X size={24} strokeWidth={3} />
                    </button>

                    <div className="mb-8">
                       <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-full mb-4">
                          <img src={selectedQr.icon} alt="logo" className="h-5 w-5 object-contain" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">{selectedQr.name}</span>
                       </div>
                       <h3 className="text-2xl font-black text-slate-900 tracking-tight">Código QR</h3>
                       <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Escanea para pagar</p>
                    </div>

                    <div className="bg-slate-50 p-6 rounded-[40px] border border-slate-100 mb-8 shadow-inner">
                       <img src={selectedQr.qr} alt="QR Pago" className="w-full h-auto rounded-3xl" />
                    </div>

                    <button 
                      onClick={() => downloadQr(selectedQr.qr, selectedQr.name)}
                      className="w-full py-5 bg-slate-900 text-white rounded-3xl font-black flex items-center justify-center gap-3 hover:bg-orange-500 transition-all shadow-xl active:scale-95"
                    >
                       <Download size={20} strokeWidth={3} /> Guardar Imagen
                    </button>
                 </motion.div>
              </motion.div>
           )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
