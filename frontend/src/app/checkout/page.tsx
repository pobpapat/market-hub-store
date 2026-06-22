'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { cartApi, ordersApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import Image from 'next/image';
import Link from 'next/link';

export default function CheckoutPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isDirectCheckout, setIsDirectCheckout] = useState(false);

  // Form State
  const [address, setAddress] = useState(user?.address || '');
  const [note, setNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('mock_payment');

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'BUYER') {
      router.push('/login');
      return;
    }

    const checkCheckoutData = async () => {
      try {
        const directData = sessionStorage.getItem('direct_checkout');
        if (directData) {
          const parsed = JSON.parse(directData);
          setItems(parsed.items);
          setIsDirectCheckout(true);
        } else {
          const res = await cartApi.get();
          if (!res.data.items || res.data.items.length === 0) {
            router.push('/cart');
            return;
          }
          setItems(res.data.items);
        }
      } catch {
        router.push('/cart');
      } finally {
        setLoading(false);
      }
    };

    checkCheckoutData();
  }, [isAuthenticated, user, router]);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) return alert('กรุณาระบุที่อยู่สำหรับจัดส่ง');

    setSubmitting(true);
    try {
      const payload: any = { address, paymentMethod, note };
      
      // If direct checkout, pass specific items array
      if (isDirectCheckout) {
        payload.items = items.map(i => ({ productId: i.productId, quantity: i.quantity }));
      }
      
      await ordersApi.checkout(payload);
      
      // Clear session storage flag
      sessionStorage.removeItem('direct_checkout');
      
      router.push('/orders?success=1');
    } catch (err: any) {
      alert(err.response?.data?.error || 'เกิดข้อผิดพลาดในการสั่งซื้อ');
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;

  const totalAmount = items.reduce((sum: number, item: any) => sum + (item.product.price * item.quantity), 0);

  return (
    <div className="page-container">
      <h1 className="section-title" style={{ marginBottom: '24px' }}> ชำระเงิน</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '32px' }}>
        
        {/* Checkout Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <form id="checkout-form" onSubmit={handlePlaceOrder} className="card card-lg" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '12px' }}> ที่อยู่สำหรับจัดส่ง</h3>
              <textarea 
                required
                className="form-input"
                rows={3}
                placeholder="บ้านเลขที่, ถนน, ตำบล, อำเภอ, จังหวัด, รหัสไปรษณีย์"
                value={address}
                onChange={e => setAddress(e.target.value)}
                style={{ width: '100%', resize: 'vertical' }}
              />
            </div>

            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '12px' }}>หมายเหตุถึงผู้ขาย (ไม่บังคับ)</h3>
              <input 
                type="text"
                className="form-input"
                placeholder="เช่น ฝากไว้ที่ป้อมยาม, สีสำรอง"
                value={note}
                onChange={e => setNote(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '12px' }}> วิธีการชำระเงิน</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', background: paymentMethod === 'mock_payment' ? 'var(--primary-light)' : 'white', borderColor: paymentMethod === 'mock_payment' ? 'var(--primary)' : 'var(--border)' }}>
                  <input 
                    type="radio" 
                    name="payment" 
                    value="mock_payment" 
                    checked={paymentMethod === 'mock_payment'}
                    onChange={e => setPaymentMethod(e.target.value)}
                  />
                  <div>
                    <div style={{ fontWeight: 600 }}>ชำระเงินจำลอง (Mock Payment)</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>ทดสอบระบบโดยไม่ต้องตัดเงินจริง</div>
                  </div>
                </label>
                
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', background: paymentMethod === 'cod' ? 'var(--primary-light)' : 'white', borderColor: paymentMethod === 'cod' ? 'var(--primary)' : 'var(--border)' }}>
                  <input 
                    type="radio" 
                    name="payment" 
                    value="cod" 
                    checked={paymentMethod === 'cod'}
                    onChange={e => setPaymentMethod(e.target.value)}
                  />
                  <div>
                    <div style={{ fontWeight: 600 }}>เก็บเงินปลายทาง (Cash on Delivery)</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>ชำระเงินเมื่อได้รับสินค้า</div>
                  </div>
                </label>
              </div>
            </div>

          </form>
        </div>

        {/* Order Summary */}
        <div>
          <div className="card" style={{ position: 'sticky', top: '100px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, borderBottom: '1px solid var(--border)', paddingBottom: '16px', marginBottom: '16px' }}>สรุปคำสั่งซื้อ</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px', maxHeight: '300px', overflowY: 'auto' }}>
              {items.map((item: any, idx: number) => {
                const p = item.product;
                return (
                  <div key={idx} style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ width: '50px', height: '50px', position: 'relative', borderRadius: '4px', overflow: 'hidden', background: '#f3f4f6', flexShrink: 0 }}>
                      {p.media?.[0]?.url && <Image src={p.media[0].url} alt={p.name} fill style={{ objectFit: 'cover' }} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>฿{p.price.toLocaleString()} x {item.quantity}</div>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                      ฿{(p.price * item.quantity).toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', color: 'var(--text-muted)' }}>
              <span>ยอดรวมสินค้า</span>
              <span>฿{totalAmount.toLocaleString()}</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', color: 'var(--text-muted)' }}>
              <span>ค่าจัดส่ง</span>
              <span style={{ color: 'var(--success)' }}>ฟรี</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '16px', marginBottom: '24px', fontWeight: 800, fontSize: '1.2rem' }}>
              <span>ยอดที่ต้องชำระ</span>
              <span style={{ color: 'var(--primary)' }}>฿{totalAmount.toLocaleString()}</span>
            </div>

            <button 
              type="submit" 
              form="checkout-form"
              disabled={submitting}
              className="btn btn-orange btn-full btn-lg"
            >
              {submitting ? 'กำลังดำเนินการ...' : 'ยืนยันการสั่งซื้อ'}
            </button>
            <Link href="/cart" style={{ display: 'block', textAlign: 'center', marginTop: '16px', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              กลับไปแก้ไขตะกร้า
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
