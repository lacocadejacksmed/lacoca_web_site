import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, FeatureGroup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import 'leaflet-control-geocoder/dist/Control.Geocoder.css';
import 'leaflet-draw'; 
import 'leaflet-control-geocoder';
import api from '../services/api';
import Swal from 'sweetalert2';
import { 
  Save, RefreshCw, Trash2, Map as MapIcon, 
  List, Focus, AlertTriangle, Undo2
} from 'lucide-react';

// Fix for default marker icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const COLORS = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#06b6d4', '#f59e0b', '#ec4899', '#6366f1', '#14b8a6'];

function MapController({ featureGroupRef, onDataLoaded, refreshTrigger }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !featureGroupRef.current) return;

    // Load Geocoder
    const geocoder = L.Control.geocoder({
      defaultMarkGeocode: true,
      placeholder: "Buscar dirección...",
      errorMessage: "No encontrada"
    }).addTo(map);

    // Draw Controls
    const drawControl = new L.Control.Draw({
      edit: { featureGroup: featureGroupRef.current, remove: true },
      draw: {
        polygon: { allowIntersection: false, shapeOptions: { color: '#f97316', fillOpacity: 0.4 } },
        rectangle: { shapeOptions: { color: '#3b82f6', fillOpacity: 0.4 } },
        circle: false, polyline: false, marker: false, circlemarker: false
      }
    });
    map.addControl(drawControl);

    // Initial load
    onDataLoaded();

    const handleCreated = (e) => {
      const layer = e.layer;
      Swal.fire({
        title: 'Configurar Zona',
        html:
          '<input id="swal-input1" class="swal2-input" placeholder="Nombre de la Zona">' +
          '<input id="swal-input2" class="swal2-input" placeholder="Barrios clave (ej: poblado, lleras)">',
        focusConfirm: false,
        confirmButtonColor: '#f97316',
        showCancelButton: true,
        preConfirm: () => {
          return [
            document.getElementById('swal-input1').value,
            document.getElementById('swal-input2').value
          ]
        }
      }).then(({ value }) => {
        if (value) {
          const zoneName = value[0] || `Nueva Zona`;
          const keywords = value[1] || "";
          layer.options.zoneName = zoneName;
          layer.options.keywords = keywords;
          layer.bindPopup(`<strong>Zona:</strong> ${zoneName}<br><small>Barrios: ${keywords}</small>`);
          featureGroupRef.current.addLayer(layer);
          onDataLoaded(true); // Update list
        }
      });
    };

    map.on(L.Draw.Event.CREATED, handleCreated);
    map.on(L.Draw.Event.DELETED, () => onDataLoaded(true));
    map.on(L.Draw.Event.EDITED, () => onDataLoaded(true));

    return () => {
      map.removeControl(geocoder);
      map.removeControl(drawControl);
      map.off(L.Draw.Event.CREATED, handleCreated);
    };
  }, [map]);

  // Handle manual refreshes
  useEffect(() => {
    if (refreshTrigger > 0) onDataLoaded();
  }, [refreshTrigger]);

  return null;
}

