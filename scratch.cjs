const fs = require('fs');
const cobertura = JSON.parse(fs.readFileSync('./backend/data/cobertura.json', 'utf8'));
const norte1 = cobertura.features.find(f => f.properties.name === "Norte 1" || f.properties.nombre === "Norte 1");
if (norte1) {
  const coords = norte1.geometry.coordinates[0];
  let minLng = 100, maxLng = -100, minLat = 100, maxLat = -100;
  coords.forEach(c => {
    if (c[0] < minLng) minLng = c[0];
    if (c[0] > maxLng) maxLng = c[0];
    if (c[1] < minLat) minLat = c[1];
    if (c[1] > maxLat) maxLat = c[1];
  });
  console.log(`Norte 1 Bounding Box: Lng(${minLng} to ${maxLng}), Lat(${minLat} to ${maxLat})`);
}
