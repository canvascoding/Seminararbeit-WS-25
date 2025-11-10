import { z } from "zod";

const clientSchema = z.object({
  apiKey: z.string().min(1),
  authDomain: z.string().min(1),
  projectId: z.string().min(1),
  storageBucket: z.string().min(1),
  messagingSenderId: z.string().min(1),
  appId: z.string().min(1),
  measurementId: z.string().optional(),
  mapsApiKey: z.string().optional(),
});

const maybeClientEnv = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  mapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
};

export type ClientEnv = z.infer<typeof clientSchema>;

export const isFirebaseClientConfigured = Object.values({
  apiKey: maybeClientEnv.apiKey,
  authDomain: maybeClientEnv.authDomain,
  projectId: maybeClientEnv.projectId,
  storageBucket: maybeClientEnv.storageBucket,
  messagingSenderId: maybeClientEnv.messagingSenderId,
  appId: maybeClientEnv.appId,
}).every(Boolean);

export const clientEnv = isFirebaseClientConfigured
  ? clientSchema.parse(maybeClientEnv)
  : undefined;

const adminSchema = z.object({
  projectId: z.string(),
  clientEmail: z.string(),
  privateKey: z.string(),
});

export type AdminCredentials = z.infer<typeof adminSchema>;

export function getAdminCredentials(): AdminCredentials | undefined {
  const raw = process.env.FIREBASE_ADMIN_CREDENTIALS;
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw);
    return adminSchema.parse(parsed);
  } catch {
    return undefined;
  }
}