export default function CoverageMap() {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const featureGroupRef = useRef(null);
  const mapRef = useRef(null);
  const center = [6.217, -75.567];

  const fetchCoverage = async (onlyList = false) => {
    if (!onlyList) setLoading(true);
    try {
      const res = await api.get('/admin/cobertura');
      const geojson = res.data;

      if (!onlyList && featureGroupRef.current) {
        featureGroupRef.current.clearLayers();
        L.geoJSON(geojson, {
          onEachFeature: (feature, layer) => {
            layer.options.zoneName = feature.properties.name;
            layer.options.color = feature.properties.color;
            layer.options.keywords = feature.properties.keywords || "";
            layer.bindPopup(`<strong>Zona:</strong> ${feature.properties.name}<br><small>Barrios: ${feature.properties.keywords || ""}</small>`);
            layer.setStyle({
              color: feature.properties.color || COLORS[0],
              fillOpacity: 0.25,
              weight: 3
            });
            layer.on('dblclick', async (e) => {
              L.DomEvent.stopPropagation(e);
              const { value } = await Swal.fire({
                title: 'Editar Zona',
                html:
                  `<input id="swal-edit1" class="swal2-input" placeholder="Nombre de la Zona" value="${layer.options.zoneName || ''}">` +
                  `<input id="swal-edit2" class="swal2-input" placeholder="Barrios clave (separados por coma)" value="${layer.options.keywords || ''}">`,
                focusConfirm: false,
                confirmButtonColor: '#f97316',
                showCancelButton: true,
                preConfirm: () => {
                  return [
                    document.getElementById('swal-edit1').value,
                    document.getElementById('swal-edit2').value
                  ]
                }
              });
              if (value) {
                layer.options.zoneName = value[0] || layer.options.zoneName;
                layer.options.keywords = value[1] || "";
                layer.bindPopup(`<strong>Zona:</strong> ${layer.options.zoneName}<br><small>Barrios: ${layer.options.keywords}</small>`).openPopup();
                fetchCoverage(true); // Update only sidebar
              }
            });
            featureGroupRef.current.addLayer(layer);
          }
        });
      }

      // Update Sidebar List
      if (featureGroupRef.current) {
        const layers = featureGroupRef.current.getLayers();
        setZones(layers.map(l => ({
          id: L.stamp(l),
          name: l.options.zoneName || "Sin nombre",
          color: l.options.color || COLORS[0],
          bounds: l.getBounds()
        })));
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (!onlyList) setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!featureGroupRef.current) return;
    const layers = featureGroupRef.current.getLayers();
    const features = layers.map((layer, i) => {
      const geojson = layer.toGeoJSON();
      geojson.properties.name = layer.options.zoneName || "Zona sin nombre";
      geojson.properties.keywords = layer.options.keywords || "";
      geojson.properties.color = layer.options.color || COLORS[i % COLORS.length];
      return geojson;
    });

    setSaving(true);
    try {
      await api.post('/admin/cobertura', { type: "FeatureCollection", features });
      Swal.fire({ icon: 'success', title: '¡Guardado!', toast: true, position: 'top-end', showConfirmButton: false, timer: 2000 });
      fetchCoverage();
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Error al guardar' });
    } finally {
      setSaving(false);
    }
  };

  const focusZone = (zone) => {
    if (mapRef.current) {
      mapRef.current.fitBounds(zone.bounds, { padding: [50, 50] });
      const layers = featureGroupRef.current.getLayers();
      const layer = layers.find(l => L.stamp(l) === zone.id);
      if (layer) layer.openPopup();
    }
  };

  const deleteZone = (id) => {
    const layer = featureGroupRef.current.getLayers().find(l => L.stamp(l) === id);
    if (layer) {
      featureGroupRef.current.removeLayer(layer);
      fetchCoverage(true);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-2 h-[800px]">
      <div className="w-full lg:w-80 flex flex-col gap-4">
        <div className="bg-slate-900 p-6 rounded-[32px] shadow-2xl flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-white font-black uppercase text-[10px] tracking-widest">Zonas Activas</h4>
            <button onClick={() => setRefreshTrigger(prev => prev + 1)} className="text-slate-500 hover:text-white transition-colors">
              <Undo2 size={16} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {zones.map(zone => (
              <div key={zone.id} className="group flex items-center gap-3 p-3 rounded-2xl bg-slate-800/40 border border-transparent hover:border-slate-700 transition-all">
                <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: zone.color }}></div>
                <button onClick={() => focusZone(zone)} className="flex-1 text-left text-xs font-black text-white truncate">{zone.name}</button>
                <button onClick={() => deleteZone(zone.id)} className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-500 transition-all"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-6 border-t border-slate-800">
            <button onClick={handleSave} disabled={saving} className="w-full bg-orange-600 hover:bg-orange-700 text-white py-4 rounded-2xl font-black text-xs uppercase transition-all flex items-center justify-center gap-2">
              {saving ? <RefreshCw className="animate-spin" size={14} /> : <Save size={14} />}
              Guardar Cambios
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 relative rounded-[40px] overflow-hidden shadow-2xl border-8 border-white bg-white">
        {loading && (
          <div className="absolute inset-0 z-[2000] bg-white/80 backdrop-blur flex items-center justify-center">
            <RefreshCw className="animate-spin text-orange-500" size={40} />
          </div>
        )}
        <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }} ref={mapRef}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <FeatureGroup ref={featureGroupRef}>
            <MapController 
              featureGroupRef={featureGroupRef} 
              onDataLoaded={fetchCoverage}
              refreshTrigger={refreshTrigger}
            />
          </FeatureGroup>
        </MapContainer>
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
        .leaflet-draw-toolbar a { background-color: #0f172a !important; color: white !important; }
      `}} />
    </div>
  );
}
