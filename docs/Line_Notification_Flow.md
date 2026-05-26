# 💬 LINE OA Messaging API Notification Flow for Admin

เนื่องจาก **LINE Notify** ปิดบริการแล้ว (เมื่อ 31 มีนาคม 2025) การส่งข้อความแจ้งเตือนหา Admin จึงต้องทำผ่าน **LINE Messaging API** แทน ซึ่งมีขั้นตอนการทำงานและสถาปัตยกรรมดังนี้ครับ:

---

## ⚙️ Concept & Architecture

กลไกหลักคือเราจะใช้ฟีเจอร์ **"Push Message"** ของ LINE Messaging API เพื่อส่งข้อความจากระบบเซิร์ฟเวอร์ของเรา (Next.js API Route) ตรงไปยัง LINE ส่วนตัวของแอดมิน (Admin's Personal LINE Account) โดยอาศัย LINE Official Account (LINE OA) เป็นตัวส่ง

```
┌─────────────────┐       ┌──────────────────┐       ┌───────────────┐
│ Next.js Backend │ ────> │ LINE Gateway API │ ────> │ Admin's LINE  │
│ (API Routes)    │       │ (Messaging API)  │       │ (App Alert)   │
└─────────────────┘       └──────────────────┘       └───────────────┘
  • API Key/Token           • Verified HTTPS           • Flex Message
  • Order & Slip URL        • Payload validation       • Direct Push
```

---

## 🗺️ ขั้นตอนอย่างละเอียด (Step-by-Step Flow)

### Step 1: ค้นหา LINE User ID ของแอดมิน (ผู้รับแจ้งเตือน)
LINE Messaging API ไม่สามารถใช้ "เบอร์โทร" หรือ "Line ID" ปกติในการส่งข้อความตรงได้ แต่จะต้องส่งผ่าน **LINE User ID** (ซึ่งเป็นค่าเฉพาะ ขึ้นต้นด้วยตัว `U` ตามด้วยอักษรภาษาอังกฤษและตัวเลข 32 หลัก เช่น `U1234567890abcdef1234567890abcdef`)

**วิธีหา User ID ของแอดมิน (ทำแค่ครั้งแรกครั้งเดียว):**
1. แอดมินต้องทำการ **เพิ่มเพื่อน (Add Friend)** กับ LINE OA ของร้านก่อน
2. เข้าไปที่หน้าเว็บ **LINE Developers Console** -> **Messaging API tab**
3. ที่หัวข้อ **Your user ID** ด้านล่างสุด จะมีรหัส User ID ของแอดมินแสดงอยู่ (สามารถคัดลอกมาใช้เป็น `LINE_ADMIN_USER_ID` ใน `.env` ได้ทันที)

---

### Step 2: สร้างข้อความแบบสวยงามด้วย LINE Flex Message
เพื่อให้อ่านง่ายและแอดมินสามารถตรวจสอบได้อย่างมีประสิทธิภาพ เราจะใช้ **Flex Message** ซึ่งสามารถจัดหน้าตาให้เหมือนบัตรคิวหรือใบเสร็จรับเงิน รวมถึงสามารถคลิกดูรูปสลิปหรือกดปุ่มตรวจสอบได้โดยตรงจากห้องแชท

**ตัวอย่างโครงสร้าง JSON ของ Flex Message:**
```json
{
  "to": "LINE_ADMIN_USER_ID",
  "messages": [
    {
      "type": "flex",
      "altText": "แจ้งเตือนคำสั่งซื้อใหม่! 🛒",
      "contents": {
        "type": "bubble",
        "header": {
          "type": "box",
          "layout": "vertical",
          "contents": [
            {
              "type": "text",
              "text": "🛒 คำสั่งซื้อใหม่ (รอการยืนยัน)",
              "weight": "bold",
              "color": "#1DB954",
              "size": "md"
            }
          ]
        },
        "body": {
          "type": "box",
          "layout": "vertical",
          "contents": [
            {
              "type": "text",
              "text": "หมอน Crystal Dreams (1 ชิ้น)",
              "weight": "bold",
              "size": "xl"
            },
            {
              "type": "separator",
              "margin": "md"
            },
            {
              "type": "box",
              "layout": "vertical",
              "margin": "md",
              "contents": [
                {
                  "type": "text",
                  "text": "👤 ลูกค้า: คุณสมชาย ดีใจ",
                  "size": "sm"
                },
                {
                  "type": "text",
                  "text": "📞 เบอร์โทร: 081-234-5678",
                  "size": "sm"
                },
                {
                  "type": "text",
                  "text": "📍 ที่อยู่: 123/45 ถนนสีลม แขวงสุริยวงศ์ เขตบางรัก กทม. 10500",
                  "size": "sm",
                  "wrap": true
                },
                {
                  "type": "text",
                  "text": "💰 ยอดโอน: 1,890 บาท",
                  "weight": "bold",
                  "color": "#111111",
                  "size": "sm"
                }
              ]
            }
          ]
        },
        "footer": {
          "type": "box",
          "layout": "vertical",
          "contents": [
            {
              "type": "button",
              "action": {
                "type": "uri",
                "label": "🖼️ ดูรูปสลิปการโอน",
                "uri": "https://supabase-storage-url.com/slip-image.jpg"
              },
              "style": "primary",
              "color": "#1DB954"
            },
            {
              "type": "button",
              "action": {
                "type": "uri",
                "label": "⚙️ ไปหลังบ้านเพื่อตรวจสอบ",
                "uri": "https://your-domain.vercel.app/admin/orders"
              },
              "style": "secondary",
              "margin": "sm"
            }
          ]
        }
      }
    }
  ]
}
```

---

### Step 3: โค้ดสำหรับส่งแจ้งเตือนใน Next.js (Backend API Route)

เมื่อลูกค้ากดส่งสลิปและข้อมูลที่อยู่แล้ว Next.js จะส่ง Request ไปยัง LINE API ด้วยฟังก์ชันนี้:

```typescript
// app/api/notify/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { orderId, customerName, customerTel, customerAddress, amount, slipUrl } = await req.json();

    const lineAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    const adminUserId = process.env.LINE_ADMIN_USER_ID;

    if (!lineAccessToken || !adminUserId) {
      console.error('Missing LINE Env variables');
      return NextResponse.json({ error: 'Config error' }, { status: 500 });
    }

    // สร้าง Flex Message Payload
    const payload = {
      to: adminUserId,
      messages: [
        {
          type: 'flex',
          altText: `คำสั่งซื้อใหม่จาก ${customerName} ยอด ${amount} บาท`,
          contents: {
            type: 'bubble',
            // ... (ใส่โครงสร้าง Flex Message JSON ที่เตรียมไว้จาก Step 2)
          }
        }
      ]
    };

    // ส่งคำขอแบบ POST ไปยัง LINE API
    const response = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${lineAccessToken}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`LINE API responded with error: ${errText}`);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('LINE Notification failed:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

---

## 💡 สรุปข้อจำกัดและข้อควรระวัง (Free Tier)
1. **จำกัดโควต้าฟรี**: LINE Messaging API มีโควต้าส่ง Push Message ฟรีอยู่ที่ **200 ข้อความ/เดือน** (นับรวมการแจ้งเตือนทั้งหมด) หากคำสั่งซื้อต่อเดือนเกิน 200 รายการ จะต้องเสียค่าบริการรายเดือนเพิ่มให้กับ LINE (ประมาณ 1,200 บาท/เดือน ได้ 15,000 ข้อความ)
2. **การแอดไลน์**: แอดมินต้องแอดไลน์ OA ของบอทไว้เสมอและห้ามบล็อก เพื่อให้บอทส่งข้อความ Direct Push เข้ามาหาได้
