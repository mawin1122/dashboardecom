"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Plus, Pencil, Check, X, Trash2 } from "lucide-react";
import { clearToken, getAuthHeaders } from "@/lib/auth";

function parseItemsByLine(rawText) {
  return rawText
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

export default function ProductStockPage() {
  const router = useRouter();
  const { id } = useParams();

  const [mounted, setMounted] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [product, setProduct] = useState(null);
  const [stocks, setStocks] = useState([]);
  const [stockInput, setStockInput] = useState("");
  const [quickAddInput, setQuickAddInput] = useState("");
  const [editingStockId, setEditingStockId] = useState(null);
  const [editingValue, setEditingValue] = useState("");

  const stockCountFromInput = useMemo(() => parseItemsByLine(stockInput).length, [stockInput]);

  const fetchData = async () => {
    if (!id) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [productRes, stockRes] = await Promise.all([
        fetch(`http://localhost:3001/api/products/getProduct/${id}`, {
          credentials: "include",
          headers: getAuthHeaders(),
        }),
        fetch(`http://localhost:3001/api/stock/getStockByProduct/${id}`, {
          credentials: "include",
          headers: getAuthHeaders(),
        }),
      ]);

      const productData = await productRes.json();
      const stockData = await stockRes.json();

      if (!productRes.ok) {
        throw new Error(productData.error || `ไม่พบสินค้า (${productRes.status})`);
      }

      if (!stockRes.ok) {
        throw new Error(stockData.error || `โหลด stock ไม่สำเร็จ (${stockRes.status})`);
      }

      setProduct(productData);
      setStocks(stockData);
    } catch (fetchError) {
      setError(fetchError.message);
    } finally {
      setLoading(false);
    }
  };

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

  useEffect(() => {
    if (!mounted || !authorized) {
      return;
    }

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, authorized, id]);

  const handleSubmitStock = async (e) => {
    e.preventDefault();
    setError("");

    const items = parseItemsByLine(stockInput);

    if (items.length === 0) {
      setError("กรุณากรอกอย่างน้อย 1 บรรทัด");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("http://localhost:3001/api/stock/addStock", {
        method: "POST",
        credentials: "include",
        headers: {
          ...getAuthHeaders({
            "Content-Type": "application/json",
          }),
        },
        body: JSON.stringify({
          product_id: Number(id),
          items,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "เพิ่ม stock ไม่สำเร็จ");
      }

      setStockInput("");
      await fetchData();
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickAddStock = async () => {
    setError("");
    const item = quickAddInput.trim();

    if (!item) {
      setError("กรุณากรอก stock ที่ต้องการเพิ่ม");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("http://localhost:3001/api/stock/addStock", {
        method: "POST",
        credentials: "include",
        headers: {
          ...getAuthHeaders({
            "Content-Type": "application/json",
          }),
        },
        body: JSON.stringify({
          product_id: Number(id),
          items: [item],
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "เพิ่ม stock ไม่สำเร็จ");
      }

      setQuickAddInput("");
      await fetchData();
    } catch (addError) {
      setError(addError.message);
    } finally {
      setSubmitting(false);
    }
  };

  const startEditStock = (stock) => {
    setEditingStockId(stock.id);
    setEditingValue(stock.items || "");
    setError("");
  };

  const cancelEditStock = () => {
    setEditingStockId(null);
    setEditingValue("");
  };

  const saveEditStock = async (stockId) => {
    const nextValue = editingValue.trim();
    setError("");

    if (!nextValue) {
      setError("กรุณากรอกค่า stock ก่อนบันทึก");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`http://localhost:3001/api/stock/updateStock/${stockId}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          ...getAuthHeaders({
            "Content-Type": "application/json",
          }),
        },
        body: JSON.stringify({
          items: [nextValue],
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "แก้ไข stock ไม่สำเร็จ");
      }

      cancelEditStock();
      await fetchData();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStock = async (stockId) => {
    const shouldDelete = window.confirm("ยืนยันการลบ stock รายการนี้?");
    if (!shouldDelete) {
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`http://localhost:3001/api/stock/deleteStock/${stockId}`, {
        method: "DELETE",
        credentials: "include",
        headers: getAuthHeaders(),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "ลบ stock ไม่สำเร็จ");
      }

      if (editingStockId === stockId) {
        cancelEditStock();
      }

      await fetchData();
    } catch (deleteError) {
      setError(deleteError.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!mounted || !authorized) {
    return null;
  }

  return (
    
      <section className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/products")}
              className="inline-flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:bg-gray-100"
            >
              <ArrowLeft className="h-4 w-4" />
              กลับ
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">เพิ่ม stock รายสินค้า</h1>
              <p className="text-sm text-gray-500">1 บรรทัด = 1 stock</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="xl:col-span-1 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900 mb-3">ข้อมูลสินค้า</h2>
            {loading ? (
              <p className="text-sm text-gray-400">กำลังโหลด...</p>
            ) : product ? (
              <div className="space-y-2 text-sm">
                <p><span className="text-gray-500">ชื่อ:</span> <span className="font-medium text-gray-900">{product.name}</span></p>
                <p><span className="text-gray-500">หมวดหมู่:</span> <span className="text-gray-900">{product.category || "-"}</span></p>
                <p><span className="text-gray-500">stock ปัจจุบัน:</span> <span className="font-semibold text-gray-900">{product.stock ?? 0}</span></p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">ไม่พบข้อมูลสินค้า</p>
            )}

            <form onSubmit={handleSubmitStock} className="mt-4 space-y-3">
              <label className="block text-sm font-medium text-gray-700">รายการ stock</label>
              <textarea
                value={stockInput}
                onChange={(e) => setStockInput(e.target.value)}
                rows={8}
                placeholder={"กรอก 1 stock ต่อ 1 บรรทัด\nเช่น\nsads\nasdsadasdad"}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
              />
              <p className="text-xs text-gray-500">ตรวจพบ {stockCountFromInput} stock จากข้อความที่กรอก</p>
              <button
                type="submit"
                disabled={submitting || stockCountFromInput === 0}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-700 disabled:opacity-60"
              >
                <Plus className="h-4 w-4" />
                {submitting ? "กำลังบันทึก..." : "เพิ่ม stock"}
              </button>
            </form>
          </div>

          <div className="xl:col-span-2 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-base font-semibold text-gray-900">ประวัติ stock ของสินค้า</h2>
              <div className="flex items-center gap-2">
                <input
                  value={quickAddInput}
                  onChange={(e) => setQuickAddInput(e.target.value)}
                  placeholder="เพิ่ม stock 1 รายการ"
                  className="w-44 rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
                />
                <button
                  type="button"
                  onClick={handleQuickAddStock}
                  disabled={submitting}
                  className="inline-flex items-center gap-1 rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-gray-700 disabled:opacity-60"
                >
                  <Plus className="h-3.5 w-3.5" />
                  เพิ่ม
                </button>
              </div>
            </div>
            {loading ? (
              <div className="text-sm text-gray-400">กำลังโหลด...</div>
            ) : stocks.length === 0 ? (
              <div className="text-sm text-gray-500">ยังไม่มีรายการ stock</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      <th className="px-3 py-2">ID</th>
                      <th className="px-3 py-2">product_id</th>
                      <th className="px-3 py-2">items</th>
                      <th className="px-3 py-2 text-right">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {stocks.map((stock) => (
                      <tr key={stock.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-gray-700">{stock.id}</td>
                        <td className="px-3 py-2 text-gray-700">{stock.product_id}</td>
                        <td className="px-3 py-2 font-medium text-gray-900">
                          {editingStockId === stock.id ? (
                            <input
                              value={editingValue}
                              onChange={(e) => setEditingValue(e.target.value)}
                              className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
                            />
                          ) : (
                            stock.items
                          )}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {editingStockId === stock.id ? (
                            <div className="inline-flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => saveEditStock(stock.id)}
                                disabled={submitting}
                                className="inline-flex items-center gap-1 rounded-lg border border-green-200 px-2.5 py-1.5 text-xs font-medium text-green-700 transition hover:bg-green-50 disabled:opacity-60"
                              >
                                <Check className="h-3.5 w-3.5" />
                                บันทึก
                              </button>
                              <button
                                type="button"
                                onClick={cancelEditStock}
                                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-100"
                              >
                                <X className="h-3.5 w-3.5" />
                                ยกเลิก
                              </button>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => startEditStock(stock)}
                                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-100"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                                แก้ไข
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteStock(stock.id)}
                                disabled={submitting}
                                className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                ลบ
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </section>
    
  );
}
