/**
 * Funciones para gestionar calificaciones (ratings/reviews) en Firestore
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
  Rating,
  CreateRatingData,
  UpdateRatingData,
  SingleResult,
  QueryResult,
  WriteResult,
} from './types';

const COLLECTION_NAME = 'ratings';

/**
 * Crear una nueva calificación
 */
export async function createRating(data: CreateRatingData): Promise<WriteResult> {
  try {
    // Validar que el rating esté entre 1 y 5
    if (data.rating < 1 || data.rating > 5) {
      return { success: false, error: new Error('El rating debe estar entre 1 y 5') };
    }

    // Validar que el usuario no haya calificado este producto antes
    const existingRatings = await getProductRatings(data.productId);
    if (existingRatings.data) {
      const userRating = existingRatings.data.find(
        (rating) => rating.userId === data.userId && rating.productId === data.productId
      );
      if (userRating) {
        return { 
          success: false, 
          error: new Error('Ya has calificado este producto. Puedes actualizar tu calificación existente.') 
        };
      }
    }

    const now = Timestamp.now();
    const ratingData: Rating = {
      id: '', // Se asignará después
      userId: data.userId,
      orderId: data.orderId,
      productId: data.productId,
      rating: data.rating,
      comment: data.comment || '',
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), ratingData);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating rating:', error);
    return { success: false, error: error as Error };
  }
}

/**
 * Obtener todas las calificaciones de un pedido
 */
export async function getOrderRatings(orderId: string): Promise<QueryResult<Rating>> {
  try {
    const ratingsRef = collection(db, COLLECTION_NAME);
    const q = query(
      ratingsRef,
      where('orderId', '==', orderId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);

    const ratings: Rating[] = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Rating[];

    return { data: ratings };
  } catch (error) {
    console.error('Error getting order ratings:', error);
    return { data: [], error: error as Error };
  }
}

/**
 * Obtener todas las calificaciones de un producto
 */
export async function getProductRatings(productId: string): Promise<QueryResult<Rating>> {
  try {
    const ratingsRef = collection(db, COLLECTION_NAME);
    const q = query(
      ratingsRef,
      where('productId', '==', productId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);

    const ratings: Rating[] = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Rating[];

    return { data: ratings };
  } catch (error) {
    console.error('Error getting product ratings:', error);
    return { data: [], error: error as Error };
  }
}

/**
 * Obtener una calificación por ID
 */
export async function getRatingById(ratingId: string): Promise<SingleResult<Rating>> {
  try {
    const ratingRef = doc(db, COLLECTION_NAME, ratingId);
    const ratingSnap = await getDoc(ratingRef);

    if (!ratingSnap.exists()) {
      return { data: null };
    }

    const rating = {
      id: ratingSnap.id,
      ...ratingSnap.data(),
    } as Rating;

    return { data: rating };
  } catch (error) {
    console.error('Error getting rating:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Actualizar una calificación
 */
export async function updateRating(ratingId: string, data: UpdateRatingData): Promise<WriteResult> {
  try {
    // Validar que el rating esté entre 1 y 5 si se proporciona
    if (data.rating !== undefined && (data.rating < 1 || data.rating > 5)) {
      return { success: false, error: new Error('El rating debe estar entre 1 y 5') };
    }

    const ratingRef = doc(db, COLLECTION_NAME, ratingId);
    await updateDoc(ratingRef, {
      ...data,
      updatedAt: Timestamp.now(),
    });
    return { success: true, id: ratingId };
  } catch (error) {
    console.error('Error updating rating:', error);
    return { success: false, error: error as Error };
  }
}

/**
 * Obtener calificaciones de un usuario
 */
export async function getUserRatings(userId: string): Promise<QueryResult<Rating>> {
  try {
    const ratingsRef = collection(db, COLLECTION_NAME);
    const q = query(
      ratingsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);

    const ratings: Rating[] = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Rating[];

    return { data: ratings };
  } catch (error) {
    console.error('Error getting user ratings:', error);
    return { data: [], error: error as Error };
  }
}

/**
 * Verificar si un usuario ya calificó un pedido
 */
export async function hasUserRatedOrder(userId: string, orderId: string): Promise<boolean> {
  try {
    const ratingsRef = collection(db, COLLECTION_NAME);
    const q = query(
      ratingsRef,
      where('userId', '==', userId),
      where('orderId', '==', orderId)
    );
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking if user rated order:', error);
    return false;
  }
}

