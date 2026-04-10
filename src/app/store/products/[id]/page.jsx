"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { openBuyProductModal } from "@/lib/buy-modal";

const API_BASE = "http://localhost:3001/api";
const FALLBACK_PRODUCT_IMAGE = "https://img2.pic.in.th/pic/Ghost-of-Tsushima.png";


const slides = [
  { src: "https://img2.pic.in.th/pic/pimpaw-4daa1ee07fe0cc10.png", alt: "Slide 1" },
];

function Banner() {
  const [current, setCurrent] = useState(0);

  const prev = () => setCurrent((i) => (i - 1 + slides.length) % slides.length);
  const next = () => setCurrent((i) => (i + 1) % slides.length);

  return (
    <div className="relative w-full overflow-hidden rounded-2xl">
      <div className="relative h-56 md:h-96">
        {slides.map((slide, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 transition-opacity duration-700 ${idx === current ? "opacity-100 z-10" : "opacity-0 z-0"}`}
          >
            <img
              src={slide.src}
              alt={slide.alt}
              className="absolute block w-full h-full object-cover -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2"
            />
          </div>
        ))}
      </div>


    </div>
  );
}
function CategoryProductsPage() {
  const { id } = useParams();
  const [categoryName, setCategoryName] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const handleBuyProduct = async (product) => {
    await openBuyProductModal(product, {
      onSuccess: ({ quantity }) => {
        setProducts((prev) => prev.map((item) => {
          if (item.id !== product.id) {
            return item;
          }

          const currentStock = Number(item.stock || 0);
          return {
            ...item,
            stock: Math.max(currentStock - Number(quantity || 0), 0),
          };
        }));
      },
    });
  };

  useEffect(() => {
    let isMounted = true;

    const fetchCategoryProducts = async () => {
      if (!id) {
        return;
      }

      try {
        setLoading(true);
        setError("");

        const categoryResponse = await fetch(`${API_BASE}/categories/getCategory/${id}`);
        if (!categoryResponse.ok) {
          if (categoryResponse.status === 404) {
            throw new Error("ไม่พบหมวดหมู่");
          }
          throw new Error("ไม่สามารถโหลดข้อมูลหมวดหมู่ได้");
        }

        const categoryData = await categoryResponse.json();
        const category = categoryData.name || "";

        const productsResponse = await fetch(
          `${API_BASE}/categories/getProductsByCategory/${encodeURIComponent(category)}`
        );

        if (!productsResponse.ok) {
          throw new Error("ไม่สามารถโหลดรายการสินค้าได้");
        }

        const productsData = await productsResponse.json();

        if (!isMounted) {
          return;
        }

        setCategoryName(category);
        setProducts(Array.isArray(productsData) ? productsData : []);
      } catch (fetchError) {
        if (!isMounted) {
          return;
        }
        setError(fetchError.message || "เกิดข้อผิดพลาด");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchCategoryProducts();

    return () => {
      isMounted = false;
    };
  }, [id]);

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Banner />

        <div className="mt-4 container">
          <div className="mb-4 flex items-center justify-between md:flex-col md:flex-row">
            <h1 className="text-3xl font-bold">{categoryName ? `สินค้าในหมวด ${categoryName}` : "สินค้าในหมวด"}</h1>

          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="h-80 animate-pulse rounded-lg bg-gray-200" />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-lg border border-dashed border-gray-300 bg-white px-4 py-6 text-sm text-gray-500">{error}</div>
          ) : products.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 bg-white px-4 py-6 text-sm text-gray-500">
              หมวดหมู่นี้ยังไม่มีสินค้า
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {products.map((product) => {
                const price = Number(product.price || 0);
                const stock = Number(product.stock || 0);

                return (
                  <div key={product.id} className="w-full rounded-lg border border-black bg-white p-4 px-4">
                    <div className="flex flex-col items-center gap-4">
                      <img
                        src={product.image_url || FALLBACK_PRODUCT_IMAGE}
                        alt={product.name}
                        className="w-full rounded object-cover"
                      />
                      <div>
                        <h3 className="text-xl font-bold">{product.name}</h3>
                        <p className="text-gray-600">ราคา: {price.toLocaleString("th-TH")} บาท</p>
                        <p className="text-gray-600">สถานะ: {stock > 0 ? "มีสินค้าในสต็อก" : "สินค้าหมด"}</p>
                      </div>
                      <button
                        type="button"
                        className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-gray-400"
                        disabled={stock <= 0}
                        onClick={() => handleBuyProduct(product)}
                      >
                        ซื้อสินค้า
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default CategoryProductsPage;
