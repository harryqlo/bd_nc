
import React, { useState, useMemo } from 'react';
import { Card } from '../../components/ui/Card';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { Input } from '../../components/ui/Input';
import { UserRole } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { MOCK_PRODUCTS_FOR_CONSUMPTION, MOCK_CONSUMPTIONS, MOCK_DOCUMENTS, MOCK_PROVIDERS, MOCK_SOLICITANTES } from '../../constants';
import { Table } from '../../components/ui/Table';
import { TableColumn } from '../../types';


const InformePersonalizadoPage: React.FC = () => {
  const { user } = useAuth();
  const [dataSource, setDataSource] = useState('');
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [filters, setFilters] = useState<{ field: string; operator: string; value: string }[]>([]);
  const [sortField, setSortField] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  const [alertMessage, setAlertMessage] = useState<{ type: 'info' | 'success' | 'error', message: string } | null>(null);
  const [reportData, setReportData] = useState<any[]>([]);
  const [reportColumns, setReportColumns] = useState<TableColumn<any>[]>([]);


  if (user?.role !== UserRole.ADMIN && user?.role !== UserRole.WAREHOUSE_MANAGER) {
    return <Navigate to="/" replace />;
  }

  const allDataSources: Record<string, any[]> = {
    productos: MOCK_PRODUCTS_FOR_CONSUMPTION,
    consumos: MOCK_CONSUMPTIONS, // Note: This is header level, might need detailed items
    documentos_ingreso: MOCK_DOCUMENTS,
    proveedores: MOCK_PROVIDERS,
    solicitantes: MOCK_SOLICITANTES,
  };
  
  const getFieldLabel = (ds: string, fieldName: string): string => {
      const options = availableFieldsOptions(ds);
      return options.find(opt => opt.value === fieldName)?.label || fieldName;
  }

  const dataSourceOptions = [
    { value: '', label: 'Seleccione fuente...' },
    { value: 'productos', label: 'Productos' },
    { value: 'consumos', label: 'Consumos (Encabezado)' }, 
    { value: 'documentos_ingreso', label: 'Documentos de Ingreso (Encabezado)' },
    { value: 'proveedores', label: 'Proveedores' },
    { value: 'solicitantes', label: 'Solicitantes' },
  ];

  const availableFieldsOptions = (ds: string) => {
    switch (ds) {
      case 'productos':
        return Object.keys(MOCK_PRODUCTS_FOR_CONSUMPTION[0] || {}).map(k => ({value: k, label: k}));
      case 'consumos':
        return Object.keys(MOCK_CONSUMPTIONS[0] || {}).map(k => ({value: k, label: k}));
      case 'documentos_ingreso':
        return Object.keys(MOCK_DOCUMENTS[0] || {}).map(k => ({value: k, label: k}));
      case 'proveedores':
        return Object.keys(MOCK_PROVIDERS[0] || {}).map(k => ({value: k, label: k}));
      case 'solicitantes':
        return Object.keys(MOCK_SOLICITANTES[0] || {}).map(k => ({value: k, label: k}));
      default:
        return [];
    }
  };
  
  const handleFieldSelection = (fieldName: string) => {
    setSelectedFields(prev => 
        prev.includes(fieldName) ? prev.filter(f => f !== fieldName) : [...prev, fieldName]
    );
    setReportData([]); // Clear previous report on field change
  };
  
  const addFilter = () => setFilters(prev => [...prev, { field: '', operator: 'equals', value: '' }]);
  const removeFilter = (index: number) => setFilters(prev => prev.filter((_, i) => i !== index));
  const handleFilterChange = (index: number, part: 'field' | 'operator' | 'value', value: string) => {
    const newFilters = [...filters];
    newFilters[index][part] = value;
    setFilters(newFilters);
    setReportData([]); // Clear previous report on filter change
  };

  const handleGenerateReport = () => {
    if (!dataSource) {
        setAlertMessage({ type: 'error', message: 'Por favor, seleccione una fuente de datos.' });
        return;
    }
    if (selectedFields.length === 0) {
        setAlertMessage({ type: 'error', message: 'Por favor, seleccione al menos un campo para mostrar.' });
        return;
    }
    setAlertMessage({ type: 'info', message: 'Generando informe personalizado...' });

    let data = [...(allDataSources[dataSource] || [])];

    // Apply filters
    filters.forEach(filter => {
        if (filter.field && filter.value) {
            data = data.filter(item => {
                const itemValue = item[filter.field]?.toString().toLowerCase();
                const filterValue = filter.value.toLowerCase();
                switch (filter.operator) {
                    case 'equals': return itemValue === filterValue;
                    case 'contains': return itemValue?.includes(filterValue);
                    case '>': return parseFloat(itemValue) > parseFloat(filterValue);
                    case '<': return parseFloat(itemValue) < parseFloat(filterValue);
                    case '>=': return parseFloat(itemValue) >= parseFloat(filterValue);
                    case '<=': return parseFloat(itemValue) <= parseFloat(filterValue);
                    default: return true;
                }
            });
        }
    });

    // Apply sorting
    if (sortField) {
        data.sort((a, b) => {
            const valA = a[sortField];
            const valB = b[sortField];
            if (typeof valA === 'number' && typeof valB === 'number') {
                return sortOrder === 'asc' ? valA - valB : valB - valA;
            }
            if (typeof valA === 'string' && typeof valB === 'string') {
                return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
            }
            return 0;
        });
    }
    
    const generatedColumns: TableColumn<any>[] = selectedFields.map(fieldKey => ({
        key: fieldKey,
        header: getFieldLabel(dataSource, fieldKey),
        render: (item: any) => {
            const value = item[fieldKey];
            if (typeof value === 'object' && value !== null) {
                return JSON.stringify(value).substring(0,50) + (JSON.stringify(value).length > 50 ? '...' : ''); // Preview for objects/arrays
            }
            return value?.toString() ?? 'N/A';
        }
    }));

    setReportColumns(generatedColumns);
    setReportData(data.slice(0, 50)); // Display first 50 rows as preview
    setAlertMessage({ type: 'success', message: `Vista previa del informe generada. Mostrando ${data.slice(0,50).length} de ${data.length} registros.` });
  };
  
  const handleExport = (format: 'csv' | 'pdf' | 'excel') => {
    if (reportData.length === 0) {
      setAlertMessage({ type: 'error', message: 'Genere el informe antes de exportar.'});
      return;
    }
    setAlertMessage({ type: 'info', message: `Exportando informe a ${format.toUpperCase()}... (Simulado)` });
    console.log("Exporting Report Data:", { dataSource, selectedFields, filters, sortField, sortOrder, data: reportData });
  };


  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-slate-100">Creador de Informes Personalizados</h1>
      {alertMessage && <Alert type={alertMessage.type} message={alertMessage.message} onClose={() => setAlertMessage(null)} />}

      <Card title="1. Definición del Informe">
        <div className="p-4 space-y-6">
          <Select label="Fuente de Datos Principal" value={dataSource} onChange={(e) => {setDataSource(e.target.value); setSelectedFields([]); setFilters([]); setReportData([]); setReportColumns([]);}} options={dataSourceOptions} />

          {dataSource && (
            <div>
              <h3 className="text-md font-semibold mb-2 text-gray-700 dark:text-slate-300">Campos a Incluir (Columnas)</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-2 border dark:border-slate-700 rounded">
                {availableFieldsOptions(dataSource).map(field => (
                  <label key={field.value} className="flex items-center space-x-2 p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded cursor-pointer">
                    <input type="checkbox" checked={selectedFields.includes(field.value)} onChange={() => handleFieldSelection(field.value)} className="form-checkbox h-4 w-4 text-primary rounded focus:ring-primary-dark" />
                    <span className="text-sm text-gray-700 dark:text-slate-300">{field.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {dataSource && (
        <Card title="2. Filtros, Ordenamiento y Agrupación (Opcional)" className="mt-6">
            <div className="p-4 space-y-6">
                <div>
                    <h3 className="text-md font-semibold mb-2 flex justify-between items-center text-gray-700 dark:text-slate-300">
                        Filtros Dinámicos
                        <Button type="button" size="sm" variant="outline" onClick={addFilter} leftIcon={<span className="text-xs">+</span>}>Añadir Filtro</Button>
                    </h3>
                    {filters.map((filter, index) => (
                        <div key={index} className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-end mb-2 p-2 border-b dark:border-slate-700/50 border-gray-100">
                             <Select label={`Campo Filtro ${index+1}`} value={filter.field} onChange={(e) => handleFilterChange(index, 'field', e.target.value)} options={[{value: '', label:'Seleccione'}, ...availableFieldsOptions(dataSource)]} containerClassName="mb-0"/>
                             <Select label="Operador" value={filter.operator} onChange={(e) => handleFilterChange(index, 'operator', e.target.value)} options={[{value:'equals', label:'Igual a'}, {value:'contains', label:'Contiene'}, {value:'>', label:'>'}, {value:'<', label:'<'}, {value:'>=', label:'>='}, {value:'<=', label:'<='}]} containerClassName="mb-0"/>
                             <Input label="Valor" value={filter.value} onChange={(e) => handleFilterChange(index, 'value', e.target.value)} containerClassName="mb-0 sm:col-span-1"/>
                             <Button type="button" variant="danger" size="sm" onClick={() => removeFilter(index)} className="mb-1 h-9">Quitar</Button>
                        </div>
                    ))}
                </div>
                 <div>
                    <h3 className="text-md font-semibold mb-2 text-gray-700 dark:text-slate-300">Ordenamiento</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Select label="Ordenar Por Campo" value={sortField} onChange={(e) => setSortField(e.target.value)} options={[{value: '', label:'Ninguno'}, ...selectedFields.map(sf => ({value: sf, label: getFieldLabel(dataSource, sf)}))]} />
                        <Select label="Dirección" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} options={[{value:'asc', label:'Ascendente'}, {value:'desc', label:'Descendente'}]} />
                    </div>
                </div>
                 <p className="text-sm text-gray-500 dark:text-slate-400">Próximamente: Agrupación por campos y cálculos de resumen (SUM, AVG, COUNT).</p>
            </div>
        </Card>
      )}

      <div className="flex justify-center mt-8 space-x-3">
        <Button onClick={handleGenerateReport} size="lg" disabled={!dataSource || selectedFields.length === 0}>
          Generar Vista Previa del Informe
        </Button>
      </div>

      <Card title="3. Vista Previa del Informe" className="mt-6">
        <div className="p-4">
          {reportData.length > 0 && reportColumns.length > 0 ? (
            <Table 
                columns={reportColumns} 
                data={reportData} 
                keyExtractor={(item: any) => item.id ?? `report-row-${Math.random().toString(36).substring(2, 9)}`}
            />
          ) : (
            <p className="text-gray-600 dark:text-slate-400 mb-2">Configure y genere el informe para ver la vista previa aquí.</p>
          )}
           <div className="p-4 flex justify-end space-x-2 mt-4">
            <Button onClick={() => handleExport('csv')} variant="outline" size="sm" disabled={reportData.length === 0}>Exportar CSV</Button>
            <Button onClick={() => handleExport('pdf')} variant="outline" size="sm" disabled={reportData.length === 0}>Exportar PDF</Button>
            <Button onClick={() => handleExport('excel')} variant="outline" size="sm" disabled={reportData.length === 0}>Exportar Excel</Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

InformePersonalizadoPage.displayName = 'InformePersonalizadoPage';

export default InformePersonalizadoPage;
