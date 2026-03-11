/**
 * Configuración de la tienda: envíos, descuentos, mensajes dinámicos
 * Un solo documento en Firestore: storeSettings/delivery
 */

import { doc, getDoc, setDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import type {
  DeliverySettings,
  UpdateDeliverySettingsData,
  SingleResult,
  WriteResult,
} from './types';

const COLLECTION_NAME = 'storeSettings';
const DELIVERY_DOC_ID = 'delivery';

const DEFAULT_DELIVERY_SETTINGS: Omit<DeliverySettings, 'id' | 'updatedAt'> = {
  minPurchaseAmount: 200,
  coverageRadiusKm: 5,
  freeDeliveryEnabled: true,
  messageTeFaltan: 'Te faltan {amount} Bs para envío gratis',
  messageFueraCobertura: 'Tu dirección está fuera de nuestra zona de cobertura.',
  messageEnvioGratis: '¡Felicidades! Tienes envío gratis',
};

/**
 * Obtener la configuración de envíos y descuentos
 */
export async function getDeliverySettings(): Promise<
  SingleResult<DeliverySettings>
> {
  try {
    if (!db) return { data: null, error: new Error('Firestore no inicializado') };
    const ref = doc(db, COLLECTION_NAME, DELIVERY_DOC_ID);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      const defaults: DeliverySettings = {
        id: DELIVERY_DOC_ID,
        ...DEFAULT_DELIVERY_SETTINGS,
        updatedAt: Timestamp.now(),
      };
      return { data: defaults };
    }

    const data = {
      id: snap.id,
      ...snap.data(),
      updatedAt: snap.data().updatedAt ?? null,
    } as DeliverySettings;
    return { data };
  } catch (error) {
    console.error('Error getting delivery settings:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Actualizar la configuración de envíos (parcial)
 */
export async function updateDeliverySettings(
  data: UpdateDeliverySettingsData
): Promise<WriteResult> {
  try {
    if (!db) return { success: false, error: new Error('Firestore no inicializado') };
    const ref = doc(db, COLLECTION_NAME, DELIVERY_DOC_ID);
    const now = Timestamp.now();

    const snap = await getDoc(ref);
    const current = snap.exists()
      ? { ...snap.data(), updatedAt: now }
      : { id: DELIVERY_DOC_ID, ...DEFAULT_DELIVERY_SETTINGS, updatedAt: now };

    const updated = { ...current, ...data, updatedAt: now };
    await setDoc(ref, updated);

    return { success: true, id: DELIVERY_DOC_ID };
  } catch (error) {
    console.error('Error updating delivery settings:', error);
    return { success: false, error: error as Error };
  }
}

/**
 * Eliminar la configuración de envíos (el documento). La próxima lectura devolverá valores por defecto.
 */
export async function deleteDeliverySettings(): Promise<WriteResult> {
  try {
    if (!db) return { success: false, error: new Error('Firestore no inicializado') };
    const ref = doc(db, COLLECTION_NAME, DELIVERY_DOC_ID);
    await deleteDoc(ref);
    return { success: true, id: DELIVERY_DOC_ID };
  } catch (error) {
    console.error('Error deleting delivery settings:', error);
    return { success: false, error: error as Error };
  }
}
