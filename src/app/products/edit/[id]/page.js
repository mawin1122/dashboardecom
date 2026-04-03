"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Sidebar } from "../../../../components/sidebar";

const STATUS_OPTIONS = [
  { value: "active", label: "ใช้งาน" },
  { value: "inactive", label: "ปิดใช้งาน" },
  { value: "out_of_stock", label: "หมดสต็อก" },
];

export default function EditProductPage() {
  const router = useRouter();
  const { id } = useParams();
  const [form, setForm] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState([]);

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
    if (!mounted) return;
    if (!authorized) return;
    if (!id) return;

    const fetchProduct = async () => {
      try {
        const res = await fetch(`http://localhost:3001/api/products/getProduct/${id}`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error(`ไม่พบสินค้า (${res.status})`);
        const data = await res.json();
        setForm({
          name: data.name ?? "",
          category: data.category ?? "",
          price: data.price ?? "",
          stock: data.stock ?? "",
          status: data.status ?? "active",
          description: data.description ?? "",
          image_url: data.image_url ?? "",
        });
      } catch (e) {
        setLoadError(e.message);
      }
    };

    const fetchCategories = async () => {
      try {
        const res = await fetch("http://localhost:3001/api/categories/getCategories", {
          credentials: "include",
        });
        const data = await res.json();
        if (res.ok) {
          setCategories(data);
        }
      } catch (categoryError) {
        console.error("Failed to fetch categories:", categoryError);
      }
    };

    fetchProduct();
    fetchCategories();
  }, [router, authorized, id, mounted]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) { setError("กรุณากรอกชื่อสินค้า"); return; }
    if (!form.price || isNaN(Number(form.price))) { setError("กรุณากรอกราคาที่ถูกต้อง"); return; }

    setSubmitting(true);
    try {
      const res = await fetch(`http://localhost:3001/api/products/updateProduct/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          price: Number(form.price),
          stock: form.stock !== "" ? Number(form.stock) : 0,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "แก้ไขสินค้าไม่สำเร็จ");
      router.push("/products");
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!mounted || !authorized) return null;

  return (
    <Sidebar title="แก้ไขสินค้า">
      <section className="max-w-2xl space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/products")}
            className="inline-flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:bg-gray-100"
          >
            <ArrowLeft className="h-4 w-4" />
            กลับ
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">แก้ไขสินค้า</h1>
            <p className="text-sm text-gray-500">อัปเดตข้อมูลสินค้า</p>
          </div>
        </div>

        {loadError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{loadError}</div>
        )}

        {!form && !loadError ? (
          <div className="flex h-48 items-center justify-center text-gray-400 text-sm">กำลังโหลด...</div>
        ) : form ? (
          <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-5">
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                ชื่อสินค้า <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="เช่น เสื้อยืดคอกลม"
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
              />
            </div>

            {/* Category + Status */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">หมวดหมู่</label>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
                >
                  <option value="">-- เลือกหมวดหมู่ --</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.name}>{category.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">สถานะ</label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
                >
                  {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            </div>

            {/* Price + Stock */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  ราคา (บาท) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="price"
                  value={form.price}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  step="0.01"
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">จำนวนสต็อก</label>
                <input
                  type="number"
                  name="stock"
                  value={form.stock}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
                />
              </div>
            </div>

            {/* Image URL */}
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
                <img src={form.image_url} alt="preview" className="mt-2 h-24 w-24 rounded-xl object-cover border border-gray-200" />
              )}
            </div>

            {/* Description */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">คำอธิบายสินค้า</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
                placeholder="รายละเอียดสินค้า..."
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
              />
            </div>

            {/* Actions */}
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
                onClick={() => router.push("/products")}
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
