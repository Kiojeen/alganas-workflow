import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type AIModel = {
  id: string;
  name: string;
  key: string;
};

type ModelsContextValue = {
  models: AIModel[];
  addModel: (name: string, key: string) => void;
  updateModel: (id: string, field: "name" | "key", value: string) => void;
  removeModel: (id: string) => void;
};

const ModelsContext = createContext<ModelsContextValue | null>(null);

const STORAGE_KEY = "alganas-models";
const DEFAULT_MODELS: AIModel[] = [
  { id: "gemini", name: "gemini/gemini-3.1-flash-lite-image", key: "" },
  { id: "gpt-image-2.5-sunburst", name: "gpt-image-2.5-sunburst", key: "" },
];

function loadModels(): AIModel[] {
  if (typeof window === "undefined") return DEFAULT_MODELS;
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed as AIModel[];
    }
  } catch {
    // ignore malformed storage
  }
  return DEFAULT_MODELS;
}

export function ModelsProvider({ children }: { children: ReactNode }) {
  const [models, setModels] = useState<AIModel[]>(loadModels);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(models));
  }, [models]);

  const addModel = (name: string, key: string) => {
    setModels((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: name.trim(), key },
    ]);
  };

  const updateModel = (id: string, field: "name" | "key", value: string) =>
    setModels((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: value } : m)),
    );

  const removeModel = (id: string) =>
    setModels((prev) => prev.filter((m) => m.id !== id));

  return (
    <ModelsContext.Provider
      value={{ models, addModel, updateModel, removeModel }}
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
