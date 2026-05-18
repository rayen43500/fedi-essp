import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
  AssistantStatus,
  ChatbotReply,
  ChatMessage,
  DashboardCharts,
  DashboardStats,
  KnowledgeArticle,
  NotificationView,
  Role,
  Ticket,
  TicketCategory,
  TicketPriority,
  TicketStatus,
  TicketType,
  UserSummary
} from './models';

export interface TicketFilters {
  q?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: TicketCategory;
  type?: TicketType;
  agentId?: number;
  unassigned?: boolean;
  assignedToMe?: boolean;
  mine?: boolean;
  overdue?: boolean;
  includeArchived?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly api = this.resolveApiBase();

  constructor(private readonly http: HttpClient) {}

  tickets(filters: TicketFilters = {}) {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });
    return this.http.get<Ticket[]>(`${this.api}/tickets`, { params });
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

  changeTicketPriority(id: number, priority: TicketPriority) {
    return this.http.patch<Ticket>(`${this.api}/tickets/${id}/priority`, { priority });
  }

  assignTicket(id: number, agentId: number) {
    return this.http.patch<Ticket>(`${this.api}/tickets/${id}/assign`, { agentId });
  }

  addComment(id: number, message: string) {
    return this.http.post(`${this.api}/tickets/${id}/comments`, { message });
  }

  rateTicket(id: number, score: number) {
    return this.http.post<Ticket>(`${this.api}/tickets/${id}/satisfaction`, { score });
  }

  archiveClosedTickets() {
    return this.http.patch<number>(`${this.api}/tickets/archive`, {});
  }

  escalateSla() {
    return this.http.patch<number>(`${this.api}/tickets/sla/escalate`, {});
  }

  dashboardStats() {
    return this.http.get<DashboardStats>(`${this.api}/dashboard/stats`);
  }

  dashboardCharts() {
    return this.http.get<DashboardCharts>(`${this.api}/dashboard/charts`);
  }

  myDashboardCharts() {
    return this.http.get<DashboardCharts>(`${this.api}/dashboard/my/charts`);
  }

  users() {
    return this.http.get<UserSummary[]>(`${this.api}/auth/users`);
  }

  supportUsers() {
    return this.http.get<UserSummary[]>(`${this.api}/auth/users/support`);
  }

  setUserActive(id: number, active: boolean) {
    return this.http.patch<UserSummary>(`${this.api}/auth/users/${id}/active?active=${active}`, {});
  }

  updateUserRoles(id: number, roles: Role[]) {
    return this.http.patch<UserSummary>(`${this.api}/auth/users/${id}/roles`, { roles });
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

  assistantStatus() {
    return this.http.get<AssistantStatus>(`${this.api}/chatbot/status`);
  }

  chatbotChat(message: string, history: ChatMessage[] = []) {
    return this.http.post<ChatbotReply>(`${this.api}/chatbot/chat`, { message, history });
  }

  chatbotCreateTicket(message: string) {
    return this.http.post<ChatbotReply>(`${this.api}/chatbot/create-ticket`, { message, history: [] });
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
