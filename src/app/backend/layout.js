"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearToken, getAuthHeaders } from "@/lib/auth";

export default function BackendLayout({ children }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const checkAdmin = async () => {
      try {
        const res = await fetch("http://localhost:3001/api/users/profile", {
          credentials: "include",
          cache: "no-store",
          headers: getAuthHeaders(),
        });

        if (res.ok) {
          const profile = await res.json();
          if (String(profile.role || "").trim().toLowerCase() === "admin") {
            setAuthorized(true);
            return;
          }
        } else {
          clearToken();
        }
      } catch {
        // network error — treat as unauthenticated
      }

      router.replace("/login");
    };

    checkAdmin();
  }, [router]);

  if (!authorized) return null;

  return <>{children}</>;
}
