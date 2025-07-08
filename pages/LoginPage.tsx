
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../types';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { APP_NAME } from '../constants';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, user } = useAuth();
  const navigate = useNavigate();

  if (user) {
    navigate('/'); // Redirect if already logged in
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    // Mock authentication
    if ((username === 'admin' && password === 'admin123') || 
        (username === 'gestor' && password === 'gestor123') ||
        (username === 'operador' && password === 'operador123')) {
      let role = UserRole.WAREHOUSE_OPERATOR;
      if (username === 'admin') role = UserRole.ADMIN;
      if (username === 'gestor') role = UserRole.WAREHOUSE_MANAGER;
      
      login(username, role);
      navigate('/');
    } else {
      setError('Credenciales incorrectas. Intente: admin/admin123, gestor/gestor123, o operador/operador123');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-light via-primary to-primary-dark p-4">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">{APP_NAME}</h1>
          <p className="text-gray-600 mt-2">Bienvenido, por favor inicie sesión.</p>
        </div>
        
        {error && <Alert type="error" message={error} onClose={() => setError('')} className="mb-6"/>}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            id="username"
            label="Nombre de Usuario"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="ej: admin"
            required
          />
          <Input
            id="password"
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="ej: admin123"
            required
          />
          <Button type="submit" className="w-full" size="lg">
            Iniciar Sesión
          </Button>
        </form>
        <p className="text-xs text-gray-500 mt-6 text-center">
          Para demostración, use:
          <br /> admin / admin123
          <br /> gestor / gestor123
          <br /> operador / operador123
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
