import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { verifyIsAdmin } from "@/lib/admin";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { SignOutButton } from "@/components/dashboard/sign-out-button";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const admin = await verifyIsAdmin(supabase);
  if (!admin) {
    await supabase.auth.signOut();
    redirect("/login?error=not_admin");
  }

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header email={user.email}>
          <SignOutButton />
        </Header>
        <main className="flex-1 overflow-auto p-5">{children}</main>
      </div>
    </div>
  );
}
