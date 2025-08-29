import { Process, Processor } from '@nestjs/bull';
import { Logger, Inject } from '@nestjs/common';
import { Job } from 'bull';
import { writeToPath } from '@fast-csv/format';
import * as csv from 'csv-parser';
import * as fs from 'fs';
import * as path from 'path';
import { eq, and } from 'drizzle-orm';
import { DATABASE_CONNECTION } from '../../database/database.module';
import { tickets, ticketHistory, TicketStatus } from '../../database/schema';

@Processor('csv-processing')
export class CsvProcessor {
  private readonly logger = new Logger(CsvProcessor.name);

  constructor(
    @Inject(DATABASE_CONNECTION) private readonly db: any,
  ) {}

  /**
   * Export pending tickets to CSV
   */
  @Process('export-pending-tickets')
  async handleCsvExport(job: Job<{ userId: string; timestamp: Date }>) {
    const { userId, timestamp } = job.data;
    
    try {
      this.logger.log(`Exporting pending tickets for user: ${userId}`);

      // Get all pending tickets
      const pendingTickets = await this.db
        .select()
        .from(tickets)
        .where(and(
          eq(tickets.status, 'OPEN'),
          eq(tickets.deletedAt, null)
        ));

      // Generate CSV file
      const fileName = `pending_tickets_${timestamp.getTime()}.csv`;
      const filePath = path.join(process.cwd(), 'temp', fileName);

      // Ensure temp directory exists
      const tempDir = path.dirname(filePath);
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const csvData = pendingTickets.map(ticket => ({
        id: ticket.id,
        ticket_number: ticket.ticketNumber,
        title: ticket.title,
        description: ticket.description,
        severity: ticket.severity,
        current_status: ticket.status,
        new_status: '', // To be filled by processor
        due_date: ticket.dueDate,
        created_at: ticket.createdAt,
      }));

      await writeToPath(filePath, csvData, { headers: true });

      this.logger.log(`CSV export completed: ${filePath}`);
      
      return { filePath, recordCount: csvData.length };
    } catch (error) {
      this.logger.error(`Failed to export CSV for user ${userId}:`, error.message);
      throw error;
    }
  }

  /**
   * Process CSV with automated status updates (simulation)
   */
  @Process('daily-csv-process')
  async handleDailyCsvProcess(job: Job) {
    try {
      this.logger.log('Starting daily CSV processing simulation');

      // Get all pending tickets
      const pendingTickets = await this.db
        .select()
        .from(tickets)
        .where(and(
          eq(tickets.status, 'OPEN'),
          eq(tickets.deletedAt, null)
        ));

      if (pendingTickets.length === 0) {
        this.logger.log('No pending tickets to process');
        return { processedCount: 0 };
      }

      // Simulate automated processing: 30% IN_PROGRESS, 30% RESOLVED, 30% CLOSED, 10% remain OPEN
      const statusDistribution: TicketStatus[] = ['IN_PROGRESS', 'RESOLVED', 'CLOSED'];
      let processedCount = 0;

      for (const ticket of pendingTickets) {
        const random = Math.random();
        let newStatus: TicketStatus;

        if (random < 0.3) {
          newStatus = 'pending'; // Keep as pending
        } else if (random < 0.6) {
          newStatus = 'open';
        } else if (random < 0.9) {
          newStatus = 'closed';
        } else {
          continue; // 10% remain unchanged
        }

        if (newStatus !== ticket.status) {
          // Update ticket status
          await this.db
            .update(tickets)
            .set({ 
              status: newStatus, 
              updatedAt: new Date() 
            })
            .where(eq(tickets.id, ticket.id));

          // Add history entry
          await this.db.insert(ticketHistory).values({
            ticketId: ticket.id,
            actionType: 'status_changed',
            oldValue: ticket.status,
            newValue: newStatus,
            reason: 'Automated daily processing',
            changedBy: ticket.createdBy, // System user in production
          });

          processedCount++;
        }
      }

      this.logger.log(`Daily CSV processing completed. Processed ${processedCount} tickets`);
      
      return { processedCount };
    } catch (error) {
      this.logger.error('Failed to process daily CSV:', error.message);
      throw error;
    }
  }

  /**
   * Import CSV updates back to system
   */
  @Process('import-csv-updates')
  async handleCsvImport(job: Job<{ filePath: string; userId: string }>) {
    const { filePath, userId } = job.data;
    
    try {
      this.logger.log(`Importing CSV updates from: ${filePath}`);

      const updates: Array<{
        id: string;
        newStatus: TicketStatus;
        reason?: string;
      }> = [];

      // Parse CSV file
      await new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csv())
          .on('data', (row) => {
            if (row.id && row.new_status && row.new_status !== row.current_status) {
              updates.push({
                id: row.id,
                newStatus: row.new_status as TicketStatus,
                reason: row.reason || 'CSV import update',
              });
            }
          })
          .on('end', resolve)
          .on('error', reject);
      });

      let updatedCount = 0;

      // Process updates
      for (const update of updates) {
        try {
          // Get current ticket
          const [currentTicket] = await this.db
            .select()
            .from(tickets)
            .where(eq(tickets.id, update.id))
            .limit(1);

          if (!currentTicket) {
            this.logger.warn(`Ticket not found: ${update.id}`);
            continue;
          }

          // Update ticket status
          await this.db
            .update(tickets)
            .set({ 
              status: update.newStatus, 
              updatedAt: new Date() 
            })
            .where(eq(tickets.id, update.id));

          // Add history entry
          await this.db.insert(ticketHistory).values({
            ticketId: update.id,
            actionType: 'status_changed',
            oldValue: currentTicket.status,
            newValue: update.newStatus,
            reason: update.reason,
            changedBy: userId,
          });

          updatedCount++;
        } catch (error) {
          this.logger.error(`Failed to update ticket ${update.id}:`, error.message);
        }
      }

      // Clean up temporary file
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      this.logger.log(`CSV import completed. Updated ${updatedCount} tickets`);
      
      return { updatedCount, totalRows: updates.length };
    } catch (error) {
      this.logger.error(`Failed to import CSV from ${filePath}:`, error.message);
      throw error;
    }
  }
}
