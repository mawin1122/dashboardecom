"use client"
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearToken, getAuthHeaders } from "@/lib/auth";





function Loginpage() {
  const router = useRouter();

  const [ email, setEmail] = useState("");
  const [ password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch("http://localhost:3001/api/users/profile", {
          credentials: "include",
          cache: "no-store",
          headers: getAuthHeaders(),
        });
        if (res.ok) {
          const profile = await res.json();
          if (String(profile.role || "").trim().toLowerCase() === "admin") {
            router.replace("/backend/dashboard");
          } else {
            router.replace("/home");
          }
          return;
        }

        if (res.status === 401) {
          clearToken();
        }
      } catch (error) {
        console.error("Session check failed:", error);
      }
    };

    checkSession();
  }, [router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    try {
      const response = await fetch("http://localhost:3001/api/users/login", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const contentType = response.headers.get("content-type") || "";
      const data = contentType.includes("application/json")
        ? await response.json()
        : { error: await response.text() };

      if (response.ok) {
        console.log("เข้าสู่ระบบสำเร็จ:", data);
        if (data?.token) {
          localStorage.setItem("token", data.token);
        }
        if (String(data?.user?.role || "").trim().toLowerCase() === "admin") {
          router.push("/backend/dashboard");
          return;
        }
        router.push("/home");
      } else {
        const message = data?.error || data?.message || `เข้าสู่ระบบไม่สำเร็จ (${response.status})`;
        setErrorMessage(message);
        console.error("เข้าสู่ระบบไม่สำเร็จ:", { status: response.status, message, raw: data });
      }
    } catch (error) {
      setErrorMessage("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาตรวจสอบว่า backend กำลังทำงานอยู่");
      console.error("เกิดข้อผิดพลาดระหว่างเข้าสู่ระบบ:", error);
    }
  };

  //login page
    return (
      <div className="flex items-center justify-center h-screen text-black">
        <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-center">เข้าสู่ระบบบัญชีของคุณ</h2>
          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">อีเมล</label>
              <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200" placeholder="กรอกอีเมล" />
            </div>
            <div>

              <label htmlFor="password" className="block text-sm font-medium text-gray-700">รหัสผ่าน</label>
              <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200" placeholder="กรอกรหัสผ่าน" />
            </div>
            {errorMessage && (
              <p className="text-sm text-red-600">{errorMessage}</p>
            )}
            <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring focus:ring-blue-200">เข้าสู่ระบบ</button>
          </form>
          <div className="text-sm text-center">

          </div>
            ยังไม่มีบัญชีใช่ไหม? <a href="/register" className="text-blue-600 hover:underline">สมัครสมาชิกที่นี่</a>  

          </div>
        </div>

  )
}

export default Loginpage;