import { describe, beforeAll, it, expect,afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../src/index';
import prisma from '../src/prisma';

describe('API Endpoints', () => {
  beforeAll(async () => {
    // Basic clean up of test database before running tests
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

  it('POST /api/users should create a user', async () => {
    const email = `test-${Date.now()}@example.com`;
    const name = 'Test User';

    const res = await request(app)
      .post('/api/users')
      .send({ email, name });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.email).toBe(email);
    expect(res.body.name).toBe(name);
  });

  it('GET /api/users should list users', async () => {
    const res = await request(app).get('/api/users');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
