
# North Chrome LTDA - Gestión de Bodega

## Descripción General

 codex/actualizar-readme-y-componentes-de-texto
**North Chrome LTDA - Gestión de Bodega** es una aplicación web completa para la administración y el control de inventario de una bodega industrial. Permite gestionar productos, documentos de ingreso, consumos por órdenes de trabajo, proveedores, solicitantes, solicitudes de materiales, usuarios y configuraciones del sistema.

El sistema cuenta con un frontend en React y un backend REST desarrollado con Node.js que persiste la información en una base de datos MongoDB. Toda la lógica de negocio y la autenticación se ejecutan en el servidor, mientras que la interfaz se comunica mediante API.

**North Chrome LTDA - Gestión de Bodega** es una aplicación web que simula la administración y el control de inventario de una bodega industrial. Permite gestionar productos, documentos de ingreso, consumos por órdenes de trabajo, proveedores, solicitantes, solicitudes de materiales, usuarios y configuraciones del sistema.

La capa principal sigue siendo el frontend, utilizando datos mock (simulados) para todas sus operaciones. Opcionalmente se incluye un pequeño backend escrito en **Node.js** con **Express** y **MongoDB**, el cual proporciona rutas REST básicas y autenticación mediante JWT. Este backend sirve como ejemplo para conectar la aplicación a una base de datos real.
 main

## Características Principales

La aplicación se organiza en varios módulos, cada uno con funcionalidades específicas:

1.  **Dashboard (Panel Principal)**:
    *   Vista general del estado del sistema.
    *   Estadísticas clave: Productos únicos, documentos, consumos, proveedores, solicitantes.
    *   Valor total del inventario y alertas de stock crítico.
    *   Gráficos simples para visualizar productos por categoría y consumos recientes.
    *   Listado de actividad reciente y alertas de stock.

2.  **Gestión de Inventario**:
    *   Listado, creación, edición y eliminación de productos (SKU, nombre, descripción, unidad de medida, ubicación, categoría, valor promedio, stock, etc.).
    *   Filtros avanzados (categoría, proveedor, estado de stock, ubicación, fecha de último ingreso) y búsqueda rápida.
    *   Paginación y ordenamiento de productos.
    *   **Ajustes de Stock**: Modificación manual del stock de un producto con registro de motivo.
    *   **Kardex de Producto**: Visualización detallada de todos los movimientos (ingresos, consumos, ajustes) para un producto específico, calculando saldos.
    *   Gestión de categorías y proveedores (implícita a través de la asociación en productos).

3.  **Documentos de Ingreso**:
    *   Registro y visualización de documentos (Facturas, Guías de Despacho, Boletas).
    *   Detalle de productos ingresados por documento (cantidad, valor unitario, descuento).
    *   Asociación con proveedores y, opcionalmente, con Solicitudes de Material.
    *   Adjuntar archivos a los documentos.
    *   Actualización automática del stock y valor promedio de los productos al ingresar un nuevo documento.
    *   Filtros por tipo de documento, proveedor, estado, fechas de emisión y recepción.

4.  **Solicitudes de Materiales**:
    *   Creación, visualización y edición de solicitudes de materiales.
    *   Detalle de ítems solicitados (descripción, cantidad, unidad, proveedor sugerido, estado del ítem).
    *   Gestión de estados por ítem ('Pendiente', 'En Compra', 'Parcialmente Recibido', 'Recibido', 'Cancelado') y estado general de la solicitud.
    *   Asociación con Solicitantes.
    *   Vinculación con Documentos de Ingreso que satisfacen la solicitud.
    *   Observaciones y seguimiento.

5.  **Gestión de Proveedores**:
    *   Listado, creación, edición y eliminación de proveedores.
    *   Información de contacto, RUT, dirección.
    *   Búsqueda por nombre, RUT o contacto.

6.  **Gestión de Solicitantes**:
    *   Listado, creación, edición y eliminación de personas o entidades que solicitan materiales (ej. mecánicos, electricistas).
    *   Información de código interno, nombre completo y cargo.
    *   Búsqueda por código, nombre o cargo.

7.  **Consumos por Orden de Trabajo (OT)**:
    *   Registro y visualización de consumos de inventario asociados a una OT.
    *   Selección de productos y cantidades consumidas.
    *   Asociación con un solicitante.
    *   Creación automática de OT si no existe (configurable).
    *   Actualización automática del stock de productos al registrar un consumo.
    *   Eliminación de consumos con reversión automatica de stock.
    *   Filtros por N° OT, producto, solicitante, responsable y rango de fechas.

8.  **Informes**:
    *   **Informe de Consumos**: Detalle de todos los ítems consumidos, con filtros y totales.
    *   **Informe de Movimientos de Inventario**: Vista unificada de todos los ingresos, consumos y ajustes.
    *   **Informe de Valoración de Stock**: Listado de productos con su stock actual y valorización total.
    *   **Informe de Tiempos de Ciclo/Espera**: Análisis de tiempos de entrega de proveedores y duración de OTs.
    *   **Creador de Informes Personalizados**: Herramienta para que el usuario seleccione fuente de datos, campos, filtros y ordenamiento para generar vistas de datos a medida.
    *   Permite exportar los informes a CSV, PDF o Excel.

