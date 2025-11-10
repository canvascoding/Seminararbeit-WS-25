"use client";

import {
  createUserWithEmailAndPassword,
  sendSignInLinkToEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, updateDoc } from "firebase/firestore";
import { z } from "zod";
import { getFirebaseAuth, getFirebaseDb } from "./client";

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(10),
  name: z.string().min(2),
  university: z.string().min(2),
  studyField: z.string().optional(),
});

const magicLinkSchema = z.object({
  email: z.string().email(),
});

export type SignUpPayload = z.infer<typeof signUpSchema>;

export async function signUp(payload: SignUpPayload) {
  const parsed = signUpSchema.parse(payload);
  const auth = getFirebaseAuth();
  const db = getFirebaseDb();
  const credential = await createUserWithEmailAndPassword(
    auth,
    parsed.email,
    parsed.password,
  );

  await updateProfile(credential.user, {
    displayName: parsed.name,
  });

  // Wichtig: Erst Firestore-Dokument schreiben, dann wird der AuthProvider getriggert
  await setDoc(doc(db, "users", credential.user.uid), {
    displayName: parsed.name,
    email: parsed.email,
    university: parsed.university,
    studyField: parsed.studyField ?? null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  return credential.user;
}

export async function signIn(email: string, password: string) {
  const auth = getFirebaseAuth();
  return signInWithEmailAndPassword(auth, email, password);
}

export async function sendMagicLink(email: string) {
  const parsed = magicLinkSchema.parse({ email });
  const auth = getFirebaseAuth();
  await sendSignInLinkToEmail(auth, parsed.email, {
    url:
      typeof window !== "undefined"
        ? `${window.location.origin}/checkin`
        : "https://loop.app/checkin",
    handleCodeInApp: true,
  });
  return { message: "Link gesendet" };
}

export async function updateUserProfile(payload: {
  uid: string;
  displayName: string;
  studyField?: string;
}) {
  const db = getFirebaseDb();
  await updateDoc(doc(db, "users", payload.uid), {
    displayName: payload.displayName,
    studyField: payload.studyField ?? null,
    updatedAt: new Date().toISOString(),
  });
}

export async function logout() {
  const auth = getFirebaseAuth();
  await signOut(auth);
}
