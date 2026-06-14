import * as SecureStore from 'expo-secure-store';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
export type Goal = 'lose' | 'maintain' | 'gain';
export type Gender = 'male' | 'female';

export type Profile = {
  name: string;
  gender: Gender;
  age: number;
  heightCm: number;
  weightKg: number;
  goal: Goal;
  activityLevel: ActivityLevel;
};

export type MacroGoals = {
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
};

const PROFILE_KEY = 'pt_profile_v1';

const DEFAULT_PROFILE: Profile = {
  name: '',
  gender: 'male',
  age: 30,
  heightCm: 175,
  weightKg: 75,
  goal: 'maintain',
  activityLevel: 'moderate',
};

async function storeGet(key: string): Promise<string | null> {
  if (Platform.OS === 'web') return localStorage.getItem(key);
  return SecureStore.getItemAsync(key);
}

async function storeSet(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') { localStorage.setItem(key, value); return; }
  return SecureStore.setItemAsync(key, value);
}

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

const GOAL_ADJUSTMENT: Record<Goal, number> = {
  lose: -500,
  maintain: 0,
  gain: 300,
};

export function calcMacroGoals(profile: Profile): MacroGoals {
  const { gender, age, heightCm, weightKg, activityLevel, goal } = profile;
  const bmr = gender === 'male'
    ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
    : 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
  const tdee = Math.round(bmr * ACTIVITY_MULTIPLIERS[activityLevel]);
  const kcal = Math.max(1200, tdee + GOAL_ADJUSTMENT[goal]);
  const proteinG = Math.round(weightKg * 2);
  const fatG = Math.round((kcal * 0.25) / 9);
  const carbsG = Math.round((kcal - proteinG * 4 - fatG * 9) / 4);
  return { kcal, proteinG, carbsG, fatG };
}

export function useProfile() {
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    storeGet(PROFILE_KEY).then((raw) => {
      if (raw) setProfile(JSON.parse(raw));
      setLoaded(true);
    });
  }, []);

  const saveProfile = useCallback(async (next: Profile) => {
    setProfile(next);
    await storeSet(PROFILE_KEY, JSON.stringify(next));
  }, []);

  const macros = calcMacroGoals(profile);

  return { profile, macros, loaded, saveProfile };
}
