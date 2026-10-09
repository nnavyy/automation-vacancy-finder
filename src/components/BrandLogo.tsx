import React from "react";

interface BrandLogoProps {
  size?: number;
  className?: string;
  showBackground?: boolean;
}

/**
 * Official Brand Logo for HH Job Copilot
 * "The Kinetic Chevrons" (Concept C - Official Brand Identity)
 * Inspired by tech platforms (ClickUp, CapCut, Atlassian) & AI tools
 * Represents rapid career launch, forward momentum, and dynamic 'H' structure.
 */
export function BrandLogo({
  size = 28,
  className = "",
  showBackground = true,
}: BrandLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="HH Job Copilot Logo"
    >
      {showBackground && (
        <>
          <rect width="100" height="100" rx="22" fill="#0E1015" />
          <rect
            x="0.5"
            y="0.5"
            width="99"
            height="99"
            rx="21.5"
            stroke="#202A24"
            strokeWidth="1"
          />
        </>
      )}

      {/* Layered Dynamic Kinetic Chevrons */}
      {/* Lower Chevron (Emerald Base) */}
      <path
        d="M 22 68 L 50 44 L 78 68 L 78 56 L 50 32 L 22 56 Z"
        fill="#10B981"
      />
      {/* Upper Precision Dart (Pure White) */}
      <path
        d="M 32 44 L 50 28 L 68 44 L 68 34 L 50 18 L 32 34 Z"
        fill="#FFFFFF"
      />
      {/* Target Launch Beacon Apex */}
      <circle cx="50" cy="74" r="4.5" fill="#34D399" />
    </svg>
  );
}

/**
 * Preserved Original 3A Logo ("Aperture Stealth Dart")
 * Permanently saved and archived as requested.
 */
export function Original3ALogo({
  size = 28,
  className = "",
  variant = "emerald",
}: {
  size?: number;
  className?: string;
  variant?: "emerald" | "red";
}) {
  const arcColor = variant === "red" ? "#E11D48" : "#10B981";
  const secondArc = variant === "red" ? "#E11D48" : "#059669";
  const strokeColor = variant === "red" ? "#262A34" : "#1D2A24";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="HH Job Copilot Original 3A Logo"
    >
      <rect width="100" height="100" rx="22" fill="#0E1015" />
      <rect
        x="0.5"
        y="0.5"
        width="99"
        height="99"
        rx="21.5"
        stroke={strokeColor}
        strokeWidth="1"
      />
      {/* Top-Left Arc */}
      <path
        d="M 50 16 A 34 34 0 0 0 16 50 C 16 57 18.5 63.5 22.8 68.5 L 34.5 56.8 C 33.2 54.8 32.5 52.5 32.5 50 C 32.5 40.3 40.3 32.5 50 32.5 C 52.5 32.5 54.8 33.2 56.8 34.5 L 68.5 22.8 C 63.5 18.5 57 16 50 16 Z"
        fill={arcColor}
      />
      {/* Bottom-Right Arc */}
      <path
        d="M 50 84 A 34 34 0 0 0 84 50 C 84 43 81.5 36.5 77.2 31.5 L 65.5 43.2 C 66.8 45.2 67.5 47.5 67.5 50 C 67.5 59.7 59.7 67.5 50 67.5 C 47.5 67.5 45.2 66.8 43.2 65.5 L 31.5 77.2 C 36.5 81.5 43 84 50 84 Z"
        fill={secondArc}
      />
      {/* Solid White Stealth Dart */}
      <path
        d="M 28 62 L 64 26 L 52 26 L 68 22 L 64 38 L 64 26 L 38 62 Z"
        fill="#FFFFFF"
      />
      <circle cx="50" cy="50" r="4.5" fill="#FFFFFF" />
    </svg>
  );
}

export default BrandLogo;
