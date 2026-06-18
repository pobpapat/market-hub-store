'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { cartApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import Image from 'next/image';
import Link from 'next/link';

export default function CartPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  
  const [cart, setCart] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'BUYER') {
      router.push('/login');
      return;
    }
    fetchCart();
  }, [isAuthenticated, user, router]);

  const fetchCart = async () => {
    try {
      const res = await cartApi.get();
      setCart(res.data);
    } catch {
      // Error handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: number, newQty: number) => {
    if (newQty < 1) return;
    try {
      await cartApi.update(itemId, newQty);
      fetchCart();
    } catch (err: any) {
      alert(err.response?.data?.error || 'เกิดข้อผิดพลาด');
    }
  };

  const removeItem = async (itemId: number) => {
    if (!confirm('ยืนยันการลบสินค้านี้ออกจากตะกร้า?')) return;
    try {
      await cartApi.remove(itemId);
      fetchCart();
    } catch (err: any) {
      alert(err.response?.data?.error || 'เกิดข้อผิดพลาด');
    }
  };

  const handleCheckout = () => {
    sessionStorage.removeItem('direct_checkout'); // Clear direct checkout flag
    router.push('/checkout');
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  const items = cart?.items || [];
  const totalAmount = items.reduce((sum: number, item: any) => sum + (item.product.price * item.quantity), 0);

  return (
    <div className="page-container">
      <h1 className="section-title" style={{ marginBottom: '24px' }}>🛒 ตะกร้าสินค้า</h1>

      {items.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-icon">🛒</div>
          <div className="empty-title">ตะกร้าของคุณว่างเปล่า</div>
          <div className="empty-desc">ไปหาของมาเติมตะกร้ากันเถอะ</div>
          <Link href="/" className="btn btn-primary" style={{ marginTop: '16px' }}>กลับไปช้อปปิ้ง</Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '32px' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {items.map((item: any) => {
              const p = item.product;
              const img = p.media?.[0]?.url;
              return (
                <div key={item.id} className="card" style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                  <Link href={`/product/${p.id}`} style={{ width: '100px', height: '100px', position: 'relative', borderRadius: '8px', overflow: 'hidden', background: '#f3f4f6', flexShrink: 0 }}>
                    {img ? (
                      <Image src={img} alt={p.name} fill style={{ objectFit: 'cover' }} />
                    ) : (
                      <div className="product-placeholder" style={{ fontSize: '1.5rem' }}>🛍️</div>
                    )}
                  </Link>

                  <div style={{ flex: 1 }}>
                    <Link href={`/product/${p.id}`} style={{ fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: '4px' }}>
                      {p.name}
                    </Link>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>🏪 {p.seller?.shopName || p.seller?.name}</div>
                    <div style={{ color: 'var(--primary)', fontWeight: 800, marginTop: '8px' }}>
                      ฿{p.price.toLocaleString()}
                    </div>
                  </div>

                  <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden' }}>
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)} style={{ padding: '4px 12px', background: '#f9fafb' }}>-</button>
                    <input 
                      type="number" 
                      value={item.quantity} 
                      onChange={e => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                      style={{ width: '50px', textAlign: 'center', border: 'none', borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)' }}
                    />
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)} style={{ padding: '4px 12px', background: '#f9fafb' }}>+</button>
                  </div>

                  <button onClick={() => removeItem(item.id)} style={{ color: 'var(--danger)', padding: '8px', marginLeft: '12px' }}>
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>

          <div>
            <div className="card" style={{ position: 'sticky', top: '100px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '16px' }}>สรุปคำสั่งซื้อ</h3>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', color: 'var(--text-muted)' }}>
                <span>ยอดรวมสินค้า ({items.length} ชิ้น)</span>
                <span>฿{totalAmount.toLocaleString()}</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', color: 'var(--text-muted)' }}>
                <span>ค่าจัดส่ง</span>
                <span style={{ color: 'var(--success)' }}>ฟรี</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '16px', marginBottom: '24px', fontWeight: 800, fontSize: '1.2rem' }}>
                <span>ยอดสุทธิ</span>
                <span style={{ color: 'var(--primary)' }}>฿{totalAmount.toLocaleString()}</span>
              </div>

              <button className="btn btn-orange btn-full btn-lg" onClick={handleCheckout}>
                ดำเนินการชำระเงิน
              </button>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
