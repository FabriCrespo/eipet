/**
 * CRUD de descuentos (cupones/promociones) en Firestore
 * Aplicación a productos: precio, originalPrice, discount según marcas o productos elegidos.
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
import { getProductById, getProducts, getProductsByBrandIds, updateProduct } from './products';

const COLLECTION_NAME = 'discounts';

function toFirestoreTimestamp(v: Date | import('firebase/firestore').Timestamp | null): import('firebase/firestore').Timestamp | null {
  if (!v) return null;
  if (v instanceof Timestamp) return v;
  if (v instanceof Date) return Timestamp.fromDate(v);
  return null;
}

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

function discountTimestampToDate(v: unknown): Date {
  if (v && typeof v === 'object' && 'toDate' in v && typeof (v as { toDate: () => Date }).toDate === 'function') {
    return (v as { toDate: () => Date }).toDate();
  }
  if (v instanceof Date) return v;
  return new Date(v as string);
}

function normalizeTargetIds(d: Discount): string[] {
  if (d.targetIds && d.targetIds.length > 0) return [...new Set(d.targetIds.filter(Boolean))];
  if (d.targetId) return [d.targetId];
  return [];
}

async function revertProductPromotionalPrice(productId: string): Promise<void> {
  const res = await getProductById(productId);
  if (!res.data) return;
  const p = res.data;
  const listPrice =
    p.originalPrice != null && (p.discount ?? 0) > 0 ? p.originalPrice : p.price;
  await updateProduct(productId, {
    price: listPrice,
    originalPrice: null,
    discount: 0,
    discountType: 'percentage',
    discountStartDate: null,
    discountEndDate: null,
    discountSourceId: null,
  });
}

async function applyPromotionToProduct(
  productId: string,
  d: Discount,
  discountDocId: string
): Promise<WriteResult> {
  const res = await getProductById(productId);
  if (!res.data) return { success: false, error: new Error(`Producto no encontrado: ${productId}`) };
  const p = res.data;
  const base = p.originalPrice != null && (p.discount ?? 0) > 0 ? p.originalPrice : p.price;

  let newPrice: number;
  let displayDiscount: number;

  if (d.discountType === 'percentage') {
    const pct = Math.min(100, Math.max(0, d.discountValue));
    newPrice = roundMoney(base * (1 - pct / 100));
    displayDiscount = pct;
  } else {
    newPrice = roundMoney(Math.max(0, base - d.discountValue));
    displayDiscount = base > 0 ? Math.round((1 - newPrice / base) * 100) : 0;
  }

  const start = discountTimestampToDate(d.startDate);
  const end = discountTimestampToDate(d.endDate);

  return updateProduct(productId, {
    price: newPrice,
    originalPrice: base,
    discount: displayDiscount,
    discountType: d.discountType,
    discountStartDate: start,
    discountEndDate: end,
    discountSourceId: discountDocId,
  });
}

/**
 * IDs de marca y producto para la página de ofertas (filter=discount).
 * Se persisten en el documento al aplicar la promoción a los precios.
 */
async function computeListingFields(
  d: Discount,
  appliedProductIds: string[]
): Promise<{ listingBrandIds: string[]; listingProductIds: string[] }> {
  const targets = normalizeTargetIds(d);
  const brandSet = new Set<string>();

  async function addBrandsFromProducts(ids: string[]) {
    for (const pid of ids) {
      const res = await getProductById(pid);
      if (res.data?.brand) brandSet.add(String(res.data.brand));
    }
  }

  if (d.type === 'brand') {
    targets.forEach((id) => brandSet.add(id));
    return {
      listingBrandIds: [...brandSet],
      listingProductIds: appliedProductIds.slice(),
    };
  }
  if (d.type === 'product') {
    await addBrandsFromProducts(targets);
    return {
      listingBrandIds: [...brandSet],
      listingProductIds: targets,
    };
  }
  if (d.type === 'global' || d.type === 'category') {
    await addBrandsFromProducts(appliedProductIds);
    return {
      listingBrandIds: [...brandSet],
      listingProductIds: appliedProductIds.slice(),
    };
  }
  return { listingBrandIds: [], listingProductIds: [] };
}

async function resolveProductIdsForDiscount(d: Discount): Promise<string[]> {
  const type = d.type;
  if (type === 'global') {
    const { data } = await getProducts({});
    return (data || []).map((p) => p.id);
  }
  if (type === 'brand') {
    const targetIds = normalizeTargetIds(d);
    if (targetIds.length === 0) return [];
    const { data } = await getProductsByBrandIds(targetIds);
    return (data || []).map((p) => p.id);
  }
  if (type === 'product') {
    return normalizeTargetIds(d);
  }
  if (type === 'category') {
    const cat = d.targetId || normalizeTargetIds(d)[0];
    if (!cat) return [];
    const { data } = await getProducts({ category: cat });
    return (data || []).map((p) => p.id);
  }
  return [];
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
    const data = snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() } as Discount));
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

function mergeTargetIds(data: CreateDiscountData | UpdateDiscountData): string[] | null {
  if ('targetIds' in data && data.targetIds != null && data.targetIds.length > 0) {
    return [...new Set(data.targetIds.filter(Boolean))];
  }
  if (data.targetId) return [data.targetId];
  return null;
}

