'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { ordersApi } from '@/lib/api';
import Image from 'next/image';

export default function SellerOrdersPage() {
  const router = useRouter();
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchOrders() {
    try {
      const res = await ordersApi.sellerOrders();
      setOrders(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || user?.role !== 'SELLER') {
      router.push('/login');
      return;
    }
    fetchOrders();
  }, [isAuthenticated, user, authLoading, router]);

  const handleStatusUpdate = async (orderId: number, status: string) => {
    try {
      await ordersApi.updateStatus(orderId, status);
      fetchOrders();
    } catch (err: any) {
      alert(err.response?.data?.error || 'เกิดข้อผิดพลาดในการอัปเดตสถานะ');
    }
  };

  if (loading || authLoading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div className="page-container">
      <h1 className="section-title" style={{ marginBottom: '24px' }}>️ จัดการคำสั่งซื้อ</h1>

      {orders.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-icon"></div>
          <div className="empty-title">ยังไม่มีคำสั่งซื้อใหม่</div>
          <div className="empty-desc">โปรโมทสินค้าของคุณเพิ่มเพื่อเพิ่มยอดขาย!</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {orders.map(order => {
            // Filter only items that belong to this seller
            const sellerItems = order.items.filter((i: any) => i.product.sellerId === user?.id);
            if (sellerItems.length === 0) return null;
            
            const sellerTotal = sellerItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);

            return (
              <div key={order.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '4px' }}>Order #{order.id}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      สั่งเมื่อ: {new Date(order.createdAt).toLocaleString('th-TH')}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>อัปเดตสถานะ:</span>
                    <select 
                      className="form-select" 
                      value={order.status}
                      onChange={e => handleStatusUpdate(order.id, e.target.value)}
                      style={{ fontWeight: 600 }}
                    >
                      <option value="PENDING">รอการยืนยัน</option>
                      <option value="CONFIRMED">กำลังเตรียมจัดส่ง</option>
                      <option value="SHIPPING">กำลังจัดส่ง</option>
                      <option value="DELIVERED">จัดส่งสำเร็จ</option>
                      <option value="CANCELLED">ยกเลิกคำสั่งซื้อ</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                  
                  <div>
                    <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '12px', fontWeight: 600, textTransform: 'uppercase' }}>ข้อมูลลูกค้า</h4>
                    <div style={{ background: '#f9fafb', padding: '12px', borderRadius: '8px', fontSize: '0.9rem' }}>
                      <div style={{ fontWeight: 600, marginBottom: '4px' }}>{order.buyer?.name || order.buyer?.email}</div>
                      <div style={{ color: 'var(--text-muted)', marginBottom: '8px' }}>{order.buyer?.email}</div>
                      <div style={{ fontWeight: 600, marginTop: '8px' }}>ที่อยู่จัดส่ง:</div>
                      <div>{order.address}</div>
                      {order.note && (
                        <div style={{ marginTop: '8px', color: 'var(--warning)', fontWeight: 500 }}>
                          หมายเหตุ: {order.note}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '12px', fontWeight: 600, textTransform: 'uppercase' }}>รายการสินค้า</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {sellerItems.map((item: any, idx: number) => {
                        const p = item.product;
                        return (
                          <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <div style={{ width: '40px', height: '40px', position: 'relative', borderRadius: '4px', overflow: 'hidden', background: '#f3f4f6', flexShrink: 0 }}>
                              {p.media?.[0]?.url && <Image src={p.media[0].url} alt={p.name} fill style={{ objectFit: 'cover' }} />}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>x {item.quantity}</div>
                            </div>
                            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                              ฿{(item.price * item.quantity).toLocaleString()}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', marginTop: '16px', paddingTop: '12px', fontWeight: 800 }}>
                      <span>ยอดสุทธิที่ได้รับ:</span>
                      <span style={{ color: 'var(--primary)', fontSize: '1.1rem' }}>฿{sellerTotal.toLocaleString()}</span>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      การชำระเงิน: {order.paymentMethod === 'mock_payment' ? 'Mock Payment' : 'Cash on Delivery'}
                    </div>
                  </div>
                  
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
