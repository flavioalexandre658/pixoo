import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
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
  // Remove NextIntlClientProvider from root layout as it should only be in locale-specific layout
  return (
    <html lang="en">
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
