/**
 * Funciones para gestionar categorías y tipos de productos dinámicos
 * Permite al admin crear, editar y eliminar categorías, tipos, etapas de vida y tamaños de raza
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
  ProductOption,
  ProductCategory,
  ProductTypeOption,
  LifeStageOption,
  BreedSizeOption,
  CreateProductOptionData,
  UpdateProductOptionData,
  CategoryType,
  SingleResult,
  QueryResult,
  WriteResult,
} from './types';

const COLLECTION_NAME = 'productOptions';

/**
 * Obtener todas las opciones de un tipo específico
 */
export async function getProductOptions(type: CategoryType): Promise<QueryResult<ProductOption>> {
  try {
    const optionsRef = collection(db, COLLECTION_NAME);
    const q = query(
      optionsRef,
      where('type', '==', type),
      where('isActive', '==', true),
      orderBy('order', 'asc')
    );
    const querySnapshot = await getDocs(q);

    const options: ProductOption[] = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ProductOption[];

    return { data: options };
  } catch (error) {
    console.error(`Error getting product options for type ${type}:`, error);
    return { data: [], error: error as Error };
  }
}

/**
 * Obtener todas las opciones (incluyendo inactivas) de un tipo específico (admin)
 */
export async function getAllProductOptions(type: CategoryType): Promise<QueryResult<ProductOption>> {
  try {
    const optionsRef = collection(db, COLLECTION_NAME);
    const q = query(
      optionsRef,
      where('type', '==', type),
      orderBy('order', 'asc')
    );
    const querySnapshot = await getDocs(q);

    const options: ProductOption[] = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ProductOption[];

    return { data: options };
  } catch (error) {
    console.error(`Error getting all product options for type ${type}:`, error);
    return { data: [], error: error as Error };
  }
}

/**
 * Obtener todas las categorías activas
 */
export async function getCategories(): Promise<QueryResult<ProductCategory>> {
  const result = await getProductOptions('category');
  return {
    data: result.data as ProductCategory[],
    error: result.error,
  };
}

/**
 * Obtener todos los tipos de productos activos
 */
export async function getProductTypes(): Promise<QueryResult<ProductTypeOption>> {
  const result = await getProductOptions('type');
  return {
    data: result.data as ProductTypeOption[],
    error: result.error,
  };
}

/**
 * Obtener todas las etapas de vida activas
 */
export async function getLifeStages(): Promise<QueryResult<LifeStageOption>> {
  const result = await getProductOptions('lifeStage');
  return {
    data: result.data as LifeStageOption[],
    error: result.error,
  };
}

/**
 * Obtener todos los tamaños de raza activos
 */
export async function getBreedSizes(): Promise<QueryResult<BreedSizeOption>> {
  const result = await getProductOptions('breedSize');
  return {
    data: result.data as BreedSizeOption[],
    error: result.error,
  };
}

/**
 * Obtener una opción por ID
 */
