'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { cartApi } from '@/lib/api';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const [cartCount, setCartCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isAuthenticated && user?.role === 'BUYER') {
      cartApi.get().then(res => {
        setCartCount(res.data?.items?.length || 0);
      }).catch(() => {});
    }
  }, [isAuthenticated, user]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/?search=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Logo */}
        <Link href="/" className="navbar-logo">
          <span className="logo-icon">🛍️</span>
          <span className="logo-text">MarketHub</span>
        </Link>

        {/* Search */}
        <form onSubmit={handleSearch} className="navbar-search">
          <input
            type="text"
            placeholder="ค้นหาสินค้า..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="search-btn">
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </form>

        {/* Right side */}
        <div className="navbar-right">
          {isAuthenticated ? (
            <>
              {/* Cart (buyer only) */}
              {user?.role === 'BUYER' && (
                <Link href="/cart" className="cart-btn">
                  <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                </Link>
              )}

              {/* User Menu */}
              <div className="user-menu" onClick={() => setMenuOpen(!menuOpen)}>
                <div className="user-avatar">
                  {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <span className="user-name">{user?.name || user?.email?.split('@')[0]}</span>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>

                {menuOpen && (
                  <div className="dropdown-menu">
                    {user?.role === 'BUYER' && (
                      <>
                        <Link href="/orders" className="dropdown-item">📦 คำสั่งซื้อของฉัน</Link>
                        <Link href="/cart" className="dropdown-item">🛒 ตะกร้าสินค้า</Link>
                      </>
                    )}
                    {user?.role === 'SELLER' && (
                      <>
                        <Link href="/seller/dashboard" className="dropdown-item">📊 Dashboard</Link>
                        <Link href="/seller/products" className="dropdown-item">📦 จัดการสินค้า</Link>
                        <Link href="/seller/orders" className="dropdown-item">🛍️ คำสั่งซื้อ</Link>
                      </>
                    )}
                    {user?.role === 'ADMIN' && (
                      <Link href="/admin" className="dropdown-item">⚙️ Admin Panel</Link>
                    )}
                    <hr className="dropdown-divider" />
                    <button onClick={handleLogout} className="dropdown-item dropdown-logout">
                      🚪 ออกจากระบบ
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="auth-buttons">
              <Link href="/login" className="btn-outline">เข้าสู่ระบบ</Link>
              <Link href="/register" className="btn-primary">สมัครสมาชิก</Link>
            </div>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button className="mobile-menu-btn" onClick={() => setMenuOpen(!menuOpen)}>
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
    </nav>
  );
}
