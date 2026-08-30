export type Role = 'admin' | 'receptionist';

export type LanguageCode = 'en' | 'ar';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  is_active: boolean;
}
