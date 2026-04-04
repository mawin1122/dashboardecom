"use client"
import { useState } from "react";





function RegisterPage() {

  const [ email, setEmail] = useState("");
  const [ password, setPassword] = useState("");
    const [ username, setUsername] = useState("");

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:3001/api/users/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, username, password }),
      });
      const data = await response.json();
      if (response.ok) {
        console.log("สมัครสมาชิกสำเร็จ:", data);
        alert("สมัครสมาชิกสำเร็จ");
      } else {
        console.error("สมัครสมาชิกไม่สำเร็จ:", data);
        alert("สมัครสมาชิกไม่สำเร็จ: " + data.error);
      }
    } catch (error) {
      console.error("เกิดข้อผิดพลาดระหว่างสมัครสมาชิก:", error);
    }
  };

  //register page
    return (
      <div className="flex items-center justify-center h-screen text-black">
        <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-center">สมัครสมาชิก</h2>
          <form className="space-y-4">
            <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700">ชื่อผู้ใช้</label>
                <input type="text" id="username" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200" placeholder="กรอกชื่อผู้ใช้" />   

            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">อีเมล</label>
              <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200" placeholder="กรอกอีเมล" />
            </div>
            <div>

              <label htmlFor="password" className="block text-sm font-medium text-gray-700">รหัสผ่าน</label>
              <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200" placeholder="กรอกรหัสผ่าน" />
            </div>
            <button type="submit" onClick={handleRegister} className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring focus:ring-blue-200">สมัครสมาชิก</button>
          </form>
          <div className="text-sm text-center">

          </div>
            มีบัญชีอยู่แล้ว? <a href="/login" className="text-blue-600 hover:underline">เข้าสู่ระบบที่นี่</a>
        </div>
      </div>
  )
}

export default RegisterPage;