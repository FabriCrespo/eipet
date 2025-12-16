import { initializeApp, getApps } from 'firebase/app';
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

// Inicializar Firebase solo si no está ya inicializado
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Inicializar Firestore (client-side)
export const db: Firestore = getFirestore(app);

// Inicializar Auth (client-side) - TypeScript infiere el tipo automáticamente
export const auth = getAuth(app);

// Inicializar Storage (client-side)
export const storage: FirebaseStorage = getStorage(app);

export default app;
