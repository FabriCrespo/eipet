/**
 * Funciones para gestionar historial de productos vistos en Firestore
 * Todas las funciones funcionan client-side
 */

import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import type {
  ViewHistory,
  ViewHistoryItem,
  SingleResult,
  QueryResult,
  WriteResult,
} from './types';

const COLLECTION_NAME = 'viewHistory';
const MAX_HISTORY_ITEMS = 50; // Límite de items en el historial

/**
 * Agregar un producto al historial de visualizaciones
 */
export async function addToViewHistory(
  userId: string,
  productId: string
): Promise<WriteResult> {
  try {
    const historyRef = doc(db, COLLECTION_NAME, userId);
    const historySnap = await getDoc(historyRef);
    const now = Timestamp.now();

    if (historySnap.exists()) {
      const currentHistory = historySnap.data() as ViewHistory;
      let items = currentHistory.items || [];

      // Remover el producto si ya existe (para evitar duplicados)
      items = items.filter((item) => item.productId !== productId);

      // Agregar el nuevo item al inicio
      items.unshift({
        productId,
        viewedAt: now,
      });

      // Limitar el número de items
      if (items.length > MAX_HISTORY_ITEMS) {
        items = items.slice(0, MAX_HISTORY_ITEMS);
      }

      await updateDoc(historyRef, {
        items,
        updatedAt: now,
      });
    } else {
      // Crear nuevo historial
      const newHistory: ViewHistory = {
        id: userId,
        userId,
        items: [
          {
            productId,
            viewedAt: now,
          },
        ],
        updatedAt: now,
      };

      await setDoc(historyRef, newHistory);
    }

    return { success: true, id: userId };
  } catch (error) {
    console.error('Error adding to view history:', error);
    return { success: false, error: error as Error };
  }
}

/**
 * Obtener el historial de visualizaciones de un usuario
 */
export async function getViewHistory(
  userId: string,
  limit?: number
): Promise<QueryResult<ViewHistoryItem>> {
  try {
    const historyRef = doc(db, COLLECTION_NAME, userId);
    const historySnap = await getDoc(historyRef);

    if (!historySnap.exists()) {
      return { data: [] };
    }

    const history = historySnap.data() as ViewHistory;
    let items = history.items || [];

    // Ordenar por fecha más reciente
    items.sort((a, b) => {
      const dateA = a.viewedAt?.toDate ? a.viewedAt.toDate() : new Date(a.viewedAt || 0);
      const dateB = b.viewedAt?.toDate ? b.viewedAt.toDate() : new Date(b.viewedAt || 0);
      return dateB.getTime() - dateA.getTime();
    });

    // Aplicar límite si se especifica
    if (limit && limit > 0) {
      items = items.slice(0, limit);
    }

    return { data: items };
  } catch (error) {
    console.error('Error getting view history:', error);
    return { data: [], error: error as Error };
  }
}

/**
 * Eliminar un producto del historial
 */
export async function removeFromViewHistory(
  userId: string,
  productId: string
): Promise<WriteResult> {
  try {
    const historyRef = doc(db, COLLECTION_NAME, userId);
    const historySnap = await getDoc(historyRef);

    if (!historySnap.exists()) {
      return { success: false, error: new Error('Historial no encontrado') };
    }

    const history = historySnap.data() as ViewHistory;
    const items = (history.items || []).filter(
      (item) => item.productId !== productId
    );

    await updateDoc(historyRef, {
      items,
      updatedAt: Timestamp.now(),
    });

    return { success: true, id: userId };
  } catch (error) {
    console.error('Error removing from view history:', error);
    return { success: false, error: error as Error };
  }
}

/**
 * Limpiar todo el historial de visualizaciones
 */
export async function clearViewHistory(userId: string): Promise<WriteResult> {
  try {
    const historyRef = doc(db, COLLECTION_NAME, userId);
    await updateDoc(historyRef, {
      items: [],
      updatedAt: Timestamp.now(),
    });

    return { success: true, id: userId };
  } catch (error) {
    console.error('Error clearing view history:', error);
    return { success: false, error: error as Error };
  }
}

/**
 * Obtener el historial completo (incluyendo metadatos)
 */
export async function getViewHistoryFull(
  userId: string
): Promise<SingleResult<ViewHistory>> {
  try {
    const historyRef = doc(db, COLLECTION_NAME, userId);
    const historySnap = await getDoc(historyRef);

    if (!historySnap.exists()) {
      return { data: null };
    }

    const history = {
      id: historySnap.id,
      ...historySnap.data(),
    } as ViewHistory;

    return { data: history };
  } catch (error) {
    console.error('Error getting view history full:', error);
    return { data: null, error: error as Error };
  }
}

