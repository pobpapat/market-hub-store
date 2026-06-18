import { Router, Response } from 'express';
import prisma from '../prisma';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();

// All admin routes require ADMIN role
router.use(authenticate, requireRole('ADMIN'));

// GET /api/admin/stats — dashboard overview
router.get('/stats', async (_req, res: Response) => {
  try {
    const [totalUsers, totalProducts, totalOrders, revenueAgg] = await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
      prisma.order.count(),
      prisma.order.aggregate({ _sum: { totalAmount: true } }),
    ]);

    const recentOrders = await prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { buyer: { select: { name: true, email: true } } },
    });

    return res.json({
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue: revenueAgg._sum.totalAmount || 0,
      recentOrders,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/users — list all users
router.get('/users', async (req, res: Response) => {
  const { search, role, page = '1', limit = '20' } = req.query;
  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;
  const where: any = {};
  if (search) where.OR = [
    { name: { contains: search as string, mode: 'insensitive' } },
    { email: { contains: search as string, mode: 'insensitive' } },
  ];
  if (role) where.role = role;

  try {
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limitNum,
        select: { id: true, email: true, name: true, role: true, shopName: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);
    return res.json({ users, total, page: pageNum, totalPages: Math.ceil(total / limitNum) });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// PATCH /api/admin/users/:id/role — change user role
router.patch('/users/:id/role', async (req, res: Response) => {
  const { role } = req.body;
  if (!['BUYER', 'SELLER', 'ADMIN'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
  try {
    const user = await prisma.user.update({ where: { id: parseInt(req.params.id) }, data: { role } });
    return res.json({ id: user.id, email: user.email, role: user.role });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', async (req, res: Response) => {
  try {
    await prisma.user.delete({ where: { id: parseInt(req.params.id) } });
    return res.json({ message: 'User deleted' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/products — all products (including inactive)
router.get('/products', async (req, res: Response) => {
  const { page = '1', limit = '20', search } = req.query;
  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;
  const where: any = {};
  if (search) where.name = { contains: search as string, mode: 'insensitive' };

  try {
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limitNum,
        include: { media: { where: { isMain: true }, take: 1 }, seller: { select: { id: true, name: true, shopName: true } }, category: true },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);
    return res.json({ products, total, page: pageNum, totalPages: Math.ceil(total / limitNum) });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// PATCH /api/admin/products/:id/toggle — toggle active status
router.patch('/products/:id/toggle', async (req, res: Response) => {
  try {
    const product = await prisma.product.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!product) return res.status(404).json({ error: 'Not found' });
    const updated = await prisma.product.update({
      where: { id: parseInt(req.params.id) },
      data: { isActive: !product.isActive },
    });
    return res.json(updated);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/orders — all orders
router.get('/orders', async (req, res: Response) => {
  const { page = '1', limit = '20', status } = req.query;
  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;
  const where: any = {};
  if (status) where.status = status;

  try {
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limitNum,
        include: {
          buyer: { select: { id: true, name: true, email: true } },
          items: { include: { product: { select: { id: true, name: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.count({ where }),
    ]);
    return res.json({ orders, total, page: pageNum, totalPages: Math.ceil(total / limitNum) });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// POST /api/admin/categories — create category
router.post('/categories', async (req, res: Response) => {
  const { name, icon } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  try {
    const category = await prisma.category.create({ data: { name, icon } });
    return res.status(201).json(category);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
