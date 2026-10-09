import UnderConstruction404 from "@/components/UnderConstruction404";

// Catch-all route to intercept /login, /register, /dashboard, etc.
// Guarantees all routes on the live website render Under Construction only
export default function CatchAllLockdownPage() {
  return <UnderConstruction404 is404={true} />;
}
