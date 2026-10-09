import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

/**
 * Dynamic App Icon / Favicon (Concept C: The Kinetic Chevrons)
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
          background: "#0E1015",
          borderRadius: "7px",
        }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 100 100"
          fill="none"
        >
          {/* Lower Chevron (Emerald) */}
          <path
            d="M 22 68 L 50 44 L 78 68 L 78 56 L 50 32 L 22 56 Z"
            fill="#10B981"
          />
          {/* Upper Precision Dart (White) */}
          <path
            d="M 32 44 L 50 28 L 68 44 L 68 34 L 50 18 L 32 34 Z"
            fill="#FFFFFF"
          />
          {/* Target Launch Beacon */}
          <circle cx="50" cy="74" r="4.5" fill="#34D399" />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  );
}
