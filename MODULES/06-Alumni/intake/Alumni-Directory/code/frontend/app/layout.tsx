import type { Metadata } from "next";
import type { ReactNode } from "react";

import {
  Playfair_Display,
  Source_Sans_3
} from "next/font/google";

import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap"
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source-sans",
  display: "swap"
});

export const metadata: Metadata = {
  title: {
    default: "Alumni Directory | WisWits",
    template: "%s | WisWits"
  },
  description:
    "WisWits Alumni Directory module"
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${playfair.variable} ${sourceSans.variable}`}
      >
        {children}
      </body>
    </html>
  );
}