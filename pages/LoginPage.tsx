
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (!res.ok) {
        throw new Error('Credenciales incorrectas');
      }
      const data = await res.json();
      login(data.user, data.token);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
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
          Credenciales de ejemplo:
          <br /> admin / admin123
          <br /> gestor / gestor123
          <br /> operador / operador123
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
