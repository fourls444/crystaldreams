/**
 * Shared Order type used across all admin components.
 * Extract here to avoid duplication across multiple files.
 */
export interface OrderItem {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  image_url: string | null;
}

export interface Order {
  id: string;
  product_id: string | null;
  quantity: number;
  total_amount: number;
  customer_name: string | null;
  customer_tel: string | null;
  customer_address: string | null;
  /** 'pending' | 'slip_uploaded' | 'cod_pending' | 'verified' | 'rejected' */
  status: string;
  slip_url: string | null;
  slip_verified: boolean;
  verified_by: string | null;
  payment_method?: string | null;
  created_at: string;
  products?: {
    name: string;
  } | null;
  items?: OrderItem[] | null;
}
