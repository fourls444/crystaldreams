/**
 * Helper to mask telephone number for application logs.
 */
export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return "N/A";
  const trimmed = phone.trim();
  if (trimmed.length < 7) return "***";
  return trimmed.substring(0, 3) + "-***-" + trimmed.substring(trimmed.length - 4);
}

/**
 * Helper to mask shipping address for application logs.
 */
export function maskAddress(address: string | null | undefined): string {
  if (!address) return "N/A";
  const trimmed = address.trim();
  if (trimmed.length < 15) return trimmed.substring(0, 8) + "...";
  return trimmed.substring(0, 10) + "... [ที่อยู่จัดส่งเต็มรูปแบบถูกเข้ารหัสในระบบเพื่อความปลอดภัย]";
}

interface NotificationParams {
  orderId: string;
  customerName: string;
  customerTel: string;
  customerAddress: string;
  customerLine?: string;
  amount: number;
  slipUrl?: string;
  status: "pending" | "slip_uploaded" | "verified" | "rejected" | "cod_pending";
  senderName?: string;
  mode?: string;
}

/**
 * Sends notifications to the admin via LINE OA Messaging API.
 * Automatically falls back to sending an email via Resend API if LINE fails.
 */
export async function sendAdminNotification(params: NotificationParams): Promise<{ success: boolean; method: "line" | "resend" | "none"; error?: string }> {
  const lineAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const adminUserId = process.env.LINE_ADMIN_USER_ID;
  const resendApiKey = process.env.RESEND_API_KEY;
  const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Safe logs (Masking telephone and address to protect data privacy in public logs)
  const maskedTel = maskPhone(params.customerTel);
  const maskedAddress = maskAddress(params.customerAddress);
  
  console.log(`[Notification Service] Initiating notification for Order ID: ${params.orderId}, Status: ${params.status}`);
  console.log(`[Notification Service] Customer: ${params.customerName}, Phone: ${maskedTel}, Address: ${maskedAddress}`);

  // 1. Prepare LINE Flex Message Payload
  let statusText = "คำสั่งซื้อใหม่ (รอการยืนยัน)";
  let statusColor = "#1DB954"; // Greenish
  if (params.status === "verified") {
    statusText = `ชำระเงินสำเร็จ (ยืนยันแล้ว: ${params.senderName || "auto"})`;
    statusColor = "#1e3a8a"; // Dark blue
  } else if (params.status === "rejected") {
    statusText = "ปฏิเสธสลิป / ยกเลิกคำสั่งซื้อ";
    statusColor = "#ef4444"; // Red
  } else if (params.status === "cod_pending") {
    statusText = "ออเดอร์เก็บเงินปลายทาง (รอการจัดส่ง)";
    statusColor = "#d97706"; // Amber/Orange
  }
 
  const amountLabelText = params.status === "cod_pending" ? "ยอดชำระปลายทาง" : "ยอดโอน";
  const altText = `📢 [Crystal Dreams] ${statusText} - ออเดอร์ ${params.orderId} ${amountLabelText} ${params.amount} บาท`;

  const flexContents = {
    type: "bubble",
    header: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: statusText,
          weight: "bold",
          color: statusColor,
          size: "md",
        },
      ],
    },
    body: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: `คำสั่งซื้อ: ${params.orderId}`,
          weight: "bold",
          size: "sm",
          color: "#64748b",
        },
        {
          type: "separator",
          margin: "md",
        },
        {
          type: "box",
          layout: "vertical",
          margin: "md",
          spacing: "sm",
          contents: [
            {
              type: "text",
              text: `👤 ลูกค้า: คุณ${params.customerName}`,
              size: "sm",
            },
            {
              type: "text",
              text: `📞 เบอร์โทร: ${params.customerTel}`, // Private channel receives original data
              size: "sm",
            },
            ...(params.customerLine
              ? [
                  {
                    type: "text",
                    text: `💬 Line ID: ${params.customerLine}`,
                    size: "sm",
                  },
                ]
              : []),
            {
              type: "text",
              text: `📍 ที่อยู่: ${params.customerAddress}`, // Private channel receives original data
              size: "sm",
              wrap: true,
            },
            {
              type: "text",
              text: `💰 ${amountLabelText}: ${params.amount.toLocaleString()} บาท`,
              weight: "bold",
              color: "#111111",
              size: "sm",
            },
          ],
        },
      ],
    },
    footer: {
      type: "box",
      layout: "vertical",
      spacing: "sm",
      contents: [
        ...(params.slipUrl
          ? [
              {
                type: "button",
                action: {
                  type: "uri",
                  label: "🖼️ ดูรูปสลิปการโอน",
                  uri: params.slipUrl,
                },
                style: "primary",
                color: "#1DB954",
              } as const,
            ]
          : []),
        {
          type: "button",
          action: {
            type: "uri",
            label: "⚙️ ตรวจสอบระบบหลังบ้าน",
            uri: `${appUrl}/admin?view=orders`,
          },
          style: "secondary",
        } as const,
      ],
    },
  };

  const linePayload = {
    to: adminUserId,
    messages: [
      {
        type: "flex",
        altText: altText,
        contents: flexContents,
      },
    ],
  };

  // 2. Try Sending via LINE Messaging API
  if (lineAccessToken && adminUserId && lineAccessToken !== "your-line-token" && adminUserId !== "your-admin-line-id") {
    try {
      const response = await fetch("https://api.line.me/v2/bot/message/push", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${lineAccessToken}`,
        },
        body: JSON.stringify(linePayload),
      });

      if (response.ok) {
        console.log(`[Notification Service] Successfully sent LINE notification for Order ID: ${params.orderId}`);
        return { success: true, method: "line" };
      } else {
        const errText = await response.text();
        console.warn(`[Notification Service] LINE API responded with error: ${errText}. Attempting fallback...`);
      }
    } catch (lineError) {
      console.error(`[Notification Service] Failed to send LINE push message:`, lineError, "Attempting fallback...");
    }
  } else {
    console.warn(`[Notification Service] LINE credentials missing or default placeholder found. Attempting fallback...`);
  }

  // 3. Fallback to Resend Email API
  if (resendApiKey) {
    try {
      const subject = `📢 [Crystal Dreams Update] ${statusText} - ออเดอร์ ${params.orderId}`;
      const htmlContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: ${statusColor}; margin-top: 0;">${statusText}</h2>
          <p><strong>Order ID:</strong> ${params.orderId}</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0;" />
          <h3>รายละเอียดลูกค้า</h3>
          <p><strong>ชื่อผู้รับ:</strong> คุณ${params.customerName}</p>
          <p><strong>เบอร์โทรศัพท์:</strong> ${params.customerTel}</p>
          ${params.customerLine ? `<p><strong>Line ID:</strong> ${params.customerLine}</p>` : ""}
          <p><strong>ที่อยู่จัดส่ง:</strong> ${params.customerAddress}</p>
          <p><strong>${amountLabelText}:</strong> ${params.amount.toLocaleString()} บาท</p>
          ${params.slipUrl ? `<p><a href="${params.slipUrl}" style="display: inline-block; padding: 10px 20px; background-color: #1DB954; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">ดูรูปภาพสลิปที่อัปโหลด</a></p>` : ""}
          <p><a href="${appUrl}/admin?view=orders" style="display: inline-block; padding: 10px 20px; background-color: #1e3a8a; color: white; text-decoration: none; border-radius: 4px; font-weight: bold; margin-top: 10px;">จัดการคำสั่งซื้อหลังบ้าน</a></p>
        </div>
      `;

      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: "Crystal Dreams Admin Alert <onboarding@resend.dev>",
          to: adminEmail,
          subject: subject,
          html: htmlContent,
        }),
      });

      if (response.ok) {
        console.log(`[Notification Service] Successfully sent Fallback Email via Resend API for Order ID: ${params.orderId}`);
        return { success: true, method: "resend" };
      } else {
        const errText = await response.text();
        console.error(`[Notification Service] Resend API responded with error: ${errText}`);
        return { success: false, method: "none", error: errText };
      }
    } catch (emailError: unknown) {
      const errMsg = emailError instanceof Error ? emailError.message : "Unknown error";
      console.error(`[Notification Service] Failed to send fallback email:`, emailError);
      return { success: false, method: "none", error: errMsg };
    }
  }

  console.error(`[Notification Service] Notification failed. Both LINE and Resend API configs are unavailable.`);
  return { success: false, method: "none", error: "LINE and Resend configuration not set up" };
}
