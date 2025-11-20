import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToasterProvider } from "@/components/toaster-provider";
import { ThemeProvider } from "@/components/theme-provider";

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
  description: "Personal blog by Arthur Papailhau, former Software Engineer at Uber (Eats) and Meta AI, currently building my own startup. Sharing insights on technology, entrepreneurship, and personal growth.",
  metadataBase: new URL("https://lifegorithms.com"),
  openGraph: {
    title: "Lifegorithms",
    description: "Personal blog by Arthur Papailhau, former Software Engineer at Uber (Eats) and Meta AI, currently building my own startup",
    type: "website",
    locale: "en_US",
    siteName: "Lifegorithms",
    images: [
      {
        url: "/api/og",
        width: 1200,
        height: 630,
        alt: "Lifegorithms",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Lifegorithms",
    description: "Personal blog by Arthur Papailhau, former Software Engineer at Uber (Eats) and Meta AI, currently building my own startup",
    creator: "@papay0",
    images: ["/api/og"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          {children}
          <ToasterProvider />
        </ThemeProvider>
      </body>
    </html>
  );
}
