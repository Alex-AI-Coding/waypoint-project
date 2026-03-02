import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Waypoint",
  description: "A supportive mental health and guidance chatbot.",
};

const SETTINGS_KEY = "waypoint_settings_v1";

const themeBootstrapScript = `
(function () {
  try {
    var raw = localStorage.getItem("${SETTINGS_KEY}");
    if (!raw) return;

    var s = JSON.parse(raw);

    // Theme
    var theme = s && s.theme ? s.theme : "system";
    var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    var isDark = theme === "dark" || (theme === "system" && prefersDark);

    var root = document.documentElement;
    if (isDark) root.classList.add("dark");
    else root.classList.remove("dark");

    // Font size
    var size = s && s.font_size ? s.font_size : "md";
    var fontPx = 16;
    if (size === "sm") fontPx = 14;
    if (size === "md") fontPx = 16;
    if (size === "lg") fontPx = 18;
    if (size === "xl") fontPx = 20;
    root.style.fontSize = fontPx + "px";

    // Font style (optional – only if you use these variables/fonts)
    // If you don't load these fonts, leaving it won't break anything.
    var style = s && s.font_style ? s.font_style : "system";
    if (style === "system") {
      root.style.fontFamily = "";
    } else if (style === "lexend") {
      root.style.fontFamily = "Lexend, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif";
    } else if (style === "atkinson") {
      root.style.fontFamily = "Atkinson Hyperlegible, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif";
    }
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}