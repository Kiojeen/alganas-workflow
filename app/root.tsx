import { useEffect } from "react";
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import { SidebarInset, SidebarProvider } from "./components/ui/sidebar";

import "./app.css";

import { AppSidebar } from "./components/app-sidebar";
import { TooltipProvider } from "./components/ui/tooltip";
import { ModelsProvider, WorkflowsProvider } from "./features/workflow/context";
import { ThemeProvider } from "./providers/theme-provider";
import { DirectionProvider } from "./components/ui/direction";
import { Toaster } from "./components/ui/sonner";

const base = import.meta.env.BASE_URL;

export const meta: Route.MetaFunction = () => [
  { title: "أتمته الگناص" },
  {
    name: "description",
    content: "مكتب أغلفة الكتب: من صورة الغلاف إلى ملفات PDF جاهزة للطباعة.",
  },
  { name: "theme-color", content: "#1c1917" },
  { name: "mobile-web-app-capable", content: "yes" },
  { name: "apple-mobile-web-app-capable", content: "yes" },
  { name: "apple-mobile-web-app-title", content: "الگناص" },
];

export const links: Route.LinksFunction = () => [
  { rel: "icon", href: `${base}favicon.ico`, sizes: "any" },
  { rel: "icon", href: `${base}favicon.svg`, type: "image/svg+xml" },
  { rel: "apple-touch-icon", href: `${base}apple-touch-icon.png` },
  { rel: "manifest", href: `${base}manifest.webmanifest` },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('ui-theme') || 'system';
                  var resolved = theme === 'system'
                    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
                    : theme;
                  document.documentElement.classList.add(resolved);
                } catch (e) {}
              })();
            `,
          }}
        />
        <Meta />
        <Links />
      </head>
      <body>
        <DirectionProvider direction="rtl" dir="rtl">
          <ThemeProvider defaultTheme="dark" storageKey="ui-theme">
            <TooltipProvider>
              <ModelsProvider>
                <WorkflowsProvider>
                  <Toaster />
                  <SidebarProvider
                    style={
                      {
                        "--sidebar-width": "calc(var(--spacing) * 72)",
                        "--header-height": "calc(var(--spacing) * 12)",
                      } as React.CSSProperties
                    }
                  >
                    <AppSidebar />
                    <SidebarInset>{children}</SidebarInset>
                  </SidebarProvider>
                </WorkflowsProvider>
              </ModelsProvider>

              <ScrollRestoration />
              <Scripts />
            </TooltipProvider>
          </ThemeProvider>
        </DirectionProvider>
      </body>
    </html>
  );
}

export default function App() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.register(`${base}sw.js`, { scope: base });
  }, []);

  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="container mx-auto p-4 pt-16">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full overflow-x-auto p-4">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
