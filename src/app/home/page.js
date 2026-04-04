"use client";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { BottomNavBar } from "@/components/bottom-nav-bar";

const slides = [
  { src: "https://img2.pic.in.th/pic/pimpaw-4daa1ee07fe0cc10.png", alt: "Slide 1" },
  { src: "https://img2.pic.in.th/pic/pimpaw-4daa1ee07fe0cc10.png", alt: "Slide 2" },
  { src: "https://img2.pic.in.th/pic/pimpaw-4daa1ee07fe0cc10.png", alt: "Slide 3" },
  { src: "https://img2.pic.in.th/pic/pimpaw-4daa1ee07fe0cc10.png", alt: "Slide 4" },
  { src: "https://img2.pic.in.th/pic/pimpaw-4daa1ee07fe0cc10.png", alt: "Slide 5" },
];

function Carousel() {
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
        {slides.map((_, idx) => (
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

function Home() {
  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Carousel />
      </main>

      <BottomNavBar stickyTop />
    </div>
  );
}

export default Home;

