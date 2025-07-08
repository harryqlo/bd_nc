
import React, { useState, useEffect } from 'react';
import { 
    MaterialRequest, MaterialRequestItem, MaterialRequestStatus, MaterialRequestItemStatus, 
    Solicitante, Provider, User, DocumentHeader, Product 
} from '../../types';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { TrashIcon, PlusIcon } from '../../constants';
import { MOCK_PROVIDERS, MOCK_PRODUCTS_FOR_CONSUMPTION } from '../../constants'; 
import { updateMaterialRequestStatus } from '../../utils/materialRequestUtils';

interface MaterialRequestFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (request: MaterialRequest) => void;
  requestToEdit?: MaterialRequest;
  currentUser: User;
  allSolicitantes: Solicitante[];
  allProviders: Provider[];
  allDocuments: DocumentHeader[]; 
  isEffectivelyReadOnly?: boolean; 
}

const initialItem: Omit<MaterialRequestItem, 'id'> = {
  descripcion_item: '',
  cantidad_solicitada: 1,
  unidad_medida_sugerida: 'Unidad',
  estado_item: 'Pendiente',
  cantidad_recibida: 0,
  producto_sku_esperado: '',
};

const MaterialRequestForm: React.FC<MaterialRequestFormProps> = ({
  isOpen,
  onClose,
  onSave,
  requestToEdit,
  currentUser,
  allSolicitantes,
  allProviders,
  allDocuments,
  isEffectivelyReadOnly = false, 
}) => {
  const [fechaSolicitud, setFechaSolicitud] = useState(new Date().toISOString().split('T')[0]);
  const [solicitanteId, setSolicitanteId] = useState(allSolicitantes[0]?.id || '');
  const [items, setItems] = useState<MaterialRequestItem[]>([{ ...initialItem, id: `temp-${Date.now()}` }]);
  const [estadoGeneral, setEstadoGeneral] = useState<MaterialRequestStatus>('Abierta');
  const [observaciones, setObservaciones] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (requestToEdit) {
      setFechaSolicitud(requestToEdit.fecha_solicitud);
      setSolicitanteId(requestToEdit.solicitante_id);
      setItems(requestToEdit.items.map(item => ({ ...item, id: item.id || `temp-${Date.now()}-${Math.random()}`, producto_sku_esperado: item.producto_sku_esperado || '' })));
      setEstadoGeneral(requestToEdit.estado_general);
      setObservaciones(requestToEdit.observaciones || '');
    } else {
      setFechaSolicitud(new Date().toISOString().split('T')[0]);
      setSolicitanteId(allSolicitantes[0]?.id || '');
      setItems([{ ...initialItem, id: `temp-${Date.now()}` }]);
      setEstadoGeneral('Abierta');
      setObservaciones('');
    }
    setErrors({});
  }, [requestToEdit, isOpen, allSolicitantes]);

  const handleItemChange = (index: number, field: keyof MaterialRequestItem, value: string | number | MaterialRequestItemStatus) => {
    const newItems = [...items];
    // @ts-ignore
    newItems[index][field] = value;
    setItems(newItems);
  };

  const addItemLine = () => {
    setItems([...items, { ...initialItem, id: `temp-${Date.now()}-${items.length}` }]);
  };

  const removeItemLine = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!solicitanteId) newErrors.solicitanteId = "Solicitante es requerido.";
    if (items.length === 0) newErrors.items = "Debe añadir al menos un ítem.";
    items.forEach((item, index) => {
      if (!item.descripcion_item.trim()) newErrors[`item_desc_${index}`] = "Descripción es requerida.";
      if (item.cantidad_solicitada <= 0) newErrors[`item_qty_${index}`] = "Cantidad solicitada debe ser > 0.";
      if ((item.cantidad_recibida || 0) < 0) newErrors[`item_qty_rec_${index}`] = "Cantidad recibida no puede ser negativa.";
      if ((item.cantidad_recibida || 0) > item.cantidad_solicitada && item.estado_item !== 'Cancelado') newErrors[`item_qty_rec_${index}`] = "Cant. recibida no puede exceder la solicitada.";
      if (item.producto_sku_esperado && !MOCK_PRODUCTS_FOR_CONSUMPTION.some(p => p.sku === item.producto_sku_esperado)) {
        newErrors[`item_sku_esp_${index}`] = "SKU esperado no existe en productos.";
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const solicitante = allSolicitantes.find(s => s.id === solicitanteId);

    // First, construct the request with current item states.
    let preliminaryRequest: MaterialRequest = {
      id: requestToEdit?.id || `NEEDS_ID_FROM_LIST_PAGE`, 
      fecha_solicitud: fechaSolicitud,
      solicitante_id: solicitanteId,
      solicitante_nombre: solicitante?.nombre_completo || 'N/A',
      items: items.map(item => ({...item, id: item.id.startsWith('temp-') ? `item_final_${Math.random().toString(36).substring(2,9)}` : item.id, cantidad_recibida: item.cantidad_recibida || 0 })),
      estado_general: estadoGeneral, // Use the manually set general status initially
      observaciones: observaciones,
      document_header_ids_fulfilling: requestToEdit?.document_header_ids_fulfilling || [],
    };

    // Then, apply the status update utility logic.
    // Pass a copy to avoid direct state mutation if utility modifies in place (though it should return new)
    const finalRequest = updateMaterialRequestStatus({ ...preliminaryRequest });
    
    // If user manually set estadoGeneral to Cancelada, respect that.
    if (estadoGeneral === 'Cancelada') {
        finalRequest.estado_general = 'Cancelada';
        finalRequest.items.forEach(item => {
            if (item.estado_item !== 'Recibido' && item.estado_item !== 'Parcialmente Recibido') { // Don't cancel already received items
                 item.estado_item = 'Cancelado';
            }
        });
    }


    onSave(finalRequest);
  };

  const solicitanteOptions = allSolicitantes.map(s => ({ value: s.id, label: s.nombre_completo }));
  const providerOptions = [{value: '', label: 'N/A'}, ...allProviders.map(p => ({ value: p.id, label: p.nombre }))];
  const itemStatusOptions: {value: MaterialRequestItemStatus, label: string}[] = [
      {value: 'Pendiente', label: 'Pendiente'},
      {value: 'En Compra', label: 'En Compra'},
      {value: 'Parcialmente Recibido', label: 'Parcialmente Recibido'},
      {value: 'Recibido', label: 'Recibido'},
      {value: 'Cancelado', label: 'Cancelado'},
  ];
   const requestStatusOptions: {value: MaterialRequestStatus, label: string}[] = [
      {value: 'Abierta', label: 'Abierta'},
      {value: 'En Compra', label: 'En Compra'},
      {value: 'Parcialmente Recibida', label: 'Parcialmente Recibida'},
      {value: 'Totalmente Recibida', label: 'Totalmente Recibida'},
      {value: 'Cancelada', label: 'Cancelada'},
  ];
  
  // SKU esperado options: all products
  const productSkuOptions = [{value:'', label:'SKU Opcional'}, ...MOCK_PRODUCTS_FOR_CONSUMPTION.map(p => ({value: p.sku, label: `${p.sku} - ${p.nombre}`}))];


  const finalIsFormReadOnly = isEffectivelyReadOnly || 
                              requestToEdit?.estado_general === 'Totalmente Recibida' || 
                              requestToEdit?.estado_general === 'Cancelada';

  const linkedDocs = requestToEdit?.document_header_ids_fulfilling
    ?.map(docId => allDocuments.find(d => d.id === docId))
    .filter(Boolean) as DocumentHeader[] | undefined;


  return (
    <Modal isOpen={isOpen} onClose={onClose} title={requestToEdit ? `Solicitud de Material: ${requestToEdit.id}` : 'Nueva Solicitud de Material'} size="xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        <fieldset disabled={finalIsFormReadOnly}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 border dark:border-slate-700 rounded-md bg-gray-50 dark:bg-slate-800/50">
                <Input label="Fecha Solicitud" type="date" value={fechaSolicitud} onChange={(e) => setFechaSolicitud(e.target.value)} required />
                <Select label="Solicitante" value={solicitanteId} onChange={(e) => setSolicitanteId(e.target.value)} options={solicitanteOptions} required error={errors.solicitanteId} />
                 <Select label="Estado General Solicitud" value={estadoGeneral} onChange={(e) => setEstadoGeneral(e.target.value as MaterialRequestStatus)} options={requestStatusOptions} required />
            </div>

            <div className="p-4 border dark:border-slate-700 rounded-md">
                <h3 className="text-lg font-semibold mb-3 text-gray-700 dark:text-slate-200">Ítems Solicitados</h3>
                {items.map((item, index) => (
                <div key={item.id} className="grid grid-cols-1 lg:grid-cols-12 gap-x-3 gap-y-2 items-start mb-3 p-2 border-b dark:border-slate-700/50 last:border-b-0">
                    <Input containerClassName="lg:col-span-3 mb-0" label="Descripción Ítem" value={item.descripcion_item} onChange={(e) => handleItemChange(index, 'descripcion_item', e.target.value)} required error={errors[`item_desc_${index}`]} />
                    <Select containerClassName="lg:col-span-2 mb-0" label="SKU Esperado (Opc.)" value={item.producto_sku_esperado || ''} onChange={(e) => handleItemChange(index, 'producto_sku_esperado', e.target.value)} options={productSkuOptions} error={errors[`item_sku_esp_${index}`]} />
                    <Input containerClassName="lg:col-span-1 mb-0" label="Cant. Sol." type="number" value={item.cantidad_solicitada.toString()} onChange={(e) => handleItemChange(index, 'cantidad_solicitada', parseFloat(e.target.value))} min="1" required error={errors[`item_qty_${index}`]}/>
                    <Input containerClassName="lg:col-span-1 mb-0" label="Un. Medida" value={item.unidad_medida_sugerida} onChange={(e) => handleItemChange(index, 'unidad_medida_sugerida', e.target.value)} placeholder="Un, Kg"/>
                    <Select containerClassName="lg:col-span-1 mb-0" label="Prov. Sug." value={item.proveedor_sugerido_id || ''} onChange={(e) => handleItemChange(index, 'proveedor_sugerido_id', e.target.value)} options={providerOptions} />
                    <Select containerClassName="lg:col-span-2 mb-0" label="Estado Ítem" value={item.estado_item} onChange={(e) => handleItemChange(index, 'estado_item', e.target.value as MaterialRequestItemStatus)} options={itemStatusOptions} required />
                    <Input containerClassName="lg:col-span-1 mb-0" label="Cant. Recib." type="number" value={(item.cantidad_recibida || 0).toString()} onChange={(e) => handleItemChange(index, 'cantidad_recibida', parseFloat(e.target.value))} min="0" error={errors[`item_qty_rec_${index}`]} />
                    <div className="lg:col-span-1 flex items-end justify-end pt-5">
                    {!finalIsFormReadOnly && (
                        <Button type="button" variant="danger" size="sm" onClick={() => removeItemLine(index)} className="h-9" disabled={items.length <= 1}>
                            <TrashIcon className="w-4 h-4" />
                        </Button>
                    )}
                    </div>
                </div>
                ))}
                {errors.items && <p className="text-xs text-red-600 mt-1">{errors.items}</p>}
                {!finalIsFormReadOnly && (
                <Button type="button" variant="outline" size="sm" onClick={addItemLine} leftIcon={<PlusIcon className="w-4 h-4" />}>
                    Añadir Ítem
                </Button>
                )}
            </div>

            <div className="mt-4 p-4 border dark:border-slate-700 rounded-md">
                 <label htmlFor="observaciones" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Observaciones Adicionales</label>
                <textarea name="observaciones" id="observaciones" rows={2} value={observaciones} onChange={(e) => setObservaciones(e.target.value)} className="block w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm bg-white dark:bg-slate-700 text-gray-900 dark:text-slate-200"></textarea>
            </div>
        </fieldset>

        {requestToEdit && linkedDocs && linkedDocs.length > 0 && (
             <div className="mt-4 p-4 border dark:border-slate-700 rounded-md bg-gray-50 dark:bg-slate-800/50">
                <h4 className="text-md font-semibold text-gray-700 dark:text-slate-200 mb-2">Documentos de Ingreso Asociados:</h4>
                <ul className="list-disc list-inside text-sm text-gray-600 dark:text-slate-300">
                    {linkedDocs.map(doc => (
                        <li key={doc.id}>{doc.tipo_documento} N° {doc.numero_documento} (Proveedor: {doc.proveedor_nombre})</li>
                    ))}
                </ul>
            </div>
        )}


        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          {!finalIsFormReadOnly && <Button type="submit">{requestToEdit ? 'Guardar Cambios' : 'Crear Solicitud'}</Button>}
        </div>
      </form>
    </Modal>
  );
};

export default MaterialRequestForm;
