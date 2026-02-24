/** Constantes de la sección de pedidos */

export const ORDERS_PER_PAGE = 3;
export const MAX_VISIBLE_PAGES = 5;

export const FILTER_MAP: Record<string, string> = {
  pendientes: 'Pendientes',
  procesando: 'Procesando',
  'en camino': 'En camino',
  entregados: 'Entregados',
  cancelados: 'Cancelados'
};

export const PROGRESS_STEPS = [
  { label: 'Pedido Realizado', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  { label: 'Procesando', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
  { label: 'En Camino', icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4' },
  { label: 'Entregado', icon: 'M5 13l4 4L19 7' }
] as const;
