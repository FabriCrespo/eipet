import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import type { UploadResult } from 'firebase/storage';
import { storage } from '../firebase';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

/**
 * Validar archivo de imagen
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Validar tipo
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Tipo de archivo no permitido. Solo se permiten: JPG, JPEG, PNG, WEBP'
    };
  }

  // Validar tamaño
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `El archivo es demasiado grande. Tamaño máximo: ${(MAX_FILE_SIZE / 1024 / 1024).toFixed(0)}MB`
    };
  }

  return { valid: true };
}

/**
 * Subir imagen de producto a Firebase Storage
 * @param file - Archivo de imagen a subir
 * @param productId - ID del producto (opcional, usar 'temp' si no existe)
 * @param onProgress - Callback opcional para progreso de carga
 * @returns URL de descarga de la imagen o error
 */
export async function uploadProductImage(
  file: File,
  productId?: string,
  onProgress?: (progress: number) => void
): Promise<{ success: boolean; url?: string; error?: Error }> {
  try {
    // Validar archivo
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return { success: false, error: new Error(validation.error || 'Archivo inválido') };
    }

    // Generar nombre único para el archivo
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}-${sanitizedFileName}`;
    
    // Determinar ruta en Storage
    const folder = productId || 'temp';
    const storagePath = `products/${folder}/${fileName}`;
    const storageRef = ref(storage, storagePath);

    // Subir archivo
    const snapshot: UploadResult = await uploadBytes(storageRef, file);
    
    // Obtener URL de descarga
    const downloadURL = await getDownloadURL(snapshot.ref);

    return { success: true, url: downloadURL };
  } catch (error) {
    console.error('Error uploading image:', error);
    return { success: false, error: error as Error };
  }
}

/**
 * Eliminar imagen de producto del Storage
 * @param imageUrl - URL completa de la imagen en Storage
 * @returns Resultado de la operación
 */
export async function deleteProductImage(imageUrl: string): Promise<{ success: boolean; error?: Error }> {
  try {
    const urlObj = new URL(imageUrl);
    
    if (urlObj.hostname.includes('firebasestorage.googleapis.com')) {
      const pathMatch = urlObj.pathname.match(/\/o\/(.+)\?/);
      if (pathMatch && pathMatch[1]) {
        const decodedPath = decodeURIComponent(pathMatch[1]);
        const storageRef = ref(storage, decodedPath);
        await deleteObject(storageRef);
        return { success: true };
      }
    }

    return { success: false, error: new Error('URL no es de Firebase Storage') };
  } catch (error) {
    console.error('Error deleting image:', error);
    return { success: false, error: error as Error };
  }
}

/**
 * Subir imagen de marca a Firebase Storage
 * @param file - Archivo de imagen a subir
 * @param brandId - ID de la marca (opcional, usar 'temp' si no existe)
 * @returns URL de descarga de la imagen o error
 */
export async function uploadBrandImage(
  file: File,
  brandId?: string
): Promise<{ success: boolean; url?: string; error?: Error }> {
  try {
    // Validar archivo
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return { success: false, error: new Error(validation.error || 'Archivo inválido') };
    }

    // Generar nombre único
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}-${sanitizedFileName}`;
    
    // Ruta en Storage: brands/{brandId}/image/{fileName}
    const folder = brandId || 'temp';
    const storagePath = `brands/${folder}/image/${fileName}`;
    const storageRef = ref(storage, storagePath);

    // Subir archivo
    const snapshot: UploadResult = await uploadBytes(storageRef, file);
    
    // Obtener URL de descarga
    const downloadURL = await getDownloadURL(snapshot.ref);

    return { success: true, url: downloadURL };
  } catch (error) {
    console.error('Error uploading brand image:', error);
    return { success: false, error: error as Error };
  }
}

/**
 * Eliminar imagen de marca del Storage
 * @param imageUrl - URL completa de la imagen en Storage
 * @returns Resultado de la operación
 */
export async function deleteBrandImage(imageUrl: string): Promise<{ success: boolean; error?: Error }> {
  try {
    const urlObj = new URL(imageUrl);
    
    if (urlObj.hostname.includes('firebasestorage.googleapis.com')) {
      const pathMatch = urlObj.pathname.match(/\/o\/(.+)\?/);
      if (pathMatch && pathMatch[1]) {
        const decodedPath = decodeURIComponent(pathMatch[1]);
        const storageRef = ref(storage, decodedPath);
        await deleteObject(storageRef);
        return { success: true };
      }
    }

    return { success: false, error: new Error('URL no es de Firebase Storage') };
  } catch (error) {
    console.error('Error deleting brand image:', error);
    return { success: false, error: error as Error };
  }
}

/**
 * Subir avatar de usuario a Firebase Storage
 * @param file - Archivo de imagen a subir
 * @param userId - ID del usuario
 * @returns URL de descarga de la imagen o error
 */
