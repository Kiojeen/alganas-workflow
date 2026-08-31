import {
  DatabaseIcon,
  PlayCircleIcon,
  RefreshIcon,
  Rocket01Icon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";

import type { Job } from "./types";

export const JOBS: Job[] = [
  {
    id: "fetch",
    title: "Fetch Input",
    description: "Upload an image or a PDF (one page becomes the artwork).",
    icon: DatabaseIcon,
  },
  {
    id: "configure",
    title: "Configure AI",
    description: "Pick a model and edit the prompt that will process it.",
    icon: SparklesIcon,
  },
  {
    id: "transform",
    title: "Transform",
    description: "Map fields and normalize the structure.",
    icon: RefreshIcon,
  },
  {
    id: "enrich",
    title: "Enrich",
    description: "Augment records with external signals.",
    icon: SparklesIcon,
  },
  {
    id: "review",
    title: "Review",
    description: "Manual review step before publishing.",
    icon: PlayCircleIcon,
  },
  {
    id: "publish",
    title: "Publish",
    description: "Push the result to the downstream service.",
    icon: Rocket01Icon,
  },
];
