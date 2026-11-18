export interface ActivityTrendPoint {
  date: string;
  day_name: string;
  mutations: number;
  signups: number;
  total_ops: number;
}

export interface AnalyticsData {
  range: string;
  activity_trends: ActivityTrendPoint[];
  peak_date: string;
  peak_ops: number;
  total_period_ops: number;
  operations_breakdown: Record<string, number>;
}

export interface OverviewMetrics {
  total_users: number;
  active_users_30d: number;
  suspended_users: number;
  public_playlists: number;
  total_mutations: number;
  open_reports: number;
  active_announcements: number;
  current_stable: string;
  current_beta: string;
}

export interface SystemHealth {
  database: string;
  latency_ms: number;
  storage: string;
  auth: string;
}

export interface OverviewResponse {
  metrics: OverviewMetrics;
  analytics: AnalyticsData;
  system_health: SystemHealth;
}

export interface UserRecord {
  id: string;
  firebase_uid: string;
  email: string | null;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  profile_visibility: string;
  account_status: string;
  created_at: string;
  last_seen_at: string;
}

export interface AppRelease {
  id: string;
  platform: string;
  channel: string;
  version_code: number;
  version_name: string;
  min_supported_version_code: number;
  package_name: string;
  download_url: string;
  sha256: string;
  file_size_bytes: number;
  release_notes: string;
  rollout_percentage: number;
  status: string;
  mandatory: boolean;
  published_at: string | null;
  scheduled_release_at?: string | null;
  r2_object_key?: string | null;
  is_landing_primary?: boolean;
}

export interface LandingScreenshot {
  url: string;
  order: number;
  caption?: string;
}

export interface LandingContent {
  id: number;
  is_active: boolean;
  hero_headline: string;
  hero_subtext: string;
  alert_banner_enabled: boolean;
  alert_banner_text: string | null;
  alert_banner_type: 'info' | 'emerald' | 'amber' | 'rose';
  alert_banner_link: string | null;
  screenshots: LandingScreenshot[];
  created_at?: string;
  updated_at?: string;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  severity: string;
  target_channel: string | null;
  status: string;
  created_at: string;
}

export interface AuditLog {
  id: number;
  actor_user_id: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  reason: string | null;
  created_at: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

export async function fetchWithAuth(endpoint: string, options: RequestInit = {}): Promise<Response> {
  // In development, supply dev-admin bearer token if no auth session is active
  const token = typeof window !== 'undefined' ? (localStorage.getItem('melo_admin_token') || 'dev-admin-1') : 'dev-admin-1';
  
  const headers = new Headers(options.headers || {});
  headers.set('Authorization', `Bearer ${token}`);
  headers.set('Content-Type', 'application/json');

  return fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });
}

export async function getOverview(range = '7d'): Promise<OverviewResponse> {
  const res = await fetchWithAuth(`/v1/admin/overview?range=${encodeURIComponent(range)}`);
  if (!res.ok) throw new Error('Failed to load overview metrics');
  return res.json();
}

export async function getUsers(query = ''): Promise<{ users: UserRecord[]; count: number }> {
  const res = await fetchWithAuth(`/v1/admin/users?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error('Failed to load users');
  return res.json();
}

export async function updateUserStatus(userId: string, status: string, reason: string): Promise<void> {
  const res = await fetchWithAuth(`/v1/admin/users/${userId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, reason }),
  });
  if (!res.ok) throw new Error('Failed to update user status');
}

export interface UploadAPKResponse {
  success: boolean;
  filename: string;
  file_size_bytes: number;
  sha256: string;
  download_url: string;
  r2_object_key: string;
}

export async function uploadReleaseAPK(file: File): Promise<UploadAPKResponse> {
  const token = typeof window !== 'undefined' ? (localStorage.getItem('melo_admin_token') || 'dev-admin-1') : 'dev-admin-1';
  const formData = new FormData();
  formData.append('apk', file);

  const res = await fetch(`${API_BASE}/v1/admin/releases/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to upload APK');
  }

  return res.json();
}

export async function getReleases(): Promise<{ releases: AppRelease[] }> {
  const res = await fetchWithAuth('/v1/admin/releases');
  if (!res.ok) throw new Error('Failed to load releases');
  return res.json();
}

export async function unlockRelease(id: string): Promise<void> {
  const res = await fetchWithAuth(`/v1/admin/releases/${id}/unlock`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to unlock release');
}

export async function createRelease(release: Partial<AppRelease>): Promise<AppRelease> {
  const res = await fetchWithAuth('/v1/admin/releases', {
    method: 'POST',
    body: JSON.stringify(release),
  });
  if (!res.ok) throw new Error('Failed to create release');
  const data = await res.json();
  return data.release;
}

export async function createAnnouncement(announcement: Partial<Announcement>): Promise<Announcement> {
  const res = await fetchWithAuth('/v1/admin/announcements', {
    method: 'POST',
    body: JSON.stringify(announcement),
  });
  if (!res.ok) throw new Error('Failed to create announcement');
  const data = await res.json();
  return data.announcement;
}

export async function sendPushNotification(payload: { title: string; body: string; topic?: string; token?: string }): Promise<void> {
  const res = await fetchWithAuth('/v1/admin/notifications/send', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to dispatch push notification');
  }
}

export async function getAuditLogs(): Promise<{ audit_logs: AuditLog[] }> {
  const res = await fetchWithAuth('/v1/admin/audit-logs');
  if (!res.ok) throw new Error('Failed to load audit logs');
  return res.json();
}

export async function getLandingContent(): Promise<{ content: LandingContent }> {
  const res = await fetchWithAuth('/v1/admin/landing/content');
  if (!res.ok) throw new Error('Failed to load landing content');
  return res.json();
}

export async function updateLandingContent(content: Partial<LandingContent>): Promise<{ success: boolean; content: LandingContent }> {
  const res = await fetchWithAuth('/v1/admin/landing/content', {
    method: 'PUT',
    body: JSON.stringify(content),
  });
  if (!res.ok) throw new Error('Failed to update landing content');
  return res.json();
}
