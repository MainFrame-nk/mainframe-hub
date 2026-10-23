import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";

const inter = Inter({ subsets: ["latin", "cyrillic"], variable: "--font-sans" });
const mono = JetBrains_Mono({ subsets: ["latin", "cyrillic"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "MainFrame Hub // Full-Stack Architect & System Creator",
  description:
    "Персональный хаб проектов, архитектура высоконагруженных веб-платформ, экосистема Okaeri Gaming и приватная Life & Data OS.",
  keywords: [
    "Full-Stack Developer",
    "System Architect",
    "TypeScript",
    "Next.js",
    "Node.js",
    "Prisma ORM",
    "Okaeri Gaming",
  ],
  authors: [{ name: "MainFrame Dev" }],
  creator: "MainFrame Dev",
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: "https://mainframe.dev", // Заменишь потом на свой реальный домен
    title: "MainFrame Hub // Full-Stack Architect & System Creator",
    description:
      "Архитектура цифровых экосистем, витрина проектов и защищенное ядро управления разработкой.",
    siteName: "MainFrame Hub",
    // Next.js автоматически подхватит сгенерированную нами иконку/картинку из src/app/icon.tsx как превью
  },
  twitter: {
    card: "summary_large_image",
    title: "MainFrame Hub // Full-Stack Architect",
    description: "Персональный хаб проектов и защищенная операционная система разработчика.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className="dark">
      <body className={`${inter.variable} ${mono.variable} font-sans antialiased bg-obsidian text-slate-100`}>
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}