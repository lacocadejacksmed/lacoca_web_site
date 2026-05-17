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

## 🟢 Lo que SÍ puedes hacer (¡Con total libertad!)

Siente la total libertad de mejorar, cambiar estilos y refactorizar en las siguientes áreas:

* **Landing Page y Secciones:** Puedes editar y refinar todo el copy, imágenes, espaciados y animaciones en:
  * `frontend/src/pages/Landing2.jsx` (La página principal actual).
  * `frontend/src/components/Plans.jsx` (Planes de precios).
  * `frontend/src/components/FAQ.jsx` (Preguntas frecuentes).
  * `frontend/src/components/Navbar.jsx` (Barra de navegación).
* **Estilos (CSS):** Puedes añadir variables, clases personalizadas o modificar transiciones en `frontend/src/index.css` de manera segura.
* **Zonas de Cobertura en el Mapa:** Puedes agregar, editar o borrar los límites de cobertura directamente desde el **Panel de Administrador** en el mapa interactivo. El panel guarda automáticamente los cambios en `backend/data/cobertura.json` mediante la API.
* **Menú Semanal:** Puedes actualizar las fechas y la imagen del menú de la semana desde el Panel de Administrador sin tocar el código.

---

## 🔴 Lo que NO debes hacer (⚠️ Zona Crítica)

Para evitar romper el flujo de reservas y la seguridad de la app, por favor **sigue estrictamente estas reglas**:

1. **NO modifiques `RegistrationWizard.jsx` directamente:**
   * Este componente maneja toda la lógica del formulario paso a paso, carga las APIs de geocodificación de Nominatim, renderiza el mapa dinámico de Leaflet y procesa el comprobante de pago con coordenadas. Si necesitas un cambio ahí, ¡avísame primero y lo hacemos juntos!
2. **NO crees formularios de registro alternativos o "in-line" en `Landing2.jsx`:**
   * El botón "Reservar Cupo" de la Landing siempre debe abrir el componente modular `<RegistrationWizard isOpen={...} onClose={...} />`. No intentes replicar el wizard incrustado directamente en el código de la landing, ya que omitiría las validaciones geográficas y de base de datos.
3. **NO modifiques las rutas de `App.jsx` eliminando seguridad:**
   * La ruta `/admin` en `frontend/src/App.jsx` debe estar siempre protegida por el componente `<ProtectedRoute adminOnly={true}>`. Eliminar `adminOnly={true}` crearía una vulnerabilidad grave que permitiría a cualquier cliente entrar a ver las ventas y las coberturas.
4. **NO borres los campos de geolocalización en las APIs de reservas:**
   * En el controlador `backend/controllers/order.controller.js` se requieren obligatoriamente los campos `lat_1`, `lng_1` y `zona_1` para crear órdenes exitosas en la base de datos.

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