/**
 * Crear un descuento
 */
export async function createDiscount(data: CreateDiscountData): Promise<WriteResult> {
  try {
    if (!db) return { success: false, error: new Error('Firestore no inicializado') };
    const now = Timestamp.now();
    const mergedTargets = mergeTargetIds(data);
    const docData = {
      name: data.name,
      type: data.type,
      targetId: data.targetId ?? (mergedTargets?.length === 1 ? mergedTargets[0] : null),
      targetIds: mergedTargets,
      discountValue: data.discountValue,
      discountType: data.discountType,
      startDate: toFirestoreTimestamp(data.startDate) ?? now,
      endDate: toFirestoreTimestamp(data.endDate) ?? now,
      isActive: data.isActive !== false,
      minPurchaseAmount: data.minPurchaseAmount ?? null,
      maxUses: data.maxUses ?? null,
      currentUses: 0,
      appliedProductIds: null,
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
    if (data.targetIds !== undefined) {
      update.targetIds = data.targetIds.length ? [...new Set(data.targetIds.filter(Boolean))] : null;
    }
    if (data.discountValue !== undefined) update.discountValue = data.discountValue;
    if (data.discountType !== undefined) update.discountType = data.discountType;
    if (data.startDate !== undefined) update.startDate = toFirestoreTimestamp(data.startDate);
    if (data.endDate !== undefined) update.endDate = toFirestoreTimestamp(data.endDate);
    if (data.isActive !== undefined) update.isActive = data.isActive;
    if (data.minPurchaseAmount !== undefined) update.minPurchaseAmount = data.minPurchaseAmount;
    if (data.maxUses !== undefined) update.maxUses = data.maxUses;
    if (data.appliedProductIds !== undefined) update.appliedProductIds = data.appliedProductIds;
    if (data.listingBrandIds !== undefined) {
      update.listingBrandIds = data.listingBrandIds?.length ? [...new Set(data.listingBrandIds.filter(Boolean))] : null;
    }
    if (data.listingProductIds !== undefined) {
      update.listingProductIds = data.listingProductIds?.length ? [...new Set(data.listingProductIds.filter(Boolean))] : null;
    }
    await updateDoc(ref, update);
    return { success: true, id };
  } catch (error) {
    console.error('Error updating discount:', error);
    return { success: false, error: error as Error };
  }
}

/**
 * Revierte precios en productos afectados por una promoción y borra el documento.
 */
export async function deleteDiscount(id: string): Promise<WriteResult> {
  try {
    if (!db) return { success: false, error: new Error('Firestore no inicializado') };
    const snap = await getDoc(doc(db, COLLECTION_NAME, id));
    if (snap.exists()) {
      const prev = snap.data() as Partial<Discount>;
      const applied = prev.appliedProductIds;
      if (applied && applied.length > 0) {
        for (const pid of applied) {
          await revertProductPromotionalPrice(pid);
        }
      }
    }
    const ref = doc(db, COLLECTION_NAME, id);
    await deleteDoc(ref);
    return { success: true, id };
  } catch (error) {
    console.error('Error deleting discount:', error);
    return { success: false, error: error as Error };
  }
}

/**
 * Aplica la promoción a los productos según type + targetIds (o global).
 * Primero revierte la aplicación anterior de esta misma promoción.
 */
export async function applyDiscountToProducts(discountId: string): Promise<WriteResult & { appliedCount?: number }> {
  try {
    if (!db) return { success: false, error: new Error('Firestore no inicializado') };
    const { data: d, error } = await getDiscountById(discountId);
    if (error) return { success: false, error };
    if (!d) return { success: false, error: new Error('Descuento no encontrado') };

    const newIds = await resolveProductIdsForDiscount(d);
    const uniqueIds = [...new Set(newIds)];

    const { listingBrandIds, listingProductIds } = await computeListingFields(d, uniqueIds);

    const previous = d.appliedProductIds || [];
    for (const pid of previous) {
      await revertProductPromotionalPrice(pid);
    }

    if (uniqueIds.length === 0) {
      await updateDoc(doc(db, COLLECTION_NAME, discountId), {
        appliedProductIds: null,
        listingBrandIds: listingBrandIds.length ? listingBrandIds : null,
        listingProductIds: listingProductIds.length ? listingProductIds : null,
        updatedAt: Timestamp.now(),
      });
      return {
        success: false,
        error: new Error(
          'No hay productos para aplicar. Elige marcas, productos o usa alcance global con productos en catálogo. Se guardaron igualmente los IDs de listado para la tienda.'
        ),
        appliedCount: 0,
      };
    }

    let ok = 0;
    for (const pid of uniqueIds) {
      const wr = await applyPromotionToProduct(pid, d, discountId);
      if (wr.success) ok++;
    }

    await updateDoc(doc(db, COLLECTION_NAME, discountId), {
      appliedProductIds: uniqueIds,
      listingBrandIds: listingBrandIds.length ? listingBrandIds : null,
      listingProductIds: listingProductIds.length ? listingProductIds : null,
      updatedAt: Timestamp.now(),
    });

    return { success: true, id: discountId, appliedCount: ok };
  } catch (error) {
    console.error('Error applyDiscountToProducts:', error);
    return { success: false, error: error as Error };
  }
}
