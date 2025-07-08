
import React, { useState, useMemo } from 'react';
import { Product, Category, TableColumn, UserRole, Provider } from '../../types';
import { MOCK_PRODUCTS_FOR_CONSUMPTION, MOCK_CATEGORIES, getCategoryNameById, MOCK_PROVIDERS, XCircleIcon } from '../../constants';
import { Card } from '../../components/ui/Card';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import { Alert } from '../../components/ui/Alert';
import { useAuth } from '../../hooks/useAuth';
import { Navigate } from 'react-router-dom';

const formatCurrency = (value: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value);

interface ValuedProduct extends Product {
  categoria_nombre: string;
  valor_total_item: number;
}

const initialFilters = {
    selectedCategoryId: '',
    selectedProviderId: '',
};

const InformeValoracionStockPage: React.FC = () => {
  const { user } = useAuth();
  const [filters, setFilters] = useState(initialFilters);
  const [alertMessage, setAlertMessage] = useState<{type: 'info', message: string} | null>(null);
  
  if (user?.role !== UserRole.ADMIN && user?.role !== UserRole.WAREHOUSE_MANAGER) {
    return <Navigate to="/" replace />;
  }
  
  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleResetFilters = () => {
    setFilters(initialFilters);
  };

  const valuedProductsData = useMemo((): ValuedProduct[] => {
    return MOCK_PRODUCTS_FOR_CONSUMPTION.map(product => ({
      ...product,
      categoria_nombre: getCategoryNameById(product.categoria_id),
      valor_total_item: product.stock_actual * product.valor_promedio,
    }));
  }, []);

  const filteredData = useMemo(() => {
    return valuedProductsData.filter(p => {
        if (filters.selectedCategoryId && p.categoria_id !== filters.selectedCategoryId) return false;
        if (filters.selectedProviderId && p.proveedor_predeterminado !== filters.selectedProviderId) return false;
        return true;
    });
  }, [valuedProductsData, filters]);

  const grandTotalValorInventario = filteredData.reduce((sum, item) => sum + item.valor_total_item, 0);

  const columns: TableColumn<ValuedProduct>[] = [
    { key: 'sku', header: 'SKU', className: 'font-semibold' },
    { key: 'nombre', header: 'Producto' },
    { key: 'categoria_nombre', header: 'Categoría' },
    { key: 'stock_actual', header: 'Stock Actual', render: item => `${item.stock_actual} ${item.un_medida}`},
    { key: 'valor_promedio', header: 'Costo Prom. (CLP)', render: item => formatCurrency(item.valor_promedio) },
    { key: 'valor_total_item', header: 'Valor Total Item (CLP)', render: item => formatCurrency(item.valor_total_item) },
    { key: 'proveedor_predeterminado', header: 'Proveedor Pred.', render: item => MOCK_PROVIDERS.find(p => p.id === item.proveedor_predeterminado)?.nombre || 'N/A', className: 'hidden md:table-cell'},
  ];

  const categoryOptions = [{ value: '', label: 'Todas las Categorías' }, ...MOCK_CATEGORIES.map(c => ({ value: c.id, label: c.nombre }))];
  const providerOptions = [{ value: '', label: 'Todos los Proveedores' }, ...MOCK_PROVIDERS.map(p => ({ value: p.id, label: p.nombre }))];


  const handleExport = (format: 'csv' | 'pdf' | 'excel') => {
     setAlertMessage({type: 'info', message: `Exportando datos a ${format.toUpperCase()}...`});
     console.log(`Exporting Stock Valuation to ${format.toUpperCase()}:`, filteredData);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Informe de Valoración de Stock</h1>
      {alertMessage && <Alert type={alertMessage.type} message={alertMessage.message} onClose={() => setAlertMessage(null)}/>}
      <Card title="Filtros del Informe">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
          <Select label="Categoría" name="selectedCategoryId" value={filters.selectedCategoryId} onChange={handleFilterChange} options={categoryOptions} />
          <Select label="Proveedor Predeterminado" name="selectedProviderId" value={filters.selectedProviderId} onChange={handleFilterChange} options={providerOptions} />
        </div>
        <div className="px-4 py-3 bg-gray-50 border-t flex justify-end">
            <Button variant="ghost" onClick={handleResetFilters} leftIcon={<XCircleIcon className="w-4 h-4"/>}>Limpiar Filtros</Button>
        </div>
      </Card>

      <Card>
        <div className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <p className="text-lg"><strong>Valor Total del Inventario Filtrado:</strong> <span className="font-bold text-xl">{formatCurrency(grandTotalValorInventario)}</span></p>
          </div>
          <div className="flex space-x-2">
            <Button onClick={() => handleExport('csv')} variant="outline" size="sm">Exportar CSV</Button>
            <Button onClick={() => handleExport('pdf')} variant="outline" size="sm">Exportar PDF</Button>
            <Button onClick={() => handleExport('excel')} variant="outline" size="sm">Exportar Excel</Button>
          </div>
        </div>
        <Table columns={columns} data={filteredData} keyExtractor={item => item.id} emptyMessage="No hay productos que coincidan con los filtros." />
      </Card>
    </div>
  );
};

export default InformeValoracionStockPage;
