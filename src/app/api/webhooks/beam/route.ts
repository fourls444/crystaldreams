import { NextResponse } from "next/server";
import { retrieveBeamCharge } from "@/utils/beam";
import { syncBeamChargeToOrder } from "@/utils/beam-order";

interface BeamWebhookEvent {
  eventType?: string;
  data?: { id?: string; object?: string };
}

export async function POST(req: Request) {
  try {
    const event = (await req.json()) as BeamWebhookEvent;
    if (!event.eventType?.startsWith("charge.") || !event.data?.id) {
      return NextResponse.json({ received: true, ignored: true });
    }

    // Always retrieve the charge independently from Beam API.
    // We never trust the webhook payload alone for the paid flag, amount, or metadata.
    const charge = await retrieveBeamCharge(event.data.id);
    const result = await syncBeamChargeToOrder(charge);
    return NextResponse.json({ received: true, ...result });
  } catch (error: unknown) {
    console.error("Beam webhook processing error:", error);
    const message = error instanceof Error ? error.message : "Webhook processing failed";
    // A non-2xx response lets Beam retry temporary database/API failures.
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";
