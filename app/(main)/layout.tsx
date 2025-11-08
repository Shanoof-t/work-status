"use client";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";

export default function layout({ children }: { children: any }) {
  const router = useRouter();

  useEffect(() => {
    if (window !== undefined) {
      const user = localStorage.getItem("user");
      if (!user) {
        return router.replace("/sign-up");
      }
    }
  }, []);

  return <div>{children}</div>;
}
