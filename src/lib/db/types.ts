/**
 * Tipos TypeScript para todas las colecciones y subcolecciones de Firestore
 * Todos los tipos están diseñados para funcionar client-side
 */

import { Timestamp } from 'firebase/firestore';

// ============================================================================
// TIPOS BASE Y UTILIDADES
// ============================================================================

/**
 * Timestamp de Firestore (puede ser Timestamp o Date)
 */
export type FirestoreTimestamp = Timestamp | Date | null;

/**
 * Convierte FirestoreTimestamp a Date
 */
export function toDate(timestamp: FirestoreTimestamp): Date | null {
  if (!timestamp) return null;
  if (timestamp instanceof Date) return timestamp;
  if (timestamp instanceof Timestamp) return timestamp.toDate();
  return null;
}

/**
 * Convierte Date a Timestamp de Firestore
 */
export function toTimestamp(date: Date | null): Timestamp | null {
  if (!date) return null;
  return Timestamp.fromDate(date);
}

// ============================================================================
// USUARIOS
// ============================================================================

export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: UserRole;
  avatar?: string;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

export interface CreateUserData {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role?: UserRole;
  avatar?: string;
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: UserRole;
  avatar?: string;
}

// ============================================================================
// DIRECCIONES (Subcolección de users)
// ============================================================================

