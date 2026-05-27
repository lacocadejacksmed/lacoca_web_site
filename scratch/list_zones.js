const fs = require('fs');

function listZones() {
  const data = JSON.parse(fs.readFileSync('backend/data/cobertura.json', 'utf8'));
  data.features.forEach((f, i) => {
    const name = f.properties.nombre || f.properties.name;
    if (!name) {
      console.log(`Zone index ${i} is missing a name! Properties:`, JSON.stringify(f.properties));
    }
  });
}

listZones();
