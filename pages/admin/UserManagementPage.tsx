
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { User, UserRole, TableColumn } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Table } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import UserForm from '../../components/admin/UserForm';
import { PlusIcon, PencilIcon, TrashIcon, MOCK_USERS, logAuditEntry } from '../../constants'; 
import { useAuth } from '../../hooks/useAuth';
import { Alert } from '../../components/ui/Alert';
import { Navigate } from 'react-router-dom';

const UserManagementPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([...MOCK_USERS]); // Local state
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | undefined>(undefined);
  const [alertMessage, setAlertMessage] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const newUserIdCounter = useRef(MOCK_USERS.filter(u => !u.id.startsWith("user_init_")).length + 1);

  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);


  useEffect(() => {
     // If MOCK_USERS is ever changed by another part of the app and this component needs to reflect it immediately
     // This basic sync might be needed, or a more robust global state solution for mocks.
     // For now, assuming MOCK_USERS is primarily managed here or is stable.
     // setUsers([...MOCK_USERS]);
  }, []);


  useEffect(() => {
    if (alertMessage) {
      const timer = setTimeout(() => setAlertMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [alertMessage]);

  if (currentUser?.role !== UserRole.ADMIN) {
    return <Navigate to="/" replace />;
  }

  const filteredUsers = useMemo(() => {
    return users.filter(user =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  const handleAddUser = () => {
    setEditingUser(undefined);
    setIsModalOpen(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const requestDeleteUser = (user: User) => {
    if (user.id === currentUser?.id) {
      setAlertMessage({ type: 'error', message: 'No puede eliminar su propia cuenta.' });
      return;
    }
    setUserToDelete(user);
    setIsConfirmDeleteModalOpen(true);
  };
  
  const confirmDeleteUser = () => {
    if (!userToDelete || !currentUser) return;

    const updatedUsers = users.filter(u => u.id !== userToDelete.id);
    setUsers(updatedUsers);
    
    const MOCK_USERS_Index = MOCK_USERS.findIndex(u => u.id === userToDelete.id);
    if (MOCK_USERS_Index !== -1) {
      MOCK_USERS.splice(MOCK_USERS_Index, 1);
    }
    logAuditEntry(currentUser.username, "USUARIO_ELIMINADO", `Usuario '${userToDelete.username}' (ID: ${userToDelete.id}) eliminado.`);
    setAlertMessage({ type: 'success', message: `Usuario ${userToDelete.username} eliminado correctamente.` });
    setIsConfirmDeleteModalOpen(false);
    setUserToDelete(null);
  };


  const handleSaveUser = (userToSave: User, password?: string) => { 
    if(!currentUser) return;
    let updatedUsers;
    if (editingUser) { // Editing existing user
      updatedUsers = users.map(u => u.id === userToSave.id ? userToSave : u);
      const MOCK_USERS_Index = MOCK_USERS.findIndex(u => u.id === userToSave.id);
      if (MOCK_USERS_Index !== -1) MOCK_USERS[MOCK_USERS_Index] = userToSave;
      logAuditEntry(currentUser.username, "USUARIO_ACTUALIZADO", `Usuario '${userToSave.username}' (ID: ${userToSave.id}) actualizado. Rol: ${userToSave.role}.`);
      setAlertMessage({ type: 'success', message: `Usuario ${userToSave.username} actualizado.` });
    } else { // Adding new user
      const newGeneratedId = `user_dyn_${newUserIdCounter.current++}`;
      const newUserWithId = { ...userToSave, id: newGeneratedId };
      updatedUsers = [newUserWithId, ...users];
      MOCK_USERS.unshift(newUserWithId); // Add to global MOCK_USERS
      logAuditEntry(currentUser.username, "USUARIO_CREADO", `Usuario '${newUserWithId.username}' (ID: ${newGeneratedId}) creado con rol ${newUserWithId.role}.`);
      setAlertMessage({ type: 'success', message: `Usuario ${newUserWithId.username} creado con ID: ${newGeneratedId}. ${password ? `Contraseña (demo): ${password}`: ''}` });
    }
    setUsers(updatedUsers);
    setIsModalOpen(false);
  };

  const columns: TableColumn<User>[] = [
    { key: 'username', header: 'Nombre de Usuario', className: 'font-medium text-primary' },
    { key: 'role', header: 'Rol' },
    {
      key: 'actions',
      header: 'Acciones',
      render: (item) => (
        <div className="space-x-2">
          <Button size="sm" variant="ghost" onClick={() => handleEditUser(item)} title="Editar Usuario">
            <PencilIcon className="w-4 h-4" />
          </Button>
          {item.id !== currentUser?.id && ( 
            <Button size="sm" variant="ghost" onClick={() => requestDeleteUser(item)} title="Eliminar Usuario" className="text-red-500 hover:text-red-700">
              <TrashIcon className="w-4 h-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Gestión de Usuarios</h1>
        <Button onClick={handleAddUser} leftIcon={<PlusIcon className="w-5 h-5" />}>
          Nuevo Usuario
        </Button>
      </div>

      {alertMessage && <Alert type={alertMessage.type} message={alertMessage.message} onClose={() => setAlertMessage(null)} />}

      <Input
        type="text"
        placeholder="Buscar por nombre de usuario o rol..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="max-w-md"
      />

      <Table columns={columns} data={filteredUsers} keyExtractor={(item) => item.id} />

      {isModalOpen && (
        <UserForm
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveUser}
          user={editingUser}
        />
      )}
      <Modal
        isOpen={isConfirmDeleteModalOpen}
        onClose={() => { setIsConfirmDeleteModalOpen(false); setUserToDelete(null);}}
        title="Confirmar Eliminación de Usuario"
        size="sm"
      >
        <div className="text-center">
          <TrashIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-700 dark:text-slate-200">
            ¿Está seguro de que desea eliminar este usuario?
          </p>
          {userToDelete && (
            <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
              Usuario: {userToDelete.username} (ID: {userToDelete.id})
            </p>
          )}
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-2">
            Esta acción no se puede deshacer.
          </p>
          <div className="mt-6 flex justify-center space-x-3">
            <Button variant="ghost" onClick={() => { setIsConfirmDeleteModalOpen(false); setUserToDelete(null); }}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={confirmDeleteUser}>
              Sí, Eliminar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UserManagementPage;
