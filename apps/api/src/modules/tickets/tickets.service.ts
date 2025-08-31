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
      status: TicketStatus.DRAFT, // Associates create tickets in DRAFT status
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
      JSON.stringify({ status: TicketStatus.DRAFT, severity: ticket.severity }),
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
    
    // Get total count for pagination with same filters
    const [{ count }] = await this.db
      .select({ count: tickets.id })
      .from(tickets)
      .where(and(...conditions));

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

  async update(id: string, updateTicketDto: UpdateTicketDto, updatedById: string, userRole: string) {
    const existingTicket = await this.findOne(id);
    
    // Validate role-based permissions
    await this.validateUpdatePermissions(existingTicket, updateTicketDto, updatedById, userRole);
    
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

  async approveTicket(id: string, managerId: string) {
    const existingTicket = await this.findOne(id);
    
    // Validate Manager can approve this ticket
    if (existingTicket.createdById === managerId) {
      throw new BadRequestException('Managers cannot approve tickets they created');
    }
    
    // Managers can approve tickets in Draft or Review status
    if (existingTicket.status !== TicketStatus.DRAFT && existingTicket.status !== TicketStatus.REVIEW) {
      throw new BadRequestException('Only tickets in Draft or Review status can be approved');
    }

    // Approve ticket by changing status to PENDING
    const updateData = {
      status: TicketStatus.PENDING,
      updatedAt: new Date(),
    };

    const [updatedTicket] = await this.db
      .update(tickets)
      .set(updateData)
      .where(eq(tickets.id, id))
      .returning();

    // Create history entry
    await this.createHistoryEntry(
      id,
      managerId,
      'status_changed',
      TicketStatus.DRAFT,
      TicketStatus.PENDING,
      'Ticket approved by Manager'
    );

    return this.findOne(id);
  }

  async remove(id: string, deletedById: string, reason?: string) {
    const ticket = await this.findOne(id);

    // Only allow soft delete before Pending state
    if (ticket.status === TicketStatus.PENDING || ticket.status === TicketStatus.OPEN || ticket.status === TicketStatus.CLOSED) {
      throw new BadRequestException('Cannot delete tickets in Pending, Open, or Closed status');
    }

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

    return `${prefix}-${nextNumber.toString().padStart(6, '0')}`;
  }

  private async validateUpdatePermissions(existingTicket: any, updateDto: UpdateTicketDto, updatedById: string, userRole: string) {
    const isAssociate = userRole === 'associate';
    const isManager = userRole === 'manager';
    const isTicketCreator = existingTicket.createdById === updatedById;

    // Associate permissions
    if (isAssociate) {
      // Associates can only edit their own tickets
      if (!isTicketCreator) {
        throw new BadRequestException('Associates can only edit tickets they created');
      }

      // Associates can edit title/description if ticket is in REVIEW status (resets to DRAFT)
      if (existingTicket.status === TicketStatus.REVIEW) {
        if (updateDto.title || updateDto.description) {
          // Automatically reset status to DRAFT when Associate edits a ticket in REVIEW
          updateDto.status = TicketStatus.DRAFT;
        }
        // Associates cannot change severity when ticket is in REVIEW status
        if (updateDto.severity) {
          throw new BadRequestException('Associates cannot change severity when ticket is in Review status');
        }
      }

      // Associates cannot change status directly (except through the REVIEW -> DRAFT rule above)
      if (updateDto.status && existingTicket.status !== TicketStatus.REVIEW) {
        throw new BadRequestException('Associates cannot change ticket status directly');
      }
    }

    // Manager permissions
    if (isManager) {
      // Managers cannot edit tickets they created
      if (isTicketCreator) {
        throw new BadRequestException('Managers cannot edit tickets they created');
      }

      // Managers can only change severity, not other fields directly
      if (updateDto.title || updateDto.description || updateDto.assignedToId || updateDto.dueDate) {
        throw new BadRequestException('Managers can only change ticket severity');
      }

      // Managers cannot directly change status (only through severity change or approval)
      if (updateDto.status) {
        throw new BadRequestException('Managers cannot directly change ticket status');
      }

      // Validate severity change requirements
      if (updateDto.severity && updateDto.severity !== existingTicket.severity) {
        if (!updateDto.reason) {
          throw new BadRequestException('Severity change reason is mandatory for Managers');
        }
        
        // Any severity change -> REVIEW (requires Associate re-evaluation)
        updateDto.status = TicketStatus.REVIEW;
      }
    }
  }

  private getSeverityLevel(severity: TicketSeverity): number {
    const levels = {
      [TicketSeverity.EASY]: 1,
      [TicketSeverity.LOW]: 2,
      [TicketSeverity.MEDIUM]: 3,
      [TicketSeverity.HIGH]: 4,
      [TicketSeverity.VERY_HIGH]: 5,
    };
    return levels[severity] || 3;
  }

  private isValidStatusTransition(currentStatus: TicketStatus, newStatus: TicketStatus): boolean {
    const validTransitions = {
      [TicketStatus.DRAFT]: [TicketStatus.REVIEW, TicketStatus.PENDING, TicketStatus.OPEN],
      [TicketStatus.REVIEW]: [TicketStatus.DRAFT, TicketStatus.PENDING, TicketStatus.OPEN, TicketStatus.CLOSED],
      [TicketStatus.PENDING]: [TicketStatus.DRAFT, TicketStatus.REVIEW, TicketStatus.OPEN, TicketStatus.CLOSED],
      [TicketStatus.OPEN]: [TicketStatus.PENDING, TicketStatus.CLOSED],
      [TicketStatus.CLOSED]: [TicketStatus.OPEN], // Allow reopening closed tickets
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
