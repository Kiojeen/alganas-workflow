import { createGoogle } from "@ai-sdk/google";
import { generateImage } from "ai";

import type { Route } from "./+types/api.generate-cover";

function googleImageModelId(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return "gemini-3.1-flash-image-preview";
  return trimmed.includes("/") ? (trimmed.split("/").pop() ?? trimmed) : trimmed;
}

export async function action({ request }: Route.ActionArgs) {
  const form = await request.formData();
  const apiKey = String(form.get("apiKey") ?? "").trim();
  const modelId = googleImageModelId(String(form.get("modelId") ?? ""));
  const prompt = String(form.get("prompt") ?? "").trim();
  const image = form.get("image");

  if (!apiKey) {
    return Response.json({ error: "Missing API key" }, { status: 400 });
  }
  if (!prompt) {
    return Response.json({ error: "Missing prompt" }, { status: 400 });
  }

  const images: Uint8Array[] = [];
  if (image instanceof File && image.size > 0) {
    images.push(new Uint8Array(await image.arrayBuffer()));
  }

  try {
    const result = await generateImage({
      model: createGoogle({ apiKey }).image(modelId),
      prompt: images.length ? { text: prompt, images } : prompt,
      aspectRatio: "2:3",
      maxRetries: 0,
    });

    return Response.json({
      mediaType: result.image.mediaType,
      base64: result.image.base64,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Image generation failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
