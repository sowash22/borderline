import type { Metadata, Viewport } from "next";
import Game from "@/components/game";
import "./globals.css";
export const metadata: Metadata = {
  metadataBase: new URL("https://borderline-zeta.vercel.app"),
  title: "Borderline — Draw a country. Question your geography.",
  description:
    "A tiny geography game with a big reality check. Draw a country from memory at your own pace, reveal the real map, and challenge a friend.",
  openGraph: {
    title: "Borderline — How bad is your geography?",
    description: "Draw a country from memory, then compare it with the real map.",
    type: "website",
    url: "https://borderline-zeta.vercel.app/",
    siteName: "Borderline",
  },
  twitter: {
    card: "summary_large_image",
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
      <body>
        {children}
        <Game />
      </body>
    </html>
  );
}
