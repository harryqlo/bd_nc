
import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
    APP_NAME, 
    HomeIcon, 
    CubeIcon, 
    DocumentTextIcon, 
    ArrowUpTrayIcon, 
    UsersIcon, 
    CogIcon, 
    BookOpenIcon,
    TruckIcon, 
    ClipboardDocumentListIcon, 
    IdentificationIcon,
    ChartBarIcon,
    ClockIcon, 
    AdjustmentsVerticalIcon, 
    ChevronDownIcon, 
    ChevronRightIcon 
} from '../../constants';
import { useAuth } from '../../hooks/useAuth';
import { useConfig } from '../../contexts/ConfigContext'; 
import { UserRole } from '../../types';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isSubItem?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label, isSubItem = false }) => {
  const location = useLocation();
  const isActive = location.pathname === to || (location.pathname.startsWith(to) && to !== "/"); 
  
  let specificActiveCheck = isActive;
  if (to === "/" && location.pathname !== "/") {
    specificActiveCheck = false;
  }
   if (to === "/" && location.pathname === "/") { 
      specificActiveCheck = true;
  }
   if (isSubItem === false && to.includes("reports") && !location.pathname.startsWith(to)) {
    specificActiveCheck = false;
   }


  return (
    <NavLink
      to={to}
      end={!isSubItem && !to.includes("reports")} 
      className={
        `flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-150 ease-in-out group
        ${isSubItem ? 'pl-10' : ''} 
        ${specificActiveCheck
          ? 'bg-primary text-white dark:bg-primary-dark shadow-md'
          : 'text-neutral-700 dark:text-slate-300 hover:bg-primary-light/20 hover:text-primary-dark dark:hover:bg-primary-dark/30 dark:hover:text-primary-light'
        }`
      }
    >
      <span className={`w-5 h-5 mr-3 ${isSubItem ? 'w-4 h-4' : ''}`}>{icon}</span>
      {label}
    </NavLink>
  );
};

interface ReportGroupProps {
  mainIcon: React.ReactNode;
  mainLabel: string;
  children: React.ReactNode;
}

const ReportGroup: React.FC<ReportGroupProps> = ({ mainIcon, mainLabel, children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();
    const isActiveGroup = location.pathname.startsWith('/reports');

    React.useEffect(() => {
        if (isActiveGroup) {
            setIsOpen(true);
        }
    }, [isActiveGroup, location.pathname]);


    return (
        <div>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center justify-between w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-150 ease-in-out group
                    ${isActiveGroup && !isOpen ? 'bg-primary-light/10 text-primary-dark dark:bg-primary-dark/20 dark:text-primary-light' : ''}
                    ${isActiveGroup && isOpen ? 'bg-primary text-white dark:bg-primary-dark shadow-md' : ''}
                    ${!isActiveGroup ? 'text-neutral-700 dark:text-slate-300 hover:bg-primary-light/20 hover:text-primary-dark dark:hover:bg-primary-dark/30 dark:hover:text-primary-light' : ''}`}
            >
                <div className="flex items-center">
                    <span className="w-6 h-6 mr-3">{mainIcon}</span>
                    {mainLabel}
                </div>
                {isOpen ? <ChevronDownIcon className="w-5 h-5" /> : <ChevronRightIcon className="w-5 h-5" />}
            </button>
            {isOpen && (
                <div className="mt-1 space-y-1">
                    {children}
                </div>
            )}
        </div>
    );
};


export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const { config } = useConfig(); 

  return (
    <div className="w-64 bg-white dark:bg-slate-800 shadow-lg flex flex-col">
      <div className="h-16 flex items-center justify-center border-b border-neutral-200 dark:border-slate-700 px-2">
        <h1 className="text-xl font-bold text-primary dark:text-primary-light truncate" title={config.companyName || APP_NAME}>
          {config.companyName || APP_NAME}
        </h1>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        <NavItem to="/" icon={<HomeIcon />} label="Dashboard" />
        <NavItem to="/inventory" icon={<CubeIcon />} label="Gestión de Inventario" />
        <NavItem to="/documents" icon={<DocumentTextIcon />} label="Documentos de Ingreso" />
        <NavItem to="/material-requests" icon={<ClipboardDocumentListIcon />} label="Solicitudes Materiales" />
        
        {(user?.role === UserRole.ADMIN || user?.role === UserRole.WAREHOUSE_MANAGER) && (
          <NavItem to="/providers" icon={<TruckIcon />} label="Gestión de Proveedores" />
        )}

        {(user?.role === UserRole.ADMIN || user?.role === UserRole.WAREHOUSE_MANAGER) && (
          <NavItem to="/requesters" icon={<IdentificationIcon />} label="Gestión de Solicitantes" />
        )}

        <NavItem to="/consumptions" icon={<ClipboardDocumentListIcon />} label="Consumos por OT" />
        
        {(user?.role === UserRole.ADMIN || user?.role === UserRole.WAREHOUSE_MANAGER) && (
          <ReportGroup mainIcon={<ChartBarIcon />} mainLabel="Informes">
            <NavItem to="/reports/consumptions" icon={<ClipboardDocumentListIcon className="w-4 h-4"/>} label="Consumos" isSubItem={true} />
            <NavItem to="/reports/inventory-movements" icon={<CubeIcon className="w-4 h-4"/>} label="Movimientos Inv." isSubItem={true} />
            <NavItem to="/reports/stock-valuation" icon={<DocumentTextIcon className="w-4 h-4"/>} label="Valoración Stock" isSubItem={true} />
            <NavItem to="/reports/lead-time" icon={<ClockIcon className="w-4 h-4"/>} label="Tiempos de Ciclo" isSubItem={true} />
            <NavItem to="/reports/custom-builder" icon={<AdjustmentsVerticalIcon className="w-4 h-4"/>} label="Informe Personalizado" isSubItem={true} />
          </ReportGroup>
        )}
        
        {(user?.role === UserRole.ADMIN || user?.role === UserRole.WAREHOUSE_MANAGER) && (
            <NavItem to="/bulk-upload" icon={<ArrowUpTrayIcon />} label="Carga Masiva" />
        )}


        {user?.role === UserRole.ADMIN && (
          <>
            <div className="pt-4 mt-4 border-t border-neutral-200 dark:border-slate-700">
              <span className="px-4 text-xs font-semibold text-neutral-500 dark:text-slate-400 uppercase">Administración</span>
            </div>
            <NavItem to="/admin/users" icon={<UsersIcon />} label="Gestión de Usuarios" />
            <NavItem to="/admin/user-roles-description" icon={<BookOpenIcon />} label="Descripción de Roles" />
            <NavItem to="/admin/audit-log" icon={<BookOpenIcon />} label="Log de Auditoría" />
            <NavItem to="/admin/config" icon={<CogIcon />} label="Configuración" />
          </>
        )}
      </nav>
      <div className="p-4 border-t border-neutral-200 dark:border-slate-700">
        <p className="text-xs text-center text-neutral-500 dark:text-slate-400">© {new Date().getFullYear()} {config.companyName || APP_NAME}</p>
      </div>
    </div>
  );
};