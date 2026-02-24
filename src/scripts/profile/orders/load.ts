/** Carga, filtrado y renderizado de pedidos */

import { getUserId, isOrdersSectionVisible } from './utils';
import { convertFirebaseOrderToComponent } from './transform';
import { buildOrderCardHtml } from './render';
import { ORDERS_PER_PAGE } from './constants';
import { FILTER_MAP } from './constants';
import type { ComponentOrder } from './transform';
import type { OrdersDomRefs } from './dom';

export interface OrdersState {
  allOrders: ComponentOrder[];
  filteredOrders: ComponentOrder[];
  currentPage: number;
  currentFilter: string;
  currentSearch: string;
}

export function createOrdersState(): OrdersState {
  return {
    allOrders: [],
    filteredOrders: [],
    currentPage: 1,
    currentFilter: 'all',
    currentSearch: ''
  };
}

export async function loadOrdersFromFirebase(
  state: OrdersState,
  refs: OrdersDomRefs,
  onRender: () => void
): Promise<void> {
  const {
    ordersLoading,
    ordersError,
    ordersErrorMessage,
    ordersContainer,
    noOrdersMessage,
    paginationContainer
  } = refs;

  const showLoading = (): void => {
    ordersLoading?.classList.remove('hidden');
    ordersLoading && (ordersLoading.style.display = 'flex');
    ordersError?.classList.add('hidden');
    ordersError && (ordersError.style.display = 'none');
    ordersContainer?.classList.add('hidden');
    ordersContainer && (ordersContainer.style.display = 'none');
    noOrdersMessage?.classList.add('hidden');
    noOrdersMessage && (noOrdersMessage.style.display = 'none');
  };

  const showError = (message: string): void => {
    ordersLoading?.classList.add('hidden');
    ordersLoading && (ordersLoading.style.display = 'none');
    ordersError?.classList.remove('hidden');
    ordersError && (ordersError.style.display = 'block');
    if (ordersErrorMessage) ordersErrorMessage.textContent = message;
    ordersContainer?.classList.add('hidden');
    ordersContainer && (ordersContainer.style.display = 'none');
  };

  const showEmpty = (): void => {
    ordersLoading?.classList.add('hidden');
    ordersLoading && (ordersLoading.style.display = 'none');
    ordersContainer?.classList.add('hidden');
    ordersContainer && (ordersContainer.style.display = 'none');
    noOrdersMessage?.classList.remove('hidden');
    noOrdersMessage && (noOrdersMessage.style.display = 'block');
    paginationContainer?.classList.add('hidden');
  };

  const showResults = (): void => {
    ordersLoading?.classList.add('hidden');
    ordersLoading && (ordersLoading.style.display = 'none');
    ordersContainer?.classList.remove('hidden');
    ordersContainer && (ordersContainer.style.display = 'block');
    noOrdersMessage?.classList.add('hidden');
    noOrdersMessage && (noOrdersMessage.style.display = 'none');
  };

  if (!isOrdersSectionVisible()) return;

  showLoading();

  try {
    const userId = await getUserId(30, 200);
    if (!userId?.trim()) throw new Error('No se pudo obtener el ID del usuario. Por favor, recarga la página.');

    const { getUserOrders } = await import('../../../lib/db/orders');
    const result = await getUserOrders(userId);
    if (result.error) throw result.error;

    const rawOrders = result.data ?? [];
    const userOrders = rawOrders.filter((o: { userId?: string }) => o.userId === userId);

    state.allOrders = userOrders.map((o: unknown) => convertFirebaseOrderToComponent(o as Parameters<typeof convertFirebaseOrderToComponent>[0]));
    state.filteredOrders = [...state.allOrders];
    state.currentPage = 1;

    if (state.allOrders.length === 0) {
      showEmpty();
    } else {
      showResults();
      onRender();
    }
  } catch (error) {
    showError((error as Error).message ?? 'Error desconocido al cargar los pedidos');
  }
}

export function filterOrders(state: OrdersState): void {
  state.filteredOrders = state.allOrders.filter((order) => {
    if (state.currentFilter !== 'all') {
      const expectedStatus = FILTER_MAP[state.currentFilter] ?? state.currentFilter;
      if (order.status !== expectedStatus) return false;
    }
    if (state.currentSearch.trim()) {
      const search = state.currentSearch.toLowerCase();
      const orderId = order.id.toString().toLowerCase();
      const invoice = (order.invoiceNumber ?? '').toLowerCase();
      const productNames = (order.products ?? []).map((p) => p.name.toLowerCase()).join(' ');
      if (
        !orderId.includes(search) &&
        !invoice.includes(search) &&
        !productNames.includes(search)
      ) {
        return false;
      }
    }
    return true;
  });
  state.currentPage = 1;
}

export function renderOrders(
  state: OrdersState,
  refs: OrdersDomRefs
): void {
  const { ordersContainer, noOrdersMessage, paginationContainer } = refs;
  if (!ordersContainer || !noOrdersMessage || !paginationContainer) return;

  const start = (state.currentPage - 1) * ORDERS_PER_PAGE;
  const end = start + ORDERS_PER_PAGE;
  const ordersToShow = state.filteredOrders.slice(start, end);

  if (ordersToShow.length === 0) {
    ordersContainer.classList.add('hidden');
    noOrdersMessage.classList.remove('hidden');
    paginationContainer.classList.add('hidden');
    return;
  }

  ordersContainer.classList.remove('hidden');
  noOrdersMessage.classList.add('hidden');
  paginationContainer.classList.remove('hidden');
  ordersContainer.innerHTML = ordersToShow.map(buildOrderCardHtml).join('');
}

export function updatePagination(
  state: OrdersState,
  refs: OrdersDomRefs,
  onPageChange: (page: number) => void
): void {
  const {
    paginationStart,
    paginationEnd,
    paginationTotal,
    prevPageBtn,
    nextPageBtn,
    paginationNumbers
  } = refs;

  const totalPages = Math.ceil(state.filteredOrders.length / ORDERS_PER_PAGE);
  const start = state.filteredOrders.length > 0 ? (state.currentPage - 1) * ORDERS_PER_PAGE + 1 : 0;
  const end = Math.min(state.currentPage * ORDERS_PER_PAGE, state.filteredOrders.length);

  if (paginationStart) paginationStart.textContent = String(start);
  if (paginationEnd) paginationEnd.textContent = String(end);
  if (paginationTotal) paginationTotal.textContent = String(state.filteredOrders.length);

  if (prevPageBtn) prevPageBtn.disabled = state.currentPage === 1;
  if (nextPageBtn) nextPageBtn.disabled = state.currentPage === totalPages || totalPages === 0;

  if (!paginationNumbers) return;
  paginationNumbers.innerHTML = '';

  const maxVisible = 5;
  let startPage = Math.max(1, state.currentPage - Math.floor(maxVisible / 2));
  let endPage = Math.min(totalPages, startPage + maxVisible - 1);
  if (endPage - startPage < maxVisible - 1) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className =
      i === state.currentPage
        ? 'px-3 py-1.5 text-sm rounded-lg border border-[#5d3fbb] bg-[#5d3fbb] text-white font-semibold'
        : 'px-3 py-1.5 text-sm rounded-lg border border-gray-200 bg-white text-gray-700 hover:border-[#5d3fbb] hover:bg-[#5d3fbb]/5 font-medium';
    btn.textContent = String(i);
    btn.addEventListener('click', () => {
      onPageChange(i);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    paginationNumbers.appendChild(btn);
  }
}
