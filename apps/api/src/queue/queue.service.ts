import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class QueueService {
  constructor(
    @InjectQueue('ticket-processing') private ticketQueue: Queue,
    @InjectQueue('csv-processing') private csvQueue: Queue,
  ) {}

  /**
   * Add ticket analysis job to queue
   */
  async addTicketAnalysisJob(ticketId: string, ticketContent: string) {
    return this.ticketQueue.add('analyze-ticket', {
      ticketId,
      content: ticketContent,
    });
  }

  /**
   * Add CSV export job to queue
   */
  async addCsvExportJob(userId: string) {
    return this.csvQueue.add('export-pending-tickets', {
      userId,
      timestamp: new Date(),
    });
  }

  /**
   * Add CSV import job to queue
   */
  async addCsvImportJob(filePath: string, userId: string) {
    return this.csvQueue.add('import-csv-updates', {
      filePath,
      userId,
      timestamp: new Date(),
    });
  }

  /**
   * Schedule daily CSV processing job
   */
  async scheduleDailyCsvProcessing() {
    return this.csvQueue.add(
      'daily-csv-process',
      {},
      {
        repeat: { cron: '0 2 * * *' }, // Run at 2 AM daily
      },
    );
  }

  /**
   * Get queue statistics
   */
  async getQueueStats() {
    const ticketStats = {
      waiting: await this.ticketQueue.getWaiting(),
      active: await this.ticketQueue.getActive(),
      completed: await this.ticketQueue.getCompleted(),
      failed: await this.ticketQueue.getFailed(),
    };

    const csvStats = {
      waiting: await this.csvQueue.getWaiting(),
      active: await this.csvQueue.getActive(),
      completed: await this.csvQueue.getCompleted(),
      failed: await this.csvQueue.getFailed(),
    };

    return {
      ticket: {
        waiting: ticketStats.waiting.length,
        active: ticketStats.active.length,
        completed: ticketStats.completed.length,
        failed: ticketStats.failed.length,
      },
      csv: {
        waiting: csvStats.waiting.length,
        active: csvStats.active.length,
        completed: csvStats.completed.length,
        failed: csvStats.failed.length,
      },
    };
  }
}
