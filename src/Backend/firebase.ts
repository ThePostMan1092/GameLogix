// src/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyDTz5jYgDLYwprMuQ8Bz-hNgm9ZtoF2Yvg",
  authDomain: "scorefolio-10a5a.firebaseapp.com",
  projectId: "scorefolio-10a5a",
  storageBucket: "scorefolio-10a5a.appspot.com",
  messagingSenderId: "82479186719",
  appId: "1:82479186719:web:e5c165859ab2f4a22a662a",
  measurementId: "G-GBD4H8VBMD"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
