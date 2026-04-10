"use client";

import { usePathname } from "next/navigation";
import { BottomNavBar } from "@/components/navbar";

export default function LayoutShell({ children }) {
  const pathname = usePathname();
  const isBackend = pathname?.startsWith("/backend");
  const isAuthPage = pathname === "/login" || pathname === "/register";
  const showNavbar = !isBackend && !isAuthPage;

  return (
    <>
      {showNavbar && <BottomNavBar />}
      <main className={showNavbar ? "flex-1 pt-14" : "flex-1"}>{children}</main>
    </>
  );
}
