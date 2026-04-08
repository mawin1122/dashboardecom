"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { DataTable } from "@/components/data-table";
import { clearToken, getAuthHeaders } from "@/lib/auth";

const STATUS_CONFIG = {
  active: { label: "ใช้งาน", className: "bg-green-100 text-green-700" },
  inactive: { label: "ปิดใช้งาน", className: "bg-gray-100 text-gray-600" },
  out_of_stock: { label: "หมดสต็อก", className: "bg-red-100 text-red-600" },
};

const STATUS_OPTIONS = [
  { value: "active", label: "ใช้งาน" },
  { value: "inactive", label: "ปิดใช้งาน" },
  { value: "out_of_stock", label: "หมดสต็อก" },
];

const EMPTY_PRODUCT_FORM = {
  name: "",
  category: "",
  price: "",
  stock: "0",
  status: "active",
  description: "",
  image_url: "",
};

const SWAL_CLASSES = {
  popup: "app-swal-popup",
  title: "app-swal-title",
  htmlContainer: "app-swal-content",
  confirmButton: "app-swal-confirm",
  cancelButton: "app-swal-cancel",
};

const escapeHtml = (value) => String(value ?? "")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/\"/g, "&quot;")
  .replace(/'/g, "&#39;");

const formatCurrency = (value) => new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  maximumFractionDigits: 0,
}).format(value);

const buildProductFormHtml = (form, categories) => {
  const categoryOptions = [
    '<option value="">-- เลือกหมวดหมู่ --</option>',
    ...categories.map((category) => (
      `<option value="${escapeHtml(category.name)}" ${form.category === category.name ? "selected" : ""}>${escapeHtml(category.name)}</option>`
    )),
  ].join("");

  const statusOptions = STATUS_OPTIONS.map((status) => (
    `<option value="${status.value}" ${form.status === status.value ? "selected" : ""}>${status.label}</option>`
  )).join("");

  return `
    <div class="app-swal-form">
      <div class="app-swal-field">
        <label class="app-swal-label" for="product-name">ชื่อสินค้า</label>
        <input id="product-name" class="swal2-input app-swal-input" placeholder="เช่น เสื้อยืดคอกลม" value="${escapeHtml(form.name)}">
      </div>

      <div class="app-swal-grid">
        <div class="app-swal-field">
          <label class="app-swal-label" for="product-category">หมวดหมู่</label>
          <select id="product-category" class="swal2-select app-swal-select">${categoryOptions}</select>
        </div>
        <div class="app-swal-field">
          <label class="app-swal-label" for="product-status">สถานะ</label>
          <select id="product-status" class="swal2-select app-swal-select">${statusOptions}</select>
        </div>
      </div>

      <div class="app-swal-grid">
        <div class="app-swal-field">
          <label class="app-swal-label" for="product-price">ราคา (บาท)</label>
          <input id="product-price" class="swal2-input app-swal-input" type="number" min="0" step="0.01" placeholder="0" value="${escapeHtml(form.price)}">
        </div>
        <div class="app-swal-field">
          <label class="app-swal-label" for="product-stock">จำนวน stock</label>
          <input id="product-stock" class="swal2-input app-swal-input" type="number" min="0" step="1" placeholder="0" value="${escapeHtml(form.stock)}">
        </div>
      </div>

      <div class="app-swal-field">
        <label class="app-swal-label" for="product-image">URL รูปภาพ</label>
        <input id="product-image" class="swal2-input app-swal-input" placeholder="https://..." value="${escapeHtml(form.image_url)}">
      </div>

      <div class="app-swal-field">
        <label class="app-swal-label" for="product-description">คำอธิบายสินค้า</label>
        <textarea id="product-description" class="swal2-textarea app-swal-textarea" placeholder="รายละเอียดสินค้า">${escapeHtml(form.description)}</textarea>
      </div>
    </div>
  `;
};

const readProductFormValues = () => ({
  name: document.getElementById("product-name")?.value.trim() || "",
  category: document.getElementById("product-category")?.value || "",
  status: document.getElementById("product-status")?.value || "active",
  price: document.getElementById("product-price")?.value || "",
  stock: document.getElementById("product-stock")?.value || "0",
  image_url: document.getElementById("product-image")?.value.trim() || "",
  description: document.getElementById("product-description")?.value.trim() || "",
});

