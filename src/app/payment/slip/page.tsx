import { redirect } from "next/navigation";

export default async function LegacySlipPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string | string[] }>;
}) {
  const params = await searchParams;
  const rawOrderId = Array.isArray(params.orderId) ? params.orderId[0] : params.orderId;
  const query = rawOrderId ? `?orderId=${encodeURIComponent(rawOrderId)}` : "";
  redirect(`/payment/shipping${query}`);
}
