
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Solicitante, TableColumn, UserRole } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Table } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import RequesterForm from '../../components/requesters/RequesterForm';
import { PlusIcon, PencilIcon, TrashIcon, MOCK_SOLICITANTES, logAuditEntry } from '../../constants';
import { useAuth } from '../../hooks/useAuth';
import { Alert } from '../../components/ui/Alert';
import { Navigate } from 'react-router-dom';


const RequesterListPage: React.FC = () => {
  const { user } = useAuth();
  const [solicitantes, setSolicitantes] = useState<Solicitante[]>([...MOCK_SOLICITANTES]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSolicitante, setEditingSolicitante] = useState<Solicitante | undefined>(undefined);
  const [alertMessage, setAlertMessage] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const newRequesterIdCounter = useRef(MOCK_SOLICITANTES.length + 1);

  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);
  const [requesterToDelete, setRequesterToDelete] = useState<Solicitante | null>(null);

  const canManage = user?.role === UserRole.ADMIN || user?.role === UserRole.WAREHOUSE_MANAGER;

  useEffect(() => {
    // setSolicitantes([...MOCK_SOLICITANTES]); // Sync with global if needed on mount/updates
  }, []);

  useEffect(() => {
    if (alertMessage) {
      const timer = setTimeout(() => setAlertMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [alertMessage]);

  if (!canManage) {
     return <Navigate to="/" replace />;
  }

  const filteredSolicitantes = useMemo(() => {
    return solicitantes.filter(s =>
      s.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.codigo_interno.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.cargo.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [solicitantes, searchTerm]);

  const handleAddSolicitante = () => {
    setEditingSolicitante(undefined);
    setIsModalOpen(true);
  };

  const handleEditSolicitante = (solicitante: Solicitante) => {
    setEditingSolicitante(solicitante);
    setIsModalOpen(true);
  };

  const requestDeleteSolicitante = (solicitante: Solicitante) => {
    setRequesterToDelete(solicitante);
    setIsConfirmDeleteModalOpen(true);
  };
  
  const confirmDeleteSolicitante = () => {
    if (!requesterToDelete || !user) return;

    const updatedSolicitantes = solicitantes.filter(s => s.id !== requesterToDelete.id);
    setSolicitantes(updatedSolicitantes);
    
    const MOCK_SOLICITANTES_Index = MOCK_SOLICITANTES.findIndex(s => s.id === requesterToDelete.id);
    if (MOCK_SOLICITANTES_Index !== -1) {
      MOCK_SOLICITANTES.splice(MOCK_SOLICITANTES_Index, 1);
    }
    logAuditEntry(user.username, "SOLICITANTE_ELIMINADO", `Solicitante '${requesterToDelete.nombre_completo}' (ID: ${requesterToDelete.id}) eliminado.`);
    setAlertMessage({ type: 'success', message: `Solicitante ${requesterToDelete.nombre_completo} eliminado correctamente.` });
    setIsConfirmDeleteModalOpen(false);
    setRequesterToDelete(null);
  };

  const handleSaveSolicitante = (solicitanteData: Solicitante) => {
    if(!user) return;
    let updatedSolicitantes;
    if (editingSolicitante) {
      const finalSolicitante = {...editingSolicitante, ...solicitanteData};
      updatedSolicitantes = solicitantes.map(s => s.id === finalSolicitante.id ? finalSolicitante : s);
      
      const MOCK_SOLICITANTES_Index = MOCK_SOLICITANTES.findIndex(s => s.id === finalSolicitante.id);
      if(MOCK_SOLICITANTES_Index !== -1) MOCK_SOLICITANTES[MOCK_SOLICITANTES_Index] = finalSolicitante;
      logAuditEntry(user.username, "SOLICITANTE_ACTUALIZADO", `Solicitante '${finalSolicitante.nombre_completo}' (ID: ${finalSolicitante.id}) actualizado.`);
      setAlertMessage({ type: 'success', message: `Solicitante ${finalSolicitante.nombre_completo} actualizado.` });
    } else {
      const newGeneratedId = `SOL_DYN_${newRequesterIdCounter.current++}`;
      const newSolicitanteWithId = { ...solicitanteData, id: newGeneratedId };
      updatedSolicitantes = [newSolicitanteWithId, ...solicitantes];
      MOCK_SOLICITANTES.unshift(newSolicitanteWithId);
      logAuditEntry(user.username, "SOLICITANTE_CREADO", `Solicitante '${newSolicitanteWithId.nombre_completo}' (ID: ${newGeneratedId}) creado.`);
      setAlertMessage({ type: 'success', message: `Solicitante ${newSolicitanteWithId.nombre_completo} creado con ID ${newGeneratedId}.` });
    }
    setSolicitantes(updatedSolicitantes);
    setIsModalOpen(false);
  };
  
  const columns: TableColumn<Solicitante>[] = [
    { key: 'codigo_interno', header: 'Código Interno', className: 'font-medium text-primary' },
    { key: 'nombre_completo', header: 'Nombre Completo' },
    { key: 'cargo', header: 'Cargo/Posición' },
    {
      key: 'actions',
      header: 'Acciones',
      render: (item) => (
        <div className="space-x-2">
          <Button size="sm" variant="ghost" onClick={() => handleEditSolicitante(item)} title="Editar Solicitante">
            <PencilIcon className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => requestDeleteSolicitante(item)} title="Eliminar Solicitante" className="text-red-500 hover:text-red-700">
            <TrashIcon className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Gestión de Solicitantes</h1>
        {canManage && (
          <Button onClick={handleAddSolicitante} leftIcon={<PlusIcon className="w-5 h-5" />}>
            Nuevo Solicitante
          </Button>
        )}
      </div>

      {alertMessage && <Alert type={alertMessage.type} message={alertMessage.message} onClose={() => setAlertMessage(null)} />}

      <Input
        type="text"
        placeholder="Buscar por código, nombre o cargo..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="max-w-md"
      />

      <Table columns={columns} data={filteredSolicitantes} keyExtractor={(item) => item.id} />

      {isModalOpen && (
        <RequesterForm
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveSolicitante}
          solicitante={editingSolicitante}
        />
      )}
       <Modal
        isOpen={isConfirmDeleteModalOpen}
        onClose={() => { setIsConfirmDeleteModalOpen(false); setRequesterToDelete(null);}}
        title="Confirmar Eliminación de Solicitante"
        size="sm"
      >
        <div className="text-center">
          <TrashIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-700 dark:text-slate-200">
            ¿Está seguro de que desea eliminar este solicitante?
          </p>
          {requesterToDelete && (
            <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
              Nombre: {requesterToDelete.nombre_completo} (ID: {requesterToDelete.id})
            </p>
          )}
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-2">
            Esta acción no se puede deshacer.
          </p>
          <div className="mt-6 flex justify-center space-x-3">
            <Button variant="ghost" onClick={() => { setIsConfirmDeleteModalOpen(false); setRequesterToDelete(null); }}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={confirmDeleteSolicitante}>
              Sí, Eliminar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default RequesterListPage;
