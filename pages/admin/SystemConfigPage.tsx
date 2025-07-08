
import React, { useState, ChangeEvent, FormEvent } from 'react';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Alert } from '../../components/ui/Alert';
import { ToggleSwitch } from '../../components/ui/ToggleSwitch';
import { Modal } from '../../components/ui/Modal';
import { useAuth } from '../../hooks/useAuth';
import { useConfig } from '../../contexts/ConfigContext'; 
import { UserRole, SystemConfig } from '../../types';
import { Navigate } from 'react-router-dom';
import { logAuditEntry, MOCK_PRODUCTS_FOR_CONSUMPTION, MOCK_PROVIDERS, MOCK_CATEGORIES, MOCK_CONSUMPTIONS, MOCK_DOCUMENTS, MOCK_WORK_ORDERS, MOCK_MATERIAL_REQUESTS, MOCK_USERS, MOCK_AUDIT_LOGS, MOCK_ADJUSTMENTS } from '../../constants';
import { logInfo } from '../../utils/logger';
import { downloadJSON, downloadCSV } from '../../utils/exportUtils';
import { MainContainer } from '../../components/layout/MainContainer';

const SystemConfigPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { config, setConfig: setGlobalConfig, resetConfig } = useConfig(); 
  
  const [localConfig, setLocalConfig] = useState<SystemConfig>(config);
  
  const [message, setMessage] = useState<{type: 'success' | 'error' | 'warning' | 'info', text: string} | null>(null);
  const [isLoading, setIsLoading] = useState(false); // Retain for visual feedback if needed, though operations are instant
  const [isSystemInfoModalOpen, setIsSystemInfoModalOpen] = useState(false);

  React.useEffect(() => {
    setLocalConfig(config);
  }, [config]);


  if (currentUser?.role !== UserRole.ADMIN) {
    return <Navigate to="/" replace />;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
     if (type === 'checkbox') { 
      const { checked } = e.target as HTMLInputElement;
       setLocalConfig(prev => ({ ...prev, [name]: checked }));
    } else {
       setLocalConfig(prev => ({ 
          ...prev, 
          [name]: (name === 'lowStockThresholdGeneral' || name === 'sessionTimeoutMinutes' || name === 'minPasswordLength') ? parseInt(value,10) || 0 : value 
      }));
    }
  };

  const handleToggleChange = (name: keyof SystemConfig, checked: boolean) => {
    setLocalConfig(prev => ({ ...prev, [name]: checked }));
  };

  const handleSaveConfig = (e: FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsLoading(true);
    setMessage(null);
    setGlobalConfig(localConfig); 
    logAuditEntry(currentUser.username, "CONFIG_SISTEMA_ACTUALIZADA", "Configuración del sistema guardada.");
    setMessage({ type: 'success', text: 'Configuración guardada exitosamente.' });
    setIsLoading(false);
  };

  const handleResetToDefaults = () => {
    if (!currentUser) return;
    if (window.confirm("¿Está seguro de que desea restablecer todas las configuraciones a sus valores predeterminados?")) {
      resetConfig(); 
      logAuditEntry(currentUser.username, "CONFIG_SISTEMA_RESETEADA", "Configuración del sistema restablecida a valores predeterminados.");
      setMessage({ type: 'warning', text: 'Configuración restablecida a los valores predeterminados.' });
    }
  };
  
  const handleBackupDB = () => {
    const backupData = {
      products: MOCK_PRODUCTS_FOR_CONSUMPTION,
      providers: MOCK_PROVIDERS,
      categories: MOCK_CATEGORIES,
      consumptions: MOCK_CONSUMPTIONS,
      documents: MOCK_DOCUMENTS,
      work_orders: MOCK_WORK_ORDERS,
      material_requests: MOCK_MATERIAL_REQUESTS,
      users: MOCK_USERS,
      audit_logs: MOCK_AUDIT_LOGS,
      adjustments: MOCK_ADJUSTMENTS,
      config: localConfig,
    };
    downloadJSON(backupData, `bodega_backup_${new Date().toISOString().slice(0,10)}.json`);
    setMessage({type: 'success', text: 'Copia de seguridad creada y descargada.'});
  };

  const handleExportData = (dataType: string) => {
     let data: any[] = [];
     if (dataType === 'Inventario') data = MOCK_PRODUCTS_FOR_CONSUMPTION;
     if (dataType === 'Documentos') data = MOCK_DOCUMENTS;
     if (data.length === 0) {
       setMessage({type: 'warning', text: `No hay datos para ${dataType}.`});
       return;
     }
     downloadCSV(data, `${dataType.toLowerCase()}.csv`);
     setMessage({type: 'success', text: `Datos de ${dataType} exportados.`});
  };

  const handleClearCache = () => {
    localStorage.clear();
    setMessage({ type: 'success', text: 'Caché de aplicación limpiada.' });
  }

  const handleRunDiagnostics = () => {
    const diagnostics = {
      products: MOCK_PRODUCTS_FOR_CONSUMPTION.length,
      providers: MOCK_PROVIDERS.length,
      categories: MOCK_CATEGORIES.length,
      documents: MOCK_DOCUMENTS.length,
      consumptions: MOCK_CONSUMPTIONS.length,
    };
    logInfo('Diagnostics:', diagnostics);
    setMessage({ type: 'success', text: 'Diagnóstico completado. Sistema OK.' });
  }
  
  const handleViewSystemInfo = () => setIsSystemInfoModalOpen(true);

  return (
    <MainContainer className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-slate-100">Configuración del Sistema</h1>

      {message && <Alert type={message.type} message={message.text} onClose={() => setMessage(null)} className="mb-4" />}

      <form onSubmit={handleSaveConfig}>
        <Card title="Parámetros Generales y Operacionales">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 p-4">
              <Input label="Nombre de la Empresa (para reportes)" name="companyName" value={localConfig.companyName} onChange={handleChange} />
              <Select label="Moneda por Defecto" name="defaultCurrency" value={localConfig.defaultCurrency} onChange={handleChange} options={[{value: 'CLP', label: 'CLP - Peso Chileno'}, {value: 'USD', label: 'USD - Dólar Americano'}]} />
              <Select label="Formato de Fecha por Defecto" name="defaultDateFormat" value={localConfig.defaultDateFormat} onChange={handleChange} options={[{value: 'dd/MM/yyyy', label: 'dd/MM/yyyy'}, {value: 'MM/dd/yyyy', label: 'MM/dd/yyyy'}, {value: 'yyyy-MM-dd', label: 'yyyy-MM-dd'}]} />
              <Input label="Umbral General de Stock Bajo (unidades)" name="lowStockThresholdGeneral" type="number" value={localConfig.lowStockThresholdGeneral.toString()} onChange={handleChange} min="0"/>
              <ToggleSwitch id="autoCreateOTEnabled" label="Habilitar creación automática de OT" checked={localConfig.autoCreateOTEnabled} onChange={(checked) => handleToggleChange('autoCreateOTEnabled', checked)} />
              <Input label="Prefijo por defecto para OT" name="defaultOTPrefix" value={localConfig.defaultOTPrefix} onChange={handleChange} disabled={!localConfig.autoCreateOTEnabled}/>
            </div>
        </Card>
        
        <Card title="Seguridad" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 p-4">
              <Input label="Tiempo de Sesión Inactiva (minutos)" name="sessionTimeoutMinutes" type="number" value={localConfig.sessionTimeoutMinutes.toString()} onChange={handleChange} min="5"/>
              <Input label="Longitud mínima de contraseña" name="minPasswordLength" type="number" value={localConfig.minPasswordLength.toString()} onChange={handleChange} min="6"/>
            </div>
        </Card>

        <Card title="Integraciones y Apariencia" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 p-4">
                <Input label="URL del Endpoint API Externo" name="externalApiEndpoint" value={localConfig.externalApiEndpoint || ''} onChange={handleChange} placeholder="https://api.externa.com/v1/"/>
                <Select label="Tema de la Interfaz" name="uiTheme" value={localConfig.uiTheme || 'Light'} onChange={handleChange} options={[{value: 'Light', label: 'Claro'}, {value: 'Dark', label: 'Oscuro'}]} />
            </div>
        </Card>
        
        <div className="p-4 mt-6 flex flex-col sm:flex-row justify-end sm:space-x-3 space-y-2 sm:space-y-0">
            <Button type="button" variant="outline" onClick={handleResetToDefaults} isLoading={isLoading} disabled={isLoading}>
                Restablecer Predeterminados
            </Button>
            <Button type="submit" isLoading={isLoading} disabled={isLoading}>
                {isLoading ? 'Guardando...' : 'Guardar Toda la Configuración'}
            </Button>
        </div>
      </form>
      
      <Card title="Utilidades del Sistema">
        <div className="p-4 space-y-4 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4">
            <div className="mb-4 md:mb-0">
                <h4 className="font-semibold text-gray-700 dark:text-slate-300 mb-2">Exportación de Datos</h4>
                <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-3">
                    <Button variant="outline" onClick={() => handleExportData('Inventario')} disabled={isLoading}>Inventario (CSV)</Button>
                    <Button variant="outline" onClick={() => handleExportData('Documentos')} disabled={isLoading}>Documentos (CSV)</Button>
                </div>
            </div>
             <div className="mb-4 md:mb-0">
                <h4 className="font-semibold text-gray-700 dark:text-slate-300 mb-2">Mantenimiento</h4>
                 <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-3">
                    <Button variant="secondary" onClick={handleBackupDB} disabled={isLoading}>Backup de BD</Button>
                    <Button variant="outline" onClick={handleClearCache} disabled={isLoading}>Limpiar Caché</Button>
                </div>
            </div>
             <div className="mb-4 md:mb-0">
                <h4 className="font-semibold text-gray-700 dark:text-slate-300 mb-2">Diagnóstico</h4>
                 <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-3">
                    <Button variant="outline" onClick={handleRunDiagnostics} disabled={isLoading}>Diagnóstico</Button>
                    <Button variant="outline" onClick={handleViewSystemInfo} disabled={isLoading}>Info. Sistema</Button>
                </div>
            </div>
        </div>
      </Card>

      <Modal isOpen={isSystemInfoModalOpen} onClose={() => setIsSystemInfoModalOpen(false)} title="Información del Sistema">
        <div className="text-sm space-y-2">
            <p><strong>Versión de Aplicación:</strong> 1.0.2-beta (XLSX Enabled)</p>
            <p><strong>Hora del Cliente:</strong> {new Date().toLocaleString('es-CL')}</p>
            <p><strong>Estado Base de Datos:</strong> Simulada (En memoria)</p>
            <p><strong>Entorno:</strong> Desarrollo Frontend</p>
            <p><strong>Configuración Cargada:</strong> {config.companyName}</p>
        </div>
        <div className="mt-4 flex justify-end">
            <Button onClick={() => setIsSystemInfoModalOpen(false)}>Cerrar</Button>
        </div>
      </Modal>
    </MainContainer>
  );
};

export default SystemConfigPage;
