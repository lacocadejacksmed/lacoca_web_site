# FICHA DE PROYECTO DE SOFTWARE: LA COCA DE JACKS

## 1. Información General
* **Nombre del Aplicativo:** Sistema de Información para la Gestión de Suscripciones y Logística de "La Coca de Jacks".
* **Sector:** Economía Popular (Servicios de alimentación y distribución local en zonas urbanas).
* **Datos del Cliente:** La Coca de Jacks SAS (Medellín, Antioquia).
* **Datos de los Aprendices:** Alejandro Gómez Mesa, Erick Camargo, Omar Meneses, Grabriel Mesa, Samuel Marin.

## 2. Planteamiento del Problema

### Descripción de la Empresa
La Coca de Jacks es una empresa emergente dedicada a la preparación y distribución de almuerzos caseros bajo un modelo de suscripción mensual, quincenal y semanal operando en la ciudad de Medellín. Actualmente, la empresa cuenta con un equipo de trabajo de mas de 45 empleados fijos con las siguientes funciones:
* **1 Administrador:** Encargado de la compra de insumos, gestión de clientes, control de pagos y coordinación general.
* **2 Cocineros:** Responsables de la producción alimentaria masiva bajo estándares de calidad y menús rotativos.
* **3 Repartidores logísticos:** Encargados de la distribución física de los almuerzos en rutas específicas de la ciudad.
* **4 Personal de limpieza:** Encargados de la limpieza de la cocina y los utensilios.
* **5 Despacho y empaque de pedidos**: Encargados del empaque y despacho de los pedidos.
* **6 Atención al cliente**: Encargados de la atención al cliente por WhatsApp.
* **7 Gestion del inventario**: Encargados de la gestión del inventario de la empresa.


### Necesidades Actuales (Desarrollo del Proceso Actual)
El proceso operativo se desarrolla de forma manual y artesanal de la siguiente manera:
1. **Captación y Registro:** El cliente contacta a la empresa por WhatsApp. El administrador registra los datos del cliente, su dirección de entrega en un documento de Excel.
2. **Validación de Pago:** El cliente envía el comprobante de pago (Bancolombia) por chat. El administrador debe revisar manualmente su cuenta bancaria para confirmar el dinero y marcar la suscripción como "Paga" en la hoja de cálculo.
3. **Planeación de Producción:** Cada noche previa a la entrega, los cocineros revisan el Excel para saber cuántos almuerzos exactos deben preparar para el día siguiente.
4. **Despacho y Rutas:** Cada domiciliario tiene un ruta asignada en la que cubre las entregas de dicha zona.

### Consecuencias Específicas
Al proyectar la escala del negocio hacia una meta de 1,500 clientes activos, el modelo manual actual generará las siguientes consecuencias críticas:
* **Cuellos de botella en tesorería:** Validar manualmente 1,500 comprobantes de pago individuales por WhatsApp resultará en pérdidas financieras por fraudes (comprobantes falsos) y retrasos en la activación del servicio.
* **Colapso logístico:** La asignación manual de direcciones provocará ineficiencia en las rutas de los repartidores, generando entregas tardías (comidas frías), incremento en costos de combustible y pérdida de clientes por insatisfacción.
* **Desperdicio de inventario o desabastecimiento:** Errores humanos en el conteo del Excel causarán un desfase entre los almuerzos cocinados y los realmente requeridos, impactando directamente el margen de ganancia de la economía.

## 3. Objetivos del Proyecto

### Objetivo General
Desarrollar un sistema de información web y móvil para automatizar la gestión de planes alimenticios, pasarela de pagos y optimización de rutas de distribución, mediante la metodología ágil SCRUM y tecnologías JavaScript (Node.js/React), en la empresa La Coca de Jacks ubicada en la ciudad de Medellín durante el año 2026.