export default function ProductsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    const checkSession = async () => {
      setMounted(true);
      try {
        const res = await fetch("http://localhost:3001/api/users/profile", {
          credentials: "include",
          cache: "no-store",
          headers: getAuthHeaders(),
        });
        if (!res.ok) {
          if (res.status === 401) {
            clearToken();
          }
          router.replace("/login");
          return;
        }
        setAuthorized(true);
      } catch (error) {
        console.error("Session check failed:", error);
        router.replace("/login");
      }
    };

    checkSession();
  }, [router]);

  const fetchProducts = useCallback(async () => {
    if (!authorized) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("http://localhost:3001/api/products/getProducts", {
        credentials: "include",
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`ไม่สามารถโหลดข้อมูลได้ (${res.status})`);
      const data = await res.json();
      setProducts(data);
      return data;
    } catch (e) {
      setError(e.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [authorized]);

  const fetchCategories = useCallback(async () => {
    if (!authorized) return [];
    try {
      const res = await fetch("http://localhost:3001/api/categories/getCategories", {
        credentials: "include",
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `ไม่สามารถโหลดหมวดหมู่ได้ (${res.status})`);
      }
      setCategories(data);
      return data;
    } catch (categoryError) {
      console.error("Failed to fetch categories:", categoryError);
      return [];
    }
  }, [authorized]);

  useEffect(() => {
    if (!mounted) return;
    if (!authorized) return;
    fetchProducts();
    fetchCategories();
  }, [mounted, authorized, fetchProducts, fetchCategories]);

  const openProductModal = async (mode, product = null) => {
    const availableCategories = categories.length > 0 ? categories : await fetchCategories();
    const initialForm = product
      ? {
          name: product.name ?? "",
          category: product.category ?? "",
          price: product.price ?? "",
          stock: product.stock ?? "0",
          status: product.status ?? "active",
          description: product.description ?? "",
          image_url: product.image_url ?? "",
        }
      : EMPTY_PRODUCT_FORM;

    const result = await Swal.fire({
      title: mode === "add" ? "เพิ่มสินค้า" : "แก้ไขสินค้า",
      html: buildProductFormHtml(initialForm, availableCategories),
      width: 720,
      customClass: SWAL_CLASSES,
      buttonsStyling: false,
      backdrop: "rgba(15, 23, 42, 0.55)",
      showCancelButton: true,
      confirmButtonText: mode === "add" ? "บันทึกสินค้า" : "บันทึกการแก้ไข",
      cancelButtonText: "ยกเลิก",
      focusConfirm: false,
      showLoaderOnConfirm: true,
      allowOutsideClick: () => !Swal.isLoading(),
      preConfirm: async () => {
        const form = readProductFormValues();

        if (!form.name) {
          Swal.showValidationMessage("กรุณากรอกชื่อสินค้า");
          return false;
        }

        if (!form.price || Number.isNaN(Number(form.price))) {
          Swal.showValidationMessage("กรุณากรอกราคาที่ถูกต้อง");
          return false;
        }

        if (Number(form.stock) < 0) {
          Swal.showValidationMessage("จำนวน stock ต้องไม่น้อยกว่า 0");
          return false;
        }

        const endpoint = mode === "add"
          ? "http://localhost:3001/api/products/addProduct"
          : `http://localhost:3001/api/products/updateProduct/${product.id}`;
        const method = mode === "add" ? "POST" : "PUT";

        try {
          const response = await fetch(endpoint, {
            method,
            credentials: "include",
            headers: {
              ...getAuthHeaders({
                "Content-Type": "application/json",
              }),
            },
            body: JSON.stringify({
              ...form,
              price: Number(form.price),
              stock: form.stock !== "" ? Number(form.stock) : 0,
            }),
          });

          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.error || (mode === "add" ? "เพิ่มสินค้าไม่สำเร็จ" : "แก้ไขสินค้าไม่สำเร็จ"));
          }

          return data;
        } catch (submitError) {
          Swal.showValidationMessage(submitError.message);
          return false;
        }
      },
    });

    if (result.isConfirmed) {
      await fetchProducts();
      await Swal.fire({
        icon: "success",
        title: mode === "add" ? "เพิ่มสินค้าแล้ว" : "บันทึกการแก้ไขแล้ว",
        customClass: SWAL_CLASSES,
        buttonsStyling: false,
        timer: 1500,
        showConfirmButton: false,
      });
    }
  };

  const handleDelete = async (product) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "ลบสินค้า",
      text: `ยืนยันการลบสินค้า \"${product.name}\" ?`,
      customClass: SWAL_CLASSES,
      buttonsStyling: false,
      showCancelButton: true,
      confirmButtonText: "ลบสินค้า",
      cancelButtonText: "ยกเลิก",
    });

    if (!result.isConfirmed) return;

    setDeletingId(product.id);
    try {
      const res = await fetch(`http://localhost:3001/api/products/deleteProduct/${product.id}`, {
        method: "DELETE",
        credentials: "include",
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ลบสินค้าไม่สำเร็จ");
      setProducts((prev) => prev.filter((item) => item.id !== product.id));
      await Swal.fire({
        icon: "success",
        title: "ลบสินค้าแล้ว",
        customClass: SWAL_CLASSES,
        buttonsStyling: false,
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (e) {
      await Swal.fire({
        icon: "error",
        title: "ลบสินค้าไม่สำเร็จ",
        text: e.message,
        customClass: SWAL_CLASSES,
        buttonsStyling: false,
      });
    } finally {
      setDeletingId(null);
    }
  };

  if (!mounted || !authorized) return null;

  return (
    
      <section className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">รายการสินค้า</h1>
            <p className="text-sm text-gray-500">จัดการสินค้าทั้งหมดในระบบ</p>
          </div>
          <button
            onClick={() => openProductModal("add")}
            className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-700"
          >
            <Plus className="h-4 w-4" />
            เพิ่มสินค้า
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
            <button onClick={fetchProducts} className="ml-3 underline">ลองใหม่</button>
          </div>
        )}

        {loading ? (
          <div className="flex h-48 items-center justify-center text-gray-400">
            <span className="text-sm">กำลังโหลด...</span>
          </div>
        ) : products.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-gray-300 text-gray-400">
            <span className="text-sm">ยังไม่มีสินค้า</span>
            <button
              onClick={() => openProductModal("add")}
              className="inline-flex items-center gap-1 rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
            >
              <Plus className="h-4 w-4" /> เพิ่มสินค้าแรก
            </button>
          </div>
        ) : (
          <>
          <div className="space-y-3 md:hidden">
            {products.map((p) => {
              const status = STATUS_CONFIG[p.status] || STATUS_CONFIG.inactive;
              return (
                <div key={p.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="space-y-3">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="h-[300px] w-full rounded-xl object-contain" />
                    ) : (
                      <div className="flex h-[300px] w-full items-center justify-center rounded-xl bg-gray-100 text-xs text-gray-400">
                        ไม่มีรูป
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-gray-900">{p.name}</p>
                      <p className="text-sm text-gray-500">{p.category || "—"}</p>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <p className="text-gray-600">ราคา: <span className="font-medium text-gray-900">{p.price != null ? formatCurrency(p.price) : "—"}</span></p>
                    <p className="text-gray-600">สต็อก: <span className="font-medium text-gray-900">{p.stock ?? "—"}</span></p>
                  </div>

                  <div className="mt-2">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${status.className}`}>
                      {status.label}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => router.push(`/products/stock/${p.id}`)}
                      className="inline-flex items-center gap-1 rounded-lg border border-blue-200 px-2.5 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-50"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      เพิ่ม stock
                    </button>
                    <button
                      onClick={() => openProductModal("edit", p)}
                      className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-100"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      แก้ไข
                    </button>
                    <button
                      onClick={() => handleDelete(p)}
                      disabled={deletingId === p.id}
                      className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {deletingId === p.id ? "กำลังลบ..." : "ลบ"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="hidden md:block">
            <DataTable
              columns={[
                {
                  id: "name",
                  header: "สินค้า",
                  cell: (p) => (
                    <div className="flex items-center gap-3">
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.name} className="h-[300px] w-full max-w-[200px] shrink-0 rounded-xl object-contain" />
                      ) : (
                        <div className="flex h-[300px] w-full max-w-[200px] shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-400 text-xs">
                          ไม่มีรูป
                        </div>
                      )}
                      <span className="font-medium text-gray-900 max-w-[220px] truncate">{p.name}</span>
                    </div>
                  ),
                },
                {
                  id: "category",
                  header: "หมวดหมู่",
                  cell: (p) => <span className="text-gray-500">{p.category || "—"}</span>,
                },
                {
                  id: "price",
                  header: "ราคา",
                  headerClassName: "text-right",
                  cellClassName: "text-right font-medium text-gray-900",
                  cell: (p) => (p.price != null ? formatCurrency(p.price) : "—"),
                },
                {
                  id: "stock",
                  header: "สต็อก",
                  headerClassName: "text-right",
                  cellClassName: "text-right text-gray-700",
                  cell: (p) => p.stock ?? "—",
                },
                {
                  id: "status",
                  header: "สถานะ",
                  cell: (p) => {
                    const status = STATUS_CONFIG[p.status] || STATUS_CONFIG.inactive;
                    return (
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${status.className}`}>
                        {status.label}
                      </span>
                    );
                  },
                },
                {
                  id: "actions",
                  header: "การจัดการ",
                  headerClassName: "text-right",
                  cellClassName: "text-right",
                  cell: (p) => (
                    <div className="inline-flex gap-2">
                      <button
                        onClick={() => router.push(`/products/stock/${p.id}`)}
                        className="inline-flex items-center gap-1 rounded-lg border border-blue-200 px-2.5 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-50"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        เพิ่ม stock
                      </button>
                      <button
                        onClick={() => openProductModal("edit", p)}
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-100"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        แก้ไข
                      </button>
                      <button
                        onClick={() => handleDelete(p)}
                        disabled={deletingId === p.id}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        {deletingId === p.id ? "กำลังลบ..." : "ลบ"}
                      </button>
                    </div>
                  ),
                },
              ]}
              data={products}
              rowKey={(row) => row.id}
              searchKeys={["name", "category", "status"]}
              searchPlaceholder="ค้นหาสินค้า, หมวดหมู่, สถานะ"
              emptyText="ไม่พบข้อมูลสินค้า"
            />
          </div>
          </>
        )}
      </section>
    
  );
}
