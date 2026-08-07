import type { Metadata } from "next";
import { PmsUserProvider } from "@/modules/pms/context/pms-user-context";
import { PmsShell } from "@/modules/pms/components/shared/PmsShell";

export const metadata: Metadata = {
  title: "PMS · WisWits",
  description: "Performance Management & Appraisal module",
};

export default function PmsLayout({ children }: { children: React.ReactNode }) {
  return (
    <PmsUserProvider>
      <PmsShell>{children}</PmsShell>
    </PmsUserProvider>
  );
}
