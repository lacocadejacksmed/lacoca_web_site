import fs from 'fs';
import * as turf from '@turf/turf';

const cobertura = JSON.parse(fs.readFileSync('../backend/data/cobertura.json', 'utf8'));
const pt = turf.point([-75.560612, 6.271164]); 
let found = null;
cobertura.features.forEach(f => {
  if (turf.booleanPointInPolygon(pt, f)) {
    found = f.properties.name || f.properties.nombre;
  }
});
console.log("Point is in zone:", found);
