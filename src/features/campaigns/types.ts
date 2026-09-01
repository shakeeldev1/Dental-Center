export type AudienceType = 'all' | 'recent' | 'inactive' | 'csv';
export type CampaignStatus = 'draft' | 'sending' | 'completed' | 'failed';

export interface Campaign {
  id: string;
  name: string;
  offer: string | null;
  message: string;
  audience_type: AudienceType;
  status: CampaignStatus;
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  created_at: string;
  updated_at: string;
}

export const AUDIENCE_LABEL: Record<AudienceType, string> = {
  all: 'All patients',
  recent: 'Recent patients',
  inactive: 'Inactive patients',
  csv: 'Custom list (upload CSV)',
};

export const CAMPAIGN_STATUS_TONE: Record<CampaignStatus, 'gray' | 'amber' | 'green' | 'red'> = {
  draft: 'gray',
  sending: 'amber',
  completed: 'green',
  failed: 'red',
};
