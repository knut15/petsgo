import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import QueryProvider from "@/providers/QueryProvider";
import NicknamePrompt from "@/components/NicknamePrompt";
import Footer from "@/components/Footer";
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
  title: "반려동물 동반 여행 - 강아지와 함께하는 여행",
  description:
    "반려동물과 함께 갈 수 있는 한국의 관광지, 숙박, 음식점, 쇼핑 정보를 찾아보세요",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
      >
        <QueryProvider>
          <div className="flex-1">{children}</div>
          <Footer />
          <NicknamePrompt />
        </QueryProvider>
      </body>
    </html>
  );
}