9.  **Gestión de Usuarios (Solo Admin)**:
    *   Listado, creación, edición y eliminación de usuarios.
    *   Asignación de roles (Administrador, Gestor de Bodega, Operador de Bodega).
    *   La gestión de contraseñas se realiza de forma segura utilizando hashing.

10. **Configuración del Sistema (Solo Admin)**:
    *   Modificación de parámetros generales: Nombre de empresa, moneda, formato de fecha, umbral de stock bajo, etc.
    *   Configuraciones de seguridad: Tiempo de sesión, longitud mínima de contraseña.
    *   Integraciones: URL de API externa.
    *   Apariencia: Selección de tema (Claro/Oscuro).
    *   Utilidades del sistema: Backup de BD (descarga JSON), exportación de datos (CSV), limpieza de caché y diagnóstico básico.

11. **Carga Masiva (Admin/Gestor)**:
    *   Funcionalidad para cargar datos desde archivos.
    *   Implementado para **Maestro de Productos**, **Proveedores**, **Categorías** e **Inventario Inicial**, todos mediante archivo XLSX.
    *   Incluye descarga de plantillas XLSX para cada entidad.

12. **Perfil de Usuario**:
    *   Visualización de la información del usuario actual.
    *   Funcionalidad para cambiar contraseña.

13. **Log de Auditoría (Solo Admin)**:
    *   Visualización de un registro de acciones importantes realizadas en el sistema.
    *   Filtros por fecha, usuario y acción.
    *   Visualización del log técnico del sistema.

14. **Funcionalidades Adicionales**:
    *   **Modo Oscuro/Claro**: Tema de interfaz seleccionable y persistente.
    *   **Diseño Responsivo**: Adaptable a diferentes tamaños de pantalla.
    *   **Componentes UI Reutilizables**: Botones, inputs, modales, tablas, tarjetas, alertas, etc., construidos para consistencia.

## Roles de Usuario y Permisos

La aplicación define tres roles principales con diferentes niveles de acceso:

1.  **Administrador del Sistema (`UserRole.ADMIN`)**:
    *   Acceso total a todas las funcionalidades, incluyendo gestión de usuarios, configuración del sistema y logs de auditoría.
    *   Puede realizar todas las operaciones CRUD en todas las entidades.

2.  **Gestor de Bodega (`UserRole.WAREHOUSE_MANAGER`)**:
    *   Acceso completo a la gestión de inventario, documentos, proveedores, consumos, solicitudes de material y carga masiva.
    *   Puede generar todos los informes.
    *   No tiene acceso a la administración de usuarios ni a la configuración del sistema.

3.  **Operador de Bodega (`UserRole.WAREHOUSE_OPERATOR`)**:
    *   Puede registrar consumos y crear solicitudes de materiales.
    *   Tiene acceso de visualización al dashboard, inventario, documentos y solicitudes de materiales.
    *   Funciones de edición y eliminación limitadas.

Una descripción más detallada de los permisos por rol se encuentra en la sección "Administración > Descripción de Roles" dentro de la aplicación.

## Pila Tecnológica

*   **React**: Biblioteca principal para la construcción de la interfaz de usuario.
*   **TypeScript**: Para tipado estático y mejora de la calidad del código.
*   **Tailwind CSS**: Framework CSS para un diseño rápido y personalizable.
*   **React Router (`HashRouter`)**: Para la navegación y enrutamiento dentro de la aplicación.
*   **Context API (React)**: Utilizada para la gestión del estado global de autenticación (`AuthContext`) y configuración (`ConfigContext`).
*   **`xlsx` (SheetJS)**: Biblioteca para leer y generar archivos Excel (utilizada en Carga Masiva).
*   **ES6 Modules**: Estructura de módulos estándar de JavaScript.
*   **Node.js / Express**: Backend REST que centraliza la lógica de negocio.
*   **MongoDB**: Base de datos utilizada para almacenar de forma persistente los datos del sistema.

## Pila Tecnológica (Backend)

* **Node.js** y **Express** para el servidor HTTP.
* **MongoDB** como base de datos con **Mongoose** para la capa ODM.
* **JSON Web Tokens (JWT)** para la autenticación de usuarios.

### Inicio Rápido del Backend

1. Ve a la carpeta `server/` y ejecuta `npm install`.
2. Copia `.env.example` a `.env` y ajusta `MONGO_URI` y `JWT_SECRET`.
3. Inicia el backend con `npm start` (puerto por defecto `4000`).
4. Las rutas REST estarán disponibles bajo `/api`.

## Configuración y Puesta en Marcha

codex/actualizar-readme-y-componentes-de-texto
1.  **Instalación de Dependencias**:
    *   Ejecuta `npm install` en la raíz del proyecto para instalar las dependencias del frontend.
    *   En el directorio del backend ejecuta `npm install` para preparar el servidor.
2.  **Desarrollo Local**:
    *   Inicia el backend con `npm start` en su carpeta correspondiente.
    *   En otra terminal ejecuta `npm run dev` para levantar el frontend con Vite.

