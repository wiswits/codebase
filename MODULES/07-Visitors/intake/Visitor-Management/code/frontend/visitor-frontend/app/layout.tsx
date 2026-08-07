import type { Metadata } from "next";
import "./globals.css";

import VisitorProvider from "@/providers/VisitorProvider";

export const metadata: Metadata = {
  title: "WisWits Visitor Management",
  description: "Enterprise Visitor Management Module",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <VisitorProvider>
          {children}
        </VisitorProvider>
      </body>
    </html>
  );
}