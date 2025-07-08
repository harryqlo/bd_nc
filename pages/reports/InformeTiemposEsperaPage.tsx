
import React, { useState, useMemo } from 'react';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import { Alert } from '../../components/ui/Alert';
import { TableColumn, UserRole, Provider, DocumentHeader, WorkOrder } from '../../types'; // Added DocumentHeader, WorkOrder
import { useAuth } from '../../hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { MOCK_PROVIDERS, MOCK_DOCUMENTS, MOCK_WORK_ORDERS, XCircleIcon } from '../../constants';
import { downloadCSV, downloadExcel, downloadPDF } from '../../utils/exportUtils';
import { MainContainer } from '../../components/layout/MainContainer';


interface MockLeadTimeData {
  id: string;
  referencia: string; 
  tipo: string; 
  fecha_inicio: string;
  fecha_fin: string;
  duracion_dias: number;
  detalle_extra?: string;
  proveedor_id?: string; 
}

const formatDate = (dateString?: string) => dateString ? new Date(dateString).toLocaleDateString('es-CL') : 'N/A';
const calculateDaysBetween = (dateStr1: string, dateStr2: string): number => {
    const date1 = new Date(dateStr1);
    const date2 = new Date(dateStr2);
    if (isNaN(date1.getTime()) || isNaN(date2.getTime())) return 0;
    const diffTime = Math.abs(date2.getTime() - date1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
}


const initialFilters = {
    dateFrom: '',
    dateTo: '',
    tipoAnalisis: 'proveedor',
    specificProviderId: '',
};

const InformeTiemposEsperaPage: React.FC = () => {
  const { user } = useAuth();
  const [filters, setFilters] = useState(initialFilters);
  const [alertMessage, setAlertMessage] = useState<{ type: 'info', message: string } | null>(null);

  if (user?.role !== UserRole.ADMIN && user?.role !== UserRole.WAREHOUSE_MANAGER) {
    return <Navigate to="/" replace />;
  }

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ 
        ...prev, 
        [name]: value,
        ...(name === 'tipoAnalisis' && value !== 'proveedor' && { specificProviderId: '' }) 
    }));
  };
  
  const handleResetFilters = () => {
    setFilters(initialFilters);
  };

  const mockData: MockLeadTimeData[] = useMemo(() => {
    const data: MockLeadTimeData[] = [];

    // Tiempo de Entrega Proveedores from MOCK_DOCUMENTS
    MOCK_DOCUMENTS.forEach(doc => {
        if (doc.fecha_emision && doc.fecha_recepcion) {
            data.push({
                id: `doc-lt-${doc.id}`,
                referencia: doc.numero_documento,
                tipo: 'proveedor',
                fecha_inicio: doc.fecha_emision,
                fecha_fin: doc.fecha_recepcion,
                duracion_dias: calculateDaysBetween(doc.fecha_emision, doc.fecha_recepcion),
                detalle_extra: `Proveedor: ${doc.proveedor_nombre || 'N/A'}`,
                proveedor_id: doc.proveedor_id,
            });
        }
    });

    // Duración Órdenes de Trabajo from MOCK_WORK_ORDERS
    MOCK_WORK_ORDERS.forEach(wo => {
        if (wo.estado === 'Cerrada' && wo.fecha_creacion) {
            // Simulate a closure date for demo: creation date + random days (e.g., 2 to 15 days)
            const simulatedClosureDate = new Date(wo.fecha_creacion);
            simulatedClosureDate.setDate(simulatedClosureDate.getDate() + (Math.floor(Math.random() * 14) + 2));
            const fechaFinSimulada = simulatedClosureDate.toISOString().split('T')[0];

            data.push({
                id: `ot-lt-${wo.id}`,
                referencia: wo.numero_ot,
                tipo: 'ot',
                fecha_inicio: wo.fecha_creacion,
                fecha_fin: fechaFinSimulada,
                duracion_dias: calculateDaysBetween(wo.fecha_creacion, fechaFinSimulada),
                detalle_extra: wo.descripcion || 'Sin descripción',
            });
        }
    });
    
    return data.sort((a,b) => new Date(b.fecha_fin).getTime() - new Date(a.fecha_fin).getTime());
  }, []); // Recalculate if MOCK_DOCUMENTS or MOCK_WORK_ORDERS change (though they are constants here, for real data this would be deps)
  
  const filteredData = useMemo(() => {
    return mockData.filter(d => {
        if (d.tipo.toLowerCase() !== filters.tipoAnalisis.toLowerCase()) return false; 
        const startDate = new Date(d.fecha_inicio);
        const endDate = new Date(d.fecha_fin);
        if(filters.dateFrom && startDate < new Date(filters.dateFrom)) return false;
        // Adjust dateTo to be inclusive of the selected day by setting time to end of day
        if(filters.dateTo) {
            const toDate = new Date(filters.dateTo);
            toDate.setHours(23, 59, 59, 999);
            if(endDate > toDate) return false;
        }
        if(filters.tipoAnalisis === 'proveedor' && filters.specificProviderId && d.proveedor_id !== filters.specificProviderId) return false;
        return true;
    });
  }, [filters, mockData]);


  const columns: TableColumn<MockLeadTimeData>[] = [
    { key: 'referencia', header: 'Referencia (OT/Doc)' },
    { key: 'tipo', header: 'Tipo de Análisis' },
    { key: 'fecha_inicio', header: 'Fecha Inicio', render: item => formatDate(item.fecha_inicio) },
    { key: 'fecha_fin', header: 'Fecha Fin', render: item => formatDate(item.fecha_fin) },
    { key: 'duracion_dias', header: 'Duración (Días)', render: item => `${item.duracion_dias} días` },
    { key: 'detalle_extra', header: 'Detalle Adicional', className: 'text-xs max-w-md truncate' },
  ];

  const tipoAnalisisOptions = [
    { value: 'proveedor', label: 'Tiempo de Entrega Proveedores' },
    { value: 'ot', label: 'Duración Órdenes de Trabajo' },
  ];

  const providerOptions = [{value: '', label: 'Todos los Proveedores'}, ...MOCK_PROVIDERS.map(p => ({value: p.id, label:p.nombre}))];

  const handleExport = (format: 'csv' | 'pdf' | 'excel') => {
    if (filteredData.length === 0) {
      setAlertMessage({ type: 'warning', message: 'No hay datos para exportar.' });
      return;
    }
    if (format === 'csv') downloadCSV(filteredData, 'informe_tiempos.csv');
    if (format === 'excel') downloadExcel(filteredData, 'informe_tiempos.xlsx');
    if (format === 'pdf') downloadPDF(filteredData, 'Informe de Tiempos');
    setAlertMessage({ type: 'success', message: `Datos exportados a ${format.toUpperCase()}.` });
  };

  return (
    <MainContainer className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-slate-100">Informe de Tiempos de Ciclo/Espera</h1>
      {alertMessage && <Alert type={alertMessage.type} message={alertMessage.message} onClose={() => setAlertMessage(null)} />}
      
      <Card title="Configuración del Informe">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
          <Select label="Tipo de Análisis" name="tipoAnalisis" value={filters.tipoAnalisis} onChange={handleFilterChange} options={tipoAnalisisOptions} />
          <Input label="Fecha Inicio Proceso Desde" type="date" name="dateFrom" value={filters.dateFrom} onChange={handleFilterChange} max={filters.dateTo}/>
          <Input label="Fecha Fin Proceso Hasta" type="date" name="dateTo" value={filters.dateTo} onChange={handleFilterChange} min={filters.dateFrom} />
          {filters.tipoAnalisis === 'proveedor' && (
            <Select label="Proveedor Específico" name="specificProviderId" value={filters.specificProviderId} onChange={handleFilterChange} options={providerOptions} />
          )}
        </div>
        <div className="px-4 py-3 bg-gray-50 dark:bg-slate-700/50 border-t dark:border-slate-700 flex justify-end">
            <Button variant="ghost" onClick={handleResetFilters} leftIcon={<XCircleIcon className="w-4 h-4"/>}>Limpiar Filtros</Button>
        </div>
        <div className="p-4">
            <p className="text-sm text-gray-600 dark:text-slate-300">
                Este informe analiza la duración entre dos puntos de un proceso.
                <br/>- **Tiempo de Entrega Proveedores:** Diferencia entre Fecha Emisión y Fecha Recepción de documentos de ingreso.
                <br/>- **Duración Órdenes de Trabajo:** Diferencia entre Fecha Creación y Fecha Cierre (simulada para OTs 'Cerrada').
            </p>
        </div>
      </Card>

      <Card>
        <div className="p-4 flex justify-end space-x-2">
            <Button onClick={() => handleExport('csv')} variant="outline" size="sm">Exportar CSV</Button>
            <Button onClick={() => handleExport('pdf')} variant="outline" size="sm">Exportar PDF</Button>
            <Button onClick={() => handleExport('excel')} variant="outline" size="sm">Exportar Excel</Button>
        </div>
        <Table columns={columns} data={filteredData} keyExtractor={item => item.id} emptyMessage="No hay datos para el análisis seleccionado o filtros aplicados." />
      </Card>
    </MainContainer>
  );
};

export default InformeTiemposEsperaPage;