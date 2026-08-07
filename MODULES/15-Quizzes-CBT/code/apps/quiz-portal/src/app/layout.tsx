import "./globals.css";
import "katex/dist/katex.min.css";
import AuthGuard from "@/components/AuthGuard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "WISWITS Quiz Portal",
  description: "Premium quiz platform for schools, JEE, NEET",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body suppressHydrationWarning><AuthGuard>{children}</AuthGuard></body>
    </html>
  );
}
