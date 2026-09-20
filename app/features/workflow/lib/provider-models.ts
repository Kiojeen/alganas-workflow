export type ProviderId = "openai" | "google";
export type ModelKind = "text" | "image";

export type CatalogModel = {
  id: string;
  provider: ProviderId;
  modelId: string;
  label: string;
  kind: ModelKind;
};

export const PROVIDERS: { id: ProviderId; label: string }[] = [
  { id: "openai", label: "OpenAI" },
  { id: "google", label: "Google AI" },
];

export function modelSelectionId(provider: ProviderId, modelId: string) {
  return `${provider}:${modelId}`;
}

export function parseModelSelection(id: string | null | undefined) {
  if (!id) return null;
  const index = id.indexOf(":");
  if (index <= 0) return null;
  const provider = id.slice(0, index);
  const modelId = id.slice(index + 1).trim();
  if ((provider !== "openai" && provider !== "google") || !modelId) {
    return null;
  }
  return { provider, modelId } as const;
}

const FALLBACK_MODELS: CatalogModel[] = [
  text("openai", "gpt-4o"),
  text("openai", "gpt-4o-mini"),
  text("openai", "gpt-4.1"),
  text("openai", "gpt-4.1-mini"),
  text("openai", "gpt-5"),
  text("openai", "gpt-5-mini"),
  image("openai", "gpt-image-1"),
  image("openai", "gpt-image-1.5"),
  image("openai", "dall-e-3"),
  text("google", "gemini-2.5-flash"),
  text("google", "gemini-2.5-pro"),
  text("google", "gemini-2.5-flash-lite"),
  text("google", "gemini-2.0-flash"),
  image("google", "gemini-2.5-flash-image"),
  image("google", "gemini-3.1-flash-lite-image"),
  image("google", "imagen-4.0-generate-001"),
];

function text(provider: ProviderId, modelId: string): CatalogModel {
  return {
    id: modelSelectionId(provider, modelId),
    provider,
    modelId,
    label: modelId,
    kind: "text",
  };
}

function image(provider: ProviderId, modelId: string): CatalogModel {
  return {
    id: modelSelectionId(provider, modelId),
    provider,
    modelId,
    label: modelId,
    kind: "image",
  };
}

function googleModelId(name: string) {
  return name.replace(/^models\//, "");
}

function isSkippedOpenAi(id: string) {
  return (
    /embedding|whisper|tts|audio|transcribe|realtime|moderation|davinci|babbage|ada|search|computer-use|sora|codex|^ft:/i.test(
      id,
    ) || /-\d{4}-\d{2}-\d{2}$/.test(id)
  );
}

function isOpenAiImage(id: string) {
  return /dall-e|gpt-image|image/i.test(id);
}

function isOpenAiText(id: string) {
  return /^(gpt-|o1|o3|o4|chatgpt)/i.test(id) && !isOpenAiImage(id);
}

function isSkippedGoogle(id: string) {
  return /embedding|aqa|gemma|tts|native-audio|computer-use/i.test(id);
}

function isGoogleImage(id: string, methods: string[]) {
  return (
    methods.includes("generateImages") ||
    /imagen|image/i.test(id)
  );
}

function isGoogleText(id: string, methods: string[]) {
  return methods.includes("generateContent") && !isGoogleImage(id, methods);
}

function mergeCatalog(models: CatalogModel[]) {
  const byId = new Map<string, CatalogModel>();
  for (const model of [...FALLBACK_MODELS, ...models]) {
    byId.set(model.id, model);
  }
  return [...byId.values()].sort((a, b) => {
    if (a.provider !== b.provider) {
      return a.provider === "openai" ? -1 : 1;
    }
    if (a.kind !== b.kind) return a.kind === "text" ? -1 : 1;
    return a.label.localeCompare(b.label);
  });
}

export const DEFAULT_CATALOG = mergeCatalog([]);

async function fetchOpenAiModels(key: string): Promise<CatalogModel[]> {
  const response = await fetch("https://api.openai.com/v1/models", {
    headers: { Authorization: `Bearer ${key}` },
  });
  if (!response.ok) throw new Error("OpenAI models");
  const payload = (await response.json()) as { data?: { id: string }[] };
  const models: CatalogModel[] = [];
  for (const item of payload.data ?? []) {
    const modelId = item.id;
    if (!modelId || isSkippedOpenAi(modelId)) continue;
    if (isOpenAiImage(modelId)) models.push(image("openai", modelId));
    else if (isOpenAiText(modelId)) models.push(text("openai", modelId));
  }
  return models;
}

async function fetchGoogleModels(key: string): Promise<CatalogModel[]> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`,
  );
  if (!response.ok) throw new Error("Google models");
  const payload = (await response.json()) as {
    models?: { name?: string; supportedGenerationMethods?: string[] }[];
  };
  const models: CatalogModel[] = [];
  for (const item of payload.models ?? []) {
    const modelId = googleModelId(item.name ?? "");
    if (!modelId || isSkippedGoogle(modelId)) continue;
    const methods = item.supportedGenerationMethods ?? [];
    if (isGoogleImage(modelId, methods)) models.push(image("google", modelId));
    else if (isGoogleText(modelId, methods)) models.push(text("google", modelId));
  }
  return models;
}

export async function loadProviderCatalog(keys: Record<ProviderId, string>) {
  const extra: CatalogModel[] = [];
  const tasks: Promise<void>[] = [];
  if (keys.openai.trim()) {
    tasks.push(
      fetchOpenAiModels(keys.openai.trim())
        .then((models) => {
          extra.push(...models);
        })
        .catch(() => undefined),
    );
  }
  if (keys.google.trim()) {
    tasks.push(
      fetchGoogleModels(keys.google.trim())
        .then((models) => {
          extra.push(...models);
        })
        .catch(() => undefined),
    );
  }
  await Promise.all(tasks);
  return mergeCatalog(extra);
}

export function modelsByKind(models: CatalogModel[], kind: ModelKind) {
  return models.filter((model) => model.kind === kind);
}

export function groupByProvider(models: CatalogModel[]) {
  return PROVIDERS.map((provider) => ({
    ...provider,
    models: models.filter((model) => model.provider === provider.id),
  })).filter((group) => group.models.length > 0);
}
