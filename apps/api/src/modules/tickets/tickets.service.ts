import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, desc, asc, ilike, isNull } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { tickets, ticketHistory, users } from '../../database/schema';
import { TicketSeverity, TicketStatus } from '@service-ticket/types';
import { CreateTicketDto, UpdateTicketDto, TicketFilterDto } from './dto/ticket.dto';

@Injectable()
export class TicketsService {
  constructor(
    @Inject('DATABASE_CONNECTION')
    private db: NodePgDatabase<any>,
  ) {}

  async create(createTicketDto: CreateTicketDto, createdById: string) {
    const ticketNumber = await this.generateTicketNumber();
    
    const newTicket = {
      id: uuidv4(),
      ticketNumber,
      title: createTicketDto.title,
      description: createTicketDto.description,
      severity: createTicketDto.severity || TicketSeverity.MEDIUM,
      status: TicketStatus.OPEN,
      assignedToId: createTicketDto.assignedToId,
      createdById,
      dueDate: createTicketDto.dueDate ? new Date(createTicketDto.dueDate).toISOString().split('T')[0] : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const [ticket] = await this.db.insert(tickets).values(newTicket).returning();

    // Create history entry
    await this.createHistoryEntry(
      ticket.id,
      createdById,
      'created',
      null,
      JSON.stringify({ status: TicketStatus.OPEN, severity: ticket.severity }),
      'Ticket created'
    );

    return this.findOne(ticket.id);
  }

  async findAll(filters: TicketFilterDto = {}) {
    // Build conditions array
    const conditions = [isNull(tickets.deletedAt)];
    
    if (filters.status) {
      conditions.push(eq(tickets.status, filters.status));
    }
    if (filters.severity) {
      conditions.push(eq(tickets.severity, filters.severity));
    }
    if (filters.assignedToId) {
      conditions.push(eq(tickets.assignedToId, filters.assignedToId));
    }
    if (filters.createdById) {
      conditions.push(eq(tickets.createdById, filters.createdById));
    }
    if (filters.search) {
      conditions.push(ilike(tickets.title, `%${filters.search}%`));
    }

    // Apply sorting
    const sortField = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder || 'desc';
    
    // Define valid sort fields to prevent dynamic access issues
    const validSortFields = {
      createdAt: tickets.createdAt,
      updatedAt: tickets.updatedAt,
      dueDate: tickets.dueDate,
      severity: tickets.severity,
      status: tickets.status,
      title: tickets.title,
    };
    
    const sortColumn = validSortFields[sortField as keyof typeof validSortFields] || tickets.createdAt;
    const orderByClause = sortOrder === 'asc' ? asc(sortColumn) : desc(sortColumn);

    const query = this.db
      .select({
        id: tickets.id,
        ticketNumber: tickets.ticketNumber,
        title: tickets.title,
        description: tickets.description,
        severity: tickets.severity,
        status: tickets.status,
        dueDate: tickets.dueDate,
        createdAt: tickets.createdAt,
        updatedAt: tickets.updatedAt,
      })
      .from(tickets)
      .where(and(...conditions))
      .orderBy(orderByClause);

    // Apply pagination
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const offset = (page - 1) * limit;

    const results = await query.limit(limit).offset(offset);
    
    // Get total count for pagination
    const [{ count }] = await this.db
      .select({ count: tickets.id })
      .from(tickets)
      .where(isNull(tickets.deletedAt));

    return {
      data: results,
      pagination: {
        page,
        limit,
        total: Number(count),
        totalPages: Math.ceil(Number(count) / limit),
      },
    };
  }

  async findOne(id: string) {
    const [ticket] = await this.db
      .select({
        id: tickets.id,
        ticketNumber: tickets.ticketNumber,
        title: tickets.title,
        description: tickets.description,
        severity: tickets.severity,
        status: tickets.status,
        assignedToId: tickets.assignedToId,
        createdById: tickets.createdById,
        dueDate: tickets.dueDate,
        createdAt: tickets.createdAt,
        updatedAt: tickets.updatedAt,
        createdBy: {
          id: users.id,
          username: users.username,
          email: users.email,
          role: users.role,
        },
      })
      .from(tickets)
      .leftJoin(users, eq(tickets.createdById, users.id))
      .where(and(eq(tickets.id, id), isNull(tickets.deletedAt)));

    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${id} not found`);
    }

    return ticket;
  }

  async update(id: string, updateTicketDto: UpdateTicketDto, updatedById: string) {
    const existingTicket = await this.findOne(id);
    
    // Validate status transitions
    if (updateTicketDto.status && !this.isValidStatusTransition(existingTicket.status as TicketStatus, updateTicketDto.status)) {
      throw new BadRequestException(`Invalid status transition from ${existingTicket.status} to ${updateTicketDto.status}`);
    }

    const oldValues = {
      status: existingTicket.status,
      severity: existingTicket.severity,
      assignedToId: existingTicket.assignedToId,
    };

    const updateData = {
      ...updateTicketDto,
      updatedAt: new Date(),
    };
    
    // Convert dueDate to string format
    if (updateData.dueDate) {
      (updateData as any).dueDate = new Date(updateData.dueDate).toISOString().split('T')[0];
    }
    
    const [updatedTicket] = await this.db
      .update(tickets)
      .set(updateData as any)
      .where(eq(tickets.id, id))
      .returning();

    const newValues = {
      status: updatedTicket.status,
      severity: updatedTicket.severity,
      assignedToId: updatedTicket.assignedToId,
    };

    // Create history entry for changes
    const changes = this.getChanges(oldValues, newValues);
    if (Object.keys(changes).length > 0) {
      await this.createHistoryEntry(
        id,
        updatedById,
        'status_changed',
        JSON.stringify(oldValues),
        JSON.stringify(newValues),
        updateTicketDto.reason || 'Ticket updated'
      );
    }

    return this.findOne(id);
  }

  async remove(id: string, deletedById: string, reason?: string) {
    const ticket = await this.findOne(id);

    await this.db
      .update(tickets)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(tickets.id, id));

    // Create history entry
    await this.createHistoryEntry(
      id,
      deletedById,
      'deleted',
      JSON.stringify({ status: ticket.status }),
      null,
      reason || 'Ticket deleted'
    );

    return { message: 'Ticket successfully deleted' };
  }

  async getTicketHistory(ticketId: string) {
    const history = await this.db
      .select({
        id: ticketHistory.id,
        action: ticketHistory.actionType,
        oldValues: ticketHistory.oldValue,
        newValues: ticketHistory.newValue,
        reason: ticketHistory.reason,
        createdAt: ticketHistory.createdAt,
        changedBy: {
          id: users.id,
          username: users.username,
          email: users.email,
        },
      })
      .from(ticketHistory)
      .leftJoin(users, eq(ticketHistory.changedBy, users.id))
      .where(eq(ticketHistory.ticketId, ticketId))
      .orderBy(desc(ticketHistory.createdAt));

    return history;
  }

  private async generateTicketNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `TKT-${year}`;
    
    // Get the latest ticket number for this year
    const [latestTicket] = await this.db
      .select({ ticketNumber: tickets.ticketNumber })
      .from(tickets)
      .where(ilike(tickets.ticketNumber, `${prefix}%`))
      .orderBy(desc(tickets.ticketNumber))
      .limit(1);

    let nextNumber = 1;
    if (latestTicket) {
      const currentNumber = parseInt(latestTicket.ticketNumber.split('-')[2]);
      nextNumber = currentNumber + 1;
    }

    return `${prefix}-${nextNumber.toString().padStart(4, '0')}`;
  }

  private isValidStatusTransition(currentStatus: TicketStatus, newStatus: TicketStatus): boolean {
    const validTransitions = {
      [TicketStatus.OPEN]: [TicketStatus.IN_PROGRESS, TicketStatus.CLOSED],
      [TicketStatus.IN_PROGRESS]: [TicketStatus.OPEN, TicketStatus.RESOLVED, TicketStatus.CLOSED],
      [TicketStatus.RESOLVED]: [TicketStatus.CLOSED, TicketStatus.REOPENED],
      [TicketStatus.CLOSED]: [TicketStatus.REOPENED],
      [TicketStatus.REOPENED]: [TicketStatus.IN_PROGRESS, TicketStatus.RESOLVED, TicketStatus.CLOSED],
    };

    return validTransitions[currentStatus]?.includes(newStatus) || false;
  }

  private getChanges(oldValues: any, newValues: any): any {
    const changes = {};
    for (const key in newValues) {
      if (oldValues[key] !== newValues[key]) {
        changes[key] = { from: oldValues[key], to: newValues[key] };
      }
    }
    return changes;
  }

  private async createHistoryEntry(
    ticketId: string,
    changedById: string,
    action: string,
    oldValues: string | null,
    newValues: string | null,
    reason: string
  ) {
    await this.db.insert(ticketHistory).values({
      ticketId,
      changedBy: changedById,
      actionType: action as any,
      oldValue: oldValues,
      newValue: newValues || '',
      reason,
      createdAt: new Date(),
    });
  }
}
