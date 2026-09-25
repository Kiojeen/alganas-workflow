import type { Config } from "@react-router/dev/config";

import { pagesPaths } from "./pages-base";

export default {
  ssr: false,
  basename: pagesPaths().basename,
} satisfies Config;
