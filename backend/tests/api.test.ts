import { describe, beforeAll, it, expect, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../src/index';
import prisma from '../src/prisma';

let userToken = '';

describe('API Endpoints', () => {
  beforeAll(async () => {
    try {
      await prisma.user.deleteMany();
    } catch (e) {
      console.warn('Could not clean up user table:', e);
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('GET /api/health should return status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
  });

  it('POST /api/auth/register should create a user', async () => {
    const email = `test-${Date.now()}@example.com`;
    const password = 'password123';

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email, password, name: 'Test User', role: 'BUYER' });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.email).toBe(email);
    userToken = res.body.token;
  });

  it('GET /api/products should list products', async () => {
    const res = await request(app).get('/api/products');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.products)).toBe(true);
  });
});
