import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Footer from "@/components/Footer";
import NicknamePrompt from "@/components/NicknamePrompt";
import QueryProvider from "@/providers/QueryProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400"],
  variable: "--font-inter",
  display: "swap",
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
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
        />
      </head>
      <body
        className={`${inter.variable} antialiased flex flex-col min-h-screen`}
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
