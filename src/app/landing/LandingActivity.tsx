import { unstable_cache } from "next/cache";
import LandingActivityPanel, { type LandingActivitySnapshot } from "@/components/landing/LandingActivityPanel";
import prisma, { withRetry } from "@/lib/db";

const readActivity = unstable_cache(async (): Promise<LandingActivitySnapshot> => {
  const [indexedVacancies, completedAssessments, trackedApplications] = await withRetry(() => Promise.all([
    prisma.poolVacancy.count(),
    prisma.vacancyAnalysis.count({ where: { aiStatus: "completed" } }),
    prisma.vacancy.count({ where: { status: { in: ["applied_manual", "applied_hh", "applied_auto"] } } }),
  ]), 2, 400);

  return { indexedVacancies, completedAssessments, trackedApplications, measuredAt: new Date().toISOString() };
}, ["landing-activity-v1"], { revalidate: 300 });

export default async function LandingActivity() {
  let snapshot: LandingActivitySnapshot | null = null;
  try {
    snapshot = await readActivity();
  } catch {
    console.warn("[LandingActivity] Could not load public activity totals.");
  }
  return <LandingActivityPanel snapshot={snapshot} />;
}
