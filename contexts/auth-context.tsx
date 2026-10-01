"use client";
import { createContext, useContext, useEffect, useState } from "react";
import {
  browserLocalPersistence,
  GoogleAuthProvider,
  onAuthStateChanged,
  setPersistence,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { auth, isFirebaseConfigured } from "@/lib/firebase";
import { ensureUser } from "@/lib/data";
type Value = {
  user: User | null;
  loading: boolean;
  google: () => Promise<void>;
  logout: () => Promise<void>;
};
const C = createContext<Value | null>(null);
const googleProvider = new GoogleAuthProvider();

function isInvalidGoogleCredential(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "auth/invalid-credential"
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(isFirebaseConfigured);
  useEffect(() => {
    const firebaseAuth = auth;
    if (!firebaseAuth) {
      setLoading(false);
      return;
    }
    let active = true;
    let stopListening: () => void = () => {};
    void setPersistence(firebaseAuth, browserLocalPersistence)
      .catch(() => undefined)
      .finally(() => {
        if (!active) return;
        stopListening = onAuthStateChanged(firebaseAuth, async (u) => {
          setUser(u);
          try {
            if (u?.email) await ensureUser(u.uid, u.email);
          } catch (error) {
            // Offline sign-ins restore from cache; the profile syncs next time.
            console.warn("Could not sync user profile", error);
          } finally {
            setLoading(false);
          }
        });
      });
    return () => {
      active = false;
      stopListening();
    };
  }, []);
  const need = () => {
    if (!auth) throw new Error("Firebase is not configured.");
    return auth;
  };
  return (
    <C.Provider
      value={{
        user,
        loading,
        google: async () => {
          const firebaseAuth = need();
          await setPersistence(firebaseAuth, browserLocalPersistence);
          try {
            await signInWithPopup(firebaseAuth, googleProvider);
          } catch (error) {
            if (isInvalidGoogleCredential(error)) {
              throw new Error(
                "Google could not validate this account. Please try again; your Beez session will remain saved after a successful sign-in.",
              );
            }
            throw error;
          }
        },
        logout: async () => {
          await signOut(need());
        },
      }}
    >
      {children}
    </C.Provider>
  );
}
export function useAuth() {
  const v = useContext(C);
  if (!v) throw new Error("useAuth must be used within AuthProvider");
  return v;
}
