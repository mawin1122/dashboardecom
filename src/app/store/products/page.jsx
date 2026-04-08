"use client";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
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

function ProductCard() {
  return (
        <div className="container ">
      <div className="flex  justify-between items-center" >
        <h2 className="text-3xl font-bold mb-4">สินค้าในหมวดหมู่</h2>
      </div>
      <div className="grid grid-cols-4 gap-4 ">
     <div className="border border-black rounded-lg py-4 px-3 w-fit bg-white ">
        <div className="flex flex-col items-center gap-4">
            <img src="https://img2.pic.in.th/pic/Ghost-of-Tsushima.png" alt="productimage" className="  object-cover rounded w-full" />
            <div>
                <h3 className="text-xl font-bold">Ghost of Tsushima</h3>
                <p className="text-gray-600">ราคา: 1,500 บาท</p>
                <p className="text-gray-600">สถานะ: มีสินค้าในสต็อก</p>
            </div>
            <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">ซื้อสินค้า</button>
            
          </div>
      </div>
        <div className="border border-black rounded-lg p-4 px-4 w-fit bg-white">
        <div className="flex flex-col items-center gap-4">
            <img src="https://img2.pic.in.th/pic/Ghost-of-Tsushima.png" alt="productimage" className="w-full  object-cover rounded" />
            <div>
                <h3 className="text-xl font-bold">Ghost of Tsushima</h3>
                <p className="text-gray-600">ราคา: 1,500 บาท</p>
                <p className="text-gray-600">สถานะ: มีสินค้าในสต็อก</p>
            </div>
            <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">ซื้อสินค้า</button>
            
          </div>
      </div>
        <div className="border border-black rounded-lg p-4 px-4 w-fit bg-white">
        <div className="flex flex-col items-center gap-4">
            <img src="https://img2.pic.in.th/pic/Ghost-of-Tsushima.png" alt="productimage" className="w-full  object-cover rounded" />
            <div>
                <h3 className="text-xl font-bold">Ghost of Tsushima</h3>
                <p className="text-gray-600">ราคา: 1,500 บาท</p>
                <p className="text-gray-600">สถานะ: มีสินค้าในสต็อก</p>
            </div>
            <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">ซื้อสินค้า</button>
            
          </div>
      </div>
           <div className="border border-black rounded-lg p-4 px-4 w-fit bg-white">
        <div className="flex flex-col items-center gap-4">
            <img src="https://img2.pic.in.th/pic/Ghost-of-Tsushima.png" alt="productimage" className="w-full  object-cover rounded" />
            <div>
                <h3 className="text-xl font-bold">Ghost of Tsushima</h3>
                <p className="text-gray-600">ราคา: 1,500 บาท</p>
                <p className="text-gray-600">สถานะ: มีสินค้าในสต็อก</p>
            </div>
            <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">ซื้อสินค้า</button>
            
          </div>
      </div>
        <div className="border border-black rounded-lg p-4 px-4 w-fit bg-white">
        <div className="flex flex-col items-center gap-4">
            <img src="https://img2.pic.in.th/pic/Ghost-of-Tsushima.png" alt="productimage" className="w-full  object-cover rounded" />
            <div>
                <h3 className="text-xl font-bold">Ghost of Tsushima</h3>
                <p className="text-gray-600">ราคา: 1,500 บาท</p>
                <p className="text-gray-600">สถานะ: มีสินค้าในสต็อก</p>
            </div>
            <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">ซื้อสินค้า</button>
            
          </div>
      </div>
        <div className="border border-black rounded-lg p-4 px-4 w-fit bg-white">
        <div className="flex flex-col items-center gap-4">
            <img src="https://img2.pic.in.th/pic/Ghost-of-Tsushima.png" alt="productimage" className="w-full  object-cover rounded" />
            <div>
                <h3 className="text-xl font-bold">Ghost of Tsushima</h3>
                <p className="text-gray-600">ราคา: 1,500 บาท</p>
                <p className="text-gray-600">สถานะ: มีสินค้าในสต็อก</p>
            </div>
            <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">ซื้อสินค้า</button>
            
          </div>
      </div>
      
      
      </div>
 
  </div>
  );
}
function ProductsPage() {
  return (
    <div className="min-h-screen bg-gray-50  ">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8" >
        <Banner />


            <div className="mt-4">
                <ProductCard />
            </div>
        </div>
   </div>
  )
}

export default ProductsPage