import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96 bits for GCM

function getMasterKey(): Buffer {
  const secret =
    process.env.ENCRYPTION_KEY ||
    process.env.NEXTAUTH_SECRET ||
    process.env.AUTH_SECRET ||
    (process.env.DATABASE_URL ? `db-vault-${process.env.DATABASE_URL}` : undefined);

  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("FATAL: ENCRYPTION_KEY must be set in production environment! Please set ENCRYPTION_KEY in your Vercel or .env settings.");
    }
  }
  const effective = secret || "dev-only-secret-key-32-chars-minimum!";
  return crypto.createHash("sha256").update(effective).digest();
}

/**
 * Encrypts plaintext using AES-256-GCM.
 * Output format: "enc:iv:authTag:ciphertext" (hex encoded).
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) return "";
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getMasterKey(), iv);
  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");
  const tag = cipher.getAuthTag();

  return `enc:${iv.toString("hex")}:${tag.toString("hex")}:${encrypted}`;
}

/**
 * Decrypts an AES-256-GCM encrypted string.
 * Gracefully handles unencrypted strings (legacy data).
 */
export function decrypt(ciphertext: string): string {
  if (!ciphertext) return "";
  if (!ciphertext.startsWith("enc:")) {
    // Legacy plaintext string
    return ciphertext;
  }

  try {
    const parts = ciphertext.split(":");
    if (parts.length !== 4) return ciphertext;

    const iv = Buffer.from(parts[1], "hex");
    const tag = Buffer.from(parts[2], "hex");
    const encryptedText = parts[3];

    const decipher = crypto.createDecipheriv(ALGORITHM, getMasterKey(), iv);
    decipher.setAuthTag(tag);
    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (err) {
    console.error("[Crypto] Decryption failed:", err);
    return "";
  }
}

/**
 * Masks a secret string (e.g. API key or token) so it can be safely sent to the client.
 * Example: "sk-proj-1234567890abcdef" -> "sk-p***cdef"
 */
export function maskSecret(secret?: string | null): string {
  if (!secret) return "";
  const raw = secret.startsWith("enc:") ? decrypt(secret) : secret;
  if (!raw) return "";
  if (raw.length <= 8) return "***";
  const start = raw.slice(0, 4);
  const end = raw.slice(-4);
  return `${start}***${end}`;
}

/**
 * Masks all API keys in a custom providers map for safe JSON serialization to the browser.
 */
export function maskProviderKeys(
  customProviders?: Record<string, any> | null
): Record<string, any> {
  if (!customProviders || typeof customProviders !== "object") return {};
  const masked: Record<string, any> = {};
  for (const [provider, config] of Object.entries(customProviders)) {
    if (!config || typeof config !== "object") {
      masked[provider] = config;
      continue;
    }
    masked[provider] = {
      ...config,
      apiKey: config.apiKey ? maskSecret(config.apiKey) : "",
      hasApiKey: Boolean(config.apiKey),
    };
  }
  return masked;
}

/**
 * Encrypts all plaintext API keys in a custom providers map before saving to the database.
 * If incoming key contains '***' or is empty, preserves the existing encrypted key.
 */
export function encryptProviderKeys(
  newProviders?: Record<string, any> | null,
  existingProviders?: Record<string, any> | null
): Record<string, any> {
  if (!newProviders || typeof newProviders !== "object") return {};
  const encrypted: Record<string, any> = { ...newProviders };

  for (const [provider, config] of Object.entries(encrypted)) {
    if (!config || typeof config !== "object") continue;
    const incomingKey = typeof config.apiKey === "string" ? config.apiKey.trim() : "";
    const oldConfig = existingProviders?.[provider];
    const oldKey = typeof oldConfig?.apiKey === "string" ? oldConfig.apiKey : "";

    if (incomingKey.includes("***") || incomingKey === "") {
      // Retain existing key from DB
      if (oldKey) {
        encrypted[provider] = { ...config, apiKey: oldKey };
      }
    } else if (!incomingKey.startsWith("enc:")) {
      // New plaintext key entered -> encrypt it
      encrypted[provider] = { ...config, apiKey: encrypt(incomingKey) };
    }
  }

  return encrypted;
}

/**
 * Decrypts all API keys in a custom providers map for backend execution (e.g. calling LLMs).
 */
export function decryptProviderKeys(
  customProviders?: Record<string, any> | null
): Record<string, any> {
  if (!customProviders || typeof customProviders !== "object") return {};
  const decrypted: Record<string, any> = {};
  for (const [provider, config] of Object.entries(customProviders)) {
    if (!config || typeof config !== "object") {
      decrypted[provider] = config;
      continue;
    }
    decrypted[provider] = {
      ...config,
      apiKey: config.apiKey ? decrypt(config.apiKey) : undefined,
    };
  }
  return decrypted;
}
