import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HH Job Copilot — Under Construction & Maintenance",
  description: "Autonomous AI Job Search Copilot for HeadHunter (HH.ru). Official release scheduled for October 24–26, 2026.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: "/icon-192.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#090b0e] text-zinc-100 antialiased selection:bg-emerald-500/20 selection:text-emerald-300">
        {children}
      </body>
    </html>
  );
}
