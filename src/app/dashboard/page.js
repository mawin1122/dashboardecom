"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";
import { Activity, CreditCard, Package, ShoppingCart, Users } from "lucide-react";

import { Sidebar } from "../../components/sidebar";
import { clearToken, getAuthHeaders } from "../../lib/auth";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const RANGE_LABELS = {
  day: "7 วันล่าสุด",
  week: "8 สัปดาห์ล่าสุด",
  month: "6 เดือนล่าสุด",
};

const cardStyles = "rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md";

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: "index",
    intersect: false,
  },
  plugins: {
    legend: {
      position: "bottom",
      labels: {
        usePointStyle: true,
      },
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
    },
    y: {
      beginAtZero: true,
      ticks: {
        precision: 0,
      },
    },
  },
};

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

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function getWeekStart(dateValue) {
  const date = new Date(dateValue);
  const day = date.getDay();
  const diff = (day + 6) % 7;
  date.setDate(date.getDate() - diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function buildBuckets(range) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (range === "day") {
    return Array.from({ length: 7 }, (_, idx) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - idx));
      return {
        key: date.toISOString().slice(0, 10),
        label: new Intl.DateTimeFormat("th-TH", { weekday: "short" }).format(date),
        start: date,
        end: new Date(date.getTime() + 24 * 60 * 60 * 1000),
      };
    });
  }

  if (range === "week") {
    const thisWeekStart = getWeekStart(today);
    return Array.from({ length: 8 }, (_, idx) => {
      const start = new Date(thisWeekStart);
      start.setDate(thisWeekStart.getDate() - (7 * (7 - idx)));
      const end = new Date(start);
      end.setDate(start.getDate() + 7);
      const weekNo = idx + 1;
      return {
        key: start.toISOString().slice(0, 10),
        label: `W${weekNo}`,
        start,
        end,
      };
    });
  }

  const monthNow = new Date(today.getFullYear(), today.getMonth(), 1);
  return Array.from({ length: 6 }, (_, idx) => {
    const start = new Date(monthNow.getFullYear(), monthNow.getMonth() - (5 - idx), 1);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
    return {
      key: `${start.getFullYear()}-${start.getMonth() + 1}`,
      label: new Intl.DateTimeFormat("th-TH", { month: "short" }).format(start),
      start,
      end,
    };
  });
}

function buildRangeData(orders, range) {
  const buckets = buildBuckets(range);
  const series = buckets.map(() => ({ revenue: 0, orders: 0, qty: 0, users: new Set() }));

  orders.forEach((order) => {
    const date = new Date(order.created_at);
    if (Number.isNaN(date.getTime())) return;

    const bucketIndex = buckets.findIndex((bucket) => date >= bucket.start && date < bucket.end);
    if (bucketIndex === -1) return;

    series[bucketIndex].revenue += Number(order.total_price) || 0;
    series[bucketIndex].orders += 1;
    series[bucketIndex].qty += Number(order.quantity) || 0;
    if (Number.isInteger(Number(order.user_id))) {
      series[bucketIndex].users.add(Number(order.user_id));
    }
  });

  const labels = buckets.map((bucket) => bucket.label);
  const revenue = series.map((item) => item.revenue);
  const orderCounts = series.map((item) => item.orders);
  const quantities = series.map((item) => item.qty);
  const activeUsers = series.map((item) => item.users.size);

  const totalRevenue = revenue.reduce((sum, value) => sum + value, 0);
  const totalOrders = orderCounts.reduce((sum, value) => sum + value, 0);
  const totalQty = quantities.reduce((sum, value) => sum + value, 0);
  const uniqueUsers = new Set();
  series.forEach((item) => item.users.forEach((userId) => uniqueUsers.add(userId)));

  const split = Math.floor(revenue.length / 2);
  const prev = revenue.slice(0, split).reduce((sum, value) => sum + value, 0);
  const curr = revenue.slice(split).reduce((sum, value) => sum + value, 0);
  const growthRate = prev <= 0 ? (curr > 0 ? 100 : 0) : ((curr - prev) / prev) * 100;

  return {
    labels,
    revenue,
    orderCounts,
    quantities,
    activeUsers,
    kpi: {
      totalRevenue,
      totalOrders,
      totalQty,
      activeUsers: uniqueUsers.size,
      growthRate,
    },
  };
}

function ChartCard({ title, children }) {
  return (
    <div className={`${cardStyles} h-[340px]`}>
      <div className="mb-3">
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="h-[270px]">{children}</div>
    </div>
  );
}

