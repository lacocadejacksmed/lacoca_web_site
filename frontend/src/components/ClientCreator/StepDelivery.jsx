import React, { useState } from 'react';
import { Check, CheckCircle2, AlertCircle, Globe, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { useCoverage } from '../../hooks/useCoverage';

function LocationMarker({ position, setPosition, onCoordsSelected }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
      onCoordsSelected(e.latlng.lat, e.latlng.lng);
    },
  });
  return position === null ? null : <Marker position={position}></Marker>;
}

export default function StepDelivery({ register, errors, watch, setValue }) {
  const { checkCoverageByAddress, checkCoverageByCoords } = useCoverage();
  
  const [coverage1, setCoverage1] = useState({ status: 'pending', zone: null });
  const [coverage2, setCoverage2] = useState({ status: 'pending', zone: null });
  const [showMap1, setShowMap1] = useState(false);
  const [mapPos1, setMapPos1] = useState(null);
  const [showMap2, setShowMap2] = useState(false);
  const [mapPos2, setMapPos2] = useState(null);

  const daysOfWeek = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

  const tipoEntrega = watch('tipoEntrega');
  const direccion1 = watch('direccion');
  const barrio1 = watch('barrio');
  const days1 = watch('days_address_1') || '';
  const direccion2 = watch('direccion2');
  const barrio2 = watch('barrio2');
  const days2 = watch('days_address_2') || '';

  const isFieldValid = (fieldName) => !errors[fieldName] && watch(fieldName)?.length > 0;

  const toggleDay = (day) => {
    let currentDays = days1 ? days1.split(',') : [];
    if (currentDays.includes(day)) {
      currentDays = currentDays.filter(d => d !== day);
    } else {
      currentDays.push(day);
    }
    const d1 = daysOfWeek.filter(d => currentDays.includes(d)).join(',');
    const d2 = daysOfWeek.filter(d => !currentDays.includes(d)).join(',');
    setValue('days_address_1', d1);
    setValue('days_address_2', d2);
  };

  const handleBlurAddress = async (num) => {
    const dir = num === 1 ? direccion1 : direccion2;
    const bar = num === 1 ? barrio1 : barrio2;
    const setCoverage = num === 1 ? setCoverage1 : setCoverage2;

    if (!dir || !bar) return;
    setCoverage({ status: 'loading', zone: null });
    
    const result = await checkCoverageByAddress(dir, bar);
    setCoverage({ status: result.status, zone: result.zone });
    
    if (result.zone) {
      setValue(`zona_${num}`, result.zone);
      setValue(`lat_${num}`, result.lat);
      setValue(`lng_${num}`, result.lng);
    }
  };

  const handleCoordsSelected = (lat, lng, num) => {
    const setCoverage = num === 1 ? setCoverage1 : setCoverage2;
    setCoverage({ status: 'loading', zone: null });
    
    const result = checkCoverageByCoords(lat, lng);
    setCoverage({ status: result.status, zone: result.zone });
    
    if (result.zone) {
      setValue(`zona_${num}`, result.zone);
      setValue(`lat_${num}`, result.lat);
      setValue(`lng_${num}`, result.lng);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row gap-3">
        <button 
          type="button"
          onClick={() => setValue('tipoEntrega', 'fija')}
          className={`flex-1 p-5 rounded-[28px] border-2 transition-all text-left relative overflow-hidden ${
            tipoEntrega === 'fija' ? 'border-orange-500 bg-orange-50/50 shadow-sm' : 'border-gray-100 hover:border-gray-200'
          }`}
        >
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-3 ${tipoEntrega === 'fija' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
            <Check size={16} strokeWidth={3} />
          </div>
          <div className="text-sm font-black text-slate-900">Punto Fijo</div>
          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Oficina o Casa</div>
        </button>
        <button 
          type="button"
          onClick={() => setValue('tipoEntrega', 'hibrida')}
          className={`flex-1 p-5 rounded-[28px] border-2 transition-all text-left relative overflow-hidden ${
            tipoEntrega === 'hibrida' ? 'border-blue-500 bg-blue-50/50 shadow-sm' : 'border-gray-100 hover:border-gray-200'
          }`}
        >
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-3 ${tipoEntrega === 'hibrida' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
            <Check size={16} strokeWidth={3} />
          </div>
          <div className="text-sm font-black text-slate-900">Híbrida</div>
          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Dos Lugares</div>
        </button>
      </div>

      {tipoEntrega === 'hibrida' && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 bg-blue-600 rounded-3xl text-white shadow-xl shadow-blue-200"
        >
           <div className="text-xs font-black uppercase mb-1 flex items-center gap-2">
             ✨ Modo Híbrido Activado
           </div>
           <p className="text-[10px] font-bold text-blue-100 leading-tight">
             Podrás repartir los días entre dos lugares.
           </p>
        </motion.div>
      )}

      {/* Dirección 1 */}
      <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-4">
        <h5 className="text-xs font-black uppercase text-slate-900 tracking-widest flex items-center gap-1.5">
          {tipoEntrega === 'hibrida' ? 'Dirección 1' : 'Dirección de Entrega'}
          {isFieldValid('direccion') && isFieldValid('barrio') ? (
            <CheckCircle2 size={12} className="text-green-500 animate-in zoom-in" />
          ) : (
            <AlertCircle size={10} className="text-orange-500" />
          )}
        </h5>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input 
            {...register('direccion', { onBlur: () => handleBlurAddress(1) })}
            className={`bg-white border-none rounded-xl px-4 py-3 text-sm font-medium text-slate-900 transition-all ${
              errors.direccion ? 'ring-2 ring-orange-500 bg-orange-50/50 shadow-inner' : 'focus:ring-2 focus:ring-orange-500'
            }`}
            placeholder="Dirección"
          />
          <input 
            {...register('barrio', { onBlur: () => handleBlurAddress(1) })}
            className={`bg-white border-none rounded-xl px-4 py-3 text-sm font-medium text-slate-900 transition-all ${
              errors.barrio ? 'ring-2 ring-orange-500 bg-orange-50/50 shadow-inner' : 'focus:ring-2 focus:ring-orange-500'
            }`}
            placeholder="Barrio"
          />
        </div>
        
        {/* Coverage Badge 1 */}
        <div className="mt-2 flex flex-col gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            {coverage1.status === 'loading' && <div className="text-[10px] font-bold text-blue-500 animate-pulse flex items-center gap-1"><Globe size={12} className="animate-spin" /> Verificando cobertura...</div>}
            {coverage1.status === 'ok' && (
              <div className="text-[10px] font-black text-green-600 bg-green-50 px-3 py-1.5 rounded-full border border-green-100 inline-flex items-center gap-1.5 shadow-sm">
                <Check size={12} strokeWidth={4} /> COBERTURA: {coverage1.zone}
              </div>
            )}
            {coverage1.status === 'no_coverage' && (
              <div className="text-[10px] font-black text-red-600 bg-red-50 px-3 py-1.5 rounded-full border border-red-100 inline-flex items-center gap-1.5 shadow-sm">
                <AlertCircle size={12} /> ⚠️ FUERA DE COBERTURA
              </div>
            )}
            
            {['ok', 'not_found', 'api_error', 'no_coverage'].includes(coverage1.status) && !showMap1 && (
              <button 
                type="button"
                onClick={() => setShowMap1(true)}
                className="text-[10px] bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold px-3 py-1.5 rounded-full flex items-center gap-1 shadow-sm transition-colors"
              >
                <MapPin size={12} className="text-orange-500" /> {coverage1.status === 'ok' ? 'Ajustar Pin en Mapa' : 'Ubicar en el Mapa'}
              </button>
            )}
          </div>
          
          {showMap1 && (
            <div className="mt-2 rounded-xl overflow-hidden border-2 border-orange-500 shadow-lg relative h-[250px] z-0">
              <div className="absolute top-2 left-2 right-2 bg-white/90 backdrop-blur-md z-[400] text-center text-[10px] font-black text-slate-800 py-2 px-3 rounded-lg shadow-sm border border-slate-200">
                Haz clic en el mapa para colocar el Pin en la dirección exacta
              </div>
              <MapContainer center={[6.2442, -75.5812]} zoom={12} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <LocationMarker position={mapPos1} setPosition={setMapPos1} onCoordsSelected={(lat, lng) => handleCoordsSelected(lat, lng, 1)} />
              </MapContainer>
            </div>
          )}
        </div>
        {tipoEntrega === 'hibrida' && (
          <div className="flex flex-wrap gap-2 pt-2">
            {daysOfWeek.map(d => (
              <button 
                key={d}
                type="button"
                onClick={() => toggleDay(d)}
                className={`px-3 py-1.5 rounded-full text-[10px] font-black transition-all ${
                  days1.includes(d) ? 'bg-orange-500 text-white' : 'bg-white text-gray-400 border border-gray-100'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Dirección 2 */}
      {tipoEntrega === 'hibrida' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-4"
        >
          <h5 className="text-xs font-black uppercase text-slate-900 tracking-widest flex items-center gap-1.5">
            Dirección 2
            {isFieldValid('direccion2') && isFieldValid('barrio2') ? (
              <CheckCircle2 size={12} className="text-green-500 animate-in zoom-in" />
            ) : (
              <AlertCircle size={10} className="text-orange-500" />
            )}
          </h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input 
              {...register('direccion2', { onBlur: () => handleBlurAddress(2) })}
              className={`bg-white border-none rounded-xl px-4 py-3 text-sm font-medium text-slate-900 transition-all ${
                errors.direccion2 ? 'ring-2 ring-orange-500 bg-orange-50/50 shadow-inner' : 'focus:ring-2 focus:ring-orange-500'
              }`}
              placeholder="Dirección"
            />
            <input 
              {...register('barrio2', { onBlur: () => handleBlurAddress(2) })}
              className={`bg-white border-none rounded-xl px-4 py-3 text-sm font-medium text-slate-900 transition-all ${
                errors.barrio2 ? 'ring-2 ring-orange-500 bg-orange-50/50 shadow-inner' : 'focus:ring-2 focus:ring-orange-500'
              }`}
              placeholder="Barrio"
            />
          </div>
          
          {/* Coverage Badge 2 */}
          <div className="mt-2 min-h-[24px] flex flex-col gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              {coverage2.status === 'loading' && <div className="text-[10px] font-bold text-blue-500 animate-pulse flex items-center gap-1"><Globe size={12} className="animate-spin" /> Verificando cobertura...</div>}
              {coverage2.status === 'ok' && (
                <div className="text-[10px] font-black text-green-600 bg-green-50 px-3 py-1.5 rounded-full border border-green-100 inline-flex items-center gap-1.5 shadow-sm">
                  <Check size={12} strokeWidth={4} /> COBERTURA: {coverage2.zone}
                </div>
              )}
              {coverage2.status === 'no_coverage' && (
                <div className="text-[10px] font-black text-red-600 bg-red-50 px-3 py-1.5 rounded-full border border-red-100 inline-flex items-center gap-1.5 shadow-sm">
                  <AlertCircle size={12} /> ⚠️ FUERA DE COBERTURA
                </div>
              )}

              {['ok', 'not_found', 'api_error', 'no_coverage'].includes(coverage2.status) && !showMap2 && (
                <button 
                  type="button"
                  onClick={() => setShowMap2(true)}
                  className="text-[10px] bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold px-3 py-1.5 rounded-full flex items-center gap-1 shadow-sm transition-colors"
                >
                  <MapPin size={12} className="text-orange-500" /> {coverage2.status === 'ok' ? 'Ajustar Pin en Mapa' : 'Ubicar en el Mapa'}
                </button>
              )}
            </div>

            {showMap2 && (
              <div className="mt-2 rounded-xl overflow-hidden border-2 border-orange-500 shadow-lg relative h-[250px] z-0">
                <div className="absolute top-2 left-2 right-2 bg-white/90 backdrop-blur-md z-[400] text-center text-[10px] font-black text-slate-800 py-2 px-3 rounded-lg shadow-sm border border-slate-200">
                  Haz clic en el mapa para colocar el Pin en la dirección exacta
                </div>
                <MapContainer center={[6.2442, -75.5812]} zoom={12} style={{ height: '100%', width: '100%' }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <LocationMarker position={mapPos2} setPosition={setMapPos2} onCoordsSelected={(lat, lng) => handleCoordsSelected(lat, lng, 2)} />
                </MapContainer>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2 pt-2 opacity-60">
            {days2.split(',').map(d => d && (
              <span key={d} className="px-3 py-1.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-700">
                {d}
              </span>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
