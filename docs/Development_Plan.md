# 🛏️ Crystal Dreams — Development Plan

> **สินค้า**: หมอน | **ราคา**: 1,890 บาท | **Stack**: Next.js + Supabase + Vercel

---

## ❓ คำตอบสำหรับคำถาม

### Q1: Gen QR จากเบอร์โทร vs เลขบัญชีธนาคาร ต่างกันยังไง?

| | เบอร์โทรศัพท์ | เลขบัญชีธนาคาร |
|---|---|---|
| **รูปแบบ** | `0812345678` | `{bank_code}{account_no}` |
| **ผู้รับเงิน** | เจ้าของ PromptPay ที่ผูกเบอร์ | เจ้าของบัญชีธนาคารนั้นโดยตรง |
| **ความซับซ้อน** | ง่ายมาก แค่เบอร์อย่างเดียว | ต้องมี bank code + เลขบัญชี |
| **ภาพลักษณ์** | ดูเป็นส่วนตัว / บุคคล | ดูเป็นธุรกิจ / มืออาชีพกว่า |
| **รับเงินได้ไหม** | รับได้ปกติทุกธนาคาร | รับได้ปกติทุกธนาคาร |
| **แนะนำสำหรับ** | ร้านค้าเล็ก / เริ่มต้น | ธุรกิจที่ต้องการความน่าเชื่อถือ |

> **สรุป**: ทั้งคู่โอนเงินได้เหมือนกัน ต่างแค่ identifier ที่ใช้ระบุผู้รับ  
> ถ้าร้านยังเล็ก → ใช้**เบอร์โทร**ง่ายกว่า  
> ถ้าต้องการดูเป็นมืออาชีพ → ใช้**เลขบัญชี**

```
// เบอร์โทร
generatePayload('0812345678', { amount: 1890 })

// เลขบัญชีธนาคาร  
generatePayload('1234567890', { amount: 1890 })  // ตรงๆ ใส่เลขบัญชีได้เลย
```

---

## ✅ Tech Stack ที่ตกลงใช้

```
Frontend + Backend   →  Next.js 14 (App Router)
Database + Auth      →  Supabase (PostgreSQL + Supabase Auth)
File Storage         →  Supabase Storage (เก็บรูปสลิป)
QR Payment           →  promptpay-qr + qrcode (npm, ฟรี 100%)
Slip Verification    →  EasySlip API (100 ฟรี/เดือน) + Manual fallback
Notification         →  LINE Messaging API (LINE OA)
Deployment           →  Vercel (free tier)
```

---

## 🗄️ Database Schema

### Table: `products`
```sql
id            uuid PRIMARY KEY
name          text           -- ชื่อสินค้า "หมอน Crystal Dreams"
price         numeric        -- 1890
stock         integer        -- จำนวนสต็อก
image_url     text           -- URL รูปสินค้า
created_at    timestamptz
updated_at    timestamptz
```

### Table: `orders`
```sql
id            uuid PRIMARY KEY
product_id    uuid REFERENCES products(id)
quantity      integer
total_amount  numeric        -- quantity × price
customer_name text
customer_tel  text
customer_address text       -- เพิ่ม: ที่อยู่จัดส่ง
status        text           -- 'pending' | 'slip_uploaded' | 'verified' | 'rejected'
slip_url      text           -- URL รูปสลิปใน Supabase Storage
slip_verified boolean        -- ผ่าน EasySlip API หรือไม่
verified_by   text           -- 'auto' | 'manual'
created_at    timestamptz
updated_at    timestamptz
```

### Table: `admins` (จัดการโดย Supabase Auth)
> ใช้ Supabase Auth built-in ไม่ต้องสร้าง table แยก

---

## 📋 โครงสร้างหน้าเว็บ (Routing)

