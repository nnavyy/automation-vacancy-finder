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
