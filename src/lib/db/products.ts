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
  runTransaction,
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

    // Filtro por estado - solo aplicar si se especifica explícitamente
    // Para el admin, no filtrar por defecto para ver todos los productos
    if (filters?.status !== undefined && filters?.status !== null) {
      constraints.push(where('status', '==', filters.status));
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
  } catch (error: any) {
    // No mostrar errores esperados cuando no hay datos (permisos o índices faltantes)
    const errorCode = error?.code;
    if (errorCode !== 'permission-denied' && errorCode !== 'failed-precondition') {
      console.error('Error getting products:', error);
    }
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

/**
 * Validar y ajustar stock de múltiples productos de manera atómica usando transacciones
 * Esto previene race conditions cuando múltiples usuarios compran simultáneamente
 */
export async function validateAndAdjustStockMultiple(
  items: Array<{ productId: string; quantity: number }>
): Promise<{ success: boolean; errors: string[]; error?: Error }> {
  let errors: string[] = [];
  try {
    
    // Usar transacción para validar y actualizar stock de todos los productos
    await runTransaction(db, async (transaction) => {
      // Primero, validar stock de todos los productos
      for (const item of items) {
        const productRef = doc(db, COLLECTION_NAME, item.productId);
        const productSnap = await transaction.get(productRef);
        
        if (!productSnap.exists()) {
          errors.push(`Producto ${item.productId} no encontrado`);
          continue;
        }
        
        const product = productSnap.data() as Product;
        const currentStock = product.stock || 0;
        
        if (currentStock < item.quantity) {
          errors.push(
            `${product.name || item.productId}: Stock disponible (${currentStock}) es menor que la cantidad solicitada (${item.quantity})`
          );
        }
      }
      
      // Si hay errores, lanzar excepción para abortar la transacción
      if (errors.length > 0) {
        throw new Error('Stock validation failed');
      }
      
      // Si todo está bien, actualizar stock de todos los productos
      for (const item of items) {
        const productRef = doc(db, COLLECTION_NAME, item.productId);
        const productSnap = await transaction.get(productRef);
        
        if (productSnap.exists()) {
          const product = productSnap.data() as Product;
          const newStock = (product.stock || 0) - item.quantity;
          
          if (newStock < 0) {
            throw new Error(`Stock cannot be negative for product ${item.productId}`);
          }
          
          transaction.update(productRef, {
            stock: newStock,
            updatedAt: Timestamp.now(),
          });
        }
      }
    });
    
    return { success: true, errors: [] };
  } catch (error: any) {
    console.error('Error in validateAndAdjustStockMultiple:', error);
    // Si el error es de validación, retornar los errores
    if (error.message === 'Stock validation failed') {
      return { success: false, errors };
    }
    return { success: false, errors: [error.message || 'Error desconocido'], error: error as Error };
  }
}

/**
 * Obtener productos más vendidos basado en pedidos completados
 */
export async function getMostSoldProducts(limit: number = 10): Promise<QueryResult<Product>> {
  try {
    // Importar funciones de orders dinámicamente para evitar dependencias circulares
    const { getAllOrders } = await import('./orders');
    
    // Obtener todos los pedidos entregados o completados
    const ordersResult = await getAllOrders();
    if (ordersResult.error || !ordersResult.data) {
      return { data: [], error: ordersResult.error };
    }
    
    // Filtrar solo pedidos entregados/completados
    const completedOrders = ordersResult.data.filter((order: any) => 
      order.status === 'delivered' || order.status === 'completed'
    );
    
    // Contar ventas por producto
    const productSales: Map<string, { quantity: number; revenue: number }> = new Map();
    
    for (const order of completedOrders) {
      if (order.items && Array.isArray(order.items)) {
        for (const item of order.items) {
          const productId = item.productId;
          if (productId) {
            const current = productSales.get(productId) || { quantity: 0, revenue: 0 };
            productSales.set(productId, {
              quantity: current.quantity + (item.quantity || 0),
              revenue: current.revenue + (item.subtotal || 0)
            });
          }
        }
      }
    }
    
    // Convertir a array y ordenar por cantidad vendida
    const sortedProducts = Array.from(productSales.entries())
      .sort((a, b) => b[1].quantity - a[1].quantity)
      .slice(0, limit);
    
    // Obtener información completa de los productos
    const products: Product[] = [];
    for (const [productId, sales] of sortedProducts) {
      const productResult = await getProductById(productId);
      if (productResult.data) {
        products.push(productResult.data);
      }
    }
    
    return { data: products };
  } catch (error) {
    console.error('Error getting most sold products:', error);
    return { data: [], error: error as Error };
  }
}

/**
 * Obtener estadísticas de ventas para un producto específico
 */
export async function getProductSalesStats(productId: string): Promise<{
  sales: number; // Cantidad total vendida
  revenue: number; // Ingresos totales
}> {
  try {
    // Importar funciones de orders dinámicamente
    const { getAllOrders } = await import('./orders');
    
    // Obtener todos los pedidos entregados o completados
    const ordersResult = await getAllOrders();
    if (ordersResult.error || !ordersResult.data) {
      return { sales: 0, revenue: 0 };
    }
    
    // Filtrar solo pedidos entregados/completados
    const completedOrders = ordersResult.data.filter((order: any) => 
      order.status === 'delivered' || order.status === 'completed'
    );
    
    let totalSales = 0;
    let totalRevenue = 0;
    
    // Calcular ventas y revenue para este producto
    for (const order of completedOrders) {
      if (order.items && Array.isArray(order.items)) {
        for (const item of order.items) {
          if (item.productId === productId) {
            totalSales += item.quantity || 0;
            totalRevenue += item.subtotal || 0;
          }
        }
      }
    }
    
    return {
      sales: totalSales,
      revenue: totalRevenue
    };
  } catch (error) {
    console.error('Error getting product sales stats:', error);
    return { sales: 0, revenue: 0 };
  }
}

