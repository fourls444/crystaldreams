# 🛒 Crystal Dreams — Single Product Shop: Tech Stack Recommendation

## ภาพรวมระบบ (System Overview)

```
┌─────────────────────────────────────────────────────────┐
│                    Customer Website                      │
│  Header (Logo) │ Product Card │ QR Payment │ Slip Upload │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│                      Backend API                         │
│  Product CRUD │ QR Gen │ Slip Verify │ Notification      │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│                    Backoffice                            │
│         Login │ จัดการสินค้า │ จัดการออเดอร์           │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│                     Database                             │
└─────────────────────────────────────────────────────────┘
```

---

## 1. 🖥️ Frontend Framework

### ตัวเลือก A: **Next.js** ⭐ (แนะนำ)
| ข้อดี | ข้อเสีย |
|-------|---------|
| SSR/SSG ทำให้ SEO ดีมาก | Learning curve สูงกว่า Vite |
| Built-in API Routes (ไม่ต้องแยก backend เล็กๆ) | Build time นานกว่าเล็กน้อย |
| Deploy บน Vercel ได้ฟรี (seamless มาก) | Bundle size ใหญ่กว่า |
| File-based routing สะดวก | |
| รองรับ Image Optimization ในตัว | |

### ตัวเลือก B: **Vite + React**
| ข้อดี | ข้อเสีย |
|-------|---------|
| เร็วมากตอน dev | ต้องแยก backend ออกไป |
| Bundle เล็กกว่า | SEO ต้องจัดการเพิ่มเติม |
| Setup ง่าย | ต้องตั้ง API server เอง |

> [!IMPORTANT]
> **แนะนำ Next.js** เพราะ API Routes ทำให้เขียน backend ใน project เดียวกันได้เลย ลด complexity ในการ deploy มาก และ Vercel (ผู้สร้าง Next.js) ให้ free tier ที่ดีมาก

---

## 2. 🗄️ Database

### ตัวเลือก A: **Supabase (PostgreSQL)** ⭐ (แนะนำ)
| ข้อดี | ข้อเสีย |
|-------|---------|
| Free tier: 500MB storage, 2 projects | Free tier pause หลัง inactive 1 อาทิตย์ |
| มี Auth ในตัว (ใช้ login backoffice ได้เลย) | |
| มี Storage (เก็บรูปสลิปได้เลย) | |
| Real-time subscriptions | |
| PostgreSQL เต็มรูปแบบ | |
| Dashboard สวยงาม | |

### ตัวเลือก B: **PlanetScale (MySQL)**
| ข้อดี | ข้อเสีย |
|-------|---------|
| Serverless MySQL, scale ได้ดี | Free tier ยกเลิกไปแล้ว ❌ |
| Branch-based development | ปัจจุบันต้องจ่ายเงิน |

### ตัวเลือก C: **MongoDB Atlas**
| ข้อดี | ข้อเสีย |
|-------|---------|
| Free tier 512MB ถาวร | ไม่มี Auth ในตัว |
| Flexible schema | ต้องตั้ง Auth แยก |
| ใช้งานง่ายถ้าคุ้น NoSQL | |

> [!IMPORTANT]
> **แนะนำ Supabase** เพราะ Auth + Storage + Database ครบในที่เดียว ตรงกับ use case นี้มาก

---

## 3. 💳 QR Code Payment (PromptPay)

> เนื่องจากเป็นร้านไทย สันนิษฐานว่าใช้ **PromptPay QR**

### ตัวเลือก A: **promptpay-qr (npm package)** ⭐ (แนะนำ)
| ข้อดี | ข้อเสีย |
|-------|---------|
| **ฟรี 100%** ไม่มีค่าบริการ | Generate ฝั่ง client เท่านั้น (ไม่ verify การชำระ) |
| ไม่ต้อง API key | ต้องใช้ slip verification แยก |
| Generate QR จาก หมายเลขโทรศัพท์/เลขบัญชี PromptPay | |
| npm: `promptpay-qr` + `qrcode` | |

```js
// ตัวอย่างการใช้งาน
import generatePayload from 'promptpay-qr'
import QRCode from 'qrcode'

const payload = generatePayload('0812345678', { amount: 599 })
const qrDataURL = await QRCode.toDataURL(payload)
```

### ตัวเลือก B: **Omise / Stripe**
| ข้อดี | ข้อเสีย |
|-------|---------|
| ตรวจสอบการชำระอัตโนมัติ | มีค่าธรรมเนียมต่อ transaction |
| Professional grade | Setup ซับซ้อน |

