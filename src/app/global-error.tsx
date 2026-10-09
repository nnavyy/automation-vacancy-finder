"use client";

// ============================================================
// wingkiiy Job Copilot — Global Catastrophe Error Boundary
// Self-contained inline-styled error page for root layout failure
// ============================================================

import { useEffect, useState } from "react";
import { BRAND_NAME } from "@/lib/brand";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    console.error("[GlobalCatastrophicError]", error);
  }, [error]);

  const digest = error.digest || "ERR_ROOT_LAYOUT_CRASH";

  const handleCopy = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(digest);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <html lang="en">
      <head>
        <title>Application Core Incident — {BRAND_NAME}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body
        style={{
          margin: 0,
          padding: 0,
          background: "#09090b",
          color: "#fafafa",
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          boxSizing: "border-box",
        }}
      >
        {/* Container */}
        <div
          style={{
            maxWidth: "600px",
            width: "90%",
            padding: "36px",
            borderRadius: "20px",
            background: "#18181b",
            border: "1px solid #27272a",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)",
            display: "flex",
            flexDirection: "column",
            gap: "24px",
          }}
        >
          {/* Header Row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1px solid #27272a",
              paddingBottom: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  background: "#27272a",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: "14px",
                  color: "#fff",
                }}
              >
                W
              </div>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "#e4e4e7" }}>
                  {BRAND_NAME}
                </div>
                <div style={{ fontSize: "11px", color: "#71717a", fontFamily: "monospace" }}>
                  Core Runtime Safeguard
                </div>
              </div>
            </div>

            <div
              style={{
                fontSize: "11px",
                fontFamily: "monospace",
                padding: "4px 8px",
                borderRadius: "999px",
                background: "rgba(244, 63, 94, 0.1)",
                color: "#fb7185",
                border: "1px solid rgba(244, 63, 94, 0.2)",
              }}
            >
              CRITICAL_500
            </div>
          </div>

          {/* Description */}
          <div>
            <h1
              style={{
                fontSize: "22px",
                fontWeight: 600,
                color: "#ffffff",
                margin: "0 0 10px 0",
                letterSpacing: "-0.02em",
              }}
            >
              Root Application Layout Crash
            </h1>
            <p
              style={{
                fontSize: "14px",
                color: "#a1a1aa",
                lineHeight: "1.6",
                margin: 0,
              }}
            >
              A critical failure occurred within the root document shell. The application was halted safely before corrupting cached state or user credentials.
            </p>
          </div>

          {/* Diagnostic Box */}
          <div
            style={{
              padding: "14px 16px",
              borderRadius: "12px",
              background: "#09090b",
              border: "1px solid #27272a",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontFamily: "monospace",
              fontSize: "12px",
            }}
          >
            <div>
              <span style={{ color: "#71717a", fontSize: "10px", display: "block" }}>
                CRASH TELEMETRY DIGEST
              </span>
              <span style={{ color: "#f43f5e", fontWeight: 600 }}>{digest}</span>
            </div>
            <button
              onClick={handleCopy}
              style={{
                background: "#27272a",
                border: "none",
                borderRadius: "6px",
                padding: "6px 12px",
                color: copied ? "#34d399" : "#d4d4d8",
                fontSize: "11px",
                fontFamily: "monospace",
                cursor: "pointer",
              }}
            >
              {copied ? "Copied" : "Copy ID"}
            </button>
          </div>

          {/* Action Row */}
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", paddingTop: "4px" }}>
            <button
              onClick={reset}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 20px",
                background: "#ffffff",
                color: "#09090b",
                border: "none",
                borderRadius: "10px",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
              }}
            >
              Reboot Runtime Shell
            </button>
            <a
              href="/login"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 20px",
                background: "#27272a",
                color: "#e4e4e7",
                border: "1px solid #3f3f46",
                borderRadius: "10px",
                fontSize: "13px",
                fontWeight: 500,
                textDecoration: "none",
                cursor: "pointer",
              }}
            >
              Return to Login Portal
            </a>
          </div>

          {/* Footer note */}
          <div
            style={{
              fontSize: "11px",
              color: "#52525b",
              borderTop: "1px solid #27272a",
              paddingTop: "12px",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>SOC 2 Compliance Monitored</span>
            <span>Self-contained emergency mode</span>
          </div>
        </div>
      </body>
    </html>
  );
}
