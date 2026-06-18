'use client';

import { useEffect, useState, useCallback } from 'react';
import { productsApi } from '@/lib/api';
import ProductCard from '@/components/ProductCard';
import Link from 'next/link';

const CATEGORIES = [
  { id: 0, name: 'ทั้งหมด', icon: '🏪' },
  { id: 1, name: 'แฟชั่น', icon: '👗' },
  { id: 2, name: 'อิเล็กทรอนิกส์', icon: '📱' },
  { id: 3, name: 'บ้านและสวน', icon: '🏠' },
  { id: 4, name: 'สุขภาพ', icon: '💊' },
  { id: 5, name: 'กีฬา', icon: '⚽' },
  { id: 6, name: 'ของเล่น', icon: '🧸' },
  { id: 7, name: 'อาหาร', icon: '🍜' },
  { id: 8, name: 'หนังสือ', icon: '📚' },
];

const SORT_OPTIONS = [
  { value: 'createdAt', label: 'ใหม่ล่าสุด' },
  { value: 'sold', label: 'ขายดี' },
  { value: 'rating', label: 'คะแนนสูงสุด' },
  { value: 'price_asc', label: 'ราคาต่ำ-สูง' },
  { value: 'price_desc', label: 'ราคาสูง-ต่ำ' },
];

export default function HomePage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState(0);
  const [sort, setSort] = useState('createdAt');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 20, sort };
      if (selectedCat > 0) params.categoryId = selectedCat;
      if (search) params.search = search;
      const res = await productsApi.list(params);
      setProducts(res.data.products || []);
      setTotalPages(res.data.totalPages || 1);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [page, sort, selectedCat, search]);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('search');
    if (q) setSearch(q);
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  return (
    <>
      {/* Hero */}
      <section className="hero">
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 className="hero-title">🛍️ MarketHub<br />ตลาดซื้อขายออนไลน์</h1>
          <p className="hero-subtitle">สินค้าคุณภาพ ราคาถูก ส่งไว ทั่วประเทศ</p>
          <div className="hero-actions">
            <Link href="#products" className="hero-btn-primary">เลือกซื้อสินค้า</Link>
            <Link href="/register?role=SELLER" className="hero-btn-secondary">เปิดร้านขายฟรี</Link>
          </div>
        </div>
      </section>

      <div className="page-container">
        {/* Categories */}
        <section className="section">
          <div className="section-header">
            <h2 className="section-title">หมวดหมู่สินค้า</h2>
          </div>
          <div className="categories-grid">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                className={`category-card ${selectedCat === cat.id ? 'active' : ''}`}
                onClick={() => { setSelectedCat(cat.id); setPage(1); }}
              >
                <span className="category-icon">{cat.icon}</span>
                <span className="category-name">{cat.name}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Flash Sale */}
        <div className="flash-banner">
          <span style={{ fontSize: '1.4rem' }}>⚡</span>
          <span className="flash-title">Flash Sale วันนี้เท่านั้น!</span>
          <span className="flash-timer">ลดสูงสุด 70%</span>
        </div>

        {/* Products */}
        <section className="section" id="products">
          <div className="section-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
            <h2 className="section-title">สินค้าทั้งหมด</h2>
            <div className="filter-bar" style={{ margin: 0 }}>
              <input
                className="filter-input"
                style={{ minWidth: '180px', flex: 'none' }}
                placeholder="ค้นหาสินค้า..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                onKeyDown={e => e.key === 'Enter' && fetchProducts()}
              />
              <select
                className="form-select"
                value={sort}
                onChange={e => { setSort(e.target.value); setPage(1); }}
              >
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="loading-center"><div className="spinner" /></div>
          ) : products.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <div className="empty-title">ไม่พบสินค้า</div>
              <div className="empty-desc">ลองค้นหาด้วยคำอื่น หรือเปลี่ยนหมวดหมู่</div>
            </div>
          ) : (
            <>
              <div className="products-grid">
                {products.map(p => <ProductCard key={p.id} product={p} />)}
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
            </>
          )}
        </section>
      </div>
    </>
  );
}