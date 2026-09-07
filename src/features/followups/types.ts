export type FollowUpPriority = 'low' | 'medium' | 'high';

export type FollowUpStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface FollowUp {
  id: string;
  patient_id: string;
  task: string;
  due_date: string;
  priority: FollowUpPriority;
  assigned_to: string | null;
  status: FollowUpStatus;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

/** Follow-up joined with patient fields, for the dashboard/global list. */
export interface FollowUpWithPatient extends FollowUp {
  patients: { full_name: string; phone: string } | null;
}

export interface FollowUpInput {
  patient_id: string;
  task: string;
  due_date: string;
  priority: FollowUpPriority;
  assigned_to: string | null;
  notes: string | null;
}
