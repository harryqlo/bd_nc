
import React, { useState } from 'react';
import { Product } from '../../types';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  onAdjust: (sku: string, quantity: number, reason: string) => void;
}

const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({ isOpen, onClose, product, onAdjust }) => {
  const [adjustmentQuantity, setAdjustmentQuantity] = useState<number>(0);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (adjustmentQuantity === 0) {
      setError('La cantidad de ajuste no puede ser cero.');
      return;
    }
    if (!reason.trim()) {
      setError('El motivo del ajuste es obligatorio.');
      return;
    }
    if (product.stock_actual + adjustmentQuantity < 0) {
        setError('El ajuste resultaría en stock negativo.');
        return;
    }
    onAdjust(product.sku, adjustmentQuantity, reason);
    setAdjustmentQuantity(0);
    setReason('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Ajustar Stock de ${product.nombre} (SKU: ${product.sku})`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm">Stock Actual: <span className="font-semibold">{product.stock_actual} {product.un_medida}</span></p>
        <Input
          label="Cantidad a Ajustar (+/-)"
          type="number"
          value={adjustmentQuantity.toString()}
          onChange={(e) => setAdjustmentQuantity(parseInt(e.target.value, 10) || 0)}
          required
        />
        <Input
          label="Motivo del Ajuste"
          type="text"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          required
          placeholder="Ej: Conteo físico, Devolución, Merma"
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex justify-end space-x-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit">Ajustar Stock</Button>
        </div>
      </form>
    </Modal>
  );
};

export default StockAdjustmentModal;
