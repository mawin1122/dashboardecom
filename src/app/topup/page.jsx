"use client";

import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { getAuthHeaders } from "@/lib/auth";

function TopupPage() {
  const [giftLink, setGiftLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    tax_enabled: true,
    tax_percent: 2.3,
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("http://localhost:3001/api/topup/settings", {
          credentials: "include",
          headers: getAuthHeaders(),
        });
        const data = await res.json();
        if (res.ok) {
          setSettings({
            tax_enabled: Boolean(data.tax_enabled),
            tax_percent: Number(data.tax_percent || 2.3),
          });
        }
      } catch {
        // keep defaults when unavailable
      }
    };

    fetchSettings();
  }, []);

  const taxText = useMemo(() => {
    if (!settings.tax_enabled) {
      return "ตอนนี้ไม่มีการหักภาษี";
    }
    return `ระบบหักภาษี ${settings.tax_percent}% อัตโนมัติ`;
  }, [settings]);

  const handleConfirm = async () => {
    if (!giftLink.trim()) {
      await Swal.fire({
        icon: "warning",
        title: "กรุณากรอกลิงก์ซอง",
        text: "วางลิงก์ซอง TrueMoney Gift ก่อนกดยืนยัน",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:3001/api/topup/redeem", {
        method: "POST",
        credentials: "include",
        headers: getAuthHeaders({
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({
          gift_link: giftLink.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        const reason = String(data.reason || data.provider_response?.status?.message || "").trim();
        const hasHttpInReason = /http\s*\d{3}/i.test(reason);
        const statusHint = data.provider_status && !hasHttpInReason
          ? ` (Provider HTTP ${data.provider_status})`
          : "";
        const extraHint = String(data.hint || "").trim();
        const message = reason
          ? `${data.error || "เติมเงินไม่สำเร็จ"}: ${reason}${statusHint}`
          : `${data.error || "เติมเงินไม่สำเร็จ"}${statusHint}`;
        throw new Error(extraHint ? `${message} - ${extraHint}` : message);
      }

      await Swal.fire({
        icon: "success",
        title: "เติมเงินสำเร็จ",
        html: `
          <div style="text-align:left;line-height:1.8;">
            <p>ยอดซอง: <strong>${Number(data.amount || 0).toFixed(2)}</strong> บาท</p>
            <p>ภาษี: <strong>${Number(data.tax_amount || 0).toFixed(2)}</strong> บาท</p>
            <p>สุทธิ: <strong>${Number(data.net_amount || 0).toFixed(2)}</strong> บาท</p>
            <p>แต้มที่ได้รับ: <strong>${Number(data.points_added || 0)}</strong> แต้ม</p>
          </div>
        `,
      });

      setGiftLink("");
    } catch (err) {
      await Swal.fire({
        icon: "error",
        title: "เติมเงินไม่สำเร็จ",
        text: err.message || "เกิดข้อผิดพลาด",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl overflow-x-hidden px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <h1 className="mb-4 text-2xl font-bold sm:text-3xl">เติมเงิน</h1>

      <div className="rounded-lg border border-gray-300 bg-white p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          <img
            src="https://i.ytimg.com/vi/3lB4Onf9QU4/mqdefault.jpg"
            alt="ช่องทางเติมเงิน 1"
            className="h-40 w-full rounded object-cover sm:h-44"
          />
          <img
            src="https://thethaiger.com/wp-content/uploads/2023/08/Kasikornbank-Restructuring.jpg"
            alt="ช่องทางเติมเงิน 2"
            className="h-40 w-full rounded object-cover sm:h-44"
          />
          <img
            src="https://th.bing.com/th/id/OIP.fTvdLtNTp75zApGpWilIwAHaCk?o=7rm=3&rs=1&pid=ImgDetMain&o=7&rm=3"
            alt="ช่องทางเติมเงิน 3"
            className="h-40 w-full rounded object-cover sm:h-44"
          />
        </div>
      </div>

      <div className="mt-4 flex flex-col items-center rounded-lg border border-gray-300 bg-white px-4 pb-5 pt-4 text-center sm:px-6">
        <h2 className="mb-2 text-xl font-bold sm:text-2xl">ช่องทางการเติมเงิน</h2>
        <p className="mb-4 text-sm text-gray-600">{taxText}</p>

        <img
          src="https://us-east-1.tixte.net/uploads/bananashop.tixte.co/%E0%B8%B3%E0%B8%94%E0%B8%B3%E0%B8%94%E0%B8%B3%E0%B8%94%E0%B8%B3%E0%B8%94.jpg"
          alt="QR เติมเงิน"
          className="h-auto w-full max-w-sm rounded object-cover sm:max-w-md"
        />

        <input
          type="text"
          className="mt-4 w-full max-w-sm rounded border border-gray-300 p-2 text-center sm:max-w-md"
          placeholder="วางลิงก์ซอง TrueMoney Gift"
          value={giftLink}
          onChange={(e) => setGiftLink(e.target.value)}
        />

        <button
          onClick={handleConfirm}
          disabled={loading}
          className="mt-4 w-full max-w-sm rounded bg-blue-500 p-2 text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-60 sm:max-w-md"
        >
          {loading ? "กำลังตรวจสอบ..." : "ยืนยัน"}
        </button>
      </div>
    </div>
  );
}

export default TopupPage;
