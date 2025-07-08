
import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../../types';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';

interface UserFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: User, password?: string) => void;
  user?: User;
}

const UserForm: React.FC<UserFormProps> = ({ isOpen, onClose, onSave, user }) => {
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.WAREHOUSE_OPERATOR);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      setUsername(user.username);
      setRole(user.role);
      setPassword(''); // Don't prefill password for editing
      setConfirmPassword('');
    } else {
      setUsername('');
      setRole(UserRole.WAREHOUSE_OPERATOR);
      setPassword('');
      setConfirmPassword('');
    }
    setErrors({});
  }, [user, isOpen]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!username.trim()) newErrors.username = "Nombre de usuario es requerido.";
    if (!user) { // Only validate password for new users
        if (!password) newErrors.password = "Contraseña es requerida.";
        else if (password.length < 6) newErrors.password = "Contraseña debe tener al menos 6 caracteres.";
        if (password !== confirmPassword) newErrors.confirmPassword = "Las contraseñas no coinciden.";
    } else if (password && password.length < 6) { // If changing password for existing user
        newErrors.password = "Contraseña debe tener al menos 6 caracteres.";
        if (password !== confirmPassword) newErrors.confirmPassword = "Las contraseñas no coinciden.";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
        const userData: User = {
            id: user?.id || '', // ID will be generated if new
            username,
            role,
        };
        onSave(userData, password || undefined);
    }
  };

  const roleOptions = Object.values(UserRole).map(r => ({ value: r, label: r }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={user ? 'Editar Usuario' : 'Nuevo Usuario'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nombre de Usuario"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          error={errors.username}
          disabled={!!user} // Username typically not editable
        />
        <Select
          label="Rol"
          options={roleOptions}
          value={role}
          onChange={(e) => setRole(e.target.value as UserRole)}
          required
        />
        <Input
          label={user ? "Nueva Contraseña (opcional)" : "Contraseña"}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          required={!user}
        />
        <Input
          label={user ? "Confirmar Nueva Contraseña" : "Confirmar Contraseña"}
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={errors.confirmPassword}
          required={!user || !!password} // Required if new user or if password field has content
        />
        <div className="flex justify-end space-x-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit">{user ? 'Guardar Cambios' : 'Crear Usuario'}</Button>
        </div>
      </form>
    </Modal>
  );
};

export default UserForm;
