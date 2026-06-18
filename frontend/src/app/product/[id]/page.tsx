'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { productsApi, cartApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import Image from 'next/image';

export default function ProductDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState<string>('');

  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (id) {
      productsApi.get(Number(id))
        .then(res => {
          setProduct(res.data);
          const main = res.data.media?.find((m: any) => m.isMain)?.url || res.data.media?.[0]?.url;
          setActiveImg(main || '');
        })
        .catch(() => router.push('/'))
        .finally(() => setLoading(false));
    }
  }, [id, router]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) return router.push('/login');
    if (user?.role !== 'BUYER') return alert('คุณต้องเป็นผู้ซื้อ (Buyer) เพื่อเพิ่มสินค้าลงตะกร้า');

    setAddingToCart(true);
    try {
      await cartApi.add(product.id, qty);
      alert('เพิ่มลงตะกร้าสำเร็จ!');
    } catch (err: any) {
      alert(err.response?.data?.error || 'เกิดข้อผิดพลาด');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleCheckoutDirectly = () => {
    if (!isAuthenticated) return router.push('/login');
    if (user?.role !== 'BUYER') return alert('คุณต้องเป็นผู้ซื้อ (Buyer) เพื่อสั่งซื้อสินค้า');
    
    // Pass direct checkout data via sessionStorage to checkout page
    sessionStorage.setItem('direct_checkout', JSON.stringify({
      items: [{ productId: product.id, quantity: qty, product: product }]
    }));
    router.push('/checkout');
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) return router.push('/login');
    setSubmittingReview(true);
    try {
      await productsApi.addReview(product.id, { rating: reviewRating, comment: reviewComment });
      const res = await productsApi.get(Number(id)); // refresh
      setProduct(res.data);
      setReviewComment('');
    } catch (err: any) {
      alert(err.response?.data?.error || 'เกิดข้อผิดพลาด');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;
  if (!product) return null;

  return (
    <div className="page-container">
      <div className="card card-lg" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginBottom: '32px' }}>
        
        {/* Gallery */}
        <div>
          <div className="product-image-wrap" style={{ borderRadius: '16px', marginBottom: '16px', background: '#f8f9fa' }}>
            {activeImg ? (
              <Image src={activeImg} alt={product.name} fill className="product-img" style={{ objectFit: 'contain' }} />
            ) : (
              <div className="product-placeholder">🛍️</div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px' }}>
            {product.media?.map((m: any) => (
              <button 
                key={m.id} 
                onClick={() => setActiveImg(m.url)}
                style={{ 
                  width: '80px', height: '80px', position: 'relative', borderRadius: '8px', overflow: 'hidden', flexShrink: 0,
                  border: activeImg === m.url ? '2px solid var(--primary)' : '2px solid transparent'
                }}
              >
                {m.type === 'image' ? (
                  <Image src={m.url} alt="" fill style={{ objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: '#111', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>▶️</div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, lineHeight: 1.3 }}>{product.name}</h1>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ color: '#f59e0b', fontWeight: 700, fontSize: '1.2rem' }}>★ {product.rating.toFixed(1)}</span>
            <span style={{ color: 'var(--text-muted)' }}>|</span>
            <span style={{ color: 'var(--text-muted)' }}>ขายแล้ว {product.sold} ชิ้น</span>
          </div>

          <div style={{ background: 'var(--primary-light)', padding: '20px', borderRadius: '12px', marginTop: '8px' }}>
            <span style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--primary)' }}>
              ฿{product.price.toLocaleString()}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '24px', alignItems: 'center', margin: '16px 0' }}>
            <span style={{ color: 'var(--text-muted)', width: '80px' }}>จำนวน</span>
            <div style={{ display: 'flex', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
              <button onClick={() => setQty(Math.max(1, qty - 1))} style={{ padding: '8px 16px', background: '#f9fafb', fontSize: '1.1rem' }}>-</button>
              <input 
                type="number" 
                value={qty} 
                onChange={e => setQty(Math.max(1, Math.min(product.stock, parseInt(e.target.value) || 1)))}
                style={{ width: '60px', textAlign: 'center', border: 'none', borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)' }}
              />
              <button onClick={() => setQty(Math.min(product.stock, qty + 1))} style={{ padding: '8px 16px', background: '#f9fafb', fontSize: '1.1rem' }}>+</button>
            </div>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>มีสินค้าทั้งหมด {product.stock} ชิ้น</span>
          </div>

          <div style={{ display: 'flex', gap: '16px', marginTop: 'auto' }}>
            <button 
              className="btn btn-border btn-lg" 
              style={{ flex: 1 }} 
              onClick={handleAddToCart}
              disabled={addingToCart || product.stock === 0}
            >
              {addingToCart ? 'กำลังเพิ่ม...' : '🛒 เพิ่มลงตะกร้า'}
            </button>
            <button 
              className="btn btn-orange btn-lg" 
              style={{ flex: 1 }}
              onClick={handleCheckoutDirectly}
              disabled={product.stock === 0}
            >
              ซื้อสินค้า
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
        {/* Description & Reviews */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <div className="card">
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>รายละเอียดสินค้า</h3>
            <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text-muted)' }}>
              {product.description || 'ไม่มีรายละเอียด'}
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>รีวิวจากผู้ซื้อ</h3>
            
            {isAuthenticated && user?.role === 'BUYER' && (
              <form onSubmit={submitReview} style={{ marginBottom: '24px', background: '#f9fafb', padding: '16px', borderRadius: '8px' }}>
                <div style={{ marginBottom: '12px' }}>
                  <label className="form-label" style={{ display: 'block', marginBottom: '8px' }}>ให้คะแนนสินค้า</label>
                  <div className="stars-input">
                    {[1, 2, 3, 4, 5].map(star => (
                      <span 
                        key={star} 
                        className={`star-btn ${star <= reviewRating ? 'active' : ''}`}
                        onClick={() => setReviewRating(star)}
                      >★</span>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <textarea 
                    className="form-input" 
                    placeholder="แชร์ประสบการณ์ใช้งานสินค้าชิ้นนี้..." 
                    rows={3}
                    value={reviewComment}
                    onChange={e => setReviewComment(e.target.value)}
                  />
                </div>
                <button type="submit" disabled={submittingReview} className="btn btn-primary">
                  {submittingReview ? 'กำลังส่ง...' : 'ส่งรีวิว'}
                </button>
              </form>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {product.reviews?.length > 0 ? (
                product.reviews.map((rev: any) => (
                  <div key={rev.id} style={{ paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <div className="user-avatar" style={{ background: 'var(--primary)', width: 28, height: 28 }}>
                        {rev.user.name?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{rev.user.name}</div>
                        <div style={{ color: '#f59e0b', fontSize: '0.8rem' }}>{'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}</div>
                      </div>
                      <div style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {new Date(rev.createdAt).toLocaleDateString('th-TH')}
                      </div>
                    </div>
                    {rev.comment && <p style={{ fontSize: '0.9rem', color: 'var(--text)' }}>{rev.comment}</p>}
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px 0' }}>ยังไม่มีรีวิวสำหรับสินค้านี้</div>
              )}
            </div>
          </div>
        </div>

        {/* Seller Info */}
        <div>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', textAlign: 'center' }}>
            <div className="user-avatar" style={{ width: '80px', height: '80px', fontSize: '2rem', background: '#f3f4f6', color: 'var(--text-muted)' }}>
              🏪
            </div>
            <div>
              <h3 style={{ fontWeight: 700, fontSize: '1.2rem' }}>{product.seller?.shopName || product.seller?.name || 'ร้านค้า'}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                {product.seller?.shopDesc || 'ไม่มีคำอธิบายร้านค้า'}
              </p>
            </div>
            <button className="btn btn-outline" style={{ color: 'var(--text)', borderColor: 'var(--border)' }}>
              ดูร้านค้า
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
