import { getApps, initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyD5qc8lvFdKq5Ir83nrYv6X6e5zbPL1_VI",
  authDomain: "sera-hq.firebaseapp.com",
  projectId: "sera-hq",
  storageBucket: "sera-hq.firebasestorage.app",
  messagingSenderId: "608393229921",
  appId: "1:608393229921:web:0045589a3e734e07e79c20",
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

export const auth = getAuth(app)
export const db = getFirestore(app)