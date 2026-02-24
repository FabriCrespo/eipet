/** Referencias al DOM de la sección de pedidos */

export interface OrdersDomRefs {
  ordersContainer: HTMLElement | null;
  noOrdersMessage: HTMLElement | null;
  paginationContainer: HTMLElement | null;
  searchInput: HTMLInputElement | null;
  statusFilterBtn: HTMLButtonElement | null;
  statusFilterText: HTMLElement | null;
  statusFilterArrow: HTMLElement | null;
  statusDropdownMenu: HTMLElement | null;
  filterDropdownContainer: HTMLElement | null;
  prevPageBtn: HTMLButtonElement | null;
  nextPageBtn: HTMLButtonElement | null;
  paginationNumbers: HTMLElement | null;
  paginationStart: HTMLElement | null;
  paginationEnd: HTMLElement | null;
  paginationTotal: HTMLElement | null;
  ordersLoading: HTMLElement | null;
  ordersError: HTMLElement | null;
  ordersErrorMessage: HTMLElement | null;
  ordersRetryBtn: HTMLButtonElement | null;
}

export function getOrdersDomRefs(): OrdersDomRefs {
  return {
    ordersContainer: document.getElementById('orders-container'),
    noOrdersMessage: document.getElementById('no-orders-message'),
    paginationContainer: document.getElementById('pagination-container'),
    searchInput: document.getElementById('search-input') as HTMLInputElement | null,
    statusFilterBtn: document.getElementById('status-filter-btn') as HTMLButtonElement | null,
    statusFilterText: document.getElementById('status-filter-text'),
    statusFilterArrow: document.getElementById('status-filter-arrow'),
    statusDropdownMenu: document.getElementById('status-dropdown-menu'),
    filterDropdownContainer: document.getElementById('filter-dropdown-container'),
    prevPageBtn: document.getElementById('prev-page-btn') as HTMLButtonElement | null,
    nextPageBtn: document.getElementById('next-page-btn') as HTMLButtonElement | null,
    paginationNumbers: document.getElementById('pagination-numbers'),
    paginationStart: document.getElementById('pagination-start'),
    paginationEnd: document.getElementById('pagination-end'),
    paginationTotal: document.getElementById('pagination-total'),
    ordersLoading: document.getElementById('orders-loading'),
    ordersError: document.getElementById('orders-error'),
    ordersErrorMessage: document.getElementById('orders-error-message'),
    ordersRetryBtn: document.getElementById('orders-retry-btn') as HTMLButtonElement | null
  };
}

const CRITICAL_IDS = [
  'ordersContainer', 'noOrdersMessage', 'paginationContainer',
  'searchInput', 'statusFilterBtn', 'statusFilterText', 'statusFilterArrow',
  'statusDropdownMenu', 'filterDropdownContainer', 'prevPageBtn', 'nextPageBtn',
  'paginationNumbers', 'paginationStart', 'paginationEnd', 'paginationTotal',
  'ordersLoading', 'ordersError'
] as const;

export function allCriticalElementsPresent(refs: OrdersDomRefs): boolean {
  const keys = CRITICAL_IDS as unknown as (keyof OrdersDomRefs)[];
  return keys.every((k) => refs[k] != null);
}