1.  **Instalación de Dependencias**: Ejecuta `npm install` en la raíz del proyecto.
2.  **Desarrollo Local**:
    *   Ejecuta `npm run server` para iniciar el backend de autenticación en `http://localhost:3001`.
    *   En otra terminal, usa `npm run dev` para iniciar el servidor de desarrollo de Vite.
main
3.  **Compilación para Producción**: Ejecuta `npm run build` para generar la carpeta `dist` con todos los archivos estáticos listos para desplegar. Este comando también compila los estilos de Tailwind a `dist/output.css`.
4.  **Acceso**:
    *   Una vez abierta la aplicación en el navegador, serás dirigido a la página de Login.
    *   Credenciales de ejemplo (usuario/contraseña):
        *   `admin` / `admin123`
        *   `gestor` / `gestor123`
        *   `operador` / `operador123`

### Despliegue en Netlify

1.  Crea un nuevo sitio en Netlify y conecta este repositorio.
2.  Netlify ejecutará `npm run build` utilizando `netlify.toml` y publicará el contenido de la carpeta `dist`.

## Persistencia de Datos

*   **Datos de la Aplicación**: Toda la información (productos, documentos, consumos, etc.) se almacena de forma persistente en MongoDB mediante el backend.
*   **Sesión de Usuario**: La autenticación utiliza tokens JWT y la sesión se mantiene de manera segura en el cliente.
*   **Configuración del Sistema**: Las configuraciones modificadas por el Administrador se guardan en la base de datos y se cargan al iniciar la aplicación.

## Estructura de la Aplicación

El código fuente está organizado en los siguientes directorios principales:

*   `src/`: Contiene todo el código fuente de la aplicación.
    *   `components/`: Componentes UI reutilizables (botones, modales, tablas, layout, etc.) y componentes específicos de módulos (formularios).
    *   `contexts/`: Proveedores de Contexto para estado global (Autenticación, Configuración).
    *   `hooks/`: Hooks personalizados (ej. `useAuth`).
    *   `pages/`: Componentes que representan las diferentes páginas/vistas de la aplicación, organizados por módulo.
    *   `types.ts`: Definiciones de tipos e interfaces de TypeScript para toda la aplicación.
    *   `constants.tsx`: Constantes e iconos SVG utilizados por la interfaz.
    *   `App.tsx`: Componente raíz que configura el enrutamiento principal.
    *   `index.tsx`: Punto de entrada de la aplicación React, monta `App` en el DOM.
*   `index.html`: El archivo HTML principal que carga la aplicación.
*   `metadata.json`: Metadatos para la plataforma que hospeda la aplicación (si aplica).
*   `README.md`: Este archivo.
*   `server/`: Backend opcional con Express y MongoDB.

## Notas Importantes

 codex/actualizar-readme-y-componentes-de-texto
*   **Arquitectura Cliente-Servidor**: La aplicación se apoya en un backend Node.js que expone una API REST para todas las operaciones de inventario.
*   **Seguridad**: Las contraseñas se almacenan con hashing seguro y la autenticación utiliza tokens JWT con roles de usuario.
*   **Exportación de Datos**: Los informes pueden exportarse a PDF, CSV o Excel desde la interfaz.
*   **Escalabilidad**: El sistema persiste la información en MongoDB y puede ejecutarse en entornos de producción.
*   **Frontend Primero**: La aplicación está pensada como una demo de interfaz. El backend incluido es opcional y de alcance limitado.
*   **Seguridad Simplificada**: La autenticación y la gestión de contraseñas están altamente simplificadas y no son seguras para un entorno de producción.
*   **Funcionalidades Parcialmente Implementadas**: La exportación a PDF sigue limitada a una impresión básica desde el navegador.
*   **Rendimiento con Datos Mock**: Aunque se ha intentado que la UI sea fluida, el rendimiento con cantidades masivas de datos en los arrays mock puede verse afectado, ya que todas las operaciones de filtrado y ordenamiento se realizan en el cliente.
*   **IDs Dinámicos**: Los nuevos elementos creados durante la sesión reciben IDs generados dinámicamente (ej. `prod_dyn_X`, `doc_dyn_X`). Estos no son persistentes entre sesiones completas de la aplicación.
*   **Consistencia Global de Mocks**: Se ha hecho un esfuerzo para que los cambios en los arrays `MOCK_*` se reflejen globalmente en la sesión. Sin embargo, en una aplicación real, esto sería manejado por un estado global más robusto (como Redux/Zustand) o por la sincronización con un backend.
main

## Posibles Mejoras Futuras

*   Implementación avanzada de exportación de informes (PDF, Excel).
*   Mejoras de seguridad (hashing de contraseñas, tokens JWT).
*   Pruebas unitarias e de integración.
*   Optimización del rendimiento para grandes volúmenes de datos.
*   Gestión de estado global más avanzada (ej. Redux Toolkit, Zustand).
*   Internacionalización (i18n) y localización (l10n).
*   Notificaciones en tiempo real.
*   Flujos de trabajo y aprobaciones más complejos.

---

Hecho con ❤️ para North Chrome LTDA.
