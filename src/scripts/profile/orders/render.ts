/** Renderizado de tarjetas de pedidos */

import { escapeHtml } from './utils';
import { PROGRESS_STEPS } from './constants';
import type { ComponentOrder } from './transform';

export function buildOrderCardHtml(order: ComponentOrder): string {
  const productImagesHtml = order.productImages.slice(0, 4).map(
    (image, idx) =>
      `<img src="${escapeHtml(image)}" alt="Producto ${idx + 1}" class="w-10 h-10 sm:w-14 sm:h-14 rounded-lg object-cover border border-gray-100 shadow-sm" />`
  ).join('');

  const moreCount = order.productImages.length > 4 ? order.productImages.length - 4 : 0;
  const moreProductsHtml = moreCount > 0
    ? `<div class="w-10 h-10 sm:w-14 sm:h-14 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-[10px] sm:text-xs font-semibold text-gray-600">+${moreCount}</div>`
    : '';

  const currentStep = order.progressStep ?? 1;
  const progressBarSteps = PROGRESS_STEPS.map((step, index) => {
    const stepNum = index + 1;
    const isActive = stepNum <= currentStep;
    const stepClass = isActive ? 'bg-[#5d3fbb] border-[#5d3fbb] text-white' : 'bg-white border-gray-200 text-gray-400';
    const labelClass = isActive ? 'text-[#5d3fbb]' : 'text-gray-400';
    return `<div class="flex flex-col items-center flex-1 min-w-0">
      <div class="w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border transition-all duration-300 ${stepClass}">
        <svg class="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${step.icon}" />
        </svg>
      </div>
      <p class="mt-1 sm:mt-1.5 text-[8px] sm:text-[10px] font-medium text-center leading-tight ${labelClass}">${step.label}</p>
    </div>`;
  }).join('');

  const progressBarWidth = ((currentStep - 1) / 3) * 100;
  const progressBarHtml = `<div class="relative mb-4 sm:mb-5">
    <div class="absolute top-3 sm:top-4 left-0 right-0 h-0.5 bg-gray-100 rounded-full"></div>
    <div class="absolute top-3 sm:top-4 left-0 h-0.5 bg-[#5d3fbb] rounded-full transition-all duration-500" style="width: ${progressBarWidth}%"></div>
    <div class="relative flex justify-between px-1 sm:px-2">${progressBarSteps}</div>
  </div>`;

  const products = order.products?.length
    ? order.products
    : order.productImages.map((img, idx) => ({
        name: `Producto ${idx + 1}`,
        image: img,
        quantity: 1,
        unitPrice: order.total / order.productsCount,
        subtotal: order.total / order.productsCount
      }));

  const shipping = order.shipping ?? {
    address: 'Dirección no disponible',
    phone: 'Teléfono no disponible',
    trackingNumber: order.status === 'Pendientes' ? 'Pendiente de asignación' : 'BOL' + order.id + Math.floor(Math.random() * 1000),
    estimatedDelivery: order.status === 'Entregados' ? order.date : 'Pendiente de calcular'
  };

  const productsHtml = products.map(
    (p) => `<div class="flex items-center gap-3 py-3 border-b border-gray-50 last:border-b-0">
      <img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" class="w-12 h-12 rounded-lg object-cover border border-gray-100" />
      <div class="flex-1 min-w-0">
        <h4 class="font-semibold text-sm text-gray-900 truncate">${escapeHtml(p.name)}</h4>
        <p class="text-xs text-gray-500 mt-0.5">${p.quantity} x Bs. ${p.unitPrice.toFixed(2)}</p>
      </div>
      <p class="font-bold text-sm text-gray-900 whitespace-nowrap ml-2">Bs. ${p.subtotal.toFixed(2)}</p>
    </div>`
  ).join('');

  const shippingHtml = `<div class="space-y-2.5">
    <div class="pb-2.5 border-b border-gray-50 last:border-b-0">
      <p class="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wide">Dirección</p>
      <p class="text-sm font-semibold text-gray-900 leading-tight">${escapeHtml(shipping.address)}</p>
    </div>
    <div class="pb-2.5 border-b border-gray-50 last:border-b-0">
      <p class="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wide">Teléfono</p>
      <p class="text-sm font-semibold text-gray-900">${escapeHtml(shipping.phone)}</p>
    </div>
    <div class="pb-2.5 border-b border-gray-50 last:border-b-0">
      <p class="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wide">Seguimiento</p>
      <p class="text-sm font-semibold text-gray-900 font-mono">${escapeHtml(shipping.trackingNumber)}</p>
    </div>
    <div>
      <p class="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wide">Entrega</p>
      <p class="text-sm font-semibold text-gray-900">${escapeHtml(shipping.estimatedDelivery)}</p>
    </div>
  </div>`;

  const safeId = String(order.id).replace(/"/g, '&quot;');
  const actions: string[] = [];

  if (order.showActions.includes('verDetalles')) {
    actions.push(`<button type="button" class="toggle-details-btn flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs font-semibold bg-[#5d3fbb] text-white rounded-lg hover:bg-[#4d2fa8] transition-all duration-200 active:scale-95" data-order-id="${safeId}">
      <svg class="h-3 w-3 sm:h-3.5 sm:w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
      <span class="details-btn-text hidden sm:inline">Detalles</span>
    </button>`);
  }
  if (order.showActions.includes('factura')) {
    actions.push(`<button type="button" class="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs font-semibold bg-white text-gray-700 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 active:scale-95">
      <svg class="h-3 w-3 sm:h-3.5 sm:w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
      <span class="hidden sm:inline">Factura</span>
    </button>`);
  }
  if (order.showActions.includes('calificar')) {
    actions.push(`<button type="button" class="rate-order-btn flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs font-semibold bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-all duration-200 active:scale-95" data-order-id="${safeId}">
      <svg class="h-3 w-3 sm:h-3.5 sm:w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
      <span class="hidden sm:inline">Calificar</span>
    </button>`);
  }
  if (order.showActions.includes('devolver')) {
    actions.push(`<button type="button" class="return-request-btn flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs font-semibold bg-white text-gray-700 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 active:scale-95" data-order-id="${safeId}">
      <svg class="h-3 w-3 sm:h-3.5 sm:w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      <span class="hidden sm:inline">Devolver</span>
    </button>`);
  }

  const shortId = order.id.substring(0, 8);
  const statusShort = order.status.length > 10 ? order.status.substring(0, 8) + '...' : order.status;

  return `<div class="bg-white rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all duration-200 p-3 sm:p-4 order-card" data-order-id="${safeId}">
    <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3 pb-3 border-b border-gray-50">
      <div class="flex-1 min-w-0">
        <div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-2.5 mb-1.5">
          <h2 class="text-base sm:text-lg font-bold text-gray-900 tracking-tight">#${escapeHtml(shortId)}</h2>
          <span class="px-1.5 sm:px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-semibold uppercase tracking-wide flex items-center gap-0.5 sm:gap-1 w-fit ${order.statusColor}">
            <svg class="h-2.5 w-2.5 sm:h-3 sm:w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="${order.statusIcon}" />
            </svg>
            <span class="hidden sm:inline">${escapeHtml(order.status)}</span>
            <span class="sm:hidden">${escapeHtml(statusShort)}</span>
          </span>
        </div>
        <p class="text-[10px] sm:text-xs text-gray-500 font-medium">${escapeHtml(order.date)}</p>
      </div>
      <div class="text-left sm:text-right flex-shrink-0">
        <p class="text-base sm:text-lg font-bold text-gray-900">Bs. ${order.total.toFixed(2)}</p>
        <p class="text-[10px] sm:text-xs text-gray-500 mt-0.5">${order.productsCount} ${order.productsCount === 1 ? 'producto' : 'productos'}</p>
      </div>
    </div>
    <div class="flex items-center gap-1.5 sm:gap-2 mb-3 pb-3 border-b border-gray-50 overflow-x-auto">
      ${productImagesHtml}${moreProductsHtml}
    </div>
    <div class="order-progress-section hidden mb-4" data-progress-order-id="${safeId}">
      ${progressBarHtml}
    </div>
    <div class="flex flex-wrap items-center gap-1.5 sm:gap-2">${actions.join('')}</div>
    <div class="order-details-section hidden mt-4 pt-4 border-t border-gray-100" data-details-order-id="${safeId}">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 class="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">Productos</h3>
          <div class="bg-gray-50 rounded-lg p-3">${productsHtml}</div>
        </div>
        <div>
          <h3 class="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">Envío</h3>
          <div class="bg-gray-50 rounded-lg p-3">${shippingHtml}</div>
        </div>
      </div>
    </div>
  </div>`;
}
