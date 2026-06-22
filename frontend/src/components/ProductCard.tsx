'use client';

import Link from 'next/link';
import Image from 'next/image';

interface Product {
  id: number;
  name: string;
  price: number;
  rating: number;
  sold: number;
  stock: number;
  media?: { url: string; isMain: boolean }[];
  seller?: { shopName?: string; name?: string };
  category?: { name: string };
}

export default function ProductCard({ product }: { product: Product }) {
  const mainImage = product.media?.find(m => m.isMain)?.url || product.media?.[0]?.url;
  const shopName = product.seller?.shopName || product.seller?.name || 'Shop';

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', minimumFractionDigits: 0 }).format(price);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <span key={i} style={{ color: i < Math.round(rating) ? '#f59e0b' : '#d1d5db', fontSize: '12px' }}></span>
    ));
  };

  return (
    <Link href={`/product/${product.id}`} className="product-card">
      <div className="product-image-wrap">
        {mainImage ? (
          <Image
            src={mainImage}
            alt={product.name}
            fill
            className="product-img"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        ) : (
          <div className="product-placeholder">
            <span>️</span>
          </div>
        )}
        {product.stock === 0 && (
          <div className="out-of-stock-badge">หมด</div>
        )}
      </div>
      <div className="product-info">
        <p className="product-name">{product.name}</p>
        <p className="product-price">{formatPrice(product.price)}</p>
        <div className="product-meta">
          <span className="product-stars">{renderStars(product.rating)}</span>
          <span className="product-sold">ขายแล้ว {product.sold.toLocaleString()}</span>
        </div>
        <p className="product-shop"> {shopName}</p>
      </div>
    </Link>
  );
}
