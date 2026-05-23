"use client";

// ============================================================
// Global Error Boundary — wraps the entire root layout
// Catches catastrophic errors (font loading, layout crash, etc.)
// ============================================================

import { useEffect } from "react";
import { AlertOctagon, RefreshCw, Home } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#030712", fontFamily: "system-ui, sans-serif" }}>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            color: "#f9fafb",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 24,
            }}
          >
            <AlertOctagon size={28} color="#f87171" />
          </div>

          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: "#f9fafb" }}>
            Critical Application Error
          </h1>
          <p style={{ fontSize: 14, color: "#9ca3af", maxWidth: 400, marginBottom: 8 }}>
            The application encountered an unexpected error and could not recover.
          </p>
          {error.digest && (
            <p style={{ fontSize: 12, color: "#6b7280", marginBottom: 24, fontFamily: "monospace" }}>
              Error reference: {error.digest}
            </p>
          )}

          <div style={{ display: "flex", gap: 12 }}>
            <button
              onClick={reset}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 20px",
                background: "#dc2626",
                color: "#fff",
                border: "none",
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <RefreshCw size={14} />
              Try Again
            </button>
            <a
              href="/"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 20px",
                background: "#1f2937",
                color: "#d1d5db",
                border: "1px solid #374151",
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              <Home size={14} />
              Home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
