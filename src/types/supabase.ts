// Types pour les tables Supabase de Lyss
// Générés manuellement - à synchroniser avec le schéma réel

export interface AuditLog {
  id: string;
  user_id: string;
  entity_type: 'invoice' | 'client' | 'payment' | 'sequence' | 'user' | 'system';
  entity_id: string;
  action: 'create' | 'update' | 'delete' | 'view' | 'export' | 'import' | 'send' | 'remind' | 'paid' | 'disputed';
  details: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface CallLog {
  id: string;
  invoice_id: string;
  client_name: string;
  phone_number: string;
  direction: 'inbound' | 'outbound';
  status: 'completed' | 'missed' | 'voicemail' | 'busy' | 'failed';
  duration_seconds?: number;
  recording_url?: string;
  notes?: string;
  created_at: string;
}

export interface CollectionSequence {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  steps: SequenceStep[];
  is_active: boolean;
  company_id?: string;
  company_name?: string;
  auto_start: boolean;
  created_at: string;
  updated_at: string;
}

export interface SequenceStep {
  id: string;
  sequence_id: string;
  order: number;
  action: 'email' | 'sms' | 'call' | 'letter' | 'wait';
  template_id?: string;
  wait_days: number;
  conditions?: Record<string, any>;
  created_at: string;
}

export interface UserSettings {
  id: string;
  user_id: string;
  company_name?: string;
  company_address?: string;
  company_phone?: string;
  company_email?: string;
  default_payment_terms?: number;
  currency: string;
  timezone: string;
  language: string;
  notifications_enabled: boolean;
  auto_start_sequences: boolean;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  user_id: string;
  client_name: string;
  client_email?: string;
  client_phone?: string;
  invoice_number: string;
  amount: number;
  currency: string;
  due_date: string;
  status: 'draft' | 'sent' | 'viewed' | 'overdue' | 'paid' | 'disputed' | 'cancelled';
  description?: string;
  items?: InvoiceItem[];
  notes?: string;
  payment_method?: string;
  paid_at?: string;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

// Types pour les nouvelles fonctionnalités
export interface Appointment {
  id: string;
  user_id: string;
  appointment_type_id: string;
  client_name: string;
  client_email?: string;
  client_phone?: string;
  title?: string;
  description?: string;
  start_time: string;
  end_time: string;
  status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  meeting_link?: string;
  location?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface AppointmentType {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  duration_minutes: number;
  color: string;
  price?: number;
  is_active: boolean;
  created_at: string;
}

export interface AvailableSlot {
  id: string;
  user_id: string;
  appointment_type_id: string;
  start_time: string;
  end_time: string;
  is_booked: boolean;
  created_at: string;
}

// Types pour les intégrations
export interface QuickBooksConnection {
  id: string;
  user_id: string;
  access_token: string;
  refresh_token: string;
  realm_id: string;
  expires_at: string;
  is_active: boolean;
  last_sync_at?: string;
  created_at: string;
  updated_at: string;
}

export interface SageConnection {
  id: string;
  user_id: string;
  access_token: string;
  refresh_token: string;
  company_id: string;
  expires_at: string;
  is_active: boolean;
  last_sync_at?: string;
  created_at: string;
  updated_at: string;
}

// Type utilitaire pour les réponses Supabase
export type SupabaseResponse<T> = {
  data: T | null;
  error: any | null;
};
