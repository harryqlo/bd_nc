
import React, { useState, useMemo } from 'react';
import { Consumption, Product, Solicitante, WorkOrder, TableColumn, UserRole, Category, User } from '../../types';
import { MOCK_CONSUMPTIONS, MOCK_PRODUCTS_FOR_CONSUMPTION, MOCK_SOLICITANTES, MOCK_WORK_ORDERS, MOCK_CATEGORIES, getCategoryNameById, MOCK_USERS, XCircleIcon } from '../../constants';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import { Alert } from '../../components/ui/Alert';
import { logInfo } from '../../utils/logger';
import { useAuth } from '../../hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { MainContainer } from '../../components/layout/MainContainer';
import { logger } from '../../utils/logger';

const formatCurrency = (value: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value);
const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('es-CL');

interface DetailedConsumptionItem extends Consumption {
    consumo_id: string;
    item_id: string;
    producto_sku: string;
    producto_nombre: string;
    categoria_producto_nombre: string;
    cantidad_consumida_item: number;
    valor_unitario_item: number;
    valor_total_item: number;
    un_medida_item: string;
}

const initialFilters = {
    dateFrom: '',
    dateTo: '',
    otNumber: '',
    solicitanteId: '',
    productId: '',
    categoryId: '',
    responsableId: '',
};

