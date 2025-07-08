
import { MaterialRequest, MaterialRequestItem, MaterialRequestStatus, MaterialRequestItemStatus } from '../types';

export const updateMaterialRequestStatus = (request: MaterialRequest): MaterialRequest => {
  const updatedItems = request.items.map(item => {
    let newItemStatus: MaterialRequestItemStatus = item.estado_item;
    // Only update status if it's not manually 'Cancelado' or 'En Compra' by the user unless quantities dictate otherwise for 'En Compra'
    if (item.estado_item !== 'Cancelado') {
      const cantidadRecibida = item.cantidad_recibida || 0;
      const cantidadSolicitada = item.cantidad_solicitada;

      if (cantidadRecibida >= cantidadSolicitada) {
        newItemStatus = 'Recibido';
      } else if (cantidadRecibida > 0) {
        newItemStatus = 'Parcialmente Recibido';
      } else { // cantidadRecibida is 0 or undefined
        // If it was 'En Compra' and 0 received, it remains 'En Compra'. Otherwise, it's 'Pendiente'.
        newItemStatus = (item.estado_item === 'En Compra') ? 'En Compra' : 'Pendiente';
      }
    }
    return { ...item, estado_item: newItemStatus, cantidad_recibida: item.cantidad_recibida || 0 };
  });

  let newEstadoGeneral: MaterialRequestStatus = request.estado_general;
  // Only auto-update general status if it's not manually 'Cancelada'
  if (request.estado_general !== 'Cancelada') {
    const allItemsDone = updatedItems.every(item => item.estado_item === 'Recibido' || item.estado_item === 'Cancelado');
    const anyItemReceived = updatedItems.some(item => item.estado_item === 'Recibido');
    const anyItemPartiallyReceived = updatedItems.some(item => item.estado_item === 'Parcialmente Recibido');
    const anyItemEnCompra = updatedItems.some(item => item.estado_item === 'En Compra');

    if (allItemsDone) {
      newEstadoGeneral = 'Totalmente Recibida';
    } else if (anyItemPartiallyReceived || (anyItemReceived && !allItemsDone)) {
      // If any item is partially received, or some are received but not all, it's partially received.
      newEstadoGeneral = 'Parcialmente Recibida';
    } else if (anyItemEnCompra) {
      // If no items are (partially) received, but some are 'En Compra', state is 'En Compra'.
      newEstadoGeneral = 'En Compra';
    } else if (updatedItems.every(item => item.estado_item === 'Pendiente' || item.estado_item === 'Cancelado') && !allItemsDone) {
      // If all non-cancelled items are pending
      newEstadoGeneral = 'Abierta';
    }
    // If the current state is already more "advanced" (e.g. "Parcialmente Recibida" and logic says "En Compra"), keep the more advanced.
    // This simplistic override might need more thought for edge cases where status can go "backwards" not due to cancellation.
    // For this demo, we assume a generally forward progression unless items are cancelled.
    // If it was 'En Compra' and conditions for 'Parcialmente Recibida' are met, it should progress.
  }

  return { ...request, items: updatedItems, estado_general: newEstadoGeneral };
};
