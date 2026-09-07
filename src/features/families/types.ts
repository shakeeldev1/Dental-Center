export interface Family {
  id: string;
  family_name: string;
  primary_contact_patient_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}
