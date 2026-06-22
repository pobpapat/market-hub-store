'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { adminApi } from '@/lib/api';
import Link from 'next/link';

export default function AdminOrdersPage() {
  const router = useRouter();
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  async function fetchOrders() {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      
      const res = await adminApi.orders(params);
      setOrders(res.data.orders || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || user?.role !== 'ADMIN') {
      router.push('/login');
      return;
    }

    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user, authLoading, router, page, statusFilter]);

  if (authLoading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/admin" style={{ color: 'var(--text-muted)' }}>← กลับ</Link>
          <h1 className="section-title">️ ตรวจสอบคำสั่งซื้อ</h1>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '24px', padding: '16px' }}>
        <div className="filter-bar" style={{ margin: 0 }}>
          <select 
            className="form-select" 
            value={statusFilter} 
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            style={{ minWidth: '200px' }}
          >
            <option value="">ทุกสถานะ</option>
            <option value="PENDING">รอการยืนยัน</option>
            <option value="CONFIRMED">กำลังเตรียมจัดส่ง</option>
            <option value="SHIPPING">กำลังจัดส่ง</option>
            <option value="DELIVERED">จัดส่งสำเร็จ</option>
            <option value="CANCELLED">ยกเลิกคำสั่งซื้อ</option>
          </select>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrap">
          {loading ? (
            <div className="loading-center"><div className="spinner" /></div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>ผู้ซื้อ</th>
                  <th>จำนวนสินค้า</th>
                  <th>ยอดชำระสุทธิ</th>
                  <th>วิธีการชำระเงิน</th>
                  <th>สถานะ</th>
                  <th>วันที่สั่งซื้อ</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '32px' }}>ไม่พบคำสั่งซื้อ</td></tr>
                ) : (
                  orders.map(o => (
                    <tr key={o.id}>
                      <td style={{ fontWeight: 600 }}>#{o.id}</td>
                      <td>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{o.buyer?.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{o.buyer?.email}</div>
                      </td>
                      <td>{o.items?.length || 0} รายการ</td>
                      <td style={{ color: 'var(--primary)', fontWeight: 600 }}>฿{o.totalAmount.toLocaleString()}</td>
                      <td style={{ fontSize: '0.85rem' }}>{o.paymentMethod === 'mock_payment' ? 'Mock Payment' : 'COD'}</td>
                      <td>
                        <span className={`status-badge status-${o.status}`}>
                          {o.status}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {new Date(o.createdAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              className={`page-btn ${page === i + 1 ? 'active' : ''}`}
              onClick={() => setPage(i + 1)}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
