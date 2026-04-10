"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { DataTable } from "@/components/data-table";
import { clearToken, getAuthHeaders } from "@/lib/auth";

const EMPTY_CAROUSEL_FORM = {
  image_url: "",
};

const SWAL_CLASSES = {
  popup: "app-swal-popup",
  title: "app-swal-title",
  htmlContainer: "app-swal-content",
  confirmButton: "app-swal-confirm",
  cancelButton: "app-swal-cancel",
};

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

const buildCarouselFormHtml = (form) => `
  <div style="text-align:left;">
    <input id="carousel-image" class="swal2-input" placeholder="URL รูปภาพ" value="${escapeHtml(form.image_url)}">
  </div>
`;

const readCarouselFormValues = () => ({
  image_url: document.getElementById("carousel-image")?.value.trim() || "",
});

export default function CarouselPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [carousels, setCarousels] = useState([]);
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
      } catch {
        router.replace("/login");
      }
    };

    checkSession();
  }, [router]);

  const fetchCarousels = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("http://localhost:3001/api/carousels/getCarousels", {
        credentials: "include",
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `ไม่สามารถโหลด Carousel ได้ (${res.status})`);
      }
      setCarousels(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!mounted || !authorized) return;
    fetchCarousels();
  }, [mounted, authorized, fetchCarousels]);

  const openCarouselModal = async (mode, carousel = null) => {
    const initialForm = carousel
      ? { image_url: carousel.image_url ?? "" }
      : EMPTY_CAROUSEL_FORM;

    const result = await Swal.fire({
      title: mode === "add" ? "เพิ่ม Carousel" : "แก้ไข Carousel",
      html: buildCarouselFormHtml(initialForm),
      customClass: SWAL_CLASSES,
      buttonsStyling: false,
      backdrop: "rgba(15, 23, 42, 0.55)",
      showCancelButton: true,
      confirmButtonText: mode === "add" ? "บันทึก Carousel" : "บันทึกการแก้ไข",
      cancelButtonText: "ยกเลิก",
      focusConfirm: false,
      showLoaderOnConfirm: true,
      allowOutsideClick: () => !Swal.isLoading(),
      preConfirm: async () => {
        const form = readCarouselFormValues();

        if (!form.image_url) {
          Swal.showValidationMessage("กรุณากรอก URL รูปภาพ");
          return false;
        }

        const endpoint =
          mode === "add"
            ? "http://localhost:3001/api/carousels/addCarousel"
            : `http://localhost:3001/api/carousels/updateCarousel/${carousel.id}`;
        const method = mode === "add" ? "POST" : "PUT";

        try {
          const response = await fetch(endpoint, {
            method,
            credentials: "include",
            headers: getAuthHeaders({ "Content-Type": "application/json" }),
            body: JSON.stringify(form),
          });

          const data = await response.json();
          if (!response.ok) {
            throw new Error(
              data.error ||
                (mode === "add" ? "เพิ่ม Carousel ไม่สำเร็จ" : "แก้ไข Carousel ไม่สำเร็จ")
            );
          }
          return data;
        } catch (submitError) {
          Swal.showValidationMessage(submitError.message);
          return false;
        }
      },
    });

    if (result.isConfirmed) {
      await fetchCarousels();
      await Swal.fire({
        icon: "success",
        title: mode === "add" ? "เพิ่ม Carousel แล้ว" : "บันทึกการแก้ไขแล้ว",
        customClass: SWAL_CLASSES,
        buttonsStyling: false,
        timer: 1500,
        showConfirmButton: false,
      });
    }
  };

  const handleDelete = async (carousel) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "ลบ Carousel",
      text: `ยืนยันการลบ Carousel #${carousel.id} ?`,
      customClass: SWAL_CLASSES,
      buttonsStyling: false,
      showCancelButton: true,
      confirmButtonText: "ลบ Carousel",
      cancelButtonText: "ยกเลิก",
    });

    if (!result.isConfirmed) return;

    setDeletingId(carousel.id);
    try {
      const res = await fetch(
        `http://localhost:3001/api/carousels/deleteCarousel/${carousel.id}`,
        {
          method: "DELETE",
          credentials: "include",
          headers: getAuthHeaders(),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "ลบ Carousel ไม่สำเร็จ");
      }
      setCarousels((prev) => prev.filter((item) => item.id !== carousel.id));
      await Swal.fire({
        icon: "success",
        title: "ลบ Carousel แล้ว",
        customClass: SWAL_CLASSES,
        buttonsStyling: false,
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (e) {
      await Swal.fire({
        icon: "error",
        title: "ลบ Carousel ไม่สำเร็จ",
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
          <h1 className="text-2xl font-bold text-gray-900">จัดการ Carousel</h1>
          <p className="text-sm text-gray-500">จัดการรูปภาพ Carousel บนหน้าแรก</p>
        </div>
        <button
          onClick={() => openCarouselModal("add")}
          className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-700"
        >
          <Plus className="h-4 w-4" />
          เพิ่ม Carousel
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
          <button onClick={fetchCarousels} className="ml-3 underline">
            ลองใหม่
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex h-48 items-center justify-center text-sm text-gray-400">
          กำลังโหลด...
        </div>
      ) : carousels.length === 0 ? (
        <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-gray-300 text-gray-400">
          <span className="text-sm">ยังไม่มี Carousel</span>
          <button
            onClick={() => openCarouselModal("add")}
            className="inline-flex items-center gap-1 rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
          >
            <Plus className="h-4 w-4" /> เพิ่ม Carousel แรก
          </button>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {carousels.map((carousel) => (
              <div
                key={carousel.id}
                className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                {carousel.image_url ? (
                  <img
                    src={carousel.image_url}
                    alt={`Carousel ${carousel.id}`}
                    className="max-h-[200px] w-auto max-w-full object-contain"
                  />
                ) : (
                  <p className="text-xs text-gray-400">ไม่มีรูป</p>
                )}
                <p className="mt-2 text-xs text-gray-500 break-all">{carousel.image_url}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => openCarouselModal("edit", carousel)}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-100"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    แก้ไข
                  </button>
                  <button
                    onClick={() => handleDelete(carousel)}
                    disabled={deletingId === carousel.id}
                    className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {deletingId === carousel.id ? "กำลังลบ..." : "ลบ"}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block">
            <DataTable
              columns={[
                {
                  id: "id",
                  header: "#",
                  cell: (carousel) => (
                    <span className="text-sm text-gray-500">{carousel.id}</span>
                  ),
                },
                {
                  id: "image",
                  header: "รูปภาพ",
                  cell: (carousel) =>
                    carousel.image_url ? (
                      <img
                        src={carousel.image_url}
                        alt={`Carousel ${carousel.id}`}
                        className="max-h-[180px] w-auto max-w-[300px] object-contain"
                      />
                    ) : (
                      <span className="text-xs text-gray-400">ไม่มีรูป</span>
                    ),
                },
                {
                  id: "image_url",
                  header: "URL รูปภาพ",
                  cell: (carousel) => (
                    <span className="break-all text-sm text-gray-600">{carousel.image_url}</span>
                  ),
                },
                {
                  id: "actions",
                  header: "การจัดการ",
                  headerClassName: "text-right",
                  cellClassName: "text-right",
                  cell: (carousel) => (
                    <div className="inline-flex gap-2">
                      <button
                        onClick={() => openCarouselModal("edit", carousel)}
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-100"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        แก้ไข
                      </button>
                      <button
                        onClick={() => handleDelete(carousel)}
                        disabled={deletingId === carousel.id}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        {deletingId === carousel.id ? "กำลังลบ..." : "ลบ"}
                      </button>
                    </div>
                  ),
                },
              ]}
              data={carousels}
              rowKey={(carousel) => carousel.id}
            />
          </div>
        </>
      )}
    </section>
  );
}
