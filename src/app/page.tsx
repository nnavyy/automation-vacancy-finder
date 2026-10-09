import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import UnderConstruction404 from "@/components/UnderConstruction404";

// ============================================================
// MAINTENANCE TOGGLE (TAHAP TESTING):
// Set ke `true`  -> Tampilkan Under Construction
// Set ke `false` -> Jalankan redirect normal (login / dashboard)
// ============================================================
const IS_MAINTENANCE_LOCK = true;

export default async function Home() {
  if (IS_MAINTENANCE_LOCK) {
    return <UnderConstruction404 is404={false} />;
  }

  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  redirect("/dashboard");
}
