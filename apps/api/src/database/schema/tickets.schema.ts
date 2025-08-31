import { pgTable, uuid, varchar, text, timestamp, pgEnum, date } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { users } from './users.schema';
import { generateUniqueTicketId } from '../utils/unique-ticket-key';

// Ticket severity enum - aligned with requirements: Very High, High, Medium, Low, Easy
export const ticketSeverityEnum = pgEnum('ticket_severity', [
  'VERY_HIGH',
  'HIGH', 
  'MEDIUM',
  'LOW',
  'EASY'
]);

// Ticket status enum
export const ticketStatusEnum = pgEnum('ticket_status', [
  'DRAFT',
  'REVIEW',
  'PENDING',
  'OPEN',
  'CLOSED'
]);

// Tickets table schema
export const tickets = pgTable('tickets', {
  id: uuid('id').primaryKey().defaultRandom(),
  ticketNumber: varchar('ticket_number', { length: 20 }).notNull().unique().$default(generateUniqueTicketId),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  severity: ticketSeverityEnum('severity').notNull().default('MEDIUM'),
  status: ticketStatusEnum('status').notNull().default('DRAFT'),
  dueDate: varchar('due_date', { length: 30 }), // Store as string for compatibility
  createdById: uuid('created_by_id').notNull().references(() => users.id),
  assignedToId: uuid('assigned_to_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'), // Soft delete
});

// Relations
export const ticketsRelations = relations(tickets, ({ one, many }) => ({
  creator: one(users, {
    fields: [tickets.createdById],
    references: [users.id],
  }),
  assignedTo: one(users, {
    fields: [tickets.assignedToId],
    references: [users.id],
  }),
  history: many(ticketHistory),
}));

// Ticket History table schema
export const ticketHistoryActionEnum = pgEnum('ticket_history_action', [
  'created',
  'status_changed',
  'severity_changed',
  'title_changed',
  'description_changed',
  'due_date_changed',
  'deleted',
  'restored'
]);

export const ticketHistory = pgTable('ticket_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  ticketId: uuid('ticket_id').notNull().references(() => tickets.id),
  actionType: ticketHistoryActionEnum('action_type').notNull(),
  oldValue: varchar('old_value', { length: 500 }),
  newValue: varchar('new_value', { length: 500 }).notNull(),
  reason: text('reason'), // For severity changes
  changedBy: uuid('changed_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Ticket History Relations
export const ticketHistoryRelations = relations(ticketHistory, ({ one }) => ({
  ticket: one(tickets, {
    fields: [ticketHistory.ticketId],
    references: [tickets.id],
  }),
  changedByUser: one(users, {
    fields: [ticketHistory.changedBy],
    references: [users.id],
  }),
}));

// Zod schemas for validation
export const insertTicketSchema = createInsertSchema(tickets, {
  title: z.string().min(1).max(255),
  description: z.string().min(1),
  severity: z.enum(['VERY_HIGH', 'HIGH', 'MEDIUM', 'LOW', 'EASY']),
  status: z.enum(['DRAFT', 'REVIEW', 'PENDING', 'OPEN', 'CLOSED']),
  dueDate: z.string().optional(),
});

export const selectTicketSchema = createSelectSchema(tickets);

export const updateTicketSchema = insertTicketSchema.partial().omit({ 
  id: true, 
  ticketNumber: true, 
  createdById: true 
});

export const insertTicketHistorySchema = createInsertSchema(ticketHistory, {
  actionType: z.enum(['created', 'status_changed', 'severity_changed', 'title_changed', 'description_changed', 'due_date_changed', 'deleted', 'restored']),
  newValue: z.string().min(1),
  reason: z.string().optional(),
});

export type Ticket = typeof tickets.$inferSelect;
export type NewTicket = typeof tickets.$inferInsert;

export type TicketHistory = typeof ticketHistory.$inferSelect;
export type NewTicketHistory = typeof ticketHistory.$inferInsert;
export type TicketHistoryAction = 'created' | 'status_changed' | 'severity_changed' | 'title_changed' | 'description_changed' | 'due_date_changed' | 'deleted' | 'restored';
