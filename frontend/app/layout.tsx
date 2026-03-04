import type { Metadata } from "next";
import { IBM_Plex_Sans, Space_Mono } from "next/font/google";
import "./globals.css";

const ibmPlexSans = IBM_Plex_Sans({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin", "latin-ext"],
  variable: "--font-ibm-plex-sans",
});

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-space-mono",
});

export const metadata: Metadata = {
  title: "TTTEnglish Center - Management System",
  description: "Production-grade management system for Vietnamese English tutoring centers",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${ibmPlexSans.variable} ${spaceMono.variable}`}>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}