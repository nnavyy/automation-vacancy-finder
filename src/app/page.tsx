import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import UnderConstruction404 from "@/components/UnderConstruction404";
import { IS_MAINTENANCE_LOCKDOWN, isEmailWhitelisted } from "@/lib/maintenance";

export default async function Home() {
  const session = await auth();
  const userEmail = session?.user?.email?.toLowerCase();
  const isWhitelisted = isEmailWhitelisted(userEmail);

  // If a whitelisted user visits '/', immediately take them to /dashboard
  if (isWhitelisted) {
    redirect("/dashboard");
  }

  // When maintenance lockdown is active, public/guests always see Under Construction
  if (IS_MAINTENANCE_LOCKDOWN) {
    return <UnderConstruction404 is404={false} />;
  }

  // Normal flow when maintenance is disabled
  if (!session?.user) {
    redirect("/login");
  }
  redirect("/dashboard");
}
