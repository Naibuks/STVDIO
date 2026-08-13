import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";
import SocketProvider from "@/components/SocketProvider";
import SiteHeader from "@/components/SiteHeader";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "STVDIO°",
  description:
    "A creative networking, portfolio, collaboration and marketplace platform.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          {/* One socket for the whole app — mounted here so navigation
              reuses the connection instead of opening a new one per route. */}
          <SocketProvider>
            <SiteHeader />
            <div className="flex flex-1 flex-col">{children}</div>
          </SocketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
