export type LocalPaymentStatus = "pending" | "paid" | "failed" | "expired";

export interface OmiseCharge {
  id: string;
  amount: number;
  currency: string;
  status: string;
  paid: boolean;
  paid_at?: string | null;
  failure_code?: string | null;
  failure_message?: string | null;
  metadata?: Record<string, string> | null;
  source?: {
    type?: string | null;
    scannable_code?: {
      image?: { download_uri?: string | null } | null;
    } | null;
  } | null;
}

interface ChargeStatusLike {
  status?: string | null;
  paid?: boolean | null;
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
  returnUri?: string;
}

export class OmiseApiError extends Error {
  readonly status: number;

  constructor(
    message: string,
    status: number,
  ) {
    super(message);
    this.name = "OmiseApiError";
    this.status = status;
  }
}

export function mapOmisePaymentStatus(charge: ChargeStatusLike): LocalPaymentStatus {
  if (charge.status === "successful" && charge.paid === true) return "paid";
  if (charge.status === "failed") return "failed";
  if (charge.status === "expired") return "expired";
  return "pending";
}

export function getPromptPayQrUrl(charge: Partial<OmiseCharge>): string | null {
  const url = charge.source?.scannable_code?.image?.download_uri;
  return typeof url === "string" && url.startsWith("https://") ? url : null;
}

export function validateSuccessfulPromptPayCharge(
  charge: Partial<OmiseCharge>,
  expected: ExpectedCharge,
): boolean {
  return (
    charge.id === expected.chargeId &&
    charge.status === "successful" &&
    charge.paid === true &&
    charge.amount === expected.amountSatang &&
    charge.currency?.toLowerCase() === "thb" &&
    charge.source?.type === "promptpay" &&
    charge.metadata?.order_id === expected.id
  );
}

function getSecretKey(): string {
  const secretKey = process.env.OMISE_SECRET_KEY;
  if (!secretKey) {
    throw new OmiseApiError("ยังไม่ได้ตั้งค่า OMISE_SECRET_KEY", 500);
  }
  return secretKey;
}

async function omiseRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`https://api.omise.co${path}`, {
    ...init,
    headers: {
      Authorization: `Basic ${Buffer.from(`${getSecretKey()}:`).toString("base64")}`,
      ...(init?.body ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
      ...init?.headers,
    },
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => null)) as
    | { message?: string; code?: string }
    | T
    | null;

  if (!response.ok) {
    const errorPayload = payload as { message?: string; code?: string } | null;
    throw new OmiseApiError(
      errorPayload?.message || errorPayload?.code || "Omise API ไม่สามารถดำเนินการได้",
      response.status,
    );
  }

  return payload as T;
}

export async function createPromptPayCharge(
  input: CreatePromptPayChargeInput,
): Promise<OmiseCharge> {
  const form = new URLSearchParams({
    amount: String(input.amountSatang),
    currency: "thb",
    description: input.description,
    "metadata[order_id]": input.orderId,
    "source[type]": "promptpay",
  });

  if (input.returnUri) form.set("return_uri", input.returnUri);

  return omiseRequest<OmiseCharge>("/charges", {
    method: "POST",
    body: form,
  });
}

export async function retrieveOmiseCharge(chargeId: string): Promise<OmiseCharge> {
  if (!/^chrg_(test_)?[a-zA-Z0-9]+$/.test(chargeId)) {
    throw new OmiseApiError("รูปแบบ Omise Charge ID ไม่ถูกต้อง", 400);
  }
  return omiseRequest<OmiseCharge>(`/charges/${encodeURIComponent(chargeId)}`);
}
