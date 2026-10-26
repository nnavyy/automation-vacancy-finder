import { PrismaClient } from "@prisma/client";
import { encrypt } from "../src/lib/crypto";

const prisma = new PrismaClient();

async function main() {
  console.log("[Migration] Scanning SearchPreference records for unencrypted secrets...");

  const preferences = await prisma.searchPreference.findMany();
  let updatedCount = 0;

  for (const pref of preferences) {
    let changed = false;
    const updateData: Record<string, any> = {};

    // 1. Check hhToken
    if (pref.hhToken && !pref.hhToken.startsWith("enc:")) {
      updateData.hhToken = encrypt(pref.hhToken);
      changed = true;
    }

    // 2. Check aiProviderOrder custom provider keys
    if (pref.aiProviderOrder && typeof pref.aiProviderOrder === "object" && !Array.isArray(pref.aiProviderOrder)) {
      const config = { ...(pref.aiProviderOrder as any) };
      if (config.customProviders && typeof config.customProviders === "object") {
        let providersChanged = false;
        const newProviders: Record<string, any> = { ...config.customProviders };

        for (const [provider, provConfig] of Object.entries(newProviders)) {
          if (provConfig && typeof provConfig === "object" && typeof provConfig.apiKey === "string") {
            const rawKey = provConfig.apiKey.trim();
            if (rawKey && !rawKey.startsWith("enc:") && !rawKey.includes("***")) {
              newProviders[provider] = {
                ...provConfig,
                apiKey: encrypt(rawKey),
              };
              providersChanged = true;
            }
          }
        }

        if (providersChanged) {
          config.customProviders = newProviders;
          updateData.aiProviderOrder = config;
          changed = true;
        }
      }
    }

    if (changed) {
      await prisma.searchPreference.update({
        where: { id: pref.id },
        data: updateData,
      });
      updatedCount++;
      console.log(`[Migration] Encrypted secrets for SearchPreference ID: ${pref.id} (User: ${pref.userId})`);
    }
  }

  console.log(`[Migration] Completed successfully. Total records migrated & encrypted: ${updatedCount}/${preferences.length}`);
}

main()
  .catch((err) => {
    console.error("[Migration] Error running secrets encryption migration:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
