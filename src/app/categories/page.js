"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Sidebar } from "../../components/sidebar";
import { DataTable } from "../../components/data-table";
import { clearToken, getAuthHeaders } from "../../lib/auth";

const EMPTY_CATEGORY_FORM = {
  name: "",
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

const buildCategoryFormHtml = (form) => `
  <div style="text-align:left;">
    <input id="category-name" class="swal2-input" placeholder="ชื่อหมวดหมู่" value="${escapeHtml(form.name)}">
    <input id="category-image" class="swal2-input" placeholder="URL รูปภาพ" value="${escapeHtml(form.image_url)}">
  </div>
`;

const readCategoryFormValues = () => ({
  name: document.getElementById("category-name")?.value.trim() || "",
  image_url: document.getElementById("category-image")?.value.trim() || "",
});

export default function CategoriesPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [authorized, setAuthorized] = useState(false);
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
      } catch (sessionError) {
        console.error("Session check failed:", sessionError);
        router.replace("/login");
      }
    };

    checkSession();
  }, [router]);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError("");
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
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!mounted) {
      return;
    }
    if (!authorized) {
      return;
    }
    fetchCategories();
  }, [mounted, authorized, fetchCategories]);

  const openCategoryModal = async (mode, category = null) => {
    const initialForm = category
      ? {
          name: category.name ?? "",
          image_url: category.image_url ?? "",
        }
      : EMPTY_CATEGORY_FORM;

    const result = await Swal.fire({
      title: mode === "add" ? "เพิ่มหมวดหมู่" : "แก้ไขหมวดหมู่",
      html: buildCategoryFormHtml(initialForm),
      customClass: SWAL_CLASSES,
      buttonsStyling: false,
      backdrop: "rgba(15, 23, 42, 0.55)",
      showCancelButton: true,
      confirmButtonText: mode === "add" ? "บันทึกหมวดหมู่" : "บันทึกการแก้ไข",
      cancelButtonText: "ยกเลิก",
      focusConfirm: false,
      showLoaderOnConfirm: true,
      allowOutsideClick: () => !Swal.isLoading(),
      preConfirm: async () => {
        const form = readCategoryFormValues();

        if (!form.name) {
          Swal.showValidationMessage("กรุณากรอกชื่อหมวดหมู่");
          return false;
        }

        const endpoint = mode === "add"
          ? "http://localhost:3001/api/categories/addCategory"
          : `http://localhost:3001/api/categories/updateCategory/${category.id}`;
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
            body: JSON.stringify(form),
          });

          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.error || (mode === "add" ? "เพิ่มหมวดหมู่ไม่สำเร็จ" : "แก้ไขหมวดหมู่ไม่สำเร็จ"));
          }

          return data;
        } catch (submitError) {
          Swal.showValidationMessage(submitError.message);
          return false;
        }
      },
    });

    if (result.isConfirmed) {
      await fetchCategories();
      await Swal.fire({
        icon: "success",
        title: mode === "add" ? "เพิ่มหมวดหมู่แล้ว" : "บันทึกการแก้ไขแล้ว",
        customClass: SWAL_CLASSES,
        buttonsStyling: false,
        timer: 1500,
        showConfirmButton: false,
      });
    }
  };

  const handleDelete = async (category) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "ลบหมวดหมู่",
      text: `ยืนยันการลบหมวดหมู่ \"${category.name}\" ?`,
      customClass: SWAL_CLASSES,
      buttonsStyling: false,
      showCancelButton: true,
      confirmButtonText: "ลบหมวดหมู่",
      cancelButtonText: "ยกเลิก",
    });

    if (!result.isConfirmed) {
      return;
    }

    setDeletingId(category.id);
    try {
      const res = await fetch(`http://localhost:3001/api/categories/deleteCategory/${category.id}`, {
        method: "DELETE",
        credentials: "include",
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "ลบหมวดหมู่ไม่สำเร็จ");
      }
      setCategories((prev) => prev.filter((item) => item.id !== category.id));
      await Swal.fire({
        icon: "success",
        title: "ลบหมวดหมู่แล้ว",
        customClass: SWAL_CLASSES,
        buttonsStyling: false,
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (e) {
      await Swal.fire({
        icon: "error",
        title: "ลบหมวดหมู่ไม่สำเร็จ",
        text: e.message,
        customClass: SWAL_CLASSES,
        buttonsStyling: false,
      });
    } finally {
      setDeletingId(null);
    }
  };

  if (!mounted || !authorized) {
    return null;
  }

  return (
    <Sidebar title="จัดการหมวดหมู่">
      <section className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">รายการหมวดหมู่</h1>
            <p className="text-sm text-gray-500">จัดการหมวดหมู่สำหรับใช้กับสินค้า</p>
          </div>
          <button
            onClick={() => openCategoryModal("add")}
            className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-700"
          >
            <Plus className="h-4 w-4" />
            เพิ่มหมวดหมู่
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
            <button onClick={fetchCategories} className="ml-3 underline">ลองใหม่</button>
          </div>
        )}

        {loading ? (
          <div className="flex h-48 items-center justify-center text-sm text-gray-400">กำลังโหลด...</div>
        ) : categories.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-gray-300 text-gray-400">
            <span className="text-sm">ยังไม่มีหมวดหมู่</span>
            <button
              onClick={() => openCategoryModal("add")}
              className="inline-flex items-center gap-1 rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
            >
              <Plus className="h-4 w-4" /> เพิ่มหมวดหมู่แรก
            </button>
          </div>
        ) : (
          <>
          <div className="space-y-3 md:hidden">
            {categories.map((category) => (
              <div key={category.id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                {category.image_url ? (
                  <img
                    src={category.image_url}
                    alt={category.name}
                    className="max-h-[300px] w-auto max-w-full object-contain"
                  />
                ) : (
                  <p className="text-xs text-gray-400">ไม่มีรูป</p>
                )}
                <p className="mt-3 font-semibold text-gray-900">{category.name}</p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => openCategoryModal("edit", category)}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-100"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    แก้ไข
                  </button>
                  <button
                    onClick={() => handleDelete(category)}
                    disabled={deletingId === category.id}
                    className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {deletingId === category.id ? "กำลังลบ..." : "ลบ"}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden md:block">
            <DataTable
              columns={[
                {
                  id: "image",
                  header: "รูป",
                  cell: (category) => (
                    category.image_url ? (
                      <img
                        src={category.image_url}
                        alt={category.name}
                        className="max-h-[220px] w-auto max-w-[220px] object-contain"
                      />
                    ) : (
                      <span className="text-xs text-gray-400">ไม่มีรูป</span>
                    )
                  ),
                },
                {
                  id: "name",
                  header: "ชื่อหมวดหมู่",
                  cell: (category) => <span className="font-medium text-gray-900">{category.name}</span>,
                },
                {
                  id: "actions",
                  header: "การจัดการ",
                  headerClassName: "text-right",
                  cellClassName: "text-right",
                  cell: (category) => (
                    <div className="inline-flex gap-2">
                      <button
                        onClick={() => openCategoryModal("edit", category)}
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-100"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        แก้ไข
                      </button>
                      <button
                        onClick={() => handleDelete(category)}
                        disabled={deletingId === category.id}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        {deletingId === category.id ? "กำลังลบ..." : "ลบ"}
                      </button>
                    </div>
                  ),
                },
              ]}
              data={categories}
              rowKey={(row) => row.id}
              searchKeys={["name"]}
              searchPlaceholder="ค้นหาชื่อหมวดหมู่"
              emptyText="ไม่พบข้อมูลหมวดหมู่"
            />
          </div>
          </>
        )}
      </section>
    </Sidebar>
  );
}
