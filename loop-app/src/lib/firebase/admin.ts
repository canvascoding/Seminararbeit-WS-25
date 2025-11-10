import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAdminCredentials } from "@/lib/env";

const credentials = getAdminCredentials();

export const isFirebaseAdminConfigured = Boolean(credentials);

export function getAdminApp() {
  if (!isFirebaseAdminConfigured || !credentials) {
    throw new Error("Firebase Admin ist nicht konfiguriert.");
  }

  if (getApps().length) {
    try {
      return getApp();
    } catch {
      // ignored
    }
  }

  return initializeApp({
    credential: cert({
      projectId: credentials.projectId,
      clientEmail: credentials.clientEmail,
      privateKey: credentials.privateKey,
    }),
  });
}

export function getAdminDb() {
  return getFirestore(getAdminApp());
}
