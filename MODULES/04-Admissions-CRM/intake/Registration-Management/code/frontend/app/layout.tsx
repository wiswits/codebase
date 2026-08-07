import type { Metadata } from "next";

import "./globals.css";

import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "Registration Management | WisWits",
  description:
    "Student Registration Management module for WisWits.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}