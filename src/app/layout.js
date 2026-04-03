import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "sweetalert2/dist/sweetalert2.min.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "แดชบอร์ดอีคอมเมิร์ซ",
  description: "ระบบจัดการและรายงานอีคอมเมิร์ซ",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="th"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
