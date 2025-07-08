
import React, { useState, useEffect, ChangeEvent, useRef } from 'react';
import { DocumentHeader, DocumentDetail, DocumentType, Provider, Product, FileInfo, MaterialRequest } from '../../types';
import { MOCK_PROVIDERS, MOCK_PRODUCTS_FOR_CONSUMPTION, MOCK_MATERIAL_REQUESTS, logAuditEntry } from '../../constants'; 
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { TrashIcon, PlusIcon, PaperClipIcon } from '../../constants';
import { updateMaterialRequestStatus } from '../../utils/materialRequestUtils';
import { useAuth } from '../../hooks/useAuth';

const MOCK_PRODUCTS_FOR_DOC_FORM: Product[] = MOCK_PRODUCTS_FOR_CONSUMPTION;


interface DocumentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (document: DocumentHeader) => void;
  documentData?: DocumentHeader; 
  isReadOnly?: boolean;
}

const DocumentForm: React.FC<DocumentFormProps> = ({ isOpen, onClose, onSave, documentData, isReadOnly = false }) => {
  const { user } = useAuth();
  const initialDetail: DocumentDetail = { id: `temp-${Date.now()}`, sku: '', nombre_producto: '', cantidad: 1, valor_unitario: 0, valor_total: 0 };
  const [headerData, setHeaderData] = useState<Partial<DocumentHeader>>(documentData || {
    tipo_documento: DocumentType.FACTURA,
    numero_documento: '',
    fecha_emision: new Date().toISOString().split('T')[0],
    fecha_recepcion: new Date().toISOString().split('T')[0],
    proveedor_id: MOCK_PROVIDERS[0]?.id || '',
    detalles: [], 
    material_request_id_link: '', 
  });
  const [details, setDetails] = useState<DocumentDetail[]>(documentData?.detalles || [initialDetail]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [attachmentInfo, setAttachmentInfo] = useState<FileInfo | undefined>(documentData?.attachment);

  const [activeSkuInputIndex, setActiveSkuInputIndex] = useState<number | null>(null);
  const [skuSearchQuery, setSkuSearchQuery] = useState<string>('');
  const [skuSearchResults, setSkuSearchResults] = useState<Product[]>([]);
  const searchResultsRef = useRef<HTMLUListElement>(null);


  useEffect(() => {
    if (documentData) {
      setHeaderData(documentData);
      setDetails(documentData.detalles.length > 0 ? documentData.detalles.map(d => ({...d, id: d.id || `temp-${Date.now()}-${Math.random()}`})) : [{...initialDetail, id: `temp-init-${Date.now()}`}]);
      setAttachmentInfo(documentData.attachment);
      setSelectedFile(null); 
    } else { 
      const newInitialDetail = { ...initialDetail, id: `temp-new-${Date.now()}` };
      setHeaderData({
        tipo_documento: DocumentType.FACTURA,
        numero_documento: '',
        fecha_emision: new Date().toISOString().split('T')[0],
        fecha_recepcion: new Date().toISOString().split('T')[0],
        proveedor_id: MOCK_PROVIDERS[0]?.id || '',
        material_request_id_link: '',
      });
      setDetails([newInitialDetail]);
      setAttachmentInfo(undefined);
      setSelectedFile(null);
    }
    setActiveSkuInputIndex(null);
    setSkuSearchQuery('');
    setSkuSearchResults([]);
  }, [documentData, isOpen]); 

    useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchResultsRef.current && !searchResultsRef.current.contains(event.target as Node)) {
        setSkuSearchResults([]); 
        setActiveSkuInputIndex(null); 
      }
    };
    if (activeSkuInputIndex !== null && skuSearchResults.length > 0) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeSkuInputIndex, skuSearchResults]);


  const handleHeaderChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setHeaderData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedFile(file);
      setAttachmentInfo({ 
          name: file.name,
          type: file.type,
          size: file.size,
          url: URL.createObjectURL(file) 
      });
    } else {
      setSelectedFile(null);
      setAttachmentInfo(documentData?.attachment);
    }
  };

  const handleDetailChange = (index: number, field: keyof DocumentDetail, value: string | number) => {
    const newDetails = [...details];
    const currentDetail = { ...newDetails[index] };
    // @ts-ignore
    currentDetail[field] = value;
    
    if (field === 'sku') { 
        const product = MOCK_PRODUCTS_FOR_DOC_FORM.find(p => p.sku === value);
        currentDetail.nombre_producto = product ? product.nombre : 'SKU no encontrado';
        if(product && !isReadOnly && !documentData) { 
            if (skuSearchResults.some(r => r.sku === value)) {
                currentDetail.valor_unitario = product.valor_promedio;
            }
        }
    }

    const cantidad = Number(currentDetail.cantidad) || 0;
    const valorUnitario = Number(currentDetail.valor_unitario) || 0;
    const descuento = Number(currentDetail.descuento_porcentaje) || 0;
    currentDetail.valor_total = cantidad * valorUnitario * (1 - (descuento / 100));
    
    newDetails[index] = currentDetail;
    setDetails(newDetails);
  };
  
  const handleSkuSearchChange = (index: number, query: string) => {
    setSkuSearchQuery(query);
    handleDetailChange(index, 'sku', query); 

    if (query.trim().length > 0) {
        const filteredProducts = MOCK_PRODUCTS_FOR_DOC_FORM.filter(p => 
            p.sku.toLowerCase().includes(query.toLowerCase()) || 
            p.nombre.toLowerCase().includes(query.toLowerCase())
        );
        setSkuSearchResults(filteredProducts);
    } else {
        setSkuSearchResults([]);
    }
  };

  const handleSkuSelect = (index: number, product: Product) => {
    handleDetailChange(index, 'sku', product.sku);
    handleDetailChange(index, 'nombre_producto', product.nombre); 
    handleDetailChange(index, 'valor_unitario', product.valor_promedio); 

    setSkuSearchQuery('');
    setSkuSearchResults([]);
    setActiveSkuInputIndex(null);
    
    const quantityInput = document.getElementsByName(`cantidad-${index}`)[0] as HTMLInputElement; 
    quantityInput?.focus();
  };


  const addDetailLine = () => {
    setDetails([...details, { ...initialDetail, id: `temp-${Date.now()}-${details.length}` }]);
  };

  const removeDetailLine = (index: number) => {
    if (details.length > 1) {
      setDetails(details.filter((_, i) => i !== index));
    }
  };
  
  const calculateTotalDocumento = () => {
    return details.reduce((sum, detail) => sum + (detail.valor_total || 0), 0);
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    let finalAttachmentInfo: FileInfo | undefined = headerData.attachment; 
    if (selectedFile) {
        finalAttachmentInfo = {
            name: selectedFile.name,
            type: selectedFile.type,
            size: selectedFile.size,
            url: `#mock-uploaded-${selectedFile.name}` 
        };
    }
    
    const documentIdToSave = documentData?.id || headerData.id || `NEEDS_ID_FROM_LIST_PAGE`;
    
    const finalDoc: DocumentHeader = { 
        ...(headerData as DocumentHeader), 
        id: documentIdToSave, 
        detalles: details.map(d => ({...d, id: d.id.startsWith('temp-') ? `det-${documentIdToSave}-${Math.random().toString(36).substr(2,5)}` : d.id})), 
        valor_total_documento: calculateTotalDocumento(),
        estado: headerData.estado || "Recibido", 
        proveedor_nombre: MOCK_PROVIDERS.find(p => p.id === headerData.proveedor_id)?.nombre || '',
        attachment: finalAttachmentInfo,
        material_request_id_link: headerData.material_request_id_link || undefined,
    };
    
    if (!documentData) { 
        finalDoc.detalles.forEach(detail => {
            const productIndex = MOCK_PRODUCTS_FOR_CONSUMPTION.findIndex(p => p.sku === detail.sku);
            if (productIndex !== -1) {
                const product = MOCK_PRODUCTS_FOR_CONSUMPTION[productIndex];
                const oldStock = product.stock_actual;
                const oldAvgCost = product.valor_promedio;
                const newQuantity = detail.cantidad;
                const newUnitCost = detail.valor_unitario;

                MOCK_PRODUCTS_FOR_CONSUMPTION[productIndex].stock_actual += newQuantity;
                MOCK_PRODUCTS_FOR_CONSUMPTION[productIndex].fecha_ultimo_ingreso = finalDoc.fecha_recepcion;

                if (oldStock + newQuantity > 0) { 
                    MOCK_PRODUCTS_FOR_CONSUMPTION[productIndex].valor_promedio = ((oldStock * oldAvgCost) + (newQuantity * newUnitCost)) / (oldStock + newQuantity);
                } else if (newQuantity > 0) {
                    MOCK_PRODUCTS_FOR_CONSUMPTION[productIndex].valor_promedio = newUnitCost; 
                }
            }
        });
    }

    if (finalDoc.material_request_id_link) {
        const requestIndex = MOCK_MATERIAL_REQUESTS.findIndex(req => req.id === finalDoc.material_request_id_link);
        if (requestIndex !== -1) {
            let linkedRequest = { ...MOCK_MATERIAL_REQUESTS[requestIndex] };
            
            if (!linkedRequest.document_header_ids_fulfilling) {
                linkedRequest.document_header_ids_fulfilling = [];
            }
            if (!linkedRequest.document_header_ids_fulfilling.includes(finalDoc.id)) {
                linkedRequest.document_header_ids_fulfilling.push(finalDoc.id);
            }

            // Update cantidades recibidas en la solicitud de material
            finalDoc.detalles.forEach(docDetail => {
                const itemIndex = linkedRequest.items.findIndex(reqItem => reqItem.producto_sku_esperado === docDetail.sku);
                if (itemIndex !== -1) {
                    const currentItem = linkedRequest.items[itemIndex];
                    const newReceivedQty = (currentItem.cantidad_recibida || 0) + docDetail.cantidad;
                    // Cap received quantity at solicited quantity for simplicity, real systems might handle over-receipt
                    linkedRequest.items[itemIndex].cantidad_recibida = Math.min(currentItem.cantidad_solicitada, newReceivedQty);
                }
            });
            
            // Recalculate statuses for the material request
            const updatedLinkedRequest = updateMaterialRequestStatus(linkedRequest);
            MOCK_MATERIAL_REQUESTS[requestIndex] = updatedLinkedRequest;
            logAuditEntry(user.username, "SOLICITUD_MATERIAL_ACTUALIZADA", `Solicitud ${updatedLinkedRequest.id} actualizada por Documento ${finalDoc.id}. Nuevo estado: ${updatedLinkedRequest.estado_general}.`);
        }
    }
    
    onSave(finalDoc);
    setSelectedFile(null); 
  };

  const providerOptions = MOCK_PROVIDERS.map(p => ({ value: p.id, label: p.nombre }));
  const documentTypeOptions = Object.values(DocumentType).map(dt => ({ value: dt, label: dt }));
  const openMaterialRequestsOptions = [
      { value: '', label: 'Ninguna (Opcional)' },
      ...MOCK_MATERIAL_REQUESTS
        .filter(req => req.estado_general === 'Abierta' || req.estado_general === 'En Compra' || req.estado_general === 'Parcialmente Recibida')
        .map(req => ({
            value: req.id,
            label: `${req.id} - ${req.solicitante_nombre} (${new Date(req.fecha_solicitud).toLocaleDateString('es-CL')}) - ${req.items[0]?.descripcion_item.substring(0,20) || 'Item(s)'}...`
        }))
  ];
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={documentData ? `Ver Documento: ${documentData.numero_documento}` : 'Registrar Nuevo Documento'} size="xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        <fieldset disabled={isReadOnly}>
          <div className="border border-gray-200 dark:border-slate-700 p-4 rounded-md">
            <h3 className="text-lg font-semibold mb-3 text-gray-700 dark:text-slate-200">Encabezado del Documento</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select label="Tipo Documento" name="tipo_documento" value={headerData.tipo_documento || ''} onChange={handleHeaderChange} options={documentTypeOptions} required />
              <Input label="N° Documento" name="numero_documento" value={headerData.numero_documento || ''} onChange={handleHeaderChange} required />
              <Input label="Fecha Emisión" name="fecha_emision" type="date" value={headerData.fecha_emision || ''} onChange={handleHeaderChange} required />
              <Input label="Fecha Recepción" name="fecha_recepcion" type="date" value={headerData.fecha_recepcion || ''} onChange={handleHeaderChange} required />
              <Select label="Proveedor" name="proveedor_id" value={headerData.proveedor_id || ''} onChange={handleHeaderChange} options={providerOptions} required />
              <Select 
                label="Asociar a Solicitud de Material (Opcional)" 
                name="material_request_id_link" 
                value={headerData.material_request_id_link || ''} 
                onChange={handleHeaderChange} 
                options={openMaterialRequestsOptions}
                containerClassName="md:col-span-2" 
              />
            </div>
            <div className="mt-4">
                <label htmlFor="documentAttachment" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    Adjuntar Documento (Scan/PDF)
                </label>
                <Input 
                    type="file" 
                    id="documentAttachment" 
                    name="documentAttachment" 
                    onChange={handleFileChange} 
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="text-sm"
                    disabled={isReadOnly}
                />
                 {attachmentInfo && (
                    <div className="mt-2 text-sm text-gray-600 dark:text-slate-400">
                        <PaperClipIcon className="w-4 h-4 inline mr-1" />
                        Archivo adjunto: 
                        <a href={attachmentInfo.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline ml-1">
                           {attachmentInfo.name}
                        </a> 
                        ({(attachmentInfo.size / 1024).toFixed(1)} KB)
                        {!isReadOnly && selectedFile && (
                             <button type="button" onClick={() => {setSelectedFile(null); setAttachmentInfo(documentData?.attachment);(document.getElementById('documentAttachment') as HTMLInputElement).value = ''; }} className="ml-2 text-red-500 text-xs hover:text-red-700">(Quitar)</button>
                        )}
                    </div>
                )}
                {!isReadOnly && <p className="text-xs text-gray-500 dark:text-slate-500 mt-1">La compresión de archivos usualmente se realiza en el servidor.</p>}
            </div>
          </div>

          <div className="border border-gray-200 dark:border-slate-700 p-4 rounded-md mt-6">
            <h3 className="text-lg font-semibold mb-3 text-gray-700 dark:text-slate-200">Detalles del Documento</h3>
            {details.map((detail, index) => (
              <div key={detail.id || `detail-${index}`} className="grid grid-cols-1 md:grid-cols-6 gap-x-3 gap-y-2 items-end mb-3 p-2 border-b dark:border-slate-700/50 border-gray-100 relative">
                <div className="md:col-span-2">
                    <Input 
                        label="SKU / Nombre Producto" 
                        name="sku" 
                        value={detail.sku} 
                        onChange={(e) => handleSkuSearchChange(index, e.target.value)}
                        onFocus={() => setActiveSkuInputIndex(index)}
                        placeholder="Buscar SKU o nombre..."
                        required
                        autoComplete="off"
                        disabled={isReadOnly}
                    />
                    {activeSkuInputIndex === index && skuSearchResults.length > 0 && (
                        <ul ref={searchResultsRef} className="absolute z-10 w-full bg-white dark:bg-slate-600 border border-gray-300 dark:border-slate-500 rounded-md shadow-lg max-h-60 overflow-y-auto mt-1">
                            {skuSearchResults.map(p => (
                                <li 
                                    key={p.id} 
                                    className="px-3 py-2 hover:bg-primary-light dark:hover:bg-primary-dark/50 cursor-pointer text-sm"
                                    onClick={() => handleSkuSelect(index, p)}
                                >
                                    {p.sku} - {p.nombre} (Stock: {p.stock_actual})
                                </li>
                            ))}
                        </ul>
                    )}
                     {detail.nombre_producto && detail.nombre_producto !== 'SKU no encontrado' && <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 truncate">Nombre: {detail.nombre_producto}</p>}
                </div>
                <Input label="Cantidad" name={`cantidad-${index}`} type="number" value={detail.cantidad.toString()} onChange={(e) => handleDetailChange(index, 'cantidad', parseFloat(e.target.value))} min="0.01" step="0.01" required disabled={isReadOnly} />
                <Input label="Valor Unit. (CLP)" name="valor_unitario" type="number" value={detail.valor_unitario.toString()} onChange={(e) => handleDetailChange(index, 'valor_unitario', parseFloat(e.target.value))} min="0" step="0.01" required disabled={isReadOnly}/>
                <Input label="Desc. (%)" name="descuento_porcentaje" type="number" value={detail.descuento_porcentaje?.toString() || '0'} onChange={(e) => handleDetailChange(index, 'descuento_porcentaje', parseFloat(e.target.value))} min="0" max="100" step="0.01" disabled={isReadOnly}/>
                <div className="flex flex-col">
                    <span className="text-xs text-gray-500 dark:text-slate-400">Valor Total</span>
                    <span className="font-semibold h-10 flex items-center text-gray-800 dark:text-slate-200">
                        {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(detail.valor_total || 0)}
                    </span>
                </div>
                {!isReadOnly && (
                  <Button type="button" variant="danger" size="sm" onClick={() => removeDetailLine(index)} className="self-end mb-px" disabled={details.length <=1}>
                    <TrashIcon className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
            {!isReadOnly && (
              <Button type="button" variant="outline" size="sm" onClick={addDetailLine} leftIcon={<PlusIcon className="w-4 h-4" />}>
                Añadir Línea
              </Button>
            )}
          </div>
          
          <div className="mt-6 text-right">
            <p className="text-xl font-semibold text-gray-800 dark:text-slate-100">
                Total Documento: {new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(calculateTotalDocumento())}
            </p>
          </div>
        </fieldset>

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>Cerrar</Button>
          {!isReadOnly && <Button type="submit">Guardar Documento</Button>}
        </div>
      </form>
    </Modal>
  );
};

export default DocumentForm;
