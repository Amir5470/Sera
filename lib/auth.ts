import AsyncStorage from '@react-native-async-storage/async-storage'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { auth } from './firebase'

export const signUp = (email: string, password: string) =>
  createUserWithEmailAndPassword(auth, email, password)

export const signIn = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email, password)

export const logOut = async () => {
  await AsyncStorage.removeItem('sera_uid')
  return signOut(auth)
}