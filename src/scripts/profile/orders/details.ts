/** Toggle de detalles expandibles de un pedido */

const EYE_OPEN = 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z';
const EYE_CLOSED = 'M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21';

function closeOtherDetails(exceptOrderId: string): void {
  document.querySelectorAll('.order-details-section').forEach((section) => {
    const el = section as HTMLElement;
    const orderId = el.getAttribute('data-details-order-id');
    if (!orderId || orderId === exceptOrderId) return;

    const card = el.closest('[data-order-id]');
    if (!card) return;

    const progress = card.querySelector(`[data-progress-order-id="${orderId}"]`) as HTMLElement;
    const toggleBtn = card.querySelector(`.toggle-details-btn[data-order-id="${orderId}"]`) as HTMLButtonElement;
    const btnText = toggleBtn?.querySelector('.details-btn-text');

    if (progress) {
      progress.classList.add('hidden');
      progress.style.display = 'none';
    }
    el.style.maxHeight = '0';
    el.style.opacity = '0';
    setTimeout(() => {
      el.classList.add('hidden');
      el.style.display = 'none';
      el.style.maxHeight = '';
      el.style.opacity = '';
      el.style.transition = '';
    }, 200);
    if (btnText) btnText.textContent = 'Detalles';
    if (toggleBtn) {
      const svg = toggleBtn.querySelector('svg');
      if (svg) svg.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${EYE_OPEN}" />`;
    }
  });
}

export function toggleOrderDetails(orderId: string): void {
  if (!orderId) return;

  const card = Array.from(document.querySelectorAll('[data-order-id]')).find(
    (c) => c.getAttribute('data-order-id') === orderId
  );
  if (!card) return;

  const progressSection = card.querySelector(`[data-progress-order-id="${orderId}"]`) as HTMLElement | null;
  const detailsSection = card.querySelector(`[data-details-order-id="${orderId}"]`) as HTMLElement | null;
  const toggleBtn = card.querySelector(`.toggle-details-btn[data-order-id="${orderId}"]`) as HTMLButtonElement | null;
  const btnText = toggleBtn?.querySelector('.details-btn-text');

  if (!detailsSection || !toggleBtn) return;

  const isHidden = detailsSection.classList.contains('hidden') ||
    detailsSection.style.display === 'none' ||
    getComputedStyle(detailsSection).display === 'none';

  if (isHidden) {
    closeOtherDetails(orderId);

    if (progressSection) {
      progressSection.classList.remove('hidden');
      progressSection.style.display = 'block';
    }

    detailsSection.style.display = 'block';
    detailsSection.style.maxHeight = '0';
    detailsSection.style.overflow = 'hidden';
    detailsSection.style.transition = 'max-height 0.4s ease-out, opacity 0.4s ease-out';
    detailsSection.classList.remove('hidden');
    void detailsSection.offsetHeight;
    detailsSection.style.maxHeight = detailsSection.scrollHeight + 'px';
    detailsSection.style.opacity = '1';

    if (btnText) btnText.textContent = 'Ocultar Detalles';
    const svg = toggleBtn.querySelector('svg');
    if (svg) svg.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${EYE_CLOSED}" />`;

    setTimeout(() => {
      detailsSection.style.maxHeight = '';
      detailsSection.style.overflow = '';
      detailsSection.style.opacity = '';
    }, 400);
  } else {
    detailsSection.style.maxHeight = detailsSection.scrollHeight + 'px';
    detailsSection.style.overflow = 'hidden';
    detailsSection.style.transition = 'max-height 0.4s ease-out, opacity 0.4s ease-out';
    void detailsSection.offsetHeight;
    detailsSection.style.maxHeight = '0';
    detailsSection.style.opacity = '0';

    if (progressSection) {
      progressSection.classList.add('hidden');
      progressSection.style.display = 'none';
    }
    if (btnText) btnText.textContent = 'Ver Detalles';
    const svg = toggleBtn.querySelector('svg');
    if (svg) svg.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${EYE_OPEN}" />`;

    setTimeout(() => {
      detailsSection.classList.add('hidden');
      detailsSection.style.display = 'none';
      detailsSection.style.maxHeight = '';
      detailsSection.style.overflow = '';
      detailsSection.style.opacity = '';
      detailsSection.style.transition = '';
    }, 400);
  }
}
