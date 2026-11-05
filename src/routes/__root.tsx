import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { LayoutDashboard, Users, FileCheck2, Car, LogOut, CalendarDays, Target, FolderOpen, Plus, Minus } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { Logo } from "@/components/Logo";
import { supabase } from "@/integrations/supabase/client";
import { loadAll, clearAll } from "@/lib/store";

const NAV = [
  { to: "/", label: "Accueil", icon: LayoutDashboard },
  { to: "/offres", label: "Offres", icon: Users },
  { to: "/commandes", label: "Commandes", icon: FileCheck2 },
  { to: "/direction", label: "Direction", icon: Car },
  { to: "/rdv", label: "RDV", icon: CalendarDays },
  { to: "/objectif", label: "Objectif", icon: Target },
  { to: "/dossiers", label: "Dossiers", icon: FolderOpen },
] as const;

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Carnet Vendeur" },
      { name: "description", content: "Carnet du vendeur automobile : offres, commandes, véhicules de direction." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Sora:wght@500;600;700;800&family=Manrope:wght@400;500;600;700&display=swap" },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      setEmail(session?.user?.email ?? null);
      if (event === "SIGNED_OUT") clearAll();
      else loadAll().catch(() => {});
      router.invalidate();
    });
    return () => data.subscription.unsubscribe();
  }, [router]);

  async function signOut() {
    await supabase.auth.signOut();
    clearAll();
    router.navigate({ to: "/auth", replace: true });
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen pb-24 md:pb-0">
        <header className="sticky top-0 z-30 border-b bg-card/80 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
            <Link to="/"><Logo /></Link>
            {email && (
              <div className="flex items-center gap-2">
                <nav className="hidden gap-1 md:flex">
                  {NAV.map((n) => (
                    <Link key={n.to} to={n.to} activeOptions={{ exact: true }} className="nav-link">
                      <n.icon className="size-4" /> {n.label}
                    </Link>
                  ))}
                </nav>
                <button onClick={signOut} className="nav-link" title={email} aria-label="Se déconnecter">
                  <LogOut className="size-4" /> <span className="hidden lg:inline">Déconnexion</span>
                </button>
              </div>
            )}
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">
          <Outlet />
        </main>
        {email && (
          <MobileNav />
        )}
      </div>
      <Toaster position="top-center" />
    </QueryClientProvider>
  );
}

function MobileNav() {
  const [open, setOpen] = useState(false);
  const main = NAV.slice(0, 5);
  const more = NAV.slice(5);
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 md:hidden">
      {open && (
        <div className="mx-2 mb-2 flex justify-end">
          <div className="flex gap-1 rounded-2xl border bg-card/95 p-1 shadow-lg backdrop-blur-xl animate-in slide-in-from-bottom-2 fade-in">
            {more.map((n) => (
              <Link key={n.to} to={n.to} activeOptions={{ exact: true }} className="nav-tab px-4" onClick={() => setOpen(false)}>
                <n.icon className="size-5" />
                {n.label}
              </Link>
            ))}
          </div>
        </div>
      )}
      <div className="grid grid-cols-6 border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl">
        {main.map((n) => (
          <Link key={n.to} to={n.to} activeOptions={{ exact: true }} className="nav-tab">
            <n.icon className="size-5" />
            {n.label}
          </Link>
        ))}
        <button type="button" className="nav-tab" aria-expanded={open} aria-label={open ? "Fermer le menu" : "Plus d'onglets"} onClick={() => setOpen((o) => !o)}>
          {open ? <Minus className="size-5" /> : <Plus className="size-5" />}
          {open ? "Fermer" : "Plus"}
        </button>
      </div>
    </nav>
  );
}
