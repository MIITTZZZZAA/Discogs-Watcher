import { useEffect, useState } from "react";

export function useLocalStorageArray(key: string, initial: number[] = []) {
  const [value, setValue] = useState<number[]>(() => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return initial;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed)
        ? parsed.map((n) => Number(n)).filter((n) => Number.isFinite(n))
        : initial;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
}
