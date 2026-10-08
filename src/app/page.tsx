import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import UnderConstruction404 from "@/components/UnderConstruction404";

export default async function Home() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }
  return <UnderConstruction404 is404={false} />;
}


