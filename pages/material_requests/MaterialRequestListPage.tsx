
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { MaterialRequest, TableColumn, UserRole, MaterialRequestStatus, Solicitante, DocumentHeader } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Table } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { Card } from '../../components/ui/Card';
import MaterialRequestForm from '../../components/material_requests/MaterialRequestForm';
import { PlusIcon, EyeIcon, PencilIcon, TrashIcon, XCircleIcon, MOCK_SOLICITANTES, MOCK_MATERIAL_REQUESTS, MOCK_PROVIDERS, MOCK_DOCUMENTS, logAuditEntry } from '../../constants';
import { useAuth } from '../../hooks/useAuth';
import { Alert } from '../../components/ui/Alert';

const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('es-CL');

const initialFilters = {
    id: '',
    solicitanteId: '',
    estadoGeneral: '',
    fechaSolicitudFrom: '',
    fechaSolicitudTo: '',
};


const MaterialRequestListPage: React.FC = () => {
  const { user } = useAuth();
  const [materialRequests, setMaterialRequests] = useState<MaterialRequest[]>([...MOCK_MATERIAL_REQUESTS]);
  
  const [filters, setFilters] = useState(initialFilters);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState<MaterialRequest | undefined>(undefined);
  const [alertMessage, setAlertMessage] = useState<{type: 'success' | 'error' | 'info', message: string} | null>(null);

  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState<MaterialRequest | null>(null);

  const nextRequestNumericId = useRef(1); 


  const canCreateMaterialRequests = user?.role === UserRole.ADMIN || user?.role === UserRole.WAREHOUSE_MANAGER || user?.role === UserRole.WAREHOUSE_OPERATOR;
  const canEditDeleteMaterialRequests = user?.role === UserRole.ADMIN || user?.role === UserRole.WAREHOUSE_MANAGER;

  useEffect(() => {
    const maxNumericId = MOCK_MATERIAL_REQUESTS.reduce((max, req) => {
        if (req.id.startsWith('SM-')) {
            const num = parseInt(req.id.replace('SM-', ''), 10);
            return isNaN(num) ? max : Math.max(max, num);
        }
        return max;
    }, 0);
    nextRequestNumericId.current = maxNumericId + 1;
  }, []); 

  useEffect(() => {
    if (alertMessage) {
      const timer = setTimeout(() => setAlertMessage(null), 3000);
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

  const filteredRequests = useMemo(() => {
    return materialRequests.filter(req => {
      const generalMatch = 
        (!filters.id || req.id.toLowerCase().includes(filters.id.toLowerCase())) &&
        (!filters.solicitanteId || req.solicitante_id === filters.solicitanteId) &&
        (!filters.estadoGeneral || req.estado_general === filters.estadoGeneral);
      
      if (!generalMatch) return false;

      if (filters.fechaSolicitudFrom && new Date(req.fecha_solicitud) < new Date(filters.fechaSolicitudFrom)) return false;
      if (filters.fechaSolicitudTo && new Date(req.fecha_solicitud) > new Date(filters.fechaSolicitudTo)) return false;
      
      return true;
    }).sort((a,b) => new Date(b.fecha_solicitud).getTime() - new Date(a.fecha_solicitud).getTime());
  }, [materialRequests, filters]);

  const handleAddRequest = () => {
    setEditingRequest(undefined);
    setIsModalOpen(true);
  };

  const handleViewEditRequest = (request: MaterialRequest) => {
    setEditingRequest(request);
    setIsModalOpen(true);
  };

  const requestDeleteMaterialRequest = (request: MaterialRequest) => {
    setRequestToDelete(request);
    setIsConfirmDeleteModalOpen(true);
  };

  const confirmDeleteMaterialRequest = () => {
    if (!requestToDelete || !user) return;

    const updatedLocalRequests = materialRequests.filter(req => req.id !== requestToDelete.id);
    setMaterialRequests(updatedLocalRequests);
    
    const MOCK_REQUESTS_Index = MOCK_MATERIAL_REQUESTS.findIndex(r => r.id === requestToDelete.id);
    if (MOCK_REQUESTS_Index !== -1) {
      MOCK_MATERIAL_REQUESTS.splice(MOCK_REQUESTS_Index, 1);
    }
    logAuditEntry(user.username, "SOLICITUD_MATERIAL_ELIMINADA", `Solicitud de material ID '${requestToDelete.id}' eliminada.`);
    setAlertMessage({ type: 'success', message: `Solicitud ${requestToDelete.id} eliminada.` });
    setIsConfirmDeleteModalOpen(false);
    setRequestToDelete(null);
  };

  const handleSaveRequest = (requestData: MaterialRequest) => {
    if (!user) return;
    let updatedLocalRequests;
    if (editingRequest && requestData.id === editingRequest.id) { 
      updatedLocalRequests = materialRequests.map(req => req.id === requestData.id ? requestData : req);
      const MOCK_REQUESTS_Index = MOCK_MATERIAL_REQUESTS.findIndex(r => r.id === requestData.id);
      if (MOCK_REQUESTS_Index !== -1) MOCK_MATERIAL_REQUESTS[MOCK_REQUESTS_Index] = requestData;
      logAuditEntry(user.username, "SOLICITUD_MATERIAL_ACTUALIZADA", `Solicitud de material ID '${requestData.id}' actualizada. Estado: ${requestData.estado_general}.`);
      setAlertMessage({ type: 'success', message: `Solicitud ${requestData.id} actualizada.` });
    } else { 
      const newId = `SM-${String(nextRequestNumericId.current++).padStart(4, '0')}`;
      const newRequestWithId = { ...requestData, id: newId };
      updatedLocalRequests = [newRequestWithId, ...materialRequests];
      MOCK_MATERIAL_REQUESTS.unshift(newRequestWithId);
      logAuditEntry(user.username, "SOLICITUD_MATERIAL_CREADA", `Solicitud de material ID '${newId}' creada por ${newRequestWithId.solicitante_nombre}.`);
      setAlertMessage({ type: 'success', message: `Solicitud ${newId} creada.` });
    }
    setMaterialRequests(updatedLocalRequests);
    setIsModalOpen(false);
    setEditingRequest(undefined);
  };

  const getStatusColor = (status: MaterialRequestStatus) => {
    switch (status) {
      case 'Abierta': return 'bg-blue-100 text-blue-700 dark:bg-blue-700/30 dark:text-blue-300';
      case 'En Compra': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-700/30 dark:text-yellow-300';
      case 'Parcialmente Recibida': return 'bg-orange-100 text-orange-700 dark:bg-orange-700/30 dark:text-orange-300';
      case 'Totalmente Recibida': return 'bg-green-100 text-green-700 dark:bg-green-700/30 dark:text-green-300';
      case 'Cancelada': return 'bg-red-100 text-red-700 dark:bg-red-700/30 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-700/30 dark:text-gray-300';
    }
  };

  const columns: TableColumn<MaterialRequest>[] = [
    { key: 'id', header: 'ID Solicitud', className: 'font-semibold text-primary' },
    { key: 'fecha_solicitud', header: 'Fecha Sol.', render: item => formatDate(item.fecha_solicitud) },
    { key: 'solicitante_nombre', header: 'Solicitante' },
    { 
      key: 'estado_general', 
      header: 'Estado General', 
      render: item => (
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.estado_general)}`}>
          {item.estado_general}
        </span>
      )
    },
    { 
      key: 'items', 
      header: 'Ítems (Primeros 2)', 
      render: item => (
        <ul className="text-xs list-disc list-inside">
          {item.items.slice(0, 2).map(it => 
            <li key={it.id} title={`${it.descripcion_item}${it.producto_sku_esperado ? ` (SKU Esp: ${it.producto_sku_esperado})` : ''}`}>
              {it.descripcion_item.substring(0, 30)}... ({it.cantidad_solicitada} {it.unidad_medida_sugerida})
              {it.producto_sku_esperado && <span className="text-gray-500 dark:text-slate-400"> (SKU: {it.producto_sku_esperado})</span>}
            </li>
          )}
          {item.items.length > 2 && <li>y {item.items.length - 2} más...</li>}
        </ul>
      ),
      className: "max-w-xs truncate"
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (item) => (
        <div className="space-x-1">
          <Button size="sm" variant="ghost" onClick={() => handleViewEditRequest(item)} title={ (user?.role === UserRole.WAREHOUSE_OPERATOR && !!item) ? "Ver Solicitud" : "Ver/Editar Solicitud"}>
             {user?.role === UserRole.WAREHOUSE_OPERATOR && editingRequest ? <EyeIcon className="w-4 h-4" /> : <PencilIcon className="w-4 h-4" />}
          </Button>
          {(canEditDeleteMaterialRequests && item.estado_general !== 'Totalmente Recibida' && item.estado_general !== 'Cancelada') && (
            <Button size="sm" variant="ghost" onClick={() => requestDeleteMaterialRequest(item)} title="Eliminar Solicitud" className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300">
              <TrashIcon className="w-4 h-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];
  
  const solicitanteOptions = [{ value: '', label: 'Todos los Solicitantes' }, ...MOCK_SOLICITANTES.map(s => ({ value: s.id, label: s.nombre_completo }))];
  const statusOptions: {value: MaterialRequestStatus | string, label: string}[] = [
      { value: '', label: 'Todos los Estados' },
      { value: 'Abierta', label: 'Abierta' },
      { value: 'En Compra', label: 'En Compra' },
      { value: 'Parcialmente Recibida', label: 'Parcialmente Recibida' },
      { value: 'Totalmente Recibida', label: 'Totalmente Recibida' },
      { value: 'Cancelada', label: 'Cancelada' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-slate-100">Solicitudes de Materiales</h1>
        {canCreateMaterialRequests && (
          <Button onClick={handleAddRequest} leftIcon={<PlusIcon className="w-5 h-5" />}>
            Nueva Solicitud
          </Button>
        )}
      </div>

      {alertMessage && <Alert type={alertMessage.type} message={alertMessage.message} onClose={() => setAlertMessage(null)} />}

      <Card title="Filtros de Búsqueda">
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Input label="ID Solicitud" name="id" placeholder="Ej: SM-0001" value={filters.id} onChange={handleFilterChange} />
            <Select label="Solicitante" name="solicitanteId" value={filters.solicitanteId} onChange={handleFilterChange} options={solicitanteOptions} />
            <Select label="Estado General" name="estadoGeneral" value={filters.estadoGeneral} onChange={handleFilterChange} options={statusOptions} />
            <Input label="Fecha Solicitud Desde" type="date" name="fechaSolicitudFrom" value={filters.fechaSolicitudFrom} onChange={handleFilterChange} max={filters.fechaSolicitudTo} />
            <Input label="Fecha Solicitud Hasta" type="date" name="fechaSolicitudTo" value={filters.fechaSolicitudTo} onChange={handleFilterChange} min={filters.fechaSolicitudFrom} />
        </div>
        <div className="px-4 py-3 bg-gray-50 dark:bg-slate-700/50 border-t dark:border-slate-700 flex justify-end">
            <Button variant="ghost" onClick={handleResetFilters} leftIcon={<XCircleIcon className="w-4 h-4"/>}>Limpiar Filtros</Button>
        </div>
      </Card>

      <Table columns={columns} data={filteredRequests} keyExtractor={(item) => item.id} emptyMessage="No hay solicitudes de materiales que coincidan."/>

      {isModalOpen && user && (
        <MaterialRequestForm
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setEditingRequest(undefined); }}
          onSave={handleSaveRequest}
          requestToEdit={editingRequest}
          currentUser={user}
          allSolicitantes={MOCK_SOLICITANTES}
          allProviders={MOCK_PROVIDERS}
          allDocuments={MOCK_DOCUMENTS} // Pass MOCK_DOCUMENTS
          isEffectivelyReadOnly={!!editingRequest && (user.role === UserRole.WAREHOUSE_OPERATOR || editingRequest.estado_general === 'Totalmente Recibida' || editingRequest.estado_general === 'Cancelada')}
        />
      )}

      <Modal
        isOpen={isConfirmDeleteModalOpen}
        onClose={() => { setIsConfirmDeleteModalOpen(false); setRequestToDelete(null);}}
        title="Confirmar Eliminación de Solicitud"
        size="sm"
      >
        <div className="text-center">
          <TrashIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-700 dark:text-slate-200">
            ¿Está seguro de que desea eliminar esta solicitud de material?
          </p>
          {requestToDelete && (
            <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
             ID Solicitud: {requestToDelete.id}
            </p>
          )}
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-2">
            Esta acción no se puede deshacer.
          </p>
          <div className="mt-6 flex justify-center space-x-3">
            <Button variant="ghost" onClick={() => { setIsConfirmDeleteModalOpen(false); setRequestToDelete(null); }}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={confirmDeleteMaterialRequest}>
              Sí, Eliminar
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
};

export default MaterialRequestListPage;
