import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const missingFirebaseKeys = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);

export const isFirebaseConfigured = missingFirebaseKeys.length === 0;

export class FirebaseConfigurationError extends Error {
  constructor() {
    super("Konfigurasi Firebase Web belum lengkap.");
    this.name = "FirebaseConfigurationError";
  }
}

let cached: { app: FirebaseApp; auth: Auth; db: Firestore } | null = null;

export function getFirebaseClient(): {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
} {
  if (!isFirebaseConfigured) throw new FirebaseConfigurationError();
  if (cached) return cached;

  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  cached = { app, auth: getAuth(app), db: getFirestore(app) };
  return cached;
}
