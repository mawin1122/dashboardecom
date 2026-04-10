"use client";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { openBuyProductModal } from "@/lib/buy-modal";

import Footer from "@/components/footer";

const API_BASE = "http://localhost:3001/api";
const FALLBACK_IMAGE = "https://img2.pic.in.th/pic/pimpaw-4daa1ee07fe0cc10.png";
const FALLBACK_PRODUCT_IMAGE = "https://img2.pic.in.th/pic/Ghost-of-Tsushima.png";

function SectionHeader({ title, href, linkLabel }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-3xl font-bold mb-4">{title}</h2>
      <a className="rounded border border-blue-500 px-4 py-2 text-blue-500 hover:underline" href={href}>
        {linkLabel}
      </a>
    </div>
  );
}

function SectionMessage({ message }) {
  return <div className="rounded-lg border border-dashed border-gray-300 bg-white px-4 py-6 text-sm text-gray-500">{message}</div>;
}

function Carousel({ slides }) {
  const [current, setCurrent] = useState(0);
  const safeSlides = slides.length > 0 ? slides : [{ src: FALLBACK_IMAGE, alt: "Fallback slide" }];

  useEffect(() => {
    setCurrent(0);
  }, [safeSlides.length]);

  const prev = () => setCurrent((i) => (i - 1 + safeSlides.length) % safeSlides.length);
  const next = () => setCurrent((i) => (i + 1) % safeSlides.length);

  // ถ้ารูปสไลด์มีแค่ 1 รูป ให้ซ่อนปุ่มและจุดควบคุม

  const showControls = safeSlides.length > 1;

  if (!showControls) {
    return (
      <div className="relative w-full overflow-hidden rounded-2xl sm:w-full">
        <div className="relative h-56 md:h-96">
          <img
            src={safeSlides[0].src}
            alt={safeSlides[0].alt}
            className="absolute block w-full h-full object-contain md:object-cover -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2"
          />
        </div>
      </div>
    );
  }


  return (
    <div className="relative w-full overflow-hidden rounded-2xl sm:w-full">

      <div className="relative h-56 md:h-96">
        {safeSlides.map((slide, idx) => (
          <div
            key={idx}
            className={`absolute inset-0 transition-opacity duration-700 ${idx === current ? "opacity-100 z-10" : "opacity-0 z-0"}`}
          >
            <img
              src={slide.src}
              alt={slide.alt}
              className="absolute block w-full h-full object-contain md:object-cover -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2"
            />
          </div>
        ))}
      </div>

      {/* prev */}
      <button
        type="button"
        onClick={prev}
        className="absolute top-0 start-0 z-30 flex items-center justify-center h-full px-4 cursor-pointer group focus:outline-none"
      >
        <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/30 group-hover:bg-white/50 group-focus:ring-4 group-focus:ring-white">
          <ChevronLeft className="w-5 h-5 text-white" />
          <span className="sr-only">Previous</span>
        </span>
      </button>

      {/* next */}
      <button
        type="button"
        onClick={next}
        className="absolute top-0 end-0 z-30 flex items-center justify-center h-full px-4 cursor-pointer group focus:outline-none"
      >
        <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/30 group-hover:bg-white/50 group-focus:ring-4 group-focus:ring-white">
          <ChevronRight className="w-5 h-5 text-white" />
          <span className="sr-only">Next</span>
        </span>
      </button>

      {/* dots */}
      <div className="absolute bottom-3 left-1/2 z-30 flex -translate-x-1/2 gap-2">
        {safeSlides.map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setCurrent(idx)}
            className={`h-2 rounded-full transition-all ${idx === current ? "w-6 bg-white" : "w-2 bg-white/50"}`}
          />
        ))}
      </div>
    </div>
  );
}

