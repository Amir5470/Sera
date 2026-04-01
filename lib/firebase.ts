import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getApps, initializeApp } from 'firebase/app';
import {
  Auth,
  getAuth,
  // @ts-ignore
  getReactNativePersistence,
  initializeAuth
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD5qc8lvFdKq5Ir83nrYv6X6e5zbPL1_VI",
  authDomain: "sera-hq.firebaseapp.com",
  projectId: "sera-hq",
  storageBucket: "sera-hq.firebasestorage.app",
  messagingSenderId: "608393229921",
  appId: "1:608393229921:web:0045589a3e734e07e79c20",
};

// Check if a Firebase app is already initialized
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

let auth: Auth;

try {
  // Use initializeAuth with persistence to keep users logged in
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
  });
} catch (e) {
  auth = getAuth(app);
}

export { auth };
export const db = getFirestore(app);