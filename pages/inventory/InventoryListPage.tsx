
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Product, TableColumn, UserRole, SortConfig, AdvancedInventoryFilters, SortDirection, Category, Provider, InventoryAdjustment } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Table } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import ProductForm from '../../components/inventory/ProductForm';
import StockAdjustmentModal from '../../components/inventory/StockAdjustmentModal';
import KardexModal from '../../components/inventory/KardexModal'; 
import { 
    PlusIcon, PencilIcon, TrashIcon, CubeIcon, 
    FilterIcon, XCircleIcon, ChevronUpIcon, ChevronDownIcon, SelectorIcon,
    MOCK_PRODUCTS_FOR_CONSUMPTION, MOCK_CATEGORIES, MOCK_PROVIDERS, MOCK_ADJUSTMENTS, // Added MOCK_ADJUSTMENTS
    ClipboardDocumentListIcon, logAuditEntry
} from '../../constants';
import { useAuth } from '../../hooks/useAuth';
import { Alert } from '../../components/ui/Alert';
import { Card } from '../../components/ui/Card';
import { MainContainer } from '../../components/layout/MainContainer';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value);
};

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100];

const initialAdvancedFilters: AdvancedInventoryFilters = {
    category: '',
    provider: '',
    stockStatus: '',
    location: '',
    fechaUltimoIngresoFrom: '',
    fechaUltimoIngresoTo: '',
};

