import { BottomNavBar } from "@/components/bottom-nav-bar";

function Home() {
  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm sm:p-12">
          <p className="text-sm font-medium text-gray-500">E-commerce Admin</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            ระบบจัดการร้านค้าในที่เดียว
          </h1>
          <p className="mt-4 max-w-2xl text-gray-600">
            จัดการสินค้า หมวดหมู่ ผู้ใช้งาน และดูภาพรวมยอดขายได้จากเมนูด้านบน
          </p>
        </section>
      </main>

      <BottomNavBar stickyTop />
    </div>
  );
}

export default Home;
