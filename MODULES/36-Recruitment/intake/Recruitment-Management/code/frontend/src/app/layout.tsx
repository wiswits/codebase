import type { Metadata } from 'next';
import './globals.css';
import { QueryProvider } from '@/providers/query-provider';
import { ToastProvider } from '@/providers/toast-provider';

export const metadata: Metadata = {
  title: 'Recruitment Management - WisWits',
  description: 'HR Recruitment Management Module',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>
          {children}
          <ToastProvider children={undefined} />
        </QueryProvider>
      </body>
    </html>
  );
}