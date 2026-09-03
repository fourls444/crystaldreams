# Beam Payment Gateway Setup

คู่มือตั้งค่าระบบชำระเงินผ่าน Beam สำหรับ CrystalDreams

## 1. สร้าง Merchant Account

1. ลงทะเบียนที่ [lighthouse.beamcheckout.com/signup](https://lighthouse.beamcheckout.com/signup)
2. เข้า Lighthouse Dashboard เพื่อจัดการ API Keys และ Webhooks

## 2. Environment Variables

เพิ่มค่าต่อไปนี้ใน `.env.local` (หรือ Vercel Environment Variables):

```env
BEAM_API_KEY=your_beam_api_key_here
NEXT_PUBLIC_APP_URL=https://crystaldreams.vercel.app
```

### Optional

```env
# Override base URL (เช่น สำหรับ Playground/Sandbox)
BEAM_API_BASE_URL=https://api-playground.beamcheckout.com
```

> **หมายเหตุ**: Production base URL จะเป็น `https://api.beamcheckout.com` โดยอัตโนมัติ

## 3. ตั้งค่า Webhook

1. เข้า Beam Lighthouse Dashboard → Webhooks
2. เพิ่ม Webhook URL: `https://crystaldreams.vercel.app/api/webhooks/beam`
3. เลือก Event: `charge.completed`, `charge.failed`, `charge.expired`

## 4. Environments

| Environment | Base URL | API Key |
|---|---|---|
| Playground (Sandbox) | `https://api-playground.beamcheckout.com` | จาก Playground section ใน Lighthouse |
| Production | `https://api.beamcheckout.com` | จาก Production section ใน Lighthouse |

> **สำคัญ**: API Key ของ Playground และ Production แยกกัน ใช้ข้ามกันไม่ได้

## 5. Database Migration

รัน SQL ใน Supabase SQL Editor:

```sql
-- ดู sql/migrate-beam.sql สำหรับ full migration script
```

ไฟล์ migration อยู่ที่ `sql/migrate-beam.sql`

## 6. API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/payment/beam/promptpay` | POST | สร้าง PromptPay QR charge |
| `/api/webhooks/beam` | POST | รับ webhook จาก Beam |
| `/api/orders/[id]/payment-status` | GET | ตรวจสอบสถานะชำระเงิน |

## 7. เอกสารอ้างอิง

- [Beam API Docs](https://docs.beamcheckout.com/get-started/introduction)
- [Beam Charges API](https://docs.beamcheckout.com/charges/charges-api)
- [Beam Charges Integration Guide](https://docs.beamcheckout.com/charges/charges-integration)
