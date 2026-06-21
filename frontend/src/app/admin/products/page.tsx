'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { adminApi } from '@/lib/api';
import Link from 'next/link';
import Image from 'next/image';

export default function AdminProductsPage() {
  const router = useRouter();
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || user?.role !== 'ADMIN') {
      router.push('/login');
      return;
    }

    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user, authLoading, router, page]);

  async function fetchProducts() {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 20 };
      if (search) params.search = search;
      
      const res = await adminApi.products(params);
      setProducts(res.data.products || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id: number) => {
    try {
      await adminApi.toggleProduct(id);
      fetchProducts();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      alert(err.response?.data?.error || 'เกิดข้อผิดพลาดในการระงับสินค้า');
    }
  };

  if (authLoading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/admin" style={{ color: 'var(--text-muted)' }}>← กลับ</Link>
          <h1 className="section-title">📦 ตรวจสอบสินค้า</h1>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '24px', padding: '16px' }}>
        <div className="filter-bar" style={{ margin: 0 }}>
          <input
            type="text"
            className="filter-input"
            placeholder="ค้นหาชื่อสินค้า..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && { setPage: 1, fetchProducts: fetchProducts() }}
          />
          <button className="btn btn-gray" onClick={() => { setPage(1); fetchProducts(); }}>ค้นหา</button>
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
                  <th style={{ width: '60px' }}>รูปภาพ</th>
                  <th>ชื่อสินค้า</th>
                  <th>ร้านค้า</th>
                  <th>ราคา</th>
                  <th>สถานะ</th>
                  <th style={{ textAlign: 'center' }}>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '32px' }}>ไม่พบสินค้า</td></tr>
                ) : (
                  products.map(p => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const img = p.media?.find((m: any) => m.isMain)?.url || p.media?.[0]?.url;
                    return (
                      <tr key={p.id} style={{ opacity: p.isActive ? 1 : 0.6 }}>
                        <td>
                          <div style={{ width: '40px', height: '40px', position: 'relative', borderRadius: '4px', overflow: 'hidden', background: '#f3f4f6' }}>
                            {img && <Image src={img} alt={p.name} fill style={{ objectFit: 'cover' }} />}
                          </div>
                        </td>
                        <td style={{ fontWeight: 600 }}>
                          <Link href={`/product/${p.id}`} target="_blank" style={{ color: 'var(--text)', textDecoration: 'underline' }}>
                            {p.name}
                          </Link>
                        </td>
                        <td style={{ fontSize: '0.85rem' }}>{p.seller?.shopName || p.seller?.name}</td>
                        <td style={{ color: 'var(--primary)', fontWeight: 600 }}>฿{p.price.toLocaleString()}</td>
                        <td>
                          <span className={`status-badge ${p.isActive ? 'status-DELIVERED' : 'status-CANCELLED'}`}>
                            {p.isActive ? 'ปกติ' : 'ถูกระงับ'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button 
                            onClick={() => handleToggleActive(p.id)} 
                            className={`btn btn-sm ${p.isActive ? 'btn-red' : 'btn-green'}`}
                          >
                            {p.isActive ? 'ระงับ' : 'ปลดระงับ'}
                          </button>
                        </td>
                      </tr>
                    );
                  })
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
