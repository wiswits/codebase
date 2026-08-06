import type {
  ReactNode
} from "react";

import AppShell from "@/components/layout/AppShell";

interface AlumniLayoutProps {
  children: ReactNode;
}

export default function AlumniLayout({
  children
}: AlumniLayoutProps) {
  return (
    <AppShell>
      {children}
    </AppShell>
  );
}