import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { clientEnv, isFirebaseClientConfigured } from "@/lib/env";

let app: FirebaseApp | undefined;

export function getFirebaseApp() {
  if (app) return app;
  if (!isFirebaseClientConfigured || !clientEnv) {
    throw new Error("Firebase Client ist nicht konfiguriert.");
  }

  app = getApps().length ? getApp() : initializeApp(clientEnv);
  return app;
}

export const firebaseClientReady = () =>
  Boolean(isFirebaseClientConfigured && clientEnv);

export function getFirebaseAuth() {
  return getAuth(getFirebaseApp());
}

export function getFirebaseDb() {
  return getFirestore(getFirebaseApp());
}
