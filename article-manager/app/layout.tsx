import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "note Article Manager",
  description: "Gitで管理するnote記事の棚卸し・公開状況・運用実績を確認する個人用管理画面。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased">{children}</body>
    </html>
  );
}
