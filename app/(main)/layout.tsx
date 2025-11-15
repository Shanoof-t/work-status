// app/(main)/layout.tsx
"use client";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const user = localStorage.getItem("user");
      if (!user) {
        router.replace("/sign-up");
      }
    }
  }, [router]);

  return <div>{children}</div>;
}
