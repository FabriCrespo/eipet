/** Modal de solicitud de devolución — política EIPET, toasts tipo Sonner (sin alert). */

import { getUserId } from './utils';
import { showProfileToast } from '../../../lib/ui/profileToast';
import { RETURN_TOAST } from '../../../lib/returnsPolicy';

/** WhatsApp soporte (solo número, sin +) — ajustar si la tienda publica otro canal */
const SUPPORT_WHATSAPP_DIGITS = '59100000000';

let currentReturnOrderId = '';
let selectedProductId = '';
let selectedOrderItemId = '';

function closeReturnRequestModal(): void {
  const modal = document.getElementById('return-request-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    modal.style.display = 'none';
    document.body.style.overflow = '';
    currentReturnOrderId = '';
    selectedProductId = '';
    selectedOrderItemId = '';
  }
}

export async function openReturnRequestModal(
  orderId: string,
  onSuccess?: () => Promise<void>
): Promise<void> {
  currentReturnOrderId = orderId;
  selectedProductId = '';
  selectedOrderItemId = '';

  const modal = document.getElementById('return-request-modal');
  const orderInfo = document.getElementById('return-order-info');
  const productsList = document.getElementById('return-products-list');
  const reasonSelect = document.getElementById('return-reason') as HTMLSelectElement | null;
  const descriptionTextarea = document.getElementById('return-description') as HTMLTextAreaElement | null;
  const declareOriginal = document.getElementById('return-declare-original') as HTMLInputElement | null;

  if (!modal || !orderInfo || !productsList) return;

  try {
    const { getOrderById } = await import('../../../lib/db/orders');
    const orderResult = await getOrderById(orderId);

    if (!orderResult.data) {
      showProfileToast('No se pudo cargar el pedido.', 'error');
      return;
    }

    const order = orderResult.data;

    if (order.status !== 'delivered') {
      showProfileToast(RETURN_TOAST.notEligible, 'info');
      return;
    }

    const { isReturnWindowOpen } = await import('../../../lib/returnsPolicy');
    if (!isReturnWindowOpen(order)) {
      showProfileToast(RETURN_TOAST.timeExpired, 'info');
      return;
    }

    const items = order.items || [];
    const eligibleItems = items.filter((it: { purchaseHadPromotion?: boolean }) => it.purchaseHadPromotion !== true);
    if (eligibleItems.length === 0) {
      showProfileToast(RETURN_TOAST.notEligible, 'info');
      return;
    }

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
      <p class="text-xs text-gray-600 leading-relaxed">Plazo para solicitar: <strong>48 horas</strong> desde la entrega. Solo motivos cubiertos por política.</p>
    `;

    productsList.innerHTML = items
      .map(
        (
          item: {
            productId: string;
            productName: string;
            quantity: number;
            price: number;
            subtotal: number;
            productImage?: string;
            id?: string;
            purchaseHadPromotion?: boolean;
          },
          index: number
        ) => {
          const disabled = item.purchaseHadPromotion === true;
          const firstEligible = eligibleItems[0];
          const checked = !disabled && item.productId === firstEligible?.productId && item.id === firstEligible?.id;
          return `
        <label class="flex items-center gap-3 p-3 border rounded-lg transition-colors ${
          disabled ? 'border-amber-200 bg-amber-50/50 cursor-not-allowed opacity-80' : 'border-gray-200 cursor-pointer hover:bg-gray-50'
        }">
          <input
            type="radio"
            name="return-product"
            value="${item.productId}"
            data-item-id="${item.id ?? ''}"
            class="w-4 h-4 text-[#5d3fbb] focus:ring-[#5d3fbb] border-gray-300 shrink-0"
            ${disabled ? 'disabled' : ''}
            ${checked ? 'checked' : ''}
          />
          <img src="${item.productImage ?? ''}" alt="${item.productName}" class="w-12 h-12 rounded-lg object-cover border border-gray-200 shrink-0" />
          <div class="flex-1 min-w-0">
            <p class="font-medium text-sm text-gray-900">${item.productName}</p>
            <p class="text-xs text-gray-600">Cantidad: ${item.quantity} × Bs. ${item.price.toFixed(2)}</p>
            <p class="text-xs font-semibold text-gray-900 mt-1">Subtotal: Bs. ${item.subtotal.toFixed(2)}</p>
            ${
              disabled
                ? '<p class="text-[11px] text-amber-800 font-medium mt-1">No aplica devolución (compra en oferta/promoción).</p>'
                : ''
            }
          </div>
        </label>`;
        }
      )
      .join('');

    const first = eligibleItems[0];
    selectedProductId = first.productId;
    selectedOrderItemId = first.id ?? '';

    productsList.querySelectorAll('input[type="radio"]:not([disabled])').forEach((radio) => {
      radio.addEventListener('change', () => {
        const r = radio as HTMLInputElement;
        if (r.checked) {
          selectedProductId = r.value;
          selectedOrderItemId = r.getAttribute('data-item-id') || '';
        }
      });
    });

    if (reasonSelect) reasonSelect.value = '';
    if (descriptionTextarea) descriptionTextarea.value = '';
    if (declareOriginal) declareOriginal.checked = false;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  } catch (error) {
    console.error('Error cargando pedido:', error);
    showProfileToast('Error al cargar la información del pedido.', 'error');
  }
}

export function initReturnRequestModal(onLoadOrders: () => Promise<void>): void {
  const modal = document.getElementById('return-request-modal');
  const closeBtn = document.getElementById('return-modal-close-btn');
  const cancelBtn = document.getElementById('return-cancel-btn');
  const submitBtn = document.getElementById('return-submit-btn');
  const reasonSelect = document.getElementById('return-reason') as HTMLSelectElement | null;
  const descriptionTextarea = document.getElementById('return-description') as HTMLTextAreaElement | null;
  const declareOriginal = document.getElementById('return-declare-original') as HTMLInputElement | null;

  if (!modal) return;

  closeBtn?.addEventListener('click', closeReturnRequestModal);
  cancelBtn?.addEventListener('click', closeReturnRequestModal);

  const waBtn = document.getElementById('return-whatsapp-btn');
  waBtn?.addEventListener('click', () => {
    const text = encodeURIComponent(
      'Hola EIPET, quiero ayuda con una devolución o cambio según su política.'
    );
    window.open(`https://wa.me/${SUPPORT_WHATSAPP_DIGITS}?text=${text}`, '_blank', 'noopener,noreferrer');
  });

  submitBtn?.addEventListener('click', async () => {
    if (!currentReturnOrderId || !selectedProductId) {
      showProfileToast('Selecciona un producto elegible para devolución.', 'info');
      return;
    }

    const reason = reasonSelect?.value;
    const description = descriptionTextarea?.value?.trim();
    const declared = declareOriginal?.checked === true;

    if (!reason) {
      showProfileToast('Selecciona el motivo de la devolución.', 'info');
      return;
    }

    if (!description) {
      showProfileToast('Describe brevemente el problema (es obligatorio).', 'info');
      return;
    }

    if (!declared) {
      showProfileToast(RETURN_TOAST.notEligible, 'info');
      return;
    }

    const btn = submitBtn as HTMLButtonElement;
    btn.disabled = true;
    btn.textContent = 'Enviando...';

    try {
      const userId = await getUserId(30, 200);
      if (!userId) throw new Error('No se pudo verificar tu sesión.');

      const { getOrderById } = await import('../../../lib/db/orders');
      const orderResult = await getOrderById(currentReturnOrderId);
      if (!orderResult.data) throw new Error('Pedido no encontrado');

      const order = orderResult.data;
      const selectedItem = order.items?.find(
        (item: { productId: string; id?: string }) =>
          item.productId === selectedProductId && (selectedOrderItemId ? item.id === selectedOrderItemId : true)
      );
      if (!selectedItem) throw new Error('Producto no encontrado en el pedido');

      const { createReturn } = await import('../../../lib/db/returns');
      const result = await createReturn({
        userId,
        orderId: currentReturnOrderId,
        orderItemId: selectedItem.id,
        productId: selectedProductId,
        reason: reason as 'wrong_item' | 'damaged' | 'expired' | 'company_error',
        description,
        shippingAddress: order.shippingAddress,
        declaresUnopenedOriginalPackaging: true,
      });

      if (!result.success) {
        const msg = result.error?.message || 'No se pudo enviar la solicitud.';
        showProfileToast(msg, 'error');
        return;
      }

      if (reason === 'company_error') {
        showProfileToast(RETURN_TOAST.companyCovers, 'success');
      } else {
        showProfileToast(RETURN_TOAST.submitted, 'success');
      }

      closeReturnRequestModal();
      await onLoadOrders();
    } catch (error: unknown) {
      console.error('Error creando devolución:', error);
      const msg = error instanceof Error ? error.message : 'Error al enviar la solicitud.';
      showProfileToast(msg, 'error');
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
