/** @type {import('prettier').Config & import('prettier-plugin-tailwindcss').PluginOptions & import('@ianvs/prettier-plugin-sort-imports').PluginConfig} */
const config = {
  plugins: [
    "@ianvs/prettier-plugin-sort-imports",
    "prettier-plugin-tailwindcss", // MUST be last
  ],

  importOrder: [
    "^react$", // React core
    "^next$", // Next.js
    "<THIRD_PARTY_MODULES>", // Other npm packages
    "", // separator
    "^@/lib/(.*)$", // Utilities / helpers
    "^@/hooks/(.*)$", // React hooks
    "^@/components/ui/(.*)$", // UI components first
    "^@/components/(.*)$", // Other shared components
    "^@/styles/(.*)$", // Styles / Tailwind
    "", // separator
    "^[./]", // relative imports (local components)
  ],

  trailingComma: "all",
  singleQuote: false,
  semi: true,

  importOrderParserPlugins: ["typescript", "jsx", "decorators-legacy"],

  tailwindFunctions: ["clsx", "cn", "tw", "twMerge", "cva"],
}

export default config
