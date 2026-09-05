"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { listenExpenses } from "@/lib/data";
import type { Expense } from "@/lib/types";

export function useExpenses() {
  const { user } = useAuth();
  const [data, setData] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(Boolean(user));
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) {
      setData([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    return listenExpenses(
      user.uid,
      (rows) => {
        setData(rows);
        setError("");
        setLoading(false);
      },
      (reason) => {
        setError(reason.message);
        setLoading(false);
      },
    );
  }, [user]);

  return { data, loading, error };
}
