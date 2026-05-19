import { PrismaClient } from "@prisma/client";
import { sendVacancyNotification } from "./src/lib/telegram";

const prisma = new PrismaClient();

async function main() {
  const analysis = await prisma.vacancyAnalysis.findFirst({
    where: { matchScore: { gt: 0 } },
    orderBy: { matchScore: "desc" },
    include: { vacancy: true }
  });
  
  if (analysis) {
    console.log("Sending mock notification for:", analysis.vacancy.title);
    
    // Map camelCase DB fields back to AIAnalysisResult snake_case keys
    const mockAnalysis = { 
      match_score: 95, 
      recommendation: "apply",
      best_language: analysis.bestLanguage,
      summary: analysis.summary,
      match_reasons: analysis.matchReasons || [],
      missing_requirements: analysis.missingRequirements || [],
      red_flags: analysis.redFlags || [],
      cover_letter: analysis.coverLetter,
      questions_to_recruiter: analysis.questions || [],
      confidence: analysis.confidence
    };
    
    const sent = await sendVacancyNotification(analysis.vacancy as any, mockAnalysis as any, analysis.vacancy.id);
    console.log("Sent successfully:", sent);
  } else {
    console.log("No analyzed vacancies found");
  }
}
main().catch(console.error).finally(() => process.exit(0));
