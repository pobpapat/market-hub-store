'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { adminApi } from '@/lib/api';
import Link from 'next/link';

export default function AdminUsersPage() {
  const router = useRouter();
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated || user?.role !== 'ADMIN') {
      router.push('/login');
      return;
    }

    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user, authLoading, router, page, roleFilter]); // Remove search from deps to prevent typing lag, fetch on enter

  async function fetchUsers() {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 20 };
      if (search) params.search = search;
      if (roleFilter) params.role = roleFilter;
      
      const res = await adminApi.users(params);
      setUsers(res.data.users || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      await adminApi.updateUserRole(userId, newRole);
      fetchUsers();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      alert(err.response?.data?.error || 'เกิดข้อผิดพลาดในการเปลี่ยน Role');
    }
  };

  if (authLoading) return <div className="loading-center"><div className="spinner" /></div>;

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/admin" style={{ color: 'var(--text-muted)' }}>← กลับ</Link>
          <h1 className="section-title"> จัดการผู้ใช้</h1>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '24px', padding: '16px' }}>
        <div className="filter-bar" style={{ margin: 0 }}>
          <input
            type="text"
            className="filter-input"
            placeholder="ค้นหาชื่อ หรืออีเมล..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && { setPage: 1, fetchUsers: fetchUsers() }}
          />
          <select 
            className="form-select" 
            value={roleFilter} 
            onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
          >
            <option value="">ทุกสิทธิ์</option>
            <option value="BUYER">BUYER</option>
            <option value="SELLER">SELLER</option>
            <option value="ADMIN">ADMIN</option>
          </select>
          <button className="btn btn-gray" onClick={() => { setPage(1); fetchUsers(); }}>ค้นหา</button>
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
                  <th>ID</th>
                  <th>อีเมล</th>
                  <th>ชื่อ</th>
                  <th>ชื่อร้าน (ถ้ามี)</th>
                  <th>สิทธิ์ (Role)</th>
                  <th>วันที่สมัคร</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '32px' }}>ไม่พบผู้ใช้งาน</td></tr>
                ) : (
                  users.map(u => (
                    <tr key={u.id}>
                      <td style={{ color: 'var(--text-muted)' }}>#{u.id}</td>
                      <td style={{ fontWeight: 600 }}>{u.email}</td>
                      <td>{u.name || '-'}</td>
                      <td>{u.shopName || '-'}</td>
                      <td>
                        <select 
                          className="form-select" 
                          value={u.role}
                          onChange={e => handleRoleChange(u.id, e.target.value)}
                          style={{ padding: '6px 10px', fontSize: '0.85rem' }}
                          disabled={u.id === user?.id} // Prevent changing own role easily
                        >
                          <option value="BUYER">BUYER</option>
                          <option value="SELLER">SELLER</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {new Date(u.createdAt).toLocaleDateString('th-TH')}
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