> [!NOTE]
> สำหรับ free deployment แนะนำ `promptpay-qr` + slip verification เป็น manual flow ผ่านการอัพสลิป

---

## 4. 🧾 Slip Verification

### ตัวเลือก A: **EasySlip API** ⭐ (แนะนำ)
| ข้อดี | ข้อเสีย |
|-------|---------|
| Free tier: 100 verifications/เดือน | จำกัดที่ 100 ครั้ง/เดือน |
| รองรับสลิปทุกธนาคารไทย | ต้องสมัคร account |
| API ง่าย ส่ง image → ได้ข้อมูลธุรกรรม | |
| เช็คจำนวนเงิน, วันที่, ผู้โอน | |

🔗 https://easyslip.com

### ตัวเลือก B: **SlipOK API**
| ข้อดี | ข้อเสีย |
|-------|---------|
| Free: 50 verifications/เดือน | จำกัด 50 ครั้ง |
| คล้าย EasySlip | น้อยกว่า EasySlip |

🔗 https://slipok.com

### ตัวเลือก C: **Manual Verification (ไม่ใช้ API)**
| ข้อดี | ข้อเสีย |
|-------|---------|
| ฟรี 100% ไม่จำกัด | Admin ต้องตรวจสอบเอง |
| ไม่ต้องสมัคร | ช้าและ human error สูง |
| ง่ายสุดในการ implement | |

> [!TIP]
> แนะนำ **EasySlip** สำหรับเริ่มต้น 100 ครั้ง/เดือน เพียงพอสำหรับร้านขายของชิ้นเดียวในระยะแรก

---

## 5. 🔔 Notification (แจ้งเตือน Admin)

### ตัวเลือก A: **LINE Notify** (เดิม) ❌
> LINE Notify ปิดบริการแล้วตั้งแต่ 31 มีนาคม 2025

### ตัวเลือก B: **LINE Messaging API (LINE OA)** ⭐ (แนะนำ)
| ข้อดี | ข้อเสีย |
|-------|---------|
| Free: 200 messages/เดือน | ต้องสมัคร LINE OA |
| ส่งรูปสลิป + ข้อความได้ | Setup ซับซ้อนกว่า email |
| ใช้ Webhook ได้ | |
| Push message หา admin โดยตรง | |

🔗 https://developers.line.biz/en/services/messaging-api/

### ตัวเลือก C: **Email via Resend** ⭐ (แนะนำ - ง่ายกว่า)
| ข้อดี | ข้อเสีย |
|-------|---------|
| Free: 3,000 emails/เดือน | ไม่ได้รับทันทีเหมือน LINE |
| Setup ง่ายมาก | อาจตกไป Spam |
| รองรับ HTML template | |
| `npm install resend` แค่นี้พอ | |

🔗 https://resend.com

### ตัวเลือก D: **Nodemailer + Gmail SMTP**
| ข้อดี | ข้อเสีย |
|-------|---------|
| ฟรี ใช้ Gmail ส่วนตัว | Gmail จำกัด 500/วัน |
| ไม่ต้องสมัคร service เพิ่ม | ต้อง config App Password |
| | อาจ spam ถ้าส่งเยอะ |

> [!TIP]
> ถ้าต้องการแจ้งเตือนแบบ **real-time** → ใช้ LINE Messaging API  
> ถ้าต้องการ **ง่าย** และ **เพียงพอ** → ใช้ Resend (email)  
> สามารถใช้ **ทั้งคู่** ได้โดยไม่ยาก

---

## 6. 🚀 Deployment (Free)

### ตัวเลือก A: **Vercel** ⭐ (แนะนำสำหรับ Next.js)
| ข้อดี | ข้อเสีย |
|-------|---------|
| Free tier ใจกว้างมาก | Function timeout 10s (free) |
| Deploy อัตโนมัติจาก GitHub | |
| Custom domain ฟรี | |
| Edge Network เร็วมาก | |
| Zero config สำหรับ Next.js | |

### ตัวเลือก B: **Railway**
| ข้อดี | ข้อเสีย |
|-------|---------|
| $5 free credit/เดือน | เครดิตหมดต้องจ่าย |
| รองรับ Docker | |
| รองรับ Database ในตัว | |

### ตัวเลือก C: **Render**
| ข้อดี | ข้อเสีย |
|-------|---------|
| Free tier มี | Sleep หลัง inactive 15 นาที |
| รองรับ Node.js, Python | Cold start ช้า |

