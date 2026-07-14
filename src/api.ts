import fetch from 'node-fetch';
import { Config, saveConfig } from './config';
import { refreshAccessToken } from './oauth';

// Refresh the access token this many milliseconds before it actually expires.
const EXPIRY_SKEW_MS = 60_000;

export class ApiClient {
  private config: Config;
  private baseUrl: string;
  // Env-provided keys are never written back to disk.
  private persist: boolean;

  constructor(config: Config) {
    this.config = { ...config };
    this.persist = !process.env.MAX_API_KEY;
    this.baseUrl = (process.env.MAX_API_URL || 'https://api.yourmax.ai').replace(/\/$/, '');
  }

  private isExpired(): boolean {
    if (!this.config.expiresAt) return false;
    return Date.now() >= this.config.expiresAt - EXPIRY_SKEW_MS;
  }

  private async refresh(): Promise<void> {
    if (!this.config.refreshToken) {
      throw new Error('Your session has expired. Run "max login" to reconnect.');
    }
    const tokens = await refreshAccessToken(this.config.refreshToken);
    this.config.accessToken = tokens.accessToken;
    this.config.refreshToken = tokens.refreshToken ?? this.config.refreshToken;
    this.config.expiresAt = tokens.expiresAt;
    this.config.tokenType = tokens.tokenType;
    if (this.persist) {
      saveConfig({
        accessToken: this.config.accessToken,
        refreshToken: this.config.refreshToken,
        expiresAt: this.config.expiresAt,
        tokenType: this.config.tokenType,
      });
    }
  }

  // Resolves a valid bearer token: env/legacy API keys are used as-is, OAuth
  // access tokens are proactively refreshed when expired.
  private async resolveToken(): Promise<string> {
    if (this.config.apiKey) return this.config.apiKey;
    if (this.config.accessToken) {
      if (this.isExpired()) await this.refresh();
      return this.config.accessToken!;
    }
    throw new Error('Not authenticated. Run "max login".');
  }

  private async request(endpoint: string, options: any = {}, retried = false): Promise<any> {
    const token = await this.resolveToken();
    const url = `${this.baseUrl}/api/v1${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    };

    const response = await fetch(url, { ...options, headers });

    if (response.status === 204) {
      return null;
    }

    // A 401 on an OAuth token may mean it was revoked/expired server-side;
    // try a single refresh + retry before surfacing the error.
    if (response.status === 401 && !retried && this.config.accessToken && this.config.refreshToken) {
      await this.refresh();
      return this.request(endpoint, options, true);
    }

    if (!response.ok) {
      const body = await response.text();
      let message: string;
      try {
        const json = JSON.parse(body);
        message = json.error || json.errors?.join(', ') || body;
      } catch {
        message = body;
      }
      throw new Error(`API Error (${response.status}): ${message}`);
    }

    return await response.json();
  }

  private businessPath(businessId: string) {
    return `/businesses/${businessId}`;
  }

  // Signals (public catalog)

  async listSignals() {
    return this.request('/signals', { method: 'GET' });
  }

  async getSignal(slug: string) {
    return this.request(`/signals/${encodeURIComponent(slug)}`, { method: 'GET' });
  }

  // Businesses

  async listBusinesses() {
    return this.request('/businesses', { method: 'GET' });
  }

  async getBusiness(id: string) {
    return this.request(`/businesses/${id}`, { method: 'GET' });
  }

  async createBusiness(data: { name?: string; website?: string; description?: string; ideal_customer_profile_attributes?: Record<string, any> }) {
    return this.request('/businesses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateBusiness(id: string, data: { name?: string; website?: string; description?: string; ideal_customer_profile_attributes?: Record<string, any> }) {
    return this.request(`/businesses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Integrations (scoped to a business)

  async listIntegrations(businessId: string) {
    return this.request(`${this.businessPath(businessId)}/integrations`, { method: 'GET' });
  }

  async listCampaigns(businessId: string, integrationId: string) {
    return this.request(`${this.businessPath(businessId)}/integrations/${integrationId}/campaigns`, { method: 'GET' });
  }

  // Subscriptions (scoped to a business)

  async listSubscriptions(businessId: string) {
    return this.request(`${this.businessPath(businessId)}/subscriptions`, { method: 'GET' });
  }

  async getSubscription(businessId: string, id: string) {
    return this.request(`${this.businessPath(businessId)}/subscriptions/${id}`, { method: 'GET' });
  }

  async createSubscription(businessId: string, data: { signal_slug: string; name: string; config?: Record<string, any>; integrations?: Array<{ integration_id: number; auto_deliver?: boolean; campaign_id?: string; campaign_name?: string; overloop_campaign_id?: string; overloop_campaign_name?: string }> }) {
    return this.request(`${this.businessPath(businessId)}/subscriptions`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateSubscription(businessId: string, id: string, data: { name?: string; active?: boolean; config?: Record<string, any>; integrations?: Array<{ integration_id: number; auto_deliver?: boolean; campaign_id?: string; campaign_name?: string; overloop_campaign_id?: string; overloop_campaign_name?: string }> }) {
    return this.request(`${this.businessPath(businessId)}/subscriptions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async pauseSubscription(businessId: string, id: string) {
    return this.request(`${this.businessPath(businessId)}/subscriptions/${id}/pause`, { method: 'POST' });
  }

  async resumeSubscription(businessId: string, id: string) {
    return this.request(`${this.businessPath(businessId)}/subscriptions/${id}/resume`, { method: 'POST' });
  }

  async deleteSubscription(businessId: string, id: string) {
    return this.request(`${this.businessPath(businessId)}/subscriptions/${id}`, { method: 'DELETE' });
  }

  // Leads (scoped to a business)

  async listLeads(businessId: string, params: { page?: number; per_page?: number } = {}) {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.per_page) query.set('per_page', String(params.per_page));
    const qs = query.toString();
    return this.request(`${this.businessPath(businessId)}/leads${qs ? `?${qs}` : ''}`, { method: 'GET' });
  }

  async getLead(businessId: string, id: string) {
    return this.request(`${this.businessPath(businessId)}/leads/${id}`, { method: 'GET' });
  }

  async deleteLead(businessId: string, id: string) {
    return this.request(`${this.businessPath(businessId)}/leads/${id}`, { method: 'DELETE' });
  }

  async enrollLeads(businessId: string, data: { integration_id: number; campaign_id: string; lead_ids: number[] }) {
    return this.request(`${this.businessPath(businessId)}/leads/enroll`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Webhooks (scoped to a business)

  async listWebhooks(businessId: string) {
    return this.request(`${this.businessPath(businessId)}/webhooks`, { method: 'GET' });
  }

  async createWebhook(businessId: string, data: { url: string; secret?: string }) {
    return this.request(`${this.businessPath(businessId)}/webhooks`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteWebhook(businessId: string, id: string) {
    return this.request(`${this.businessPath(businessId)}/webhooks/${id}`, { method: 'DELETE' });
  }
}
