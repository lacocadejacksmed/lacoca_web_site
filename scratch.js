const fs = require('fs');
const turf = require('@turf/turf');
const cobertura = JSON.parse(fs.readFileSync('./backend/data/cobertura.json', 'utf8'));
const pt = turf.point([-75.617478, 6.264771]); // Approx coordinate for Calle 50b # 94, Medellin
let found = null;
cobertura.features.forEach(f => {
  if (turf.booleanPointInPolygon(pt, f)) {
    found = f.properties.name || f.properties.nombre;
  }
});
console.log("Point is in zone:", found);
