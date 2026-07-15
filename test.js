const properties = { name: "Aranjuez" };
const nameKey = Object.keys(properties).find(k => k.trim().toLowerCase() === 'nombre' || k.trim().toLowerCase() === 'name');
console.log(nameKey);
console.log(properties[nameKey]);
