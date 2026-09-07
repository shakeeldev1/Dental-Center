export type ActivityEventType =
  | 'customer_created'
  | 'appointment_requested'
  | 'appointment_confirmed'
  | 'appointment_rescheduled'
  | 'appointment_cancelled'
  | 'appointment_completed'
  | 'appointment_no_show'
  | 'whatsapp_sent'
  | 'whatsapp_reply'
  | 'review_request_sent'
  | 'follow_up_created'
  | 'campaign_sent';

export interface ActivityLogEntry {
  id: string;
  patient_id: string;
  event_type: ActivityEventType;
  description: string;
  metadata: Record<string, unknown> | null;
  created_by: string | null;
  created_at: string;
}
