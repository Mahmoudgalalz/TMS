// User Types
export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export enum UserRole {
  ASSOCIATE = 'associate',
  MANAGER = 'manager',
}

// Ticket Types
export interface Ticket {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  status: TicketStatus;
  severity: TicketSeverity;
  assignedToId?: string;
  createdById: string;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export enum TicketStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
  REOPENED = 'REOPENED',
}

export enum TicketSeverity {
  VERY_HIGH = 'VERY_HIGH',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
  EASY = 'EASY',
}

// Ticket History Types
export interface TicketHistory {
  id: string;
  ticketId: string;
  changedById: string;
  action: string;
  oldValues?: string;
  newValues?: string;
  reason: string;
  createdAt: Date;
}

// AI Types
export interface AIAnalysis {
  ticketId: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  confidence: number;
  category: string;
  predictedSeverity: TicketSeverity;
  suggestedResponse?: string;
  reasoning: string;
}

export interface AIRequest {
  ticketId: string;
  content: string;
  requestType: 'analyze' | 'suggest_response' | 'categorize';
}

export interface AIResponse {
  success: boolean;
  data?: AIAnalysis;
  error?: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: Date;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Query Types
export interface TicketFilterDto {
  status?: TicketStatus;
  severity?: TicketSeverity;
  assignedToId?: string;
  createdById?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Legacy alias for backward compatibility
export type TicketQuery = TicketFilterDto;

// Comment Types
export interface Comment {
  id: string;
  ticketId: string;
  content: string;
  isInternal: boolean;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

// DTO Types for API
export interface CreateTicketDto {
  title: string;
  description: string;
  severity?: TicketSeverity;
  assignedToId?: string;
  dueDate?: Date;
}

export interface UpdateTicketDto {
  title?: string;
  description?: string;
  status?: TicketStatus;
  severity?: TicketSeverity;
  assignedToId?: string;
  dueDate?: Date;
  reason?: string;
}

export interface CreateCommentDto {
  content: string;
  isInternal?: boolean;
}

export interface CreateUserDto {
  username: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface UpdateUserDto {
  username?: string;
  email?: string;
  role?: UserRole;
}

// Auth Types
export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  username: string;
  email: string;
  password: string;
  role: UserRole;
}

// Dashboard Types
export interface DashboardStats {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  avgResolutionTime: number;
  ticketsBySeverity: Record<TicketSeverity, number>;
  ticketsByStatus: Record<TicketStatus, number>;
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  type: 'ticket_created' | 'ticket_updated' | 'comment_added' | 'ticket_assigned';
  description: string;
  userId: string;
  userName: string;
  ticketId?: string;
  timestamp: Date;
}

// CSV Types
export interface CsvExportOptions {
  status?: TicketStatus;
  includeResolved?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface CsvImportResult {
  processed: number;
  updated: number;
  errors: Array<{ row: number; error: string; data: any }>;
}

// WebSocket Types
export interface SocketEvent {
  type: 'ticket_updated' | 'ticket_created' | 'ticket_assigned' | 'user_notification';
  payload: any;
  timestamp: Date;
}

export interface NotificationPayload {
  userId: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  ticketId?: string;
}
