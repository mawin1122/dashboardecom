import Swal from "sweetalert2";

import { getAuthHeaders } from "@/lib/auth";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3001/api";

function formatNumber(value) {
  return new Intl.NumberFormat("th-TH").format(Number(value) || 0);
}

function formatCurrency(value) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function parseResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return { error: text || "Unknown error" };
}

export async function openBuyProductModal(product, options = {}) {
  const { onSuccess } = options;

  const stock = Number(product?.stock || 0);
  const productId = Number(product?.id || 0);
  const unitPrice = Number(product?.price || 0);

  if (!Number.isInteger(productId) || productId <= 0) {
    await Swal.fire({
      icon: "error",
      title: "ข้อมูลสินค้าไม่ถูกต้อง",
      text: "ไม่พบรหัสสินค้า",
    });
    return false;
  }

  if (!Number.isFinite(unitPrice) || unitPrice < 0) {
    await Swal.fire({
      icon: "error",
      title: "ราคาไม่ถูกต้อง",
      text: "ไม่สามารถทำรายการได้",
    });
    return false;
  }

  if (stock <= 0) {
    await Swal.fire({
      icon: "warning",
      title: "สินค้าหมด",
      text: "สินค้านี้ไม่มีสต็อกเพียงพอ",
    });
    return false;
  }

  const result = await Swal.fire({
    title: "ซื้อสินค้า",
    html: `
      <div class="app-swal-form">
        <div class="app-swal-field">
          <label class="app-swal-label">สินค้า</label>
          <input class="app-swal-input" value="${escapeHtml(product?.name || "-")}" disabled />
        </div>

        <div class="app-swal-grid">
          <div class="app-swal-field">
            <label class="app-swal-label">ราคา/ชิ้น</label>
            <input class="app-swal-input" value="${formatCurrency(unitPrice)}" disabled />
          </div>
          <div class="app-swal-field">
            <label class="app-swal-label">คงเหลือ</label>
            <input class="app-swal-input" value="${formatNumber(stock)}" disabled />
          </div>
        </div>

        <div class="app-swal-field">
          <label class="app-swal-label" for="buy-qty">จำนวนที่ต้องการซื้อ</label>
          <input id="buy-qty" class="app-swal-input" type="number" min="1" max="${stock}" value="1" placeholder="กรอกจำนวน" />
        </div>


        <p id="buy-total" class="text-sm text-gray-600">ใช้แต้มทั้งหมด: ${formatCurrency(unitPrice)}</p>
      </div>
    `,
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: "ยืนยันการซื้อ",
    cancelButtonText: "ยกเลิก",
    customClass: {
      popup: "app-swal-popup",
      title: "app-swal-title",
      htmlContainer: "app-swal-content",
      confirmButton: "app-swal-confirm",
      cancelButton: "app-swal-cancel",
    },
    didOpen: () => {
      const qtyInput = document.getElementById("buy-qty");
      const totalEl = document.getElementById("buy-total");

      if (!qtyInput || !totalEl) {
        return;
      }

      const updateTotal = () => {
        const qty = Math.max(1, Number(qtyInput.value || 1));
        const total = qty * unitPrice;
        totalEl.textContent = `ใช้แต้มทั้งหมด: ${formatCurrency(total)}`;
      };

      qtyInput.addEventListener("input", updateTotal);
      updateTotal();
    },
    preConfirm: () => {
      const qtyInput = document.getElementById("buy-qty");
      const noteInput = document.getElementById("buy-note");

      const quantity = Number(qtyInput?.value || 0);
      const note = (noteInput?.value || "").trim();

      if (!Number.isInteger(quantity) || quantity <= 0) {
        Swal.showValidationMessage("กรุณากรอกจำนวนให้ถูกต้อง");
        return false;
      }

      if (quantity > stock) {
        Swal.showValidationMessage("จำนวนเกินสต็อกที่มีอยู่");
        return false;
      }

      return {
        quantity,
        note,
      };
    },
  });

  if (!result.isConfirmed || !result.value) {
    return false;
  }

  try {
    const response = await fetch(`${API_BASE}/buy/buyProduct`, {
      method: "POST",
      credentials: "include",
      headers: getAuthHeaders({
        "Content-Type": "application/json",
      }),
      body: JSON.stringify({
        product_id: productId,
        quantity: result.value.quantity,
      }),
    });

    const data = await parseResponse(response);

    if (!response.ok) {
      const errorText = data?.error || `ทำรายการไม่สำเร็จ (${response.status})`;
      await Swal.fire({
        icon: "error",
        title: "ซื้อสินค้าไม่สำเร็จ",
        text: errorText,
      });
      return false;
    }

    await Swal.fire({
      icon: "success",
      title: "สั่งซื้อสำเร็จ",
      html: `
        <div class="text-left text-sm leading-6">
          <p><strong>สินค้า:</strong> ${escapeHtml(product?.name || "-")}</p>
          <p><strong>จำนวน:</strong> ${formatNumber(result.value.quantity)} ชิ้น</p>
          <p><strong>ใช้แต้ม:</strong> ${formatNumber(data?.points_spent || result.value.quantity * unitPrice)} แต้ม</p>
          <p><strong>รายละเอียด:</strong> ${escapeHtml(result.value.note || "-")}</p>
        </div>
      `,
    });

    if (typeof onSuccess === "function") {
      onSuccess({
        quantity: result.value.quantity,
        response: data,
      });
    }

    return true;
  } catch {
    await Swal.fire({
      icon: "error",
      title: "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์",
      text: "กรุณาลองใหม่อีกครั้ง",
    });
    return false;
  }
}
