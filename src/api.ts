import fetch from 'node-fetch';
import { SignalsConfig } from './config';

export class SignalsAPI {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: SignalsConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = (process.env.SIGNALS_API_URL || 'https://api.meetsignals.ai').replace(/\/$/, '');
  }

  private async request(endpoint: string, options: any = {}) {
    const url = `${this.baseUrl}/api/v1${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
      ...options.headers,
    };

    const response = await fetch(url, { ...options, headers });

    if (response.status === 204) {
      return null;
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

  async createSubscription(businessId: string, data: { signal_slug: string; name: string; config?: Record<string, any>; daily_lead_limit?: number; integrations?: Array<{ integration_id: number; auto_deliver?: boolean; campaign_id?: string; campaign_name?: string; overloop_campaign_id?: string; overloop_campaign_name?: string }> }) {
    return this.request(`${this.businessPath(businessId)}/subscriptions`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateSubscription(businessId: string, id: string, data: { name?: string; active?: boolean; config?: Record<string, any>; daily_lead_limit?: number; integrations?: Array<{ integration_id: number; auto_deliver?: boolean; campaign_id?: string; campaign_name?: string; overloop_campaign_id?: string; overloop_campaign_name?: string }> }) {
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
