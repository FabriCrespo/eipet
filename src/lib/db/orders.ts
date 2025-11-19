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

const COLLECTION_NAME = 'orders';

/**
 * Crear un nuevo pedido
 */
export async function createOrder(data: CreateOrderData): Promise<WriteResult> {
  try {
    const now = Timestamp.now();
    const orderData: Order = {
      id: '', // Se asignará después
      userId: data.userId,
      status: 'pending',
      items: data.items,
      subtotal: data.subtotal,
      discount: data.discount || 0,
      total: data.subtotal - (data.discount || 0),
      shippingAddress: data.shippingAddress,
      paymentMethod: data.paymentMethod,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), orderData);
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

    const orders: Order[] = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Order[];

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

    const order = {
      id: orderSnap.id,
      ...orderSnap.data(),
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

    const orders: Order[] = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Order[];

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

    const orders: Order[] = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Order[];

    return { data: orders };
  } catch (error) {
    console.error('Error getting all orders:', error);
    return { data: [], error: error as Error };
  }
}

