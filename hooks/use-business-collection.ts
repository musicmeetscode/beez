"use client";
import { useEffect, useState } from "react";
import { listenByBusiness } from "@/lib/data";
import { useBusiness } from "@/contexts/business-context";
export function useBusinessCollection<T extends { id: string }>(
  name: "clients" | "products" | "invoices" | "transactions",
) {
  const { activeBusinessId, businesses } = useBusiness();
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
    setError("");
    if (activeBusinessId === "all") {
      if (!businesses.length) {
        setData([]);
        setLoading(false);
        return;
      }
      const snapshots = new Map<string, T[]>();
      const waiting = new Set(businesses.map((business) => business.id));
      const publish = () => {
        setData(
          Array.from(snapshots.values())
            .flat()
            .sort((a, b) => recordTime(b, name) - recordTime(a, name)),
        );
        if (!waiting.size) setLoading(false);
      };
      const unsubscribes = businesses.map((business) =>
        listenByBusiness<T>(
          name,
          business.id,
          (rows) => {
            snapshots.set(business.id, rows);
            waiting.delete(business.id);
            publish();
          },
          (e) => {
            waiting.delete(business.id);
            setError(e.message);
            publish();
          },
        ),
      );
      return () => unsubscribes.forEach((unsubscribe) => unsubscribe());
    }
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
  }, [activeBusinessId, businesses, name]);
  return { data, loading, error };
}

function recordTime<T>(row: T, name: string) {
  const value = (row as Record<string, { toMillis?: () => number }>)[
    name === "transactions" ? "paymentDate" : "createdAt"
  ];
  return value?.toMillis?.() || 0;
}
