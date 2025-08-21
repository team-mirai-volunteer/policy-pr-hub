import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ChakraProvider, ColorModeScript } from "@chakra-ui/react";
import theme from "../theme";
import { AuthProvider } from "@/contexts/AuthContext";
import Header from "@/components/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "政策PR Hub - 政策改善提案の分析・可視化プラットフォーム",
  description: "team-mirai/policyリポジトリから収集された1700+件の政策改善提案PRデータを分析・可視化するプラットフォーム。階層クラスタリング、散布図分析、広聴AI分析などの高度な分析結果を提供します。",
  openGraph: {
    title: "政策PR Hub - 政策改善提案の分析・可視化プラットフォーム",
    description: "team-mirai/policyリポジトリから収集された1700+件の政策改善提案PRデータを分析・可視化するプラットフォーム。階層クラスタリング、散布図分析、広聴AI分析などの高度な分析結果を提供します。",
    url: "https://policy-pr-hub.vercel.app",
    siteName: "政策PR Hub",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "政策PR Hub - 政策改善提案の分析・可視化プラットフォーム",
      },
    ],
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "政策PR Hub - 政策改善提案の分析・可視化プラットフォーム",
    description: "team-mirai/policyリポジトリから収集された1700+件の政策改善提案PRデータを分析・可視化するプラットフォーム。",
    images: ["/og-image.png"],
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
        <ColorModeScript initialColorMode="system" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ChakraProvider theme={theme}>
          <AuthProvider>
            <Header />
            {children}
          </AuthProvider>
        </ChakraProvider>
      </body>
    </html>
  );
}
