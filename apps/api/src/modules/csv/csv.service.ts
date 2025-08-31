import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and, isNull, inArray } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';
import * as csvParser from 'csv-parser';
import { format } from '@fast-csv/format';
import { tickets, users, ticketHistory } from '../../database/schema';
import { TicketStatus, TicketSeverity } from '@service-ticket/types';
import { QueueService } from '../../queue/queue.service';

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

@Injectable()
export class CsvService {
  private readonly uploadsDir = path.join(process.cwd(), 'uploads');

  constructor(
    @Inject('DATABASE_CONNECTION')
    private db: NodePgDatabase<any>,
    private queueService: QueueService,
  ) {
    // Ensure uploads directory exists
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  async exportTicketsToCsv(options: CsvExportOptions = {}): Promise<string> {
    const fileName = `tickets-export-${Date.now()}.csv`;
    const filePath = path.join(this.uploadsDir, fileName);

    // Build query conditions
    const conditions = [isNull(tickets.deletedAt)];
    
    if (options.status) {
      conditions.push(eq(tickets.status, options.status));
    } else {
      // Default: export all PENDING tickets for external system processing
      conditions.push(eq(tickets.status, TicketStatus.PENDING));
    }

    // Query tickets with user information
    const ticketData = await this.db
      .select({
        ticketNumber: tickets.ticketNumber,
        title: tickets.title,
        description: tickets.description,
        severity: tickets.severity,
        status: tickets.status,
        dueDate: tickets.dueDate,
        createdAt: tickets.createdAt,
        updatedAt: tickets.updatedAt,
        createdByEmail: users.email,
      })
      .from(tickets)
      .leftJoin(users, eq(tickets.createdById, users.id))
      .where(and(...conditions));

    // Write CSV file
    return new Promise((resolve, reject) => {
      const csvStream = format({ headers: true });
      const writeStream = fs.createWriteStream(filePath);

      csvStream.pipe(writeStream);

      // Write headers and data
      ticketData.forEach(ticket => {
        csvStream.write({
          'Ticket Number': ticket.ticketNumber,
          'Title': ticket.title,
          'Description': ticket.description,
          'Severity': ticket.severity,
          'Status': ticket.status,
          'Due Date': ticket.dueDate ? ticket.dueDate.toString() : '',
          'Created At': ticket.createdAt.toISOString(),
          'Updated At': ticket.updatedAt.toISOString(),
          'Created By': ticket.createdByEmail || '',
        });
      });

      csvStream.end();

      writeStream.on('finish', () => {
        resolve(fileName);
      });

      writeStream.on('error', (error) => {
        reject(error);
      });
    });
  }

  async importTicketsFromCsv(filePath: string, updatedById: string): Promise<CsvImportResult> {
    const result: CsvImportResult = {
      processed: 0,
      updated: 0,
      errors: [],
    };

    return new Promise((resolve, reject) => {
      const csvData: any[] = [];
      let rowNumber = 0;

      fs.createReadStream(filePath)
        .pipe(csvParser())
        .on('data', (data) => {
          rowNumber++;
          csvData.push({ ...data, rowNumber });
        })
        .on('end', async () => {
          try {
            for (const row of csvData) {
              result.processed++;
              
              try {
                await this.processImportRow(row, updatedById);
                result.updated++;
              } catch (error) {
                result.errors.push({
                  row: row.rowNumber,
                  error: error.message,
                  data: row,
                });
              }
            }
            
            resolve(result);
          } catch (error) {
            reject(error);
          }
        })
        .on('error', (error) => {
          reject(error);
        });
    });
  }

  private async processImportRow(row: any, updatedById: string): Promise<void> {
    const ticketNumber = row['Ticket Number'] || row.ticketNumber;
    const newStatus = row['Status'] || row.status;

    if (!ticketNumber) {
      throw new Error('Ticket number is required');
    }

    if (!newStatus || !Object.values(TicketStatus).includes(newStatus as TicketStatus)) {
      throw new Error(`Invalid status: ${newStatus}`);
    }

    // Find existing ticket
    const [existingTicket] = await this.db
      .select()
      .from(tickets)
      .where(and(
        eq(tickets.ticketNumber, ticketNumber),
        isNull(tickets.deletedAt)
      ));

    if (!existingTicket) {
      throw new Error(`Ticket not found: ${ticketNumber}`);
    }

    // Check if status change is valid
    if (existingTicket.status === newStatus) {
      return; // No change needed
    }

    if (!this.isValidStatusTransition(existingTicket.status as TicketStatus, newStatus as TicketStatus)) {
      throw new Error(`Invalid status transition from ${existingTicket.status} to ${newStatus}`);
    }

    // Update ticket
    const oldValues = { status: existingTicket.status };
    const newValues = { status: newStatus as TicketStatus };

    await this.db
      .update(tickets)
      .set({
        status: newStatus as TicketStatus,
        updatedAt: new Date(),
      })
      .where(eq(tickets.id, existingTicket.id));

    // Create history entry
    await this.createHistoryEntry(
      existingTicket.id,
      updatedById,
      'UPDATED',
      JSON.stringify(oldValues),
      JSON.stringify(newValues),
      'Status updated via CSV import'
    );
  }

  async scheduleAutomatedCsvProcessing(): Promise<void> {
    // Add job to queue for automated CSV processing
    await this.queueService.scheduleDailyCsvProcessing();
  }

  async processAutomatedStatusUpdates(): Promise<void> {
    // Get all open tickets that are overdue
    const overdueTickets = await this.db
      .select()
      .from(tickets)
      .where(and(
        eq(tickets.status, TicketStatus.OPEN),
        isNull(tickets.deletedAt)
      ));

    const updates = [];
    
    for (const ticket of overdueTickets) {
      // Simulate automated status updates based on business rules
      const daysSinceCreated = Math.floor(
        (Date.now() - ticket.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      let newStatus: TicketStatus | null = null;

      // Business rules for automated updates
      if (daysSinceCreated > 7 && ticket.status === TicketStatus.OPEN) {
        newStatus = TicketStatus.CLOSED;
      } else if (daysSinceCreated > 14 && ticket.status === TicketStatus.PENDING) {
        newStatus = TicketStatus.OPEN;
      }

      if (newStatus && this.isValidStatusTransition(ticket.status as TicketStatus, newStatus)) {
        updates.push({
          id: ticket.id,
          oldStatus: ticket.status,
          newStatus,
          ticketNumber: ticket.ticketNumber,
        });
      }
    }

    // Apply updates
    for (const update of updates) {
      await this.db
        .update(tickets)
        .set({
          status: update.newStatus,
          updatedAt: new Date(),
        })
        .where(eq(tickets.id, update.id));

      // Create history entry
      await this.createHistoryEntry(
        update.id,
        'system', // System user ID for automated updates
        'UPDATED',
        JSON.stringify({ status: update.oldStatus }),
        JSON.stringify({ status: update.newStatus }),
        'Automated status update based on business rules'
      );
    }

    console.log(`Processed ${updates.length} automated status updates`);
  }

  async getExportedFile(fileName: string): Promise<string> {
    const filePath = path.join(this.uploadsDir, fileName);
    
    if (!fs.existsSync(filePath)) {
      throw new BadRequestException('File not found');
    }

    return filePath;
  }

  async deleteExportedFile(fileName: string): Promise<void> {
    const filePath = path.join(this.uploadsDir, fileName);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  private isValidStatusTransition(currentStatus: TicketStatus, newStatus: TicketStatus): boolean {
    const validTransitions: Record<TicketStatus, TicketStatus[]> = {
      [TicketStatus.DRAFT]: [TicketStatus.REVIEW, TicketStatus.PENDING, TicketStatus.OPEN],
      [TicketStatus.REVIEW]: [TicketStatus.DRAFT, TicketStatus.PENDING, TicketStatus.OPEN, TicketStatus.CLOSED],
      [TicketStatus.PENDING]: [TicketStatus.DRAFT, TicketStatus.REVIEW, TicketStatus.OPEN, TicketStatus.CLOSED],
      [TicketStatus.OPEN]: [TicketStatus.PENDING, TicketStatus.CLOSED],
      [TicketStatus.CLOSED]: [TicketStatus.OPEN],
    };

    return validTransitions[currentStatus]?.includes(newStatus) || false;
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
    });
  }
}
