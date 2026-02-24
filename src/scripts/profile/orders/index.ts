/**
 * Sección de pedidos del perfil.
 * Orquesta carga, filtros, paginación, detalles y modales.
 */

import { getOrdersDomRefs, allCriticalElementsPresent } from './dom';
import {
  createOrdersState,
  filterOrders,
  renderOrders,
  updatePagination,
  loadOrdersFromFirebase
} from './load';
import { toggleOrderDetails } from './details';
import { initRatingModal, openRatingModal, closeRatingModal } from './rating-modal';
import { initReturnRequestModal, openReturnRequestModal } from './return-modal';
import { ORDERS_PER_PAGE } from './constants';

declare global {
  interface Window {
    openRatingModal: (orderId: string) => void;
    closeRatingModal: () => void;
    openReturnRequestModal: (orderId: string) => void;
    downloadInvoice: (orderId: string, invoiceNumber: string) => void;
  }
}

function init(): void {
  const refs = getOrdersDomRefs();

  if (!allCriticalElementsPresent(refs)) {
    const missing = ['ordersContainer', 'noOrdersMessage', 'paginationContainer', 'searchInput', 'statusFilterBtn', 'statusFilterText', 'statusFilterArrow', 'statusDropdownMenu', 'filterDropdownContainer', 'prevPageBtn', 'nextPageBtn', 'paginationNumbers', 'paginationStart', 'paginationEnd', 'paginationTotal', 'ordersLoading', 'ordersError']
      .filter((k) => !(refs as Record<string, unknown>)[k]);
    console.warn('[ORDERS] Elementos faltantes:', missing);
    setTimeout(init, 200);
    return;
  }

  const state = createOrdersState();
  let listenersAttached = false;

  const refresh = (): void => {
    renderOrders(state, refs);
    updatePagination(state, refs, (page) => {
      state.currentPage = page;
      refresh();
    });
  };

  const loadOrders = (): Promise<void> =>
    loadOrdersFromFirebase(state, refs, refresh);

  const applyFilters = (): void => {
    filterOrders(state);
    refresh();
  };

  function handleContainerClick(e: Event): void {
    const target = e.target as HTMLElement;

    const toggleBtn = target.closest('.toggle-details-btn');
    if (toggleBtn) {
      e.preventDefault();
      e.stopPropagation();
      const orderId = toggleBtn.getAttribute('data-order-id');
      if (orderId) toggleOrderDetails(orderId);
      return;
    }

    const rateBtn = target.closest('.rate-order-btn');
    if (rateBtn) {
      e.preventDefault();
      e.stopPropagation();
      const orderId = rateBtn.getAttribute('data-order-id');
      if (orderId) openRatingModal(orderId);
      return;
    }

    const returnBtn = target.closest('.return-request-btn');
    if (returnBtn) {
      e.preventDefault();
      e.stopPropagation();
      const orderId = returnBtn.getAttribute('data-order-id');
      if (orderId) openReturnRequestModal(orderId, loadOrders);
      return;
    }
  }

  if (refs.ordersContainer && !listenersAttached) {
    refs.ordersContainer.addEventListener('click', handleContainerClick, true);
    listenersAttached = true;
  }

  refs.ordersRetryBtn?.addEventListener('click', loadOrders);

  refs.searchInput?.addEventListener('input', () => {
    state.currentSearch = refs.searchInput?.value ?? '';
    applyFilters();
  });

  refs.statusFilterBtn?.addEventListener('click', () => {
    refs.statusDropdownMenu?.classList.toggle('hidden');
    refs.statusFilterArrow?.classList.toggle('rotate-180');
  });

  document.querySelectorAll('.filter-option').forEach((opt) => {
    opt.addEventListener('click', () => {
      const btn = opt as HTMLButtonElement;
      const status = btn.dataset.status ?? 'all';
      const span = btn.querySelector('span');
      const text = span?.textContent ?? 'Todos los estados';

      state.currentFilter = status;
      if (refs.statusFilterText) refs.statusFilterText.textContent = text;
      refs.statusDropdownMenu?.classList.add('hidden');
      refs.statusFilterArrow?.classList.remove('rotate-180');

      document.querySelectorAll('.filter-option .check-icon').forEach((icon) => {
        (icon as HTMLElement).style.display = 'none';
      });
      const check = btn.querySelector('.check-icon') as HTMLElement | null;
      if (check) check.style.display = 'block';

      applyFilters();
    });
  });

  document.addEventListener('click', (e) => {
    if (
      refs.filterDropdownContainer &&
      refs.statusDropdownMenu &&
      refs.statusFilterArrow &&
      !refs.filterDropdownContainer.contains(e.target as Node)
    ) {
      refs.statusDropdownMenu.classList.add('hidden');
      refs.statusFilterArrow.classList.remove('rotate-180');
    }
  });

  refs.prevPageBtn?.addEventListener('click', () => {
    if (state.currentPage > 1) {
      state.currentPage--;
      refresh();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  refs.nextPageBtn?.addEventListener('click', () => {
    const totalPages = Math.ceil(state.filteredOrders.length / ORDERS_PER_PAGE);
    if (state.currentPage < totalPages) {
      state.currentPage++;
      refresh();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  window.openRatingModal = openRatingModal;
  window.closeRatingModal = closeRatingModal;
  window.openReturnRequestModal = (orderId: string) => openReturnRequestModal(orderId, loadOrders);
  window.downloadInvoice = async (orderId: string, invoiceNumber: string) => {
    try {
      const { getOrderById } = await import('../../../lib/db/orders');
      const result = await getOrderById(orderId);
      if (!result.data) {
        alert('No se pudo encontrar la orden');
        return;
      }
      alert(`Factura: ${invoiceNumber}\n\nLa funcionalidad de descarga de factura estará disponible pronto.`);
    } catch (error) {
      console.error('Error al obtener factura:', error);
      alert('Error al obtener la factura');
    }
  };

  initRatingModal();
  initReturnRequestModal(loadOrders);

  const ordersSection = document.querySelector('[data-profile-section="orders"]');
  if (ordersSection) {
    const observer = new MutationObserver(() => {
      const isVisible =
        !ordersSection.classList.contains('hidden') &&
        getComputedStyle(ordersSection).display !== 'none';
      if (isVisible && state.allOrders.length === 0) {
        loadOrders();
      }
    });
    observer.observe(ordersSection, { attributes: true, attributeFilter: ['class'] });

    const initiallyVisible =
      !ordersSection.classList.contains('hidden') &&
      getComputedStyle(ordersSection).display !== 'none';
    if (initiallyVisible) loadOrders();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => setTimeout(init, 300));
} else {
  setTimeout(init, 300);
}
