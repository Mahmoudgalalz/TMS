import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { TicketSeverity } from '../../database/schema';

export interface TicketAnalysisRequest {
  title: string;
  description: string;
}

export interface TicketAnalysisResponse {
  predictedSeverity: TicketSeverity;
  confidence: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  category: string;
  suggestedResponse?: string;
  reasoning: string;
}

@Injectable()
export class AiService {
  private readonly aiServiceUrl: string;

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {
    this.aiServiceUrl = this.configService.get('AI_SERVICE_URL') || 'http://localhost:3003';
  }

  async analyzeTicket(ticketData: TicketAnalysisRequest): Promise<TicketAnalysisResponse> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.aiServiceUrl}/ai/analyze`, ticketData)
      );
      
      return response.data;
    } catch (error) {
      console.error('AI service error:', error.message);
      
      // Fallback to mock analysis if AI service is unavailable
      return this.getMockAnalysis(ticketData);
    }
  }

  async predictSeverity(title: string, description: string): Promise<{ severity: TicketSeverity; confidence: number }> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.aiServiceUrl}/ai/predict-severity`, { title, description })
      );
      
      return response.data;
    } catch (error) {
      console.error('AI severity prediction error:', error.message);
      
      // Fallback logic for severity prediction
      return this.getMockSeverityPrediction(title, description);
    }
  }

  async categorizeTicket(title: string, description: string): Promise<{ category: string; confidence: number }> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.aiServiceUrl}/ai/categorize`, { title, description })
      );
      
      return response.data;
    } catch (error) {
      console.error('AI categorization error:', error.message);
      
      // Fallback categorization
      return this.getMockCategorization(title, description);
    }
  }

  async analyzeSentiment(text: string): Promise<{ sentiment: string; score: number }> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.aiServiceUrl}/ai/sentiment`, { text })
      );
      
      return response.data;
    } catch (error) {
      console.error('AI sentiment analysis error:', error.message);
      
      // Fallback sentiment analysis
      return this.getMockSentiment(text);
    }
  }

  async suggestResponse(ticketData: TicketAnalysisRequest): Promise<{ response: string; confidence: number }> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.aiServiceUrl}/ai/suggest-response`, ticketData)
      );
      
      return response.data;
    } catch (error) {
      console.error('AI response suggestion error:', error.message);
      
      // Fallback response suggestion
      return this.getMockResponseSuggestion(ticketData);
    }
  }

  private getMockAnalysis(ticketData: TicketAnalysisRequest): TicketAnalysisResponse {
    const { title, description } = ticketData;
    const text = `${title} ${description}`.toLowerCase();
    
    // Simple keyword-based analysis
    let severity = TicketSeverity.MEDIUM;
    let confidence = 0.7;
    
    if (text.includes('critical') || text.includes('urgent') || text.includes('down') || text.includes('crash')) {
      severity = TicketSeverity.CRITICAL;
      confidence = 0.9;
    } else if (text.includes('high') || text.includes('important') || text.includes('error')) {
      severity = TicketSeverity.HIGH;
      confidence = 0.8;
    } else if (text.includes('low') || text.includes('minor') || text.includes('suggestion')) {
      severity = TicketSeverity.LOW;
      confidence = 0.8;
    }

    // Sentiment analysis
    let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
    if (text.includes('angry') || text.includes('frustrated') || text.includes('terrible')) {
      sentiment = 'negative';
    } else if (text.includes('good') || text.includes('great') || text.includes('thanks')) {
      sentiment = 'positive';
    }

    // Category determination
    let category = 'General';
    if (text.includes('login') || text.includes('password') || text.includes('authentication')) {
      category = 'Authentication';
    } else if (text.includes('network') || text.includes('connection') || text.includes('internet')) {
      category = 'Network';
    } else if (text.includes('bug') || text.includes('error') || text.includes('crash')) {
      category = 'Bug Report';
    } else if (text.includes('feature') || text.includes('enhancement') || text.includes('improvement')) {
      category = 'Feature Request';
    }

    return {
      predictedSeverity: severity,
      confidence,
      sentiment,
      category,
      suggestedResponse: this.generateMockResponse(severity, category),
      reasoning: `Based on keyword analysis of "${title}", predicted ${severity} severity with ${Math.round(confidence * 100)}% confidence.`,
    };
  }

  private getMockSeverityPrediction(title: string, description: string): { severity: TicketSeverity; confidence: number } {
    const analysis = this.getMockAnalysis({ title, description });
    return {
      severity: analysis.predictedSeverity,
      confidence: analysis.confidence,
    };
  }

  private getMockCategorization(title: string, description: string): { category: string; confidence: number } {
    const analysis = this.getMockAnalysis({ title, description });
    return {
      category: analysis.category,
      confidence: analysis.confidence,
    };
  }

  private getMockSentiment(text: string): { sentiment: string; score: number } {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('angry') || lowerText.includes('frustrated') || lowerText.includes('terrible')) {
      return { sentiment: 'negative', score: -0.8 };
    } else if (lowerText.includes('good') || lowerText.includes('great') || lowerText.includes('thanks')) {
      return { sentiment: 'positive', score: 0.8 };
    }
    
    return { sentiment: 'neutral', score: 0.0 };
  }

  private getMockResponseSuggestion(ticketData: TicketAnalysisRequest): { response: string; confidence: number } {
    const analysis = this.getMockAnalysis(ticketData);
    return {
      response: this.generateMockResponse(analysis.predictedSeverity, analysis.category),
      confidence: 0.7,
    };
  }

  private generateMockResponse(severity: TicketSeverity, category: string): string {
    const responses = {
      [TicketSeverity.CRITICAL]: "Thank you for reporting this critical issue. We're treating this as our highest priority and will investigate immediately. I'll keep you updated on our progress.",
      [TicketSeverity.HIGH]: "Thank you for bringing this to our attention. This appears to be a high-priority issue and we'll address it as soon as possible. Expected resolution within 24 hours.",
      [TicketSeverity.MEDIUM]: "Thank you for your report. We've logged this issue and will investigate it during our next maintenance window. We'll update you with our findings.",
      [TicketSeverity.LOW]: "Thank you for your feedback. We've noted this suggestion and will consider it for future improvements. We appreciate your input.",
    };

    let baseResponse = responses[severity] || responses[TicketSeverity.MEDIUM];
    
    // Add category-specific information
    if (category === 'Authentication') {
      baseResponse += " In the meantime, please try clearing your browser cache and cookies.";
    } else if (category === 'Network') {
      baseResponse += " Please check your internet connection and try again.";
    } else if (category === 'Bug Report') {
      baseResponse += " If you have any additional details or steps to reproduce, please share them.";
    }

    return baseResponse;
  }
}
