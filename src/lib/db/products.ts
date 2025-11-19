/**
 * Funciones para gestionar productos en Firestore
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
  limit as firestoreLimit,
  Timestamp,
  QueryConstraint,
  Query,
} from 'firebase/firestore';
import { db } from '../firebase';
import type {
  Product,
  CreateProductData,
  UpdateProductData,
  ProductFilters,
  SingleResult,
  QueryResult,
  WriteResult,
  FirestoreTimestamp,
} from './types';
import { toTimestamp } from './types';

const COLLECTION_NAME = 'products';

/**
 * Obtener todos los productos con filtros opcionales
 */
export async function getProducts(filters?: ProductFilters): Promise<QueryResult<Product>> {
  try {
    const productsRef = collection(db, COLLECTION_NAME);
    const constraints: QueryConstraint[] = [];

    // Filtro por categoría (puede ser string o array)
    if (filters?.category) {
      if (Array.isArray(filters.category)) {
        if (filters.category.length === 1) {
          constraints.push(where('category', '==', filters.category[0]));
        } else if (filters.category.length > 0) {
          constraints.push(where('category', 'in', filters.category));
        }
      } else {
        constraints.push(where('category', '==', filters.category));
      }
    }

    // Filtro por tipo (puede ser string o array)
    if (filters?.type) {
      const types = Array.isArray(filters.type) ? filters.type : [filters.type];
      if (types.length === 1) {
        constraints.push(where('type', '==', types[0]));
      } else if (types.length > 1) {
        constraints.push(where('type', 'in', types));
      }
    }

    // Filtro por etapa de vida (puede ser string o array)
    if (filters?.lifeStage) {
      const lifeStages = Array.isArray(filters.lifeStage) ? filters.lifeStage : [filters.lifeStage];
      if (lifeStages.length === 1) {
        constraints.push(where('lifeStage', '==', lifeStages[0]));
      } else if (lifeStages.length > 1) {
        constraints.push(where('lifeStage', 'in', lifeStages));
      }
    }

    // Filtro por tamaño de raza (puede ser string o array)
    if (filters?.breedSize) {
      const breedSizes = Array.isArray(filters.breedSize) ? filters.breedSize : [filters.breedSize];
      if (breedSizes.length === 1) {
        constraints.push(where('breedSize', '==', breedSizes[0]));
      } else if (breedSizes.length > 1) {
        constraints.push(where('breedSize', 'in', breedSizes));
      }
    }

    // Filtro por precio mínimo
    if (filters?.minPrice !== undefined) {
      constraints.push(where('price', '>=', filters.minPrice));
    }

    // Filtro por precio máximo
    if (filters?.maxPrice !== undefined) {
      constraints.push(where('price', '<=', filters.maxPrice));
    }

    // Filtro por descuento
    if (filters?.discount) {
      constraints.push(where('discount', '>', 0));
    }

    // Filtro por estado
    if (filters?.status) {
      constraints.push(where('status', '==', filters.status));
    } else {
      // Por defecto, solo productos activos
      constraints.push(where('status', '==', 'active'));
    }

    // Ordenamiento
    const sortBy = filters?.sortBy || 'name';
    const sortOrder = filters?.sortOrder || 'asc';
    constraints.push(orderBy(sortBy, sortOrder));

    // Límite
    if (filters?.limit) {
      constraints.push(firestoreLimit(filters.limit));
    }

    const q = query(productsRef, ...constraints);
    const querySnapshot = await getDocs(q);

    let products: Product[] = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Product[];

    // Búsqueda por texto (filtrado en cliente ya que Firestore no soporta full-text search)
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      products = products.filter(
        (product) =>
          product.name.toLowerCase().includes(searchLower) ||
          product.brand.toLowerCase().includes(searchLower) ||
          product.tags?.some((tag) => tag.toLowerCase().includes(searchLower))
      );
    }

    return { data: products };
  } catch (error) {
    console.error('Error getting products:', error);
    return { data: [], error: error as Error };
  }
}

/**
 * Obtener un producto por ID
 */
export async function getProductById(id: string): Promise<SingleResult<Product>> {
  try {
    const productRef = doc(db, COLLECTION_NAME, id);
    const productSnap = await getDoc(productRef);

    if (!productSnap.exists()) {
      return { data: null };
    }

    const product = {
      id: productSnap.id,
      ...productSnap.data(),
    } as Product;

    return { data: product };
  } catch (error) {
    console.error('Error getting product:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Crear un nuevo producto (admin)
 */
export async function createProduct(data: CreateProductData): Promise<WriteResult> {
  try {
    const now = Timestamp.now();
    const productData = {
      ...data,
      discount: data.discount || 0,
      discountType: data.discountType || 'percentage',
      discountStartDate: data.discountStartDate ? toTimestamp(data.discountStartDate) : null,
      discountEndDate: data.discountEndDate ? toTimestamp(data.discountEndDate) : null,
      status: data.status || 'active',
      tags: data.tags || [],
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), productData);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating product:', error);
    return { success: false, error: error as Error };
  }
}

/**
 * Actualizar un producto (admin)
 */
export async function updateProduct(id: string, data: UpdateProductData): Promise<WriteResult> {
  try {
    const productRef = doc(db, COLLECTION_NAME, id);
    const updateData: any = {
      ...data,
      updatedAt: Timestamp.now(),
    };

    // Convertir fechas a Timestamp si están presentes
    if (data.discountStartDate !== undefined) {
      updateData.discountStartDate = data.discountStartDate ? toTimestamp(data.discountStartDate) : null;
    }
    if (data.discountEndDate !== undefined) {
      updateData.discountEndDate = data.discountEndDate ? toTimestamp(data.discountEndDate) : null;
    }

    await updateDoc(productRef, updateData);
    return { success: true, id };
  } catch (error) {
    console.error('Error updating product:', error);
    return { success: false, error: error as Error };
  }
}

/**
 * Eliminar un producto (admin)
 */
export async function deleteProduct(id: string): Promise<WriteResult> {
  try {
    const productRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(productRef);
    return { success: true, id };
  } catch (error) {
    console.error('Error deleting product:', error);
    return { success: false, error: error as Error };
  }
}

/**
 * Actualizar stock de un producto
 */
export async function updateStock(id: string, quantity: number): Promise<WriteResult> {
  try {
    const productRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(productRef, {
      stock: quantity,
      updatedAt: Timestamp.now(),
    });
    return { success: true, id };
  } catch (error) {
    console.error('Error updating stock:', error);
    return { success: false, error: error as Error };
  }
}

/**
 * Incrementar o decrementar stock (útil para transacciones)
 */
export async function adjustStock(id: string, adjustment: number): Promise<WriteResult> {
  try {
    const productResult = await getProductById(id);
    if (!productResult.data) {
      return { success: false, error: new Error('Product not found') };
    }

    const newStock = productResult.data.stock + adjustment;
    if (newStock < 0) {
      return { success: false, error: new Error('Stock cannot be negative') };
    }

    return await updateStock(id, newStock);
  } catch (error) {
    console.error('Error adjusting stock:', error);
    return { success: false, error: error as Error };
  }
}

