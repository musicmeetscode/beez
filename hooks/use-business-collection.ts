"use client";
import { useEffect, useState } from "react";
import { listenByBusiness } from "@/lib/data";
import { useBusiness } from "@/contexts/business-context";
export function useBusinessCollection<T extends { id: string }>(
  name: "clients" | "products" | "invoices" | "transactions",
) {
  const { activeBusinessId } = useBusiness();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(Boolean(activeBusinessId));
  const [error, setError] = useState("");
  useEffect(() => {
    if (!activeBusinessId) {
      setData([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    return listenByBusiness<T>(
      name,
      activeBusinessId,
      (rows) => {
        setData(rows);
        setLoading(false);
      },
      (e) => {
        setError(e.message);
        setLoading(false);
      },
    );
  }, [activeBusinessId, name]);
  return { data, loading, error };
}
