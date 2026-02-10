import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import OfflineGuard from "@/components/OfflineGuard";

export const metadata: Metadata = {
  title: "Apprenez des langues — FR · EN · MG",
  description: "Assistant pour apprendre le français, l'anglais et le malagasy. Dialogue, vocabulaire, verbes et correction vocale.",
};

export const viewport: Viewport = {
  themeColor: "#1e3a5f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full">
      <head>
        <meta name="theme-color" content="#1e3a5f" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="icon" href="/logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased min-h-full touch-manipulation font-sans">
        <Providers>
          <OfflineGuard>
            {children}
          </OfflineGuard>
        </Providers>
      </body>
    </html>
  );
}
