
import React, { useState, useEffect } from 'react';
import { Provider } from '../../types';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface ProviderFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (provider: Provider) => void;
  provider?: Provider;
}

const ProviderForm: React.FC<ProviderFormProps> = ({ isOpen, onClose, onSave, provider }) => {
  const [formData, setFormData] = useState<Partial<Provider>>(provider || {
    nombre: '',
    rut: '',
    contacto: '',
    telefono: '',
    email: '',
    direccion: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof Provider, string>>>({});

  useEffect(() => {
    if (provider) {
      setFormData(provider);
    } else {
      // Reset for new provider
      setFormData({
        nombre: '', rut: '', contacto: '', telefono: '', email: '', direccion: '',
      });
    }
    setErrors({});
  }, [provider, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof Provider]) {
        setErrors(prev => ({...prev, [name]: undefined}));
    }
  };
  
  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof Provider, string>> = {};
    if (!formData.nombre?.trim()) newErrors.nombre = "Nombre es requerido.";
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = "Email no es válido.";
    }
    // Basic RUT validation (Chilean format) - can be improved
    if (formData.rut && !/^[0-9]{1,2}\.?[0-9]{3}\.?[0-9]{3}-?[0-9Kk]$/.test(formData.rut)) {
        newErrors.rut = "RUT no tiene un formato válido (ej: 12.345.678-K).";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
        onSave(formData as Provider); // Assume all required fields are filled or have defaults
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={provider ? 'Editar Proveedor' : 'Nuevo Proveedor'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Nombre Proveedor" name="nombre" value={formData.nombre} onChange={handleChange} required error={errors.nombre}/>
        <Input label="RUT" name="rut" value={formData.rut} onChange={handleChange} error={errors.rut} placeholder="Ej: 12.345.678-K"/>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Nombre Contacto" name="contacto" value={formData.contacto} onChange={handleChange} />
            <Input label="Teléfono Contacto" name="telefono" value={formData.telefono} onChange={handleChange} />
        </div>
        <Input label="Email Contacto" name="email" type="email" value={formData.email} onChange={handleChange} error={errors.email}/>
        
        <label htmlFor="direccion" className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
        <textarea 
            name="direccion" 
            id="direccion" 
            rows={2} 
            value={formData.direccion} 
            onChange={handleChange} 
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
        />
        
        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit">{provider ? 'Guardar Cambios' : 'Crear Proveedor'}</Button>
        </div>
      </form>
    </Modal>
  );
};

export default ProviderForm;