const InventoryListPage: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([...MOCK_PRODUCTS_FOR_CONSUMPTION]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);
  const [productToAdjust, setProductToAdjust] = useState<Product | undefined>(undefined);
  
  const [isKardexModalOpen, setIsKardexModalOpen] = useState(false);
  const [selectedProductForKardex, setSelectedProductForKardex] = useState<Product | undefined>(undefined);

  const [alertMessage, setAlertMessage] = useState<{type: 'success' | 'error' | 'info' | 'warning', message: string} | null>(null);

  const [advancedFilters, setAdvancedFilters] = useState<AdvancedInventoryFilters>(initialAdvancedFilters);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'sku', direction: 'ascending' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE_OPTIONS[0]); 
  const [isFiltersPanelVisible, setIsFiltersPanelVisible] = useState(false);

  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const canManage = user?.role === UserRole.ADMIN || user?.role === UserRole.WAREHOUSE_MANAGER;

  const nextAdjustmentIdCounter = useRef(MOCK_ADJUSTMENTS.length + 1);


  useEffect(() => {
    // Sync local state if global MOCK_PRODUCTS_FOR_CONSUMPTION changes from other operations (e.g., document reception)
    setProducts([...MOCK_PRODUCTS_FOR_CONSUMPTION]);
  }, []); // Re-evaluate if this broad sync is needed or if more targeted updates are better

  useEffect(() => {
    if (alertMessage) {
      const timer = setTimeout(() => setAlertMessage(null), 5000); 
      return () => clearTimeout(timer);
    }
  }, [alertMessage]);
  
  const handleAdvancedFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setAdvancedFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1); 
  };

  const handleSort = (key: keyof Product | string) => {
    let direction: SortDirection = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    } else if (sortConfig.key === key && sortConfig.direction === 'descending') {
      direction = null; 
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  const countActiveFilters = useCallback((): number => {
    let count = 0;
    if (searchTerm.trim()) count++;
    if (advancedFilters.category) count++;
    if (advancedFilters.provider) count++;
    if (advancedFilters.stockStatus) count++;
    if (advancedFilters.location.trim()) count++;
    if (advancedFilters.fechaUltimoIngresoFrom) count++;
    if (advancedFilters.fechaUltimoIngresoTo) count++;
    return count;
  }, [searchTerm, advancedFilters]);

  const activeFilterCount = countActiveFilters();

  const handleResetFilters = () => {
    setSearchTerm('');
    setAdvancedFilters(initialAdvancedFilters);
    setSortConfig({ key: 'sku', direction: 'ascending' });
    setCurrentPage(1);
  };

  const processedProducts = useMemo(() => {
    let filtered = [...products];
        
    if (advancedFilters.category) {
      filtered = filtered.filter(p => p.categoria_id === advancedFilters.category);
    }
    if (advancedFilters.provider) {
      filtered = filtered.filter(p => p.proveedor_predeterminado === advancedFilters.provider);
    }
    if (advancedFilters.location) {
      filtered = filtered.filter(p => p.ubicacion.toLowerCase().includes(advancedFilters.location.toLowerCase()));
    }
    if (advancedFilters.stockStatus) {
        switch(advancedFilters.stockStatus) {
            case 'low':
                filtered = filtered.filter(p => p.stock_actual <= (p.stock_min ?? 0) && (p.stock_min ?? 0) > 0);
                break;
            case 'optimal': 
                filtered = filtered.filter(p => p.stock_actual > (p.stock_min ?? 0) && (!p.stock_max || p.stock_actual < p.stock_max));
                break;
            case 'excess':
                 filtered = filtered.filter(p => p.stock_max !== undefined && p.stock_max !== null && p.stock_actual >= p.stock_max && p.stock_max > 0 );
                break;
        }
    }
    if (advancedFilters.fechaUltimoIngresoFrom) {
        filtered = filtered.filter(p => p.fecha_ultimo_ingreso && new Date(p.fecha_ultimo_ingreso) >= new Date(advancedFilters.fechaUltimoIngresoFrom));
    }
    if (advancedFilters.fechaUltimoIngresoTo) {
        filtered = filtered.filter(p => p.fecha_ultimo_ingreso && new Date(p.fecha_ultimo_ingreso) <= new Date(advancedFilters.fechaUltimoIngresoTo));
    }

    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(product =>
        product.nombre.toLowerCase().includes(lowerSearchTerm) ||
        product.sku.toLowerCase().includes(lowerSearchTerm) ||
        product.descripcion.toLowerCase().includes(lowerSearchTerm)
      );
    }

    if (sortConfig.key && sortConfig.direction) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key as keyof Product];
        const bValue = b[sortConfig.key as keyof Product];
        if (aValue === undefined || aValue === null) return 1;
        if (bValue === undefined || bValue === null) return -1;
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfig.direction === 'ascending' ? aValue - bValue : bValue - aValue;
        }
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'ascending' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        }
        return 0;
      });
    }
    return filtered;
  }, [products, searchTerm, advancedFilters, sortConfig]);

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return processedProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [processedProducts, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(processedProducts.length / itemsPerPage);

  const handleAddProduct = () => {
    setEditingProduct(undefined);
    setIsProductModalOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsProductModalOpen(true);
  };

  const requestDeleteProduct = (product: Product) => {
    setProductToDelete(product);
    setIsConfirmDeleteModalOpen(true);
  };

  const confirmDeleteProduct = () => {
    if (!productToDelete || !user) return;

    const updatedProducts = products.filter(p => p.sku !== productToDelete.sku);
    setProducts(updatedProducts);
    
    const MOCK_PRODUCTS_FOR_CONSUMPTION_Index = MOCK_PRODUCTS_FOR_CONSUMPTION.findIndex(p => p.sku === productToDelete.sku);
    if (MOCK_PRODUCTS_FOR_CONSUMPTION_Index !== -1) {
      MOCK_PRODUCTS_FOR_CONSUMPTION.splice(MOCK_PRODUCTS_FOR_CONSUMPTION_Index, 1);
    }
    logAuditEntry(user.username, "PRODUCTO_ELIMINADO", `Producto SKU '${productToDelete.sku}' - '${productToDelete.nombre}' eliminado.`);
    setAlertMessage({ type: 'success', message: `Producto ${productToDelete.sku} eliminado correctamente.` });
    setIsConfirmDeleteModalOpen(false);
    setProductToDelete(null);
  };


  const handleSaveProduct = (productData: Product, status: { success: boolean; message: string }) => {
    setAlertMessage({ type: status.success ? 'success' : 'error', message: status.message });
    if (status.success && user) {
      const existingProductIndex = products.findIndex(p => p.sku === productData.sku);
      let updatedProducts;
      if (existingProductIndex !== -1) { 
        updatedProducts = products.map(p => p.sku === productData.sku ? productData : p);
        const MOCK_PRODUCTS_FOR_CONSUMPTION_Index = MOCK_PRODUCTS_FOR_CONSUMPTION.findIndex(p => p.sku === productData.sku);
        if(MOCK_PRODUCTS_FOR_CONSUMPTION_Index !== -1) MOCK_PRODUCTS_FOR_CONSUMPTION[MOCK_PRODUCTS_FOR_CONSUMPTION_Index] = productData;
        logAuditEntry(user.username, "PRODUCTO_ACTUALIZADO", `Producto SKU '${productData.sku}' - '${productData.nombre}' actualizado.`);
      } else { 
        const newProductWithId = { ...productData, id: productData.sku, fecha_ultimo_ingreso: new Date().toISOString().split('T')[0] };
        updatedProducts = [newProductWithId, ...products];
        MOCK_PRODUCTS_FOR_CONSUMPTION.unshift(newProductWithId);
        logAuditEntry(user.username, "PRODUCTO_CREADO", `Producto SKU '${newProductWithId.sku}' - '${newProductWithId.nombre}' creado.`);
      }
      setProducts(updatedProducts);
      setIsProductModalOpen(false); 
    }
  };
  
  const handleOpenAdjustmentModal = (product: Product) => {
    setProductToAdjust(product);
    setIsAdjustmentModalOpen(true);
  };

  const handleAdjustStock = (sku: string, quantity: number, reason: string) => {
    if (!user) return;
    const productIndex = products.findIndex(p => p.sku === sku);
    if (productIndex === -1) return;

    const updatedProduct = { 
      ...products[productIndex], 
      stock_actual: products[productIndex].stock_actual + quantity,
      fecha_ultimo_ingreso: new Date().toISOString().split('T')[0] 
    };
    
    const updatedProductsList = products.map(p => p.sku === sku ? updatedProduct : p);
    setProducts(updatedProductsList);

    const MOCK_PRODUCTS_FOR_CONSUMPTION_Index = MOCK_PRODUCTS_FOR_CONSUMPTION.findIndex(p => p.sku === sku);
    if (MOCK_PRODUCTS_FOR_CONSUMPTION_Index !== -1) {
      MOCK_PRODUCTS_FOR_CONSUMPTION[MOCK_PRODUCTS_FOR_CONSUMPTION_Index] = updatedProduct;
    }
    
    const newAdjustment: InventoryAdjustment = {
        id: `ADJ-${nextAdjustmentIdCounter.current++}`,
        fecha: new Date().toISOString(),
        sku: sku,
        product_nombre: updatedProduct.nombre,
        cantidad: quantity,
        motivo: reason,
        usuario_nombre: user?.username || 'Sistema',
    };
    MOCK_ADJUSTMENTS.push(newAdjustment);
    logAuditEntry(user.username, "STOCK_AJUSTADO", `Stock de SKU '${sku}' ajustado en ${quantity}. Motivo: ${reason}.`);
    setAlertMessage({ type: 'success', message: `Stock de ${sku} ajustado por ${quantity > 0 ? '+' : ''}${quantity} unidades. Motivo: ${reason}` });
    setIsAdjustmentModalOpen(false);
    setProductToAdjust(undefined); 
  };

  const handleOpenKardexModal = (product: Product) => {
    setSelectedProductForKardex(product);
    setIsKardexModalOpen(true);
  };
  
  const renderSortIcon = (columnKey: keyof Product | string) => {
    if (sortConfig.key !== columnKey || !sortConfig.direction) {
      return <SelectorIcon className="w-4 h-4 ml-1 text-gray-400 dark:text-slate-500" />;
    }
    return sortConfig.direction === 'ascending' ? 
      <ChevronUpIcon className="w-4 h-4 ml-1 text-primary" /> : 
      <ChevronDownIcon className="w-4 h-4 ml-1 text-primary" />;
  };

  const columns: TableColumn<Product>[] = [
    { 
        key: 'sku', 
        header: ( <button onClick={() => handleSort('sku')} className="flex items-center hover:text-primary-dark dark:hover:text-primary-light"> SKU {renderSortIcon('sku')} </button> ), 
        className: 'font-medium text-primary whitespace-nowrap' 
    },
    { 
        key: 'nombre', 
        header: ( <button onClick={() => handleSort('nombre')} className="flex items-center hover:text-primary-dark dark:hover:text-primary-light"> Nombre {renderSortIcon('nombre')} </button> )
    },
    { key: 'descripcion', header: 'Descripción', className: 'text-xs max-w-xs truncate hidden md:table-cell' },
    { 
        key: 'stock_actual', 
        header: ( <button onClick={() => handleSort('stock_actual')} className="flex items-center hover:text-primary-dark dark:hover:text-primary-light"> Stock {renderSortIcon('stock_actual')} </button> ), 
        render: item => {
            const stockMin = item.stock_min ?? 0;
            let stockClass = 'dark:text-slate-300';
            if (item.stock_actual <= stockMin && stockMin > 0) {
                stockClass = 'text-red-600 font-bold dark:text-red-400';
            } else if (stockMin > 0 && item.stock_actual > stockMin && item.stock_actual <= stockMin + (stockMin * 0.15)) { 
                stockClass = 'text-yellow-600 font-semibold dark:text-yellow-400';
            }
            return <span className={stockClass}>{item.stock_actual} {item.un_medida}</span>;
        } 
    },
    { 
        key: 'valor_promedio', 
        header: ( <button onClick={() => handleSort('valor_promedio')} className="flex items-center hover:text-primary-dark dark:hover:text-primary-light"> Valor Prom. {renderSortIcon('valor_promedio')} </button> ),  
        render: item => formatCurrency(item.valor_promedio),
        className: 'hidden sm:table-cell'
    },
    { 
        key: 'fecha_ultimo_ingreso', 
        header: ( <button onClick={() => handleSort('fecha_ultimo_ingreso')} className="flex items-center hover:text-primary-dark dark:hover:text-primary-light"> Últ. Ingreso {renderSortIcon('fecha_ultimo_ingreso')} </button> ),  
        render: item => item.fecha_ultimo_ingreso ? new Date(item.fecha_ultimo_ingreso).toLocaleDateString('es-CL') : 'N/A',
        className: 'hidden md:table-cell'
    },
    { key: 'ubicacion', header: 'Ubicación', className: 'hidden lg:table-cell' },
    {
      key: 'actions',
      header: 'Acciones',
      render: (item) => (
        <div className="flex items-center space-x-1 whitespace-nowrap">
            <Button size="sm" variant="ghost" onClick={() => handleOpenKardexModal(item)} title="Ver Kardex" className="p-1 text-gray-600 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200">
                <ClipboardDocumentListIcon className="w-4 h-4" />
            </Button>
          {canManage && (
            <>
              <Button size="sm" variant="ghost" onClick={() => handleEditProduct(item)} title="Editar Producto" className="p-1">
                <PencilIcon className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => handleOpenAdjustmentModal(item)} title="Ajustar Stock" className="p-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
                <CubeIcon className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => requestDeleteProduct(item)} title="Eliminar Producto" className="p-1 text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300">
                <TrashIcon className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  const categoryOptions = [{ value: '', label: 'Todas las Categorías' }, ...MOCK_CATEGORIES.map(c => ({ value: c.id, label: c.nombre }))];
  const providerOptions = [{ value: '', label: 'Todos los Proveedores' }, ...MOCK_PROVIDERS.map(p => ({ value: p.id, label: p.nombre }))];
  const stockStatusOptions = [
      { value: '', label: 'Cualquier Estado de Stock' },
      { value: 'low', label: 'Stock Bajo (<= Mínimo)' },
      { value: 'optimal', label: 'Stock Óptimo (> Mín y < Máx)' },
      { value: 'excess', label: 'Stock Excedente (>= Máximo)' },
  ];

  return (
    <MainContainer className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-slate-100">Gestión de Inventario</h1>
        <div className="flex space-x-3">
            <Button 
                variant="outline" 
                onClick={() => setIsFiltersPanelVisible(!isFiltersPanelVisible)} 
                leftIcon={<FilterIcon className="w-4 h-4"/>}
                className={activeFilterCount > 0 ? 'ring-2 ring-primary-light dark:ring-primary-dark' : ''}
            >
                Filtros {activeFilterCount > 0 ? `(${activeFilterCount} Activos)` : (isFiltersPanelVisible ? '(Ocultar)' : '(Mostrar)')}
            </Button>
            {canManage && (
            <Button onClick={handleAddProduct} leftIcon={<PlusIcon className="w-5 h-5" />}>
                Nuevo Producto
            </Button>
            )}
        </div>
      </div>

      {alertMessage && <Alert type={alertMessage.type} message={alertMessage.message} onClose={() => setAlertMessage(null)} />}

      <Input
          type="text"
          placeholder="Búsqueda rápida por SKU, nombre o descripción..."
          value={searchTerm}
          onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1);}}
          className="max-w-full"
          containerClassName={isFiltersPanelVisible ? "mb-0" : "mb-4"} 
      />

      {isFiltersPanelVisible && (
          <Card title="Filtros Avanzados" bodyClassName="p-0">
            <div className="p-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Select label="Categoría" name="category" value={advancedFilters.category} onChange={handleAdvancedFilterChange} options={categoryOptions} containerClassName="mb-0"/>
                  <Select label="Proveedor Predeterminado" name="provider" value={advancedFilters.provider} onChange={handleAdvancedFilterChange} options={providerOptions} containerClassName="mb-0"/>
                  <Select label="Estado de Stock" name="stockStatus" value={advancedFilters.stockStatus} onChange={handleAdvancedFilterChange} options={stockStatusOptions} containerClassName="mb-0"/>
                  <Input label="Ubicación" name="location" value={advancedFilters.location} onChange={handleAdvancedFilterChange} placeholder="Ej: A1-01" containerClassName="mb-0"/>
                  <Input label="Últ. Ingreso Desde" type="date" name="fechaUltimoIngresoFrom" value={advancedFilters.fechaUltimoIngresoFrom} onChange={handleAdvancedFilterChange} containerClassName="mb-0" max={advancedFilters.fechaUltimoIngresoTo}/>
                  <Input label="Últ. Ingreso Hasta" type="date" name="fechaUltimoIngresoTo" value={advancedFilters.fechaUltimoIngresoTo} onChange={handleAdvancedFilterChange} containerClassName="mb-0" min={advancedFilters.fechaUltimoIngresoFrom}/>
                </div>
            </div>
            <div className="px-4 py-3 bg-gray-50 dark:bg-slate-700/50 border-t dark:border-slate-700 flex justify-end">
              <Button variant="ghost" onClick={handleResetFilters} leftIcon={<XCircleIcon className="w-4 h-4"/>}>Limpiar Filtros Avanzados</Button>
            </div>
          </Card>
      )}

      <Table columns={columns} data={paginatedProducts} keyExtractor={(item) => item.sku} />

      <div className="flex flex-col sm:flex-row justify-between items-center mt-4 p-2 bg-white dark:bg-slate-800 shadow rounded-md">
        <div className="text-sm text-gray-700 dark:text-slate-300 mb-2 sm:mb-0">
          Mostrando <span className="font-medium">{paginatedProducts.length}</span> de <span className="font-medium">{processedProducts.length}</span> productos. Página <span className="font-medium">{currentPage}</span> de <span className="font-medium">{totalPages}</span>.
        </div>
        <div className="flex items-center space-x-2">
          <Select
            options={ITEMS_PER_PAGE_OPTIONS.map(size => ({ value: size, label: `${size} por página` }))}
            value={itemsPerPage.toString()}
            onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1);}}
            containerClassName="mb-0 w-auto"
            className="py-1 text-sm"
          />
          <Button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} size="sm" variant="outline">
            Anterior
          </Button>
          <Button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0} size="sm" variant="outline">
            Siguiente
          </Button>
        </div>
      </div>

      {isProductModalOpen && (
        <ProductForm
          isOpen={isProductModalOpen}
          onClose={() => setIsProductModalOpen(false)}
          onSave={handleSaveProduct}
          product={editingProduct}
          // Pass current categories and providers if they can be dynamic
          // categories={MOCK_CATEGORIES} 
          // providers={MOCK_PROVIDERS}
        />
      )}
      
      {isAdjustmentModalOpen && productToAdjust && (
        <StockAdjustmentModal
          isOpen={isAdjustmentModalOpen}
          onClose={() => { setIsAdjustmentModalOpen(false); setProductToAdjust(undefined); }}
          product={productToAdjust}
          onAdjust={handleAdjustStock}
        />
      )}

      {selectedProductForKardex && (
        <KardexModal
            isOpen={isKardexModalOpen}
            onClose={() => { setIsKardexModalOpen(false); setSelectedProductForKardex(undefined);}}
            product={selectedProductForKardex}
        />
      )}

      <Modal
        isOpen={isConfirmDeleteModalOpen}
        onClose={() => { setIsConfirmDeleteModalOpen(false); setProductToDelete(null);}}
        title="Confirmar Eliminación de Producto"
        size="sm"
      >
        <div className="text-center">
          <TrashIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-700 dark:text-slate-200">
            ¿Está seguro de que desea eliminar el producto?
          </p>
          {productToDelete && (
            <p className="text-sm text-gray-600 dark:text-slate-400 mt-1">
              SKU: {productToDelete.sku} <br/> Nombre: {productToDelete.nombre}
            </p>
          )}
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-2">
            Esta acción no se puede deshacer.
          </p>
          <div className="mt-6 flex justify-center space-x-3">
            <Button variant="ghost" onClick={() => { setIsConfirmDeleteModalOpen(false); setProductToDelete(null); }}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={confirmDeleteProduct}>
              Sí, Eliminar
            </Button>
          </div>
        </div>
      </Modal>

    </MainContainer>
  );
};

export default InventoryListPage;
