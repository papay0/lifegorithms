import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lifegorithms | Arthur Papailhau",
  description: "Personal blog by Arthur Papailhau, Software Engineer at Uber (Eats). Sharing insights on technology, life, and personal growth.",
  metadataBase: new URL("https://lifegorithms.com"),
  openGraph: {
    title: "Lifegorithms",
    description: "Personal blog by Arthur Papailhau, Software Engineer at Uber (Eats)",
    type: "website",
    locale: "en_US",
    siteName: "Lifegorithms",
  },
  twitter: {
    card: "summary_large_image",
    title: "Lifegorithms",
    description: "Personal blog by Arthur Papailhau, Software Engineer at Uber (Eats)",
    creator: "@papay0",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
