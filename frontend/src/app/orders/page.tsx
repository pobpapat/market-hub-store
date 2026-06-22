'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ordersApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import Image from 'next/image';
import Link from 'next/link';

function OrdersList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, user } = useAuth();
  
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const success = searchParams.get('success');

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'BUYER') {
      router.push('/login');
      return;
    }

    const fetchOrders = async () => {
      try {
        const res = await ordersApi.myOrders();
        setOrders(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [isAuthenticated, user, router]);

  const getStatusBadge = (status: string) => {
    const statusMap: any = {
      PENDING: { label: 'รอการยืนยัน', class: 'status-PENDING' },
      CONFIRMED: { label: 'กำลังเตรียมจัดส่ง', class: 'status-CONFIRMED' },
      SHIPPING: { label: 'กำลังจัดส่ง', class: 'status-SHIPPING' },
      DELIVERED: { label: 'จัดส่งสำเร็จ', class: 'status-DELIVERED' },
      CANCELLED: { label: 'ยกเลิก', class: 'status-CANCELLED' },
    };
    const s = statusMap[status] || { label: status, class: 'status-PENDING' };
    return <span className={`status-badge ${s.class}`}>{s.label}</span>;
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div className="page-container">
      {success && (
        <div className="alert alert-success" style={{ marginBottom: '24px' }}>
           สั่งซื้อสินค้าสำเร็จ! ขอบคุณที่ใช้บริการ MarketHub
        </div>
      )}

      <h1 className="section-title" style={{ marginBottom: '24px' }}> คำสั่งซื้อของฉัน</h1>

      {orders.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-icon"></div>
          <div className="empty-title">ยังไม่มีคำสั่งซื้อ</div>
          <div className="empty-desc">คุณยังไม่ได้ทำการสั่งซื้อสินค้าใดๆ</div>
          <Link href="/" className="btn btn-primary" style={{ marginTop: '16px' }}>เริ่มช้อปปิ้งเลย</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {orders.map((order: any) => (
            <div key={order.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontWeight: 700 }}>Order #{order.id}</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {new Date(order.createdAt).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div>{getStatusBadge(order.status)}</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {order.items.map((item: any, idx: number) => {
                  const p = item.product;
                  return (
                    <div key={idx} style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                      <Link href={`/product/${p.id}`} style={{ width: '60px', height: '60px', position: 'relative', borderRadius: '4px', overflow: 'hidden', background: '#f3f4f6', flexShrink: 0 }}>
                        {p.media?.[0]?.url && <Image src={p.media[0].url} alt={p.name} fill style={{ objectFit: 'cover' }} />}
                      </Link>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Link href={`/product/${p.id}`} style={{ fontWeight: 600, color: 'var(--text)', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {p.name}
                        </Link>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>x {item.quantity}</div>
                      </div>
                      <div style={{ fontWeight: 600 }}>
                        ฿{(item.price * item.quantity).toLocaleString()}
                      </div>
                      {order.status === 'DELIVERED' && (
                        <Link href={`/product/${p.id}`} className="btn btn-outline btn-sm" style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}>
                          รีวิวสินค้า
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '16px', gap: '16px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>ยอดชำระเงินสุทธิ:</span>
                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>
                  ฿{order.totalAmount.toLocaleString()}
                </span>
              </div>
              
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function BuyerOrdersPage() {
  return (
    <Suspense fallback={<div className="loading-center"><div className="spinner" /></div>}>
      <OrdersList />
    </Suspense>
  );
}
