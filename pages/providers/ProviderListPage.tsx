
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Provider, TableColumn, UserRole } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Table } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal'; // Import Modal
import ProviderForm from '../../components/providers/ProviderForm';
import { PlusIcon, PencilIcon, TrashIcon, logAuditEntry } from '../../constants';
import { useAuth } from '../../hooks/useAuth';
import { Alert } from '../../components/ui/Alert';
import { MainContainer } from '../../components/layout/MainContainer';
import { MOCK_PROVIDERS } from '../../constants';

const ProviderListPage: React.FC = () => {
  const { user } = useAuth();
  // Initialize local state with a copy of MOCK_PROVIDERS
  // This ensures that on remount, it gets the latest version of the (potentially mutated) MOCK_PROVIDERS
  const [providers, setProviders] = useState<Provider[]>(() => [...MOCK_PROVIDERS]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<Provider | undefined>(undefined);
  const [alertMessage, setAlertMessage] = useState<{type: 'success' | 'error', message: string} | null>(null);

  // Initialize counter for new providers in a virgin system
  const newProviderIdCounter = useRef(1); 

  // State for custom delete confirmation modal
  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);
  const [providerToDelete, setProviderToDelete] = useState<Provider | null>(null);

  const canManage = user?.role === UserRole.ADMIN || user?.role === UserRole.WAREHOUSE_MANAGER;

  useEffect(() => {
    if (alertMessage) {
      const timer = setTimeout(() => setAlertMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [alertMessage]);

  // Effect to re-sync local state if MOCK_PROVIDERS changes externally (though direct mutation is primary)
  useEffect(() => {
    setProviders([...MOCK_PROVIDERS]);
    // Re-calculate next ID based on current MOCK_PROVIDERS, if any, to avoid clashes if mocks were somehow re-added
    const maxNumericId = MOCK_PROVIDERS.reduce((max, p) => {
        if (p.id.startsWith('prov_dyn_')) {
            const num = parseInt(p.id.replace('prov_dyn_', ''), 10);
            return isNaN(num) ? max : Math.max(max, num);
        }
        return max;
    }, 0);
    newProviderIdCounter.current = maxNumericId + 1;

  }, []); 

  const filteredProviders = useMemo(() => {
    return providers.filter(provider =>
      provider.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (provider.rut && provider.rut.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (provider.contacto && provider.contacto.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [providers, searchTerm]);

  const handleAddProvider = () => {
    setEditingProvider(undefined);
    setIsFormModalOpen(true);
  };

  const handleEditProvider = (provider: Provider) => {
    setEditingProvider(provider);
    setIsFormModalOpen(true);
  };

  const requestDeleteProvider = (provider: Provider) => {
    setProviderToDelete(provider);
    setIsConfirmDeleteModalOpen(true);
  };

  const confirmDeleteProvider = () => {
    if (!providerToDelete || !user) {
      setAlertMessage({ type: 'error', message: 'Error al eliminar: ID de proveedor no especificado o usuario no autenticado.' });
      setIsConfirmDeleteModalOpen(false);
      return;
    }

    // Update local state
    setProviders(prev => prev.filter(p => p.id !== providerToDelete.id));

    // Update global MOCK_PROVIDERS
    const indexInMock = MOCK_PROVIDERS.findIndex(p => p.id === providerToDelete.id);
    if (indexInMock !== -1) {
      MOCK_PROVIDERS.splice(indexInMock, 1);
    }
    logAuditEntry(user.username, "PROVEEDOR_ELIMINADO", `Proveedor '${providerToDelete.nombre}' (ID: ${providerToDelete.id}) eliminado.`);
    setAlertMessage({ type: 'success', message: `Proveedor ${providerToDelete.nombre} eliminado correctamente.` });
    setIsConfirmDeleteModalOpen(false);
    setProviderToDelete(null);
  };


  const handleSaveProvider = (providerDataFromForm: Provider) => {
    if (!user) return;
    if (editingProvider) {
      const updatedProvider = { ...editingProvider, ...providerDataFromForm };
      // Update local state
      setProviders(prev => prev.map(p => p.id === updatedProvider.id ? updatedProvider : p));
      
      // Update global MOCK_PROVIDERS
      const indexInMock = MOCK_PROVIDERS.findIndex(p => p.id === updatedProvider.id);
      if (indexInMock !== -1) {
        MOCK_PROVIDERS[indexInMock] = updatedProvider;
      }
      logAuditEntry(user.username, "PROVEEDOR_ACTUALIZADO", `Proveedor '${updatedProvider.nombre}' (ID: ${updatedProvider.id}) actualizado.`);
      setAlertMessage({ type: 'success', message: `Proveedor ${updatedProvider.nombre} actualizado.` });
    } else {
      const newId = `prov_dyn_${newProviderIdCounter.current++}`;
      const newProvider = { ...providerDataFromForm, id: newId };
      
      // Update local state (add to beginning)
      setProviders(prev => [newProvider, ...prev]);
      
      // Update global MOCK_PROVIDERS (add to beginning)
      MOCK_PROVIDERS.unshift(newProvider);
      logAuditEntry(user.username, "PROVEEDOR_CREADO", `Proveedor '${newProvider.nombre}' (ID: ${newId}) creado.`);
      setAlertMessage({ type: 'success', message: `Proveedor ${newProvider.nombre} creado con ID: ${newId}.` });
    }
    setIsFormModalOpen(false);
  };
  
  const columns: TableColumn<Provider>[] = [
    { key: 'nombre', header: 'Nombre', className: 'font-medium text-primary' },
    { key: 'rut', header: 'RUT' },
    { key: 'contacto', header: 'Contacto' },
    { key: 'telefono', header: 'Teléfono' },
    { key: 'email', header: 'Email' },
    { key: 'direccion', header: 'Dirección', className: 'text-xs max-w-xs truncate' },
    {
      key: 'actions',
      header: 'Acciones',
      render: (item) => (
        <div className="space-x-2">
          {canManage && (
            <>
              <Button size="sm" variant="ghost" onClick={() => handleEditProvider(item)} title="Editar Proveedor">
                <PencilIcon className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => requestDeleteProvider(item)} title="Eliminar Proveedor" className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300">
                <TrashIcon className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <MainContainer className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-slate-100">Gestión de Proveedores</h1>
        {canManage && (
          <Button onClick={handleAddProvider} leftIcon={<PlusIcon className="w-5 h-5" />}>
            Nuevo Proveedor
          </Button>
        )}
      </div>

      {alertMessage && <Alert type={alertMessage.type} message={alertMessage.message} onClose={() => setAlertMessage(null)} />}

      <Input
        type="text"
        placeholder="Buscar por nombre, RUT o contacto..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="max-w-md"
      />

      <Table columns={columns} data={filteredProviders} keyExtractor={(item) => String(item.id)} />

      {isFormModalOpen && (
        <ProviderForm
          isOpen={isFormModalOpen}
          onClose={() => setIsFormModalOpen(false)}
          onSave={handleSaveProvider}
          provider={editingProvider}
        />
      )}

      <Modal
        isOpen={isConfirmDeleteModalOpen}
        onClose={() => {
          setIsConfirmDeleteModalOpen(false);
          setProviderToDelete(null);
        }}
        title="Confirmar Eliminación de Proveedor"
        size="sm"
      >
        <div className="text-center">
          <TrashIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-700 dark:text-slate-200">
            ¿Está seguro de que desea eliminar este proveedor?
          </p>
           {providerToDelete && (
            <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
             Nombre: {providerToDelete.nombre} (ID: {providerToDelete.id})
            </p>
          )}
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-2">
            Esta acción no se puede deshacer.
          </p>
          <div className="mt-6 flex justify-center space-x-3">
            <Button
              variant="ghost"
              onClick={() => {
                setIsConfirmDeleteModalOpen(false);
                setProviderToDelete(null);
              }}
            >
              Cancelar
            </Button>
            <Button variant="danger" onClick={confirmDeleteProvider}>
              Sí, Eliminar
            </Button>
          </div>
        </div>
      </Modal>
    </MainContainer>
  );
};

ProviderListPage.displayName = 'ProviderListPage';

export default ProviderListPage;
