'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { adminApi } from '@/lib/api';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || user?.role !== 'ADMIN') {
      router.push('/login');
      return;
    }

    const fetchStats = async () => {
      try {
        const res = await adminApi.stats();
        setStats(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [isAuthenticated, user, authLoading, router]);

  if (loading || authLoading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 className="section-title">⚙️ Admin Dashboard</h1>
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', flexWrap: 'wrap' }}>
        <Link href="/admin/users" className="btn btn-outline" style={{ borderColor: 'var(--border)', color: 'var(--text)' }}>👥 จัดการผู้ใช้</Link>
        <Link href="/admin/products" className="btn btn-outline" style={{ borderColor: 'var(--border)', color: 'var(--text)' }}>📦 ตรวจสอบสินค้า</Link>
        <Link href="/admin/orders" className="btn btn-outline" style={{ borderColor: 'var(--border)', color: 'var(--text)' }}>🛍️ ตรวจสอบคำสั่งซื้อ</Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        <div className="stat-card">
          <div className="stat-label">ผู้ใช้งานทั้งหมด</div>
          <div className="stat-value">{stats?.totalUsers || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">สินค้าทั้งหมด</div>
          <div className="stat-value" style={{ color: 'var(--success)' }}>{stats?.totalProducts || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">คำสั่งซื้อทั้งหมด</div>
          <div className="stat-value" style={{ color: 'var(--secondary)' }}>{stats?.totalOrders || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">ยอดขายรวมทั้งระบบ</div>
          <div className="stat-value" style={{ color: 'var(--primary)' }}>฿{(stats?.totalRevenue || 0).toLocaleString()}</div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px' }}>คำสั่งซื้อล่าสุด (5 รายการ)</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>ผู้ซื้อ</th>
                <th>ยอดชำระ</th>
                <th>สถานะ</th>
                <th>วันที่</th>
              </tr>
            </thead>
            <tbody>
              {stats?.recentOrders?.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>ไม่มีข้อมูล</td>
                </tr>
              ) : (
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                stats?.recentOrders?.map((order: any) => (
                  <tr key={order.id}>
                    <td style={{ fontWeight: 600 }}>#{order.id}</td>
                    <td>{order.buyer?.name || order.buyer?.email}</td>
                    <td style={{ color: 'var(--primary)', fontWeight: 600 }}>฿{order.totalAmount.toLocaleString()}</td>
                    <td>
                      <span className={`status-badge status-${order.status}`}>
                        {order.status}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>
                      {new Date(order.createdAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
