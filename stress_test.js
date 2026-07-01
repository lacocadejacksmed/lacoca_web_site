import http from 'k6/http';
import { check, sleep } from 'k6';

// Configuración de la prueba de estrés
export const options = {
  // Simulamos una rampa gradual de usuarios para ver cómo se comporta el servidor
  stages: [
    { duration: '2m', target: 1500 }, // Sube poco a poco a 1500 usuarios simultáneos en 2 min
    { duration: '5m', target: 1500 }, // Mantiene los 1500 usuarios estables por 5 minutos
    { duration: '1m', target: 0 },    // Baja gradualmente a 0 usuarios
  ],
  thresholds: {
    // Definimos criterios de éxito: el 95% de las peticiones deben tardar menos de 800ms
    http_req_duration: ['p(95)<800'],
    // Permitimos hasta un 55% de error porque la mitad de nuestras peticiones (POST) devuelven intencionalmente 400
    http_req_failed: ['rate<=0.55'], 
  }
};

export default function () {
  // 1. Simular carga inicial de la página (Frontend pide los planes)
  const resPlanes = http.get('https://lacocadejacks.onrender.com/api/planes');
  
  check(resPlanes, {
    '✅ Planes cargaron exitosamente (status 200)': (r) => r.status === 200,
    '⚡ Tiempo de respuesta < 500ms': (r) => r.timings.duration < 500,
  });

  // Simulamos que el usuario está leyendo la página y llenando el formulario (2 a 4 segundos)
  sleep(Math.random() * 2 + 2);

  // 2. Simular un envío de formulario rechazado
  // NOTA: Para NO llenar tu base de datos con basura, enviamos un "plan" inexistente.
  // Esto obliga al backend a hacer las primeras validaciones, leer PostgreSQL, pero 
  // frenar justo antes de hacer INSERTs (evita spam de clientes y suscripciones falsas).
  const formData = {
    nombre: 'Usuario Stress Test',
    cedula: '0000000000',
    email: 'test@stresstest.com',
    celular: '3000000000',
    plan: 'PlanInexistenteParaForzarError', // Forzará error 400
    delivery_type: 'Fija',
    fecha_inicio: '2027-01-01'
  };

  const resOrder = http.post('https://lacocadejacks.onrender.com/api/orders', JSON.stringify(formData), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  check(resOrder, {
    '✅ Rechazo manejado correctamente (status 400)': (r) => r.status === 400,
  });

  sleep(1);
}
