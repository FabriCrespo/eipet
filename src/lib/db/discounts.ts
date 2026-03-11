/**
 * CRUD de descuentos (cupones/promociones) en Firestore
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
  Discount,
  CreateDiscountData,
  UpdateDiscountData,
  QueryResult,
  SingleResult,
  WriteResult,
} from './types';

const COLLECTION_NAME = 'discounts';

function toFirestoreTimestamp(v: Date | import('firebase/firestore').Timestamp | null): import('firebase/firestore').Timestamp | null {
  if (!v) return null;
  if (v instanceof Timestamp) return v;
  if (v instanceof Date) return Timestamp.fromDate(v);
  return null;
}

/**
 * Obtener todos los descuentos (ordenados por creación, más recientes primero)
 */
export async function getDiscounts(): Promise<QueryResult<Discount>> {
  try {
    if (!db) return { data: [], error: new Error('Firestore no inicializado') };
    const ref = collection(db, COLLECTION_NAME);
    const q = query(ref, orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Discount));
    return { data };
  } catch (error) {
    console.error('Error getting discounts:', error);
    return { data: [], error: error as Error };
  }
}

/**
 * Obtener un descuento por ID
 */
export async function getDiscountById(id: string): Promise<SingleResult<Discount>> {
  try {
    if (!db) return { data: null, error: new Error('Firestore no inicializado') };
    const ref = doc(db, COLLECTION_NAME, id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return { data: null };
    return { data: { id: snap.id, ...snap.data() } as Discount };
  } catch (error) {
    console.error('Error getting discount:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Crear un descuento
 */
export async function createDiscount(data: CreateDiscountData): Promise<WriteResult> {
  try {
    if (!db) return { success: false, error: new Error('Firestore no inicializado') };
    const now = Timestamp.now();
    const docData = {
      name: data.name,
      type: data.type,
      targetId: data.targetId ?? null,
      discountValue: data.discountValue,
      discountType: data.discountType,
      startDate: toFirestoreTimestamp(data.startDate) ?? now,
      endDate: toFirestoreTimestamp(data.endDate) ?? now,
      isActive: data.isActive !== false,
      minPurchaseAmount: data.minPurchaseAmount ?? null,
      maxUses: data.maxUses ?? null,
      currentUses: 0,
      createdAt: now,
      updatedAt: now,
    };
    const ref = await addDoc(collection(db, COLLECTION_NAME), docData);
    return { success: true, id: ref.id };
  } catch (error) {
    console.error('Error creating discount:', error);
    return { success: false, error: error as Error };
  }
}

/**
 * Actualizar un descuento
 */
export async function updateDiscount(id: string, data: UpdateDiscountData): Promise<WriteResult> {
  try {
    if (!db) return { success: false, error: new Error('Firestore no inicializado') };
    const ref = doc(db, COLLECTION_NAME, id);
    const update: Record<string, unknown> = { updatedAt: Timestamp.now() };
    if (data.name !== undefined) update.name = data.name;
    if (data.type !== undefined) update.type = data.type;
    if (data.targetId !== undefined) update.targetId = data.targetId;
    if (data.discountValue !== undefined) update.discountValue = data.discountValue;
    if (data.discountType !== undefined) update.discountType = data.discountType;
    if (data.startDate !== undefined) update.startDate = toFirestoreTimestamp(data.startDate);
    if (data.endDate !== undefined) update.endDate = toFirestoreTimestamp(data.endDate);
    if (data.isActive !== undefined) update.isActive = data.isActive;
    if (data.minPurchaseAmount !== undefined) update.minPurchaseAmount = data.minPurchaseAmount;
    if (data.maxUses !== undefined) update.maxUses = data.maxUses;
    await updateDoc(ref, update);
    return { success: true, id };
  } catch (error) {
    console.error('Error updating discount:', error);
    return { success: false, error: error as Error };
  }
}

/**
 * Eliminar un descuento
 */
export async function deleteDiscount(id: string): Promise<WriteResult> {
  try {
    if (!db) return { success: false, error: new Error('Firestore no inicializado') };
    const ref = doc(db, COLLECTION_NAME, id);
    await deleteDoc(ref);
    return { success: true, id };
  } catch (error) {
    console.error('Error deleting discount:', error);
    return { success: false, error: error as Error };
  }
}
