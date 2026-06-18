import { Router, Response } from 'express';
import prisma from '../prisma';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const router = Router();
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

const uploadToCloudinary = (buffer: Buffer, folder: string, resourceType: 'image' | 'video' | 'raw' | 'auto' = 'image') => {
  return new Promise<{ url: string; public_id: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `marketplace/${folder}`, resource_type: resourceType },
      (error, result) => {
        if (error || !result) return reject(error);
        resolve({ url: result.secure_url, public_id: result.public_id });
      }
    );
    stream.end(buffer);
  });
};

// GET /api/products — public, with filter/search/pagination
router.get('/', async (req, res: Response) => {
  const { search, categoryId, minPrice, maxPrice, sellerId, page = '1', limit = '20', sort = 'createdAt' } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  const where: any = { isActive: true };
  if (search) where.name = { contains: search as string, mode: 'insensitive' };
  if (categoryId) where.categoryId = parseInt(categoryId as string);
  if (sellerId) where.sellerId = parseInt(sellerId as string);
  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) where.price.gte = parseFloat(minPrice as string);
    if (maxPrice) where.price.lte = parseFloat(maxPrice as string);
  }

  let orderBy: any = { createdAt: 'desc' };
  if (sort === 'price_asc') orderBy = { price: 'asc' };
  else if (sort === 'price_desc') orderBy = { price: 'desc' };
  else if (sort === 'rating') orderBy = { rating: 'desc' };
  else if (sort === 'sold') orderBy = { sold: 'desc' };

  try {
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limitNum,
        orderBy,
        include: {
          media: { where: { isMain: true }, take: 1 },
          seller: { select: { id: true, name: true, shopName: true } },
          category: true,
        },
      }),
      prisma.product.count({ where }),
    ]);

    return res.json({ products, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// GET /api/products/:id — single product with reviews
router.get('/:id', async (req, res: Response) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(req.params.id as string) },
      include: {
        media: true,
        seller: { select: { id: true, name: true, shopName: true, shopDesc: true, avatar: true } },
        category: true,
        reviews: {
          include: { user: { select: { id: true, name: true, avatar: true } } },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!product) return res.status(404).json({ error: 'Product not found' });
    return res.json(product);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// POST /api/products — seller creates product (with optional image upload)
router.post('/', authenticate, requireRole('SELLER', 'ADMIN'), upload.array('media', 10), async (req: AuthRequest, res: Response) => {
  const { name, description, price, stock, categoryId } = req.body;
  if (!name || !price) return res.status(400).json({ error: 'Name and price are required' });

  try {
    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        stock: parseInt(stock) || 0,
        sellerId: req.user!.id,
        categoryId: categoryId ? parseInt(categoryId) : undefined,
      },
    });

    // Upload media files
    if (req.files && Array.isArray(req.files)) {
      const mediaUploads = await Promise.all(
        (req.files as Express.Multer.File[]).map(async (file, index) => {
          const isVideo = file.mimetype.startsWith('video/');
          const result = await uploadToCloudinary(file.buffer, 'products', isVideo ? 'video' : 'image');
          return prisma.productMedia.create({
            data: {
              productId: product.id,
              url: result.url,
              publicId: result.public_id,
              type: isVideo ? 'video' : 'image',
              isMain: index === 0,
            },
          });
        })
      );
      const productWithMedia = await prisma.product.findUnique({
        where: { id: product.id },
        include: { media: true, seller: { select: { id: true, name: true, shopName: true } }, category: true },
      });
      return res.status(201).json(productWithMedia);
    }

    return res.status(201).json(product);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// PUT /api/products/:id — seller/admin updates product
router.put('/:id', authenticate, requireRole('SELLER', 'ADMIN'), upload.array('media', 10), async (req: AuthRequest, res: Response) => {
  const productId = parseInt(req.params.id as string);
  const { name, description, price, stock, categoryId, isActive } = req.body;

  try {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    if (req.user!.role !== 'ADMIN' && product.sellerId !== req.user!.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const updated = await prisma.product.update({
      where: { id: productId },
      data: {
        name: name ?? product.name,
        description: description ?? product.description,
        price: price ? parseFloat(price) : product.price,
        stock: stock !== undefined ? parseInt(stock) : product.stock,
        categoryId: categoryId ? parseInt(categoryId) : product.categoryId,
        isActive: isActive !== undefined ? isActive === 'true' || isActive === true : product.isActive,
      },
    });

    if (req.files && Array.isArray(req.files) && (req.files as Express.Multer.File[]).length > 0) {
      await Promise.all(
        (req.files as Express.Multer.File[]).map(async (file) => {
          const isVideo = file.mimetype.startsWith('video/');
          const result = await uploadToCloudinary(file.buffer, 'products', isVideo ? 'video' : 'image');
          return prisma.productMedia.create({
            data: {
              productId: productId,
              url: result.url,
              publicId: result.public_id,
              type: isVideo ? 'video' : 'image',
              isMain: false,
            },
          });
        })
      );
    }

    const finalProduct = await prisma.product.findUnique({
      where: { id: productId },
      include: { media: true, seller: { select: { id: true, name: true, shopName: true } }, category: true },
    });
    return res.json(finalProduct);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// DELETE /api/products/:id
router.delete('/:id', authenticate, requireRole('SELLER', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  const productId = parseInt(req.params.id as string);
  try {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    if (req.user!.role !== 'ADMIN' && product.sellerId !== req.user!.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await prisma.product.update({ where: { id: productId }, data: { isActive: false } });
    return res.json({ message: 'Product deactivated' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// GET /api/products/:id/reviews
router.get('/:id/reviews', async (req, res: Response) => {
  try {
    const reviews = await prisma.review.findMany({
      where: { productId: parseInt(req.params.id as string) },
      include: { user: { select: { id: true, name: true, avatar: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(reviews);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// POST /api/products/:id/reviews
router.post('/:id/reviews', authenticate, async (req: AuthRequest, res: Response) => {
  const { rating, comment } = req.body;
  if (!rating) return res.status(400).json({ error: 'Rating is required' });

  try {
    const review = await prisma.review.create({
      data: {
        rating: parseInt(rating),
        comment,
        userId: req.user!.id,
        productId: parseInt(req.params.id as string),
      },
      include: { user: { select: { id: true, name: true, avatar: true } } },
    });

    // Update product avg rating
    const allReviews = await prisma.review.findMany({ where: { productId: parseInt(req.params.id as string) } });
    const avgRating = allReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / allReviews.length;
    await prisma.product.update({ where: { id: parseInt(req.params.id as string) }, data: { rating: avgRating } });

    return res.status(201).json(review);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// GET /api/products/categories/all
router.get('/categories/all', async (_req, res: Response) => {
  try {
    const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
    return res.json(categories);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