const InformeConsumosPage: React.FC = () => {
  const { user } = useAuth();
  const [filters, setFilters] = useState(initialFilters);
  const [alertMessage, setAlertMessage] = useState<{type: 'info', message: string} | null>(null);

  if (user?.role !== UserRole.ADMIN && user?.role !== UserRole.WAREHOUSE_MANAGER) {
    return <Navigate to="/" replace />;
  }

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };
  
  const handleResetFilters = () => {
    setFilters(initialFilters);
  };

  const detailedConsumptions = useMemo((): DetailedConsumptionItem[] => {
    return MOCK_CONSUMPTIONS.flatMap(consumption => 
      consumption.items.map(item => {
        const product = MOCK_PRODUCTS_FOR_CONSUMPTION.find(p => p.sku === item.product_sku);
        const categoryName = product ? getCategoryNameById(product.categoria_id) : 'N/A';
        return {
          ...consumption, 
          consumo_id: consumption.id,
          item_id: item.id || item.product_sku,
          producto_sku: item.product_sku,
          producto_nombre: product?.nombre || item.product_nombre || 'N/A',
          categoria_producto_nombre: categoryName,
          cantidad_consumida_item: item.cantidad_consumida,
          valor_unitario_item: product?.valor_promedio || 0,
          valor_total_item: item.cantidad_consumida * (product?.valor_promedio || 0),
          un_medida_item: product?.un_medida || item.un_medida || 'N/A',
        };
      })
    );
  }, []);


  const filteredData = useMemo(() => {
    return detailedConsumptions.filter(c => {
      const consumoDate = new Date(c.fecha_consumo);
      if (filters.dateFrom && consumoDate < new Date(filters.dateFrom)) return false;
      if (filters.dateTo && consumoDate > new Date(new Date(filters.dateTo).setDate(new Date(filters.dateTo).getDate() + 1))) return false; 
      if (filters.otNumber && !c.numero_ot.toLowerCase().includes(filters.otNumber.toLowerCase())) return false;
      if (filters.solicitanteId && c.solicitante_id !== filters.solicitanteId) return false;
      if (filters.productId && c.producto_sku !== filters.productId) return false;
      if (filters.responsableId && c.usuario_responsable_id !== filters.responsableId) return false;
      if (filters.categoryId) {
        const product = MOCK_PRODUCTS_FOR_CONSUMPTION.find(p => p.sku === c.producto_sku);
        if (!product || product.categoria_id !== filters.categoryId) return false;
      }
      return true;
    });
  }, [detailedConsumptions, filters]);

  const totalItemsConsumidos = filteredData.reduce((sum, item) => sum + item.cantidad_consumida_item, 0);
  const totalValorConsumido = filteredData.reduce((sum, item) => sum + item.valor_total_item, 0);

  const columns: TableColumn<DetailedConsumptionItem>[] = [
    { key: 'numero_ot', header: 'N° OT', className: 'font-semibold' },
    { key: 'fecha_consumo', header: 'Fecha', render: item => formatDate(item.fecha_consumo) },
    { key: 'producto_sku', header: 'SKU' },
    { key: 'producto_nombre', header: 'Producto' },
    { key: 'categoria_producto_nombre', header: 'Categoría' },
    { key: 'cantidad_consumida_item', header: 'Cantidad', render: item => `${item.cantidad_consumida_item} ${item.un_medida_item}` },
    { key: 'valor_unitario_item', header: 'Valor Unit. (CLP)', render: item => formatCurrency(item.valor_unitario_item) },
    { key: 'valor_total_item', header: 'Valor Total (CLP)', render: item => formatCurrency(item.valor_total_item) },
    { key: 'solicitante_nombre', header: 'Solicitante' },
    { key: 'usuario_responsable_nombre', header: 'Registrado Por' },
  ];

  const solicitanteOptions = [{ value: '', label: 'Todos' }, ...MOCK_SOLICITANTES.map(s => ({ value: s.id, label: s.nombre_completo }))];
  const productOptions = [{ value: '', label: 'Todos' }, ...MOCK_PRODUCTS_FOR_CONSUMPTION.map(p => ({ value: p.sku, label: `${p.sku} - ${p.nombre}` }))];
  const categoryOptions = [{ value: '', label: 'Todas' }, ...MOCK_CATEGORIES.map(cat => ({ value: cat.id, label: cat.nombre }))];
  const responsableOptions = [{ value: '', label: 'Todos' }, ...MOCK_USERS.map(u => ({ value: u.id, label: u.username }))];


  const handleExport = (format: 'csv' | 'pdf' | 'excel') => {
    setAlertMessage({type: 'info', message: `Exportando datos a ${format.toUpperCase()}...`});
    // In a real app, this would trigger a file download with the filteredData
codex/revisar-y-reemplazar-console.log
    logInfo(`Exporting Consumptions to ${format.toUpperCase()}:`, filteredData);

    logger.log(`Exporting Consumptions to ${format.toUpperCase()}:`, filteredData);
main
  };

  return (
    <MainContainer className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Informe de Consumos</h1>
      {alertMessage && <Alert type={alertMessage.type} message={alertMessage.message} onClose={() => setAlertMessage(null)}/>}
      <Card title="Filtros del Informe">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
          <Input label="Fecha Desde" type="date" name="dateFrom" value={filters.dateFrom} onChange={handleFilterChange} max={filters.dateTo}/>
          <Input label="Fecha Hasta" type="date" name="dateTo" value={filters.dateTo} onChange={handleFilterChange} min={filters.dateFrom} />
          <Input label="Número de OT" name="otNumber" value={filters.otNumber} onChange={handleFilterChange} placeholder="Ej: OT.12345"/>
          <Select label="Solicitante" name="solicitanteId" value={filters.solicitanteId} onChange={handleFilterChange} options={solicitanteOptions} />
          <Select label="Producto (SKU)" name="productId" value={filters.productId} onChange={handleFilterChange} options={productOptions} />
          <Select label="Categoría Producto" name="categoryId" value={filters.categoryId} onChange={handleFilterChange} options={categoryOptions} />
          <Select label="Registrado Por" name="responsableId" value={filters.responsableId} onChange={handleFilterChange} options={responsableOptions} />
        </div>
        <div className="px-4 py-3 bg-gray-50 border-t flex justify-end">
            <Button variant="ghost" onClick={handleResetFilters} leftIcon={<XCircleIcon className="w-4 h-4"/>}>Limpiar Filtros</Button>
        </div>
      </Card>

      <Card>
        <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <p><strong>Total Items Consumidos:</strong> {totalItemsConsumidos.toLocaleString('es-CL')}</p>
            <p><strong>Valor Total Consumido:</strong> {formatCurrency(totalValorConsumido)}</p>
          </div>
          <div className="flex space-x-2">
            <Button onClick={() => handleExport('csv')} variant="outline" size="sm">Exportar CSV</Button>
            <Button onClick={() => handleExport('pdf')} variant="outline" size="sm">Exportar PDF</Button>
            <Button onClick={() => handleExport('excel')} variant="outline" size="sm">Exportar Excel</Button>
          </div>
        </div>
        <Table columns={columns} data={filteredData} keyExtractor={item => `${item.consumo_id}-${item.item_id}`} emptyMessage="No hay consumos que coincidan con los filtros." />
      </Card>
    </MainContainer>
  );
};

export default InformeConsumosPage;
