import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "MarketHub — ตลาดซื้อขายออนไลน์",
  description: "แพลตฟอร์มซื้อขายสินค้าออนไลน์ที่ดีที่สุด มีสินค้าหลายหมวดหมู่ ราคาถูก ส่งไว",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body className={`${inter.variable} font-sans`}>
        <AuthProvider>
          <Navbar />
          <main className="main-content">
            {children}
          </main>
          <footer className="site-footer">
            <div className="footer-inner">
              <div className="footer-brand">
                <span className="logo-icon">🛍️</span>
                <span className="logo-text">MarketHub</span>
              </div>
              <p className="footer-copy">© 2026 MarketHub. All rights reserved.</p>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
