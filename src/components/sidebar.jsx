"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Home, User, Settings, Bell, Package, Tags, Users, History } from "lucide-react";
import { clearToken, getAuthHeaders } from "../lib/auth";



const AnimatedMenuToggle = ({
  toggle,
  isOpen
}) => (
  <button
    onClick={toggle}
    aria-label="สลับเมนู"
    className="focus:outline-none z-999">
    <motion.div animate={{ y: isOpen ? 13 : 0 }} transition={{ duration: 0.3 }}>
      <motion.svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        initial="closed"
        animate={isOpen ? "open" : "closed"}
        transition={{ duration: 0.3 }}
        className="text-black">
        <motion.path
          fill="transparent"
          strokeWidth="3"
          stroke="currentColor"
          strokeLinecap="round"
          variants={{
            closed: { d: "M 2 2.5 L 22 2.5" },
            open: { d: "M 3 16.5 L 17 2.5" },
          }} />
        <motion.path
          fill="transparent"
          strokeWidth="3"
          stroke="currentColor"
          strokeLinecap="round"
          variants={{
            closed: { d: "M 2 12 L 22 12", opacity: 1 },
            open: { opacity: 0 },
          }}
          transition={{ duration: 0.2 }} />
        <motion.path
          fill="transparent"
          strokeWidth="3"
          stroke="currentColor"
          strokeLinecap="round"
          variants={{
            closed: { d: "M 2 21.5 L 22 21.5" },
            open: { d: "M 3 2.5 L 17 16.5" },
          }} />
      </motion.svg>
    </motion.div>
  </button>
);






