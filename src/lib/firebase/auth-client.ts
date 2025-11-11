"use client";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { z } from "zod";
import { getFirebaseAuth, getFirebaseDb } from "./client";
import {
  ALLOWED_EMAIL_DOMAIN,
  UNIVERSITY_NAME,
  UNIVERSITY_WEBMAIL_URL,
} from "@/lib/constants";

const signUpSchema = z.object({
  email: z
    .string()
    .email()
    .refine(
      (email) => email.endsWith(ALLOWED_EMAIL_DOMAIN),
      `Nur E-Mail-Adressen mit ${ALLOWED_EMAIL_DOMAIN} werden akzeptiert`,
    ),
  password: z.string().min(6, "Passwort muss mindestens 6 Zeichen lang sein"),
  firstName: z.string().min(2, "Vorname muss mindestens 2 Zeichen lang sein"),
  lastName: z.string().min(2, "Nachname muss mindestens 2 Zeichen lang sein"),
  studyField: z.string().min(2, "Studiengang muss mindestens 2 Zeichen lang sein"),
});

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Passwort ist erforderlich"),
});

export type SignUpPayload = z.infer<typeof signUpSchema>;
export type SignInPayload = z.infer<typeof signInSchema>;

export async function signUp(payload: SignUpPayload) {
  const parsed = signUpSchema.parse(payload);
  const auth = getFirebaseAuth();
  const db = getFirebaseDb();

  // Create user account
  const credential = await createUserWithEmailAndPassword(
    auth,
    parsed.email,
    parsed.password,
  );

  const displayName = `${parsed.firstName} ${parsed.lastName}`;

  // Update Firebase Auth Profile
  await updateProfile(credential.user, {
    displayName,
  });

  // Create Firestore user document
  await setDoc(doc(db, "users", credential.user.uid), {
    uid: credential.user.uid,
    firstName: parsed.firstName,
    lastName: parsed.lastName,
    displayName,
    email: parsed.email,
    university: UNIVERSITY_NAME,
    studyField: parsed.studyField,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Send email verification
  await sendEmailVerification(credential.user);

  // Open university webmail in new tab
  if (typeof window !== "undefined") {
    window.open(UNIVERSITY_WEBMAIL_URL, "_blank");
  }

  return credential.user;
}

export async function signIn(payload: SignInPayload) {
  const parsed = signInSchema.parse(payload);
  const auth = getFirebaseAuth();

  const credential = await signInWithEmailAndPassword(
    auth,
    parsed.email,
    parsed.password,
  );

  // Check if email is verified
  if (!credential.user.emailVerified) {
    // Sign out the user
    await signOut(auth);
    throw new Error(
      "Bitte bestätigen Sie zuerst Ihre E-Mail-Adresse. Prüfen Sie Ihr E-Mail-Postfach.",
    );
  }

  return credential.user;
}

export async function resendVerificationEmail() {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;

  if (!user) {
    throw new Error("Kein Benutzer angemeldet");
  }

  if (user.emailVerified) {
    throw new Error("E-Mail-Adresse ist bereits bestätigt");
  }

  await sendEmailVerification(user);

  // Open university webmail in new tab
  if (typeof window !== "undefined") {
    window.open(UNIVERSITY_WEBMAIL_URL, "_blank");
  }

  return { message: "Bestätigungs-E-Mail erneut gesendet" };
}

export async function sendPasswordResetEmail(email: string) {
  const auth = getFirebaseAuth();
  await firebaseSendPasswordResetEmail(auth, email);

  // Open university webmail in new tab
  if (typeof window !== "undefined") {
    window.open(UNIVERSITY_WEBMAIL_URL, "_blank");
  }

  return { message: "Passwort-Zurücksetzen-E-Mail gesendet" };
}

export async function updateUserProfile(payload: {
  uid: string;
  firstName: string;
  lastName: string;
  displayName: string;
  studyField: string;
}) {
  const db = getFirebaseDb();
  const auth = getFirebaseAuth();

  // Update Firebase Auth Profile
  if (auth.currentUser) {
    await updateProfile(auth.currentUser, {
      displayName: payload.displayName,
    });
  }

  // Update Firestore
  await updateDoc(doc(db, "users", payload.uid), {
    firstName: payload.firstName,
    lastName: payload.lastName,
    displayName: payload.displayName,
    studyField: payload.studyField,
    updatedAt: new Date().toISOString(),
  });
}

export async function logout() {
  const auth = getFirebaseAuth();
  await signOut(auth);
}
