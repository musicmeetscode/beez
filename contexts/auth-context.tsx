"use client";
import { createContext, useContext, useEffect, useState } from "react";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  createUserWithEmailAndPassword,
  type User,
} from "firebase/auth";
import { auth, isFirebaseConfigured } from "@/lib/firebase";
import { ensureUser } from "@/lib/data";
type Value = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  google: () => Promise<void>;
  logout: () => Promise<void>;
};
const C = createContext<Value | null>(null);
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(isFirebaseConfigured);
  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      try {
        if (u?.email) await ensureUser(u.uid, u.email);
      } finally {
        setLoading(false);
      }
    });
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
        signIn: async (e, p) => {
          await signInWithEmailAndPassword(need(), e, p);
        },
        signUp: async (e, p) => {
          await createUserWithEmailAndPassword(need(), e, p);
        },
        google: async () => {
          await signInWithPopup(need(), new GoogleAuthProvider());
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