> [!IMPORTANT]
> **แนะนำ Vercel** สำหรับ Next.js project — deploy ง่ายที่สุด ฟรีที่สุด เร็วที่สุด

---

## 7. 🔐 Authentication (Backoffice Login)

### ตัวเลือก A: **Supabase Auth** ⭐ (แนะนำ - ถ้าใช้ Supabase)
- Email/Password login ฟรี
- มีในตัวแล้ว ไม่ต้อง setup เพิ่ม

### ตัวเลือก B: **NextAuth.js (Auth.js)**
- รองรับ OAuth providers หลายตัว
- ใช้กับ Next.js ได้ดีมาก
- Free

### ตัวเลือก C: **Clerk**
- UI สำเร็จรูปสวยงาม
- Free tier: 10,000 MAU
- ง่ายต่อการ implement

---

## ✅ สรุป Tech Stack ที่แนะนำ (Recommended Stack)

```
┌─────────────────────────────────────────────────────────┐
│  Frontend & Backend   Next.js 14 (App Router)           │
│  Database             Supabase (PostgreSQL + Auth)       │
│  File Storage         Supabase Storage (รูปสลิป)        │
│  QR Payment           promptpay-qr + qrcode (npm)       │
│  Slip Verification    EasySlip API (100 free/เดือน)     │
│  Notification         Resend (email) + LINE Messaging    │
│  Deployment           Vercel (free)                     │
│  Auth (Backoffice)    Supabase Auth                     │
└─────────────────────────────────────────────────────────┘
```

**ทำไมถึงแนะนำ Stack นี้:**
- ✅ **ฟรีทั้งหมด** สำหรับ scale เล็กถึงกลาง
- ✅ **Deploy ง่าย** ผ่าน Vercel + GitHub
- ✅ **Database + Auth + Storage ครบ** ใน Supabase เดียว
- ✅ **QR PromptPay ฟรี 100%** ไม่ต้องผ่านธนาคาร
- ✅ **Slip verify อัตโนมัติ** ผ่าน EasySlip

---

## 📋 โครงสร้างหน้าเว็บ (Page Structure)

```
/                      → หน้าหลัก (สินค้า + ชำระเงิน)
/payment               → หน้า QR Code + upload สลิป
/payment/success       → หน้าขอบคุณ

/admin/login           → หน้า login backoffice
/admin/dashboard       → จัดการสินค้า (CRUD)
/admin/orders          → ดูออเดอร์ทั้งหมด
```

---

## 📦 Dependencies หลัก

```json
{
  "dependencies": {
    "next": "^14",
    "react": "^18",
    "@supabase/supabase-js": "latest",
    "@supabase/ssr": "latest",
    "promptpay-qr": "latest",
    "qrcode": "latest",
    "resend": "latest",
    "zod": "latest"
  }
}
```

---

## 🗺️ Flow การซื้อสินค้า

```
1. ลูกค้าเลือกจำนวน → กดชำระเงิน
2. ระบบ Generate PromptPay QR จากยอดรวม
3. ลูกค้าสแกน QR โอนเงิน
4. ลูกค้าอัพโหลดรูปสลิป
5. ระบบส่งสลิปไป EasySlip API ตรวจสอบ
6. ถ้าผ่าน → ส่งแจ้งเตือนหา Admin (LINE/Email)
7. ลดสต็อกอัตโนมัติ
8. แสดงหน้า success
```

---

## ❓ Open Questions

> [!IMPORTANT]
> โปรดตอบคำถามเหล่านี้เพื่อให้สามารถเริ่ม build ได้ถูกต้อง:
>
> 1. **PromptPay**: ต้องการ Gen QR จาก **เบอร์โทรศัพท์** หรือ **เลขบัญชีธนาคาร**?
> 2. **Notification**: ต้องการ **LINE OA**, **Email**, หรือ **ทั้งคู่**?
> 3. **สกุลเงิน**: ราคาหมอน (ต่อชิ้น) คือเท่าไหร่? และมีกี่ variant (ขนาด/สี)?
> 4. **Stack**: เห็นด้วยกับ Recommended Stack ด้านบนไหม? หรือต้องการเปลี่ยนอะไร?
> 5. **Slip Verify**: ยอมรับ manual verify (admin ตรวจเอง) ได้ไหม ถ้า EasySlip ไม่พอ?
