
# North Chrome LTDA - Gestión de Bodega

## Descripción General

**North Chrome LTDA - Gestión de Bodega** es una aplicación web frontend diseñada para simular la administración y el control de inventario de una bodega industrial. Permite gestionar productos, documentos de ingreso, consumos por órdenes de trabajo, proveedores, solicitantes, solicitudes de materiales, usuarios y configuraciones del sistema.

Esta aplicación está construida como una **demostración frontend completa**, utilizando datos mock (simulados) para todas sus operaciones. No requiere un backend para funcionar, ya que toda la lógica de negocio y persistencia de datos (para la sesión actual y configuraciones básicas) se maneja en el lado del cliente.

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
    *   Simulación de adjuntar archivos a los documentos.
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
    *   Eliminación de consumos con reversión simulada de stock.
    *   Filtros por N° OT, producto, solicitante, responsable y rango de fechas.

8.  **Informes**:
    *   **Informe de Consumos**: Detalle de todos los ítems consumidos, con filtros y totales.
    *   **Informe de Movimientos de Inventario**: Vista unificada de todos los ingresos, consumos y ajustes.
    *   **Informe de Valoración de Stock**: Listado de productos con su stock actual y valorización total.
    *   **Informe de Tiempos de Ciclo/Espera**: Análisis simulado de tiempos de entrega de proveedores y duración de OTs.
    *   **Creador de Informes Personalizados**: Herramienta para que el usuario seleccione fuente de datos, campos, filtros y ordenamiento para generar vistas de datos a medida.
    *   (La exportación a CSV/PDF/Excel es simulada y solo muestra un mensaje en consola).

9.  **Gestión de Usuarios (Solo Admin)**:
    *   Listado, creación, edición y eliminación de usuarios.
    *   Asignación de roles (Administrador, Gestor de Bodega, Operador de Bodega).
    *   La gestión de contraseñas es simulada (no se almacenan hashes reales).

10. **Configuración del Sistema (Solo Admin)**:
    *   Modificación de parámetros generales: Nombre de empresa, moneda, formato de fecha, umbral de stock bajo, etc.
    *   Configuraciones de seguridad: Tiempo de sesión, longitud mínima de contraseña (simulado).
    *   Integraciones: URL de API externa (simulado).
    *   Apariencia: Selección de tema (Claro/Oscuro).
    *   Utilidades del sistema: Backup de BD (descarga JSON), exportación de datos (CSV), limpieza de caché y diagnóstico básico.

11. **Carga Masiva (Admin/Gestor)**:
    *   Funcionalidad para cargar datos desde archivos.
    *   Implementado para **Maestro de Productos**, **Proveedores**, **Categorías** e **Inventario Inicial**, todos mediante archivo XLSX.
    *   Incluye descarga de plantillas XLSX para cada entidad.

12. **Perfil de Usuario**:
    *   Visualización de la información del usuario actual.
    *   Funcionalidad simulada para cambiar contraseña.

13. **Log de Auditoría (Solo Admin)**:
    *   Visualización de un registro de acciones importantes realizadas en el sistema (datos mock).
    *   Filtros por fecha, usuario y acción.
    *   Simulación de visualización de log técnico del sistema.

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

## Pila Tecnológica (Frontend)

*   **React**: Biblioteca principal para la construcción de la interfaz de usuario.
*   **TypeScript**: Para tipado estático y mejora de la calidad del código.
*   **Tailwind CSS**: Framework CSS para un diseño rápido y personalizable.
*   **React Router (`HashRouter`)**: Para la navegación y enrutamiento dentro de la aplicación.
*   **Context API (React)**: Utilizada para la gestión del estado global de autenticación (`AuthContext`) y configuración (`ConfigContext`).
*   **`xlsx` (SheetJS)**: Biblioteca para leer y generar archivos Excel (utilizada en Carga Masiva).
*   **ES6 Modules**: Estructura de módulos estándar de JavaScript.
*   **Datos Mock**: Todos los datos son simulados y almacenados en constantes (`constants.tsx`).

## Configuración y Puesta en Marcha

1.  **Instalación de Dependencias**: Ejecuta `npm install` en la raíz del proyecto.
2.  **Desarrollo Local**: Usa `npm run dev` para iniciar el servidor de desarrollo de Vite.
3.  **Compilación para Producción**: Ejecuta `npm run build` para generar la carpeta `dist` con todos los archivos estáticos listos para desplegar.
4.  **Acceso**:
    *   Una vez abierta la aplicación en el navegador, serás dirigido a la página de Login.
    *   Credenciales de demostración (usuario/contraseña):
        *   `admin` / `admin123`
        *   `gestor` / `gestor123`
        *   `operador` / `operador123`

