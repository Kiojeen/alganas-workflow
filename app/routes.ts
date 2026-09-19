import { index, route, type RouteConfig } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("api/generate-cover", "routes/api.generate-cover.ts"),
] satisfies RouteConfig;
