/**
 * Funciones para gestionar devoluciones en Firestore
 * Todas las funciones funcionan client-side
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import type {
  Return,
  CreateReturnData,
  UpdateReturnData,
  ReturnStatus,
  SingleResult,
  QueryResult,
  WriteResult,
  ReturnTimelineItem,
} from './types';
import { getOrderById } from './orders';
import { getProductById } from './products';

const COLLECTION_NAME = 'returns';

/**
 * Crear una nueva devolución
 */
export async function createReturn(data: CreateReturnData): Promise<WriteResult> {
  try {
    // Obtener información del pedido y producto
    const orderResult = await getOrderById(data.orderId);
    if (!orderResult.data) {
      return { success: false, error: new Error('Pedido no encontrado') };
    }

    const order = orderResult.data;
    const orderItem = order.items.find((item: any) => item.productId === data.productId);
    if (!orderItem) {
      return { success: false, error: new Error('Item del pedido no encontrado') };
    }

    const productResult = await getProductById(data.productId);
    const product = productResult.data;

    const now = Timestamp.now();
    const initialTimeline: ReturnTimelineItem[] = [
      {
        date: new Intl.DateTimeFormat('es-ES', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }).format(now.toDate()),
        time: new Intl.DateTimeFormat('es-ES', {
          hour: '2-digit',
          minute: '2-digit'
        }).format(now.toDate()),
        status: 'Solicitud creada',
        completed: true
      },
      {
        date: '',
        time: '',
        status: 'En revisión',
        completed: false
      }
    ];

    const returnData: Return = {
      id: '', // Se asignará después
      userId: data.userId,
      orderId: data.orderId,
      orderItemId: data.orderItemId,
      productId: data.productId,
      productName: orderItem.productName || product?.name || 'Producto',
      productImage: orderItem.productImage || product?.image || '',
      quantity: orderItem.quantity || 1,
      reason: data.reason,
      description: data.description,
      status: 'pending',
      refundAmount: orderItem.subtotal || 0,
      refundMethod: order.paymentMethod?.type === 'card' ? 'card' : 'transfer',
      shippingAddress: data.shippingAddress,
      timeline: initialTimeline,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), returnData);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating return:', error);
    return { success: false, error: error as Error };
  }
}

/**
 * Obtener todas las devoluciones de un usuario
 */
export async function getUserReturns(userId: string): Promise<QueryResult<Return>> {
  try {
    const returnsRef = collection(db, COLLECTION_NAME);
    const q = query(
      returnsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);

    const returns: Return[] = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Return[];

    return { data: returns };
  } catch (error) {
    console.error('Error getting user returns:', error);
    return { data: [], error: error as Error };
  }
}

/**
 * Obtener una devolución por ID
 */
export async function getReturnById(returnId: string): Promise<SingleResult<Return>> {
  try {
    const returnRef = doc(db, COLLECTION_NAME, returnId);
    const returnSnap = await getDoc(returnRef);

    if (!returnSnap.exists()) {
      return { data: null };
    }

    const returnData = {
      id: returnSnap.id,
      ...returnSnap.data(),
    } as Return;

    return { data: returnData };
  } catch (error) {
    console.error('Error getting return:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Actualizar el estado de una devolución
 */
export async function updateReturnStatus(
  returnId: string,
  status: ReturnStatus
): Promise<WriteResult> {
  try {
    const returnRef = doc(db, COLLECTION_NAME, returnId);
    const returnSnap = await getDoc(returnRef);

    if (!returnSnap.exists()) {
      return { success: false, error: new Error('Devolución no encontrada') };
    }

    const currentReturn = returnSnap.data() as Return;
    const now = Timestamp.now();
    
    // Actualizar timeline
    const updatedTimeline = [...(currentReturn.timeline || [])];
    const statusMap: Record<ReturnStatus, string> = {
      'pending': 'En revisión',
      'approved': 'Aprobada',
      'rejected': 'Rechazada',
      'processing': 'Procesando',
      'completed': 'Reembolso procesado',
      'cancelled': 'Cancelada'
    };

    // Marcar el paso anterior como completado si existe
    const lastIncompleteIndex = updatedTimeline.findIndex(item => !item.completed);
    if (lastIncompleteIndex !== -1) {
      updatedTimeline[lastIncompleteIndex] = {
        ...updatedTimeline[lastIncompleteIndex],
        date: new Intl.DateTimeFormat('es-ES', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }).format(now.toDate()),
        time: new Intl.DateTimeFormat('es-ES', {
          hour: '2-digit',
          minute: '2-digit'
        }).format(now.toDate()),
        status: statusMap[status] || status,
        completed: true
      };
    }

    // Agregar nuevo paso si no es el último estado
    if (status !== 'completed' && status !== 'rejected' && status !== 'cancelled') {
      const nextStatusMap: Record<ReturnStatus, string> = {
        'pending': 'En revisión',
        'approved': 'Aprobación pendiente',
        'processing': 'Reembolso procesado',
        'cancelled': 'Cancelada',
        'rejected': 'Rechazada',
        'completed': 'Reembolso procesado'
      };
      
      updatedTimeline.push({
        date: '',
        time: '',
        status: nextStatusMap[status] || 'Pendiente',
        completed: false
      });
    }

    await updateDoc(returnRef, {
      status,
      timeline: updatedTimeline,
      updatedAt: now,
    });

    return { success: true, id: returnId };
  } catch (error) {
    console.error('Error updating return status:', error);
    return { success: false, error: error as Error };
  }
}

/**
 * Actualizar una devolución (campos generales)
 */
export async function updateReturn(
  returnId: string,
  data: UpdateReturnData
): Promise<WriteResult> {
  try {
    const returnRef = doc(db, COLLECTION_NAME, returnId);
    await updateDoc(returnRef, {
      ...data,
      updatedAt: Timestamp.now(),
    });
    return { success: true, id: returnId };
  } catch (error) {
    console.error('Error updating return:', error);
    return { success: false, error: error as Error };
  }
}

/**
 * Obtener devoluciones por estado
 */
export async function getReturnsByStatus(
  status: ReturnStatus
): Promise<QueryResult<Return>> {
  try {
    const returnsRef = collection(db, COLLECTION_NAME);
    const q = query(
      returnsRef,
      where('status', '==', status),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);

    const returns: Return[] = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Return[];

    return { data: returns };
  } catch (error) {
    console.error('Error getting returns by status:', error);
    return { data: [], error: error as Error };
  }
}

/**
 * Obtener todas las devoluciones (admin)
 */
export async function getAllReturns(): Promise<QueryResult<Return>> {
  try {
    const returnsRef = collection(db, COLLECTION_NAME);
    const q = query(returnsRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);

    const returns: Return[] = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Return[];

    return { data: returns };
  } catch (error) {
    console.error('Error getting all returns:', error);
    return { data: [], error: error as Error };
  }
}

/**
 * Eliminar una devolución
 */
export async function deleteReturn(returnId: string): Promise<WriteResult> {
  try {
    const returnRef = doc(db, COLLECTION_NAME, returnId);
    await deleteDoc(returnRef);
    return { success: true, id: returnId };
  } catch (error) {
    console.error('Error deleting return:', error);
    return { success: false, error: error as Error };
  }
}

