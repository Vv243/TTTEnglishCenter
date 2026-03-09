import type { Metadata } from "next";
import { Fraunces, Epilogue, Space_Mono } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  weight: ["700", "900"],
  style: ["normal", "italic"],
  subsets: ["latin", "latin-ext"],
  variable: "--font-fraunces",
  display: "swap",
});

const epilogue = Epilogue({
  weight: ["400", "500", "600", "700", "900"],
  subsets: ["latin", "latin-ext"],  // latin-ext covers all Vietnamese diacritics
  variable: "--font-epilogue",
  display: "swap",
});

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-space-mono",
  display: "swap",
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
    <html
      lang="vi"
      className={`${fraunces.variable} ${epilogue.variable} ${spaceMono.variable}`}
    >
      <body className="font-epilogue antialiased">
        {children}
      </body>
    </html>
  );
}