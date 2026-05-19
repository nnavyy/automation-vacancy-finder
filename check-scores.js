const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

(async () => {
  const analyses = await p.vacancyAnalysis.findMany({
    include: { vacancy: true },
    orderBy: { matchScore: "desc" },
  });
  
  console.log("Total analyses:", analyses.length);
  analyses.forEach((a, i) => {
    console.log(
      `${i + 1}. Score: ${a.matchScore}/100 | Rec: ${a.recommendation} | AI: ${a.aiStatus} | Provider: ${a.providerUsed} | "${a.vacancy.title}"`
    );
  });

  // Check SearchPreference threshold
  const pref = await p.searchPreference.findFirst({ where: { isActive: true } });
  console.log("\nNotification threshold:", pref?.minimumScoreToNotify);
  console.log("Max notifications/day:", pref?.maxNotificationsPerDay);
  
  // Check telegram config
  console.log("\nTELEGRAM_BOT_TOKEN set:", !!process.env.TELEGRAM_BOT_TOKEN);
  console.log("TELEGRAM_CHAT_ID set:", !!process.env.TELEGRAM_CHAT_ID);
  console.log("TELEGRAM_CHAT_ID value:", process.env.TELEGRAM_CHAT_ID);

  await p.$disconnect();
})();
