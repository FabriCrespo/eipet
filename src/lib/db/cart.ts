/**
 * Funciones para gestionar el carrito de compras en Firestore
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
  Cart,
  CartItem,
  AddToCartData,
  SingleResult,
  WriteResult,
} from './types';

const COLLECTION_NAME = 'cart';

/**
 * Obtener el carrito de un usuario
 */
export async function getCart(userId: string): Promise<SingleResult<Cart>> {
  try {
    const cartRef = doc(db, COLLECTION_NAME, userId);
    const cartSnap = await getDoc(cartRef);

    if (!cartSnap.exists()) {
      // Si no existe, crear uno vacío
      const newCart: Cart = {
        id: userId,
        userId,
        items: [],
        updatedAt: Timestamp.now(),
      };
      await setDoc(cartRef, newCart);
      return { data: newCart };
    }

    const cart = {
      id: cartSnap.id,
      ...cartSnap.data(),
    } as Cart;

    return { data: cart };
  } catch (error) {
    console.error('Error getting cart:', error);
    return { data: null, error: error as Error };
  }
}

/**
 * Agregar un producto al carrito con validación de stock
 */
export async function addToCart(userId: string, data: AddToCartData): Promise<WriteResult> {
  try {
    // Validar stock antes de agregar al carrito
    const { getProductById } = await import('./products');
    const productResult = await getProductById(data.productId);
    
    if (!productResult.data) {
      return { success: false, error: new Error('Producto no encontrado') };
    }
    
    const product = productResult.data;
    const availableStock = product.stock || 0;
    
    // Obtener cantidad actual en el carrito
    const cartResult = await getCart(userId);
    const currentCart = cartResult.data;
    const existingItem = currentCart?.items.find((item) => item.productId === data.productId);
    const currentQuantity = existingItem?.quantity || 0;
    const newTotalQuantity = currentQuantity + data.quantity;
    
    // Validar que hay stock suficiente
    if (availableStock < newTotalQuantity) {
      return { 
        success: false, 
        error: new Error(
          `Stock insuficiente. Disponible: ${availableStock}, Solicitado: ${newTotalQuantity} (ya tienes ${currentQuantity} en el carrito)`
        ) 
      };
    }
    
    const cartRef = doc(db, COLLECTION_NAME, userId);
    const cartSnap = await getDoc(cartRef);

    let cart: Cart;

    if (cartSnap.exists()) {
      cart = cartSnap.data() as Cart;
      // Verificar si el producto ya está en el carrito
      const existingItemIndex = cart.items.findIndex((item) => item.productId === data.productId);

      if (existingItemIndex >= 0) {
        // Incrementar cantidad
        cart.items[existingItemIndex].quantity += data.quantity;
      } else {
        // Agregar nuevo item
        cart.items.push({
          productId: data.productId,
          quantity: data.quantity,
          addedAt: Timestamp.now(),
        });
      }

      await updateDoc(cartRef, {
        items: cart.items,
        updatedAt: Timestamp.now(),
      });
    } else {
      // Crear nuevo carrito
      cart = {
        id: userId,
        userId,
        items: [
          {
            productId: data.productId,
            quantity: data.quantity,
            addedAt: Timestamp.now(),
          },
        ],
        updatedAt: Timestamp.now(),
      };
      await setDoc(cartRef, cart);
    }

    return { success: true, id: userId };
  } catch (error) {
    console.error('Error adding to cart:', error);
    return { success: false, error: error as Error };
  }
}

/**
 * Actualizar la cantidad de un item en el carrito con validación de stock
 */
export async function updateCartItem(
  userId: string,
  productId: string,
  quantity: number
): Promise<WriteResult> {
  try {
    if (quantity <= 0) {
      // Si la cantidad es 0 o menor, eliminar el item
      return await removeFromCart(userId, productId);
    }

    // Validar stock antes de actualizar
    const { getProductById } = await import('./products');
    const productResult = await getProductById(productId);
    
    if (!productResult.data) {
      return { success: false, error: new Error('Producto no encontrado') };
    }
    
    const product = productResult.data;
    const availableStock = product.stock || 0;
    
    // Validar que hay stock suficiente
    if (availableStock < quantity) {
      return { 
        success: false, 
        error: new Error(
          `Stock insuficiente. Disponible: ${availableStock}, Solicitado: ${quantity}`
        ) 
      };
    }

    const cartRef = doc(db, COLLECTION_NAME, userId);
    const cartSnap = await getDoc(cartRef);

    if (!cartSnap.exists()) {
      return { success: false, error: new Error('Cart not found') };
    }

    const cart = cartSnap.data() as Cart;
    const itemIndex = cart.items.findIndex((item) => item.productId === productId);

    if (itemIndex === -1) {
      return { success: false, error: new Error('Item not found in cart') };
    }

    cart.items[itemIndex].quantity = quantity;

    await updateDoc(cartRef, {
      items: cart.items,
      updatedAt: Timestamp.now(),
    });

    return { success: true, id: userId };
  } catch (error) {
    console.error('Error updating cart item:', error);
    return { success: false, error: error as Error };
  }
}

/**
 * Quitar un producto del carrito
 */
export async function removeFromCart(userId: string, productId: string): Promise<WriteResult> {
  try {
    const cartRef = doc(db, COLLECTION_NAME, userId);
    const cartSnap = await getDoc(cartRef);

    if (!cartSnap.exists()) {
      return { success: true, id: userId }; // No hay carrito, nada que quitar
    }

    const cart = cartSnap.data() as Cart;
    const updatedItems = cart.items.filter((item) => item.productId !== productId);

    await updateDoc(cartRef, {
      items: updatedItems,
      updatedAt: Timestamp.now(),
    });

    return { success: true, id: userId };
  } catch (error) {
    console.error('Error removing from cart:', error);
    return { success: false, error: error as Error };
  }
}

/**
 * Vaciar el carrito
 */
export async function clearCart(userId: string): Promise<WriteResult> {
  try {
    const cartRef = doc(db, COLLECTION_NAME, userId);
    await updateDoc(cartRef, {
      items: [],
      updatedAt: Timestamp.now(),
    });
    return { success: true, id: userId };
  } catch (error) {
    console.error('Error clearing cart:', error);
    return { success: false, error: error as Error };
  }
}

/**
 * Obtener el número total de items en el carrito
 */
export async function getCartItemCount(userId: string): Promise<number> {
  try {
    const cartResult = await getCart(userId);
    if (!cartResult.data) {
      return 0;
    }

    return cartResult.data.items.reduce((total, item) => total + item.quantity, 0);
  } catch (error) {
    console.error('Error getting cart item count:', error);
    return 0;
  }
}