### Objetivos Específicos
1. **Desarrollar un módulo de Gestión de Roles** para parametrizar los niveles de acceso del personal (Administrador, Cocina, Repartidor, Cliente) según políticas de seguridad de la información.
2. **Implementar un módulo de Gestión de Cuentas de Usuarios** para autenticar y proteger los datos de contacto y perfiles de los suscriptores mediante protocolos de cifrado estándar.
3. **Integrar un módulo de Gestión de Pagos Automatizados** para procesar suscripciones de forma inmediata mediante API Webhooks de MercadoPago o Wompi.
4. **Construir un módulo de Control de Despachos y Rutas** para optimizar los tiempos de entrega de los repartidores mediante geolocalización basada en el API de Mapbox o Google Maps.
5. **Programar un módulo de Planificación de Producción Diario** para consolidar los menús activos requeridos y generar reportes automatizados dirigidos al equipo de cocina.

## 4. Alcance (Procesos y Subprocesos Núcleo)

Para cumplir con los objetivos trazados y resolver el problema planteado, el alcance del sistema se estructura bajo principios de alta cohesión arquitectónica en **10 Macro-Módulos Estructurales**.

### 1. Módulo de Seguridad y Accesos
* **Función Principal:** Garantizar que solo el personal autorizado ingrese al sistema y acceda únicamente a las pantallas de su competencia y roles asignados. 
* **Datos que gestiona:** Credenciales de empleados, tokens de sesión, matriz de permisos.
* **Acciones (CRUD):** Crear/Editar cuentas de empleado, Asignar roles, Login/Logout.
* **Reglas de negocio:** La sesión caduca automáticamente por inactividad. Bloqueo de cuenta tras 5 intentos fallidos.
* **Búsquedas:** Filtro de empleados activos vs. inactivos.

### 2. Módulo de Gestión de Clientes
* **Función Principal:** Centralizar la base de datos de consumidores, sus múltiples direcciones de entrega y estrategias de retención.
* **Datos que gestiona:** Perfil del cliente, teléfono único, coordenadas de entrega, historial de suscripciones.
* **Acciones (CRUD):** Registrar cliente, Actualizar direcciones, Crear cupones promocionales.
* **Reglas de negocio:** No se elimina un cliente con historial (se inactiva).
* **Filtros:** Búsqueda rápida por número de WhatsApp.

### 3. Módulo de Suscripciones
* **Función Principal:** Administrar el ciclo de vida de los planes adquiridos por los clientes y procesar sus pagos.
* **Datos que gestiona:** ID Suscripción, Tipo de Plan (Semanal/Mensual), Fechas de vigencia, Estado del pago.
* **Acciones (CRUD):** Crear suscripción (vía webhook), Consultar estado, Editar preferencias de menú, Suspender por falta de pago.
* **Reglas de negocio:** No se puede eliminar una suscripción si tiene entregas pendientes. El menú solo puede editarse con 12 horas de anticipación.

### 4. Módulo de Catálogo y Menú Digital
* **Función Principal:** Administrar la oferta gastronómica y las variantes de menú para que los clientes escojan sus opciones diarias.
* **Datos que gestiona:** Menú semanal, platillos, categorías (Fit, Tradicional), ingredientes extra.
* **Acciones (CRUD):** Programar menú de la semana, Activar/Desactivar disponibilidad.
* **Reglas de negocio:** El menú debe estar publicado al menos 48 horas antes para que los suscriptores lo visualicen.

### 5. Módulo de Recepción Omnicanal (Chatbot)
* **Función Principal:** Automatizar la interacción con los clientes vía WhatsApp para renovaciones, pagos o consultas de menú.
* **Datos que gestiona:** Flujo de conversación, respuestas rápidas, tickets de soporte.
* **Acciones:** Capturar mensajes, Validar estado de suscripción mediante el número, Transferir a asesor.
* **Reglas de negocio:** El bot detiene su flujo si el cliente selecciona la opción de "Hablar con soporte".

### 6. Módulo de Producción Diaria (Cocina)
* **Función Principal:** Consolidar automáticamente los menús activos requeridos cada día para que los cocineros sepan exactamente qué preparar.
* **Datos que gestiona:** Consolidado de platos diarios, Notas especiales ("Sin sal"), Tiempos de preparación.
* **Acciones:** Generar reporte de producción diario, Marcar lotes como "Listos para despacho".
* **Reglas de negocio:** Una vez la cocina marca el lote como "En preparación", el sistema bloquea cambios de menú para los clientes de ese día.

