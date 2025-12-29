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
  signInWithPhoneNumber,
  PhoneAuthProvider,
  signInWithCredential,
  RecaptchaVerifier,
  type User as FirebaseUser,
} from 'firebase/auth';
import { GoogleAuthProvider, FacebookAuthProvider } from 'firebase/auth';
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
    // Limpiar localStorage (el token ya no se usa, pero lo limpiamos por compatibilidad)
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

/**
 * Iniciar sesión con Google
 */
export async function loginWithGoogle(): Promise<{
  success: boolean;
  user?: FirebaseUser;
  error?: string;
}> {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const firebaseUser = result.user;

    // Verificar si el usuario ya existe en Firestore
    const userResult = await getUser(firebaseUser.uid);
    
    // Si no existe, crear el perfil en Firestore
    if (!userResult.data) {
      const displayName = firebaseUser.displayName || '';
      const nameParts = displayName.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      await createUserWithId(firebaseUser.uid, {
        email: firebaseUser.email || '',
        firstName,
        lastName,
        phone: firebaseUser.phoneNumber || '',
        role: 'user',
      });
    }

    return {
      success: true,
      user: firebaseUser,
    };
  } catch (error: any) {
    let errorMessage = 'Error al iniciar sesión con Google. Por favor, intenta de nuevo.';
    
    if (error.code === 'auth/popup-closed-by-user') {
      errorMessage = 'La ventana de autenticación fue cerrada.';
    } else if (error.code === 'auth/cancelled-popup-request') {
      errorMessage = 'Solo se puede abrir una ventana de autenticación a la vez.';
    } else if (error.code === 'auth/popup-blocked') {
      errorMessage = 'La ventana emergente fue bloqueada. Por favor, permite ventanas emergentes.';
    }
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Iniciar sesión con Facebook
 */
export async function loginWithFacebook(): Promise<{
  success: boolean;
  user?: FirebaseUser;
  error?: string;
}> {
  try {
    const provider = new FacebookAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const firebaseUser = result.user;

    // Verificar si el usuario ya existe en Firestore
    const userResult = await getUser(firebaseUser.uid);
    
    // Si no existe, crear el perfil en Firestore
    if (!userResult.data) {
      const displayName = firebaseUser.displayName || '';
      const nameParts = displayName.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      await createUserWithId(firebaseUser.uid, {
        email: firebaseUser.email || '',
        firstName,
        lastName,
        phone: firebaseUser.phoneNumber || '',
        role: 'user',
      });
    }

    return {
      success: true,
      user: firebaseUser,
    };
  } catch (error: any) {
    let errorMessage = 'Error al iniciar sesión con Facebook. Por favor, intenta de nuevo.';
    
    if (error.code === 'auth/popup-closed-by-user') {
      errorMessage = 'La ventana de autenticación fue cerrada.';
    } else if (error.code === 'auth/cancelled-popup-request') {
      errorMessage = 'Solo se puede abrir una ventana de autenticación a la vez.';
    } else if (error.code === 'auth/popup-blocked') {
      errorMessage = 'La ventana emergente fue bloqueada. Por favor, permite ventanas emergentes.';
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
 * Iniciar sesión con SMS (teléfono)
 */
export async function sendSMSVerificationCode(
  phoneNumber: string,
  recaptchaVerifier: RecaptchaVerifier
): Promise<{
  success: boolean;
  confirmationResult?: any;
  error?: string;
}> {
  try {
    // Limpiar espacios y caracteres no numéricos excepto el +
    let cleanedPhone = phoneNumber.trim().replace(/\s/g, '');
    
    // Asegurarse de que el número de teléfono tenga el formato correcto (E.164)
    // Debe comenzar con + seguido del código de país
    if (!cleanedPhone.startsWith('+')) {
      // Si no tiene +, intentar agregarlo asumiendo que el primer número es parte del código de país
      cleanedPhone = `+${cleanedPhone}`;
    }
    
    // Validación básica del formato E.164 (máximo 15 dígitos después del +)
    const e164Pattern = /^\+[1-9]\d{1,14}$/;
    if (!e164Pattern.test(cleanedPhone)) {
      return {
        success: false,
        error: 'El número de teléfono no tiene un formato válido. Debe incluir el código de país (ej: +591 70000000).',
      };
    }
    
    const confirmationResult = await signInWithPhoneNumber(auth, cleanedPhone, recaptchaVerifier);
    return {
      success: true,
      confirmationResult,
    };
  } catch (error: any) {
    console.error('sendSMSVerificationCode error:', error);
    let errorMessage = 'Error al enviar el código de verificación. Por favor, intenta de nuevo.';
    
    if (error.code === 'auth/invalid-phone-number') {
      errorMessage = 'El número de teléfono no es válido. Asegúrate de incluir el código de país (ej: +591 70000000).';
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = 'Demasiados intentos de verificación. Por favor, espera unos minutos antes de intentar de nuevo.';
    } else if (error.code === 'auth/captcha-check-failed') {
      errorMessage = 'Error en la verificación reCAPTCHA. Por favor, recarga la página e intenta de nuevo.';
    } else if (error.code === 'auth/quota-exceeded') {
      errorMessage = 'Se ha excedido la cuota de SMS. Por favor, intenta más tarde.';
    } else if (error.code === 'auth/session-expired') {
      errorMessage = 'La sesión de verificación ha expirado. Por favor, intenta de nuevo.';
    } else if (error.code === 'auth/app-not-authorized') {
      errorMessage = 'La aplicación no está autorizada. Por favor, contacta al soporte.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Verificar código SMS y completar autenticación
 */
export async function verifySMSCode(
  confirmationResult: any,
  code: string
): Promise<{
  success: boolean;
  user?: FirebaseUser;
  error?: string;
}> {
  try {
    const result = await confirmationResult.confirm(code);
    const firebaseUser = result.user;

    // Verificar si el usuario ya existe en Firestore
    const userResult = await getUser(firebaseUser.uid);
    
    // Si no existe, crear el perfil en Firestore
    if (!userResult.data) {
      await createUserWithId(firebaseUser.uid, {
        email: firebaseUser.email || '',
        firstName: '',
        lastName: '',
        phone: firebaseUser.phoneNumber || '',
        role: 'user',
      });
    }

    return {
      success: true,
      user: firebaseUser,
    };
  } catch (error: any) {
    let errorMessage = 'Código de verificación incorrecto. Por favor, intenta de nuevo.';
    
    if (error.code === 'auth/invalid-verification-code') {
      errorMessage = 'El código de verificación es incorrecto.';
    } else if (error.code === 'auth/code-expired') {
      errorMessage = 'El código de verificación ha expirado. Por favor, solicita uno nuevo.';
    }
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

