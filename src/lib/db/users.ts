/**
 * Funciones para gestionar usuarios y direcciones en Firestore
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
  setDoc,
} from 'firebase/firestore';
import { db } from '../firebase';
import type {
  User,
  CreateUserData,
  UpdateUserData,
  UserAddress,
  CreateAddressData,
  UpdateAddressData,
  SingleResult,
  QueryResult,
  WriteResult,
} from './types';

const USERS_COLLECTION = 'users';
const ADDRESSES_SUBCOLLECTION = 'addresses';

// ============================================================================
// USUARIOS
// ============================================================================

/**
 * Obtener un usuario por ID
 */
export async function getUser(userId: string): Promise<SingleResult<User>> {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      return { data: null };
    }

    const user = {
      id: userSnap.id,
      ...userSnap.data(),
    } as User;

    return { data: user };
  } catch (error) {
    console.error('Error getting user:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Obtener un usuario por email
 */
export async function getUserByEmail(email: string): Promise<SingleResult<User>> {
  try {
    const usersRef = collection(db, USERS_COLLECTION);
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return { data: null };
    }

    const userDoc = querySnapshot.docs[0];
    const user = {
      id: userDoc.id,
      ...userDoc.data(),
    } as User;

    return { data: user };
  } catch (error) {
    console.error('Error getting user by email:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Crear un nuevo usuario
 */
export async function createUser(data: CreateUserData): Promise<WriteResult> {
  try {
    const now = Timestamp.now();
    const userData = {
      ...data,
      role: data.role || 'user',
      createdAt: now,
      updatedAt: now,
    };

    // Si no se proporciona ID, Firestore lo generará automáticamente
    const docRef = await addDoc(collection(db, USERS_COLLECTION), userData);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating user:', error);
    return { success: false, error: error as Error };
  }
}

/**
 * Crear usuario con ID específico (útil cuando el ID viene de Firebase Auth)
 */
export async function createUserWithId(userId: string, data: CreateUserData): Promise<WriteResult> {
  try {
    const now = Timestamp.now();
    const userData = {
      ...data,
      role: data.role || 'user',
      createdAt: now,
      updatedAt: now,
    };

    const userRef = doc(db, USERS_COLLECTION, userId);
    await setDoc(userRef, userData);
    return { success: true, id: userId };
  } catch (error) {
    console.error('Error creating user with ID:', error);
    return { success: false, error: error as Error };
  }
}

/**
 * Actualizar un usuario
 */
export async function updateUser(userId: string, data: UpdateUserData): Promise<WriteResult> {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(userRef, {
      ...data,
      updatedAt: Timestamp.now(),
    });
    return { success: true, id: userId };
  } catch (error) {
    console.error('Error updating user:', error);
    return { success: false, error: error as Error };
  }
}

// ============================================================================
// DIRECCIONES (Subcolección de users)
// ============================================================================

/**
 * Obtener todas las direcciones de un usuario
 */
export async function getUserAddresses(userId: string): Promise<QueryResult<UserAddress>> {
  try {
    const addressesRef = collection(db, USERS_COLLECTION, userId, ADDRESSES_SUBCOLLECTION);
    const querySnapshot = await getDocs(addressesRef);

    const addresses: UserAddress[] = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as UserAddress[];

    return { data: addresses };
  } catch (error) {
    console.error('Error getting user addresses:', error);
    return { data: [], error: error as Error };
  }
}

/**
 * Obtener una dirección específica de un usuario
 */
export async function getAddress(userId: string, addressId: string): Promise<SingleResult<UserAddress>> {
  try {
    const addressRef = doc(db, USERS_COLLECTION, userId, ADDRESSES_SUBCOLLECTION, addressId);
    const addressSnap = await getDoc(addressRef);

    if (!addressSnap.exists()) {
      return { data: null };
    }

    const address = {
      id: addressSnap.id,
      ...addressSnap.data(),
    } as UserAddress;

    return { data: address };
  } catch (error) {
    console.error('Error getting address:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Agregar una nueva dirección a un usuario
 */
export async function addAddress(userId: string, data: CreateAddressData): Promise<WriteResult> {
  try {
    const now = Timestamp.now();
    const addressData = {
      ...data,
      isDefault: data.isDefault || false,
      createdAt: now,
      updatedAt: now,
    };

    // Si esta dirección es por defecto, quitar el flag de las demás
    if (addressData.isDefault) {
      await unsetDefaultAddresses(userId);
    }

    const addressesRef = collection(db, USERS_COLLECTION, userId, ADDRESSES_SUBCOLLECTION);
    const docRef = await addDoc(addressesRef, addressData);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error adding address:', error);
    return { success: false, error: error as Error };
  }
}

/**
 * Actualizar una dirección de un usuario
 */
export async function updateAddress(
  userId: string,
  addressId: string,
  data: UpdateAddressData
): Promise<WriteResult> {
  try {
    const addressRef = doc(db, USERS_COLLECTION, userId, ADDRESSES_SUBCOLLECTION, addressId);

    // Si esta dirección se marca como por defecto, quitar el flag de las demás
    if (data.isDefault === true) {
      await unsetDefaultAddresses(userId);
    }

    await updateDoc(addressRef, {
      ...data,
      updatedAt: Timestamp.now(),
    });
    return { success: true, id: addressId };
  } catch (error) {
    console.error('Error updating address:', error);
    return { success: false, error: error as Error };
  }
}

/**
 * Eliminar una dirección de un usuario
 */
export async function deleteAddress(userId: string, addressId: string): Promise<WriteResult> {
  try {
    const addressRef = doc(db, USERS_COLLECTION, userId, ADDRESSES_SUBCOLLECTION, addressId);
    await deleteDoc(addressRef);
    return { success: true, id: addressId };
  } catch (error) {
    console.error('Error deleting address:', error);
    return { success: false, error: error as Error };
  }
}

/**
 * Establecer una dirección como predeterminada
 */
export async function setDefaultAddress(userId: string, addressId: string): Promise<WriteResult> {
  try {
    // Primero quitar el flag de todas las direcciones
    await unsetDefaultAddresses(userId);

    // Luego establecer esta como predeterminada
    const addressRef = doc(db, USERS_COLLECTION, userId, ADDRESSES_SUBCOLLECTION, addressId);
    await updateDoc(addressRef, {
      isDefault: true,
      updatedAt: Timestamp.now(),
    });
    return { success: true, id: addressId };
  } catch (error) {
    console.error('Error setting default address:', error);
    return { success: false, error: error as Error };
  }
}

/**
 * Función auxiliar: Quitar el flag isDefault de todas las direcciones de un usuario
 */
async function unsetDefaultAddresses(userId: string): Promise<void> {
  try {
    const addressesResult = await getUserAddresses(userId);
    if (addressesResult.data.length === 0) return;

    const updatePromises = addressesResult.data
      .filter((addr) => addr.isDefault)
      .map((addr) => {
        const addressRef = doc(db, USERS_COLLECTION, userId, ADDRESSES_SUBCOLLECTION, addr.id);
        return updateDoc(addressRef, {
          isDefault: false,
          updatedAt: Timestamp.now(),
        });
      });

    await Promise.all(updatePromises);
  } catch (error) {
    console.error('Error unsetting default addresses:', error);
    throw error;
  }
}

