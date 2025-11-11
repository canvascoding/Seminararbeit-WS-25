"use client";

import {
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  User,
  onAuthStateChanged,
  type Unsubscribe,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import type { UserProfile } from "@/types/domain";
import {
  getFirebaseAuth,
  getFirebaseDb,
  firebaseClientReady,
} from "@/lib/firebase/client";
import { UNIVERSITY_NAME } from "@/lib/constants";

interface AuthContextValue {
  firebaseUser: User | null;
  profile: UserProfile | null;
  loading: boolean;
  mockMode: boolean;
  error?: string;
}

const AuthContext = createContext<AuthContextValue>({
  firebaseUser: null,
  profile: null,
  loading: true,
  mockMode: false,
});

export function AuthProvider({ children }: PropsWithChildren) {
  const clientActive = firebaseClientReady();
  const [state, setState] = useState<AuthContextValue>({
    firebaseUser: null,
    profile: null,
    loading: clientActive,
    mockMode: !clientActive,
    error: !clientActive
      ? "Firebase-Konfiguration fehlt. Demo-Daten aktiv."
      : undefined,
  });

  useEffect(() => {
    if (!clientActive) return;

    const auth = getFirebaseAuth();
    const db = getFirebaseDb();

    const unsubscribe: Unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setState({
          firebaseUser: null,
          profile: null,
          loading: false,
          mockMode: false,
        });
        return;
      }

      // Don't load profile if email is not verified
      if (!firebaseUser.emailVerified) {
        setState({
          firebaseUser,
          profile: null,
          loading: false,
          mockMode: false,
        });
        return;
      }

      const profileRef = doc(db, "users", firebaseUser.uid);
      const snapshot = await getDoc(profileRef);
      let profile: UserProfile;

      if (!snapshot.exists()) {
        // Wait briefly in case the profile is being created by signUp()
        await new Promise((resolve) => setTimeout(resolve, 500));
        const retrySnapshot = await getDoc(profileRef);

        if (!retrySnapshot.exists()) {
          // Profile still doesn't exist - create fallback
          const displayName = firebaseUser.displayName ?? "";
          const nameParts = displayName.split(" ");
          profile = {
            uid: firebaseUser.uid,
            firstName: nameParts[0] ?? "",
            lastName: nameParts.slice(1).join(" ") || "",
            displayName: displayName,
            email: firebaseUser.email ?? "",
            university: UNIVERSITY_NAME,
            studyField: "",
          };
          await setDoc(profileRef, {
            ...profile,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        } else {
          profile = retrySnapshot.data() as UserProfile;
        }
      } else {
        profile = snapshot.data() as UserProfile;
      }

      setState({
        firebaseUser,
        profile,
        loading: false,
        mockMode: false,
      });
    });

    return () => unsubscribe();
  }, [clientActive]);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
