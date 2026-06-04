import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/?auth=required");
  }

  return (
    <div className="mobile-container py-6 min-h-screen">
      {children}
    </div>
  );
}
