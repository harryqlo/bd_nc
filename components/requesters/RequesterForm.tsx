
import React, { useState, useEffect } from 'react';
import { Solicitante } from '../../types';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface RequesterFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (solicitante: Solicitante) => void;
  solicitante?: Solicitante;
}

const RequesterForm: React.FC<RequesterFormProps> = ({ isOpen, onClose, onSave, solicitante }) => {
  const [formData, setFormData] = useState<Partial<Solicitante>>(solicitante || {
    codigo_interno: '',
    nombre_completo: '',
    cargo: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof Solicitante, string>>>({});

  useEffect(() => {
    if (solicitante) {
      setFormData(solicitante);
    } else {
      // Reset for new solicitante
      setFormData({
        codigo_interno: '',
        nombre_completo: '',
        cargo: '',
      });
    }
    setErrors({});
  }, [solicitante, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof Solicitante]) {
        setErrors(prev => ({...prev, [name]: undefined}));
    }
  };
  
  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof Solicitante, string>> = {};
    if (!formData.codigo_interno?.trim()) newErrors.codigo_interno = "Código interno es requerido.";
    if (!formData.nombre_completo?.trim()) newErrors.nombre_completo = "Nombre completo es requerido.";
    if (!formData.cargo?.trim()) newErrors.cargo = "Cargo es requerido.";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
        onSave(formData as Solicitante); 
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={solicitante ? 'Editar Solicitante' : 'Nuevo Solicitante'} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input 
            label="Código Interno" 
            name="codigo_interno" 
            value={formData.codigo_interno} 
            onChange={handleChange} 
            required 
            error={errors.codigo_interno}
            placeholder="Ej: MEC-001, ELC-JPEREZ"
        />
        <Input 
            label="Nombre Completo" 
            name="nombre_completo" 
            value={formData.nombre_completo} 
            onChange={handleChange} 
            required 
            error={errors.nombre_completo}
            placeholder="Ej: Juan Antonio Pérez González"
        />
        <Input 
            label="Cargo / Posición" 
            name="cargo" 
            value={formData.cargo} 
            onChange={handleChange} 
            required 
            error={errors.cargo}
            placeholder="Ej: Mecánico, Electricista, Supervisor de Bodega"
        />
        
        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit">{solicitante ? 'Guardar Cambios' : 'Crear Solicitante'}</Button>
        </div>
      </form>
    </Modal>
  );
};

export default RequesterForm;