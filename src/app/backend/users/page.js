"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { DataTable } from "@/components/data-table";
import { clearToken, getAuthHeaders } from "@/lib/auth";

const SWAL_CLASSES = {
  popup: "app-swal-popup",
  title: "app-swal-title",
  htmlContainer: "app-swal-content",
  confirmButton: "app-swal-confirm",
  cancelButton: "app-swal-cancel",
};

const EMPTY_FORM = {
  username: "",
  email: "",
  password: "",
  role: "user",
  point: 0,
};

const escapeHtml = (value) => String(value ?? "")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/\"/g, "&quot;")
  .replace(/'/g, "&#39;");

const buildUserFormHtml = (form, mode) => `
  <div class="app-swal-form">
    <div class="app-swal-field">
      <label class="app-swal-label" for="user-username">ชื่อผู้ใช้</label>
      <input id="user-username" class="swal2-input app-swal-input" value="${escapeHtml(form.username)}" placeholder="เช่น admin01" />
    </div>

    <div class="app-swal-field">
      <label class="app-swal-label" for="user-email">อีเมล</label>
      <input id="user-email" class="swal2-input app-swal-input" value="${escapeHtml(form.email)}" placeholder="example@email.com" />
    </div>

    ${mode === "add" ? `
    <div class="app-swal-field">
      <label class="app-swal-label" for="user-password">รหัสผ่าน</label>
      <input id="user-password" type="password" class="swal2-input app-swal-input" placeholder="อย่างน้อย 6 ตัวอักษร" />
    </div>
    ` : ""}

    <div class="app-swal-grid">
      <div class="app-swal-field">
        <label class="app-swal-label" for="user-role">สิทธิ์</label>
        <select id="user-role" class="swal2-select app-swal-select">
          <option value="user" ${form.role === "user" ? "selected" : ""}>User</option>
          <option value="admin" ${form.role === "admin" ? "selected" : ""}>Admin</option>
        </select>
      </div>

      <div class="app-swal-field">
        <label class="app-swal-label" for="user-point">แต้ม</label>
        <input id="user-point" type="number" min="0" step="1" class="swal2-input app-swal-input" value="${escapeHtml(form.point)}" />
      </div>
    </div>
  </div>
`;

const readFormValues = (mode) => ({
  username: document.getElementById("user-username")?.value.trim() || "",
  email: document.getElementById("user-email")?.value.trim() || "",
  password: mode === "add" ? (document.getElementById("user-password")?.value || "") : "",
  role: document.getElementById("user-role")?.value || "user",
  point: Number(document.getElementById("user-point")?.value || 0),
});

const roleBadgeClass = (role) => String(role || "").toLowerCase() === "admin"
  ? "bg-blue-100 text-blue-700"
  : "bg-gray-100 text-gray-700";

const parseApiResponse = async (response) => {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  const snippet = text.slice(0, 120).replace(/\s+/g, " ").trim();
  throw new Error(snippet || `Unexpected response format (${response.status})`);
};

export default function UsersPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState(null);

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

        const profile = await parseApiResponse(res);
        const role = String(profile.role || "").trim().toLowerCase();
        if (role !== "admin") {
          await Swal.fire({
            icon: "error",
            title: "ไม่มีสิทธิ์เข้าถึง",
            text: "หน้านี้สำหรับผู้ดูแลระบบเท่านั้น",
            customClass: SWAL_CLASSES,
            buttonsStyling: false,
          });
          router.replace("/dashboard");
          return;
        }

        setAuthorized(true);
      } catch (checkError) {
        console.error("Session check failed:", checkError);
        router.replace("/login");
      }
    };

    checkSession();
  }, [router]);

  const fetchUsers = useCallback(async () => {
    if (!authorized) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:3001/api/users/getUsers", {
        credentials: "include",
        headers: getAuthHeaders(),
      });

      const data = await parseApiResponse(res);
      if (!res.ok) {
        throw new Error(data.error || `ไม่สามารถโหลดผู้ใช้ได้ (${res.status})`);
      }

      setUsers(Array.isArray(data) ? data : []);
    } catch (fetchError) {
      setError(fetchError.message || "โหลดข้อมูลไม่สำเร็จ");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [authorized]);

  useEffect(() => {
    if (!mounted || !authorized) return;
    fetchUsers();
  }, [mounted, authorized, fetchUsers]);

  const openUserModal = async (mode, user = null) => {
    const initial = mode === "add"
      ? EMPTY_FORM
      : {
          username: user.username ?? "",
          email: user.email ?? "",
          role: user.role ?? "user",
          point: user.point ?? 0,
        };

    const result = await Swal.fire({
      title: mode === "add" ? "เพิ่มผู้ใช้งาน" : "แก้ไขผู้ใช้งาน",
      html: buildUserFormHtml(initial, mode),
      width: 620,
      customClass: SWAL_CLASSES,
      buttonsStyling: false,
      backdrop: "rgba(15, 23, 42, 0.55)",
      showCancelButton: true,
      confirmButtonText: mode === "add" ? "บันทึกผู้ใช้" : "บันทึกการแก้ไข",
      cancelButtonText: "ยกเลิก",
      showLoaderOnConfirm: true,
      preConfirm: async () => {
        const values = readFormValues(mode);

        if (!values.username || !values.email) {
          Swal.showValidationMessage("กรุณากรอกชื่อผู้ใช้และอีเมล");
          return false;
        }

        if (mode === "add" && values.password.length < 6) {
          Swal.showValidationMessage("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
          return false;
        }

        if (values.point < 0) {
          Swal.showValidationMessage("แต้มต้องไม่น้อยกว่า 0");
          return false;
        }

        const endpoint = mode === "add"
          ? "http://localhost:3001/api/users/addUser"
          : `http://localhost:3001/api/users/updateUser/${user.id}`;

        const method = mode === "add" ? "POST" : "PUT";
        const payload = mode === "add"
          ? values
          : {
              username: values.username,
              email: values.email,
              role: values.role,
              point: values.point,
            };

        try {
          const response = await fetch(endpoint, {
            method,
            credentials: "include",
            headers: {
              ...getAuthHeaders({
                "Content-Type": "application/json",
              }),
            },
            body: JSON.stringify(payload),
          });

          const data = await parseApiResponse(response);
          if (!response.ok) {
            throw new Error(data.error || "บันทึกข้อมูลไม่สำเร็จ");
          }

          return data;
        } catch (submitError) {
          Swal.showValidationMessage(submitError.message);
          return false;
        }
      },
    });

    if (result.isConfirmed) {
      await fetchUsers();
      await Swal.fire({
        icon: "success",
        title: "บันทึกสำเร็จ",
        timer: 1400,
        showConfirmButton: false,
        customClass: SWAL_CLASSES,
        buttonsStyling: false,
      });
    }
  };

  const handleDeleteUser = async (userId, username) => {
    const confirm = await Swal.fire({
      icon: "warning",
      title: "ยืนยันการลบผู้ใช้",
      text: `คุณต้องการลบ ${username} ใช่หรือไม่?`,
      showCancelButton: true,
      confirmButtonText: "ลบผู้ใช้",
      cancelButtonText: "ยกเลิก",
      customClass: SWAL_CLASSES,
      buttonsStyling: false,
    });

    if (!confirm.isConfirmed) return;

    try {
      setActionId(userId);
      const response = await fetch(`http://localhost:3001/api/users/deleteUser/${userId}`, {
        method: "DELETE",
        credentials: "include",
        headers: getAuthHeaders(),
      });

      const data = await parseApiResponse(response);
      if (!response.ok) {
        throw new Error(data.error || "ลบผู้ใช้ไม่สำเร็จ");
      }

      await fetchUsers();
      await Swal.fire({
        icon: "success",
        title: "ลบผู้ใช้สำเร็จ",
        timer: 1300,
        showConfirmButton: false,
        customClass: SWAL_CLASSES,
        buttonsStyling: false,
      });
    } catch (deleteError) {
      await Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: deleteError.message,
        customClass: SWAL_CLASSES,
        buttonsStyling: false,
      });
    } finally {
      setActionId(null);
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">จัดการผู้ใช้งาน</h1>
            <p className="text-sm text-gray-500">เพิ่ม แก้ไข และลบผู้ใช้งานภายในระบบ</p>
          </div>
          <button
            onClick={() => openUserModal("add")}
            className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-black"
          >
            <Plus size={16} /> เพิ่มผู้ใช้
          </button>
        </div>

        {loading ? (
          <div className="rounded-xl bg-gray-50 p-6 text-sm text-gray-500">กำลังโหลดข้อมูลผู้ใช้...</div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">{error}</div>
        ) : users.length === 0 ? (
          <div className="rounded-xl bg-gray-50 p-6 text-sm text-gray-500">ยังไม่มีข้อมูลผู้ใช้งาน</div>
        ) : (
          <>
          <div className="space-y-3 md:hidden">
            {users.map((user) => (
              <div key={user.id} className="rounded-xl border border-gray-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-gray-500">ID: {user.id}</p>
                    <p className="font-semibold text-gray-900">{user.username}</p>
                    <p className="text-sm text-gray-600 break-all">{user.email}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${roleBadgeClass(user.role)}`}>
                    {String(user.role || "user").toUpperCase()}
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-700">แต้ม: {Number(user.point || 0).toLocaleString("th-TH")}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={() => openUserModal("edit", user)}
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
                  >
                    <Pencil size={14} /> แก้ไข
                  </button>
                  <button
                    onClick={() => handleDeleteUser(user.id, user.username)}
                    disabled={actionId === user.id}
                    className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Trash2 size={14} /> {actionId === user.id ? "กำลังลบ..." : "ลบ"}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden md:block">
            <DataTable
              columns={[
                { id: "id", header: "ID", cell: (user) => <span className="text-gray-700">{user.id}</span> },
                { id: "username", header: "ชื่อผู้ใช้", cell: (user) => <span className="font-medium text-gray-800">{user.username}</span> },
                { id: "email", header: "อีเมล", cell: (user) => <span className="text-gray-600">{user.email}</span> },
                {
                  id: "role",
                  header: "สิทธิ์",
                  cell: (user) => (
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${roleBadgeClass(user.role)}`}>
                      {String(user.role || "user").toUpperCase()}
                    </span>
                  ),
                },
                {
                  id: "point",
                  header: "แต้ม",
                  cell: (user) => <span className="text-gray-700">{Number(user.point || 0).toLocaleString("th-TH")}</span>,
                },
                {
                  id: "actions",
                  header: "จัดการ",
                  cell: (user) => (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openUserModal("edit", user)}
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
                      >
                        <Pencil size={14} /> แก้ไข
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id, user.username)}
                        disabled={actionId === user.id}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Trash2 size={14} /> {actionId === user.id ? "กำลังลบ..." : "ลบ"}
                      </button>
                    </div>
                  ),
                },
              ]}
              data={users}
              rowKey={(row) => row.id}
              searchKeys={["username", "email", "role"]}
              searchPlaceholder="ค้นหาผู้ใช้, อีเมล, สิทธิ์"
              emptyText="ไม่พบข้อมูลผู้ใช้งาน"
            />
          </div>
          </>
        )}
      </div>
    
  );
}
