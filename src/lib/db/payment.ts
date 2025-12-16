/**
 * Funciones para gestionar métodos de pago en Firestore
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
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import type {
  PaymentMethod,
  CreatePaymentMethodData,
  UpdatePaymentMethodData,
  SingleResult,
  QueryResult,
  WriteResult,
} from './types';

const USERS_COLLECTION = 'users';
const PAYMENT_METHODS_SUBCOLLECTION = 'paymentMethods';

/**
 * Obtener todos los métodos de pago de un usuario
 */
export async function getPaymentMethods(userId: string): Promise<QueryResult<PaymentMethod>> {
  try {
    const paymentMethodsRef = collection(db, USERS_COLLECTION, userId, PAYMENT_METHODS_SUBCOLLECTION);
    const querySnapshot = await getDocs(paymentMethodsRef);

    const paymentMethods: PaymentMethod[] = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as PaymentMethod[];

    return { data: paymentMethods };
  } catch (error) {
    console.error('Error getting payment methods:', error);
    return { data: [], error: error as Error };
  }
}

/**
 * Obtener un método de pago específico
 */
export async function getPaymentMethod(
  userId: string,
  methodId: string
): Promise<SingleResult<PaymentMethod>> {
  try {
    const paymentMethodRef = doc(
      db,
      USERS_COLLECTION,
      userId,
      PAYMENT_METHODS_SUBCOLLECTION,
      methodId
    );
    const paymentMethodSnap = await getDoc(paymentMethodRef);

    if (!paymentMethodSnap.exists()) {
      return { data: null };
    }

    const paymentMethod = {
      id: paymentMethodSnap.id,
      ...paymentMethodSnap.data(),
    } as PaymentMethod;

    return { data: paymentMethod };
  } catch (error) {
    console.error('Error getting payment method:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Agregar un método de pago a un usuario
 */
export async function addPaymentMethod(
  userId: string,
  data: CreatePaymentMethodData
): Promise<WriteResult> {
  try {
    const now = Timestamp.now();
    const paymentMethodData = {
      ...data,
      isDefault: data.isDefault || false,
      createdAt: now,
      updatedAt: now,
    };

    // Si este método es por defecto, quitar el flag de los demás
    if (paymentMethodData.isDefault) {
      await unsetDefaultPaymentMethods(userId);
    }

    const paymentMethodsRef = collection(db, USERS_COLLECTION, userId, PAYMENT_METHODS_SUBCOLLECTION);
    const docRef = await addDoc(paymentMethodsRef, paymentMethodData);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error adding payment method:', error);
    return { success: false, error: error as Error };
  }
}

/**
 * Actualizar un método de pago
 */
export async function updatePaymentMethod(
  userId: string,
  methodId: string,
  data: UpdatePaymentMethodData
): Promise<WriteResult> {
  try {
    const paymentMethodRef = doc(
      db,
      USERS_COLLECTION,
      userId,
      PAYMENT_METHODS_SUBCOLLECTION,
      methodId
    );

    // Si este método se marca como por defecto, quitar el flag de los demás
    if (data.isDefault === true) {
      await unsetDefaultPaymentMethods(userId);
    }

    await updateDoc(paymentMethodRef, {
      ...data,
      updatedAt: Timestamp.now(),
    });
    return { success: true, id: methodId };
  } catch (error) {
    console.error('Error updating payment method:', error);
    return { success: false, error: error as Error };
  }
}

/**
 * Eliminar un método de pago
 */
export async function deletePaymentMethod(userId: string, methodId: string): Promise<WriteResult> {
  try {
    const paymentMethodRef = doc(
      db,
      USERS_COLLECTION,
      userId,
      PAYMENT_METHODS_SUBCOLLECTION,
      methodId
    );
    await deleteDoc(paymentMethodRef);
    return { success: true, id: methodId };
  } catch (error) {
    console.error('Error deleting payment method:', error);
    return { success: false, error: error as Error };
  }
}

/**
 * Establecer un método de pago como predeterminado
 */
export async function setDefaultPaymentMethod(
  userId: string,
  methodId: string
): Promise<WriteResult> {
  try {
    // Primero quitar el flag de todos los métodos
    await unsetDefaultPaymentMethods(userId);

    // Luego establecer este como predeterminado
    const paymentMethodRef = doc(
      db,
      USERS_COLLECTION,
      userId,
      PAYMENT_METHODS_SUBCOLLECTION,
      methodId
    );
    await updateDoc(paymentMethodRef, {
      isDefault: true,
      updatedAt: Timestamp.now(),
    });
    return { success: true, id: methodId };
  } catch (error) {
    console.error('Error setting default payment method:', error);
    return { success: false, error: error as Error };
  }
}

/**
 * Obtener el método de pago predeterminado de un usuario
 */
export async function getDefaultPaymentMethod(
  userId: string
): Promise<SingleResult<PaymentMethod>> {
  try {
    const paymentMethodsRef = collection(db, USERS_COLLECTION, userId, PAYMENT_METHODS_SUBCOLLECTION);
    const q = query(paymentMethodsRef, where('isDefault', '==', true));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return { data: null };
    }

    const paymentMethodDoc = querySnapshot.docs[0];
    const paymentMethod = {
      id: paymentMethodDoc.id,
      ...paymentMethodDoc.data(),
    } as PaymentMethod;

    return { data: paymentMethod };
  } catch (error) {
    console.error('Error getting default payment method:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Función auxiliar: Quitar el flag isDefault de todos los métodos de pago de un usuario
 */
async function unsetDefaultPaymentMethods(userId: string): Promise<void> {
  try {
    const paymentMethodsResult = await getPaymentMethods(userId);
    if (paymentMethodsResult.data.length === 0) return;

    const updatePromises = paymentMethodsResult.data
      .filter((method) => method.isDefault)
      .map((method) => {
        const paymentMethodRef = doc(
          db,
          USERS_COLLECTION,
          userId,
          PAYMENT_METHODS_SUBCOLLECTION,
          method.id
        );
        return updateDoc(paymentMethodRef, {
          isDefault: false,
          updatedAt: Timestamp.now(),
        });
      });

    await Promise.all(updatePromises);
  } catch (error) {
    console.error('Error unsetting default payment methods:', error);
    throw error;
  }
}

