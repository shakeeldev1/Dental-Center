export type WaMessageType =
  | 'confirmation'
  | 'reminder_24h'
  | 'reminder_2h'
  | 'review'
  | 'treatment_reminder'
  | 'campaign'
  | 'manual';

export type WaMessageStatus = 'sent' | 'failed' | 'pending';
export type WaMessageDirection = 'outbound' | 'inbound';

export interface WhatsappMessage {
  id: string;
  patient_id: string | null;
  appointment_id: string | null;
  campaign_id: string | null;
  phone: string;
  direction: WaMessageDirection;
  message_type: WaMessageType;
  body: string | null;
  status: WaMessageStatus;
  provider_message_id: string | null;
  error_message: string | null;
  created_at: string;
  patient_name: string | null;
}