export interface UserAddress {
  id: string;
  name: string; // Nombre de la dirección (ej: "Casa", "Oficina")
  fullName: string;
  phone: string;
  address: string;
  city: string;
  district: string;
  zipCode: string;
  latitude?: number;
  longitude?: number;
  instructions?: string;
  isDefault: boolean;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

export interface CreateAddressData {
  name: string;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  district: string;
  zipCode: string;
  latitude?: number;
  longitude?: number;
  instructions?: string;
  isDefault?: boolean;
}

export interface UpdateAddressData {
  name?: string;
  fullName?: string;
  phone?: string;
  address?: string;
  city?: string;
  district?: string;
  zipCode?: string;
  latitude?: number;
  longitude?: number;
  instructions?: string;
  isDefault?: boolean;
}

// ============================================================================
// MÉTODOS DE PAGO (Subcolección de users)
// ============================================================================

export type PaymentMethodType = 'card' | 'cash';

export interface PaymentMethod {
  id: string;
  type: PaymentMethodType;
  cardNumber?: string; // Enmascarado (ej: "**** **** **** 1234")
  expiryDate?: string; // Formato: "MM/YY"
  cardholderName?: string;
  isDefault: boolean;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

export interface CreatePaymentMethodData {
  type: PaymentMethodType;
  cardNumber?: string;
  expiryDate?: string;
  cardholderName?: string;
  isDefault?: boolean;
}

export interface UpdatePaymentMethodData {
  type?: PaymentMethodType;
  cardNumber?: string;
  expiryDate?: string;
  cardholderName?: string;
  isDefault?: boolean;
}

// ============================================================================
// CATEGORÍAS Y TIPOS DINÁMICOS (Gestionables por Admin)
// ============================================================================

export type CategoryType = 'category' | 'type' | 'lifeStage' | 'breedSize';

export interface ProductCategory {
  id: string;
  name: string; // Nombre legible (ej: "Perro", "Gato")
  slug: string; // Slug único (ej: "dog", "cat")
  type: 'category';
  icon?: string; // URL del icono
  description?: string;
  isActive: boolean;
  order: number; // Orden de visualización
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

export interface ProductTypeOption {
  id: string;
  name: string; // Nombre legible (ej: "Alimento", "Juguete")
  slug: string; // Slug único (ej: "food", "toy")
  type: 'type';
  icon?: string;
  description?: string;
  isActive: boolean;
  order: number;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

export interface LifeStageOption {
  id: string;
  name: string; // Nombre legible (ej: "Cachorro", "Adulto")
  slug: string; // Slug único (ej: "cachorro", "adulto")
  type: 'lifeStage';
  icon?: string;
  description?: string;
  isActive: boolean;
  order: number;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

export interface BreedSizeOption {
  id: string;
  name: string; // Nombre legible (ej: "Pequeña", "Mediana")
  slug: string; // Slug único (ej: "pequeña", "mediana")
  type: 'breedSize';
  icon?: string;
  description?: string;
  isActive: boolean;
  order: number;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

// Tipo unificado para todas las opciones
export type ProductOption = ProductCategory | ProductTypeOption | LifeStageOption | BreedSizeOption;

export interface CreateProductOptionData {
  name: string;
  slug: string;
  type: CategoryType;
  icon?: string;
  description?: string;
  isActive?: boolean;
  order?: number;
}

export interface UpdateProductOptionData {
  name?: string;
  slug?: string;
  icon?: string;
  description?: string;
  isActive?: boolean;
  order?: number;
}

// ============================================================================
// PRODUCTOS
// ============================================================================

// Tipos literales para compatibilidad (valores por defecto)
export type ProductCategorySlug = 'dog' | 'cat' | string; // Permite valores dinámicos
export type ProductTypeSlug = 'food' | 'toy' | 'cleaning' | 'accessory' | string;
export type LifeStageSlug = 'cachorro' | 'gatito' | 'adulto' | 'senior' | 'todos' | string;
export type BreedSizeSlug = 'pequeña' | 'mediana' | 'grande' | 'todos' | string;
export type ProductStatus = 'active' | 'inactive';
export type DiscountType = 'percentage' | 'fixed';

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: ProductCategorySlug; // Usa slug de la categoría (puede ser dinámico)
  type: ProductTypeSlug; // Usa slug del tipo (puede ser dinámico)
  price: number; // Precio actual (con descuento aplicado)
  originalPrice?: number | null; // Precio original (null si no hay descuento)
  discount: number; // Porcentaje de descuento (0-100)
  discountType: DiscountType; // "percentage" | "fixed"
  discountStartDate?: FirestoreTimestamp | null;
  discountEndDate?: FirestoreTimestamp | null;
  weight?: string | null; // Ej: "20 kg", "500 ml"
  image: string;
  lifeStage: LifeStageSlug; // Usa slug de la etapa (puede ser dinámico)
  breedSize: BreedSizeSlug; // Usa slug del tamaño (puede ser dinámico)
  stock: number;
  minStock: number;
  status: ProductStatus;
  tags?: string[]; // Para búsqueda flexible
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

export interface CreateProductData {
  name: string;
  brand: string;
  category: ProductCategorySlug; // Puede ser dinámico
  type: ProductTypeSlug; // Puede ser dinámico
  price: number;
  originalPrice?: number | null;
  discount?: number;
  discountType?: DiscountType;
  discountStartDate?: Date | null;
  discountEndDate?: Date | null;
  weight?: string | null;
  image: string;
  lifeStage: LifeStageSlug; // Puede ser dinámico
  breedSize: BreedSizeSlug; // Puede ser dinámico
  stock: number;
  minStock: number;
  status?: ProductStatus;
  tags?: string[];
}

export interface UpdateProductData {
  name?: string;
  brand?: string;
  category?: ProductCategorySlug; // Puede ser dinámico
  type?: ProductTypeSlug; // Puede ser dinámico
  price?: number;
  originalPrice?: number | null;
  discount?: number;
  discountType?: DiscountType;
  discountStartDate?: Date | null;
  discountEndDate?: Date | null;
  weight?: string | null;
  image?: string;
  lifeStage?: LifeStageSlug; // Puede ser dinámico
  breedSize?: BreedSizeSlug; // Puede ser dinámico
  stock?: number;
  minStock?: number;
  status?: ProductStatus;
  tags?: string[];
}

export interface ProductFilters {
  category?: ProductCategorySlug | ProductCategorySlug[];
  type?: ProductTypeSlug | ProductTypeSlug[];
  lifeStage?: LifeStageSlug | LifeStageSlug[];
  breedSize?: BreedSizeSlug | BreedSizeSlug[];
  minPrice?: number;
  maxPrice?: number;
  discount?: boolean; // Solo productos con descuento
  search?: string; // Búsqueda por nombre/brand
  sortBy?: 'price' | 'discount' | 'name';
  sortOrder?: 'asc' | 'desc';
  status?: ProductStatus;
  limit?: number;
}

// ============================================================================
// PEDIDOS
// ============================================================================

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderItem {
  id: string; // ID único del item en el pedido
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  price: number; // Precio al momento de la compra
  subtotal: number; // quantity * price
}

export interface Order {
  id: string;
  userId: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number; // Suma de todos los items
  discount: number; // Descuento total aplicado
  total: number; // subtotal - discount
  shippingAddress: UserAddress;
  paymentMethod: PaymentMethod;
  invoiceNumber?: string; // Número de factura único
  trackingNumber?: string; // Número de seguimiento del envío
  shippingCost?: number; // Costo de envío
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

export interface CreateOrderData {
  userId: string;
  items: OrderItem[];
  subtotal: number;
  discount?: number;
  shippingAddress: UserAddress;
  paymentMethod: PaymentMethod;
  shippingCost?: number; // Costo de envío
}

export interface UpdateOrderData {
  status?: OrderStatus;
  trackingNumber?: string; // Número de seguimiento del envío
  shippingCost?: number; // Costo de envío
}

// ============================================================================
// DEVOLUCIONES
// ============================================================================

export type ReturnStatus = 'pending' | 'approved' | 'rejected' | 'processing' | 'completed' | 'cancelled';
export type ReturnReason = 'defective' | 'wrong_item' | 'damaged' | 'not_as_described' | 'other';

export interface ReturnTimelineItem {
  date: string;
  time: string;
  status: string;
  completed: boolean;
}

export interface Return {
  id: string;
  userId: string;
  orderId: string;
  orderItemId: string; // ID del item específico del pedido
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  reason: ReturnReason;
  description: string;
  status: ReturnStatus;
  refundAmount: number;
  refundMethod: string; // 'card' | 'transfer' | 'cash'
  shippingAddress: UserAddress;
  timeline: ReturnTimelineItem[];
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

export interface CreateReturnData {
  userId: string;
  orderId: string;
  orderItemId: string;
  productId: string;
  reason: ReturnReason;
  description: string;
  shippingAddress: UserAddress;
}

export interface UpdateReturnData {
  status?: ReturnStatus;
  refundAmount?: number;
  refundMethod?: string;
  timeline?: ReturnTimelineItem[];
}

// ============================================================================
// HISTORIAL DE PRODUCTOS VISTOS
// ============================================================================

export interface ViewHistoryItem {
  productId: string;
  viewedAt: FirestoreTimestamp;
}

export interface ViewHistory {
  id: string; // userId
  userId: string;
  items: ViewHistoryItem[];
  updatedAt: FirestoreTimestamp;
}

// ============================================================================
// FAVORITOS
// ============================================================================

export interface Favorite {
  id: string; // userId
  userId: string;
  productIds: string[]; // Array de IDs de productos favoritos
  updatedAt: FirestoreTimestamp;
}

// ============================================================================
// CARRITO DE COMPRAS
// ============================================================================

export interface CartItem {
  productId: string;
  quantity: number;
  addedAt: FirestoreTimestamp;
}

export interface Cart {
  id: string; // userId
  userId: string;
  items: CartItem[];
  updatedAt: FirestoreTimestamp;
}

export interface AddToCartData {
  productId: string;
  quantity: number;
}

// ============================================================================
// DESCUENTOS (Opcional - para casos complejos)
// ============================================================================

export type DiscountTargetType = 'product' | 'category' | 'global';

export interface Discount {
  id: string;
  name: string;
  type: DiscountTargetType;
  targetId?: string | null; // productId, category, o null para global
  discountValue: number;
  discountType: DiscountType;
  startDate: FirestoreTimestamp;
  endDate: FirestoreTimestamp;
  isActive: boolean;
  minPurchaseAmount?: number;
  maxUses?: number;
  currentUses: number;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

// ============================================================================
// CONFIGURACIONES DE USUARIO
// ============================================================================

export interface UserSettings {
  id: string; // userId
  userId: string;
  notifications: {
    email: boolean;
    push: boolean;
    orders: boolean;
  };
  preferences: {
    language: string;
    timezone: string;
    theme: 'light' | 'dark' | 'system';
  };
  communication: {
    newsletter: boolean;
    promotions: boolean;
  };
  privacy: {
    publicProfile: boolean;
    shareData: boolean;
  };
  updatedAt: FirestoreTimestamp;
}

export interface UpdateUserSettingsData {
  notifications?: Partial<UserSettings['notifications']>;
  preferences?: Partial<UserSettings['preferences']>;
  communication?: Partial<UserSettings['communication']>;
  privacy?: Partial<UserSettings['privacy']>;
}

// ============================================================================
// CALIFICACIONES (RATINGS/REVIEWS)
// ============================================================================

export interface Rating {
  id: string;
  userId: string;
  orderId: string;
  productId: string;
  rating: number; // 1-5
  comment?: string;
  createdAt: FirestoreTimestamp;
  updatedAt: FirestoreTimestamp;
}

export interface CreateRatingData {
  userId: string;
  orderId: string;
  productId: string;
  rating: number; // 1-5
  comment?: string;
}

export interface UpdateRatingData {
  rating?: number;
  comment?: string;
}

// ============================================================================
// TIPOS PARA OPERACIONES CRUD
// ============================================================================

export interface QueryResult<T> {
  data: T[];
  error?: Error;
}

export interface SingleResult<T> {
  data: T | null;
  error?: Error;
}

export interface WriteResult {
  success: boolean;
  id?: string;
  error?: Error;
}

