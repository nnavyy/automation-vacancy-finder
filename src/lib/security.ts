// ============================================================
// wingkiiy Job Copilot — Security Utilities (SSRF & Input Guard)
// Protects against Server-Side Request Forgery and malicious IP ranges
// ============================================================

/**
 * Validates whether a URL is a safe public web address.
 * Rejects localhost, loopbacks, private RFC1918 subnets, and AWS/cloud metadata services (169.254.169.254).
 */
export function isSafePublicUrl(inputUrl: string): boolean {
  if (!inputUrl || typeof inputUrl !== "string") return false;

  try {
    const parsed = new URL(inputUrl);

    // Only allow HTTP and HTTPS protocols
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return false;
    }

    const hostname = parsed.hostname.toLowerCase();

    // Block localhost, local domains, and internal hostnames
    if (
      hostname === "localhost" ||
      hostname.endsWith(".localhost") ||
      hostname.endsWith(".local") ||
      hostname.endsWith(".internal") ||
      hostname.endsWith(".lan") ||
      hostname === "metadata.google.internal"
    ) {
      return false;
    }

    // IPv4 checks
    const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const ipMatch = hostname.match(ipv4Regex);
    if (ipMatch) {
      const a = parseInt(ipMatch[1], 10);
      const b = parseInt(ipMatch[2], 10);

      // 0.0.0.0/8
      if (a === 0) return false;

      // Loopback (127.0.0.0/8)
      if (a === 127) return false;

      // Private networks: 10.0.0.0/8
      if (a === 10) return false;

      // Private networks: 172.16.0.0/12 (172.16 - 172.31)
      if (a === 172 && b >= 16 && b <= 31) return false;

      // Private networks: 192.168.0.0/16
      if (a === 192 && b === 168) return false;

      // Cloud Metadata & Link-Local: 169.254.0.0/16 (e.g. 169.254.169.254)
      if (a === 169 && b === 254) return false;
    }

    // IPv6 checks (localhost ::1, unique local fc00::/7, link-local fe80::/10)
    if (
      hostname === "[::1]" ||
      hostname === "::1" ||
      hostname.startsWith("[fc") ||
      hostname.startsWith("[fd") ||
      hostname.startsWith("[fe8") ||
      hostname.startsWith("[fe9") ||
      hostname.startsWith("[fea") ||
      hostname.startsWith("[feb")
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}