```
app/
├── page.tsx                     → หน้าหลัก (สินค้า + ปุ่มชำระเงิน)
├── payment/
│   ├── page.tsx                 → หน้า QR Code PromptPay
│   └── slip/page.tsx            → หน้าอัพโหลดสลิป
├── success/page.tsx             → หน้าขอบคุณ / รอการยืนยัน
│
├── admin/
│   ├── login/page.tsx           → หน้า Login backoffice
│   ├── dashboard/page.tsx       → จัดการสินค้า (แก้ชื่อ/ราคา/สต็อก/รูป)
│   └── orders/page.tsx          → ดูออเดอร์ + manual verify สลิป
│
└── api/
    ├── orders/route.ts          → สร้าง order
    ├── orders/[id]/verify/route.ts → verify สลิป (EasySlip + manual)
    ├── notify/route.ts          → ส่งแจ้งเตือน LINE OA
    └── upload/route.ts          → upload รูปสลิปไป Supabase Storage
```

---

## 🗺️ User Flow

### 🛍️ Customer Flow
```
[หน้าหลัก]
  → เลือกจำนวนหมอน (1-N ชิ้น ไม่เกิน stock)
  → ใส่ชื่อ + เบอร์โทรติดต่อ
  → กด "ชำระเงิน"
      ↓
[หน้า QR Code]
  → แสดง PromptPay QR ตามยอด (จำนวน × 1,890)
  → แสดงยอดรวมชัดเจน
  → กด "อัพโหลดสลิป & กรอกที่อยู่" หลังโอนเสร็จ
      ↓
[หน้าอัพโหลดสลิป & ที่อยู่]
  → เลือกรูปสลิปจากโทรศัพท์
  → กรอกข้อมูลจัดส่ง: ชื่อ-นามสกุล, เบอร์โทร, และที่อยู่จัดส่งโดยละเอียด
  → กด "ยืนยันการชำระเงิน"
      ↓
[ระบบ Backend]
  → Upload สลิปไป Supabase Storage
  → บันทึกที่อยู่จัดส่งลง Database ในออเดอร์นั้น
  → ส่งไป EasySlip API ตรวจสอบ
  → ถ้าผ่าน Auto → Update order status → แจ้ง LINE OA
  → ถ้าไม่ผ่าน Auto → เข้า Manual queue → แจ้ง LINE OA ให้ admin ตรวจ
      ↓
[หน้า Success]
  → "ขอบคุณ! คำสั่งซื้อของคุณอยู่ระหว่างการยืนยัน"
  → แสดงรายละเอียดที่อยู่จัดส่งและ Order ID ให้ลูกค้าเก็บไว้
```

### 👨‍💼 Admin Flow
```
[Login] → Supabase Auth (email/password)
    ↓
[Dashboard]
  ├── แก้ไขชื่อสินค้า
  ├── แก้ไขราคา
  ├── เพิ่ม/ลด Stock
  └── เปลี่ยนรูปสินค้า
    ↓
[Orders]
  ├── ดูรายการออเดอร์ทั้งหมด
  ├── ดูสถานะ (pending / slip_uploaded / verified / rejected)
  ├── คลิกดูรูปสลิปแต่ละออเดอร์
  └── กด "ยืนยัน" หรือ "ปฏิเสธ" (manual verify)
```

---

## 📅 แผนการพัฒนา (Development Phases)

### Phase 1: Setup & Infrastructure (1-2 วัน)

- [ ] สร้าง Next.js 14 project (`npx create-next-app@latest`)
- [ ] สร้าง Supabase project
  - [ ] สร้าง tables: `products`, `orders`
  - [ ] ตั้งค่า Storage bucket: `slips` (public read, auth write)
  - [ ] สร้าง admin user ผ่าน Supabase Auth
  - [ ] ตั้ง Row Level Security (RLS) policies
- [ ] เชื่อม Next.js กับ Supabase (`@supabase/ssr`)
- [ ] Push โค้ดขึ้น GitHub
- [ ] Deploy บน Vercel + ตั้ง Environment Variables

