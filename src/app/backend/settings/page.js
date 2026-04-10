"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { clearToken, getAuthHeaders } from "@/lib/auth";

export default function BackendTopupSettingsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    recipient_mobile: "",
    tax_enabled: true,
    tax_percent: 2.3,
  });

  useEffect(() => {
    const init = async () => {
      setMounted(true);
      try {
        const profileRes = await fetch("http://localhost:3001/api/users/profile", {
          credentials: "include",
          cache: "no-store",
          headers: getAuthHeaders(),
        });

        if (!profileRes.ok) {
          if (profileRes.status === 401) {
            clearToken();
          }
          router.replace("/login");
          return;
        }

        const profile = await profileRes.json();
        if (String(profile.role || "").toLowerCase() !== "admin") {
          router.replace("/backend/dashboard");
          return;
        }

        const settingsRes = await fetch("http://localhost:3001/api/topup/settings/admin", {
          credentials: "include",
          headers: getAuthHeaders(),
        });

        const settingsData = await settingsRes.json();
        if (!settingsRes.ok) {
          throw new Error(settingsData.error || "โหลดค่าตั้งค่าไม่สำเร็จ");
        }

        setForm({
          recipient_mobile: settingsData.recipient_mobile || "",
          tax_enabled: Boolean(settingsData.tax_enabled),
          tax_percent: Number(settingsData.tax_percent || 2.3),
        });
        setAuthorized(true);
      } catch (err) {
        await Swal.fire({
          icon: "error",
          title: "โหลดข้อมูลไม่สำเร็จ",
          text: err.message || "กรุณาลองใหม่",
        });
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [router]);

  const handleSave = async () => {
    const mobile = String(form.recipient_mobile || "").replace(/\D+/g, "");
    if (mobile.length < 9 || mobile.length > 15) {
      await Swal.fire({
        icon: "warning",
        title: "เบอร์ไม่ถูกต้อง",
        text: "กรุณากรอกเบอร์สำหรับรับซองให้ถูกต้อง",
      });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("http://localhost:3001/api/topup/settings/admin", {
        method: "PUT",
        credentials: "include",
        headers: getAuthHeaders({
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({
          recipient_mobile: mobile,
          tax_enabled: form.tax_enabled,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "บันทึกไม่สำเร็จ");
      }

      setForm((prev) => ({
        ...prev,
        recipient_mobile: data.recipient_mobile || prev.recipient_mobile,
        tax_enabled: Boolean(data.tax_enabled),
        tax_percent: Number(data.tax_percent || 2.3),
      }));

      await Swal.fire({
        icon: "success",
        title: "บันทึกแล้ว",
        timer: 1300,
        showConfirmButton: false,
      });
    } catch (err) {
      await Swal.fire({
        icon: "error",
        title: "บันทึกไม่สำเร็จ",
        text: err.message || "กรุณาลองใหม่",
      });
    } finally {
      setSaving(false);
    }
  };

  if (!mounted || loading || !authorized) {
    return null;
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">ตั้งค่าระบบเติมเงิน</h1>
        <p className="text-sm text-gray-500">กำหนดเบอร์รับซองและการหักภาษีสำหรับ Topup</p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">เบอร์รับซอง TrueMoney</label>
          <input
            type="text"
            value={form.recipient_mobile}
            onChange={(e) => setForm((prev) => ({ ...prev, recipient_mobile: e.target.value }))}
            className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
            placeholder="เช่น 0891234567"
          />
        </div>

        <div className="rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">เปิดใช้งานการหักภาษี</p>
              <p className="text-xs text-gray-500">หักภาษี {Number(form.tax_percent || 2.3).toFixed(1)}% ตอนผู้ใช้เติมเงิน</p>
            </div>
            <label className="inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={form.tax_enabled}
                onChange={(e) => setForm((prev) => ({ ...prev, tax_enabled: e.target.checked }))}
              />
            </label>
          </div>
        </div>

        <div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "กำลังบันทึก..." : "บันทึกการตั้งค่า"}
          </button>
        </div>
      </div>
    </section>
  );
}
