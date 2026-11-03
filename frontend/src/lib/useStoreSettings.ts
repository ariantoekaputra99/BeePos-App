import { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { StoreSettings } from '../types/api';

// Module-level cache so the POS screen and receipts don't refetch settings on every render/mount.
let cache: StoreSettings | null = null;
let inflight: Promise<StoreSettings> | null = null;
const listeners = new Set<(s: StoreSettings) => void>();

export function loadStoreSettings(force = false): Promise<StoreSettings> {
  if (cache && !force) return Promise.resolve(cache);
  if (!inflight || force) {
    inflight = api.settings().then((s) => {
      cache = s;
      listeners.forEach((l) => l(s));
      return s;
    }).finally(() => { inflight = null; });
  }
  return inflight;
}

/** Call after saving settings so every open screen picks up the new values. */
export function setStoreSettingsCache(s: StoreSettings) {
  cache = s;
  listeners.forEach((l) => l(s));
}

export function clearStoreSettingsCache() {
  cache = null;
}

export function useStoreSettings() {
  const [settings, setSettings] = useState<StoreSettings | null>(cache);
  useEffect(() => {
    listeners.add(setSettings);
    void loadStoreSettings().then(setSettings).catch(() => {});
    return () => { listeners.delete(setSettings); };
  }, []);
  return settings;
}
