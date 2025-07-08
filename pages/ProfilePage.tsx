
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { MainContainer } from '../components/layout/MainContainer';

const ProfilePage: React.FC = () => {
  const { user, login } = useAuth(); 
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (!user) return;

    if (newPassword !== confirmNewPassword) {
      setMessage({ type: 'error', text: 'Las nuevas contraseñas no coinciden.' });
      return;
    }
    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'La nueva contraseña debe tener al menos 6 caracteres.' });
      return;
    }

    // In real app, call API to change password.
    // For this demo, we don't actually store/check currentPassword.
    console.log(`Password change attempt for ${user.username}. Current: ${currentPassword}, New: ${newPassword}`);
    
    setMessage({ type: 'success', text: 'Contraseña cambiada exitosamente.' });
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
  };

  if (!user) {
    return <p>Cargando perfil...</p>;
  }

  return (
    <MainContainer className="space-y-6 max-w-2xl">
      <h1 className="text-3xl font-bold text-gray-800">Mi Perfil</h1>
      
      <Card title="Información de Usuario">
        <div className="space-y-3 text-gray-700">
          <p><strong>Nombre de Usuario:</strong> {user.username}</p>
          <p><strong>Rol:</strong> {user.role}</p>
          <p><strong>ID de Usuario:</strong> {user.id}</p>
        </div>
      </Card>

      <Card title="Cambiar Contraseña">
        {message && <Alert type={message.type} message={message.text} onClose={() => setMessage(null)} className="mb-4" />}
        <form onSubmit={handleChangePassword} className="space-y-4">
          <Input 
            label="Contraseña Actual" 
            type="password" 
            value={currentPassword} 
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Ingrese su contraseña actual"
          />
          <Input 
            label="Nueva Contraseña" 
            type="password" 
            value={newPassword} 
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <Input 
            label="Confirmar Nueva Contraseña" 
            type="password" 
            value={confirmNewPassword} 
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            required
          />
          <div className="flex justify-end">
            <Button type="submit">Cambiar Contraseña</Button>
          </div>
        </form>
      </Card>
    </MainContainer>
  );
};

export default ProfilePage;
