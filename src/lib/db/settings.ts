/**
 * Funciones para gestionar configuraciones de usuario en Firestore
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
  UserSettings,
  UpdateUserSettingsData,
  SingleResult,
  WriteResult,
} from './types';

const COLLECTION_NAME = 'settings';

/**
 * Obtener las configuraciones de un usuario
 */
export async function getUserSettings(
  userId: string
): Promise<SingleResult<UserSettings>> {
  try {
    const settingsRef = doc(db, COLLECTION_NAME, userId);
    const settingsSnap = await getDoc(settingsRef);

    if (!settingsSnap.exists()) {
      // Crear configuraciones por defecto si no existen
      const defaultSettings = await createDefaultSettings(userId);
      if (defaultSettings.success) {
        // Recargar después de crear
        const newSettingsSnap = await getDoc(settingsRef);
        if (newSettingsSnap.exists()) {
          return {
            data: {
              id: newSettingsSnap.id,
              ...newSettingsSnap.data(),
            } as UserSettings,
          };
        }
      }
      return { data: null };
    }

    const settings = {
      id: settingsSnap.id,
      ...settingsSnap.data(),
    } as UserSettings;

    return { data: settings };
  } catch (error) {
    console.error('Error getting user settings:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Crear configuraciones por defecto para un usuario
 */
export async function createDefaultSettings(
  userId: string
): Promise<WriteResult> {
  try {
    const settingsRef = doc(db, COLLECTION_NAME, userId);
    const defaultSettings: UserSettings = {
      id: userId,
      userId,
      notifications: {
        email: true,
        push: true,
        orders: true,
      },
      preferences: {
        language: 'es',
        timezone: 'America/Mexico_City',
        theme: 'system',
      },
      communication: {
        newsletter: false,
        promotions: true,
      },
      privacy: {
        publicProfile: false,
        shareData: false,
      },
      updatedAt: Timestamp.now(),
    };

    await setDoc(settingsRef, defaultSettings);
    return { success: true, id: userId };
  } catch (error) {
    console.error('Error creating default settings:', error);
    return { success: false, error: error as Error };
  }
}

/**
 * Actualizar las configuraciones de un usuario
 */
export async function updateUserSettings(
  userId: string,
  data: UpdateUserSettingsData
): Promise<WriteResult> {
  try {
    const settingsRef = doc(db, COLLECTION_NAME, userId);
    const settingsSnap = await getDoc(settingsRef);

    if (!settingsSnap.exists()) {
      // Crear configuraciones por defecto si no existen
      await createDefaultSettings(userId);
    }

    // Construir objeto de actualización
    const updateData: any = {
      updatedAt: Timestamp.now(),
    };

    if (data.notifications) {
      updateData['notifications.email'] = data.notifications.email;
      updateData['notifications.push'] = data.notifications.push;
      updateData['notifications.orders'] = data.notifications.orders;
    }

    if (data.preferences) {
      if (data.preferences.language !== undefined) {
        updateData['preferences.language'] = data.preferences.language;
      }
      if (data.preferences.timezone !== undefined) {
        updateData['preferences.timezone'] = data.preferences.timezone;
      }
      if (data.preferences.theme !== undefined) {
        updateData['preferences.theme'] = data.preferences.theme;
      }
    }

    if (data.communication) {
      if (data.communication.newsletter !== undefined) {
        updateData['communication.newsletter'] = data.communication.newsletter;
      }
      if (data.communication.promotions !== undefined) {
        updateData['communication.promotions'] = data.communication.promotions;
      }
    }

    if (data.privacy) {
      if (data.privacy.publicProfile !== undefined) {
        updateData['privacy.publicProfile'] = data.privacy.publicProfile;
      }
      if (data.privacy.shareData !== undefined) {
        updateData['privacy.shareData'] = data.privacy.shareData;
      }
    }

    // Firebase requiere actualizar objetos anidados de manera diferente
    // Necesitamos obtener el documento actual y hacer merge
    const currentSettings = settingsSnap.data() as UserSettings;
    const mergedSettings: UserSettings = {
      ...currentSettings,
      notifications: {
        ...currentSettings.notifications,
        ...data.notifications,
      },
      preferences: {
        ...currentSettings.preferences,
        ...data.preferences,
      },
      communication: {
        ...currentSettings.communication,
        ...data.communication,
      },
      privacy: {
        ...currentSettings.privacy,
        ...data.privacy,
      },
      updatedAt: Timestamp.now(),
    };

    await setDoc(settingsRef, mergedSettings, { merge: true });

    return { success: true, id: userId };
  } catch (error) {
    console.error('Error updating user settings:', error);
    return { success: false, error: error as Error };
  }
}

