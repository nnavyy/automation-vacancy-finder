const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();

(async () => {
  // 1. Clear old vacancies & analyses so re-run fetches fresh data
  await p.vacancyAnalysis.deleteMany({});
  await p.applicationLog.deleteMany({});
  await p.vacancyFeedback.deleteMany({});
  await p.aiUsageLog.deleteMany({});
  await p.vacancy.deleteMany({});
  console.log("✅ Cleared all old vacancy data");

  // 2. Lower notification threshold to 30 so we actually get Telegram notifications
  await p.searchPreference.updateMany({
    where: { isActive: true },
    data: { minimumScoreToNotify: 30 }
  });
  console.log("✅ Lowered notification threshold to 30");
  
  // 3. Verify
  const pref = await p.searchPreference.findFirst({ where: { isActive: true } });
  console.log("   Threshold now:", pref?.minimumScoreToNotify);
  console.log("   Max notifications/day:", pref?.maxNotificationsPerDay);

  await p.$disconnect();
  console.log("\n🎯 Ready! Click Run Collection now.");
})();
