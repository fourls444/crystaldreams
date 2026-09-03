export type LocalPaymentStatus = "pending" | "paid" | "failed" | "expired";

export interface BeamCharge {
  id: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethodType?: string | null;
  paidAt?: string | null;
  failureCode?: string | null;
  failureMessage?: string | null;
  metadata?: Record<string, string> | null;
  paymentInstructions?: {
    qrPromptPay?: {
      qrImageUrl?: string | null;
      qrRawData?: string | null;
    } | null;
  } | null;
}

interface ChargeStatusLike {
  status?: string | null;
}

interface ExpectedCharge {
  id: string;
  amountSatang: number;
  chargeId: string;
}

interface CreatePromptPayChargeInput {
  amountSatang: number;
  orderId: string;
  description: string;
  redirectUrl?: string;
}

export class BeamApiError extends Error {
  readonly status: number;

  constructor(
    message: string,
    status: number,
  ) {
    super(message);
    this.name = "BeamApiError";
    this.status = status;
  }
}

export function mapBeamPaymentStatus(charge: ChargeStatusLike): LocalPaymentStatus {
  if (charge.status === "completed") return "paid";
  if (charge.status === "failed") return "failed";
  if (charge.status === "expired") return "expired";
  if (charge.status === "voided") return "failed";
  return "pending";
}

export function getPromptPayQrUrl(charge: Partial<BeamCharge>): string | null {
  const url = charge.paymentInstructions?.qrPromptPay?.qrImageUrl;
  return typeof url === "string" && url.startsWith("https://") ? url : null;
}

export function validateSuccessfulPromptPayCharge(
  charge: Partial<BeamCharge>,
  expected: ExpectedCharge,
): boolean {
  return (
    charge.id === expected.chargeId &&
    charge.status === "completed" &&
    charge.amount === expected.amountSatang &&
    charge.currency?.toUpperCase() === "THB" &&
    (charge.paymentMethodType === "QR_PROMPT_PAY" || charge.paymentMethodType === "qr_prompt_pay") &&
    charge.metadata?.orderId === expected.id
  );
}

function getApiKey(): string {
  const apiKey = process.env.BEAM_API_KEY;
  if (!apiKey) {
    throw new BeamApiError("ยังไม่ได้ตั้งค่า BEAM_API_KEY", 500);
  }
  return apiKey;
}

function getBaseUrl(): string {
  const key = getApiKey();
  // Playground keys typically start with specific prefixes.
  // Allow explicit override via env var for clarity.
  if (process.env.BEAM_API_BASE_URL) return process.env.BEAM_API_BASE_URL;
  // Default to production
  return "https://api.beamcheckout.com";
}

async function beamRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${getBaseUrl()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as
    | { message?: string; code?: string; error?: string }
    | T
    | null;

  if (!response.ok) {
    const errorPayload = payload as { message?: string; code?: string; error?: string } | null;
    throw new BeamApiError(
      errorPayload?.message || errorPayload?.error || errorPayload?.code || "Beam API ไม่สามารถดำเนินการได้",
      response.status,
    );
  }

  return payload as T;
}

export async function createPromptPayCharge(
  input: CreatePromptPayChargeInput,
): Promise<BeamCharge> {
  const body: Record<string, unknown> = {
    amount: input.amountSatang,
    currency: "THB",
    paymentMethodType: "QR_PROMPT_PAY",
    description: input.description,
    metadata: { orderId: input.orderId },
  };

  if (input.redirectUrl) body.redirectUrl = input.redirectUrl;

  return beamRequest<BeamCharge>("/v1/charges", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function retrieveBeamCharge(chargeId: string): Promise<BeamCharge> {
  if (!/^chrg_[a-zA-Z0-9_]+$/.test(chargeId)) {
    throw new BeamApiError("รูปแบบ Beam Charge ID ไม่ถูกต้อง", 400);
  }
  return beamRequest<BeamCharge>(`/v1/charges/${encodeURIComponent(chargeId)}`);
}
