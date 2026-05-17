# 🚀 Guía de Desarrollo para Omar - La Coca de Jacks

¡Hola Omar! Esta guía fue creada especialmente para ti para que estemos 100% sincronizados en el desarrollo del proyecto, sepamos qué tecnologías estamos usando y evitemos conflictos molestos al subir código a Git. 

Aquí tienes todo lo que necesitas saber sobre la arquitectura actual, lo que puedes hacer libremente y lo que **no debes tocar** sin avisar para no romper el sistema de registro de clientes.

---

## 🗺️ 1. ¿Cómo funciona el Sistema Geográfico de Coberturas?

Hemos integrado un sistema de **cobertura ultra-preciso** para evitar que clientes fuera de zona reserven cupos:
1. **Zonas Geográficas:** Están definidas como polígonos GeoJSON en `backend/data/cobertura.json`.
2. **Validación Frontend:** Usamos `react-leaflet` para renderizar un mapa interactivo (Pin Drop) y `turf.js` (`booleanPointInPolygon`) para verificar si las coordenadas exactas de la dirección caen dentro de las zonas permitidas.
3. **Persistencia:** Al enviar el formulario de registro, se guardan en la base de datos las coordenadas exactas de entrega (`lat_1`, `lng_1`, `zona_1`, y para planes híbridos `lat_2`, `lng_2`, `zona_2`).

---

## 🟢 Tu Enfoque: Desarrollo de Frontend y UI/UX (¡Con total libertad!)

Como desarrollador enfocado en el **Frontend**, tienes total libertad para programar nuevas interfaces, mejorar la experiencia de usuario, optimizar componentes y refactorizar en las siguientes áreas:

* **Crear y Mejorar Componentes React:** Puedes programar nuevos componentes, añadir efectos visuales con Framer Motion, y perfeccionar el diseño y la interactividad.
* **Landing Page y Secciones:** Puedes editar, rediseñar y enriquecer el código de:
  * `frontend/src/pages/Landing2.jsx` (La página principal actual).
  * `frontend/src/components/Plans.jsx` (Planes de precios).
  * `frontend/src/components/FAQ.jsx` (Preguntas frecuentes).
  * `frontend/src/components/Navbar.jsx` (Barra de navegación).
* **Maquetación y Estilos (CSS):** Eres libre de estructurar y expandir los estilos en `frontend/src/index.css` (añadir variables HSL, fuentes, clases de utilidad, etc.).
* **Zonas de Cobertura e Información Dinámica:** Puedes probar y perfeccionar el flujo visual del mapa en el Admin. Si necesitas cambiar zonas físicamente, puedes hacerlo de forma interactiva en el panel (se guarda automáticamente en `backend/data/cobertura.json`).


---

## 🔴 Pautas de Seguridad e Integración (Por favor, consulta antes de modificar)

Para mantener la estabilidad del sistema de reservas y la seguridad de la información, por favor ten en cuenta estas pautas técnicas antes de programar cambios profundos:

1. **Coordinación en `RegistrationWizard.jsx` (Checkout):**
   * Este componente de frontend maneja un flujo complejo: geocodificación automática, el mapa interactivo de Leaflet para corregir coordenadas, y la validación matemática contra los límites GeoJSON mediante Turf.js. Si quieres proponer mejoras de UI o UX en esta sección, **¡escríbeme y lo programamos juntos en un bloque!**
2. **Uso del Wizard Modular:**
   * El botón "Reservar Cupo" de la Landing siempre debe invocar el componente modular `<RegistrationWizard isOpen={...} onClose={...} />`. Por favor, evita incrustar formularios de reserva manuales o alternativos dentro de `Landing2.jsx`, ya que omitirían las APIs geográficas de envío de coordenadas.
3. **Seguridad en las Rutas (`App.jsx`):**
   * La ruta `/admin` en `frontend/src/App.jsx` debe estar siempre protegida por el componente `<ProtectedRoute adminOnly={true}>` para evitar que usuarios no autorizados visualicen los paneles financieros y las bases de datos de clientes.
4. **Campos del Backend en el Payload de Órdenes:**
   * Al enviar el formulario final, el backend requiere estrictamente las claves `lat_1`, `lng_1` y `zona_1` (y sus contrapartes en modo híbrido) en el cuerpo del request (`backend/controllers/order.controller.js`) para poder registrar al cliente.


---

## 🐙 3. Buenas Prácticas de Git para Trabajar en Equipo

Para que nunca más volvamos a tener choques de código (`Merge Conflicts`):

1. **Pull Antes de Escribir:** Cada vez que vayas a empezar a programar en tu día, haz un `git pull origin main`. Así te aseguras de tener los últimos mapas y APIs actualizadas.
2. **Si hay Conflictos al hacer Push:**
   * **NUNCA** uses `--force` para empujar tus cambios.
   * Si chocamos en `Landing2.jsx`, ten en cuenta que la versión en el repositorio usa componentes modulares externos (Navbar, FAQ, Plans) para mantener el código limpio.
3. **Compilación de Prueba:** Antes de hacer commit, ejecuta siempre este comando en la raíz del proyecto para comprobar que no haya errores de TypeScript o React que tumben el servidor de producción:
   ```bash
   npm run build:full
   ```

---

¡Muchísimas gracias por tu apoyo Omar! Con estas pautas vamos a llevar **La Coca de Jacks** al siguiente nivel de forma súper rápida y profesional. Si tienes cualquier duda con Leaflet, Turf o las APIs del backend, ¡escríbeme de una! 🚀🥘
