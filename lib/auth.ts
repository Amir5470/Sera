import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth } from "./firebase";
import { checkAndRecordAttempt, getAttemptCount } from "./rateLimiter";

// Client-side guard: enforce max 5 attempts per 15 minutes per email identifier.
// Note: Server-side enforcement is required for true protection.
export const signUp = async (email: string, password: string) => {
  const allowed = await checkAndRecordAttempt(
    `auth:signup:${email.toLowerCase()}`,
  );
  if (!allowed) throw new Error("Too many signup attempts. Try again later.");
  return createUserWithEmailAndPassword(auth, email, password);
};

export const signIn = async (email: string, password: string) => {
  const allowed = await checkAndRecordAttempt(
    `auth:signin:${email.toLowerCase()}`,
  );
  if (!allowed) throw new Error("Too many sign-in attempts. Try again later.");
  return signInWithEmailAndPassword(auth, email, password);
};

export const logOut = async () => {
  await AsyncStorage.removeItem("sera_uid");
  return signOut(auth);
};

export const authAttemptCount = async (email: string) =>
  getAttemptCount(`auth:signin:${email.toLowerCase()}`);
