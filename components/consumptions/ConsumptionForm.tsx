
import React, { useState, useEffect, useRef } from 'react';
import { Consumption, WorkOrder, Product, User, ConsumptionDetail, Solicitante } from '../../types';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { Alert } from '../ui/Alert';
import { TrashIcon, PlusIcon } from '../../constants';
import { MOCK_SOLICITANTES } from '../../constants'; // Using new MOCK_SOLICITANTES

interface ConsumptionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (consumption: Consumption, isNewOT: boolean, newOTNumber?: string) => void;
  consumptionToEdit?: Consumption; 
  allProducts: Product[];
  allWorkOrders: WorkOrder[];
  allSolicitantes: Solicitante[]; // New prop for requesters
  currentUser: User | null;
}

const ConsumptionForm: React.FC<ConsumptionFormProps> = ({
  isOpen,
  onClose,
  onSave,
  consumptionToEdit,
  allProducts,
  allWorkOrders,
  allSolicitantes, // Use this prop
  currentUser
}) => {
  const [numeroOtInput, setNumeroOtInput] = useState('');
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
  const [isNewOT, setIsNewOT] = useState(false);
  
  // Use Solicitante ID now. Default to first solicitante or empty if list is empty.
  const [solicitanteId, setSolicitanteId] = useState(allSolicitantes[0]?.id || '');
  const [consumedItems, setConsumedItems] = useState<ConsumptionDetail[]>([]);
  
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [productSearchResults, setProductSearchResults] = useState<Product[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const productSearchInputRef = useRef<HTMLInputElement>(null);
  const productResultsRef = useRef<HTMLUListElement>(null);


  useEffect(() => {
    if (consumptionToEdit) {
      setNumeroOtInput(consumptionToEdit.numero_ot);
      const existingOT = allWorkOrders.find(wo => wo.numero_ot === consumptionToEdit.numero_ot);
      setSelectedWorkOrder(existingOT || null);
      setIsNewOT(!existingOT);
      setSolicitanteId(consumptionToEdit.solicitante_id); // This will be Solicitante.id
      setConsumedItems(consumptionToEdit.items.map(item => ({...item, id: item.id || item.product_sku })));
    } else {
      // Reset for new consumption
      setNumeroOtInput('');
      setSelectedWorkOrder(null);
      setIsNewOT(false);
      setSolicitanteId(allSolicitantes[0]?.id || ''); // Default to first solicitante
      setConsumedItems([]);
    }
    setProductSearchTerm('');
    setProductSearchResults([]);
    setErrors({});
  }, [consumptionToEdit, isOpen, currentUser, allWorkOrders, allSolicitantes]);

  // Debounced OT search or onBlur
  useEffect(() => {
    if (!numeroOtInput.trim()) {
        setSelectedWorkOrder(null);
        setIsNewOT(false);
        return;
    }
    // Basic OT format check (e.g., "OT.XXXXX")
    const otFormatRegex = /^OT\.\d{4,}/i;
    if(!otFormatRegex.test(numeroOtInput.trim())) {
        setErrors(prev => ({...prev, numero_ot: 'Formato OT inválido (ej: OT.12345)'}));
        setSelectedWorkOrder(null);
        setIsNewOT(false);
        return;
    } else {
         setErrors(prev => ({...prev, numero_ot: ''}));
    }

    const foundOT = allWorkOrders.find(wo => wo.numero_ot.toLowerCase() === numeroOtInput.trim().toLowerCase());
    if (foundOT) {
      setSelectedWorkOrder(foundOT);
      setIsNewOT(false);
    } else {
      setSelectedWorkOrder(null); // Clear if no exact match, indicate it's new
      setIsNewOT(true);
    }
  }, [numeroOtInput, allWorkOrders]);

   // Product Search
  useEffect(() => {
    if (productSearchTerm.trim() === '') {
      setProductSearchResults([]);
      return;
    }
    const filtered = allProducts.filter(p =>
      (p.sku.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
       p.nombre.toLowerCase().includes(productSearchTerm.toLowerCase())) &&
      !consumedItems.some(ci => ci.product_sku === p.sku) // Exclude already added items
    );
    setProductSearchResults(filtered);
  }, [productSearchTerm, allProducts, consumedItems]);

  // Click outside for product search
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (productResultsRef.current && !productResultsRef.current.contains(event.target as Node) &&
          productSearchInputRef.current && !productSearchInputRef.current.contains(event.target as Node)
      ) {
        setProductSearchResults([]);
      }
    };
    if (productSearchResults.length > 0) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [productSearchResults]);


  const handleAddProductToConsumption = (product: Product) => {
    if (!consumedItems.some(item => item.product_sku === product.sku)) {
      setConsumedItems(prev => [...prev, { 
        id: product.sku, // Use SKU as temp ID for the item line
        product_sku: product.sku, 
        product_nombre: product.nombre, 
        cantidad_consumida: 1,
        un_medida: product.un_medida
      }]);
    }
    setProductSearchTerm('');
    setProductSearchResults([]);
    productSearchInputRef.current?.focus();
  };

  const handleItemQuantityChange = (sku: string, quantity: number) => {
    const productInAll = allProducts.find(p => p.sku === sku);
    if (productInAll && quantity > productInAll.stock_actual) {
        setErrors(prev => ({...prev, [`item_qty_${sku}`]: `Stock insuficiente (${productInAll.stock_actual})`}));
    } else {
        setErrors(prev => ({...prev, [`item_qty_${sku}`]: ''}));
    }
    setConsumedItems(prev => prev.map(item => item.product_sku === sku ? { ...item, cantidad_consumida: quantity } : item));
  };

  const handleRemoveItem = (sku: string) => {
    setConsumedItems(prev => prev.filter(item => item.product_sku !== sku));
    setErrors(prev => ({...prev, [`item_qty_${sku}`]: ''})); // Clear error if item removed
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!numeroOtInput.trim()) {
        newErrors.numero_ot = "Número de OT es requerido.";
    } else if (!/^OT\.\d{4,}/i.test(numeroOtInput.trim())) {
        newErrors.numero_ot = "Formato OT inválido (ej: OT.10458).";
    }
    if (!solicitanteId) newErrors.solicitante_id = "Solicitante es requerido.";
    if (consumedItems.length === 0) newErrors.items = "Debe agregar al menos un insumo.";

    consumedItems.forEach(item => {
        if (item.cantidad_consumida <= 0) {
            newErrors[`item_qty_${item.product_sku}`] = "Cantidad debe ser mayor a cero.";
        }
        const product = allProducts.find(p => p.sku === item.product_sku);
        if (product && item.cantidad_consumida > product.stock_actual) {
             newErrors[`item_qty_${item.product_sku}`] = `Cantidad excede stock (${product.stock_actual}).`;
        }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !validate()) return;

    const solicitante = allSolicitantes.find(s => s.id === solicitanteId); // Find from allSolicitantes

    const finalConsumption: Consumption = {
      id: consumptionToEdit?.id || `cons-${Date.now()}`,
      numero_ot: numeroOtInput.trim().toUpperCase(),
      work_order_id: selectedWorkOrder?.id || numeroOtInput.trim().toUpperCase(), 
      solicitante_id: solicitanteId,
      solicitante_nombre: solicitante?.nombre_completo, // Use nombre_completo from Solicitante
      items: consumedItems,
      fecha_consumo: consumptionToEdit?.fecha_consumo || new Date().toISOString(),
      usuario_responsable_id: currentUser.id,
      usuario_responsable_nombre: currentUser.username,
    };
    onSave(finalConsumption, isNewOT && !selectedWorkOrder, isNewOT && !selectedWorkOrder ? numeroOtInput.trim().toUpperCase() : undefined);
  };

  // Use allSolicitantes for options
  const solicitanteOptions = allSolicitantes.map(s => ({ value: s.id, label: `${s.nombre_completo} (${s.codigo_interno})` }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={consumptionToEdit ? 'Editar Consumo' : 'Registrar Nuevo Consumo'} size="xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* OT and Requester Section */}
        <div className="p-4 border rounded-md bg-gray-50">
            <h3 className="text-lg font-medium text-gray-800 mb-3">Información de Orden de Trabajo y Solicitante</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Input
                        label="Número de Orden de Trabajo (OT)"
                        name="numero_ot_input"
                        value={numeroOtInput}
                        onChange={(e) => setNumeroOtInput(e.target.value)}
                        placeholder="Ej: OT.10458"
                        error={errors.numero_ot}
                        required
                    />
                    {selectedWorkOrder && <p className="text-xs text-green-600 mt-1">OT existente: {selectedWorkOrder.descripcion}</p>}
                    {isNewOT && numeroOtInput && !errors.numero_ot && <p className="text-xs text-blue-600 mt-1">Se creará una nueva OT con este número.</p>}
                </div>
                <Select
                    label="Solicitante"
                    name="solicitante_id"
                    options={solicitanteOptions} // Use solicitanteOptions
                    value={solicitanteId}
                    onChange={(e) => setSolicitanteId(e.target.value)}
                    error={errors.solicitante_id}
                    required
                    placeholder="Seleccione un solicitante"
                />
            </div>
        </div>

        {/* Product Search and Add Section */}
        <div className="p-4 border rounded-md">
            <h3 className="text-lg font-medium text-gray-800 mb-3">Insumos a Consumir</h3>
            <div className="flex items-start gap-2 mb-3 relative">
                <div className="flex-grow">
                    <Input
                        ref={productSearchInputRef}
                        label="Buscar Producto (SKU o Nombre)"
                        placeholder="Escriba para buscar..."
                        value={productSearchTerm}
                        onChange={(e) => setProductSearchTerm(e.target.value)}
                        onFocus={() => { /* Keep search results visible if already populated */ }}
                        autoComplete="off"
                    />
                    {productSearchResults.length > 0 && (
                        <ul ref={productResultsRef} className="absolute z-20 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto mt-1">
                            {productSearchResults.map(p => (
                            <li
                                key={p.id}
                                className="px-3 py-2 hover:bg-primary-light cursor-pointer text-sm"
                                onClick={() => handleAddProductToConsumption(p)}
                            >
                                {p.sku} - {p.nombre} (Stock: {p.stock_actual})
                            </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {/* Consumed Items List */}
            {consumedItems.length > 0 && (
            <div className="mt-4 space-y-3 max-h-60 overflow-y-auto pr-2">
                {consumedItems.map((item, index) => (
                <div key={item.id} className="grid grid-cols-12 gap-2 items-center p-2 border rounded-md hover:bg-gray-50">
                    <div className="col-span-5">
                        <p className="text-sm font-medium text-gray-800 truncate" title={`${item.product_sku} - ${item.product_nombre}`}>{item.product_sku} - {item.product_nombre}</p>
                        <p className="text-xs text-gray-500">Unidad: {item.un_medida}</p>
                    </div>
                    <div className="col-span-4">
                        <Input
                            type="number"
                            value={item.cantidad_consumida.toString()}
                            onChange={(e) => handleItemQuantityChange(item.product_sku, parseFloat(e.target.value) || 0)}
                            min="0.01"
                            step="0.01"
                            className="text-sm py-1"
                            error={errors[`item_qty_${item.product_sku}`]}
                            containerClassName="mb-0"
                        />
                    </div>
                    <div className="col-span-2">
                        { allProducts.find(p=>p.sku === item.product_sku) && <p className="text-xs text-gray-500">Stock: {allProducts.find(p=>p.sku === item.product_sku)?.stock_actual}</p> }
                    </div>
                    <div className="col-span-1 text-right">
                        <Button type="button" variant="danger" size="sm" onClick={() => handleRemoveItem(item.product_sku)} className="p-1">
                            <TrashIcon className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
                ))}
            </div>
            )}
            {errors.items && <p className="text-xs text-red-600 mt-1">{errors.items}</p>}

        </div> {/* End Insumos a Consumir Section */}

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={!numeroOtInput.trim() || consumedItems.length === 0}>
            {consumptionToEdit ? 'Guardar Cambios' : 'Registrar Consumo'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ConsumptionForm;