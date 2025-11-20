import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { getStorage, FirebaseStorage } from 'firebase/storage';

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
let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Inicializar Firestore (client-side)
export const db: Firestore = getFirestore(app);

// Inicializar Auth (client-side)
export const auth: Auth = getAuth(app);

// Inicializar Storage (client-side)
export const storage: FirebaseStorage = getStorage(app);

export default app;
