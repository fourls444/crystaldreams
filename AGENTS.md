<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

<!-- BEGIN:supabase-security-agent-rules -->

# Supabase & Database Security Rules

- **Row Level Security (RLS)**: ทุกครั้งที่มีการสร้างหรือแก้ไข Table ใน `schema.sql` หรือรันคำสั่ง Database Migration กฎ RLS จะต้องถูกเขียนเสมอ
  - Table `products`: อนุญาตให้ `SELECT` เป็น Public (Anon) แต่ `INSERT`, `UPDATE`, `DELETE` ต้องทำได้เฉพาะ Authenticated Admin เท่านั้น
  - Table `orders`: อนุญาตให้ `INSERT` เป็น Public (ลูกค้ากรอกออเดอร์) แต่ `SELECT` และ `UPDATE` เพื่ออ่านประวัติหรือจัดการข้อมูล จะต้องทำได้เฉพาะ Authenticated Admin เท่านั้น (เว้นแต่การตรวจสอบสถานะออเดอร์เดี่ยวที่ใช้ ID แบบ UUID ที่ยากต่อการเดา)
- **Supabase Client**:
  - หากเขียนโค้ดใน Next.js Server Components, API Route Handlers หรือ Middleware ห้ามใช้ client ฝั่ง Browser แบบ Global เด็ดขาด ให้สร้าง client ผ่าน `@supabase/ssr` (`createRouteHandlerClient` หรือ `createServerComponentClient`) เสมอเพื่อความปลอดภัยของ Cookie Session

<!-- END:supabase-security-agent-rules -->

<!-- BEGIN:payment-verification-agent-rules -->

# Payment & Slip Verification Rules

- **Anti-Fraud (Slip Reuse)**: เพื่อป้องกันการสแกนสลิปซ้ำ ในตาราง `orders` ต้องเช็ค `slip_verified` หรือค่า `transRef` (Transaction Reference ID ที่ได้จาก EasySlip API) เสมอ หากมีออเดอร์อื่นใช้ `transRef` เดียวกันและสำเร็จไปแล้ว ให้ปฏิเสธออเดอร์นั้นทันทีและแจ้งเตือนแอดมินเฝ้าระวัง
- **Price & Amount Validation**: ทุกครั้งที่ประมวลผลการตรวจสอบจาก EasySlip API:
  - ต้องตรวจสอบว่าจำนวนเงินที่โอนจริง (`amount` จาก API) ตรงกับยอดชำระของคำสั่งซื้อ (`total_amount` ใน database) หรือไม่
  - ตรวจสอบชื่อบัญชีปลายทางผู้รับโอนว่าถูกต้องตรงกับเจ้าของร้าน
  - ตรวจสอบว่าวันที่ชำระเงินไม่เก่าเกินไป (ไม่ควรห่างจากเวลาสร้างออเดอร์เกิน 24 ชั่วโมง)
- **API Fallback**: หาก EasySlip API ใช้งานไม่ได้ชั่วคราว (เช่น Timeout หรือ Limit เกิน) ระบบต้องอัปเดตสถานะเป็น `slip_uploaded` แต่ตั้งค่าตรวจสอบเป็น `pending_manual` เพื่อรอให้แอดมินกดยืนยันเอง ห้ามปล่อยผ่านโดยไม่ได้ตรวจสอบ
<!-- END:payment-verification-agent-rules -->

<!-- BEGIN:line-notification-agent-rules -->

# LINE OA & Notification Rules

- **Format & Payload**: ในการส่งข้อมูลหาแอดมินผ่าน LINE Messaging API ให้ควบคุมขนาดของข้อความไม่ให้เกินขีดจำกัดของ API และออกแบบการ์ด Flex Message ให้รองรับการกดลิงก์ด่วนไปยัง `/admin/orders` เพื่อความสะดวกในการจัดการ
- **Resend Fallback**: หาก LINE Messaging API ทำงานล้มเหลวหรือจำกัดโควต้าฟรีหมด ให้สลับมาส่งเมลแจ้งเตือนหาแอดมินผ่าน **Resend API** เป็นแผนสำรองเสมอ
- **Data Privacy**: ห้ามแสดงที่อยู่จัดส่งเต็มรูปแบบและเบอร์โทรศัพท์ลงใน Public Application Logs (ป้องกันการรั่วไหลผ่าน Log Monitoring) ข้อมูลเหล่านี้ควรส่งตรงเข้าแชนแนลปิดของแอดมินเท่านั้น
<!-- END:line-notification-agent-rules -->

<!-- BEGIN:admin-auth-guard-rules -->

# Admin Access & Route Guard Rules

- **Route Guards**: ทุกหน้าที่อยู่ภายใต้พาร์ท `/admin/*` (เช่น Dashboard, Orders) ยกเว้น `/admin/login` ต้องถูกป้องกันด้วย Next.js Middleware เสมอ
- **Server-Side Protection**: นอกจากการใช้ CSS/JS ซ่อนปุ่มบน UI แล้ว ทุก API endpoint ที่ทำงานเบื้องหลัง เช่น `/api/orders/[id]/verify` หรือระบบหลังบ้านอื่นๆ จะต้องเช็คสิทธิ์ `isAdmin` จาก Supabase Auth Session ที่ฝั่งเซิร์ฟเวอร์เสมอ ป้องกันการยิง API เข้ามาโดยตรงจากภายนอก
<!-- END:admin-auth-guard-rules -->
