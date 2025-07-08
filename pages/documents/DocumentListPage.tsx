
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { DocumentHeader, DocumentType, TableColumn, UserRole, FileInfo, Provider } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Table } from '../../components/ui/Table';
import { Card } from '../../components/ui/Card';
import { MainContainer } from '../../components/layout/MainContainer';
import DocumentForm from '../../components/documents/DocumentForm';
import { PlusIcon, EyeIcon, PaperClipIcon, XCircleIcon, MOCK_DOCUMENTS, MOCK_PROVIDERS, logAuditEntry } from '../../constants';
import { useAuth } from '../../hooks/useAuth';
import { Alert } from '../../components/ui/Alert';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value);
};

const initialSpecificFilters = {
  tipo_documento: '',
  fecha_emision_from: '',
  fecha_emision_to: '',
  fecha_recepcion_from: '',
  fecha_recepcion_to: '',
  proveedor_id: '',
  estado: '',
};

const documentStatusOptions = [
    { value: '', label: 'Todos los Estados' },
    { value: 'Recibido', label: 'Recibido' },
    { value: 'Parcialmente Recibido', label: 'Parcialmente Recibido' },
    { value: 'Cerrado', label: 'Cerrado' },
];


const DocumentListPage: React.FC = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<DocumentHeader[]>([...MOCK_DOCUMENTS]);
  const [searchTerm, setSearchTerm] = useState('');
  const [specificFilters, setSpecificFilters] = useState(initialSpecificFilters);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<DocumentHeader | undefined>(undefined);
  const [alertMessage, setAlertMessage] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const newDocumentIdCounter = useRef(MOCK_DOCUMENTS.length + 1);

  const canManage = user?.role === UserRole.ADMIN || user?.role === UserRole.WAREHOUSE_MANAGER;

  useEffect(() => {
     // setDocuments([...MOCK_DOCUMENTS]); // Sync with global if needed
  }, []);

  useEffect(() => {
    if (alertMessage) {
      const timer = setTimeout(() => setAlertMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [alertMessage]);

  const handleSpecificFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSpecificFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSpecificFilters(initialSpecificFilters);
  };

  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      const generalMatch = searchTerm === '' ||
        doc.numero_documento.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.proveedor_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.id.toLowerCase().includes(searchTerm.toLowerCase());

      if (!generalMatch) return false;

      if (specificFilters.tipo_documento && doc.tipo_documento !== specificFilters.tipo_documento) return false;
      if (specificFilters.proveedor_id && doc.proveedor_id !== specificFilters.proveedor_id) return false;
      if (specificFilters.estado && doc.estado !== specificFilters.estado) return false;
      
      if (specificFilters.fecha_emision_from && new Date(doc.fecha_emision) < new Date(specificFilters.fecha_emision_from)) return false;
      if (specificFilters.fecha_emision_to && new Date(doc.fecha_emision) > new Date(specificFilters.fecha_emision_to)) return false;
      if (specificFilters.fecha_recepcion_from && new Date(doc.fecha_recepcion) < new Date(specificFilters.fecha_recepcion_from)) return false;
      if (specificFilters.fecha_recepcion_to && new Date(doc.fecha_recepcion) > new Date(specificFilters.fecha_recepcion_to)) return false;

      return true;
    }).sort((a,b) => new Date(b.fecha_recepcion).getTime() - new Date(a.fecha_recepcion).getTime());
  }, [documents, searchTerm, specificFilters]);

  const handleAddDocument = () => {
    setViewingDocument(undefined); 
    setIsModalOpen(true);
  };

  const handleViewDocument = (doc: DocumentHeader) => {
    setViewingDocument(doc);
    setIsModalOpen(true); 
  };

  const handleSaveDocument = (docDataFromForm: DocumentHeader) => {
    if (!user) return;
    let updatedDocs;
    if (viewingDocument && docDataFromForm.id === viewingDocument.id) { 
        updatedDocs = documents.map(d => d.id === docDataFromForm.id ? docDataFromForm : d);
        const MOCK_DOCUMENTS_Index = MOCK_DOCUMENTS.findIndex(d => d.id === docDataFromForm.id);
        if(MOCK_DOCUMENTS_Index !== -1) MOCK_DOCUMENTS[MOCK_DOCUMENTS_Index] = docDataFromForm;
        logAuditEntry(user.username, "DOCUMENTO_ACTUALIZADO", `Documento '${docDataFromForm.tipo_documento} N°${docDataFromForm.numero_documento}' (ID: ${docDataFromForm.id}) actualizado.`);
        setAlertMessage({ type: 'success', message: `Documento ${docDataFromForm.numero_documento} actualizado.` });
    } else { 
        const newGeneratedId = `DOC_DYN_${newDocumentIdCounter.current++}`;
        const newDocWithId = { ...docDataFromForm, id: newGeneratedId};
        updatedDocs = [newDocWithId, ...documents];
        MOCK_DOCUMENTS.unshift(newDocWithId);
        logAuditEntry(user.username, "DOCUMENTO_CREADO", `Documento '${newDocWithId.tipo_documento} N°${newDocWithId.numero_documento}' (ID: ${newGeneratedId}) creado.`);
        setAlertMessage({ type: 'success', message: `Documento ${newDocWithId.numero_documento} registrado con ID ${newGeneratedId}.` });
    }
    setDocuments(updatedDocs);
    setIsModalOpen(false);
  };

  const columns: TableColumn<DocumentHeader>[] = [
    { key: 'id', header: 'ID Interno', className: 'font-semibold' },
    { key: 'tipo_documento', header: 'Tipo Doc.' },
    { 
      key: 'numero_documento', 
      header: 'N° Doc.', 
      className: 'text-primary',
      render: item => (
        <div className="flex items-center">
          {item.numero_documento}
          {item.attachment && (
            <span title={`Adjunto: ${item.attachment.name}`}>
              <PaperClipIcon className="w-4 h-4 ml-2 text-gray-400" aria-hidden="true" />
            </span>
          )}
        </div>
      ) 
    },
    { key: 'proveedor_nombre', header: 'Proveedor' },
    { key: 'fecha_recepcion', header: 'Fecha Recepción', render: item => new Date(item.fecha_recepcion).toLocaleDateString('es-CL') },
    { key: 'valor_total_documento', header: 'Valor Total (CLP)', render: item => formatCurrency(item.valor_total_documento) },
    { key: 'estado', header: 'Estado', render: item => <span className={`px-2 py-1 text-xs font-semibold rounded-full ${item.estado === 'Recibido' ? 'bg-green-100 text-green-700' : (item.estado === 'Parcialmente Recibido' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700')}`}>{item.estado}</span> },
    {
      key: 'actions',
      header: 'Acciones',
      render: (item) => (
        <Button size="sm" variant="ghost" onClick={() => handleViewDocument(item)} title="Ver Detalle">
          <EyeIcon className="w-4 h-4" />
        </Button>
      ),
    },
  ];

  const documentTypeOptions = [{value: '', label: 'Todos los Tipos'}, ...Object.values(DocumentType).map(dt => ({ value: dt, label: dt }))];
  const providerOptions = [{value: '', label: 'Todos los Proveedores'}, ...MOCK_PROVIDERS.map(p => ({value: p.id, label: p.nombre}))];


  return (
    <MainContainer className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-800">Documentos de Ingreso</h1>
        {canManage && (
          <Button onClick={handleAddDocument} leftIcon={<PlusIcon className="w-5 h-5" />}>
            Registrar Documento
          </Button>
        )}
      </div>

      {alertMessage && <Alert type={alertMessage.type} message={alertMessage.message} onClose={() => setAlertMessage(null)} />}

      <Card title="Filtros de Búsqueda">
        <div className="p-4 space-y-4">
            <Input
                type="text"
                placeholder="Búsqueda rápida por N° Doc, Proveedor, ID Interno..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-full"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Select label="Tipo Documento" name="tipo_documento" value={specificFilters.tipo_documento} onChange={handleSpecificFilterChange} options={documentTypeOptions} containerClassName="mb-0"/>
                <Select label="Proveedor" name="proveedor_id" value={specificFilters.proveedor_id} onChange={handleSpecificFilterChange} options={providerOptions} containerClassName="mb-0"/>
                <Select label="Estado" name="estado" value={specificFilters.estado} onChange={handleSpecificFilterChange} options={documentStatusOptions} containerClassName="mb-0"/>
                
                <Input label="Emisión Desde" type="date" name="fecha_emision_from" value={specificFilters.fecha_emision_from} onChange={handleSpecificFilterChange} containerClassName="mb-0" max={specificFilters.fecha_emision_to}/>
                <Input label="Emisión Hasta" type="date" name="fecha_emision_to" value={specificFilters.fecha_emision_to} onChange={handleSpecificFilterChange} containerClassName="mb-0" min={specificFilters.fecha_emision_from}/>
                
                <Input label="Recepción Desde" type="date" name="fecha_recepcion_from" value={specificFilters.fecha_recepcion_from} onChange={handleSpecificFilterChange} containerClassName="mb-0" max={specificFilters.fecha_recepcion_to}/>
                <Input label="Recepción Hasta" type="date" name="fecha_recepcion_to" value={specificFilters.fecha_recepcion_to} onChange={handleSpecificFilterChange} containerClassName="mb-0" min={specificFilters.fecha_recepcion_from}/>
            </div>
        </div>
        <div className="px-4 py-3 bg-gray-50 border-t flex justify-end">
            <Button variant="ghost" onClick={handleResetFilters} leftIcon={<XCircleIcon className="w-4 h-4"/>}>Limpiar Filtros</Button>
        </div>
      </Card>


      <Table columns={columns} data={filteredDocuments} keyExtractor={(item) => item.id} />

      {isModalOpen && (
        <DocumentForm
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveDocument}
          documentData={viewingDocument}
          isReadOnly={!!viewingDocument && !canManage} // Admin/Manager can edit, others only view if documentData exists
        />
      )}
    </MainContainer>
  );
};

export default DocumentListPage;
