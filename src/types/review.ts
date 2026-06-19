export interface Review {
  id: string;
  product_id: string;
  customer_name: string;
  image_urls: string[];
  rating: number; // Stored as numeric/float (e.g. 4.5)
  comment: string;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
  products?: {
    name: string;
  } | null;
}
