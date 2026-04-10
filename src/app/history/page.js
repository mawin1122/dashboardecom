"use client";

import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { getAuthHeaders } from "@/lib/auth";
import Footer from "@/components/footer";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3001/api";

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function HistoryPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const handleViewProduct = async (order) => {
    const purchasedItemsList = Array.isArray(order.purchased_items_list)
      ? order.purchased_items_list
      : [];

    const purchasedItemsFallback = String(order.purchased_items || "")
      .split(/\r?\n|,/) 
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    const mergedItems = purchasedItemsList.length > 0 ? purchasedItemsList : purchasedItemsFallback;
    const purchasedItemsHtml = mergedItems.length > 0
      ? mergedItems.map((item) => `- ${escapeHtml(item)}`).join("<br />")
      : "-";

    await Swal.fire({
      title: "รายละเอียดสินค้าที่ซื้อ",
      html: `
        <div class="app-swal-form text-left">
          <div class="app-swal-grid">
            <div class="app-swal-field">
              <label class="app-swal-label">รหัสคำสั่งซื้อ</label>
              <input class="app-swal-input" value="#${order.id ?? "-"}" disabled />
            </div>
            <div class="app-swal-field">
              <label class="app-swal-label">วันที่ซื้อ</label>
              <input class="app-swal-input" value="${formatDate(order.created_at)}" disabled />
            </div>
          </div>

          <div class="app-swal-field">
            <label class="app-swal-label">สินค้า</label>
            <input class="app-swal-input" value="${escapeHtml(order.product_name || `Product #${order.product_id || "-"}`)}" disabled />
          </div>

          <div class="app-swal-grid">
            <div class="app-swal-field">
              <label class="app-swal-label">จำนวน</label>
              <input class="app-swal-input" value="${order.quantity || 0} รายการ" disabled />
            </div>
            <div class="app-swal-field">
              <label class="app-swal-label">ราคารวม</label>
              <input class="app-swal-input" value="฿${formatCurrency(order.total_price)}" disabled />
            </div>
          </div>

          <div class="app-swal-field">
            <label class="app-swal-label">สถานะ</label>
            <input class="app-swal-input" value="${escapeHtml(order.status || "completed")}" disabled />
          </div>

          <div class="app-swal-field">
            <label class="app-swal-label">รายการที่ได้รับจาก stock</label>
            <div class="app-swal-textarea" style="white-space: normal;">${purchasedItemsHtml}</div>
          </div>
        </div>
      `,
      confirmButtonText: "ปิด",
      customClass: {
        popup: "app-swal-popup",
        title: "app-swal-title",
        htmlContainer: "app-swal-content",
        confirmButton: "app-swal-confirm",
      },
    });
  };

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(`${API_BASE}/history/getPurchaseHistory`, {
          credentials: "include",
          cache: "no-store",
          headers: getAuthHeaders(),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data?.error || "ไม่สามารถดึงข้อมูลประวัติได้");
          return;
        }

        setOrders(Array.isArray(data) ? data : []);
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
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">สินค้า</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">#{order.id}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{order.quantity} รายการ</td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                      ฿{formatCurrency(order.total_price)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                        ✓ เสร็จสิ้น
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        type="button"
                        onClick={() => handleViewProduct(order)}
                        className="rounded-md border border-blue-500 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50"
                      >
                        ดูสินค้า
                      </button>
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
