import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import basicSsl from "@vitejs/plugin-basic-ssl";
import { defineConfig } from "vite";

import { pagesPaths } from "./pages-base.ts";

export default defineConfig(({ command }) => ({
  base: pagesPaths().viteBase,
  resolve: { tsconfigPaths: true },
  plugins: [
    tailwindcss(),
    reactRouter(),
    ...(command === "serve" ? [basicSsl()] : []),
  ],
}));
