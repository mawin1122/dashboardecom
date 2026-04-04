"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Home, Package, Tags, History, Users, ShoppingBag, LogIn, LogOut, User, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { clearToken, getAuthHeaders } from "@/lib/auth";

const navItems = [
  { label: "หน้าหลัก", icon: Home, href: "/home" },
  { label: "สินค้า", icon: Package, href: "/backend/products" },
  { label: "หมวดหมู่", icon: Tags, href: "/backend/categories" },
  { label: "ประวัติ", icon: History, href: "/backend/history" },
  { label: "ผู้ใช้", icon: Users, href: "/backend/users" },
];

export function BottomNavBar({ className, stickyTop = false, stickyBottom = false }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("http://localhost:3001/api/users/profile", {
          credentials: "include",
          cache: "no-store",
          headers: getAuthHeaders(),
        });
        if (res.ok) setUser(await res.json());
        else setUser(null);
      } catch {
        setUser(null);
      }
    };
    fetchProfile();
  }, [pathname]);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch("http://localhost:3001/api/users/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      clearToken();
      router.replace("/login");
    }
  };


  const navigate = (href) => {
    setMobileOpen(false);
    router.push(href);
  };

  return (
    <header
      className={cn(
        "w-full z-50 border-b bg-background",
        stickyTop && "fixed top-0 inset-x-0",
        stickyBottom && "fixed bottom-0 inset-x-0",
        className
      )}
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6 h-14 flex items-center justify-between gap-4">

        {/* brand */}
        <button
          type="button"
          onClick={() => navigate("/home")}
          className="flex items-center gap-2 shrink-0 focus:outline-none"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
            <ShoppingBag size={14} strokeWidth={2.5} className="text-primary-foreground" />
          </span>
          <span className="font-semibold text-sm tracking-tight">E-Commerce</span>
        </button>

        {/* desktop nav */}
        <nav className="hidden md:flex items-center gap-1 flex-1 px-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
            return (
              <Button
                key={item.label}
                variant={isActive ? "secondary" : "ghost"}
                size="sm"
                onClick={() => navigate(item.href)}
                className="gap-1.5 text-xs"
              >
                <Icon size={14} />
                {item.label}
              </Button>
            );
          })}
        </nav>

        {/* right side */}
        <div className="flex items-center gap-2 shrink-0">
          {user ? (
            <div className="hidden md:flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-600 ring-1 ring-amber-200">
                🪙 {user.points ?? 0} pts
              </span>

              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <User size={14} />
                <span className="max-w-[100px] truncate">{user.username || user.email}</span>
              </div>
              <Separator orientation="vertical" className="h-4" />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="gap-1.5 text-xs text-destructive hover:text-destructive"
              >
                <LogOut size={14} />
                ออกจากระบบ
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              onClick={() => navigate("/login")}
              className="hidden md:flex gap-1.5 text-xs"
            >
              <LogIn size={14} />
              เข้าสู่ระบบ
            </Button>
          )}

          {/* hamburger */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="เมนู"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </Button>
        </div>
      </div>

      {/* mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t bg-background px-4 pb-4 pt-2">
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
              return (
                <Button
                  key={item.label}
                  variant={isActive ? "secondary" : "ghost"}
                  className="justify-start gap-2"
                  onClick={() => navigate(item.href)}
                >
                  <Icon size={16} />
                  {item.label}
                </Button>
              );
            })}
          </nav>

          {user ? (
            <>
              <Separator className="my-3" />
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <User size={14} />
                  <span className="truncate max-w-[160px]">{user.username || user.email}</span>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleLogout}
                  className="gap-1.5 text-xs"
                >
                  <LogOut size={14} />
                  ออกจากระบบ
                </Button>
              </div>
            </>
          ) : (
            <>
              <Separator className="my-3" />
              <Button className="w-full gap-2" onClick={() => navigate("/login")}>
                <LogIn size={16} />
                เข้าสู่ระบบ
              </Button>
            </>
          )}
        </div>
      )}
    </header>
  );
}

export default BottomNavBar;
