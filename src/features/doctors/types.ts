export interface Doctor {
  id: string;
  full_name: string;
  specialty: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DoctorInput {
  full_name: string;
  specialty: string | null;
  is_active: boolean;
}
