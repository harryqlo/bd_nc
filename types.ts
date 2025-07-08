
export enum UserRole {
  ADMIN = 'Administrador del Sistema',
  WAREHOUSE_MANAGER = 'Gestor de Bodega',
  WAREHOUSE_OPERATOR = 'Operador de Bodega',
}

export interface User {
  id: string;
  username: string;
  role: UserRole;
  // password field should not be stored or passed to frontend
}

export interface Product {
  id: string; // SKU
  sku: string;
  nombre: string;
  descripcion: string;
  un_medida: string;
  ubicacion: string;
  categoria_id: string; // Relates to Category
  valor_promedio: number; // CLP
  stock_actual: number;
  stock_min?: number;
  stock_max?: number;
  proveedor_predeterminado?: string; // Relates to Provider
  fecha_ultimo_ingreso?: string;
}

export interface Category {
  id: string;
  nombre: string;
  descripcion?: string;
}

export interface Provider {
  id: string;
  proveedor_id?: string; // Legacy from CSV or alternate ID
  nombre: string;
  contacto?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  rut?: string;
}

export enum DocumentType {
  FACTURA = 'Factura',
  GUIA_DESPACHO = 'Guía de Despacho',
  BOLETA = 'Boleta',
  OTRO = 'Otro',
}

export interface DocumentDetail {
  id: string;
  sku: string;
  nombre_producto?: string; // For display convenience
  cantidad: number;
  valor_unitario: number; // CLP
  descuento_porcentaje?: number;
  valor_total: number; // CLP (cantidad * valor_unitario * (1 - descuento))
}

export interface FileInfo {
  name: string;
  type: string;
  size: number;
  url: string; // For mock download/view link
}

export interface DocumentHeader {
  id: string; // Internal document ID
  tipo_documento: DocumentType;
  numero_documento: string; // External document number
  fecha_emision: string; // YYYY-MM-DD
  fecha_recepcion: string; // YYYY-MM-DD
  proveedor_id: string; // Relates to Provider
  proveedor_nombre?: string; // For display convenience
  valor_total_documento: number; // CLP
  estado: string; // e.g., "Recibido", "Parcialmente Recibido", "Cerrado"
  detalles: DocumentDetail[];
  attachment?: FileInfo; // New field for document attachment
  material_request_id_link?: string; // Link to a MaterialRequest
}

export interface AuditLogEntry {
  id: string;
  fecha: string; // ISO DateTime
  usuario: string;
  accion: string;
  detalle: string;
}

export interface TableColumn<T,> {
  key: keyof T | string;
  header: React.ReactNode; // Changed from string to React.ReactNode
  render?: (item: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

export interface WorkOrder {
  id: string;
  numero_ot: string;
  descripcion?: string;
  cliente?: string;
  fecha_creacion: string; // YYYY-MM-DD
  estado: 'Abierta' | 'En Progreso' | 'Cerrada' | 'Cancelada';
}

export interface ConsumptionDetail {
  id: string; // Can be temp ID or product SKU for uniqueness within the consumption
  product_sku: string;
  product_nombre?: string;
  cantidad_consumida: number;
  un_medida?: string;
}

export interface Consumption {
  id: string;
  work_order_id: string; // Corresponds to WorkOrder.id
  numero_ot: string; // Denormalized for easier display/search, matches WorkOrder.numero_ot
  
  solicitante_id: string; // ID of the Solicitante
  solicitante_nombre?: string; // For display (nombre_completo of Solicitante)

  items: ConsumptionDetail[]; // Replaces single product fields
  
  fecha_consumo: string; // YYYY-MM-DD HH:mm:ss
  usuario_responsable_id: string; // User ID of who recorded it (from useAuth)
  usuario_responsable_nombre?: string; // For display
}

export interface Solicitante {
  id: string;
  codigo_interno: string;
  nombre_completo: string;
  cargo: string; // e.g., Mecánico, Electricista, Supervisor
}

// System Configuration
export interface SystemConfig {
  companyName: string;
  defaultCurrency: string;
  defaultDateFormat: string;
  lowStockThresholdGeneral: number; // Renamed from lowStockThreshold to avoid conflict with per-product
  sessionTimeoutMinutes: number;
  autoCreateOTEnabled: boolean;
  defaultOTPrefix: string;
  minPasswordLength: number;
  externalApiEndpoint?: string;
  uiTheme?: 'Light' | 'Dark';
}

// Inventory Adjustment
export interface InventoryAdjustment {
  id: string;
  fecha: string; // ISO DateTime
  sku: string;
  product_nombre?: string;
  cantidad: number; // Positive for addition, negative for subtraction
  motivo: string;
  usuario_nombre?: string; // User who made the adjustment
}

// Unified Inventory Movement for Reports
export type MovementType = 'Ingreso' | 'Consumo' | 'Ajuste Positivo' | 'Ajuste Negativo';

export interface UnifiedInventoryMovement {
  id: string; // Composite ID like 'DOC-DOC001-SKU001' or 'CONS-CONS001-SKU005' or 'ADJ-ADJ001'
  fecha: string; // ISO DateTime
  sku: string;
  product_nombre?: string;
  tipo_movimiento: MovementType;
  cantidad: number; // Always positive, direction implied by type or use +/-
  referencia_id: string; // Documento #, OT #, Ajuste ID
  usuario_nombre?: string;
  valor_unitario?: number;
  valor_total_movimiento?: number;
}

// For Inventory List Page
export type SortDirection = 'ascending' | 'descending' | null;

export interface SortConfig {
  key: keyof Product | string;
  direction: SortDirection;
}

export interface AdvancedInventoryFilters {
  category: string;
  provider: string;
  stockStatus: string;
  location: string;
  fechaUltimoIngresoFrom: string;
  fechaUltimoIngresoTo: string;
}

// Kardex Entry
export interface KardexEntry {
  id: string; // Unique ID for the Kardex entry line
  fecha: string; // ISO DateTime string
  tipo_movimiento: MovementType | 'Saldo Inicial';
  referencia_id: string; // Document #, OT #, Motivo Ajuste, or 'Apertura'
  cantidad_entrada?: number;
  cantidad_salida?: number;
  saldo_resultante: number;
  valor_unitario?: number;
  costo_movimiento?: number; // For valuation of the movement
  usuario_nombre?: string; // User associated if any
}

// Material Request
export type MaterialRequestItemStatus = 'Pendiente' | 'En Compra' | 'Parcialmente Recibido' | 'Recibido' | 'Cancelado';
export type MaterialRequestStatus = 'Abierta' | 'En Compra' | 'Parcialmente Recibida' | 'Totalmente Recibida' | 'Cancelada';

export interface MaterialRequestItem {
  id: string; // Temp ID for form, or persistent ID from backend
  descripcion_item: string;
  cantidad_solicitada: number;
  unidad_medida_sugerida: string;
  proveedor_sugerido_id?: string; // Optional, relates to Provider
  estado_item: MaterialRequestItemStatus;
  cantidad_recibida: number;
  producto_sku_esperado?: string; // Optional, if user knows what SKU is needed for better matching with documents
  // fecha_entrega_estimada?: string;
}

export interface MaterialRequest {
  id: string; // Correlative, e.g., "SM-0756"
  fecha_solicitud: string; // YYYY-MM-DD
  solicitante_id: string; // Relates to Solicitante
  solicitante_nombre?: string; // For display convenience
  items: MaterialRequestItem[];
  estado_general: MaterialRequestStatus;
  observaciones?: string;
  document_header_ids_fulfilling?: string[]; // IDs of DocumentHeaders linked to this request
}
