/**
 * Funciones para gestionar favoritos en Firestore
 * Todas las funciones funcionan client-side
 */

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import type {
  Favorite,
  SingleResult,
  WriteResult,
} from './types';

const COLLECTION_NAME = 'favorites';

/**
 * Obtener los favoritos de un usuario
 */
export async function getUserFavorites(userId: string): Promise<SingleResult<Favorite>> {
  try {
    const favoriteRef = doc(db, COLLECTION_NAME, userId);
    const favoriteSnap = await getDoc(favoriteRef);

    if (!favoriteSnap.exists()) {
      // Si no existe, crear uno vacío
      const newFavorite: Favorite = {
        id: userId,
        userId,
        productIds: [],
        updatedAt: Timestamp.now(),
      };
      await setDoc(favoriteRef, newFavorite);
      return { data: newFavorite };
    }

    const favorite = {
      id: favoriteSnap.id,
      ...favoriteSnap.data(),
    } as Favorite;

    return { data: favorite };
  } catch (error) {
    console.error('Error getting user favorites:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Agregar un producto a favoritos
 */
export async function addToFavorites(userId: string, productId: string): Promise<WriteResult> {
  try {
    const favoriteRef = doc(db, COLLECTION_NAME, userId);
    const favoriteSnap = await getDoc(favoriteRef);

    if (favoriteSnap.exists()) {
      const favorite = favoriteSnap.data() as Favorite;
      // Verificar si ya está en favoritos
      if (favorite.productIds.includes(productId)) {
        return { success: true, id: userId }; // Ya está en favoritos
      }

      // Agregar el producto
      await updateDoc(favoriteRef, {
        productIds: [...favorite.productIds, productId],
        updatedAt: Timestamp.now(),
      });
    } else {
      // Crear nuevo documento de favoritos
      const newFavorite: Favorite = {
        id: userId,
        userId,
        productIds: [productId],
        updatedAt: Timestamp.now(),
      };
      await setDoc(favoriteRef, newFavorite);
    }

    return { success: true, id: userId };
  } catch (error) {
    console.error('Error adding to favorites:', error);
    return { success: false, error: error as Error };
  }
}

/**
 * Quitar un producto de favoritos
 */
export async function removeFromFavorites(userId: string, productId: string): Promise<WriteResult> {
  try {
    const favoriteRef = doc(db, COLLECTION_NAME, userId);
    const favoriteSnap = await getDoc(favoriteRef);

    if (!favoriteSnap.exists()) {
      return { success: true, id: userId }; // No hay favoritos, nada que quitar
    }

    const favorite = favoriteSnap.data() as Favorite;
    const updatedProductIds = favorite.productIds.filter((id) => id !== productId);

    await updateDoc(favoriteRef, {
      productIds: updatedProductIds,
      updatedAt: Timestamp.now(),
    });

    return { success: true, id: userId };
  } catch (error) {
    console.error('Error removing from favorites:', error);
    return { success: false, error: error as Error };
  }
}

/**
 * Verificar si un producto está en favoritos
 */
export async function isFavorite(userId: string, productId: string): Promise<boolean> {
  try {
    const favoriteRef = doc(db, COLLECTION_NAME, userId);
    const favoriteSnap = await getDoc(favoriteRef);

    if (!favoriteSnap.exists()) {
      return false;
    }

    const favorite = favoriteSnap.data() as Favorite;
    return favorite.productIds.includes(productId);
  } catch (error) {
    console.error('Error checking favorite:', error);
    return false;
  }
}

/**
 * Limpiar todos los favoritos de un usuario
 */
export async function clearFavorites(userId: string): Promise<WriteResult> {
  try {
    const favoriteRef = doc(db, COLLECTION_NAME, userId);
    await updateDoc(favoriteRef, {
      productIds: [],
      updatedAt: Timestamp.now(),
    });
    return { success: true, id: userId };
  } catch (error) {
    console.error('Error clearing favorites:', error);
    return { success: false, error: error as Error };
  }
}

