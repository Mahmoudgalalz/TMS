import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Processor('ticket-processing')
export class TicketProcessor {
  private readonly logger = new Logger(TicketProcessor.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Process ticket analysis job
   */
  @Process('analyze-ticket')
  async handleTicketAnalysis(job: Job<{ ticketId: string; content: string }>) {
    const { ticketId, content } = job.data;
    
    try {
      this.logger.log(`Processing ticket analysis for ticket: ${ticketId}`);

      // Call AI service for analysis
      const aiServiceUrl = this.configService.get('AI_SERVICE_URL') || 'http://localhost:3002';
      
      const response = await firstValueFrom(
        this.httpService.post(`${aiServiceUrl}/api/v1/ai/analyze`, {
          ticketId,
          content,
          requestType: 'analyze',
        }),
      );

      const analysis = response.data;
      
      // Here you would typically save the analysis results to database
      // For now, we'll just log the results
      this.logger.log(`Ticket analysis completed for ${ticketId}:`, analysis);

      return analysis;
    } catch (error) {
      this.logger.error(`Failed to analyze ticket ${ticketId}:`, error.message);
      throw error;
    }
  }

  /**
   * Process severity prediction job
   */
  @Process('predict-severity')
  async handleSeverityPrediction(job: Job<{ ticketId: string; content: string }>) {
    const { ticketId, content } = job.data;
    
    try {
      this.logger.log(`Processing severity prediction for ticket: ${ticketId}`);

      // Call AI service for severity prediction
      const aiServiceUrl = this.configService.get('AI_SERVICE_URL') || 'http://localhost:3002';
      
      const response = await firstValueFrom(
        this.httpService.post(`${aiServiceUrl}/api/v1/ai/predict-severity`, {
          content,
        }),
      );

      const prediction = response.data;
      
      this.logger.log(`Severity prediction completed for ${ticketId}:`, prediction);

      return prediction;
    } catch (error) {
      this.logger.error(`Failed to predict severity for ticket ${ticketId}:`, error.message);
      throw error;
    }
  }
}
