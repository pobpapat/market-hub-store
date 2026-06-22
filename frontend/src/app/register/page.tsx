'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('BUYER');
  const [shopName, setShopName] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register({
        email,
        password,
        name,
        role,
        shopName: role === 'SELLER' ? shopName : undefined,
      });
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'เกิดข้อผิดพลาดในการสมัครสมาชิก');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', background: 'linear-gradient(135deg, #fff7ed 0%, #fce7f3 100%)' }}>
      <form onSubmit={handleSubmit} className="form-card" style={{ maxWidth: '480px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '8px' }}></div>
          <h1 className="form-title">สมัครสมาชิก</h1>
          <p className="form-subtitle">เริ่มต้นการซื้อขายกับ MarketHub</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <div className="form-group">
          <label className="form-label">ประเภทบัญชี</label>
          <div style={{ display: 'flex', gap: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input 
                type="radio" 
                name="role" 
                value="BUYER" 
                checked={role === 'BUYER'} 
                onChange={(e) => setRole(e.target.value)} 
              />
              ผู้ซื้อ
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input 
                type="radio" 
                name="role" 
                value="SELLER" 
                checked={role === 'SELLER'} 
                onChange={(e) => setRole(e.target.value)} 
              />
              ผู้ขาย
            </label>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">ชื่อ-นามสกุล</label>
          <input
            type="text"
            required
            className="form-input"
            placeholder="ชื่อของคุณ"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">อีเมล</label>
          <input
            type="email"
            required
            className="form-input"
            placeholder="name@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">รหัสผ่าน</label>
          <input
            type="password"
            required
            className="form-input"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            minLength={6}
          />
        </div>

        {role === 'SELLER' && (
          <div className="form-group">
            <label className="form-label">ชื่อร้านค้า</label>
            <input
              type="text"
              required={role === 'SELLER'}
              className="form-input"
              placeholder="ชื่อร้านของคุณ"
              value={shopName}
              onChange={e => setShopName(e.target.value)}
            />
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn btn-orange btn-full btn-lg"
          style={{ marginTop: '16px' }}
        >
          {loading ? 'กำลังดำเนินการ...' : 'สมัครสมาชิก'}
        </button>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          มีบัญชีอยู่แล้ว?{' '}
          <Link href="/login" className="form-link">เข้าสู่ระบบ</Link>
        </p>
      </form>
    </div>
  );
}
