"use client";

import { usePathname } from "next/navigation";
import { BottomNavBar } from "@/components/navbar";

export default function LayoutShell({ children }) {
  const pathname = usePathname();
  const isBackend = pathname?.startsWith("/backend");

  return (
    <>
      {!isBackend && <BottomNavBar />}
      <main className={isBackend ? "flex-1" : "flex-1 pt-14"}>{children}</main>
    </>
  );
}