const CollapsibleSection = ({
  title,
  children
}) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-4">
      <button
        className="w-full flex items-center justify-between py-2 px-4 rounded-xl hover:bg-gray-100"
        onClick={() => setOpen(!open)}>
        <span className="font-semibold">{title}</span>
        {open ? <XIcon /> : <MenuIcon />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden">
            <div className="p-2">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const MenuIcon = () => (
  <motion.svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2">
    <motion.line x1="3" y1="12" x2="21" y2="12" />
  </motion.svg>
);

const XIcon = () => (
  <motion.svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2">
    <motion.line x1="18" y1="6" x2="6" y2="18" />
    <motion.line x1="6" y1="6" x2="18" y2="18" />
  </motion.svg>
);

const Sidebar = ({ title = "หน้าหลัก", children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [profile, setProfile] = useState({ username: "กำลังโหลด...", email: "", role: "user" });
  const router = useRouter();
  const pathname = usePathname();

  const mobileSidebarVariants = {
    hidden: { x: "-100%" },
    visible: { x: 0 },
  };

  const toggleSidebar = () => setIsOpen(!isOpen);
  const navigate = (path) => { router.push(path); setIsOpen(false); };

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

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch("http://localhost:3001/api/users/profile", {
          credentials: "include",
          cache: "no-store",
          headers: getAuthHeaders(),
        });

        if (!response.ok) {
          if (response.status === 401) {
            clearToken();
            router.replace("/login");
            return;
          }
          throw new Error("Failed to fetch profile");
        }

        const data = await response.json();
        setProfile({
          username: data.username || "ผู้ใช้",
          email: data.email || "",
          role: data.role || 'user',
        });
      } catch (error) {
        console.error("Error fetching profile:", error);
        setProfile({ username: "ผู้ใช้", email: "" });
      }
    };

    fetchProfile();
  }, [router]);

  return (
    <div className="flex h-screen">
      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={mobileSidebarVariants}
            transition={{ duration: 0.3 }}
            className="md:hidden fixed inset-0 z-50 bg-white text-black">
            <div className="flex flex-col h-full">
              {/* Profile Section */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-semibold">{profile.username}</p>
                    <p className="text-sm text-gray-500">{profile.email}</p>
                  </div>
                </div>
              </div>
              {/* Navigation Section */}
              <nav className="flex-1 p-4 overflow-y-auto">
                <ul>
                  {String(profile.role || '').toLowerCase() === 'admin' && (
                    <li className="mb-2">
                      <button
                        onClick={() => navigate("/backend/dashboard")}
                        className={`flex gap-2 font-medium text-sm items-center w-full py-2 px-4 rounded-xl hover:bg-gray-100 ${pathname === "/backend/dashboard" ? "bg-gray-100" : ""}` }>
                        <Home className="h-5 w-5" />
                        หน้าหลัก
                      </button>
                    </li>
                  )}
                  <li className="mb-2">
                    <button
                      onClick={() => navigate("/backend/products")}
                      className={`flex gap-2 font-medium text-sm items-center w-full py-2 px-4 rounded-xl hover:bg-gray-100 ${pathname.startsWith("/backend/products") ? "bg-gray-100" : ""}` }>
                      <Package className="h-5 w-5" />
                      จัดการสินค้า
                    </button>
                  </li>
                  <li className="mb-2">
                    <button
                      onClick={() => navigate("/backend/categories")}
                      className={`flex gap-2 font-medium text-sm items-center w-full py-2 px-4 rounded-xl hover:bg-gray-100 ${pathname.startsWith("/backend/categories") ? "bg-gray-100" : ""}` }>
                      <Tags className="h-5 w-5" />
                      จัดการหมวดหมู่
                    </button>
                  </li>
                  {String(profile.role || '').toLowerCase() === 'admin' && (
                    <li className="mb-2">
                      <button
                        onClick={() => navigate("/backend/users")}
                        className={`flex gap-2 font-medium text-sm items-center w-full py-2 px-4 rounded-xl hover:bg-gray-100 ${pathname.startsWith("/backend/users") ? "bg-gray-100" : ""}` }>
                        <Users className="h-5 w-5" />
                        จัดการผู้ใช้งาน
                      </button>
                    </li>
                  )}
                  <li className="mb-2">
                    <button
                      onClick={() => navigate("/backend/history")}
                      className={`flex gap-2 font-medium text-sm items-center w-full py-2 px-4 rounded-xl hover:bg-gray-100 ${pathname.startsWith("/backend/history") ? "bg-gray-100" : ""}` }>
                      <History className="h-5 w-5" />
                      ประวัติการซื้อ
                    </button>
                  </li>
                  <li className="mb-2">
                    <button
                      className="flex gap-2 font-medium text-sm items-center w-full py-2 px-4 rounded-xl hover:bg-gray-100">
                      <Bell className="h-5 w-5" />
                      การแจ้งเตือน
                    </button>
                  </li>
                  <li className="mb-2">
                    <button
                      className="flex gap-2 font-medium text-sm items-center w-full py-2 px-4 rounded-xl hover:bg-gray-100">
                      <Settings className="h-5 w-5" />
                      ตั้งค่า
                    </button>
                  </li>
                </ul>
                {/* Toggleable Sections */}
                <div className="mt-4">
                  <CollapsibleSection title="ตัวเลือกเพิ่มเติม">
                    <ul>
                      <li>
                        <button
                          className="w-full font-medium text-sm text-left p-2 rounded-xl hover:bg-gray-100">
                          แพ็กเกจ
                        </button>
                      </li>
                      <li>
                        <button
                          className="w-full font-medium text-sm text-left p-2 rounded-xl hover:bg-gray-100">
                          รูปแบบหน้าตา
                        </button>
                      </li>
                    </ul>
                  </CollapsibleSection>
                  <CollapsibleSection title="ข้อมูลเพิ่มเติม">
                    <p className="text-sm text-gray-500">
                      คุณสามารถดูรายละเอียดเพิ่มเติมได้ที่ส่วนนี้
                    </p>
                  </CollapsibleSection>
                </div>
              </nav>
              {/* Footer / Action Button */}
              <div className="p-4 border-t border-gray-200">
                <button
                  onClick={handleLogout}
                  className="w-full font-medium text-sm p-2 text-center bg-blue-100 rounded-xl hover:bg-blue-200">
                  ออกจากระบบ
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Desktop Sidebar */}
      <div
        className="hidden md:flex flex-col fixed top-0 left-0 h-full w-64 bg-white text-black shadow">
        {/* Profile Section */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div
              className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
              <User className="h-6 w-6" />
            </div>
            <div>
              <p className="font-semibold">{profile.username}</p>
              <p className="text-sm text-gray-500">{profile.email}</p>
            </div>
          </div>
        </div>
        {/* Navigation Section */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul>
            {String(profile.role || '').toLowerCase() === 'admin' && (
              <li className="mb-2">
                <button
                  onClick={() => navigate("/backend/dashboard")}
                  className={`flex gap-2 font-medium text-sm items-center w-full py-2 px-4 rounded-xl hover:bg-gray-100 ${pathname === "/backend/dashboard" ? "bg-gray-100" : ""}` }>
                  <Home className="h-5 w-5" />
                  หน้าหลัก
                </button>
              </li>
            )}
            <li className="mb-2">
              <button
                onClick={() => navigate("/backend/products")}
                className={`flex gap-2 font-medium text-sm items-center w-full py-2 px-4 rounded-xl hover:bg-gray-100 ${pathname.startsWith("/backend/products") ? "bg-gray-100" : ""}` }>
                <Package className="h-5 w-5" />
                จัดการสินค้า
              </button>
            </li>
            <li className="mb-2">
              <button
                onClick={() => navigate("/backend/categories")}
                className={`flex gap-2 font-medium text-sm items-center w-full py-2 px-4 rounded-xl hover:bg-gray-100 ${pathname.startsWith("/backend/categories") ? "bg-gray-100" : ""}` }>
                <Tags className="h-5 w-5" />
                จัดการหมวดหมู่
              </button>
            </li>
            {String(profile.role || '').toLowerCase() === 'admin' && (
              <li className="mb-2">
                <button
                  onClick={() => navigate("/backend/users")}
                  className={`flex gap-2 font-medium text-sm items-center w-full py-2 px-4 rounded-xl hover:bg-gray-100 ${pathname.startsWith("/backend/users") ? "bg-gray-100" : ""}` }>
                  <Users className="h-5 w-5" />
                  จัดการผู้ใช้งาน
                </button>
              </li>
            )}
            <li className="mb-2">
              <button
                onClick={() => navigate("/backend/history")}
                className={`flex gap-2 font-medium text-sm items-center w-full py-2 px-4 rounded-xl hover:bg-gray-100 ${pathname.startsWith("/backend/history") ? "bg-gray-100" : ""}` }>
                <History className="h-5 w-5" />
                ประวัติการซื้อ
              </button>
            </li>
            <li className="mb-2">
              <button
                className="flex gap-2 font-medium text-sm items-center w-full py-2 px-4 rounded-xl hover:bg-gray-100">
                <Bell className="h-5 w-5" />
                การแจ้งเตือน
              </button>
            </li>
            <li className="mb-2">
              <button
                className="flex gap-2 font-medium text-sm items-center w-full py-2 px-4 rounded-xl hover:bg-gray-100">
                <Settings className="h-5 w-5" />
                ตั้งค่า
              </button>
            </li>
          </ul>
          {/* Toggleable Sections */}
          <div className="mt-4">
            <CollapsibleSection title="ตัวเลือกเพิ่มเติม">
              <ul>
                <li>
                  <button
                    className="w-full font-medium text-sm text-left p-2 rounded-xl hover:bg-gray-100">
                    แพ็กเกจ
                  </button>
                </li>
                <li>
                  <button
                    className="w-full font-medium text-sm text-left p-2 rounded-xl hover:bg-gray-100">
                    รูปแบบหน้าตา
                  </button>
                </li>
              </ul>
            </CollapsibleSection>
            <CollapsibleSection title="ข้อมูลเพิ่มเติม">
              <p className="text-sm text-gray-500">
                คุณสามารถดูรายละเอียดเพิ่มเติมได้ที่ส่วนนี้
              </p>
            </CollapsibleSection>
          </div>
        </nav>
        {/* Footer / Action Button */}
        <div className="p-4 border-t border-gray-200">
          <button
            className="w-full font-medium text-sm p-2 text-center bg-blue-100 rounded-xl hover:bg-blue-200"
            onClick={handleLogout}
          >
            ออกจากระบบ
          </button>
        </div>
      </div>
      {/* Main Content Area */}
      <div className="flex-1 ml-0 md:ml-64 transition-all duration-300">
        {/* Top bar for mobile toggle */}
        <div
          className="p-4 bg-gray-100 border-b border-gray-200 md:hidden flex justify-between items-center">
          <h1 className="text-xl font-bold">{title}</h1>
          <AnimatedMenuToggle toggle={toggleSidebar} isOpen={isOpen} />
        </div>
        <div className="p-6">{children || (
          <>
            <h1 className="text-2xl font-bold">{title}</h1>
            <p className="text-sm font-medium">
              คุณสามารถดูรายละเอียดเพิ่มเติมได้ที่ส่วนนี้
            </p>
          </>
        )}</div>
      </div>
    </div>
  );
};

export { Sidebar };
