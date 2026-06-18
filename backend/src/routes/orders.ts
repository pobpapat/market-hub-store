import { Router, Response } from 'express';
import prisma from '../prisma';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();

// POST /api/orders — checkout (mock payment)
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  const { address, paymentMethod = 'mock_payment', note, items } = req.body;
  if (!address) return res.status(400).json({ error: 'Address is required' });

  try {
    // items can be passed directly, or we pull from cart
    let orderItems: { productId: number; quantity: number; price: number }[] = [];

    if (items && Array.isArray(items) && items.length > 0) {
      // Direct checkout with specific items
      for (const item of items) {
        const product = await prisma.product.findUnique({ where: { id: item.productId } });
        if (!product) return res.status(404).json({ error: `Product ${item.productId} not found` });
        if (product.stock < item.quantity) return res.status(400).json({ error: `Insufficient stock for ${product.name}` });
        orderItems.push({ productId: item.productId, quantity: item.quantity, price: product.price });
      }
    } else {
      // Checkout from cart
      const cart = await prisma.cart.findUnique({
        where: { userId: req.user!.id },
        include: { items: { include: { product: true } } },
      });
      if (!cart || cart.items.length === 0) return res.status(400).json({ error: 'Cart is empty' });

      for (const item of cart.items) {
        if (item.product.stock < item.quantity) {
          return res.status(400).json({ error: `Insufficient stock for ${item.product.name}` });
        }
        orderItems.push({ productId: item.productId, quantity: item.quantity, price: item.product.price });
      }
    }

    const totalAmount = orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const paymentRef = `PAY-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const order = await prisma.order.create({
      data: {
        buyerId: req.user!.id,
        totalAmount,
        address,
        paymentMethod,
        paymentRef,
        note,
        items: { create: orderItems },
      },
      include: {
        items: {
          include: { product: { include: { media: { where: { isMain: true }, take: 1 } } } },
        },
        buyer: { select: { id: true, name: true, email: true } },
      },
    });

    // Update stock and sold count
    for (const item of orderItems) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity }, sold: { increment: item.quantity } },
      });
    }

    // Clear cart if used
    if (!items) {
      const cart = await prisma.cart.findUnique({ where: { userId: req.user!.id } });
      if (cart) await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    }

    return res.status(201).json(order);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// GET /api/orders — buyer's orders
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      where: { buyerId: req.user!.id },
      include: {
        items: {
          include: { product: { include: { media: { where: { isMain: true }, take: 1 } } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(orders);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// GET /api/orders/:id — single order detail
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: parseInt(req.params.id as string) },
      include: {
        items: { include: { product: { include: { media: true } } } },
        buyer: { select: { id: true, name: true, email: true, phone: true } },
      },
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.buyerId !== req.user!.id && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    return res.json(order);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// GET /api/orders/seller/list — seller's received orders
router.get('/seller/list', authenticate, requireRole('SELLER', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const orders = await prisma.order.findMany({
      where: {
        items: { some: { product: { sellerId: req.user!.id } } },
      },
      include: {
        items: {
          where: { product: { sellerId: req.user!.id } },
          include: { product: { include: { media: { where: { isMain: true }, take: 1 } } } },
        },
        buyer: { select: { id: true, name: true, email: true, phone: true, address: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(orders);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// PATCH /api/orders/:id/status — seller/admin updates order status
router.patch('/:id/status', authenticate, requireRole('SELLER', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  const { status } = req.body;
  const validStatuses = ['PENDING', 'CONFIRMED', 'SHIPPING', 'DELIVERED', 'CANCELLED'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    const order = await prisma.order.update({
      where: { id: parseInt(req.params.id as string) },
      data: { status },
    });
    return res.json(order);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
