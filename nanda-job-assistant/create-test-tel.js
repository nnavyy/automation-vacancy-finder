require("dotenv").config();
const { PrismaClient } = require("@prisma/client");

// Need to compile telegram.ts first or run with ts-node.
// I'll just write a quick script using ts-node to execute the telegram call.
const script = `
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
    
    // Override the score to 95 just for the telegram message
    const mockAnalysis = { ...analysis, match_score: 95, recommendation: "apply" };
    
    const sent = await sendVacancyNotification(analysis.vacancy, mockAnalysis as any, analysis.vacancy.id);
    console.log("Sent successfully:", sent);
  } else {
    console.log("No analyzed vacancies found");
  }
}
main().catch(console.error).finally(() => process.exit(0));
`;

require('fs').writeFileSync('send-test.ts', script);
