import { NextResponse } from "next/server";
import { retrieveOmiseCharge } from "@/utils/omise";
import { syncOmiseChargeToOrder } from "@/utils/omise-order";

interface OmiseWebhookEvent {
  key?: string;
  data?: { id?: string; object?: string };
}

export async function POST(req: Request) {
  try {
    const event = (await req.json()) as OmiseWebhookEvent;
    if (!event.key?.startsWith("charge.") || event.data?.object !== "charge" || !event.data.id) {
      return NextResponse.json({ received: true, ignored: true });
    }

    // Omise recommends retrieving the charge independently. We never trust the
    // webhook payload alone for the paid flag, amount, currency, or metadata.
    const charge = await retrieveOmiseCharge(event.data.id);
    const result = await syncOmiseChargeToOrder(charge);
    return NextResponse.json({ received: true, ...result });
  } catch (error: unknown) {
    console.error("Omise webhook processing error:", error);
    const message = error instanceof Error ? error.message : "Webhook processing failed";
    // A non-2xx response lets Omise retry temporary database/API failures.
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
