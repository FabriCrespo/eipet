/** Conversión de datos Firebase al formato de la UI */

import { formatDate } from './utils';

export interface OrderStatusInfo {
  status: string;
  statusColor: string;
  statusIcon: string;
  progressStep: number;
}

export interface ComponentOrder {
  id: string;
  date: string;
  status: string;
  statusColor: string;
  statusIcon: string;
  total: number;
  productsCount: number;
  productImages: string[];
  showActions: string[];
  progressStep: number;
  products: Array<{
    name: string;
    image: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }>;
  shipping: {
    address: string;
    phone: string;
    trackingNumber: string;
    estimatedDelivery: string;
  };
  invoiceNumber?: string;
}

const STATUS_MAP: Record<string, OrderStatusInfo> = {
  pending: {
    status: 'Pendientes',
    statusColor: 'bg-amber-50 text-amber-700 border border-amber-200',
    statusIcon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    progressStep: 1
  },
  processing: {
    status: 'Procesando',
    statusColor: 'bg-blue-50 text-blue-700 border border-blue-200',
    statusIcon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
    progressStep: 2
  },
  shipped: {
    status: 'En camino',
    statusColor: 'bg-[#5d3fbb]/10 text-[#5d3fbb] border border-[#5d3fbb]/20',
    statusIcon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    progressStep: 3
  },
  delivered: {
    status: 'Entregados',
    statusColor: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    statusIcon: 'M5 13l4 4L19 7',
    progressStep: 4
  },
  cancelled: {
    status: 'Cancelados',
    statusColor: 'bg-red-50 text-red-700 border border-red-200',
    statusIcon: 'M6 18L18 6M6 6l12 12',
    progressStep: 0
  }
};

function getAvailableActions(status: string): string[] {
  const actions: string[] = ['verDetalles', 'factura'];
  if (status === 'delivered') actions.push('calificar', 'devolver');
  return actions;
}

export function mapOrderStatus(status: string): OrderStatusInfo {
  return STATUS_MAP[status] ?? STATUS_MAP.pending;
}

interface FirebaseOrderItem {
  productId?: string;
  id?: string;
  productName?: string;
  productImage?: string;
  quantity?: number;
  price?: number;
  subtotal?: number;
}

interface FirebaseOrder {
  id?: string;
  userId?: string;
  status?: string;
  total?: number;
  items?: FirebaseOrderItem[];
  shippingAddress?: { address?: string; district?: string; city?: string; phone?: string };
  trackingNumber?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
  invoiceNumber?: string;
}

export function convertFirebaseOrderToComponent(firebaseOrder: FirebaseOrder): ComponentOrder {
  const status = firebaseOrder.status ?? 'pending';
  const statusInfo = mapOrderStatus(status);
  const items = firebaseOrder.items ?? [];

  const productImages = items.map((i) => i.productImage ?? '');
  const products = items.map((item) => ({
    name: item.productName ?? 'Producto sin nombre',
    image: item.productImage ?? '',
    quantity: item.quantity ?? 1,
    unitPrice: item.price ?? 0,
    subtotal: item.subtotal ?? (item.price ?? 0) * (item.quantity ?? 1)
  }));

  const shippingAddress = firebaseOrder.shippingAddress ?? {};
  const addressParts = [
    shippingAddress.address,
    shippingAddress.district,
    shippingAddress.city
  ].filter(Boolean);
  const address = addressParts.length ? addressParts.join(', ') : 'Dirección no disponible';

  const trackingNumber = firebaseOrder.trackingNumber ??
    (status === 'pending' ? 'Pendiente de asignación' : 'BOL' + (firebaseOrder.id ?? '').substring(0, 8).toUpperCase());

  const estimatedDelivery = status === 'delivered'
    ? formatDate(firebaseOrder.updatedAt ?? firebaseOrder.createdAt)
    : 'Pendiente de calcular';

  return {
    id: firebaseOrder.id ?? '',
    date: formatDate(firebaseOrder.createdAt),
    status: statusInfo.status,
    statusColor: statusInfo.statusColor,
    statusIcon: statusInfo.statusIcon,
    total: firebaseOrder.total ?? 0,
    productsCount: items.length,
    productImages,
    showActions: getAvailableActions(status),
    progressStep: statusInfo.progressStep,
    products,
    shipping: {
      address,
      phone: shippingAddress.phone ?? 'Teléfono no disponible',
      trackingNumber,
      estimatedDelivery
    },
    invoiceNumber: firebaseOrder.invoiceNumber
  };
}
