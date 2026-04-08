"use client";

import { useEffect, useState } from "react";
import { getAuthHeaders } from "@/lib/auth";
import Footer from "@/components/footer";

function HistoryPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch("http://localhost:3001/api/orders/history", {
          credentials: "include",
          cache: "no-store",
          headers: getAuthHeaders(),
        });

        if (!res.ok) {
          setError("ไม่สามารถดึงข้อมูลประวัติได้");
          return;
        }

        const data = await res.json();
        setOrders(data);
      } catch (err) {
        console.error("Error fetching history:", err);
        setError("เกิดข้อผิดพลาดในการดึงข้อมูล");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">ประวัติการซื้อ</h1>
          <p className="mt-2 text-gray-600">ดูรายการสั่งซื้อของคุณทั้งหมด</p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-12">
            <div className="text-gray-500">กำลังโหลด...</div>
          </div>
        )}

        {!loading && orders.length === 0 && (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
            <p className="text-gray-500">ยังไม่มีประวัติการซื้อ</p>
          </div>
        )}

        {!loading && orders.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">หมายเลขคำสั่ง</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">วันที่</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">จำนวนสินค้า</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">ราคารวม</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">สถานะ</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">#{order.id}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(order.created_at).toLocaleDateString("th-TH", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{order.quantity} รายการ</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      ฿{(order.total_price || 0).toLocaleString("th-TH", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                        ✓ เสร็จสิ้น
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default HistoryPage;