function Category({ categories, isLoading, error }) {
  const visibleCategories = categories.slice(0, 3);

  return (
    <div className="container ">
      <SectionHeader title="หมวดหมู่" href="/store/products" linkLabel="ไปที่ร้านค้า" />
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-44 animate-pulse rounded-lg bg-gray-200" />
          ))}
        </div>
      ) : error ? (
        <SectionMessage message="ไม่สามารถโหลดข้อมูลหมวดหมู่ได้" />
      ) : visibleCategories.length === 0 ? (
        <SectionMessage message="ยังไม่มีหมวดหมู่ให้แสดง" />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {visibleCategories.map((category) => (
            <a key={category.id} href={`/store/products/${category.id}`} className="relative block overflow-hidden rounded-lg bg-white">
              <img
                src={category.image_url || FALLBACK_IMAGE}
                alt={category.name}
                className="h-44 w-full object-cover md:h-56"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-4 py-3 text-white">
                <h3 className="text-lg font-semibold">{category.name}</h3>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function ProductCard({ products, isLoading, error, onBuyProduct }) {
  const visibleProducts = products.slice(0, 6);

  return (
    <div className="container ">
      <SectionHeader title="สินค้าแนะนำ" href="/store/products" linkLabel="ไปที่ร้านค้า" />
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 xl:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-80 animate-pulse rounded-lg bg-gray-200" />
          ))}
        </div>
      ) : error ? (
        <SectionMessage message="ไม่สามารถโหลดข้อมูลสินค้าได้" />
      ) : visibleProducts.length === 0 ? (
        <SectionMessage message="ยังไม่มีสินค้าแนะนำ" />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 xl:grid-cols-4 md:w-full md:h-auto md:grid-cols-3">
          {visibleProducts.map((product) => {
            const price = Number(product.price || 0);
            const stock = Number(product.stock || 0);

            return (
              <div key={product.id} className="w-full rounded-lg border border-black bg-white p-4">
                <div className="flex flex-col gap-4">
                  <img
                    src={product.image_url || FALLBACK_PRODUCT_IMAGE}
                    alt={product.name}
                    className="h-auto w-full rounded object-cover"
                  />
                  <div>
                    <h3 className="text-xl font-bold">{product.name}</h3>
                    <p className="text-gray-600">ราคา: {price.toLocaleString("th-TH")} บาท</p>
                    <p className="text-gray-600">สินค้าคงเหลือ: {product.stock}</p>
                  </div>
                  <button
                    type="button"
                    className="inline-flex rounded bg-blue-500 px-4 py-2 text-center text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-gray-400 items-center justify-center"
                    disabled={stock <= 0}
                    onClick={() => onBuyProduct(product)}
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
  );
}

function Home() {
  const [slides, setSlides] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState({
    carousels: true,
    categories: true,
    products: true,
  });
  const [errors, setErrors] = useState({
    carousels: false,
    categories: false,
    products: false,
  });

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

    const fetchJson = async (url) => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }
      return response.json();
    };

    const loadHomeData = async () => {
      const [carouselResult, categoryResult, productResult] = await Promise.allSettled([
        fetchJson(`${API_BASE}/carousels/getCarousels`),
        fetchJson(`${API_BASE}/categories/getCategories`),
        fetchJson(`${API_BASE}/products/getProducts`),
      ]);

      if (!isMounted) {
        return;
      }

      if (carouselResult.status === "fulfilled") {
        setSlides(
          carouselResult.value.map((item, index) => ({
            src: item.image_url || FALLBACK_IMAGE,
            alt: `Slide ${index + 1}`,
          }))
        );
      } else {
        setErrors((prev) => ({ ...prev, carousels: true }));
      }

      if (categoryResult.status === "fulfilled") {
        setCategories(categoryResult.value);
      } else {
        setErrors((prev) => ({ ...prev, categories: true }));
      }

      if (productResult.status === "fulfilled") {
        setProducts(productResult.value);
      } else {
        setErrors((prev) => ({ ...prev, products: true }));
      }

      setLoading({
        carousels: false,
        categories: false,
        products: false,
      });
    };

    loadHomeData().catch(() => {
      if (!isMounted) {
        return;
      }

      setErrors({
        carousels: true,
        categories: true,
        products: true,
      });
      setLoading({
        carousels: false,
        categories: false,
        products: false,
      });
    });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 ">
      <main className="mx-auto max-w-6xl px-4   sm:px-6 lg:px-8 lg:py-8 rounded-lg " >
        <Carousel slides={slides} />
        {loading.carousels === false && errors.carousels && slides.length === 0 ? (
          <div className="mt-3">
            <SectionMessage message="ไม่สามารถโหลดรูปสไลด์ได้ กำลังใช้ภาพสำรองแทน" />
          </div>
        ) : null}
        <div className="mt-5">
          <Category categories={categories} isLoading={loading.categories} error={errors.categories} />
        </div>
        <div className="mt-5">
          <ProductCard
            products={products}
            isLoading={loading.products}
            error={errors.products}
            onBuyProduct={handleBuyProduct}
          />
        </div>
      </main>


        <Footer />


    </div>
    
  );
}

export default Home;

