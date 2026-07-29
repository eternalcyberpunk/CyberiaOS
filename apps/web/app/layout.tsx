import "./globals.css";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "EternalCyberia OS",
  description: "A creative internet operating system.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent" },
};

/** viewportFit: cover is what makes the safe-area tokens meaningful on iPhone. */
export const viewport: Viewport = {
  themeColor: "#05060c",
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
