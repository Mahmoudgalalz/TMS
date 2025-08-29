import { pgTable, uuid, varchar, text, timestamp, pgEnum, date } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { users } from './users.schema';

// Ticket severity enum
export const ticketSeverityEnum = pgEnum('ticket_severity', [
  'very_high',
  'high', 
  'medium',
  'low',
  'easy'
]);

// Ticket status enum
export const ticketStatusEnum = pgEnum('ticket_status', [
  'draft',
  'review', 
  'pending',
  'open',
  'closed'
]);

// Tickets table schema
export const tickets = pgTable('tickets', {
  id: uuid('id').primaryKey().defaultRandom(),
  ticketNumber: varchar('ticket_number', { length: 20 }).notNull().unique(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  severity: ticketSeverityEnum('severity').notNull().default('medium'),
  status: ticketStatusEnum('status').notNull().default('draft'),
  dueDate: date('due_date'),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'), // Soft delete
});

// Relations
export const ticketsRelations = relations(tickets, ({ one, many }) => ({
  creator: one(users, {
    fields: [tickets.createdBy],
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
  severity: z.enum(['very_high', 'high', 'medium', 'low', 'easy']),
  status: z.enum(['draft', 'review', 'pending', 'open', 'closed']),
  dueDate: z.string().optional(),
});

export const selectTicketSchema = createSelectSchema(tickets);

export const updateTicketSchema = insertTicketSchema.partial().omit({ 
  id: true, 
  ticketNumber: true, 
  createdBy: true 
});

export const insertTicketHistorySchema = createInsertSchema(ticketHistory, {
  actionType: z.enum(['created', 'status_changed', 'severity_changed', 'title_changed', 'description_changed', 'due_date_changed', 'deleted', 'restored']),
  newValue: z.string().min(1),
  reason: z.string().optional(),
});

export type Ticket = typeof tickets.$inferSelect;
export type NewTicket = typeof tickets.$inferInsert;
export type TicketSeverity = 'very_high' | 'high' | 'medium' | 'low' | 'easy';
export type TicketStatus = 'draft' | 'review' | 'pending' | 'open' | 'closed';

export type TicketHistory = typeof ticketHistory.$inferSelect;
export type NewTicketHistory = typeof ticketHistory.$inferInsert;
export type TicketHistoryAction = 'created' | 'status_changed' | 'severity_changed' | 'title_changed' | 'description_changed' | 'due_date_changed' | 'deleted' | 'restored';
