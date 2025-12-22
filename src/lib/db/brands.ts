/**
 * Funciones para gestionar marcas en Firestore
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
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import type {
  SingleResult,
  QueryResult,
  WriteResult,
} from './types';

const COLLECTION_NAME = 'brands';

export interface Brand {
  id: string;
  name: string;
  categoryId: string; // Relación con categoría
  image?: string;
  status: 'Activo' | 'Inactivo';
  productCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CreateBrandData {
  name: string;
  categoryId: string;
  image?: string;
  status?: 'Activo' | 'Inactivo';
}

export interface UpdateBrandData {
  name?: string;
  categoryId?: string;
  image?: string;
  status?: 'Activo' | 'Inactivo';
}

/**
 * Obtener todas las marcas
 */
export async function getBrands(): Promise<QueryResult<Brand>> {
  try {
    const brandsRef = collection(db, COLLECTION_NAME);
    const q = query(brandsRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);

    const brands: Brand[] = [];
    querySnapshot.forEach((doc) => {
      brands.push({
        id: doc.id,
        ...doc.data(),
      } as Brand);
    });

    return { data: brands };
  } catch (error: any) {
    // No mostrar errores esperados cuando no hay datos (permisos o índices faltantes)
    const errorCode = error?.code;
    if (errorCode !== 'permission-denied' && errorCode !== 'failed-precondition') {
      console.error('Error getting brands:', error);
    }
    return { data: [], error: error as Error };
  }
}

/**
 * Obtener una marca por ID
 */
export async function getBrandById(id: string): Promise<SingleResult<Brand>> {
  try {
    const brandRef = doc(db, COLLECTION_NAME, id);
    const brandSnap = await getDoc(brandRef);

    if (!brandSnap.exists()) {
      return { data: null };
    }

    const brand = {
      id: brandSnap.id,
      ...brandSnap.data(),
    } as Brand;

    return { data: brand };
  } catch (error) {
    console.error('Error getting brand:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Crear una nueva marca
 */
export async function createBrand(data: CreateBrandData): Promise<WriteResult> {
  try {
    const now = Timestamp.now();
    const brandData = {
      name: data.name,
      categoryId: data.categoryId,
      image: data.image || '',
      status: data.status || 'Activo',
      productCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), brandData);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating brand:', error);
    return { success: false, error: error as Error };
  }
}

/**
 * Actualizar una marca
 */
export async function updateBrand(id: string, data: UpdateBrandData): Promise<WriteResult> {
  try {
    const brandRef = doc(db, COLLECTION_NAME, id);
    const updateData: any = {
      ...data,
      updatedAt: Timestamp.now(),
    };

    // Eliminar campos undefined
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    await updateDoc(brandRef, updateData);
    return { success: true, id };
  } catch (error) {
    console.error('Error updating brand:', error);
    return { success: false, error: error as Error };
  }
}

/**
 * Eliminar una marca
 */
export async function deleteBrand(id: string): Promise<WriteResult> {
  try {
    const brandRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(brandRef);
    return { success: true, id };
  } catch (error) {
    console.error('Error deleting brand:', error);
    return { success: false, error: error as Error };
  }
}

