"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";

import { motion } from "framer-motion";
import {
  Home,
  Package,
  Tags,
  History,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";

const navItems = [
  { label: "หน้าหลัก", icon: Home, href: "/home" },
  { label: "สินค้า", icon: Package, href: "/backend/products" },
  { label: "หมวดหมู่", icon: Tags, href: "/backend/categories" },
  { label: "ประวัติ", icon: History, href: "/backend/history" },
  { label: "ผู้ใช้", icon: Users, href: "/backend/users" },
];

const MOBILE_LABEL_WIDTH = 72;

export function BottomNavBar({
  className,
  defaultIndex = 0,
  stickyTop = false,
  stickyBottom = false,
}) {
  const [activeIndex, setActiveIndex] = useState(defaultIndex);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const router = useRouter();
  const pathname = usePathname();

  return (
    <motion.nav
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 26 }}
      role="navigation"
      aria-label="Bottom Navigation"
      className={cn(
        "bg-card dark:bg-card border border-border dark:border-sidebar-border rounded-full flex items-center p-2 shadow-xl space-x-1 min-w-[320px] max-w-[95vw] h-[52px]",
        stickyTop && "fixed inset-x-0 top-4 mx-auto z-50 w-fit",
        stickyBottom && "fixed inset-x-0 bottom-4 mx-auto z-50 w-fit",
        className
      )}>
      {navItems.map((item, idx) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || activeIndex === idx;
        const isHovered = hoveredIndex === idx;
        const showLabel = isActive || isHovered;

        return (
          <motion.button
            key={item.label}
            whileTap={{ scale: 0.97 }}
            onMouseEnter={() => setHoveredIndex(idx)}
            onMouseLeave={() => setHoveredIndex(null)}
            className={cn(
              "flex items-center gap-0 px-3 py-2 rounded-full transition-colors duration-200 relative h-10 min-w-[44px] min-h-[40px] max-h-[44px]",
              isActive
                ? "bg-primary/10 dark:bg-primary/15 text-primary dark:text-primary gap-2"
                : "bg-transparent text-muted-foreground dark:text-muted-foreground hover:bg-muted dark:hover:bg-muted",
              isHovered && !isActive && "gap-2",
              "focus:outline-none focus-visible:ring-0"
            )}
            onClick={() => { setActiveIndex(idx); router.push(item.href); }}
            aria-label={item.label}
            type="button">
            <Icon
              size={22}
              strokeWidth={2}
              aria-hidden
              className="transition-colors duration-200" />
            <motion.div
              initial={false}
              animate={{
                width: showLabel ? `${MOBILE_LABEL_WIDTH}px` : "0px",
                opacity: showLabel ? 1 : 0,
                marginLeft: showLabel ? "8px" : "0px",
              }}
              transition={{
                width: { type: "spring", stiffness: 350, damping: 32 },
                opacity: { duration: 0.19 },
                marginLeft: { duration: 0.19 },
              }}
              className={cn("overflow-hidden flex items-center max-w-[72px]")}>
              <span
                className={cn(
                  "font-medium text-xs whitespace-nowrap select-none transition-opacity duration-200 overflow-hidden text-ellipsis text-[clamp(0.625rem,0.5263rem+0.5263vw,1rem)] leading-[1.9]",
                  showLabel ? "text-primary dark:text-primary" : "opacity-0"
                )}
                title={item.label}>
                {item.label}
              </span>
            </motion.div>
          </motion.button>
        );
      })}
    </motion.nav>
  );
}

export default BottomNavBar;