export async function uploadUserAvatar(
  file: File,
  userId: string
): Promise<{ success: boolean; url?: string; error?: Error }> {
  try {
    // Verificar que el usuario esté autenticado
    const { getCurrentUser } = await import('../auth');
    const currentUser = getCurrentUser();
    if (!currentUser || currentUser.uid !== userId) {
      return { 
        success: false, 
        error: new Error('Usuario no autenticado o no autorizado para subir este avatar') 
      };
    }

    // Validar archivo
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return { success: false, error: new Error(validation.error || 'Archivo inválido') };
    }

    // Generar nombre único para el archivo
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}-${sanitizedFileName}`;
    
    // Ruta en Storage: users/{userId}/avatar/{fileName}
    const storagePath = `users/${userId}/avatar/${fileName}`;
    const storageRef = ref(storage, storagePath);

    // Subir archivo
    const snapshot: UploadResult = await uploadBytes(storageRef, file);
    
    // Obtener URL de descarga (esto requiere permisos de lectura)
    // Esperar un momento para asegurar que el archivo esté completamente procesado
    await new Promise(resolve => setTimeout(resolve, 100));
    const downloadURL = await getDownloadURL(snapshot.ref);

    return { success: true, url: downloadURL };
  } catch (error) {
    console.error('Error uploading avatar:', error);
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return { 
      success: false, 
      error: new Error(`Error al subir avatar: ${errorMessage}`) 
    };
  }
}

/**
 * Eliminar avatar de usuario del Storage
 * @param imageUrl - URL completa de la imagen en Storage
 * @returns Resultado de la operación
 */
export async function deleteUserAvatar(imageUrl: string): Promise<{ success: boolean; error?: Error }> {
  try {
    // Extraer el path del Storage desde la URL
    const urlObj = new URL(imageUrl);
    
    // Si es una URL de Firebase Storage, extraer el path
    if (urlObj.hostname.includes('firebasestorage.googleapis.com')) {
      const pathMatch = urlObj.pathname.match(/\/o\/(.+)\?/);
      if (pathMatch && pathMatch[1]) {
        // Decodificar el path (puede estar codificado)
        const decodedPath = decodeURIComponent(pathMatch[1]);
        const storageRef = ref(storage, decodedPath);
        await deleteObject(storageRef);
        return { success: true };
      }
    }

    // Si no es una URL de Firebase Storage, no intentar eliminar
    return { success: false, error: new Error('URL no es de Firebase Storage') };
  } catch (error) {
    console.error('Error deleting avatar:', error);
    return { success: false, error: error as Error };
  }
}

/**
 * Subir imagen de categoría a Firebase Storage
 * @param file - Archivo de imagen a subir
 * @param categoryId - ID de la categoría (opcional, usar 'temp' si no existe)
 * @returns URL de descarga de la imagen o error
 */
export async function uploadCategoryImage(
  file: File,
  categoryId?: string
): Promise<{ success: boolean; url?: string; error?: Error }> {
  try {
    // Validar archivo
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return { success: false, error: new Error(validation.error || 'Archivo inválido') };
    }

    // Generar nombre único
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${timestamp}-${sanitizedFileName}`;
    
    // Ruta en Storage: categories/{categoryId}/image/{fileName}
    const folder = categoryId || 'temp';
    const storagePath = `categories/${folder}/image/${fileName}`;
    const storageRef = ref(storage, storagePath);

    // Subir archivo
    const snapshot: UploadResult = await uploadBytes(storageRef, file);
    
    // Obtener URL de descarga
    const downloadURL = await getDownloadURL(snapshot.ref);

    return { success: true, url: downloadURL };
  } catch (error) {
    console.error('Error uploading category image:', error);
    return { success: false, error: error as Error };
  }
}

/**
 * Eliminar imagen de categoría del Storage
 * @param imageUrl - URL completa de la imagen en Storage
 * @returns Resultado de la operación
 */
export async function deleteCategoryImage(imageUrl: string): Promise<{ success: boolean; error?: Error }> {
  try {
    const urlObj = new URL(imageUrl);
    
    if (urlObj.hostname.includes('firebasestorage.googleapis.com')) {
      const pathMatch = urlObj.pathname.match(/\/o\/(.+)\?/);
      if (pathMatch && pathMatch[1]) {
        const decodedPath = decodeURIComponent(pathMatch[1]);
        const storageRef = ref(storage, decodedPath);
        await deleteObject(storageRef);
        return { success: true };
      }
    }

    return { success: false, error: new Error('URL no es de Firebase Storage') };
  } catch (error) {
    console.error('Error deleting category image:', error);
    return { success: false, error: error as Error };
  }
}

/**
 * Verificar si una URL es de Firebase Storage
 */
export function isFirebaseStorageUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.includes('firebasestorage.googleapis.com');
  } catch {
    return false;
  }
}

