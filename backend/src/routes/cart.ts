import { Router, Response } from 'express';
import prisma from '../prisma';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/cart — get current user's cart
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const cart = await prisma.cart.findUnique({
      where: { userId: req.user!.id },
      include: {
        items: {
          include: {
            product: {
              include: {
                media: { where: { isMain: true }, take: 1 },
                seller: { select: { id: true, name: true, shopName: true } },
              },
            },
          },
        },
      },
    });

    if (!cart) {
      const newCart = await prisma.cart.create({ data: { userId: req.user!.id }, include: { items: true } });
      return res.json(newCart);
    }
    return res.json(cart);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// POST /api/cart — add item to cart
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  const { productId, quantity = 1 } = req.body;
  if (!productId) return res.status(400).json({ error: 'productId is required' });

  try {
    let cart = await prisma.cart.findUnique({ where: { userId: req.user!.id } });
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId: req.user!.id } });
    }

    const existing = await prisma.cartItem.findFirst({
      where: { cartId: cart.id, productId: parseInt(productId) },
    });

    if (existing) {
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + parseInt(quantity) },
      });
    } else {
      await prisma.cartItem.create({
        data: { cartId: cart.id, productId: parseInt(productId), quantity: parseInt(quantity) },
      });
    }

    const updatedCart = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: {
        items: {
          include: {
            product: {
              include: { media: { where: { isMain: true }, take: 1 }, seller: { select: { id: true, name: true, shopName: true } } },
            },
          },
        },
      },
    });
    return res.status(201).json(updatedCart);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// PUT /api/cart/:itemId — update quantity
router.put('/:itemId', authenticate, async (req: AuthRequest, res: Response) => {
  const { quantity } = req.body;
  if (!quantity || parseInt(quantity) < 1) return res.status(400).json({ error: 'Valid quantity required' });

  try {
    const item = await prisma.cartItem.update({
      where: { id: parseInt(req.params.itemId as string) },
      data: { quantity: parseInt(quantity) },
    });
    return res.json(item);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// DELETE /api/cart/:itemId — remove item
router.delete('/:itemId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.cartItem.delete({ where: { id: parseInt(req.params.itemId as string) } });
    return res.json({ message: 'Item removed' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