### Despliegue en Netlify

1.  Crea un nuevo sitio en Netlify y conecta este repositorio.
2.  Netlify ejecutará `npm run build` utilizando `netlify.toml` y publicará el contenido de la carpeta `dist`.

## Persistencia de Datos

*   **Datos de la Aplicación**: La mayoría de los datos (productos, documentos, consumos, etc.) se almacenan en arrays dentro de `constants.tsx` (ej. `MOCK_PRODUCTS_FOR_CONSUMPTION`). Estos datos son **volátiles** y se reinician cada vez que la página se recarga completamente o se cierra el navegador, *excepto* `MOCK_USERS` y `MOCK_SYSTEM_CONFIG` que mantienen sus valores iniciales para la demo.
*   **Sesión de Usuario**: La información del usuario autenticado se guarda en `localStorage` para persistir la sesión entre recargas de página.
*   **Configuración del Sistema**: Las configuraciones modificadas por el Administrador (ej. nombre de la empresa, tema UI) también se guardan en `localStorage` para que persistan.

## Estructura de la Aplicación

El código fuente está organizado en los siguientes directorios principales:

*   `src/`: Contiene todo el código fuente de la aplicación.
    *   `components/`: Componentes UI reutilizables (botones, modales, tablas, layout, etc.) y componentes específicos de módulos (formularios).
    *   `contexts/`: Proveedores de Contexto para estado global (Autenticación, Configuración).
    *   `hooks/`: Hooks personalizados (ej. `useAuth`).
    *   `pages/`: Componentes que representan las diferentes páginas/vistas de la aplicación, organizados por módulo.
    *   `types.ts`: Definiciones de tipos e interfaces de TypeScript para toda la aplicación.
    *   `constants.tsx`: Constantes, datos mock iniciales e iconos SVG.
    *   `App.tsx`: Componente raíz que configura el enrutamiento principal.
    *   `index.tsx`: Punto de entrada de la aplicación React, monta `App` en el DOM.
*   `index.html`: El archivo HTML principal que carga la aplicación.
*   `metadata.json`: Metadatos para la plataforma que hospeda la aplicación (si aplica).
*   `README.md`: Este archivo.

## Notas Importantes y Limitaciones de la Demo

*   **Frontend Puro**: Esta es una demostración de interfaz de usuario y lógica de frontend. No hay un backend real ni base de datos. Todas las "llamadas API" son simuladas.
*   **Seguridad Simplificada**: La autenticación y la gestión de contraseñas están altamente simplificadas y no son seguras para un entorno de producción.
*   **Funcionalidades Parcialmente Implementadas**: La exportación a PDF sigue limitada a una impresión básica desde el navegador.
*   **Rendimiento con Datos Mock**: Aunque se ha intentado que la UI sea fluida, el rendimiento con cantidades masivas de datos en los arrays mock puede verse afectado, ya que todas las operaciones de filtrado y ordenamiento se realizan en el cliente.
*   **IDs Dinámicos**: Los nuevos elementos creados durante la sesión reciben IDs generados dinámicamente (ej. `prod_dyn_X`, `doc_dyn_X`). Estos no son persistentes entre sesiones completas de la aplicación.
*   **Consistencia Global de Mocks**: Se ha hecho un esfuerzo para que los cambios en los arrays `MOCK_*` se reflejen globalmente en la sesión. Sin embargo, en una aplicación real, esto sería manejado por un estado global más robusto (como Redux/Zustand) o por la sincronización con un backend.

## Posibles Mejoras Futuras

*   Integración con un backend real (Node.js, Python/Django, Java/Spring, etc.).
*   Uso de una base de datos (PostgreSQL, MongoDB, etc.).
*   Implementación completa de exportación de informes (PDF, Excel).
*   Mejoras de seguridad (hashing de contraseñas, tokens JWT).
*   Pruebas unitarias e de integración.
*   Optimización del rendimiento para grandes volúmenes de datos.
*   Gestión de estado global más avanzada (ej. Redux Toolkit, Zustand).
*   Internacionalización (i18n) y localización (l10n).
*   Notificaciones en tiempo real.
*   Flujos de trabajo y aprobaciones más complejos.

---

Hecho con ❤️ para North Chrome LTDA.
