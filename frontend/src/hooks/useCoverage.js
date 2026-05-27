import { useState, useEffect } from 'react';
import * as turf from '@turf/turf';
import axios from 'axios';
import api from '../services/api';

export function useCoverage() {
  const [coberturaData, setCoberturaData] = useState({ type: 'FeatureCollection', features: [] });

  useEffect(() => {
    const fetchCobertura = async () => {
      try {
        const res = await api.get('/cobertura');
        if (res.data) setCoberturaData(res.data);
      } catch (err) {
        console.error("Error cargando zonas de cobertura:", err);
      }
    };
    fetchCobertura();
  }, []);

  const verifyPointInPolygon = (lat, lng) => {
    const pt = turf.point([lng, lat]);
    let zoneName = null;

    coberturaData.features.forEach(f => {
      if (turf.booleanPointInPolygon(pt, f)) {
        const nameKey = Object.keys(f.properties).find(k => k.trim().toLowerCase() === 'nombre' || k.trim().toLowerCase() === 'name');
        if (nameKey) zoneName = f.properties[nameKey];
      }
    });
    return zoneName;
  };

  const checkCoverageByCoords = (lat, lng) => {
    const zoneName = verifyPointInPolygon(lat, lng);
    
    if (zoneName) {
      return { status: 'ok', zone: zoneName, lat, lng };
    } else {
      return { status: 'no_coverage', zone: null, lat, lng };
    }
  };

  const checkCoverageByAddress = async (address, barrio) => {
    if (!address || address.length < 5) return { status: 'pending', zone: null };
    
    // Limpiar dirección de caracteres conflictivos (# y -)
    const cleanAddress = address.replace(/[#]/g, ' ').replace(/[-]/g, ' ');
    const query = `${cleanAddress}, ${barrio}, Antioquia, Colombia`;
    const apiKey = import.meta.env.VITE_MAPBOX_API_KEY;

    if (!apiKey) {
      console.error("Falta la API Key de Mapbox (VITE_MAPBOX_API_KEY)");
      return { status: 'api_error', zone: null };
    }

    try {
      const res = await axios.get(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`, {
        params: {
          access_token: apiKey,
          country: 'co',
          limit: 1,
          bbox: '-75.75,6.05,-75.45,6.45'
        }
      });

      if (res.data && res.data.features && res.data.features.length > 0) {
        const [lng, lat] = res.data.features[0].center;
        const zoneName = verifyPointInPolygon(lat, lng);

        if (zoneName) {
          return { status: 'ok', zone: zoneName, lat, lng };
        } else {
          return { status: 'no_coverage', zone: null, lat, lng };
        }
      } else {
        return { status: 'not_found', zone: null };
      }
    } catch (err) {
      console.error("Geocoding fatal error:", err);
      return { status: 'api_error', zone: null };
    }
  };

  return {
    checkCoverageByAddress,
    checkCoverageByCoords,
    coberturaData
  };
}
