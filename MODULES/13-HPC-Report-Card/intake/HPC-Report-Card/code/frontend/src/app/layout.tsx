import type { Metadata } from 'next';
import React from 'react';
import { ToastProvider } from '@/components/ui/ToastProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'WisWits | HPC Report Card',
  description: 'Holistic Progress Card management for WisWits.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
