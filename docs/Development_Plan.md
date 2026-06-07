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
---

## 📅 แผนการพัฒนา (Development Phases)

### Phase 1: Setup & Infrastructure (1-2 วัน) [สำเร็จแล้ว ✅]

- [x] สร้าง Next.js 14 project (npx create-next-app@latest)
- [x] สร้าง Supabase project
  - [x] สร้าง tables: `products`, `orders` (สำเร็จแล้ว ผ่าน schema.sql)
  - [x] ตั้งค่า Storage bucket: `slips` (สำเร็จแล้ว)
  - [x] สร้าง admin user ผ่าน Supabase Auth
  - [x] ตั้ง Row Level Security (RLS) policies (สำเร็จแล้ว ผ่าน schema.sql)
- [x] เชื่อม Next.js กับ Supabase (`@supabase/ssr` สำเร็จแล้ว)
- [x] Push โค้ดขึ้น GitHub
- [/] Deploy บน Vercel + ตั้ง Environment Variables (อยู่ระหว่างดำเนินการ)

**Environment Variables Status:**
- `NEXT_PUBLIC_SUPABASE_URL` : ตั้งค่าแล้ว ✅
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` : ตั้งค่าแล้ว ✅
- `SUPABASE_SERVICE_ROLE_KEY` : ตั้งค่าแล้ว ✅
- `EASYSLIP_API_KEY` : ตั้งค่าแล้ว ✅
- `EASYSLIP_SANDBOX=true` : ตั้งค่าเปิดใช้งานแล้ว เพื่อจำลองการสแกนสลิปฟรี ✅
- `LINE_CHANNEL_ACCESS_TOKEN` : **⏳ รอข้อมูลและ Token จากลูกค้าเพื่อเชื่อมต่อ LINE OA**
- `LINE_ADMIN_USER_ID` : **⏳ รอข้อมูล ID ของแอดมินเพื่อใช้รับการแจ้งเตือน**
- `NEXT_PUBLIC_PROMPTPAY_NUMBER` (หรือ `NEXT_PUBLIC_BILLER_ID`) : **⏳ รอข้อมูล Biller ID 15 หลักของ K-Shop จากลูกค้าเพื่อเชื่อมต่อระบบสแกนจ่ายแบบ Bill Payment (Tag 30) ของกสิกรไทย** (ปัจจุบันใช้พร้อมเพย์ทดสอบบุคคลทั่วไป)

---

### Phase 2: Customer Frontend (2-3 วัน) [สำเร็จแล้ว ✅]

- [x] **หน้าหลัก** (`/`)
  - [x] Header: Logo + ชื่อร้าน (CDM + กลับหน้าหลักเมื่อคลิก)
  - [x] Product Card: รูปหมอน (ขยายขนาดเท่าเนื้อหา), ชื่อ (แสดงบรรทัดเดียว), ราคา (ไม่มีเครื่องหมาย ฿ ใช้หน่วย "บาท"), สต็อกคงเหลือ
  - [x] Quantity selector (+/-) พร้อมตรวจสอบไม่ให้เกินสต็อกที่มี
  - [x] ปุ่ม "ชำระเงิน"
  - [x] Footer: ข้อมูลร้านค้าและสิทธิ์การคุ้มครองข้อมูล
- [x] **หน้า QR Code Payment** (เปลี่ยนมาใช้ Popup Modal เพื่อให้กระบวนการลื่นไหล)
  - [/] สร้าง PromptPay QR dynamic ตามจำนวนเงินจริง (เตรียมเปลี่ยนไปใช้ Biller ID 15 หลักของ K-Shop ด้วยมาตรฐาน Tag 30 โดยใช้ไลบรารี `promptparse` - *ยังไม่ได้ลงมือทำ ⏳*)
  - [x] แสดงยอดเงินรวมชำระ
  - [x] ปุ่มดาวน์โหลดภาพ QR Code
  - [x] ปุ่ม "ฉันโอนเงินเรียบร้อยแล้ว ไปแนบสลิป"
  - [x] ปุ่ม "ยกเลิกชำระเงิน" (เพื่อยกเลิกการจองสิทธิ์และปิด Modal)
- [x] **หน้าส่งสลิป & กรอกที่อยู่** (`/payment/slip`)
  - [x] แบบฟอร์มกรอก ชื่อ-นามสกุล, เบอร์โทรศัพท์, ที่อยู่จัดส่ง
  - [x] ส่วนอัปโหลดรูปภาพสลิป (Drag & Drop + Preview ก่อนส่ง)
  - [x] ป้องกันการเปลี่ยนหน้าแบบกะทันหัน และ validation ความถูกต้องของข้อมูล
- [x] **หน้ายืนยันความสำเร็จ** (`/success`)
  - [x] แสดงหน้าขอบคุณพร้อม Checkmark
  - [x] แสดงรายละเอียดออเดอร์ (Order ID, รายการ, ยอดเงิน) และที่อยู่จัดส่ง
  - [x] กล่องข้อความแจ้งเตือนระยะเวลารอตรวจสลิป (5-15 นาที)
- [x] **ปุ่มย้อนกลับและปุ่มแชร์**
  - [x] ปุ่มย้อนกลับสู่หน้าแรก บนหน้าแนบสลิป จัดวางที่มุมซ้ายบนเหนือรายการสรุปสินค้าเพื่อความสะดวก
  - [x] ปุ่มแชร์ข้อมูลสินค้าบนหน้าหลัก รองรับการแชร์ผ่าน Native Web Share API บนมือถือ และ Copy Link ไปยังคลิปบอร์ดพร้อมแสดง Toast แจ้งเตือนสไตล์พรีเมียมบนอุปกรณ์อื่นๆ

---

### Phase 3: Backend API (2-3 วัน) [สำเร็จแล้ว ✅]

- [x] **POST `/api/orders`** — สร้างรายการสั่งซื้อใหม่ (สถานะ `pending`)
- [x] **POST `/api/upload`** — อัปโหลดไฟล์สลิปไป Supabase Storage และบันทึกข้อมูลจัดส่ง
- [x] **POST `/api/orders/[id]/verify`** — ตรวจสอบสลิปผ่าน EasySlip API
  - [x] ระบบจำลอง Sandbox Mode ทำงานอัตโนมัติหาก `EASYSLIP_SANDBOX=true` (เพื่อประหยัดโควต้าการทดสอบ)
  - [x] ดึงรูปสลิปจาก Storage ไปตรวจความถูกต้องของธนาคาร ยอดเงิน และชื่อผู้รับ
  - [x] ป้องกันการใช้สลิปโอนเงินซ้ำ (Anti-Fraud Slip Reuse Check)
  - [x] อัปเดตสถานะเป็น `verified` และทำการลดจำนวนสต็อกสินค้าในฐานข้อมูลอัตโนมัติ
- [x] **POST `/api/notify`** — แจ้งเตือนแอดมินทาง LINE OA / Email (ติดตั้งและรวมระบบ Line Flex Message + Resend Email Fallback เรียบร้อยแล้ว)

---

### Phase 4: Backoffice (2-3 วัน) [สำเร็จแล้ว ✅]

- [x] **หน้าล็อกอินแอดมิน** (`/admin/login`)
  - [x] ออกแบบ UI ล็อกอินด้วย Email & Password
  - [x] เชื่อมต่อกับระบบ Supabase Auth (ยืนยันสิทธิ์โดยตรวจสอบผ่าน Cookie Session ฝั่งเซิร์ฟเวอร์)
- [x] Middleware Route Guard (ป้องกันหน้า /admin/* ทุกหน้าด้วย Next.js Middleware และ Cookie Session)
- [x] **หน้าจัดการสต็อก** (`/admin`)
  - [x] แสดงรายละเอียดสินค้าปัจจุบัน
  - [x] ฟอร์มแก้ไขชื่อสินค้า, ราคา, และจำนวนสต็อก (CRUD) พร้อมระบบอัปโหลดรูปภาพหลายรูปเข้า Supabase Storage จัดลำดับรูปได้ และระบบแก้ไขข้อมูลสินค้าแบบเรียลไทม์
- [x] **หน้าจัดการออเดอร์** (`/admin/orders`)
  - [x] ตารางแสดงออเดอร์พร้อม Filter สถานะ (Pending / Slip Uploaded / Verified / Rejected)
  - [x] แสดงสลิปที่ลูกค้าแนบ และข้อมูลที่อยู่จัดส่ง
  - [x] ปุ่มสำหรับแอดมินกดยืนยันออเดอร์แบบ Manual (ในกรณีที่ระบบ Auto Verify ล้มเหลวหรือเกิดยอดโอนไม่ตรง)
  - [x] ปุ่มปฏิเสธออเดอร์พร้อมระบุเหตุผล

---

### Phase 5: Polish & Testing (1-2 วัน) [อยู่ระหว่างดำเนินการ ⚙️]

- [x] ออกแบบ Mobile-First Responsive รองรับอุปกรณ์ทุกขนาดจอ
- [x] อัปเกรด Font และ Animation สไลด์หน้าเว็บให้สวยงามพรีเมียม (Geist Font + Slide-up)
- [x] จัดการล้าง TypeScript Types Warning & ESLint Sync State Warning ทั้งหมด 100%
- [x] ทดสอบ Flow ลูกค้าสั่งซื้อจนสำเร็จครบวงจร (End-to-End Test)
- [x] ทดสอบระบบหลังบ้านและการเข้าสู่ระบบของแอดมิน
- [ ] เชื่อมต่อ Custom Domain และเปิดใช้งาน Live Mode บน Production (เปลี่ยน `EASYSLIP_SANDBOX` เป็น `false`)

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
| K-Shop Biller ID 15 หลัก | ใช้สำหรับการรับเงินเข้าบัญชีกสิกรไทยผ่านระบบ Bill Payment (Tag 30) |
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
