"use client";

import type { ReactNode } from "react";

import Header from "./Header";
import Sidebar from "./Sidebar";

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({
  children
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-ivory">
      <Sidebar />

      <div className="min-h-screen lg:pl-64">
        <Header />

        <main>
          {children}
        </main>
      </div>
    </div>
  );
}