import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { AppHeader } from "@/components/auth/AppHeader";
import { ThemeProvider } from "@/components/ThemeProvider";
import { PWAProvider } from "@/components/pwa/PWAProvider";
import { OfflineBanner } from "@/components/pwa/OfflineBanner";
import { UpdateBanner } from "@/components/pwa/UpdateBanner";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Eigen Huis Inspectie",
  description: "Professionele woninginspectie en opdrachtbegeleiding",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Eigenhuis",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#2563eb" },
    { media: "(prefers-color-scheme: dark)",  color: "#1e40af" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

const themeScript = `(function(){
  var t=localStorage.getItem('eh-theme')||'system';
  var f=localStorage.getItem('eh-fontsize')||'normaal';
  var dark=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);
  if(dark)document.documentElement.classList.add('dark');
  if(f==='groot')document.documentElement.setAttribute('data-fontsize','groot');
})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="nl"
      className={`${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="icon" href="/icons/favicon.ico" sizes="any" />
        <link rel="icon" href="/icons/icon-512.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon-180x180.png" />
      </head>
      <body className="min-h-full text-slate-900 dark:text-slate-100">
        <PWAProvider>
          <UpdateBanner />
          <ThemeProvider>
            <AppHeader />
            {children}
          </ThemeProvider>
          <OfflineBanner />
        </PWAProvider>
      </body>
    </html>
  );
}
