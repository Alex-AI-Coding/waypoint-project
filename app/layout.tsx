import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
  Lexend,
  Atkinson_Hyperlegible,
} from "next/font/google";
import "./globals.css";
import SettingsBootstrap from "./SettingsBootstrap";

const lexend = Lexend({
  subsets: ["latin"],
  variable: "--font-lexend",
});

const atkinson = Atkinson_Hyperlegible({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-atkinson",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Waypoint",
  description: "A supportive mental health and guidance chatbot.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${lexend.variable} ${atkinson.variable} ${geistSans.variable} ${geistMono.variable}`}
    >
      <body className="min-h-screen bg-background text-foreground antialiased">
        <SettingsBootstrap />
        {children}
      </body>
    </html>
  );
}