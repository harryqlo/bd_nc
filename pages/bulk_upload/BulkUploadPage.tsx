import React, { useState, useCallback, ChangeEvent, DragEvent } from 'react';
import * as XLSX from 'xlsx'; // Import xlsx library
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Alert } from '../../components/ui/Alert';
import { ArrowUpTrayIcon, MOCK_PRODUCTS_FOR_CONSUMPTION, MOCK_PROVIDERS, MOCK_CATEGORIES } from '../../constants';
import { MainContainer } from '../../components/layout/MainContainer';
import { Product, Category, Provider } from '../../types';

const BulkUploadPage: React.FC = () => {
  const [selectedEntityType, setSelectedEntityType] = useState<string>('productos');
  const [file, setFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<{ type: 'info' | 'success' | 'error' | 'warning', message: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const entityOptions = [
    { value: 'productos', label: 'Maestro de Productos (XLSX)' },
    { value: 'inventario-inicial', label: 'Inventario Inicial (XLSX)' },
    { value: 'proveedores', label: 'Maestro de Proveedores (XLSX)' },
    { value: 'categorias', label: 'Maestro de Categorías (XLSX)' },
  ];

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const selectedFile = event.target.files[0];
      if (!selectedFile.name.endsWith('.xlsx')) {
        setUploadStatus({ type: 'error', message: 'Por favor seleccione un archivo .xlsx' });
        setFile(null);
        if (event.target) event.target.value = '';
        return;
      }
      setFile(selectedFile);
      setUploadStatus(null);
    }
  };
  
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles[0]) {
        const droppedFile = acceptedFiles[0];
        if (!droppedFile.name.endsWith('.xlsx')) {
            setUploadStatus({ type: 'error', message: 'Por favor arrastre un archivo .xlsx' });
            setFile(null);
            return;
        }
        setFile(droppedFile);
        setUploadStatus(null);
    }
  }, [selectedEntityType]);

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      onDrop(Array.from(event.dataTransfer.files));
      event.dataTransfer.clearData();
    }
  };

  const parseProductXLSX = (data: any[]): { products: Product[], errors: string[], summary: string } => {
    const products: Product[] = [];
    const errors: string[] = [];
    let addedCount = 0;
    let updatedCount = 0;

    if (data.length === 0) return { products: [], errors: ["Archivo XLSX vacío o sin datos en la primera hoja."], summary: "0 procesados." };

    // Assuming the first row of data array contains headers if sheet_to_json didn't use header:1
    // For simplicity, let's assume headers are standardized keys from the XLSX (e.g., "SKU", "Nombre")
    // Or, if sheet_to_json was used with default, it creates an array of objects with keys from first row.

    const expectedHeaders = ['sku','nombre','descripcion','un_medida','ubicacion','categoria_id','valor_promedio','stock_actual','stock_min','stock_max','proveedor_predeterminado'];
    
    data.forEach((row, index) => {
      // Convert all header keys to lowercase for case-insensitive matching
      const rowDataLCKeys: any = {};
      for (const key in row) {
        rowDataLCKeys[key.toLowerCase()] = row[key];
      }

      if (!rowDataLCKeys.sku || !rowDataLCKeys.nombre) {
        errors.push(`Fila ${index + 2}: SKU y Nombre son obligatorios.`); // +2 because excel row numbers and header
        return;
      }
      
      const product: Product = {
        id: String(rowDataLCKeys.sku),
        sku: String(rowDataLCKeys.sku),
        nombre: String(rowDataLCKeys.nombre),
        descripcion: String(rowDataLCKeys.descripcion || ''),
        un_medida: String(rowDataLCKeys.un_medida || 'Unidad'),
        ubicacion: String(rowDataLCKeys.ubicacion || ''),
        categoria_id: String(rowDataLCKeys.categoria_id || (MOCK_CATEGORIES[0]?.id || 'cat_default')),
        valor_promedio: parseFloat(String(rowDataLCKeys.valor_promedio)) || 0,
        stock_actual: parseInt(String(rowDataLCKeys.stock_actual), 10) || 0,
        stock_min: parseInt(String(rowDataLCKeys.stock_min), 10) || 0,
        stock_max: parseInt(String(rowDataLCKeys.stock_max), 10) || 0,
        proveedor_predeterminado: String(rowDataLCKeys.proveedor_predeterminado || ''),
        fecha_ultimo_ingreso: new Date().toISOString().split('T')[0], // Default to today
      };
      
      const existingProductIndex = MOCK_PRODUCTS_FOR_CONSUMPTION.findIndex(p => p.sku === product.sku);
      if (existingProductIndex !== -1) {
        MOCK_PRODUCTS_FOR_CONSUMPTION[existingProductIndex] = product;
        updatedCount++;
      } else {
        MOCK_PRODUCTS_FOR_CONSUMPTION.push(product);
        addedCount++;
      }
      products.push(product);
    });
    const summary = `${data.length} filas procesadas. ${addedCount} productos añadidos, ${updatedCount} actualizados. ${errors.length} errores.`;
    return { products, errors, summary };
  };

  const parseCategoryXLSX = (data: any[]): { categories: Category[], errors: string[], summary: string } => {
    const categories: Category[] = [];
    const errors: string[] = [];
    let added = 0;
    data.forEach((row, index) => {
      const name = row['nombre'] || row['Nombre'];
      const id = row['id'] || row['ID'];
      if (!id || !name) {
        errors.push(`Fila ${index + 2}: ID y Nombre son obligatorios.`);
        return;
      }
      const category: Category = { id: String(id), nombre: String(name), descripcion: String(row['descripcion'] || '') };
      const existingIndex = MOCK_CATEGORIES.findIndex(c => c.id === category.id);
      if (existingIndex !== -1) MOCK_CATEGORIES[existingIndex] = category; else {
        MOCK_CATEGORIES.push(category); added++; }
      categories.push(category);
    });
    const summary = `${categories.length} categorías procesadas. ${added} añadidas. ${errors.length} errores.`;
    return { categories, errors, summary };
  };

  const parseProviderXLSX = (data: any[]): { providers: Provider[], errors: string[], summary: string } => {
    const providers: Provider[] = [];
    const errors: string[] = [];
    let added = 0;
    data.forEach((row, index) => {
      const id = row['id'] || row['ID'] || row['proveedor_id'];
      const nombre = row['nombre'] || row['Nombre'];
      if (!id || !nombre) {
        errors.push(`Fila ${index + 2}: ID y Nombre son obligatorios.`);
        return;
      }
      const provider: Provider = {
        id: String(id),
        nombre: String(nombre),
        contacto: String(row['contacto'] || ''),
        direccion: String(row['direccion'] || ''),
        telefono: String(row['telefono'] || ''),
        email: String(row['email'] || ''),
        rut: String(row['rut'] || ''),
      };
      const idx = MOCK_PROVIDERS.findIndex(p => p.id === provider.id);
      if (idx !== -1) MOCK_PROVIDERS[idx] = provider; else { MOCK_PROVIDERS.push(provider); added++; }
      providers.push(provider);
    });
    const summary = `${providers.length} proveedores procesados. ${added} añadidos. ${errors.length} errores.`;
    return { providers, errors, summary };
  };

  const parseInventoryXLSX = (data: any[]): { processed: number, errors: string[], summary: string } => {
    let processed = 0;
    const errors: string[] = [];
    data.forEach((row, index) => {
      const sku = row['sku'] || row['SKU'];
      const cantidad = parseInt(row['cantidad'] || row['Cantidad'] || '0', 10);
      if (!sku) {
        errors.push(`Fila ${index + 2}: SKU es obligatorio.`);
        return;
      }
      const productIndex = MOCK_PRODUCTS_FOR_CONSUMPTION.findIndex(p => p.sku === String(sku));
      if (productIndex === -1) {
        errors.push(`Fila ${index + 2}: SKU ${sku} no existe en productos.`);
        return;
      }
      MOCK_PRODUCTS_FOR_CONSUMPTION[productIndex].stock_actual = cantidad;
      processed++;
    });
    const summary = `${processed} items de inventario actualizados. ${errors.length} errores.`;
    return { processed, errors, summary };
  };


  const handleUpload = async () => {
    if (!file) {
      setUploadStatus({ type: 'error', message: 'Por favor, seleccione un archivo para cargar.' });
      return;
    }
    if (!file.name.endsWith('.xlsx')) {
      setUploadStatus({ type: 'error', message: 'Por favor seleccione un archivo .xlsx.' });
      return;
    }


    setIsLoading(true);
    setUploadStatus({ type: 'info', message: `Cargando y procesando ${file.name} para ${selectedEntityType}...` });

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = e.target?.result;
            const workbook = XLSX.read(data, { type: 'binary' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            let summary = '';
            let errors: string[] = [];
            if (selectedEntityType === 'productos') {
              const res = parseProductXLSX(jsonData);
              summary = res.summary; errors = res.errors;
            } else if (selectedEntityType === 'categorias') {
              const res = parseCategoryXLSX(jsonData);
              summary = res.summary; errors = res.errors;
            } else if (selectedEntityType === 'proveedores') {
              const res = parseProviderXLSX(jsonData);
              summary = res.summary; errors = res.errors;
            } else if (selectedEntityType === 'inventario-inicial') {
              const res = parseInventoryXLSX(jsonData);
              summary = res.summary; errors = res.errors;
            }
            if (errors.length > 0) {
                setUploadStatus({ type: 'warning', message: `Procesamiento completado con errores. ${summary} Errores: ${errors.slice(0,3).join('; ')}${errors.length > 3 ? '...' : ''}` });
            } else {
                setUploadStatus({ type: 'success', message: `Archivo ${file.name} procesado. ${summary}` });
            }
        } catch (err) {
            setUploadStatus({ type: 'error', message: `Error al procesar el archivo XLSX: ${(err as Error).message}` });
        }
        setIsLoading(false);
        setFile(null);
        const fileInput = document.getElementById('file-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = ''; // Reset file input
    };
    reader.onerror = (err) => {
        setUploadStatus({ type: 'error', message: `Error al leer el archivo: ${reader.error?.message || 'Desconocido'}` });
        setIsLoading(false);
    };
    reader.readAsBinaryString(file);
  };
  
  const handleDownloadTemplate = () => {
    if (selectedEntityType === 'productos') {
        const headers = ["sku","nombre","descripcion","un_medida","ubicacion","categoria_id","valor_promedio","stock_actual","stock_min","stock_max","proveedor_predeterminado"];
        const exampleData = [
            { sku: "SKU100", nombre: "Producto Ejemplo 1", descripcion: "Descripción detallada", un_medida: "Unidad", ubicacion: "A1-01", categoria_id: "cat1", valor_promedio: 15000, stock_actual: 50, stock_min: 10, stock_max: 100, proveedor_predeterminado: "prov1" },
            { sku: "SKU200", nombre: "Otro Item", descripcion: "Más info aquí", un_medida: "Caja", ubicacion: "B2-03", categoria_id: "cat2", valor_promedio: 750, stock_actual: 200, stock_min: 20, stock_max: 300, proveedor_predeterminado: "" }
        ];
        
        const worksheet = XLSX.utils.json_to_sheet(exampleData, { header: headers });
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Productos");
        
        // Set column widths (optional, for better readability)
        const wscols = [ {wch:15}, {wch:30}, {wch:40}, {wch:10}, {wch:10}, {wch:10}, {wch:15}, {wch:10}, {wch:10}, {wch:10}, {wch:15} ];
        worksheet['!cols'] = wscols;

        XLSX.writeFile(workbook, "plantilla_productos.xlsx");
        setUploadStatus({ type: 'success', message: 'Plantilla XLSX para productos descargada.' });

    } else if (selectedEntityType === 'categorias') {
        const headers = ["id","nombre","descripcion"];
        const exampleData = [ { id: "cat1", nombre: "Categoría 1", descripcion: "Descripción" } ];
        const ws = XLSX.utils.json_to_sheet(exampleData, { header: headers });
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Categorías");
        XLSX.writeFile(wb, "plantilla_categorias.xlsx");
        setUploadStatus({ type: 'success', message: 'Plantilla para categorías descargada.' });
    } else if (selectedEntityType === 'proveedores') {
        const headers = ["id","nombre","contacto","direccion","telefono","email","rut"];
        const exampleData = [ { id: "prov1", nombre: "Proveedor 1", contacto: "Juan", direccion: "Calle 1", telefono: "123", email: "prov1@example.com", rut: "1111-1" } ];
        const ws = XLSX.utils.json_to_sheet(exampleData, { header: headers });
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Proveedores");
        XLSX.writeFile(wb, "plantilla_proveedores.xlsx");
        setUploadStatus({ type: 'success', message: 'Plantilla para proveedores descargada.' });
    } else if (selectedEntityType === 'inventario-inicial') {
        const headers = ["sku","cantidad"];
        const exampleData = [ { sku: "SKU100", cantidad: 100 } ];
        const ws = XLSX.utils.json_to_sheet(exampleData, { header: headers });
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Inventario");
        XLSX.writeFile(wb, "plantilla_inventario.xlsx");
        setUploadStatus({ type: 'success', message: 'Plantilla de inventario descargada.' });
    }
  }

  return (
    <MainContainer className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-slate-100">Carga Masiva de Datos</h1>
      
      {uploadStatus && <Alert type={uploadStatus.type} message={uploadStatus.message} onClose={() => setUploadStatus(null)} />}

      <Card title="Seleccionar Tipo de Entidad y Archivo">
        <div className="space-y-4">
          <Select
            label="Tipo de Entidad a Cargar"
            options={entityOptions}
            value={selectedEntityType}
            onChange={(e) => {
              setSelectedEntityType(e.target.value);
              setFile(null); // Reset file on entity type change
              setUploadStatus(null);
              const fileInput = document.getElementById('file-upload') as HTMLInputElement;
              if (fileInput) fileInput.value = ''; // Reset file input visually
            }}
            disabled={isLoading}
          />

          <div 
            className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md transition-colors ${isLoading ? 'border-gray-200 dark:border-slate-700' : 'border-gray-300 dark:border-slate-600 hover:border-primary dark:hover:border-primary-light'}`}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <div className="space-y-1 text-center">
              <ArrowUpTrayIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-slate-500" />
              <div className="flex text-sm text-gray-600 dark:text-slate-400">
                <label
                  htmlFor="file-upload"
                  className={`relative rounded-md font-medium text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary ${isLoading ? 'cursor-not-allowed text-primary/70' : 'cursor-pointer bg-white dark:bg-slate-700 hover:text-primary-dark'}`}
                >
                  <span className="px-1">Subir un archivo</span>
                  <input 
                    id="file-upload" 
                    name="file-upload" 
                    type="file" 
                    className="sr-only" 
                    onChange={handleFileChange} 
                    accept=".xlsx"
                    disabled={isLoading} 
                  />
                </label>
                <p className="pl-1">o arrastrar y soltar</p>
              </div>
              <p className="text-xs text-gray-500 dark:text-slate-500">Archivos .xlsx</p>
            </div>
          </div>

          {file && (
            <p className="text-sm text-gray-700 dark:text-slate-300">Archivo seleccionado: <span className="font-medium">{file.name}</span> ({(file.size / 1024).toFixed(2)} KB)</p>
          )}
          
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0 sm:space-x-3 pt-2">
            <Button onClick={handleDownloadTemplate} variant="outline" disabled={isLoading}>
              Descargar Plantilla (XLSX)
            </Button>
            <Button onClick={handleUpload} disabled={!file || isLoading || !file.name.endsWith('.xlsx')} isLoading={isLoading}>
              {isLoading ? 'Procesando...' : 'Iniciar Carga'}
            </Button>
          </div>
        </div>
      </Card>
      
      <Card title="Estado de Cargas Recientes">
        <ul className="divide-y divide-gray-200 dark:divide-slate-700">
            <li className="py-3">
                <p className="text-sm text-gray-500 dark:text-slate-400">No hay registros de cargas previas.</p>
            </li>
        </ul>
      </Card>
    </MainContainer>
  );
};

export default BulkUploadPage;