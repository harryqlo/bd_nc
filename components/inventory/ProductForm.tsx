
import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { Product, Category, Provider } from '../../types';
import { MOCK_CATEGORIES, MOCK_PROVIDERS } from '../../constants';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';

interface ProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Product, status: { success: boolean; message: string }) => void;
  product?: Product;
}

const ProductForm: React.FC<ProductFormProps> = ({ isOpen, onClose, onSave, product }) => {
  const [formData, setFormData] = useState<Partial<Product>>(product || {
    sku: '',
    nombre: '',
    descripcion: '',
    un_medida: 'Unidad',
    ubicacion: '',
    categoria_id: MOCK_CATEGORIES[0]?.id || '',
    valor_promedio: 0,
    stock_actual: 0,
    stock_min: 0,
    stock_max: 0,
    proveedor_predeterminado: MOCK_PROVIDERS[0]?.id || '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof Product, string>>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData(product);
    } else {
      setFormData({
        sku: '', nombre: '', descripcion: '', un_medida: 'Unidad', ubicacion: '', 
        categoria_id: MOCK_CATEGORIES[0]?.id || '', valor_promedio: 0, stock_actual: 0,
        stock_min: 0, stock_max: 0, proveedor_predeterminado: MOCK_PROVIDERS[0]?.id || '',
      });
    }
    setErrors({});
    setIsLoading(false);
  }, [product, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'valor_promedio' || name === 'stock_actual' || name === 'stock_min' || name === 'stock_max' ? parseFloat(value) || 0 : value }));
    if (errors[name as keyof Product]) {
        setErrors(prev => ({...prev, [name]: undefined}));
    }
  };
  
  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof Product, string>> = {};
    if (!formData.sku) newErrors.sku = "SKU es requerido.";
    if (!formData.nombre) newErrors.nombre = "Nombre es requerido.";
    if ((formData.stock_min || 0) < 0) newErrors.stock_min = "Stock mínimo no puede ser negativo.";
    if ((formData.stock_max || 0) < (formData.stock_min || 0) && (formData.stock_max || 0) !== 0 ) newErrors.stock_max = "Stock máximo debe ser mayor o igual al mínimo (o 0 si no aplica).";
    if ((formData.valor_promedio || 0) < 0) newErrors.valor_promedio = "Valor promedio no puede ser negativo.";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  const handleSubmit = (e: FormEvent) => { // Removed async as timeout is removed
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    // Removed: await new Promise(resolve => setTimeout(resolve, 1500)); 

    const isSuccess = true; // Assume success
    const messageAction = product ? 'actualizado' : 'creado';
    
    onSave(formData as Product, {
      success: isSuccess, // Always true for this non-simulated version
      message: `Producto ${formData.sku} ${messageAction} exitosamente.`
    });
    setIsLoading(false);
    // if (isSuccess) { // This condition is always true now
    onClose(); 
    // }
  };

  const categoryOptions = MOCK_CATEGORIES.map(cat => ({ value: cat.id, label: cat.nombre }));
  const providerOptions = MOCK_PROVIDERS.map(prov => ({ value: prov.id, label: prov.nombre }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={product ? 'Editar Producto' : 'Nuevo Producto'} size="xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="SKU" name="sku" value={formData.sku || ''} onChange={handleChange} required disabled={!!product} error={errors.sku}/>
            <Input label="Nombre Producto" name="nombre" value={formData.nombre || ''} onChange={handleChange} required error={errors.nombre}/>
        </div>
        
        <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
        <textarea name="descripcion" id="descripcion" rows={3} value={formData.descripcion || ''} onChange={handleChange} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"></textarea>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input label="Unidad de Medida" name="un_medida" value={formData.un_medida || 'Unidad'} onChange={handleChange} required />
            <Input label="Ubicación" name="ubicacion" value={formData.ubicacion || ''} onChange={handleChange} />
            <Select label="Categoría" name="categoria_id" value={formData.categoria_id || ''} onChange={handleChange} options={categoryOptions} required />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <Select label="Proveedor Predeterminado" name="proveedor_predeterminado" value={formData.proveedor_predeterminado || ''} onChange={handleChange} options={providerOptions} placeholder="Seleccione proveedor"/>
             <Input label="Valor Promedio (CLP)" name="valor_promedio" type="number" value={formData.valor_promedio?.toString() || '0'} onChange={handleChange} error={errors.valor_promedio} min="0" step="0.01"/>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input label="Stock Actual" name="stock_actual" type="number" value={formData.stock_actual?.toString() || '0'} onChange={handleChange} required disabled={!!product} />
            <Input label="Stock Mínimo" name="stock_min" type="number" value={formData.stock_min?.toString() || '0'} onChange={handleChange} error={errors.stock_min} min="0"/>
            <Input label="Stock Máximo" name="stock_max" type="number" value={formData.stock_max?.toString() || '0'} onChange={handleChange} error={errors.stock_max} min="0"/>
        </div>
        
        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>Cancelar</Button>
          <Button type="submit" isLoading={isLoading} disabled={isLoading}>
            {isLoading ? (product ? 'Guardando...' : 'Creando...') : (product ? 'Guardar Cambios' : 'Crear Producto')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ProductForm;
