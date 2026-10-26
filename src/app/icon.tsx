import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

/**
 * Dynamic Transparent App Icon / Favicon (Concept C: The Kinetic Chevrons)
 * 100% Transparent Background - no background box/squircle.
 */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "transparent",
        }}
      >
        <svg
          width="32"
          height="32"
          viewBox="14 12 72 72"
          fill="none"
        >
          {/* Lower Chevron (Emerald Base) */}
          <path
            d="M 22 68 L 50 44 L 78 68 L 78 56 L 50 32 L 22 56 Z"
            fill="#10B981"
          />
          {/* Upper Precision Dart (Pure White + Crisp Dark Outline for Light Tab contrast) */}
          <path
            d="M 32 44 L 50 28 L 68 44 L 68 34 L 50 18 L 32 34 Z"
            fill="#FFFFFF"
            stroke="#0E1015"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {/* Target Launch Beacon Apex */}
          <circle cx="50" cy="74" r="5" fill="#34D399" />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
