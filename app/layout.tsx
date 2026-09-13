import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/navigation/Header";
import { BottomNav } from "@/components/navigation/BottomNav";
import { RoleProvider } from "@/lib/context/RoleContext";
import { AuthGuard } from "@/components/auth/AuthGuard";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Advocato — Intelligence-Driven Legal Counsel",
  description: "Connect with verified, specialized attorneys through intelligent AI legal intake.",
  applicationName: "Advocato",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Advocato",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#FAF9F6",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`}>
      <body className="min-h-screen bg-background text-on-surface flex flex-col antialiased selection:bg-brass/20 selection:text-primary">
        <RoleProvider>
          <AuthGuard>
            <Header />
            <main className="flex-1 pt-16 pb-20 md:pb-10 flex flex-col">{children}</main>
            <BottomNav />
          </AuthGuard>
        </RoleProvider>
      </body>
    </html>
  );
}
