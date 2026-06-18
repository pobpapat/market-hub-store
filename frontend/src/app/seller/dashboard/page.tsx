'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { productsApi, ordersApi } from '@/lib/api';
import Link from 'next/link';

export default function SellerDashboardPage() {
  const router = useRouter();
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || user?.role !== 'SELLER') {
      router.push('/login');
      return;
    }

    const fetchDashboardData = async () => {
      try {
        const [productsRes, ordersRes] = await Promise.all([
          productsApi.list({ sellerId: user?.id ?? 0 }),
          ordersApi.sellerOrders()
        ]);
        
        const products = productsRes.data.products || [];
        const orders = ordersRes.data || [];
        
        const revenue = orders.reduce((sum: number, order: any) => {
          // Calculate only items sold by this seller
          const sellerItems = order.items.filter((i: any) => i.product.sellerId === user?.id);
          const orderRev = sellerItems.reduce((s: number, i: any) => s + (i.price * i.quantity), 0);
          return sum + orderRev;
        }, 0);

        setStats({
          totalProducts: products.length,
          totalOrders: orders.length,
          totalRevenue: revenue
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [isAuthenticated, user, authLoading, router]);

  if (loading || authLoading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 className="section-title">📊 แดชบอร์ดร้านค้า</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link href="/seller/products" className="btn btn-outline" style={{ borderColor: 'var(--border)', color: 'var(--text)' }}>
            จัดการสินค้า
          </Link>
          <Link href="/seller/orders" className="btn btn-outline" style={{ borderColor: 'var(--border)', color: 'var(--text)' }}>
            จัดการคำสั่งซื้อ
          </Link>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        <div className="stat-card">
          <div className="stat-label">ยอดขายทั้งหมด</div>
          <div className="stat-value" style={{ color: 'var(--primary)' }}>฿{stats.totalRevenue.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">คำสั่งซื้อทั้งหมด</div>
          <div className="stat-value" style={{ color: 'var(--secondary)' }}>{stats.totalOrders}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">สินค้าในร้าน</div>
          <div className="stat-value" style={{ color: 'var(--success)' }}>{stats.totalProducts}</div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px' }}>ยินดีต้อนรับกลับมา, {user?.shopName || user?.name}</h3>
        <p style={{ color: 'var(--text-muted)' }}>
          จัดการสินค้าและคำสั่งซื้อของคุณได้จากเมนูด้านบน หรือดูภาพรวมยอดขายที่นี่
        </p>
      </div>
    </div>
  );
}