### 7. Módulo de Logística y Zonas de Cobertura
* **Función Principal:** Organizar y asignar las rutas geográficas óptimas para la entrega física de las cocas de almuerzo a los 3 repartidores.
* **Datos que gestiona:** Tarifas por barrio, Asignación de pedido a repartidor, Orden de la ruta (1º, 2º, 3º...).
* **Acciones (CRUD):** Generar lote de despacho diario, Actualizar estado del domicilio ("Entregado" por repartidor).
* **Reglas de negocio:** No se puede reasignar un despacho a otro repartidor si el estado actual es "En Ruta".

### 8. Módulo de Inventario y Abastecimiento
* **Función Principal:** Controlar los insumos clave (ej. empaques, proteínas) para evitar desabastecimiento que frene la producción de almuerzos.
* **Datos que gestiona:** Unidades en stock, alertas de stock mínimo, registro de entradas.
* **Acciones:** Ingreso de mercancía, Descuento de stock por ventas/producción.
* **Reglas de negocio:** El sistema debe alertar al Administrador cuando un insumo crítico esté por debajo del límite mínimo.

### 9. Módulo de Servicio al Cliente (PQRS)
* **Función Principal:** Registrar y solucionar quejas de clientes (ej. almuerzo frío, retrasos) para proteger la retención de suscriptores.
* **Datos que gestiona:** Ticket de reclamo, Despacho asociado, Resolución, Compensación (días extra de suscripción).
* **Acciones:** Abrir ticket, Escalar a administrador, Cerrar caso.
* **Reglas de negocio:** Toda queja debe estar vinculada al ID de un despacho real.

### 10. Módulo de Analítica y Reportes Gerenciales
* **Función Principal:** Proveer inteligencia de negocio al dueño mediante gráficas e indicadores clave de rendimiento (KPIs).
* **Datos que gestiona:** Ingresos mensuales recurrentes (MRR), Churn rate (cancelaciones), tiempos promedio de entrega.
* **Acciones:** Visualizar dashboards, Exportar consolidado a Excel/PDF.
* **Filtros:** Por mes, semana, o por repartidor específico.

## 5. Entregables Clave por Fases (Sprints de la Tecnología)

+---------------------------------------------------------------------------------+
|                       FASE 1: REQUISITOS (Sprints 1 - 4)                        |
+---------------------------------------------------------------------------------+
| * Instrumentos de recolección de información aplicados (Encuestas/Entrevistas). |
| * Mapa de Procesos de la empresa "La Coca de Jacks".                            |
| * Ficha de proyecto firmada y aprobada por el comité.                           |
| * Artefactos de facilitación gráfica e Historias de Usuario (Backlog Inicial).  |
+---------------------------------------------------------------------------------+
                                        |
                                        v
+---------------------------------------------------------------------------------+
|                  FASE 2: ANÁLISIS Y MODELADO (Sprints 5 - 9)                    |
+---------------------------------------------------------------------------------+
| * Diagramas de Casos de Uso y Modelo Relacional de Base de Datos SQL/NoSQL.     |
| * Arquitectura de software documentada bajo el modelo de diagramas C4.          |
| * Prototipos navegables de alta fidelidad diseñados en Figma.                   |
| * Manual Técnico de Arquitectura y Especificación de Requisitos del Sistema.    |
+---------------------------------------------------------------------------------+
                                        |
                                        v
+---------------------------------------------------------------------------------+
|                FASE 3: CONSTRUCCIÓN E IMPLANTACIÓN (Sprints 10 - 11)            |
+---------------------------------------------------------------------------------+
| * Código fuente desplegado en repositorio de GitHub (Backend y Frontend).       |
| * Reportes de Pruebas de Calidad (Pruebas unitarias y de aceptación).           |
| * Plan y actas de capacitación a los usuarios (Administrador, Cocina, Repartir).|
| * Manual de Usuario definitivo del aplicativo web y móvil.                      |
+---------------------------------------------------------------------------------+
```