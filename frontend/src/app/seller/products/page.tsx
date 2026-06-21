'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { productsApi } from '@/lib/api';
import Image from 'next/image';

export default function SellerProductsPage() {
  const router = useRouter();
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [existingMedia, setExistingMedia] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || user?.role !== 'SELLER') {
      router.push('/login');
      return;
    }
    fetchData();
  }, [isAuthenticated, user, authLoading, router]);

  async function fetchData() {
    try {
      const [prodRes, catRes] = await Promise.all([
        productsApi.list({ sellerId: user?.id ?? 0, limit: 100 }),
        productsApi.categories()
      ]);
      setProducts(prodRes.data.products || []);
      setCategories(catRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (p?: any) => {
    if (p) {
      setEditingId(p.id);
      setName(p.name);
      setDesc(p.description || '');
      setPrice(p.price.toString());
      setStock(p.stock.toString());
      setCategoryId(p.categoryId?.toString() || '');
      setExistingMedia(p.media || []);
    } else {
      setEditingId(null);
      setName('');
      setDesc('');
      setPrice('');
      setStock('');
      setCategoryId('');
      setExistingMedia([]);
    }
    setFiles([]);
    setShowModal(true);
  };

  const closeModal = () => setShowModal(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', desc);
    formData.append('price', price);
    formData.append('stock', stock);
    if (categoryId) formData.append('categoryId', categoryId);
    
    files.forEach(f => formData.append('media', f));

    try {
      if (editingId) {
        await productsApi.update(editingId, formData);
      } else {
        await productsApi.create(formData);
      }
      await fetchData();
      closeModal();
    } catch (err: any) {
      alert(err.response?.data?.error || 'เกิดข้อผิดพลาด');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('ยืนยันการลบสินค้านี้?')) return;
    try {
      await productsApi.delete(id);
      fetchData();
    } catch (err: any) {
      alert('ลบไม่สำเร็จ');
    }
  };

  if (loading || authLoading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 className="section-title">📦 จัดการสินค้า</h1>
        <button onClick={() => openModal()} className="btn btn-primary">
          + เพิ่มสินค้าใหม่
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: '80px' }}>รูปภาพ</th>
                <th>ชื่อสินค้า</th>
                <th>ราคา</th>
                <th>สต็อก</th>
                <th>ขายแล้ว</th>
                <th style={{ textAlign: 'right' }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    ยังไม่มีสินค้าในร้านของคุณ
                  </td>
                </tr>
              ) : (
                products.map(p => {
                  const img = p.media?.find((m: any) => m.isMain)?.url || p.media?.[0]?.url;
                  return (
                    <tr key={p.id}>
                      <td>
                        <div style={{ width: '48px', height: '48px', position: 'relative', borderRadius: '4px', overflow: 'hidden', background: '#f3f4f6' }}>
                          {img && <Image src={img} alt={p.name} fill style={{ objectFit: 'cover' }} />}
                        </div>
                      </td>
                      <td style={{ fontWeight: 600 }}>{p.name}</td>
                      <td style={{ color: 'var(--primary)', fontWeight: 700 }}>฿{p.price.toLocaleString()}</td>
                      <td>{p.stock}</td>
                      <td>{p.sold}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button onClick={() => openModal(p)} className="btn btn-sm btn-outline" style={{ color: 'var(--secondary)', borderColor: 'var(--secondary)' }}>
                            แก้ไข
                          </button>
                          <button onClick={() => handleDelete(p.id)} className="btn btn-sm btn-outline" style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}>
                            ลบ
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add/Edit */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div className="card" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '24px' }}>
              {editingId ? 'แก้ไขสินค้า' : 'เพิ่มสินค้าใหม่'}
            </h2>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">รูปภาพสินค้า</label>
                <div 
                  className="upload-zone" 
                  onClick={() => fileInputRef.current?.click()}
                  style={{ padding: '24px', marginBottom: '8px' }}
                >
                  <div className="upload-icon">📸</div>
                  <div className="upload-text">คลิกเพื่ออัปโหลดรูปภาพ (สูงสุด 10 รูป)</div>
                  <input 
                    type="file" 
                    multiple 
                    accept="image/*,video/*" 
                    ref={fileInputRef} 
                    style={{ display: 'none' }} 
                    onChange={handleFileChange}
                  />
                </div>
                
                {/* Previews */}
                {(existingMedia.length > 0 || files.length > 0) && (
                  <div className="upload-previews">
                    {existingMedia.map(m => (
                      <div key={m.id} className="upload-preview">
                        <Image src={m.url} alt="" fill style={{ objectFit: 'cover' }} />
                        <div style={{ position: 'absolute', top: 0, left: 0, background: 'rgba(0,0,0,0.5)', color: 'white', fontSize: '10px', padding: '2px 4px' }}>เดิม</div>
                      </div>
                    ))}
                    {files.map((f, i) => (
                      <div key={i} className="upload-preview">
                        <img src={URL.createObjectURL(f)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <div style={{ position: 'absolute', top: 0, left: 0, background: 'var(--success)', color: 'white', fontSize: '10px', padding: '2px 4px' }}>ใหม่</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">ชื่อสินค้า *</label>
                <input required className="form-input" value={name} onChange={e => setName(e.target.value)} />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">หมวดหมู่</label>
                <select className="form-select" value={categoryId} onChange={e => setCategoryId(e.target.value)}>
                  <option value="">-- เลือกหมวดหมู่ --</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">ราคา (บาท) *</label>
                  <input type="number" required min={0} className="form-input" value={price} onChange={e => setPrice(e.target.value)} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">จำนวนสต็อก *</label>
                  <input type="number" required min={0} className="form-input" value={stock} onChange={e => setStock(e.target.value)} />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">รายละเอียดสินค้า</label>
                <textarea className="form-input" rows={4} value={desc} onChange={e => setDesc(e.target.value)} />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '16px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={closeModal} className="btn btn-gray" disabled={submitting}>ยกเลิก</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
