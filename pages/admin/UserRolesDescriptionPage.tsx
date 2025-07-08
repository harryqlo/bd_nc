
import React from 'react';
import { Card } from '../../components/ui/Card';
import { UserRole } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { Navigate } from 'react-router-dom';

const UserRolesDescriptionPage: React.FC = () => {
  const { user } = useAuth();

  if (user?.role !== UserRole.ADMIN) {
    return <Navigate to="/" replace />;
  }

  const roleDescriptions = [
    {
      role: UserRole.ADMIN,
      title: 'Administrador del Sistema',
      functions: [
        "Control total del sistema: Acceso sin restricciones a todos los módulos y funcionalidades.",
        "Gestión de Usuarios: Puede crear, ver, editar y eliminar todas las cuentas de usuario (excepto la propia). Asigna roles a los usuarios.",
        "Configuración del Sistema: Puede modificar todos los ajustes globales del sistema (nombre de empresa, moneda, formatos de fecha, umbrales de stock, tiempos de sesión, políticas de OT, etc.).",
        "Acceso al Log de Auditoría: Puede ver el registro completo de actividades del sistema.",
        "Gestión de Datos Maestros (CRUD Completo): Productos (Gestión de Inventario), Categorías (implícitamente a través de la Gestión de Productos), Proveedores, Solicitantes.",
        "Gestión de Datos Transaccionales (CRUD Completo): Documentos (Facturas, Guías de Despacho, etc.), Consumos (vinculados a Órdenes de Trabajo), Solicitudes de Material, Ajustes de Inventario (modificaciones directas de stock).",
        "Operaciones Masivas: Puede realizar cargas masivas de datos para diversas entidades (ej. productos).",
        "Informes: Tiene acceso a todos los informes estándar y personalizados.",
        "Utilidades del Sistema: Puede realizar tareas de mantenimiento como backup de base de datos (simulado), exportación de datos, limpieza de caché (simulada) y diagnóstico del sistema (simulado)."
      ],
      limitations: [
        "No puede eliminar su propia cuenta de usuario a través de la interfaz."
      ]
    },
    {
      role: UserRole.WAREHOUSE_MANAGER,
      title: 'Gestor de Bodega',
      functions: [
        "Supervisión Operacional: Gestiona las operaciones centrales de la bodega.",
        "Gestión de Datos Maestros (CRUD Completo): Productos (Gestión de Inventario), Categorías (implícitamente), Proveedores, Solicitantes.",
        "Gestión de Datos Transaccionales (CRUD Completo): Documentos, Consumos, Solicitudes de Material, Ajustes de Inventario.",
        "Operaciones Masivas: Puede realizar cargas masivas de datos.",
        "Informes: Tiene acceso a todos los informes estándar y personalizados.",
        "Acceso de Visualización: Dashboard y listas de Inventario, Documentos, Consumos, y Solicitudes de Material."
      ],
      limitations: [
        "Sin Acceso a Administración: No puede acceder a la sección de 'Administración' (Gestión de Usuarios, Log de Auditoría, Configuración del Sistema).",
        "No puede realizar utilidades a nivel de sistema como backups de base de datos o modificar configuraciones globales del sistema."
      ]
    },
    {
      role: UserRole.WAREHOUSE_OPERATOR,
      title: 'Operador de Bodega',
      functions: [
        "Operaciones Diarias: Realiza tareas rutinarias relacionadas con las actividades de la bodega.",
        "Registro de Consumos: Puede registrar nuevos consumos de material contra Órdenes de Trabajo.",
        "Creación de Solicitudes de Material: Puede crear nuevas solicitudes de materiales.",
        "Visualización de Solicitudes de Material: Puede ver todas las solicitudes de materiales.",
        "Acceso de Visualización: Dashboard, Lista de Inventario (puede ver productos y sus detalles), Lista de Documentos (puede ver documentos existentes y sus detalles), Lista de Consumos (puede ver registros de consumo)."
      ],
      limitations: [
        "Sin Acceso a Administración.",
        "Sin Gestión de Datos Maestros: No puede crear, editar o eliminar Proveedores o Solicitantes.",
        "Sin Carga Masiva de datos.",
        "Sin Acceso a la sección de Informes.",
        "Gestión de Inventario Limitada: No puede añadir nuevos productos, editar detalles de productos (excepto a través de flujos específicos como recepción contra documento, si se implementa), eliminar productos, o realizar ajustes directos de stock.",
        "Gestión de Documentos Limitada: Solo visualización, no puede registrar nuevos documentos de ingreso ni editar existentes.",
        "Gestión de Solicitudes de Material Limitada: No puede editar ni eliminar solicitudes de materiales (solo crear y ver).",
        "Gestión de Consumos Limitada: Puede registrar nuevos consumos. La capacidad de eliminar o editar consumos históricos (especialmente los de otros) suele estar restringida. La edición de los propios consumos recientes antes de una finalización podría ser permitida."
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-slate-100">Descripción de Roles de Usuario</h1>
      <p className="text-gray-600 dark:text-slate-300">
        A continuación se detalla qué puede hacer cada tipo de usuario en el sistema.
      </p>

      {roleDescriptions.map(desc => (
        <Card key={desc.role} title={desc.title} className="mb-6 shadow-lg">
          <div className="space-y-4 p-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-slate-200 mb-2 border-b pb-1 border-gray-200 dark:border-slate-700">Funciones y Capacidades Principales:</h3>
              <ul className="list-disc list-inside space-y-1.5 text-sm text-gray-600 dark:text-slate-300 pl-4">
                {desc.functions.map((func, index) => <li key={`func-${index}`}>{func}</li>)}
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-slate-200 mb-2 border-b pb-1 border-gray-200 dark:border-slate-700">Limitaciones Clave:</h3>
              <ul className="list-disc list-inside space-y-1.5 text-sm text-gray-600 dark:text-slate-300 pl-4">
                {desc.limitations.map((lim, index) => <li key={`lim-${index}`}>{lim}</li>)}
              </ul>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default UserRolesDescriptionPage;