export async function getProductOptionById(id: string): Promise<SingleResult<ProductOption>> {
  try {
    const optionRef = doc(db, COLLECTION_NAME, id);
    const optionSnap = await getDoc(optionRef);

    if (!optionSnap.exists()) {
      return { data: null };
    }

    const option = {
      id: optionSnap.id,
      ...optionSnap.data(),
    } as ProductOption;

    return { data: option };
  } catch (error) {
    console.error('Error getting product option:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Obtener una opción por slug
 */
export async function getProductOptionBySlug(
  type: CategoryType,
  slug: string
): Promise<SingleResult<ProductOption>> {
  try {
    const optionsRef = collection(db, COLLECTION_NAME);
    const q = query(
      optionsRef,
      where('type', '==', type),
      where('slug', '==', slug)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return { data: null };
    }

    const optionDoc = querySnapshot.docs[0];
    const option = {
      id: optionDoc.id,
      ...optionDoc.data(),
    } as ProductOption;

    return { data: option };
  } catch (error) {
    console.error('Error getting product option by slug:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Crear una nueva opción (admin)
 */
export async function createProductOption(data: CreateProductOptionData): Promise<WriteResult> {
  try {
    // Verificar que el slug no exista para este tipo
    const existingOption = await getProductOptionBySlug(data.type, data.slug);
    if (existingOption.data) {
      return {
        success: false,
        error: new Error(`Ya existe una opción con el slug "${data.slug}" para el tipo "${data.type}"`),
      };
    }

    // Obtener el siguiente orden si no se proporciona
    let order = data.order;
    if (order === undefined) {
      const allOptions = await getAllProductOptions(data.type);
      order = allOptions.data.length > 0
        ? Math.max(...allOptions.data.map((opt) => opt.order)) + 1
        : 0;
    }

    const now = Timestamp.now();
    const optionData = {
      ...data,
      isActive: data.isActive !== undefined ? data.isActive : true,
      order,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), optionData);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating product option:', error);
    return { success: false, error: error as Error };
  }
}

/**
 * Actualizar una opción (admin)
 */
export async function updateProductOption(
  id: string,
  data: UpdateProductOptionData
): Promise<WriteResult> {
  try {
    // Si se actualiza el slug, verificar que no exista otro con el mismo slug
    if (data.slug) {
      const currentOption = await getProductOptionById(id);
      if (currentOption.data && currentOption.data.slug !== data.slug) {
        const existingOption = await getProductOptionBySlug(
          currentOption.data.type,
          data.slug
        );
        if (existingOption.data && existingOption.data.id !== id) {
          return {
            success: false,
            error: new Error(`Ya existe otra opción con el slug "${data.slug}"`),
          };
        }
      }
    }

    const optionRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(optionRef, {
      ...data,
      updatedAt: Timestamp.now(),
    });
    return { success: true, id };
  } catch (error) {
    console.error('Error updating product option:', error);
    return { success: false, error: error as Error };
  }
}

/**
 * Eliminar una opción (admin)
 * Nota: En lugar de eliminar, se marca como inactiva para mantener integridad referencial
 */
export async function deleteProductOption(id: string): Promise<WriteResult> {
  try {
    const optionRef = doc(db, COLLECTION_NAME, id);
    // Marcar como inactiva en lugar de eliminar
    await updateDoc(optionRef, {
      isActive: false,
      updatedAt: Timestamp.now(),
    });
    return { success: true, id };
  } catch (error) {
    console.error('Error deleting product option:', error);
    return { success: false, error: error as Error };
  }
}

/**
 * Eliminar permanentemente una opción (admin)
 * ADVERTENCIA: Solo usar si estás seguro de que no hay productos usando esta opción
 */
export async function permanentlyDeleteProductOption(id: string): Promise<WriteResult> {
  try {
    const optionRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(optionRef);
    return { success: true, id };
  } catch (error) {
    console.error('Error permanently deleting product option:', error);
    return { success: false, error: error as Error };
  }
}

/**
 * Reordenar opciones (admin)
 */
export async function reorderProductOptions(
  type: CategoryType,
  orderedIds: string[]
): Promise<WriteResult> {
  try {
    const updatePromises = orderedIds.map((id, index) => {
      const optionRef = doc(db, COLLECTION_NAME, id);
      return updateDoc(optionRef, {
        order: index,
        updatedAt: Timestamp.now(),
      });
    });

    await Promise.all(updatePromises);
    return { success: true };
  } catch (error) {
    console.error('Error reordering product options:', error);
    return { success: false, error: error as Error };
  }
}

/**
 * Inicializar opciones por defecto (ejecutar una vez al configurar la base de datos)
 */
export async function initializeDefaultOptions(): Promise<WriteResult> {
  try {
    const defaultOptions: CreateProductOptionData[] = [
      // Categorías
      { name: 'Perro', slug: 'dog', type: 'category', order: 0 },
      { name: 'Gato', slug: 'cat', type: 'category', order: 1 },
      // Tipos
      { name: 'Alimento', slug: 'food', type: 'type', order: 0 },
      { name: 'Juguete', slug: 'toy', type: 'type', order: 1 },
      { name: 'Limpieza', slug: 'cleaning', type: 'type', order: 2 },
      { name: 'Accesorio', slug: 'accessory', type: 'type', order: 3 },
      // Etapas de vida
      { name: 'Cachorro', slug: 'cachorro', type: 'lifeStage', order: 0 },
      { name: 'Gatito', slug: 'gatito', type: 'lifeStage', order: 1 },
      { name: 'Adulto', slug: 'adulto', type: 'lifeStage', order: 2 },
      { name: 'Senior', slug: 'senior', type: 'lifeStage', order: 3 },
      { name: 'Todas las edades', slug: 'todos', type: 'lifeStage', order: 4 },
      // Tamaños de raza
      { name: 'Pequeña', slug: 'pequeña', type: 'breedSize', order: 0 },
      { name: 'Mediana', slug: 'mediana', type: 'breedSize', order: 1 },
      { name: 'Grande', slug: 'grande', type: 'breedSize', order: 2 },
      { name: 'Todos los tamaños', slug: 'todos', type: 'breedSize', order: 3 },
    ];

    let successCount = 0;
    let errorCount = 0;

    for (const option of defaultOptions) {
      // Verificar si ya existe
      const existing = await getProductOptionBySlug(option.type, option.slug);
      if (!existing.data) {
        const result = await createProductOption(option);
        if (result.success) {
          successCount++;
        } else {
          errorCount++;
        }
      } else {
        successCount++; // Ya existe, contar como éxito
      }
    }

    return {
      success: errorCount === 0,
      error: errorCount > 0 ? new Error(`${errorCount} opciones fallaron al inicializar`) : undefined,
    };
  } catch (error) {
    console.error('Error initializing default options:', error);
    return { success: false, error: error as Error };
  }
}