function DashboardPage() {
  const router = useRouter();
  const [range, setRange] = useState("day");
  const [mounted, setMounted] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const checkSession = async () => {
      setMounted(true);
      try {
        const res = await fetch("http://localhost:3001/api/users/profile", {
          credentials: "include",
          cache: "no-store",
          headers: getAuthHeaders(),
        });

        if (res.ok) {
          const profile = await res.json();
          if (String(profile.role || "").trim().toLowerCase() !== "admin") {
            router.replace("/404");
            return;
          }
          setAuthorized(true);
          return;
        }

        if (res.status === 401) {
          clearToken();
        }
        router.replace("/login");
      } catch (sessionError) {
        console.error("Session check failed:", sessionError);
        router.replace("/login");
      }
    };

    checkSession();
  }, [router]);

  useEffect(() => {
    if (!authorized) return;

    let cancelled = false;

    const loadDashboardData = async () => {
      setLoading(true);
      setError("");

      try {
        const headers = getAuthHeaders();
        const [usersRes, productsRes, ordersRes] = await Promise.all([
          fetch("http://localhost:3001/api/users/getUsers", { credentials: "include", headers }),
          fetch("http://localhost:3001/api/products/getProducts", { credentials: "include", headers }),
          fetch("http://localhost:3001/api/history/getAllPurchaseHistory", { credentials: "include", headers }),
        ]);

        const [usersData, productsData, ordersData] = await Promise.all([
          usersRes.json(),
          productsRes.json(),
          ordersRes.json(),
        ]);

        if (!usersRes.ok) throw new Error(usersData.error || "โหลดผู้ใช้ไม่สำเร็จ");
        if (!productsRes.ok) throw new Error(productsData.error || "โหลดสินค้าไม่สำเร็จ");
        if (!ordersRes.ok) throw new Error(ordersData.error || "โหลดประวัติคำสั่งซื้อไม่สำเร็จ");

        if (cancelled) return;
        setUsers(Array.isArray(usersData) ? usersData : []);
        setProducts(Array.isArray(productsData) ? productsData : []);
        setOrders(Array.isArray(ordersData) ? ordersData : []);
      } catch (loadError) {
        if (cancelled) return;
        setError(loadError.message || "เกิดข้อผิดพลาดในการโหลดข้อมูล");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadDashboardData();
    return () => {
      cancelled = true;
    };
  }, [authorized]);

  const activeData = useMemo(() => buildRangeData(orders, range), [orders, range]);

  const lowStockProducts = useMemo(
    () => [...products]
      .sort((a, b) => Number(a.stock || 0) - Number(b.stock || 0))
      .slice(0, 5),
    [products]
  );

  const recentOrders = useMemo(
    () => [...orders]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5),
    [orders]
  );

  const topPointsUsers = useMemo(
    () => [...users]
      .sort((a, b) => Number(b.point || 0) - Number(a.point || 0))
      .slice(0, 5),
    [users]
  );

  if (!mounted || !authorized) {
    return null;
  }

  const kpiCards = [
    {
      key: "revenue",
      title: "ยอดขายรวม",
      value: formatCurrency(activeData.kpi.totalRevenue),
      icon: CreditCard,
    },
    {
      key: "users",
      title: "ผู้ซื้อที่ใช้งาน",
      value: formatNumber(activeData.kpi.activeUsers),
      icon: Users,
    },
    {
      key: "orders",
      title: "คำสั่งซื้อทั้งหมด",
      value: formatNumber(activeData.kpi.totalOrders),
      icon: ShoppingCart,
    },
    {
      key: "qty",
      title: "จำนวนชิ้นที่ขาย",
      value: formatNumber(activeData.kpi.totalQty),
      icon: Package,
    },
    {
      key: "growth",
      title: "อัตราเติบโต",
      value: `${activeData.kpi.growthRate.toFixed(1)}%`,
      icon: Activity,
    },
  ];

  const revenueData = {
    labels: activeData.labels,
    datasets: [
      {
        label: "ยอดขาย",
        data: activeData.revenue,
        borderColor: "#0f766e",
        backgroundColor: "rgba(15, 118, 110, 0.18)",
        pointBackgroundColor: "#0f766e",
        pointRadius: 4,
        pointHoverRadius: 5,
        borderWidth: 2,
        tension: 0.28,
        fill: true,
      },
    ],
  };

  const usersData = {
    labels: activeData.labels,
    datasets: [
      {
        label: "ผู้ซื้อ",
        data: activeData.activeUsers,
        backgroundColor: "rgba(31, 41, 55, 0.65)",
        borderRadius: 8,
      },
    ],
  };

  const ordersData = {
    labels: activeData.labels,
    datasets: [
      {
        label: "คำสั่งซื้อ",
        data: activeData.orderCounts,
        backgroundColor: "rgba(75, 85, 99, 0.75)",
        borderRadius: 8,
      },
    ],
  };

  const qtyData = {
    labels: activeData.labels,
    datasets: [
      {
        label: "จำนวนสินค้าที่ขาย",
        data: activeData.quantities,
        borderColor: "#111827",
        backgroundColor: "rgba(17, 24, 39, 0.18)",
        borderWidth: 2,
        tension: 0.35,
        fill: true,
      },
    ],
  };

  return (
    <Sidebar title="แดชบอร์ดวิเคราะห์">
      <div className="space-y-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">แดชบอร์ดอีคอมเมิร์ซ</h1>
            <p className="text-sm text-gray-500">สรุปภาพรวมจากข้อมูลจริงของสินค้า ผู้ใช้ และคำสั่งซื้อ</p>
          </div>
          <div className="inline-flex w-full rounded-xl border border-gray-200 bg-gray-50 p-1 md:w-auto">
            {Object.entries(RANGE_LABELS).map(([value, label]) => {
              const isActive = range === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRange(value)}
                  className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition md:flex-none ${
                    isActive
                      ? "bg-gray-900 text-white shadow-sm"
                      : "text-gray-600 hover:bg-white hover:text-gray-900"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </header>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {kpiCards.map(({ key, title, value, icon: Icon }) => (
            <article key={key} className={cardStyles}>
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-medium text-gray-500">{title}</p>
                <Icon className="h-4 w-4 text-gray-700" />
              </div>
              <p className="text-2xl font-bold tracking-tight text-gray-900">{loading ? "..." : value}</p>
            </article>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <ChartCard title={`แนวโน้มยอดขาย (${RANGE_LABELS[range]})`}>
            <Line data={revenueData} options={chartOptions} />
          </ChartCard>

          <ChartCard title={`แนวโน้มจำนวนผู้ซื้อ (${RANGE_LABELS[range]})`}>
            <Bar data={usersData} options={chartOptions} />
          </ChartCard>

          <ChartCard title={`แนวโน้มคำสั่งซื้อ (${RANGE_LABELS[range]})`}>
            <Bar data={ordersData} options={chartOptions} />
          </ChartCard>

          <ChartCard title={`แนวโน้มจำนวนชิ้นที่ขาย (${RANGE_LABELS[range]})`}>
            <Line data={qtyData} options={chartOptions} />
          </ChartCard>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <div className={cardStyles}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">คำสั่งซื้อล่าสุด</h2>
              <span className="text-xs font-medium text-gray-500">ล่าสุด 5 รายการ</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-gray-500">
                    <th className="pb-2 font-medium">ผู้ใช้</th>
                    <th className="pb-2 font-medium">สินค้า</th>
                    <th className="pb-2 font-medium">จำนวน</th>
                    <th className="pb-2 font-medium">ยอดรวม</th>
                    <th className="pb-2 font-medium">สถานะ</th>
                    <th className="pb-2 font-medium">เวลา</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((item) => (
                    <tr key={item.id} className="border-b border-gray-100 last:border-0">
                      <td className="py-3 text-gray-700">{item.username || item.email || `User ${item.user_id}`}</td>
                      <td className="py-3 text-gray-700">{item.product_name || `Product ${item.product_id}`}</td>
                      <td className="py-3 text-gray-700">{formatNumber(item.quantity)}</td>
                      <td className="py-3 text-gray-900">{formatCurrency(item.total_price)}</td>
                      <td className="py-3 text-gray-700">{item.status || "-"}</td>
                      <td className="py-3 text-gray-500">{formatDateTime(item.created_at)}</td>
                    </tr>
                  ))}
                  {!loading && recentOrders.length === 0 ? (
                    <tr>
                      <td className="py-4 text-center text-gray-500" colSpan={6}>ยังไม่มีข้อมูลคำสั่งซื้อ</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>

          <div className={cardStyles}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">สินค้าใกล้หมดสต็อก</h2>
              <span className="text-xs font-medium text-gray-500">น้อยสุด 5 รายการ</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-gray-500">
                    <th className="pb-2 font-medium">สินค้า</th>
                    <th className="pb-2 font-medium">หมวดหมู่</th>
                    <th className="pb-2 font-medium">ราคา</th>
                    <th className="pb-2 font-medium">คงเหลือ</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockProducts.map((item) => (
                    <tr key={item.id} className="border-b border-gray-100 last:border-0">
                      <td className="py-3 text-gray-800">{item.name}</td>
                      <td className="py-3 text-gray-700">{item.category || "-"}</td>
                      <td className="py-3 text-gray-700">{formatCurrency(item.price)}</td>
                      <td className="py-3 font-semibold text-gray-900">{formatNumber(item.stock)}</td>
                    </tr>
                  ))}
                  {!loading && lowStockProducts.length === 0 ? (
                    <tr>
                      <td className="py-4 text-center text-gray-500" colSpan={4}>ยังไม่มีข้อมูลสินค้า</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className={cardStyles}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">ผู้ใช้แต้มสูงสุด</h2>
            <span className="text-xs font-medium text-gray-500">Top 5</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500">
                  <th className="pb-2 font-medium">ชื่อผู้ใช้</th>
                  <th className="pb-2 font-medium">อีเมล</th>
                  <th className="pb-2 font-medium">บทบาท</th>
                  <th className="pb-2 font-medium">แต้ม</th>
                </tr>
              </thead>
              <tbody>
                {topPointsUsers.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100 last:border-0">
                    <td className="py-3 text-gray-800">{item.username}</td>
                    <td className="py-3 text-gray-700">{item.email}</td>
                    <td className="py-3 text-gray-700">{item.role}</td>
                    <td className="py-3 font-semibold text-gray-900">{formatNumber(item.point)}</td>
                  </tr>
                ))}
                {!loading && topPointsUsers.length === 0 ? (
                  <tr>
                    <td className="py-4 text-center text-gray-500" colSpan={4}>ยังไม่มีข้อมูลผู้ใช้</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Sidebar>
  );
}

export default DashboardPage;
