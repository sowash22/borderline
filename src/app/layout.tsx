import type { Metadata, Viewport } from "next";
import Game from "@/components/game";
import "./globals.css";
export const metadata: Metadata = {
  title: "Borderline — Draw a shape. Question your memory.",
  description:
    "Draw a country, an animal, a fruit, or a shape from memory, then compare it with the real outline.",
  openGraph: {
    title: "Borderline — How bad is your drawing?",
    description: "Draw a country or a shape from memory, then compare it with the real outline.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Borderline — Draw from memory",
    description: "Your drawing is about to get personal.",
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
