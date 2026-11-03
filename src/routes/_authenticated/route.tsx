import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { loadAll } from "@/lib/store";
import { ReminderWatcher } from "@/components/ReminderWatcher";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
  },
  component: Layout,
});

function Layout() {
  useEffect(() => {
    loadAll().catch(() => toast.error("Impossible de charger vos données"));
  }, []);
  return (
    <>
      <Outlet />
      <ReminderWatcher />
    </>
  );
}
