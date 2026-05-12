import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ChatbotReply, DashboardStats, KnowledgeArticle, NotificationView, Ticket, TicketStatus, UserSummary } from './models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly api = this.resolveApiBase();

  constructor(private readonly http: HttpClient) {}

  tickets() {
    return this.http.get<Ticket[]>(`${this.api}/tickets`);
  }

  createTicket(payload: {
    title: string;
    description: string;
    type: string;
    category: string;
    priority: string;
    attachmentUrl?: string;
  }) {
    return this.http.post<Ticket>(`${this.api}/tickets`, payload);
  }

  changeTicketStatus(id: number, status: TicketStatus) {
    return this.http.patch<Ticket>(`${this.api}/tickets/${id}/status`, { status });
  }

  addComment(id: number, message: string) {
    return this.http.post(`${this.api}/tickets/${id}/comments`, { message });
  }

  rateTicket(id: number, score: number) {
    return this.http.post<Ticket>(`${this.api}/tickets/${id}/satisfaction`, { score });
  }

  dashboardStats() {
    return this.http.get<DashboardStats>(`${this.api}/dashboard/stats`);
  }

  users() {
    return this.http.get<UserSummary[]>(`${this.api}/auth/users`);
  }

  setUserActive(id: number, active: boolean) {
    return this.http.patch<UserSummary>(`${this.api}/auth/users/${id}/active?active=${active}`, {});
  }

  knowledge(q?: string) {
    const query = q ? `?q=${encodeURIComponent(q)}` : '';
    return this.http.get<KnowledgeArticle[]>(`${this.api}/knowledge${query}`);
  }

  createKnowledge(payload: { title: string; content: string; category: string }) {
    return this.http.post<KnowledgeArticle>(`${this.api}/knowledge`, payload);
  }

  chatbot(question: string) {
    return this.http.get<ChatbotReply>(`${this.api}/chatbot?q=${encodeURIComponent(question)}`);
  }

  notifications() {
    return this.http.get<NotificationView[]>(`${this.api}/notifications`);
  }

  markNotificationRead(id: number) {
    return this.http.patch(`${this.api}/notifications/${id}/read`, {});
  }

  private resolveApiBase(): string {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    return isLocal ? 'http://localhost:8080/api' : '/api';
  }
}
