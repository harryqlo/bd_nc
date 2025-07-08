
import React, { useState, useMemo } from 'react';
import { UnifiedInventoryMovement, MovementType, TableColumn, UserRole, Product } from '../../types';
import { MOCK_DOCUMENTS, MOCK_CONSUMPTIONS, MOCK_ADJUSTMENTS, MOCK_PRODUCTS_FOR_CONSUMPTION, MOCK_USERS, MOCK_PROVIDERS, MOCK_SOLICITANTES, XCircleIcon } from '../../constants';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import { Alert } from '../../components/ui/Alert';
import { useAuth } from '../../hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { MainContainer } from '../../components/layout/MainContainer';
import { logger } from '../../utils/logger';

const formatCurrency = (value: number | undefined) => value ? new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value) : 'N/A';
const formatDate = (dateString: string) => new Date(dateString).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'medium' });

const initialFilters = {
    dateFrom: '',
    dateTo: '',
    movementType: '',
    productId: '',
    involvedParty: '', 
};


const InformeMovimientosPage: React.FC = () => {
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

  const unifiedMovementsData = useMemo((): UnifiedInventoryMovement[] => {
    const movements: UnifiedInventoryMovement[] = [];

    MOCK_DOCUMENTS.forEach(doc => {
      doc.detalles.forEach(detail => {
        const product = MOCK_PRODUCTS_FOR_CONSUMPTION.find(p => p.sku === detail.sku);
        movements.push({
          id: `DOC-${doc.id}-${detail.sku}`,
          fecha: doc.fecha_recepcion,
          sku: detail.sku,
          product_nombre: product?.nombre || detail.nombre_producto || 'N/A',
          tipo_movimiento: 'Ingreso',
          cantidad: detail.cantidad,
          referencia_id: doc.numero_documento,
          usuario_nombre: doc.proveedor_nombre, 
          valor_unitario: detail.valor_unitario,
          valor_total_movimiento: detail.valor_total,
        });
      });
    });

    MOCK_CONSUMPTIONS.forEach(cons => {
      cons.items.forEach(item => {
        const product = MOCK_PRODUCTS_FOR_CONSUMPTION.find(p => p.sku === item.product_sku);
        movements.push({
          id: `CONS-${cons.id}-${item.product_sku}`,
          fecha: cons.fecha_consumo,
          sku: item.product_sku,
          product_nombre: product?.nombre || item.product_nombre || 'N/A',
          tipo_movimiento: 'Consumo',
          cantidad: item.cantidad_consumida,
          referencia_id: cons.numero_ot,
          usuario_nombre: cons.solicitante_nombre, 
          valor_unitario: product?.valor_promedio || 0,
          valor_total_movimiento: item.cantidad_consumida * (product?.valor_promedio || 0),
        });
      });
    });
    
    MOCK_ADJUSTMENTS.forEach(adj => {
        const product = MOCK_PRODUCTS_FOR_CONSUMPTION.find(p => p.sku === adj.sku);
        movements.push({
            id: `ADJ-${adj.id}`,
            fecha: adj.fecha,
            sku: adj.sku,
            product_nombre: product?.nombre || adj.product_nombre || 'N/A',
            tipo_movimiento: adj.cantidad > 0 ? 'Ajuste Positivo' : 'Ajuste Negativo',
            cantidad: Math.abs(adj.cantidad),
            referencia_id: adj.motivo,
            usuario_nombre: adj.usuario_nombre, 
            valor_unitario: product?.valor_promedio || 0,
            valor_total_movimiento: Math.abs(adj.cantidad) * (product?.valor_promedio || 0),
        });
    });

    return movements.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }, []);

  const filteredData = useMemo(() => {
    return unifiedMovementsData.filter(m => {
      const movementDate = new Date(m.fecha);
      if (filters.dateFrom && movementDate < new Date(filters.dateFrom)) return false;
      if (filters.dateTo && movementDate > new Date(new Date(filters.dateTo).setDate(new Date(filters.dateTo).getDate() + 1))) return false;
      if (filters.movementType && m.tipo_movimiento !== filters.movementType) return false;
      if (filters.productId && m.sku !== filters.productId) return false;
      if (filters.involvedParty && m.usuario_nombre && !m.usuario_nombre.toLowerCase().includes(filters.involvedParty.toLowerCase())) return false;
      return true;
    });
  }, [unifiedMovementsData, filters]);

  const columns: TableColumn<UnifiedInventoryMovement>[] = [
    { key: 'fecha', header: 'Fecha', render: item => formatDate(item.fecha) },
    { key: 'sku', header: 'SKU' },
    { key: 'product_nombre', header: 'Producto' },
    { key: 'tipo_movimiento', header: 'Tipo Movimiento', render: item => {
        let color = 'text-gray-700';
        if(item.tipo_movimiento === 'Ingreso' || item.tipo_movimiento === 'Ajuste Positivo') color = 'text-green-600';
        if(item.tipo_movimiento === 'Consumo' || item.tipo_movimiento === 'Ajuste Negativo') color = 'text-red-600';
        return <span className={color}>{item.tipo_movimiento}</span>
    }},
    { key: 'cantidad', header: 'Cantidad' },
    { key: 'valor_total_movimiento', header: 'Valor Mov. (CLP)', render: item => formatCurrency(item.valor_total_movimiento)},
    { key: 'referencia_id', header: 'Referencia (Doc/OT/Motivo)' },
    { key: 'usuario_nombre', header: 'Usuario/Prov./Solic.' },
  ];

  const movementTypeOptions: {value: MovementType | string, label: string}[] = [
    { value: '', label: 'Todos los Tipos' },
    { value: 'Ingreso', label: 'Ingreso (por Documento)' },
    { value: 'Consumo', label: 'Consumo (por OT)' },
    { value: 'Ajuste Positivo', label: 'Ajuste Positivo (Manual)' },
    { value: 'Ajuste Negativo', label: 'Ajuste Negativo (Manual)' },
  ];
  const productOptions = [{ value: '', label: 'Todos los Productos' }, ...MOCK_PRODUCTS_FOR_CONSUMPTION.map(p => ({ value: p.sku, label: `${p.sku} - ${p.nombre}` }))];

  const handleExport = (format: 'csv' | 'pdf' | 'excel') => {
    setAlertMessage({type: 'info', message: `Exportando datos a ${format.toUpperCase()}...`});
    logger.log(`Exporting Movements to ${format.toUpperCase()}:`, filteredData);
  };

  return (
    <MainContainer className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Informe de Movimientos de Inventario</h1>
      {alertMessage && <Alert type={alertMessage.type} message={alertMessage.message} onClose={() => setAlertMessage(null)}/>}
      <Card title="Filtros del Informe">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
          <Input label="Fecha Desde" type="date" name="dateFrom" value={filters.dateFrom} onChange={handleFilterChange} max={filters.dateTo}/>
          <Input label="Fecha Hasta" type="date" name="dateTo" value={filters.dateTo} onChange={handleFilterChange} min={filters.dateFrom}/>
          <Select label="Tipo de Movimiento" name="movementType" value={filters.movementType} onChange={handleFilterChange} options={movementTypeOptions} />
          <Select label="Producto (SKU)" name="productId" value={filters.productId} onChange={handleFilterChange} options={productOptions} />
          <Input label="Usuario/Prov./Solic." name="involvedParty" value={filters.involvedParty} onChange={handleFilterChange} placeholder="Filtrar por nombre..." />
        </div>
        <div className="px-4 py-3 bg-gray-50 border-t flex justify-end">
            <Button variant="ghost" onClick={handleResetFilters} leftIcon={<XCircleIcon className="w-4 h-4"/>}>Limpiar Filtros</Button>
        </div>
      </Card>

      <Card>
        <div className="p-4 flex justify-end space-x-2">
          <Button onClick={() => handleExport('csv')} variant="outline" size="sm">Exportar CSV</Button>
          <Button onClick={() => handleExport('pdf')} variant="outline" size="sm">Exportar PDF</Button>
          <Button onClick={() => handleExport('excel')} variant="outline" size="sm">Exportar Excel</Button>
        </div>
        <Table columns={columns} data={filteredData} keyExtractor={item => item.id} emptyMessage="No hay movimientos que coincidan con los filtros." />
      </Card>
    </MainContainer>
  );
};

export default InformeMovimientosPage;
