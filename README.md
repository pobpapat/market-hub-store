# MarketHub Store Project
Live Website: https://market-hub-store.vercel.app/
โปรเจคนี้เป็นระบบ Web Application แบบ Fullstack ที่ประกอบด้วย:

### Deployment & Hosting 
- **Vercel** - สำหรับ Deploy และ Hosting ฝั่ง Frontend
- **Render** - สำหรับ Deploy และ Hosting ฝั่ง Backend (API) และฐานข้อมูล PostgreSQL บนคลาวด์
- **Cloudinary** - สำหรับจัดเก็บรูปภาพบนคลาวด์

## เทคโนโลยีที่ใช้ 

### Frontend
- **Next.js**  - สำหรับสร้าง User Interface และทำ Server-Side Rendering

### Backend
- **Node.js** & **Express.js** - สำหรับสร้าง API Server
- **PostgreSQL** & **Prisma ORM** - สำหรับจัดการฐานข้อมูล (Relational Database)
- **JWT (JSON Web Token)** - สำหรับระบบยืนยันตัวตน (Authentication)
- **Bcrypt.js** - สำหรับเข้ารหัสรหัสผ่าน
- **Multer** - สำหรับจัดการอัปโหลดไฟล์
- **Cloudinary** - สำหรับจัดเก็บรูปภาพบนคลาวด์
- **Jest** & **Supertest** - สำหรับการทำ Automated Testing


## ตัวแปรแวดล้อม (Environment Variables)

### สำหรับ backend
สร้างไฟล์ `backend/.env` และตั้งค่าตามตัวอย่างนี้:

```env
DATABASE_URL="postgresql://user:password@host:port/database"
PORT=5000

# Cloudinary Credentials
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# JWT Secret
JWT_SECRET=your_super_secret_jwt_key
```

## การรันโปรเจค

### รัน backend

```bash
cd backend
npm run dev
```
*(Backend จะรันที่ `http://localhost:5000`)*

### รัน frontend

ในอีกเทอร์มินัลหนึ่ง:

```bash
cd frontend
npm run dev
```
*(Frontend จะรันที่ `http://localhost:3000`)*

## คำสั่งสำคัญ

### Backend

- `npm run dev` - รัน backend ในโหมดพัฒนาด้วย ts-node-dev
- `npm run build` - สร้าง Prisma Client และคอมไพล์ TypeScript สำหรับ production
- `npm start` - รัน backend จากไฟล์ที่ build แล้ว
- `npm run prisma:generate` - อัปเดต Prisma Client ตาม Schema
- `npm run prisma:migrate` - ทำการอัปเดตโครงสร้างฐานข้อมูลด้วย Prisma Migrate
- `npm test` - รัน unit / integration tests ด้วย Jest

### Frontend

- `npm run dev` - รัน frontend ในโหมดพัฒนา
- `npm run build` - build frontend สำหรับ production
- `npm run start` - รัน frontend จากไฟล์ที่ build แล้ว
- `npm run lint` - ตรวจสอบโค้ดด้วย ESLint
