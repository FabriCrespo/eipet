/**
 * Funciones helper para autenticación con Firebase Auth
 * Todas las funciones funcionan client-side
 */

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updatePassword,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider,
  type User as FirebaseUser,
} from 'firebase/auth';
import { auth } from './firebase';
import { createUserWithId, getUser } from './db/users';
import type { CreateUserData } from './db/types';

/**
 * Iniciar sesión con email y contraseña
 */
export async function login(email: string, password: string): Promise<{
  success: boolean;
  user?: FirebaseUser;
  error?: string;
}> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return {
      success: true,
      user: userCredential.user,
    };
  } catch (error: any) {
    let errorMessage = 'Error al iniciar sesión. Por favor, intenta de nuevo.';
    
    if (error.code === 'auth/user-not-found') {
      errorMessage = 'No existe una cuenta con este correo electrónico.';
    } else if (error.code === 'auth/wrong-password') {
      errorMessage = 'Contraseña incorrecta.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'El correo electrónico no es válido.';
    } else if (error.code === 'auth/user-disabled') {
      errorMessage = 'Esta cuenta ha sido deshabilitada.';
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = 'Demasiados intentos fallidos. Por favor, intenta más tarde.';
    }
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Registrar nuevo usuario
 */
export async function register(
  email: string,
  password: string,
  userData: CreateUserData
): Promise<{
  success: boolean;
  user?: FirebaseUser;
  error?: string;
}> {
  try {
    // Crear usuario en Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    // Crear documento de usuario en Firestore
    const createResult = await createUserWithId(firebaseUser.uid, {
      ...userData,
      email,
    });

    if (!createResult.success) {
      // Si falla la creación en Firestore, eliminar el usuario de Auth
      await firebaseUser.delete();
      return {
        success: false,
        error: 'Error al crear el perfil de usuario. Por favor, intenta de nuevo.',
      };
    }

    return {
      success: true,
      user: firebaseUser,
    };
  } catch (error: any) {
    let errorMessage = 'Error al crear la cuenta. Por favor, intenta de nuevo.';
    
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'Este correo electrónico ya está registrado.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'El correo electrónico no es válido.';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'La contraseña es muy débil. Debe tener al menos 6 caracteres.';
    }
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Cerrar sesión
 */
export async function logout(): Promise<void> {
  try {
    await signOut(auth);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
    throw error;
  }
}

/**
 * Cambiar contraseña
 */
export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const user = auth.currentUser;
    if (!user || !user.email) {
      return {
        success: false,
        error: 'No hay usuario autenticado.',
      };
    }

    // Verificar contraseña actual
    try {
      await signInWithEmailAndPassword(auth, user.email, currentPassword);
    } catch (error: any) {
      if (error.code === 'auth/wrong-password') {
        return {
          success: false,
          error: 'La contraseña actual es incorrecta.',
        };
      }
      throw error;
    }

    // Actualizar contraseña
    await updatePassword(user, newPassword);
    return { success: true };
  } catch (error: any) {
    let errorMessage = 'Error al cambiar la contraseña.';
    
    if (error.code === 'auth/weak-password') {
      errorMessage = 'La nueva contraseña es muy débil. Debe tener al menos 6 caracteres.';
    } else if (error.code === 'auth/requires-recent-login') {
      errorMessage = 'Por seguridad, debes iniciar sesión nuevamente antes de cambiar la contraseña.';
    }
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Enviar email para restablecer contraseña
 * También exportado como sendPasswordResetEmail para compatibilidad
 */
export async function resetPassword(email: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error: any) {
    let errorMessage = 'Error al enviar el email de restablecimiento.';
    
    if (error.code === 'auth/user-not-found') {
      errorMessage = 'No existe una cuenta con este correo electrónico.';
    } else if (error.code === 'auth/invalid-email') {
      errorMessage = 'El correo electrónico no es válido.';
    }
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

// Exportar resetPassword también como sendPasswordResetEmail para compatibilidad
// Nota: sendPasswordResetEmail de Firebase está importado pero no exportado
export const sendPasswordResetEmailFn = resetPassword;

/**
 * Obtener usuario actual de Firebase Auth
 */
export function getCurrentUser(): FirebaseUser | null {
  return auth.currentUser;
}

/**
 * Escuchar cambios en el estado de autenticación
 */
export function onAuthStateChange(
  callback: (user: FirebaseUser | null) => void
): () => void {
  return onAuthStateChanged(auth, callback);
}

/**
 * Iniciar sesión o registrarse con Google
 */
export async function signInWithGoogle(): Promise<{
  success: boolean;
  user?: FirebaseUser;
  error?: string;
  isNewUser?: boolean;
}> {
  try {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const firebaseUser = userCredential.user;
    
    // Verificar si el usuario ya existe en Firestore
    const userResult = await getUser(firebaseUser.uid);
    const isNewUser = !userResult.data;

    // Si es un usuario nuevo, crear su perfil en Firestore
    if (isNewUser && firebaseUser.email) {
      // Extraer nombre y apellido del displayName
      const displayName = firebaseUser.displayName || '';
      const nameParts = displayName.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const createResult = await createUserWithId(firebaseUser.uid, {
        email: firebaseUser.email,
        firstName,
        lastName,
        phone: firebaseUser.phoneNumber || '',
        role: 'user',
        avatar: firebaseUser.photoURL || undefined,
      });

      if (!createResult.success) {
        // Si falla la creación en Firestore, cerrar sesión
        await signOut(auth);
        return {
          success: false,
          error: 'Error al crear el perfil de usuario. Por favor, intenta de nuevo.',
        };
      }
    }

    return {
      success: true,
      user: firebaseUser,
      isNewUser,
    };
  } catch (error: any) {
    let errorMessage = 'Error al iniciar sesión con Google. Por favor, intenta de nuevo.';
    
    if (error.code === 'auth/popup-closed-by-user') {
      errorMessage = 'El popup fue cerrado. Por favor, intenta de nuevo.';
    } else if (error.code === 'auth/popup-blocked') {
      errorMessage = 'El popup fue bloqueado. Por favor, permite popups para este sitio.';
    } else if (error.code === 'auth/cancelled-popup-request') {
      errorMessage = 'Solo se puede abrir un popup a la vez.';
    } else if (error.code === 'auth/account-exists-with-different-credential') {
      errorMessage = 'Ya existe una cuenta con este correo electrónico usando otro método de autenticación.';
    }
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Obtener datos completos del usuario desde Firestore
 */
export async function getCurrentUserData(): Promise<{
  success: boolean;
  user?: any;
  error?: string;
}> {
  try {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) {
      return {
        success: false,
        error: 'No hay usuario autenticado.',
      };
    }

    const userResult = await getUser(firebaseUser.uid);
    if (!userResult.data) {
      return {
        success: false,
        error: 'No se encontraron datos del usuario.',
      };
    }

    return {
      success: true,
      user: userResult.data,
    };
  } catch (error) {
    console.error('Error getting user data:', error);
    return {
      success: false,
      error: 'Error al obtener los datos del usuario.',
    };
  }
}

