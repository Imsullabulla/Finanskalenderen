import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Finanskalenderen – Compliance Operating System",
  description: "Overblik over alle virksomhedens indberetningspligter – samlet ét sted. Visual compliance dashboard for European companies.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="da">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
