import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AppHeader } from "@/components/auth/AppHeader";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Eigen Huis Inspectie",
  description: "Professionele woninginspectie en opdrachtbegeleiding",
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
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full text-slate-900 dark:text-slate-100">
        <ThemeProvider>
          <AppHeader />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
