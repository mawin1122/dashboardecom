"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Category = {
  id: number;
  name: string;
  image_url?: string | null;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3001/api";
const FALLBACK_IMAGE = "https://img2.pic.in.th/pic/pimpaw-4daa1ee07fe0cc10.png";

function CategoryGrid() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_BASE}/categories/getCategories`);
        if (!response.ok) {
          throw new Error("ไม่สามารถโหลดหมวดหมู่ได้");
        }

        const data = await response.json();
        if (!isMounted) {
          return;
        }

        setCategories(Array.isArray(data) ? data : []);
      } catch (fetchError) {
        if (!isMounted) {
          return;
        }
        const message =
          fetchError instanceof Error ? fetchError.message : "เกิดข้อผิดพลาด";
        setError(message);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchCategories();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="container ">
      <div className="flex  justify-between items-center">
        <h2 className="text-3xl font-bold mb-4">หมวดหมู่</h2>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-56 animate-pulse rounded-lg bg-gray-200" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white px-4 py-6 text-sm text-gray-500">
          {error}
        </div>
      ) : categories.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white px-4 py-6 text-sm text-gray-500">
          ยังไม่มีหมวดหมู่
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/store/products/${category.id}`}
              className="block"
            >
              <img
                src={category.image_url || FALLBACK_IMAGE}
                alt={category.name}
                className="rounded-lg w-full"
              />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function StorePage() {
  return (
    <div className="container mx-auto px-4">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <CategoryGrid />
      </div>
    </div>
  );
}

export default StorePage;
