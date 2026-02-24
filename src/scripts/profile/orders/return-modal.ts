/** Modal de solicitud de devolución */

import { getUserId } from './utils';

let currentReturnOrderId = '';
let selectedProductId = '';

function closeReturnRequestModal(): void {
  const modal = document.getElementById('return-request-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    modal.style.display = 'none';
    document.body.style.overflow = '';
    currentReturnOrderId = '';
    selectedProductId = '';
  }
}

export async function openReturnRequestModal(
  orderId: string,
  onSuccess?: () => Promise<void>
): Promise<void> {
  currentReturnOrderId = orderId;
  selectedProductId = '';

  const modal = document.getElementById('return-request-modal');
  const orderInfo = document.getElementById('return-order-info');
  const productsList = document.getElementById('return-products-list');
  const reasonSelect = document.getElementById('return-reason') as HTMLSelectElement | null;
  const descriptionTextarea = document.getElementById('return-description') as HTMLTextAreaElement | null;

  if (!modal || !orderInfo || !productsList) return;

  try {
    const { getOrderById } = await import('../../../lib/db/orders');
    const orderResult = await getOrderById(orderId);

    if (!orderResult.data) {
      alert('No se pudo encontrar el pedido');
      return;
    }

    const order = orderResult.data;

    orderInfo.innerHTML = `
      <div class="flex items-center gap-3 mb-2">
        <div class="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
          <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </div>
        <div>
          <p class="font-semibold text-gray-900">Pedido #${order.id.substring(0, 8)}</p>
          <p class="text-sm text-gray-600">Total: Bs. ${order.total.toFixed(2)}</p>
        </div>
      </div>
    `;

    if (!order.items?.length) {
      productsList.innerHTML = '<p class="text-sm text-gray-500">No hay productos en este pedido</p>';
    } else {
      productsList.innerHTML = order.items.map((item: { productId: string; productName: string; quantity: number; price: number; subtotal: number; productImage?: string; id?: string }, index: number) => `
        <label class="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
          <input
            type="radio"
            name="return-product"
            value="${item.productId}"
            data-item-id="${item.id ?? ''}"
            class="w-4 h-4 text-[#5d3fbb] focus:ring-[#5d3fbb] border-gray-300"
            ${index === 0 ? 'checked' : ''}
          />
          <img src="${item.productImage ?? ''}" alt="${item.productName}" class="w-12 h-12 rounded-lg object-cover border border-gray-200" />
          <div class="flex-1">
            <p class="font-medium text-sm text-gray-900">${item.productName}</p>
            <p class="text-xs text-gray-600">Cantidad: ${item.quantity} × Bs. ${item.price.toFixed(2)}</p>
            <p class="text-xs font-semibold text-gray-900 mt-1">Subtotal: Bs. ${item.subtotal.toFixed(2)}</p>
          </div>
        </label>
      `).join('');

      selectedProductId = order.items[0].productId;

      productsList.querySelectorAll('input[type="radio"]').forEach((radio) => {
        radio.addEventListener('change', () => {
          if ((radio as HTMLInputElement).checked) {
            selectedProductId = (radio as HTMLInputElement).value;
          }
        });
      });
    }

    if (reasonSelect) reasonSelect.value = '';
    if (descriptionTextarea) descriptionTextarea.value = '';

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  } catch (error) {
    console.error('Error cargando pedido:', error);
    alert('Error al cargar la información del pedido');
  }
}

export function initReturnRequestModal(onLoadOrders: () => Promise<void>): void {
  const modal = document.getElementById('return-request-modal');
  const closeBtn = document.getElementById('return-modal-close-btn');
  const cancelBtn = document.getElementById('return-cancel-btn');
  const submitBtn = document.getElementById('return-submit-btn');
  const reasonSelect = document.getElementById('return-reason') as HTMLSelectElement | null;
  const descriptionTextarea = document.getElementById('return-description') as HTMLTextAreaElement | null;

  if (!modal) return;

  closeBtn?.addEventListener('click', closeReturnRequestModal);
  cancelBtn?.addEventListener('click', closeReturnRequestModal);

  submitBtn?.addEventListener('click', async () => {
    if (!currentReturnOrderId || !selectedProductId) {
      alert('Por favor, selecciona un producto');
      return;
    }

    const reason = reasonSelect?.value;
    const description = descriptionTextarea?.value;

    if (!reason) {
      alert('Por favor, selecciona una razón de devolución');
      return;
    }

    if (!description?.trim()) {
      alert('Por favor, describe el problema o razón de la devolución');
      return;
    }

    const btn = submitBtn as HTMLButtonElement;
    btn.disabled = true;
    btn.textContent = 'Enviando...';

    try {
      const userId = await getUserId(30, 200);
      if (!userId) throw new Error('No se pudo obtener el ID del usuario');

      const { getOrderById } = await import('../../../lib/db/orders');
      const orderResult = await getOrderById(currentReturnOrderId);
      if (!orderResult.data) throw new Error('Pedido no encontrado');

      const order = orderResult.data;
      const selectedItem = order.items?.find((item: { productId: string }) => item.productId === selectedProductId);
      if (!selectedItem) throw new Error('Producto no encontrado en el pedido');

      const { createReturn } = await import('../../../lib/db/returns');
      const result = await createReturn({
        userId,
        orderId: currentReturnOrderId,
        orderItemId: selectedItem.id,
        productId: selectedProductId,
        reason: reason as 'defective' | 'wrong_item' | 'damaged' | 'not_as_described' | 'other',
        description: description.trim(),
        shippingAddress: order.shippingAddress
      });

      if (!result.success) throw result.error ?? new Error('Error al crear la devolución');

      alert('¡Solicitud de devolución enviada exitosamente!');
      closeReturnRequestModal();
      await onLoadOrders();
    } catch (error: unknown) {
      console.error('Error creando devolución:', error);
      alert((error as Error).message ?? 'Error al enviar la solicitud de devolución');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Enviar Solicitud';
    }
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeReturnRequestModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
      closeReturnRequestModal();
    }
  });
}
