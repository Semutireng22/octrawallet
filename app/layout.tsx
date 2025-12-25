import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import QueryProvider from "@/components/providers/query-provider";
import "@fontsource/space-grotesk/400.css";
import "@fontsource/space-grotesk/700.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/600.css";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
});

export const metadata: Metadata = {
  title: {
    default: "OctraWallet | Next-Gen Privacy Wallet",
    template: "%s | OctraWallet",
  },
  description:
    "Secure, private, and fast blockchain wallet for the Octra network. Experience the future of decentralized finance with Obsidian Gold aesthetics.",
  keywords: [
    "Octra",
    "Wallet",
    "Blockchain",
    "Privacy",
    "Crypto",
    "DeFi",
    "Secure Wallet",
  ],
  authors: [{ name: "Octra Team" }],
  creator: "Octra Team",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://octrawallet.com",
    title: "OctraWallet | Next-Gen Privacy Wallet",
    description:
      "Secure, private, and fast blockchain wallet for the Octra network.",
    siteName: "OctraWallet",
    images: [
      {
        url: "/images/og-image.png", // We will need to ensure this exists or use logo
        width: 1200,
        height: 630,
        alt: "OctraWallet Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "OctraWallet | Next-Gen Privacy Wallet",
    description:
      "Secure, private, and fast blockchain wallet for the Octra network.",
    images: ["/images/og-image.png"],
    creator: "@octrawallet",
  },
  icons: {
    icon: "/images/logo.png",
    shortcut: "/images/logo.png",
    apple: "/images/logo.png",
  },
  manifest: "/manifest.json",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/images/logo.png" />
      </head>
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} antialiased bg-[#050505] text-white selection:bg-yellow-500/30 selection:text-yellow-200`}
      >
        <QueryProvider>{children}</QueryProvider>
        <Toaster />
      </body>
    </html>
  );
}
