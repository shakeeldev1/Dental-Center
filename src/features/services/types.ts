export interface Service {
  id: string;
  name: string;
  category: string | null;
  is_active: boolean;
  duration_minutes: number | null;
  price: number | null;
  created_at: string;
  updated_at: string;
}

export interface ServiceInput {
  name: string;
  category: string | null;
  is_active: boolean;
  duration_minutes: number | null;
  price: number | null;
}
