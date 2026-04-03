"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Sidebar } from "../../../../components/sidebar";

export default function EditCategoryPage() {
  const router = useRouter();
  const { id } = useParams();

  const [form, setForm] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [mounted, setMounted] = useState(false);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      setMounted(true);
      try {
        const res = await fetch("http://localhost:3001/api/users/profile", {
          credentials: "include",
        });
        if (!res.ok) {
          router.replace("/login");
          return;
        }
        setAuthorized(true);
      } catch (sessionError) {
        console.error("Session check failed:", sessionError);
        router.replace("/login");
      }
    };

    checkSession();
  }, [router]);

  useEffect(() => {
    if (!mounted) {
      return;
    }
    if (!authorized) {
      return;
    }
    if (!id) {
      return;
    }

    const fetchCategory = async () => {
      try {
        const res = await fetch(`http://localhost:3001/api/categories/getCategory/${id}`, {
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || `ไม่พบหมวดหมู่ (${res.status})`);
        }
        setForm({
          name: data.name || "",
          image_url: data.image_url || "",
        });
      } catch (e) {
        setLoadError(e.message);
      }
    };

    fetchCategory();
  }, [mounted, authorized, id, router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim()) {
      setError("กรุณากรอกชื่อหมวดหมู่");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`http://localhost:3001/api/categories/updateCategory/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "แก้ไขหมวดหมู่ไม่สำเร็จ");
      }

      router.push("/categories");
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!mounted || !authorized) {
    return null;
  }

  return (
    <Sidebar title="แก้ไขหมวดหมู่">
      <section className="max-w-2xl space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/categories")}
            className="inline-flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:bg-gray-100"
          >
            <ArrowLeft className="h-4 w-4" />
            กลับ
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">แก้ไขหมวดหมู่</h1>
            <p className="text-sm text-gray-500">ปรับข้อมูลหมวดหมู่ในระบบ</p>
          </div>
        </div>

        {loadError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{loadError}</div>
        )}

        {!form && !loadError ? (
          <div className="flex h-48 items-center justify-center text-sm text-gray-400">กำลังโหลด...</div>
        ) : form ? (
          <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                ชื่อหมวดหมู่ <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="เช่น เครื่องแต่งกาย"
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">URL รูปภาพ</label>
              <input
                type="url"
                name="image_url"
                value={form.image_url}
                onChange={handleChange}
                placeholder="https://..."
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
              />
              {form.image_url && (
                <img src={form.image_url} alt="preview" className="mt-2 h-24 w-24 rounded-xl border border-gray-200 object-cover" />
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 rounded-xl bg-gray-900 py-2.5 text-sm font-medium text-white transition hover:bg-gray-700 disabled:opacity-60"
              >
                {submitting ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
              </button>
              <button
                type="button"
                onClick={() => router.push("/categories")}
                className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
              >
                ยกเลิก
              </button>
            </div>
          </form>
        ) : null}
      </section>
    </Sidebar>
  );
}