**Environment Variables ที่ต้องการ:**
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
EASYSLIP_API_KEY=
LINE_CHANNEL_ACCESS_TOKEN=
LINE_ADMIN_USER_ID=
NEXT_PUBLIC_PROMPTPAY_NUMBER=  # เบอร์/เลขบัญชี PromptPay
```

---

### Phase 2: Customer Frontend (2-3 วัน)

- [ ] **หน้าหลัก** (`/`)
  - [ ] Header: Logo + ชื่อร้าน
  - [ ] Product Card: รูปหมอน, ชื่อ, ราคา 1,890 บาท, จำนวนสต็อก
  - [ ] Quantity selector (+/-) พร้อม validate ไม่เกิน stock
  - [ ] ปุ่ม "ชำระเงิน"
  - [ ] Footer: ข้อมูลร้าน, ช่องทางติดต่อ

- [ ] **หน้า QR** (`/payment`)
  - [ ] Generate PromptPay QR จาก `promptpay-qr` + `qrcode`
  - [ ] แสดงยอดชำระรวม
  - [ ] ปุ่มดาวน์โหลด QR
  - [ ] ปุ่ม "แนบสลิป & กรอกที่อยู่จัดส่ง"

- [ ] **หน้าอัพโหลดสลิป & ที่อยู่** (`/payment/slip`)
  - [ ] Form: ชื่อ-นามสกุล, เบอร์โทรผู้รับ, ที่อยู่สำหรับจัดส่ง (ถนน, อำเภอ, เขต, จังหวัด, รหัสไปรษณีย์)
  - [ ] Image upload component (drag & drop + click) สำหรับแนบรูปสลิป
  - [ ] Preview รูปสลิปก่อน submit
  - [ ] ปุ่ม "ยืนยันการชำระเงิน"

- [ ] **หน้า Success** (`/success`)
  - [ ] แสดงข้อความขอบคุณ
  - [ ] แสดง Order ID และสรุปที่อยู่สำหรับจัดส่งที่กรอกไว้
  - [ ] แจ้งว่ารอยืนยัน 1-2 ชั่วโมง

---

### Phase 3: Backend API (2-3 วัน)

- [ ] **POST `/api/orders`** — สร้าง order ใหม่ (สถานะ pending)
  - รับ: `product_id`, `quantity`
  - คืน: `order_id`, `total_amount`

- [ ] **POST `/api/upload`** — อัพโหลดสลิป & อัพเดตที่อยู่
  - รับ: `order_id`, `customer_name`, `customer_tel`, `customer_address`, `image file`
  - อัพโหลดสลิปไป Supabase Storage
  - อัพเดตข้อมูลชื่อ, เบอร์โทร, ที่อยู่จัดส่ง และ `slip_url` ใน order
  - เปลี่ยนสถานะ order → `slip_uploaded`
  - คืน: สถานะความสำเร็จ

- [ ] **POST `/api/orders/[id]/verify`** — ตรวจสลิป (EasySlip)
  - ส่งรูปสลิปใน storage ไปยัง EasySlip API
  - ตรวจเช็คความถูกต้อง (ราคาตรง 1,890 x จำนวน หรือไม่)
  - ถ้าผ่าน Auto → อัพเดทสถานะเป็น `verified`, ลด stock
  - ถ้าไม่ผ่าน → เข้า manual queue เพื่อให้ Admin ตรวจสอบเอง
  - เรียก `/api/notify` ส่งข้อมูลคำสั่งซื้อและที่อยู่จัดส่งไปยัง LINE OA

- [ ] **POST `/api/notify`** — แจ้ง LINE OA
  - ส่ง push message หา admin
  - ข้อความประกอบด้วย: ชื่อลูกค้า, เบอร์โทร, ที่อยู่จัดส่ง, จำนวนสินค้า, ยอดโอนเงิน, และรูปสลิป
  - ถ้า EasySlip ตรวจไม่ผ่าน → แนบลิงก์สำหรับกดตรวจสอบสลิปแบบ Manual ใน backoffice

---

### Phase 4: Backoffice (2-3 วัน)

- [ ] **หน้า Login** (`/admin/login`)
  - [ ] Email/Password form
  - [ ] ใช้ Supabase Auth
  - [ ] Redirect ไป dashboard หลัง login สำเร็จ

- [ ] **Middleware** — protect `/admin/*` routes ทั้งหมด

- [ ] **หน้า Dashboard** (`/admin/dashboard`)
  - [ ] แสดงข้อมูลสินค้าปัจจุบัน
  - [ ] แก้ไขชื่อสินค้า
  - [ ] แก้ไขราคา
  - [ ] เพิ่ม/ลด stock (input + ปุ่ม)
  - [ ] เปลี่ยนรูปสินค้า

- [ ] **หน้า Orders** (`/admin/orders`)
  - [ ] ตาราง order ทั้งหมด พร้อม filter สถานะ
  - [ ] แสดงรายละเอียดที่อยู่จัดส่ง เบอร์โทร และชื่อผู้รับของแต่ละออเดอร์
  - [ ] คลิกดูรูปสลิปโอนเงิน (modal/lightbox)
  - [ ] ปุ่ม "✅ ยืนยันสลิป (ลดสต็อกและอนุมัติออเดอร์)" / "❌ ปฏิเสธสลิป"
  - [ ] แสดงป้ายบอก (EasySlip Verified Auto หรือ รอตรวจสอบ Manual)

---

### Phase 5: Polish & Testing (1-2 วัน)

- [ ] Responsive design (mobile-first)
- [ ] Error handling ทุก API
- [ ] Loading states ทุก action
- [ ] Test full flow ตั้งแต่เลือกสินค้า → ชำระ → แจ้ง LINE
- [ ] Test backoffice: login, แก้สินค้า, verify สลิป
- [ ] ตั้ง Custom Domain (ถ้ามี)

---

## ⏱️ Timeline สรุป

| Phase | งาน | ระยะเวลา |
|-------|-----|----------|
| 1 | Setup + Supabase + Vercel | 1-2 วัน |
| 2 | Customer Frontend | 2-3 วัน |
| 3 | Backend API | 2-3 วัน |
| 4 | Backoffice | 2-3 วัน |
| 5 | Testing + Polish | 1-2 วัน |
| **รวม** | | **~8-13 วัน** |

---

## 🔑 สิ่งที่ต้องเตรียมก่อน Build

| สิ่งที่ต้องเตรียม | วิธีเตรียม |
|---|---|
| เบอร์ PromptPay (หรือเลขบัญชี) | เบอร์ที่ลูกค้าจะโอนมา |
| LINE OA Account | สมัครที่ https://manager.line.biz |
| LINE Messaging API Channel | เปิดใช้ที่ LINE Developers Console |
| LINE Admin User ID | ดูจาก LINE OA Manager |
| EasySlip Account + API Key | สมัครที่ https://easyslip.com |
| Supabase Account | สมัครที่ https://supabase.com |
| Vercel Account | สมัครที่ https://vercel.com (ใช้ GitHub login) |
| GitHub Repository | สร้าง repo สำหรับโปรเจกต์ |

---

## 📌 หมายเหตุสำคัญ

> [!NOTE]
> **Manual Verify Flow**: เมื่อ EasySlip ไม่ผ่านอัตโนมัติ ระบบจะส่ง LINE แจ้ง admin พร้อมลิงก์ไปหน้า `/admin/orders` ให้ admin คลิกดูสลิปและตัดสินใจ verify เองได้

> [!WARNING]
> **LINE Messaging API Free Tier**: ส่งได้ 200 messages/เดือน ถ้าออเดอร์เกิน 200/เดือนต้องอัพเกรด plan

> [!TIP]
> **Deploy ทีละ Phase**: แนะนำ deploy หลัง Phase 1 เสร็จแล้วทำต่อ เพื่อให้ CI/CD ทำงานตั้งแต่ต้น และ catch deployment issues เร็ว
