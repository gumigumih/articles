import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Article inventory API",
  description: "記事の棚卸し・公開情報・分析値を管理するAPI。",
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
