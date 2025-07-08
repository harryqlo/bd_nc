
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';

const NotFoundPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-10">
      <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
      <h2 className="text-3xl font-semibold text-gray-700 mb-2">Página No Encontrada</h2>
      <p className="text-gray-500 mb-8">
        Lo sentimos, la página que está buscando no existe o ha sido movida.
      </p>
      <Button as={Link} to="/" variant="primary">
        Volver al Dashboard
      </Button>
    </div>
  );
};

export default NotFoundPage;
