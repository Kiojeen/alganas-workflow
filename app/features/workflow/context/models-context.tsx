import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  DEFAULT_CATALOG,
  loadProviderCatalog,
  type CatalogModel,
  type ProviderId,
} from "../lib/provider-models";

type ProviderKeys = Record<ProviderId, string>;

type ModelsContextValue = {
  keys: ProviderKeys;
  setKey: (provider: ProviderId, key: string) => void;
  models: CatalogModel[];
};

const ModelsContext = createContext<ModelsContextValue | null>(null);

const STORAGE_KEY = "alganas-provider-keys";
const LEGACY_STORAGE_KEY = "alganas-models";
const EMPTY_KEYS: ProviderKeys = { openai: "", google: "" };

function loadKeys(): ProviderKeys {
  if (typeof window === "undefined") return EMPTY_KEYS;
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as Partial<ProviderKeys>;
      return {
        openai: parsed.openai ?? "",
        google: parsed.google ?? "",
      };
    }
    const legacy = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy) {
      const parsed = JSON.parse(legacy) as { name?: string; key?: string }[];
      if (Array.isArray(parsed)) {
        const keys = { ...EMPTY_KEYS };
        for (const item of parsed) {
          const name = item.name ?? "";
          const key = item.key ?? "";
          if (!key) continue;
          if (/gpt|openai|dall/i.test(name)) keys.openai = key;
          if (/gemini|google|imagen/i.test(name)) keys.google = key;
        }
        return keys;
      }
    }
  } catch {
    // ignore malformed storage
  }
  return EMPTY_KEYS;
}

export function ModelsProvider({ children }: { children: ReactNode }) {
  const [keys, setKeys] = useState<ProviderKeys>(loadKeys);
  const [models, setModels] = useState<CatalogModel[]>(DEFAULT_CATALOG);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
  }, [keys]);

  useEffect(() => {
    let cancelled = false;
    void loadProviderCatalog(keys).then((next) => {
      if (!cancelled) setModels(next);
    });
    return () => {
      cancelled = true;
    };
  }, [keys]);

  const setKey = useCallback((provider: ProviderId, key: string) => {
    setKeys((prev) => ({ ...prev, [provider]: key }));
  }, []);

  return (
    <ModelsContext.Provider value={{ keys, setKey, models }}>
      {children}
    </ModelsContext.Provider>
  );
}

export function useModels() {
  const ctx = useContext(ModelsContext);
  if (!ctx) throw new Error("useModels must be used within a ModelsProvider");
  return ctx;
}
