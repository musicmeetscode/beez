"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { listenBusinesses } from "@/lib/data";
import { useAuth } from "./auth-context";
import type { Business } from "@/lib/types";
type Value = {
  businesses: Business[];
  activeBusinessId: string;
  activeBusiness: Business | null;
  setActiveBusinessId: (id: string) => void;
  loading: boolean;
  error: string;
};
const C = createContext<Value | null>(null);
export function BusinessProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [activeBusinessId, setActive] = useState("");
  const [loading, setLoading] = useState(Boolean(user));
  const [error, setError] = useState("");
  useEffect(() => {
    if (!user) {
      setBusinesses([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    return listenBusinesses(
      user.uid,
      (rows) => {
        setBusinesses(rows);
        setActive((id) =>
          rows.some((b) => b.id === id) ? id : rows[0]?.id || "",
        );
        setLoading(false);
      },
      (e) => {
        setError(e.message);
        setLoading(false);
      },
    );
  }, [user]);
  const value = useMemo(
    () => ({
      businesses,
      activeBusinessId,
      activeBusiness: businesses.find((b) => b.id === activeBusinessId) || null,
      setActiveBusinessId: setActive,
      loading,
      error,
    }),
    [businesses, activeBusinessId, loading, error],
  );
  return <C.Provider value={value}>{children}</C.Provider>;
}
export function useBusiness() {
  const v = useContext(C);
  if (!v) throw new Error("useBusiness must be used within BusinessProvider");
  return v;
}
