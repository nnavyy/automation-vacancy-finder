const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  const a = await p.vacancyAnalysis.findFirst({
    where: { matchScore: { gt: 0 } },
    orderBy: { matchScore: 'desc' },
    include: { vacancy: true }
  });
  console.log("Title:", a.vacancy.title);
  console.log("Score:", a.matchScore);
  console.log("Reasons:", a.matchReasons);
  console.log("Missing:", a.missingRequirements);
  console.log("RedFlags:", a.redFlags);
  console.log("Summary:", a.summary);
  await p.$disconnect();
})();
