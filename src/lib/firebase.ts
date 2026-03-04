import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyA8WH9ZcvgDgNe-O9lswpyHHAW4s2Syr4c",
  authDomain: "eipet-171a7.firebaseapp.com",
  projectId: "eipet-171a7",
  storageBucket: "eipet-171a7.firebasestorage.app",
  messagingSenderId: "86684689322",
  appId: "1:86684689322:web:339903e273ca8bc91ec1d3",
  measurementId: "G-P6RF641PQH"
};

// Asegurar que siempre haya una app válida (getApps()[0] puede ser undefined en algunos entornos)
function getFirebaseApp(): FirebaseApp {
  const apps = getApps();
  const existing = apps[0];
  if (existing) return existing;
  return initializeApp(firebaseConfig);
}

const app = getFirebaseApp();

// Inicializar Firestore (client-side)
export const db: Firestore = getFirestore(app);

// Inicializar Auth (client-side) - TypeScript infiere el tipo automáticamente
export const auth = getAuth(app);

// Inicializar Storage (client-side)
export const storage: FirebaseStorage = getStorage(app);

export default app;
