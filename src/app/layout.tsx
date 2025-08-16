import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

import GA from "@/components/tracking/ga";
import GTM from "@/components/tracking/gtm";
import MetaPixel from "@/components/tracking/meta-pixel";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pixoo - AI Image Generator",
  description: "Generate stunning images with AI using Flux models",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html>
      <header>
        <GA GA_ID={process.env.NEXT_PUBLIC_GA_ID || ""} />
        <GTM GTM_ID={process.env.NEXT_PUBLIC_GTM_ID || ""} />
        <MetaPixel
          META_PIXEL_ID={process.env.NEXT_PUBLIC_META_PIXEL_ID || ""}
        />
      </header>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div>
          <Toaster
            position="top-center"
            toastOptions={{
              success: {
                duration: 3000,
                iconTheme: {
                  primary: "#10b981",
                  secondary: "white",
                },
              },
            }}
          />
          {children}
        </div>
      </body>
    </html>
  );
}
