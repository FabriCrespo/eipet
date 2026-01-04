/**
 * Funciones para gestionar pedidos en Firestore
 * Todas las funciones funcionan client-side
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import type {
  Order,
  CreateOrderData,
  UpdateOrderData,
  OrderStatus,
  SingleResult,
  QueryResult,
  WriteResult,
} from './types';
import { generateInvoiceNumber } from '../utils/invoice';

const COLLECTION_NAME = 'orders';

/**
 * Crear un nuevo pedido
 */
export async function createOrder(data: CreateOrderData): Promise<WriteResult> {
  try {
    const now = Timestamp.now();
    const nowDate = now.toDate();
    
    // Generar número de factura temporal (se actualizará después con el ID real)
    const tempInvoiceNumber = generateInvoiceNumber('TEMP', nowDate);
    
    const shippingCost = data.shippingCost || 0;
    const orderData: any = {
      id: '', // Se asignará después
      userId: data.userId,
      status: 'pending',
      items: data.items,
      subtotal: data.subtotal,
      discount: data.discount || 0,
      total: data.subtotal - (data.discount || 0) + shippingCost,
      shippingAddress: data.shippingAddress,
      paymentMethod: data.paymentMethod,
      invoiceNumber: tempInvoiceNumber,
      shippingCost: shippingCost,
      createdAt: now,
      updatedAt: now,
    };
    
    // Solo agregar campos de guest si realmente es una orden de invitado
    if (data.isGuest === true) {
      orderData.isGuest = true;
      if (data.guestEmail) orderData.guestEmail = data.guestEmail;
      if (data.guestPhone) orderData.guestPhone = data.guestPhone;
      if (data.guestName) orderData.guestName = data.guestName;
    }

    console.log('📝 [ORDERS] Creando orden con datos:', {
      userId: orderData.userId,
      isGuest: orderData.isGuest || false,
      itemsCount: orderData.items.length,
      subtotal: orderData.subtotal,
      total: orderData.total
    });
    
    const docRef = await addDoc(collection(db, COLLECTION_NAME), orderData);
    console.log('✅ [ORDERS] Documento creado con ID:', docRef.id);
    
    // Actualizar con el número de factura correcto y el ID usando el ID real
    const invoiceNumber = generateInvoiceNumber(docRef.id, nowDate);
    console.log('📄 [ORDERS] Generando invoiceNumber:', invoiceNumber);
    
    try {
      await updateDoc(docRef, {
        id: docRef.id,
        invoiceNumber: invoiceNumber,
      });
      console.log('✅ [ORDERS] Orden actualizada con invoiceNumber e id');
    } catch (updateError: any) {
      console.error('⚠️ [ORDERS] Error actualizando invoiceNumber:', updateError);
      // Continuar de todas formas, el invoiceNumber temporal está bien
    }
    
    console.log('✅ [ORDERS] Orden creada exitosamente:', {
      id: docRef.id,
      invoiceNumber: invoiceNumber,
      userId: orderData.userId,
      isGuest: orderData.isGuest || false
    });
    
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating order:', error);
    return { success: false, error: error as Error };
  }
}

/**
 * Obtener todos los pedidos de un usuario
 */
export async function getUserOrders(userId: string): Promise<QueryResult<Order>> {
  try {
    const ordersRef = collection(db, COLLECTION_NAME);
    const q = query(
      ordersRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);

    const orders: Order[] = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      // Asegurar que el ID del documento tenga prioridad sobre cualquier campo 'id' en los datos
      return {
        ...data,
        id: doc.id, // El ID del documento siempre tiene prioridad
      } as Order;
    });

    return { data: orders };
  } catch (error) {
    console.error('Error getting user orders:', error);
    return { data: [], error: error as Error };
  }
}

/**
 * Obtener un pedido por ID
 */
export async function getOrderById(orderId: string): Promise<SingleResult<Order>> {
  try {
    const orderRef = doc(db, COLLECTION_NAME, orderId);
    const orderSnap = await getDoc(orderRef);

    if (!orderSnap.exists()) {
      return { data: null };
    }

    const data = orderSnap.data();
    // Asegurar que el ID del documento tenga prioridad sobre cualquier campo 'id' en los datos
    const order = {
      ...data,
      id: orderSnap.id, // El ID del documento siempre tiene prioridad
    } as Order;

    return { data: order };
  } catch (error) {
    console.error('Error getting order:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Actualizar el estado de un pedido
 */
export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<WriteResult> {
  try {
    const orderRef = doc(db, COLLECTION_NAME, orderId);
    await updateDoc(orderRef, {
      status,
      updatedAt: Timestamp.now(),
    });
    return { success: true, id: orderId };
  } catch (error) {
    console.error('Error updating order status:', error);
    return { success: false, error: error as Error };
  }
}

/**
 * Actualizar un pedido (campos generales)
 */
export async function updateOrder(orderId: string, data: UpdateOrderData): Promise<WriteResult> {
  try {
    const orderRef = doc(db, COLLECTION_NAME, orderId);
    await updateDoc(orderRef, {
      ...data,
      updatedAt: Timestamp.now(),
    });
    return { success: true, id: orderId };
  } catch (error) {
    console.error('Error updating order:', error);
    return { success: false, error: error as Error };
  }
}

/**
 * Obtener pedidos por estado
 */
export async function getOrdersByStatus(status: OrderStatus): Promise<QueryResult<Order>> {
  try {
    const ordersRef = collection(db, COLLECTION_NAME);
    const q = query(ordersRef, where('status', '==', status), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);

    const orders: Order[] = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      // Asegurar que el ID del documento tenga prioridad sobre cualquier campo 'id' en los datos
      return {
        ...data,
        id: doc.id, // El ID del documento siempre tiene prioridad
      } as Order;
    });

    return { data: orders };
  } catch (error) {
    console.error('Error getting orders by status:', error);
    return { data: [], error: error as Error };
  }
}

/**
 * Obtener todos los pedidos (admin)
 */
export async function getAllOrders(): Promise<QueryResult<Order>> {
  try {
    const ordersRef = collection(db, COLLECTION_NAME);
    const q = query(ordersRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);

    const orders: Order[] = querySnapshot.docs.map((doc) => {
      const data = doc.data();
      // Asegurar que el ID del documento tenga prioridad sobre cualquier campo 'id' en los datos
      return {
        ...data,
        id: doc.id, // El ID del documento siempre tiene prioridad
      } as Order;
    });

    return { data: orders };
  } catch (error) {
    console.error('Error getting all orders:', error);
    return { data: [], error: error as Error };
  }
}

