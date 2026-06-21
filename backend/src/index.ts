import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import prisma from './prisma';

import authRoutes from './routes/auth';
import productRoutes from './routes/products';
import cartRoutes from './routes/cart';
import orderRoutes from './routes/orders';
import uploadRoutes from './routes/upload';
import adminRoutes from './routes/admin';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Allow all origins to prevent caching issues with specific origins
app.use(cors({ origin: '*' }));
app.use(express.json());

// Health check
app.get('/api/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', database: 'connected' });
  } catch (error: any) {
    res.status(500).json({ status: 'error', database: 'disconnected', message: error.message });
  }
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminRoutes);

// Legacy users endpoint (kept for backward compat)
app.get('/api/users', async (_req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, email: true, name: true, createdAt: true },
    });
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default app;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(` Server running on http://localhost:${PORT}`);
  });
}
