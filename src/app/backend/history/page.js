"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { DataTable } from "@/components/data-table";
import { clearToken, getAuthHeaders } from "@/lib/auth";

const API_BASE = "http://localhost:3001/api/history";

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const formatNumber = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return "-";
  return new Intl.NumberFormat("th-TH").format(parsed);
};

const formatCurrency = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return "-";
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 2,
  }).format(parsed);
};

export default function HistoryPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [profile, setProfile] = useState({ role: "user" });
  const [historyRows, setHistoryRows] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const checkSession = async () => {
      setMounted(true);

      try {
        const response = await fetch("http://localhost:3001/api/users/profile", {
          credentials: "include",
          cache: "no-store",
          headers: getAuthHeaders(),
        });

        if (!response.ok) {
          if (response.status === 401) {
            clearToken();
          }
          router.replace("/login");
          return;
        }

        const data = await response.json();
        setProfile({
          id: data.id,
          role: String(data.role || "user").toLowerCase(),
        });
        setAuthorized(true);
      } catch (sessionError) {
        console.error("Session check failed:", sessionError);
        router.replace("/login");
      }
    };

    checkSession();
  }, [router]);

  const loadHistory = useCallback(async () => {
    if (!authorized) return;

    setLoading(true);
    setError("");

    try {
      const isAdmin = profile.role === "admin";
      const endpoint = isAdmin
        ? `${API_BASE}/getAllPurchaseHistory${selectedUserId !== "all" ? `?user_id=${selectedUserId}` : ""}`
        : `${API_BASE}/getPurchaseHistory`;

      const response = await fetch(endpoint, {
        credentials: "include",
        headers: getAuthHeaders(),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `โหลดประวัติไม่สำเร็จ (${response.status})`);
      }

      setHistoryRows(Array.isArray(data) ? data : []);
    } catch (fetchError) {
      setError(fetchError.message);
      setHistoryRows([]);
    } finally {
      setLoading(false);
    }
  }, [authorized, profile.role, selectedUserId]);

  useEffect(() => {
    if (!mounted || !authorized) return;
    loadHistory();
  }, [mounted, authorized, loadHistory]);

  const uniqueUsers = useMemo(() => {
    const map = new Map();

    historyRows.forEach((row) => {
      const id = Number(row.user_id);
      if (!Number.isInteger(id)) return;
      if (!map.has(id)) {
        map.set(id, {
          id,
          label: row.username || row.email || `User ${id}`,
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label, "th"));
  }, [historyRows]);

  const columns = useMemo(() => [
    {
      id: "id",
      header: "ID",
      cell: (row) => row.id,
    },
    {
      id: "user",
      header: "ผู้ใช้",
      cell: (row) => row.username || row.email || row.user_id || "-",
    },
    {
      id: "product",
      header: "สินค้า",
      cell: (row) => row.product_name || `Product #${row.product_id}`,
    },
    {
      id: "quantity",
      header: "จำนวน",
      cell: (row) => formatNumber(row.quantity),
    },
    {
      id: "unit_price",
      header: "ราคาต่อชิ้น",
      cell: (row) => formatCurrency(row.unit_price),
    },
    {
      id: "total_price",
      header: "ราคารวม",
      cell: (row) => formatCurrency(row.total_price),
    },
    {
      id: "status",
      header: "สถานะ",
      cell: (row) => row.status || "-",
    },
    {
      id: "created_at",
      header: "เวลาทำรายการ",
      cell: (row) => formatDateTime(row.created_at),
    },
  ], []);

  if (!mounted) {
    return null;
  }

  return (
    <Sidebar title="ประวัติการซื้อ">
      <div className="space-y-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {profile.role === "admin" ? "ประวัติทั้งหมด" : "ประวัติการซื้อของฉัน"}
              </h1>
              <p className="text-sm text-gray-500">ตรวจสอบรายการซื้อย้อนหลังและรายละเอียดการใช้แต้ม</p>
            </div>

            {profile.role === "admin" && (
              <div className="flex flex-col gap-1">
                <label htmlFor="history-user-filter" className="text-sm font-medium text-gray-700">เลือกผู้ใช้</label>
                <select
                  id="history-user-filter"
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
                >
                  <option value="all">ทั้งหมด</option>
                  {uniqueUsers.map((user) => (
                    <option key={user.id} value={user.id}>{user.label}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="hidden md:block">
          <DataTable
            columns={columns}
            data={historyRows}
            rowKey={(row) => row.id}
            searchPlaceholder="ค้นหาจากผู้ใช้, สินค้า, สถานะ"
            searchKeys={["username", "email", "product_name", "status", "id"]}
            emptyText={loading ? "กำลังโหลด..." : "ไม่พบข้อมูลประวัติ"}
          />
        </div>

        <div className="space-y-3 md:hidden">
          {loading ? (
            <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-500">กำลังโหลด...</div>
          ) : historyRows.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-500">ไม่พบข้อมูลประวัติ</div>
          ) : (
            historyRows.map((row) => (
              <article key={row.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-900">รายการ #{row.id}</p>
                  <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700">{row.status || "-"}</span>
                </div>
                <p className="text-sm text-gray-600">ผู้ใช้: {row.username || row.email || row.user_id || "-"}</p>
                <p className="text-sm text-gray-600">สินค้า: {row.product_name || `Product #${row.product_id}`}</p>
                <p className="text-sm text-gray-600">จำนวน: {formatNumber(row.quantity)}</p>
                <p className="text-sm text-gray-600">รวม: {formatCurrency(row.total_price)}</p>
                <p className="mt-2 text-xs text-gray-500">{formatDateTime(row.created_at)}</p>
              </article>
            ))
          )}
        </div>
      </div>
    </Sidebar>
  );
}