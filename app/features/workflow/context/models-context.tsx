import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  DEFAULT_STRIPE_LAYOUT_A4,
  DEFAULT_STRIPE_LAYOUT_A5,
  PAGES_PER_SPINE_CM,
  type StripeLayoutCm,
} from "../lib/cover-layout";
import {
  DEFAULT_CATALOG,
  loadProviderCatalog,
  type CatalogModel,
  type ProviderId,
} from "../lib/provider-models";
import { DEFAULT_GENERATE_PROMPT } from "../state";

type ProviderKeys = Record<ProviderId, string>;

export type SavedPrompt = {
  id: string;
  name: string;
  text: string;
};

type ModelsContextValue = {
  keys: ProviderKeys;
  setKey: (provider: ProviderId, key: string) => void;
  models: CatalogModel[];
  prompts: SavedPrompt[];
  addPrompt: () => void;
  updatePrompt: (id: string, patch: Partial<Pick<SavedPrompt, "name" | "text">>) => void;
  removePrompt: (id: string) => void;
  pagesPerSpineCm: number;
  setPagesPerSpineCm: (value: number) => void;
  stripeA4: StripeLayoutCm;
  stripeA5: StripeLayoutCm;
  updateStripeA4: (patch: Partial<StripeLayoutCm>) => void;
  updateStripeA5: (patch: Partial<StripeLayoutCm>) => void;
};

const ModelsContext = createContext<ModelsContextValue | null>(null);

const STORAGE_KEY = "alganas-provider-keys";
const PREFS_STORAGE_KEY = "alganas-prefs";
const LEGACY_STORAGE_KEY = "alganas-models";
const EMPTY_KEYS: ProviderKeys = { openai: "", google: "" };

const DEFAULT_PROMPTS: SavedPrompt[] = [
  {
    id: "default-extend",
    name: "تمديد الغلاف",
    text: DEFAULT_GENERATE_PROMPT,
  },
];

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

function parseStripe(
  stored: Partial<StripeLayoutCm> | undefined,
  legacyWidth: number | undefined,
  fallback: StripeLayoutCm,
  oldDefaultWidth: number,
): StripeLayoutCm {
  const widthRaw = stored?.widthCm ?? legacyWidth;
  const width =
    typeof widthRaw === "number" &&
    widthRaw > 0 &&
    widthRaw !== oldDefaultWidth
      ? widthRaw
      : fallback.widthCm;
  return {
    widthCm: width,
    insetCm:
      typeof stored?.insetCm === "number" && stored.insetCm > 0
        ? stored.insetCm
        : fallback.insetCm,
    edgeGapCm:
      typeof stored?.edgeGapCm === "number" && stored.edgeGapCm > 0
        ? stored.edgeGapCm
        : fallback.edgeGapCm,
  };
}

function loadPrefs(): {
  prompts: SavedPrompt[];
  pagesPerSpineCm: number;
  stripeA4: StripeLayoutCm;
  stripeA5: StripeLayoutCm;
} {
  const fallback = {
    prompts: DEFAULT_PROMPTS,
    pagesPerSpineCm: PAGES_PER_SPINE_CM,
    stripeA4: { ...DEFAULT_STRIPE_LAYOUT_A4 },
    stripeA5: { ...DEFAULT_STRIPE_LAYOUT_A5 },
  };
  if (typeof window === "undefined") return fallback;
  try {
    const saved = window.localStorage.getItem(PREFS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as {
        prompts?: SavedPrompt[];
        pagesPerSpineCm?: number;
        stripeWidthA4Cm?: number;
        stripeWidthA5Cm?: number;
        stripeA4?: Partial<StripeLayoutCm>;
        stripeA5?: Partial<StripeLayoutCm>;
      };
      const prompts = Array.isArray(parsed.prompts)
        ? parsed.prompts
            .filter(
              (item) =>
                item &&
                typeof item.id === "string" &&
                typeof item.name === "string" &&
                typeof item.text === "string",
            )
            .map((item) => ({
              id: item.id,
              name: item.name,
              text: item.text,
            }))
        : DEFAULT_PROMPTS;
      return {
        prompts: prompts.length > 0 ? prompts : DEFAULT_PROMPTS,
        pagesPerSpineCm:
          typeof parsed.pagesPerSpineCm === "number" && parsed.pagesPerSpineCm > 0
            ? parsed.pagesPerSpineCm
            : PAGES_PER_SPINE_CM,
        stripeA4: parseStripe(
          parsed.stripeA4,
          parsed.stripeWidthA4Cm,
          fallback.stripeA4,
          15,
        ),
        stripeA5: parseStripe(
          parsed.stripeA5,
          parsed.stripeWidthA5Cm,
          fallback.stripeA5,
          10.6,
        ),
      };
    }
  } catch {
    // ignore malformed storage
  }
  return fallback;
}

export function ModelsProvider({ children }: { children: ReactNode }) {
  const [keys, setKeys] = useState<ProviderKeys>(loadKeys);
  const [models, setModels] = useState<CatalogModel[]>(DEFAULT_CATALOG);
  const [prompts, setPrompts] = useState<SavedPrompt[]>(
    () => loadPrefs().prompts,
  );
  const [pagesPerSpineCm, setPagesPerSpineCmState] = useState(
    () => loadPrefs().pagesPerSpineCm,
  );
  const [stripeA4, setStripeA4] = useState<StripeLayoutCm>(
    () => loadPrefs().stripeA4,
  );
  const [stripeA5, setStripeA5] = useState<StripeLayoutCm>(
    () => loadPrefs().stripeA5,
  );

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
  }, [keys]);

  useEffect(() => {
    window.localStorage.setItem(
      PREFS_STORAGE_KEY,
      JSON.stringify({
        prompts,
        pagesPerSpineCm,
        stripeA4,
        stripeA5,
      }),
    );
  }, [prompts, pagesPerSpineCm, stripeA4, stripeA5]);

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

  const addPrompt = useCallback(() => {
    setPrompts((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        name: `تعليمات ${prev.length + 1}`,
        text: "",
      },
    ]);
  }, []);

  const updatePrompt = useCallback(
    (id: string, patch: Partial<Pick<SavedPrompt, "name" | "text">>) => {
      setPrompts((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...patch } : item)),
      );
    },
    [],
  );

  const removePrompt = useCallback((id: string) => {
    setPrompts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const setPagesPerSpineCm = useCallback((value: number) => {
    setPagesPerSpineCmState(Math.max(1, value));
  }, []);

  const updateStripeA4 = useCallback((patch: Partial<StripeLayoutCm>) => {
    setStripeA4((prev) => ({ ...prev, ...patch }));
  }, []);

  const updateStripeA5 = useCallback((patch: Partial<StripeLayoutCm>) => {
    setStripeA5((prev) => ({ ...prev, ...patch }));
  }, []);

  return (
    <ModelsContext.Provider
      value={{
        keys,
        setKey,
        models,
        prompts,
        addPrompt,
        updatePrompt,
        removePrompt,
        pagesPerSpineCm,
        setPagesPerSpineCm,
        stripeA4,
        stripeA5,
        updateStripeA4,
        updateStripeA5,
      }}
    >
      {children}
    </ModelsContext.Provider>
  );
}

export function useModels() {
  const ctx = useContext(ModelsContext);
  if (!ctx) throw new Error("useModels must be used within a ModelsProvider");
  return ctx;
}
