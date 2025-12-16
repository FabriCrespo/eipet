/**
 * Funciones para gestionar categorías en Firestore
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
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';
import type {
  SingleResult,
  QueryResult,
  WriteResult,
} from './types';

const COLLECTION_NAME = 'categories';

export interface Category {
  id: string;
  name: string;
  animalType: 'Perro' | 'Gato' | 'Otro';
  image?: string;
  status: 'Activo' | 'Inactivo';
  productCount: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface CreateCategoryData {
  name: string;
  animalType: 'Perro' | 'Gato' | 'Otro';
  image?: string;
  status?: 'Activo' | 'Inactivo';
}

export interface UpdateCategoryData {
  name?: string;
  animalType?: 'Perro' | 'Gato' | 'Otro';
  image?: string;
  status?: 'Activo' | 'Inactivo';
}

/**
 * Obtener todas las categorías
 */
export async function getCategories(): Promise<QueryResult<Category>> {
  try {
    const categoriesRef = collection(db, COLLECTION_NAME);
    const q = query(categoriesRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);

    const categories: Category[] = [];
    querySnapshot.forEach((doc) => {
      categories.push({
        id: doc.id,
        ...doc.data(),
      } as Category);
    });

    return { data: categories };
  } catch (error) {
    console.error('Error getting categories:', error);
    return { data: [], error: error as Error };
  }
}

/**
 * Obtener una categoría por ID
 */
export async function getCategoryById(id: string): Promise<SingleResult<Category>> {
  try {
    const categoryRef = doc(db, COLLECTION_NAME, id);
    const categorySnap = await getDoc(categoryRef);

    if (!categorySnap.exists()) {
      return { data: null };
    }

    const category = {
      id: categorySnap.id,
      ...categorySnap.data(),
    } as Category;

    return { data: category };
  } catch (error) {
    console.error('Error getting category:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Crear una nueva categoría
 */
export async function createCategory(data: CreateCategoryData): Promise<WriteResult> {
  try {
    const now = Timestamp.now();
    const categoryData = {
      name: data.name,
      animalType: data.animalType,
      image: data.image || '',
      status: data.status || 'Activo',
      productCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), categoryData);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating category:', error);
    return { success: false, error: error as Error };
  }
}

/**
 * Actualizar una categoría
 */
export async function updateCategory(id: string, data: UpdateCategoryData): Promise<WriteResult> {
  try {
    const categoryRef = doc(db, COLLECTION_NAME, id);
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

    await updateDoc(categoryRef, updateData);
    return { success: true, id };
  } catch (error) {
    console.error('Error updating category:', error);
    return { success: false, error: error as Error };
  }
}

/**
 * Eliminar una categoría
 */
export async function deleteCategory(id: string): Promise<WriteResult> {
  try {
    const categoryRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(categoryRef);
    return { success: true, id };
  } catch (error) {
    console.error('Error deleting category:', error);
    return { success: false, error: error as Error };
  }
}

/**
 * Obtener categorías por tipo de animal
 */
export async function getCategoriesByAnimalType(animalType: 'Perro' | 'Gato' | 'Otro'): Promise<QueryResult<Category>> {
  try {
    const categoriesRef = collection(db, COLLECTION_NAME);
    const q = query(
      categoriesRef,
      where('animalType', '==', animalType),
      where('status', '==', 'Activo'),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);

    const categories: Category[] = [];
    querySnapshot.forEach((doc) => {
      categories.push({
        id: doc.id,
        ...doc.data(),
      } as Category);
    });

    return { data: categories };
  } catch (error) {
    console.error('Error getting categories by animal type:', error);
    return { data: [], error: error as Error };
  }
}

