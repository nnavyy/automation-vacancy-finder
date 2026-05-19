import type { Metadata } from "next";
import NextTopLoader from "nextjs-toploader";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nanda AI Job Assistant",
  description: "Semi-automated HH.ru job search assistant",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-white min-h-screen">
        <NextTopLoader color="#4ade80" showSpinner={false} />
        {children}
      </body>
    </html>
  );
}
