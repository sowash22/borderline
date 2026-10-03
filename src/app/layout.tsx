import type { Metadata, Viewport } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Borderline — Draw a country. Question your geography.",
  description:
    "A tiny geography game with a big reality check. Draw a country from memory in 45 seconds, reveal the real map, and challenge a friend.",
  openGraph: {
    title: "Borderline — How bad is your geography?",
    description: "45 seconds. One country. Absolutely no looking it up.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Borderline — Draw a country from memory",
    description: "Your geography is about to get personal.",
  },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f6f7fb",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
