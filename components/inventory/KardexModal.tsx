
import React, { useMemo } from 'react';
import { Product, KardexEntry, TableColumn, MovementType } from '../../types';
import { Modal } from '../ui/Modal';
import { Table } from '../ui/Table';
import { MOCK_DOCUMENTS, MOCK_CONSUMPTIONS, MOCK_ADJUSTMENTS } from '../../constants';

interface KardexModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product;
}

const formatDateKardex = (dateString: string) => {
  return new Date(dateString).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' });
};

const formatCurrencyKardex = (value?: number) => {
  if (value === undefined || value === null) return 'N/A';
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(value);
};

const KardexModal: React.FC<KardexModalProps> = ({ isOpen, onClose, product }) => {
  const kardexEntries = useMemo((): KardexEntry[] => {
    if (!product) return [];

    const synthesizedEntries: Omit<KardexEntry, 'id' | 'saldo_resultante'>[] = [];

    // Ingresos from Documents
    MOCK_DOCUMENTS.forEach(doc => {
      doc.detalles.forEach(detail => {
        if (detail.sku === product.sku) {
          synthesizedEntries.push({
            fecha: doc.fecha_recepcion, // Use reception date as movement date
            tipo_movimiento: 'Ingreso',
            referencia_id: `Doc: ${doc.numero_documento}`,
            cantidad_entrada: detail.cantidad,
            valor_unitario: detail.valor_unitario,
            costo_movimiento: detail.valor_total,
            usuario_nombre: doc.proveedor_nombre, // Or system user if available
          });
        }
      });
    });

    // Consumos from Consumptions
    MOCK_CONSUMPTIONS.forEach(cons => {
      cons.items.forEach(item => {
        if (item.product_sku === product.sku) {
          synthesizedEntries.push({
            fecha: cons.fecha_consumo,
            tipo_movimiento: 'Consumo',
            referencia_id: `OT: ${cons.numero_ot}`,
            cantidad_salida: item.cantidad_consumida,
            valor_unitario: product.valor_promedio, // Use current average cost for consumption valuation
            costo_movimiento: item.cantidad_consumida * product.valor_promedio,
            usuario_nombre: cons.solicitante_nombre, // Or responsible user
          });
        }
      });
    });

    // Ajustes from Adjustments
    MOCK_ADJUSTMENTS.forEach(adj => {
      if (adj.sku === product.sku) {
        synthesizedEntries.push({
          fecha: adj.fecha,
          tipo_movimiento: adj.cantidad > 0 ? 'Ajuste Positivo' : 'Ajuste Negativo',
          referencia_id: `Ajuste: ${adj.motivo}`,
          cantidad_entrada: adj.cantidad > 0 ? adj.cantidad : undefined,
          cantidad_salida: adj.cantidad < 0 ? Math.abs(adj.cantidad) : undefined,
          valor_unitario: product.valor_promedio, // Use current average cost
          costo_movimiento: Math.abs(adj.cantidad) * product.valor_promedio,
          usuario_nombre: adj.usuario_nombre,
        });
      }
    });

    // Sort all entries by date
    synthesizedEntries.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

    // Calculate running balance
    let currentBalance = 0; // Assume starting balance of 0 for simplicity in mock data
                            // In a real system, you'd fetch an initial balance or calculate from all historical data.
    return synthesizedEntries.map((entry, index) => {
      const entrada = entry.cantidad_entrada || 0;
      const salida = entry.cantidad_salida || 0;
      currentBalance = currentBalance + entrada - salida;
      return {
        ...entry,
        id: `kardex-${product.sku}-${index}`,
        saldo_resultante: currentBalance,
      };
    });
  }, [product]);

  const columns: TableColumn<KardexEntry>[] = [
    { key: 'fecha', header: 'Fecha', render: item => formatDateKardex(item.fecha) },
    { key: 'tipo_movimiento', header: 'Tipo Movimiento' },
    { key: 'referencia_id', header: 'Referencia', className: 'text-xs' },
    { key: 'cantidad_entrada', header: 'Entrada', render: item => item.cantidad_entrada || '-', className: 'text-right' },
    { key: 'cantidad_salida', header: 'Salida', render: item => item.cantidad_salida || '-', className: 'text-right' },
    { key: 'saldo_resultante', header: 'Saldo', className: 'font-semibold text-right' },
    { key: 'valor_unitario', header: 'Valor Unit. (CLP)', render: item => formatCurrencyKardex(item.valor_unitario), className: 'text-right hidden sm:table-cell' },
    { key: 'costo_movimiento', header: 'Costo Mov. (CLP)', render: item => formatCurrencyKardex(item.costo_movimiento), className: 'text-right hidden sm:table-cell'},
    { key: 'usuario_nombre', header: 'Usuario/Ref.', className: 'hidden md:table-cell text-xs' },
  ];

  if (!product) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Kardex de Producto: ${product.nombre} (SKU: ${product.sku})`} size="xl">
      <div className="text-sm mb-2">
        <p><strong>Stock Actual (según sistema):</strong> {product.stock_actual} {product.un_medida}</p>
        <p className="text-xs text-gray-500">Nota: El saldo inicial del Kardex se calcula a partir del primer movimiento registrado.</p>
      </div>
      {kardexEntries.length > 0 ? (
        <div className="max-h-[60vh] overflow-y-auto">
            <Table columns={columns} data={kardexEntries} keyExtractor={item => item.id} />
        </div>
      ) : (
        <p className="text-gray-600">No hay movimientos registrados para este producto.</p>
      )}
    </Modal>
  );
};

export default KardexModal;