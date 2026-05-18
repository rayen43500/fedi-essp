export type Role = 'CLIENT' | 'AGENT' | 'SUPERVISEUR' | 'ADMIN';

export interface UserSummary {
  id: number;
  fullName: string;
  email: string;
  roles: Role[];
  active: boolean;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: UserSummary;
}

export type TicketType = 'INCIDENT' | 'DEMANDE';
export type TicketCategory = 'MATERIEL' | 'LOGICIEL' | 'RESEAU' | 'ACCES' | 'AUTRE';
export type TicketPriority = 'FAIBLE' | 'MOYENNE' | 'ELEVEE' | 'CRITIQUE';
export type TicketStatus = 'OUVERT' | 'EN_COURS' | 'EN_ATTENTE' | 'RESOLU' | 'FERME';

export interface TicketComment {
  id: number;
  author: string;
  message: string;
  createdAt: string;
}

export interface Ticket {
  id: number;
  title: string;
  description: string;
  type: TicketType;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  slaDeadline: string;
  archived: boolean;
  attachmentUrl?: string;
  satisfactionScore?: number;
  client: UserSummary;
  agent?: UserSummary;
  comments: TicketComment[];
}

export interface DashboardStats {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  waitingTickets: number;
  resolvedTickets: number;
  closedTickets: number;
  criticalTickets: number;
  overdueTickets: number;
  unassignedTickets: number;
  archivedTickets: number;
  averageResolutionHours: number;
  customerSatisfactionRate: number;
}

export interface KnowledgeArticle {
  id: number;
  title: string;
  content: string;
  category: string;
  updatedAt: string;
  authorName: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatbotReply {
  answer: string;
  suggestions: KnowledgeArticle[];
  assistantEnabled: boolean;
  ticketCreated: boolean;
  createdTicket?: Ticket;
}

export interface AssistantStatus {
  enabled: boolean;
}

export interface ChartSlice {
  label: string;
  value: number;
}

export interface DashboardCharts {
  ticketsByStatus: ChartSlice[];
  ticketsByPriority: ChartSlice[];
}

export interface NotificationView {
  id: number;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}
