import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';

export type FoodEntry = {
  id: string;
  name: string;
  portionG: number;
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  addedAt: string;
};

export type FoodLog = {
  date: string;
  entries: FoodEntry[];
};

function todayKey() {
  const d = new Date();
  return `pt_food_${d.getFullYear()}_${d.getMonth() + 1}_${d.getDate()}`;
}

async function storeGet(key: string): Promise<string | null> {
  if (Platform.OS === 'web') return localStorage.getItem(key);
  return SecureStore.getItemAsync(key);
}

async function storeSet(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') { localStorage.setItem(key, value); return; }
  return SecureStore.setItemAsync(key, value);
}

async function storeDel(key: string): Promise<void> {
  if (Platform.OS === 'web') { localStorage.removeItem(key); return; }
  return SecureStore.deleteItemAsync(key);
}

export function useFoodLog() {
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  const key = todayKey();

  useEffect(() => {
    storeGet(key).then((raw) => {
      if (raw) setEntries(JSON.parse(raw));
      setLoaded(true);
    });
  }, [key]);

  const addEntry = useCallback(async (entry: Omit<FoodEntry, 'id' | 'addedAt'>) => {
    const next: FoodEntry = {
      ...entry,
      id: Date.now().toString(),
      addedAt: new Date().toISOString(),
    };
    setEntries((prev) => {
      const updated = [...prev, next];
      storeSet(key, JSON.stringify(updated));
      return updated;
    });
  }, [key]);

  const removeEntry = useCallback(async (id: string) => {
    setEntries((prev) => {
      const updated = prev.filter((e) => e.id !== id);
      storeSet(key, JSON.stringify(updated));
      return updated;
    });
  }, [key]);

  const totals = entries.reduce(
    (acc, e) => ({
      kcal: acc.kcal + e.kcal,
      proteinG: acc.proteinG + e.proteinG,
      carbsG: acc.carbsG + e.carbsG,
      fatG: acc.fatG + e.fatG,
    }),
    { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 }
  );

  return { entries, totals, loaded, addEntry, removeEntry };
}
