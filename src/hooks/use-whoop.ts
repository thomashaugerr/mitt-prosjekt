import * as AuthSession from 'expo-auth-session';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';

WebBrowser.maybeCompleteAuthSession();

const CLIENT_ID = process.env.EXPO_PUBLIC_WHOOP_CLIENT_ID ?? '';
const AUTH_URL = 'https://api.prod.whoop.com/oauth/oauth2/auth';
const TOKEN_URL = 'https://api.prod.whoop.com/oauth/oauth2/token';
const SCOPES = ['read:profile', 'read:recovery', 'read:sleep', 'read:cycles', 'offline'];

const TOKEN_KEY = 'pt_whoop_tokens_v1';
const SECRET_KEY = 'pt_whoop_secret_v1';

type WhoopTokens = { accessToken: string; refreshToken: string; expiresAt: number };

export type WhoopRecovery = {
  score: number;
  hrv: number;
  restingHr: number;
  date: string;
};

export type WhoopSleep = {
  score: number;
  durationHours: number;
  date: string;
};

export type WhoopStrain = {
  score: number;
  kilojoules: number;
  date: string;
};

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

async function fetchWithAuth(url: string, tokens: WhoopTokens) {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${tokens.accessToken}` },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`WHOOP ${res.status}: ${body}`);
  }
  return res.json();
}

export function useWhoop() {
  const [tokens, setTokens] = useState<WhoopTokens | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [recovery, setRecovery] = useState<WhoopRecovery | null>(null);
  const [sleep, setSleep] = useState<WhoopSleep | null>(null);
  const [strain, setStrain] = useState<WhoopStrain | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redirectUri = 'pt-app://callback';

  const discovery = {
    authorizationEndpoint: AUTH_URL,
    tokenEndpoint: TOKEN_URL,
  };

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: CLIENT_ID,
      scopes: SCOPES,
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
      usePKCE: true,
    },
    discovery
  );

  // Load saved tokens and secret on mount
  useEffect(() => {
    Promise.all([storeGet(TOKEN_KEY), storeGet(SECRET_KEY)]).then(([rawTokens, rawSecret]) => {
      if (rawTokens) setTokens(JSON.parse(rawTokens));
      if (rawSecret) setClientSecret(rawSecret);
    });
  }, []);

  // Handle OAuth response
  useEffect(() => {
    if (response?.type !== 'success') return;
    const { code } = response.params;

    (async () => {
      setLoading(true);
      try {
        const body = new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: redirectUri,
          code_verifier: request?.codeVerifier ?? '',
          client_id: CLIENT_ID,
          client_secret: clientSecret ?? '',
        });
        const res = await fetch(TOKEN_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: body.toString(),
        });
        const data = await res.json();
        if (!res.ok || !data.access_token) {
          throw new Error(data.error_description ?? data.error ?? `Token exchange ${res.status}`);
        }
        const t: WhoopTokens = {
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          expiresAt: Date.now() + data.expires_in * 1000,
        };
        await storeSet(TOKEN_KEY, JSON.stringify(t));
        setTokens(t);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error('WHOOP token exchange feilet:', msg);
        setError(`Tilkobling til WHOOP feilet: ${msg}`);
      } finally {
        setLoading(false);
      }
    })();
  }, [response]);

  const fetchData = useCallback(async () => {
    if (!tokens) return;
    setLoading(true);
    setError(null);
    try {
      const [recData, sleepData, cycleData] = await Promise.all([
        fetchWithAuth('https://api.prod.whoop.com/developer/v1/recovery?limit=1', tokens),
        fetchWithAuth('https://api.prod.whoop.com/developer/v1/sleep?limit=1', tokens),
        fetchWithAuth('https://api.prod.whoop.com/developer/v1/cycle?limit=1', tokens),
      ]);

      const rec = recData.records?.[0];
      if (rec) {
        setRecovery({
          score: Math.round(rec.score.recovery_score),
          hrv: Math.round(rec.score.hrv_rmssd_milli),
          restingHr: Math.round(rec.score.resting_heart_rate),
          date: rec.created_at,
        });
      }

      const sl = sleepData.records?.[0];
      if (sl) {
        const durationMs = new Date(sl.end).getTime() - new Date(sl.start).getTime();
        setSleep({
          score: Math.round(sl.score?.sleep_efficiency_percentage ?? 0),
          durationHours: Math.round((durationMs / 3600000) * 10) / 10,
          date: sl.start,
        });
      }

      const cy = cycleData.records?.[0];
      if (cy) {
        setStrain({
          score: Math.round(cy.score.strain * 10) / 10,
          kilojoules: Math.round(cy.score.kilojoule),
          date: cy.start,
        });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('WHOOP fetchData feilet:', msg);
      setError(`Kunne ikke hente WHOOP-data: ${msg}`);
    } finally {
      setLoading(false);
    }
  }, [tokens]);

  useEffect(() => {
    if (tokens) fetchData();
  }, [tokens]);

  const connect = useCallback(async (secret: string) => {
    await storeSet(SECRET_KEY, secret);
    setClientSecret(secret);
    promptAsync();
  }, [promptAsync]);

  const disconnect = useCallback(async () => {
    await Promise.all([storeDel(TOKEN_KEY), storeDel(SECRET_KEY)]);
    setTokens(null);
    setClientSecret(null);
    setRecovery(null);
    setSleep(null);
    setStrain(null);
  }, []);

  const kcalBurned = strain ? Math.round(strain.kilojoules / 4.184) : 0;

  return {
    connected: !!tokens,
    hasSecret: !!clientSecret,
    recovery,
    sleep,
    strain,
    kcalBurned,
    loading,
    error,
    connect,
    disconnect,
    refresh: fetchData,
  };
}
