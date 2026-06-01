import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AppHeader } from "@/components/auth/AppHeader";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Eigen Huis Inspectie",
  description: "Professionele woninginspectie en opdrachtbegeleiding",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="nl"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-slate-100 text-slate-900">
        <AppHeader />
        {children}
      </body>
    </html>
  );
}
