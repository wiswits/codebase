"use client";

import type { ReactNode } from "react";
import { Toaster } from "react-hot-toast";

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({
  children,
}: ToastProviderProps) {
  return (
    <>
      {children}

      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={8}
        toastOptions={{
          duration: 4000,
          style: {
            background: "#ffffff",
            color: "#0F2147",
            border: "1px solid #E5E7EB",
          },
        }}
      />
    </>
  );
}