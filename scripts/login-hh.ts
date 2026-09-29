import prisma from "../src/lib/db";
import { performBrowserLogin } from "../src/lib/hhBrowserLogin";

async function main() {
  console.log("=================================================");
  console.log(" HeadHunter Automated Browser Login");
  console.log("=================================================");
  console.log("");

  const user = await prisma.user.findFirst({
    orderBy: { createdAt: "asc" },
  });

  if (!user) {
    console.error("Error: No user found in database. Please register in the web app first.");
    process.exit(1);
  }

  console.log(`Target User: ${user.name} (${user.email})`);
  console.log("Opening browser window for HeadHunter login...");
  console.log("Please log in with your phone/email/password or SMS in the opened browser.");
  console.log("Waiting for login completion...");

  try {
    const result = await performBrowserLogin(300000); // 5 min timeout

    if (!result.success) {
      console.error("Login failed:", result.error);
      process.exit(1);
    }

    console.log("");
    console.log("✔ Login successful!");
    console.log(`  Account Name: ${result.profile.name || "N/A"}`);
    console.log(`  Resumes Found: ${result.resumes.length}`);
    if (result.resumes.length > 0) {
      result.resumes.forEach((r, i) => console.log(`    [${i + 1}] ${r.title} (ID: ${r.id})`));
    }
    console.log(`  Session Expiry: ${result.expiresAt ? result.expiresAt.toLocaleString() : "Estimated 30 days"}`);

    const pref = await prisma.searchPreference.findFirst({
      where: { userId: user.id, isActive: true },
    });

    if (pref) {
      await prisma.searchPreference.update({
        where: { id: pref.id },
        data: {
          hhToken: result.cookieString,
          hhSessionStatus: "active",
          hhLastVerifiedAt: new Date(),
          hhExpiresAt: result.expiresAt,
          hhProfileName: result.profile.name,
          hhProfileAvatar: result.profile.avatar,
          hhTotalApplications: result.profile.totalApplications,
          ...(result.resumes.length > 0 && !pref.hhResumeId
            ? { hhResumeId: result.resumes[0].id, hhResumeTitle: result.resumes[0].title }
            : {}),
        },
      });
      console.log("✔ Successfully updated search preferences in database!");
    }

    console.log("");
    console.log("You can now refresh the Settings page in your browser.");
  } catch (error: any) {
    console.error("Failed during browser login:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
