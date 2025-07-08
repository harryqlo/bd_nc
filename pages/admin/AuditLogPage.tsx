
import React, { useState, useMemo } from 'react';
import { AuditLogEntry, TableColumn, UserRole } from '../../types';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Table } from '../../components/ui/Table';
import { Button } from '../../components/ui/Button'; 
import { XCircleIcon } from '../../constants';
import { useAuth } from '../../hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { MOCK_AUDIT_LOGS } from '../../constants';
import { downloadCSV } from '../../utils/exportUtils';

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'medium' });
};

const initialSpecificFilters = {
    fecha_from: '',
    fecha_to: '',
    usuario_filter: '',
    accion_filter: '',
};

const AuditLogPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [logs] = useState<AuditLogEntry[]>(MOCK_AUDIT_LOGS); 
  const [searchTerm, setSearchTerm] = useState(''); // For general detail search
  const [specificFilters, setSpecificFilters] = useState(initialSpecificFilters);


  if (currentUser?.role !== UserRole.ADMIN) {
    return <Navigate to="/" replace />;
  }

  const handleSpecificFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSpecificFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSpecificFilters(initialSpecificFilters);
  };

  const handleDownloadLog = () => {
    if (logs.length === 0) return;
    downloadCSV(logs, 'sistema_log.csv');
  };

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      // General search term (for detail field)
      const generalMatch = searchTerm === '' || log.detalle.toLowerCase().includes(searchTerm.toLowerCase());
      if (!generalMatch) return false;

      // Specific filters
      if (specificFilters.usuario_filter && !log.usuario.toLowerCase().includes(specificFilters.usuario_filter.toLowerCase())) return false;
      if (specificFilters.accion_filter && !log.accion.toLowerCase().includes(specificFilters.accion_filter.toLowerCase())) return false;
      
      const logDate = new Date(log.fecha);
      if (specificFilters.fecha_from && logDate < new Date(specificFilters.fecha_from)) return false;
      if (specificFilters.fecha_to && logDate > new Date(new Date(specificFilters.fecha_to).setHours(23,59,59,999))) return false; // Inclusive dateTo

      return true;
    }).sort((a,b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()); 
  }, [logs, searchTerm, specificFilters]);

  const columns: TableColumn<AuditLogEntry>[] = [
    { key: 'fecha', header: 'Fecha y Hora', render: item => formatDate(item.fecha), className: 'w-1/6 whitespace-nowrap' },
    { key: 'usuario', header: 'Usuario', className: 'w-1/6 font-medium' },
    { key: 'accion', header: 'Acción', className: 'w-1/6 text-blue-600' },
    { key: 'detalle', header: 'Detalle', className: 'w-3/6' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Log de Auditoría del Sistema</h1>
      
      <Card title="Filtros de Búsqueda">
        <div className="p-4 space-y-4">
            <Input
                type="text"
                placeholder="Buscar en Detalle del log..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-full"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Input label="Usuario" name="usuario_filter" value={specificFilters.usuario_filter} onChange={handleSpecificFilterChange} containerClassName="mb-0" placeholder="Filtrar por usuario..."/>
                <Input label="Acción" name="accion_filter" value={specificFilters.accion_filter} onChange={handleSpecificFilterChange} containerClassName="mb-0" placeholder="Filtrar por acción..."/>
                <Input label="Fecha Desde" type="date" name="fecha_from" value={specificFilters.fecha_from} onChange={handleSpecificFilterChange} containerClassName="mb-0" max={specificFilters.fecha_to}/>
                <Input label="Fecha Hasta" type="date" name="fecha_to" value={specificFilters.fecha_to} onChange={handleSpecificFilterChange} containerClassName="mb-0" min={specificFilters.fecha_from}/>
            </div>
        </div>
        <div className="px-4 py-3 bg-gray-50 border-t flex justify-end">
            <Button variant="ghost" onClick={handleResetFilters} leftIcon={<XCircleIcon className="w-4 h-4"/>}>Limpiar Filtros</Button>
        </div>
      </Card>

      <Card>
        <Table columns={columns} data={filteredLogs} keyExtractor={(item) => item.id} emptyMessage="No hay registros de auditoría que coincidan."/>
      </Card>

      <Card title="Visualización del Log Técnico del Sistema (Sistema.log)">
        <p className="text-gray-600">Esta sección permitiría ver las últimas N líneas del archivo <code>sistema.log</code>, descargarlo o aplicar filtros básicos.</p>
        <pre className="mt-4 p-4 bg-gray-800 text-gray-200 text-xs rounded-md overflow-x-auto h-64">
          {`INFO: 2024-07-25 10:30:00 - Auth: User 'admin' logged in successfully.
DEBUG: 2024-07-25 10:35:00 - DB: Executed query: UPDATE products SET ... WHERE sku = 'SKU001'
INFO: 2024-07-25 11:00:00 - Documents: Document 'F-12345' created. Stock updated for 2 items.
ERROR: 2024-07-25 11:05:00 - EmailService: Failed to send notification for low stock SKU005. Connection refused.
INFO: 2024-07-25 11:15:00 - Admin: User 'operador_nuevo' created.
WARN: 2024-07-25 11:20:00 - BulkUpload: File 'categorias_viejas.csv' contained 3 deprecated category IDs.`}
        </pre>
         <Button variant="outline" className="mt-4" onClick={handleDownloadLog}>Descargar sistema.log</Button>
      </Card>
    </div>
  );
};

export default AuditLogPage;