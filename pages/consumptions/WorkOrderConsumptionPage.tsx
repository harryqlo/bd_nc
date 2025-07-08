
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Consumption, WorkOrder, Product, TableColumn, UserRole, ConsumptionDetail, User, Solicitante } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Table } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { Card } from '../../components/ui/Card';
import ConsumptionForm from '../../components/consumptions/ConsumptionForm';
import { PlusIcon, EyeIcon, PencilIcon, TrashIcon, XCircleIcon, MOCK_USERS, logAuditEntry } from '../../constants';
import { useAuth } from '../../hooks/useAuth';
import { Alert } from '../../components/ui/Alert';
import { MOCK_CONSUMPTIONS, MOCK_WORK_ORDERS, MOCK_PRODUCTS_FOR_CONSUMPTION, MOCK_SOLICITANTES } from '../../constants';
import { MainContainer } from '../../components/layout/MainContainer';

const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' });
  } catch (e) {
    return 'Fecha inválida';
  }
};

const initialFilters = {
    otNumber: '',
    productId: '',
    solicitanteId: '',
    dateFrom: '',
    dateTo: '',
    responsableId: '',
};

const WorkOrderConsumptionPage: React.FC = () => {
  const { user: currentUser } = useAuth(); 
  const [consumptions, setConsumptions] = useState<Consumption[]>([...MOCK_CONSUMPTIONS]);
  // Products state is managed here because consumptions directly affect it
  const [products, setProducts] = useState<Product[]>([...MOCK_PRODUCTS_FOR_CONSUMPTION]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([...MOCK_WORK_ORDERS]);
  const [solicitantes] = useState<Solicitante[]>([...MOCK_SOLICITANTES]); 
  
  const [filters, setFilters] = useState(initialFilters);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingConsumption, setEditingConsumption] = useState<Consumption | undefined>(undefined);
  const [alertMessage, setAlertMessage] = useState<{type: 'success' | 'error' | 'info', message: string} | null>(null);

  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);
  const [consumptionToDeleteId, setConsumptionToDeleteId] = useState<string | null>(null);

  const newConsumptionIdCounter = useRef(MOCK_CONSUMPTIONS.length + 1);
  const newWorkOrderIdCounter = useRef(MOCK_WORK_ORDERS.filter(wo => wo.id.startsWith("OT_DYN_")).length + 1);


  const canManage = currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.WAREHOUSE_MANAGER;
  const canRecord = canManage || currentUser?.role === UserRole.WAREHOUSE_OPERATOR;

  useEffect(() => {
    // If global MOCK arrays are changed elsewhere, this page might need to resync.
    // For now, this page primarily drives changes to these mocks.
    // setConsumptions([...MOCK_CONSUMPTIONS]);
    // setProducts([...MOCK_PRODUCTS_FOR_CONSUMPTION]);
    // setWorkOrders([...MOCK_WORK_ORDERS]);
  }, []);

  useEffect(() => {
    if (alertMessage) {
      const timer = setTimeout(() => setAlertMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [alertMessage]);
  
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleResetFilters = () => {
    setFilters(initialFilters);
  };


  const filteredConsumptions = useMemo(() => {
    return consumptions
      .filter(c => 
        (!filters.otNumber || c.numero_ot?.toLowerCase().includes(filters.otNumber.toLowerCase())) &&
        (!filters.productId || c.items.some(item => item.product_sku === filters.productId)) &&
        (!filters.solicitanteId || c.solicitante_id === filters.solicitanteId) &&
        (!filters.responsableId || c.usuario_responsable_id === filters.responsableId) &&
        (!filters.dateFrom || new Date(c.fecha_consumo) >= new Date(filters.dateFrom)) &&
        (!filters.dateTo || new Date(c.fecha_consumo) <= new Date(new Date(filters.dateTo).setHours(23,59,59,999))) 
      )
      .sort((a, b) => new Date(b.fecha_consumo).getTime() - new Date(a.fecha_consumo).getTime());
  }, [consumptions, filters]);

  const handleAddConsumption = () => {
    setEditingConsumption(undefined);
    setIsModalOpen(true);
  };

  const handleViewConsumption = (consumption: Consumption) => {
    setEditingConsumption(consumption); 
    setIsModalOpen(true);
  };
  
  const requestDeleteConsumption = (consumptionId: string) => {
    setConsumptionToDeleteId(consumptionId);
    setIsConfirmDeleteModalOpen(true);
  };

  const confirmDeleteConsumption = () => {
    if (!consumptionToDeleteId || !currentUser) return;
    
    let stockReversedLog = '';
    const consumptionToDelete = consumptions.find(c => c.id === consumptionToDeleteId);

    if (consumptionToDelete) {
      let tempStockReversedMessage = 'Stock reversado para: ';
      const updatedProductsLocally = products.map(p => {
          let matchedItem = consumptionToDelete.items.find(item => item.product_sku === p.sku);
          if (matchedItem) {
              tempStockReversedMessage += `${p.nombre} (+${matchedItem.cantidad_consumida}), `;
              const newStock = p.stock_actual + matchedItem.cantidad_consumida;
              
              const globalProductIndex = MOCK_PRODUCTS_FOR_CONSUMPTION.findIndex(gp => gp.sku === p.sku);
              if (globalProductIndex !== -1) {
                  MOCK_PRODUCTS_FOR_CONSUMPTION[globalProductIndex].stock_actual = newStock;
              }
              return { ...p, stock_actual: newStock };
          }
          return p;
      });
      setProducts(updatedProductsLocally);
      stockReversedLog = tempStockReversedMessage.slice(0, -2) + '.'; 
    }

    const updatedConsumptions = consumptions.filter(c => c.id !== consumptionToDeleteId);
    setConsumptions(updatedConsumptions);
    const globalConsumptionIndex = MOCK_CONSUMPTIONS.findIndex(gc => gc.id === consumptionToDeleteId);
    if (globalConsumptionIndex !== -1) {
      MOCK_CONSUMPTIONS.splice(globalConsumptionIndex, 1);
    }
    logAuditEntry(currentUser.username, "CONSUMO_ELIMINADO", `Consumo ID '${consumptionToDeleteId}' para OT '${consumptionToDelete?.numero_ot}' eliminado. ${stockReversedLog}`);
    setAlertMessage({ type: 'success', message: `Consumo ${consumptionToDeleteId} eliminado. ${stockReversedLog}` });
    setIsConfirmDeleteModalOpen(false);
    setConsumptionToDeleteId(null);
  };

  const handleSaveConsumption = (consumptionData: Consumption, isNewOTFlag: boolean, newOTNumberFromForm?: string) => {
    if (!currentUser) return;

    for (const item of consumptionData.items) {
        const productUsed = products.find(p => p.sku === item.product_sku);
        if (!productUsed) {
            setAlertMessage({ type: 'error', message: `Producto con SKU ${item.product_sku} no encontrado.` });
            return;
        }
        if (!editingConsumption && productUsed.stock_actual < item.cantidad_consumida) {
            setAlertMessage({ type: 'error', message: `Stock insuficiente para ${productUsed.nombre}. Stock actual: ${productUsed.stock_actual}. Solicitado: ${item.cantidad_consumida}` });
            return;
        }
    }
    
    let workOrderIdToUse = consumptionData.work_order_id;
    let finalNewOTNumber = newOTNumberFromForm || consumptionData.numero_ot;

    if (isNewOTFlag && finalNewOTNumber) {
        const newWorkOrder: WorkOrder = {
            id: `OT_DYN_${newWorkOrderIdCounter.current++}`, // Use counter for unique ID
            numero_ot: finalNewOTNumber.toUpperCase(),
            descripcion: `OT creada automáticamente para consumo ${consumptionData.id || `temp-${Date.now()}`}`,
            cliente: 'N/A',
            fecha_creacion: new Date().toISOString().split('T')[0],
            estado: 'En Progreso',
        };
        setWorkOrders(prev => [newWorkOrder, ...prev]); // Update local workOrders
        MOCK_WORK_ORDERS.unshift(newWorkOrder); // Update global MOCK_WORK_ORDERS
        workOrderIdToUse = newWorkOrder.id; 
        logAuditEntry(currentUser.username, "OT_CREADA_AUTO", `OT '${newWorkOrder.numero_ot}' (ID: ${newWorkOrder.id}) creada automáticamente para consumo.`);
        setAlertMessage({ type: 'info', message: `Nueva Orden de Trabajo ${newWorkOrder.numero_ot} (ID: ${newWorkOrder.id}) creada.` });
    }
    
    const consumptionToSave: Consumption = {
        ...consumptionData,
        id: editingConsumption?.id || `CONS_DYN_${newConsumptionIdCounter.current++}`,
        work_order_id: workOrderIdToUse, 
        numero_ot: finalNewOTNumber.toUpperCase(), // Ensure numero_ot matches the one used/created
        usuario_responsable_id: currentUser.id,
        usuario_responsable_nombre: currentUser.username,
        fecha_consumo: editingConsumption?.fecha_consumo || new Date().toISOString(), 
    };


    if (editingConsumption) {
      // Note: Editing consumption does not adjust stock back and forth in this demo to avoid complexity.
      // It would require storing original quantities and reversing them before applying new ones.
      const updatedConsumptions = consumptions.map(c => c.id === consumptionToSave.id ? consumptionToSave : c);
      setConsumptions(updatedConsumptions);
      const MOCK_CONSUMPTIONS_Index = MOCK_CONSUMPTIONS.findIndex(c => c.id === consumptionToSave.id);
      if(MOCK_CONSUMPTIONS_Index !== -1) MOCK_CONSUMPTIONS[MOCK_CONSUMPTIONS_Index] = consumptionToSave;
      logAuditEntry(currentUser.username, "CONSUMO_ACTUALIZADO", `Consumo ID '${consumptionToSave.id}' para OT '${consumptionToSave.numero_ot}' actualizado.`);
      setAlertMessage({ type: 'success', message: `Consumo ${consumptionToSave.id} actualizado (stock no modificado en edición demo).` });
    } else { 
      setConsumptions(prev => [consumptionToSave, ...prev]);
      MOCK_CONSUMPTIONS.unshift(consumptionToSave);

      let stockUpdatedMessage = 'Stock actualizado para: ';
      const updatedProductsLocally = products.map(p => {
        const consumedItem = consumptionToSave.items.find(item => item.product_sku === p.sku);
        if (consumedItem) {
            stockUpdatedMessage += `${p.nombre} (-${consumedItem.cantidad_consumida}), `;
            const newStock = p.stock_actual - consumedItem.cantidad_consumida;
            
            // Update global MOCK_PRODUCTS_FOR_CONSUMPTION
            const globalProductIndex = MOCK_PRODUCTS_FOR_CONSUMPTION.findIndex(gp => gp.sku === p.sku);
            if (globalProductIndex !== -1) {
                 MOCK_PRODUCTS_FOR_CONSUMPTION[globalProductIndex].stock_actual = newStock;
            }
            return { ...p, stock_actual: newStock };
        }
        return p;
      });
      setProducts(updatedProductsLocally); // Update local product state
      stockUpdatedMessage = stockUpdatedMessage.slice(0,-2) + '.';
      logAuditEntry(currentUser.username, "CONSUMO_CREADO", `Consumo ID '${consumptionToSave.id}' para OT '${consumptionToSave.numero_ot}' registrado. ${stockUpdatedMessage}`);
      setAlertMessage({ type: 'success', message: `Consumo para OT ${consumptionToSave.numero_ot} registrado. ${stockUpdatedMessage}` });
    }
    setIsModalOpen(false);
    setEditingConsumption(undefined);
  };
  
  const columns: TableColumn<Consumption>[] = [
    { key: 'numero_ot', header: 'N° OT', className: 'font-semibold text-primary' },
    { 
      key: 'items', 
      header: 'Insumos Consumidos', 
      render: item => (
        <ul className="list-disc list-inside text-xs">
          {item.items.slice(0, 2).map(detail => (
            <li key={detail.id || detail.product_sku} title={`${detail.product_nombre} (${detail.product_sku})`}>
              {detail.cantidad_consumida} x {detail.product_nombre || detail.product_sku}
            </li>
          ))}
          {item.items.length > 2 && <li>y {item.items.length - 2} más...</li>}
        </ul>
      )
    },
    { key: 'solicitante_nombre', header: 'Solicitante' },
    { key: 'fecha_consumo', header: 'Fecha Consumo', render: item => formatDate(item.fecha_consumo) },
    { key: 'usuario_responsable_nombre', header: 'Registrado por' },
    {
      key: 'actions',
      header: 'Acciones',
      render: (item) => (
        <div className="space-x-1">
          <Button size="sm" variant="ghost" onClick={() => handleViewConsumption(item)} title={canManage ? "Ver/Editar Consumo" : "Ver Consumo"}>
            {canManage ? <PencilIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
          </Button>
          {canManage && (
            <Button size="sm" variant="ghost" onClick={() => requestDeleteConsumption(item.id)} title="Eliminar Consumo" className="text-red-500 hover:text-red-700">
              <TrashIcon className="w-4 h-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  const productOptions = [{value: '', label: 'Todos los Productos'}, ...products.map(p => ({value: p.sku, label: `${p.sku} - ${p.nombre}`}))];
  const solicitanteOptions = [{value: '', label: 'Todos los Solicitantes'}, ...solicitantes.map(s => ({value: s.id, label: s.nombre_completo}))];
  const responsableOptions = [{value: '', label: 'Todos los Responsables'}, ...MOCK_USERS.filter(u => u.role === UserRole.ADMIN || u.role === UserRole.WAREHOUSE_MANAGER || u.role === UserRole.WAREHOUSE_OPERATOR).map(u => ({value: u.id, label: u.username}))];


  return (
    <MainContainer className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-800">Consumos por Orden de Trabajo (OT)</h1>
        {canRecord && (
          <Button onClick={handleAddConsumption} leftIcon={<PlusIcon className="w-5 h-5" />}>
            Registrar Consumo
          </Button>
        )}
      </div>

      {alertMessage && <Alert type={alertMessage.type} message={alertMessage.message} onClose={() => setAlertMessage(null)} />}

      <Card title="Filtros de Búsqueda">
        <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Input
                    label="Buscar por N° OT"
                    name="otNumber"
                    type="text"
                    placeholder="Ej: OT.10458"
                    value={filters.otNumber}
                    onChange={handleFilterChange}
                    containerClassName="mb-0"
                />
                <Select
                    label="Producto"
                    name="productId"
                    options={productOptions}
                    value={filters.productId}
                    onChange={handleFilterChange}
                    containerClassName="mb-0"
                />
                <Select
                    label="Solicitante"
                    name="solicitanteId"
                    options={solicitanteOptions}
                    value={filters.solicitanteId}
                    onChange={handleFilterChange}
                    containerClassName="mb-0"
                />
                <Select
                    label="Registrado por"
                    name="responsableId"
                    options={responsableOptions}
                    value={filters.responsableId}
                    onChange={handleFilterChange}
                    containerClassName="mb-0"
                />
                <Input
                    label="Fecha Consumo Desde"
                    name="dateFrom"
                    type="date"
                    value={filters.dateFrom}
                    onChange={handleFilterChange}
                    max={filters.dateTo || undefined}
                    containerClassName="mb-0"
                />
                <Input
                    label="Fecha Consumo Hasta"
                    name="dateTo"
                    type="date"
                    value={filters.dateTo}
                    onChange={handleFilterChange}
                    min={filters.dateFrom || undefined}
                    containerClassName="mb-0"
                />
            </div>
        </div>
        <div className="px-4 py-3 bg-gray-50 border-t flex justify-end">
            <Button variant="ghost" onClick={handleResetFilters} leftIcon={<XCircleIcon className="w-4 h-4"/>}>Limpiar Filtros</Button>
        </div>
      </Card>

      <Table columns={columns} data={filteredConsumptions} keyExtractor={(item) => item.id} emptyMessage="No hay consumos registrados que coincidan con los filtros."/>

      {isModalOpen && currentUser && (
        <ConsumptionForm
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setEditingConsumption(undefined); }}
          onSave={handleSaveConsumption}
          consumptionToEdit={editingConsumption}
          allProducts={products} // Pass current local products state
          allWorkOrders={workOrders} // Pass current local workOrders state
          allSolicitantes={solicitantes} 
          currentUser={currentUser}
        />
      )}

      <Modal
        isOpen={isConfirmDeleteModalOpen}
        onClose={() => { setIsConfirmDeleteModalOpen(false); setConsumptionToDeleteId(null);}}
        title="Confirmar Eliminación de Consumo"
        size="sm"
      >
        <div className="text-center">
          <TrashIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-700 dark:text-slate-200">
            ¿Está seguro de que desea eliminar este consumo?
          </p>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
            ID del Consumo: {consumptionToDeleteId}
          </p>
          <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-2">
            Esta acción reversará el stock de los productos involucrados (simulado).
          </p>
          <div className="mt-6 flex justify-center space-x-3">
            <Button variant="ghost" onClick={() => { setIsConfirmDeleteModalOpen(false); setConsumptionToDeleteId(null); }}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={confirmDeleteConsumption}>
              Sí, Eliminar
            </Button>
          </div>
        </div>
      </Modal>

    </MainContainer>
  );
};

WorkOrderConsumptionPage.displayName = 'WorkOrderConsumptionPage';

export default WorkOrderConsumptionPage;
