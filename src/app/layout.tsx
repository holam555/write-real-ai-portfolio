import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/lib/i18n/context";
import FeedbackButton from "@/components/FeedbackButton";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Write Real AI — 降低 AI 檢測率，安心交出你的報告",
  description:
    "用 AI 輔助寫完報告 卻怕被檢測是 AI？貼上你的初稿，幫你改寫成真人筆觸的文章，降低 AI 檢測率。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant" suppressHydrationWarning>
      <head>
        <script async src="https://tally.so/widgets/embed.js"></script>
      </head>
      <body
        className={`${plusJakarta.variable} antialiased`}
      >
        <LanguageProvider>{children}</LanguageProvider>
        <FeedbackButton />
      </body>
    </html>
  );
}
