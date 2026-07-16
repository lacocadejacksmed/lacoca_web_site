import { useState, useEffect } from 'react';
import * as turf from '@turf/turf';
import axios from 'axios';
import api from '../services/api';

export const isBarrioCompatibleWithZone = (barrio, zoneFeature) => {
  if (!barrio || !zoneFeature) return true;
  
  const normalize = (text) => {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  };

  const cleanBarrio = normalize(barrio);
  const zoneName = normalize(zoneFeature.properties.name || zoneFeature.properties.nombre || "");
  const keywordsStr = zoneFeature.properties.keywords || "";
  
  let keywords = keywordsStr.split(',').map(normalize).filter(k => k);
  
  // Agregar el nombre de la zona como keyword por defecto
  if (zoneName && !keywords.includes(zoneName)) {
      keywords.push(zoneName);
  }
  
  const isMatch = keywords.some(kw => cleanBarrio.includes(kw));
  return isMatch;
};

export const validateAddressNumbers = (inputAddress, geocodedFeat) => {
  if (!inputAddress) return true;
  if (!geocodedFeat) return false;
  if (!geocodedFeat.address) {
    // En Colombia, Mapbox rara vez devuelve el campo 'address' exacto.
    // Confiamos en la coordenada de la calle devuelta.
    return true;
  }

  const hashIdx = inputAddress.indexOf('#');
  if (hashIdx === -1) return true;

  const afterHash = inputAddress.substring(hashIdx + 1);
  const inputNumbers = afterHash.match(/\d+/g) || [];
  const geocodedNumbers = geocodedFeat.address.match(/\d+/g) || [];

  if (inputNumbers.length >= 2 && geocodedNumbers.length < 2) {
    return false;
  }

  if (inputNumbers.length > 0 && geocodedNumbers.length > 0) {
    const inputCrossing = parseInt(inputNumbers[0], 10);
    const geocodedCrossing = parseInt(geocodedNumbers[0], 10);
    if (inputCrossing !== geocodedCrossing) {
      return false;
    }
  }

  return true;
};

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
    let zoneFeature = null;

    coberturaData.features.forEach(f => {
      if (turf.booleanPointInPolygon(pt, f)) {
        zoneFeature = f;
      }
    });
    return zoneFeature;
  };

  const checkCoverageByCoords = (lat, lng, barrio) => {
    const zoneFeature = verifyPointInPolygon(lat, lng);
    
    if (zoneFeature) {
      const zoneName = zoneFeature.properties.name || zoneFeature.properties.nombre;
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
        const firstFeat = res.data.features[0];
        if (!validateAddressNumbers(address, firstFeat)) {
          return { status: 'no_coverage', zone: null };
        }
        const [lng, lat] = firstFeat.center;
        const zoneFeature = verifyPointInPolygon(lat, lng);

        if (zoneFeature) {
          const zoneName = zoneFeature.properties.name || zoneFeature.properties.nombre;
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
