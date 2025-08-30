import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { TicketSeverity } from '@service-ticket/types';

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
  private readonly cloudflareAccountId: string;
  private readonly cloudflareApiToken: string;
  private readonly aiSecret: string;
  private readonly cloudflareApiUrl: string;

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {
    this.cloudflareAccountId = this.configService.get('CLOUDFLARE_ACCOUNT_ID');
    this.cloudflareApiToken = this.configService.get('CLOUDFLARE_API_TOKEN');
    this.aiSecret = this.configService.get('AI_SECRET');
    this.cloudflareApiUrl = `https://api.cloudflare.com/client/v4/accounts/${this.cloudflareAccountId}/ai/run`;
    
    if (!this.cloudflareAccountId || !this.cloudflareApiToken) {
      console.warn('Cloudflare AI credentials not configured. Falling back to mock analysis.');
    }
  }

  async analyzeTicket(ticketData: TicketAnalysisRequest): Promise<TicketAnalysisResponse> {
    try {
      // Use Cloudflare Workers AI for comprehensive analysis
      const severityResult = await this.predictSeverity(ticketData.title, ticketData.description);
      const sentimentResult = await this.analyzeSentiment(`${ticketData.title} ${ticketData.description}`);
      const categoryResult = await this.categorizeTicket(ticketData.title, ticketData.description);
      
      return {
        predictedSeverity: severityResult.severity,
        confidence: severityResult.confidence,
        sentiment: sentimentResult.sentiment as 'positive' | 'neutral' | 'negative',
        category: categoryResult.category,
        reasoning: `AI analysis using Cloudflare Workers AI: ${severityResult.confidence * 100}% confidence in ${severityResult.severity} severity based on content analysis.`,
      };
    } catch (error) {
      console.error('AI service error:', error.message);
      
      // Fallback to mock analysis if AI service is unavailable
      return this.getMockAnalysis(ticketData);
    }
  }

  async predictSeverity(title: string, description: string): Promise<{ severity: TicketSeverity; confidence: number }> {
    try {
      if (!this.cloudflareAccountId || !this.cloudflareApiToken) {
        return this.getMockSeverityPrediction(title, description);
      }

      const prompt = this.buildSeverityAnalysisPrompt(title, description);
      const aiResponse = await this.callCloudflareAI(prompt);
      
      return this.parseSeverityResponse(aiResponse);
    } catch (error) {
      console.error('AI severity prediction error:', error.message);
      
      // Fallback logic for severity prediction
      return this.getMockSeverityPrediction(title, description);
    }
  }

  async categorizeTicket(title: string, description: string): Promise<{ category: string; confidence: number }> {
    try {
      if (!this.cloudflareAccountId || !this.cloudflareApiToken) {
        return this.getMockCategorization(title, description);
      }

      const prompt = this.buildCategorizationPrompt(title, description);
      const aiResponse = await this.callCloudflareAI(prompt);
      
      return this.parseCategoryResponse(aiResponse);
    } catch (error) {
      console.error('AI categorization error:', error.message);
      
      // Fallback categorization
      return this.getMockCategorization(title, description);
    }
  }

  async analyzeSentiment(text: string): Promise<{ sentiment: string; score: number }> {
    try {
      if (!this.cloudflareAccountId || !this.cloudflareApiToken) {
        return this.getMockSentiment(text);
      }

      const prompt = this.buildSentimentAnalysisPrompt(text);
      const aiResponse = await this.callCloudflareAI(prompt);
      
      return this.parseSentimentResponse(aiResponse);
    } catch (error) {
      console.error('AI sentiment analysis error:', error.message);
      
      // Fallback sentiment analysis
      return this.getMockSentiment(text);
    }
  }

  async suggestResponse(ticketData: TicketAnalysisRequest): Promise<{ response: string; confidence: number }> {
    try {
      if (!this.cloudflareAccountId || !this.cloudflareApiToken) {
        return this.getMockResponseSuggestion(ticketData);
      }

      const prompt = this.buildResponseSuggestionPrompt(ticketData);
      const aiResponse = await this.callCloudflareAI(prompt);
      
      return this.parseResponseSuggestion(aiResponse);
    } catch (error) {
      console.error('AI response suggestion error:', error.message);
      
      // Fallback response suggestion
      return this.getMockResponseSuggestion(ticketData);
    }
  }

  // Core Cloudflare AI integration method
  private async callCloudflareAI(prompt: string): Promise<string> {
    if (!this.cloudflareAccountId || !this.cloudflareApiToken) {
      throw new Error('Cloudflare AI credentials not configured');
    }

    const response = await firstValueFrom(
      this.httpService.post(
        `${this.cloudflareApiUrl}/@cf/meta/llama-3.1-8b-instruct-fast`,
        { prompt },
        {
          headers: {
            'Authorization': `Bearer ${this.cloudflareApiToken}`,
            'Content-Type': 'application/json',
            'X-AI-Secret': this.aiSecret, // Secure communication
          },
        }
      )
    );

    return response.data.result?.response || '';
  }

  // Prompt builders for different AI tasks
  private buildSeverityAnalysisPrompt(title: string, description: string): string {
    return `Analyze this support ticket and determine its severity level.

Ticket Title: ${title}
Ticket Description: ${description}

Severity Levels:
- VERY_HIGH: Critical system failures, security breaches, complete service outages
- HIGH: Major functionality broken, significant business impact, urgent issues
- MEDIUM: Moderate issues, some functionality affected, standard priority
- LOW: Minor issues, cosmetic problems, low business impact
- EASY: Simple requests, documentation updates, minor enhancements

Respond ONLY with a JSON object in this exact format:
{"severity": "SEVERITY_LEVEL", "confidence": 0.85, "reasoning": "Brief explanation"}`;
  }

  private buildCategorizationPrompt(title: string, description: string): string {
    return `Categorize this support ticket into one of the predefined categories.

Ticket Title: ${title}
Ticket Description: ${description}

Categories:
- Authentication: Login, password, access issues
- Network: Connection, internet, connectivity problems
- Bug Report: Software bugs, errors, crashes
- Feature Request: New features, enhancements, improvements
- Technical Issue: General technical problems
- Billing: Payment, subscription, invoice issues
- General: Other support requests

Respond ONLY with a JSON object in this exact format:
{"category": "CATEGORY_NAME", "confidence": 0.85}`;
  }

  private buildSentimentAnalysisPrompt(text: string): string {
    return `Analyze the sentiment of this support ticket text.

Text: ${text}

Determine if the sentiment is positive, neutral, or negative, and provide a score between -1.0 (very negative) and 1.0 (very positive).

Respond ONLY with a JSON object in this exact format:
{"sentiment": "positive|neutral|negative", "score": 0.5}`;
  }

  private buildResponseSuggestionPrompt(ticketData: TicketAnalysisRequest): string {
    return `Generate a professional support response for this ticket.

Ticket Title: ${ticketData.title}
Ticket Description: ${ticketData.description}

Generate a helpful, professional, and empathetic response that:
1. Acknowledges the customer's issue
2. Provides initial guidance or next steps
3. Sets appropriate expectations
4. Maintains a professional tone

Respond ONLY with a JSON object in this exact format:
{"response": "Your professional response here", "confidence": 0.85}`;
  }

  // Response parsers for AI outputs
  private parseSeverityResponse(aiResponse: string): { severity: TicketSeverity; confidence: number } {
    try {
      const parsed = JSON.parse(aiResponse);
      const severity = parsed.severity as TicketSeverity;
      const confidence = Math.min(Math.max(parsed.confidence || 0.7, 0), 1);
      
      // Validate severity is one of our enum values
      const validSeverities: TicketSeverity[] = Object.values(TicketSeverity);
      if (!validSeverities.includes(severity)) {
        throw new Error('Invalid severity returned by AI');
      }
      
      return { severity, confidence };
    } catch (error) {
      console.error('Failed to parse AI severity response:', error);
      return { severity: 'MEDIUM' as TicketSeverity, confidence: 0.5 };
    }
  }

  private parseCategoryResponse(aiResponse: string): { category: string; confidence: number } {
    try {
      const parsed = JSON.parse(aiResponse);
      return {
        category: parsed.category || 'General',
        confidence: Math.min(Math.max(parsed.confidence || 0.7, 0), 1),
      };
    } catch (error) {
      console.error('Failed to parse AI category response:', error);
      return { category: 'General', confidence: 0.5 };
    }
  }

  private parseSentimentResponse(aiResponse: string): { sentiment: string; score: number } {
    try {
      const parsed = JSON.parse(aiResponse);
      return {
        sentiment: parsed.sentiment || 'neutral',
        score: Math.min(Math.max(parsed.score || 0, -1), 1),
      };
    } catch (error) {
      console.error('Failed to parse AI sentiment response:', error);
      return { sentiment: 'neutral', score: 0 };
    }
  }

  private parseResponseSuggestion(aiResponse: string): { response: string; confidence: number } {
    try {
      const parsed = JSON.parse(aiResponse);
      return {
        response: parsed.response || 'Thank you for contacting support. We will review your request and get back to you soon.',
        confidence: Math.min(Math.max(parsed.confidence || 0.7, 0), 1),
      };
    } catch (error) {
      console.error('Failed to parse AI response suggestion:', error);
      return {
        response: 'Thank you for contacting support. We will review your request and get back to you soon.',
        confidence: 0.5,
      };
    }
  }

  private getMockAnalysis(ticketData: TicketAnalysisRequest): TicketAnalysisResponse {
    const { title, description } = ticketData;
    const text = `${title} ${description}`.toLowerCase();
    
    // Simple keyword-based analysis
    let severity: TicketSeverity = TicketSeverity.MEDIUM;
    let confidence = 0.7;
    
    if (text.includes('critical') || text.includes('urgent') || text.includes('down') || text.includes('crash')) {
      severity = TicketSeverity.VERY_HIGH;
      confidence = 0.9;
    } else if (text.includes('high') || text.includes('important') || text.includes('error')) {
      severity = TicketSeverity.HIGH;
      confidence = 0.8;
    } else if (text.includes('low') || text.includes('minor') || text.includes('suggestion')) {
      severity = TicketSeverity.LOW;
      confidence = 0.8;
    } else if (text.includes('easy') || text.includes('simple') || text.includes('quick')) {
      severity = TicketSeverity.EASY;
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
    const responses: Record<TicketSeverity, string> = {
      'VERY_HIGH': "Thank you for reporting this critical issue. We're treating this as our highest priority and will investigate immediately. I'll keep you updated on our progress.",
      'HIGH': "Thank you for bringing this to our attention. This appears to be a high-priority issue and we'll address it as soon as possible. Expected resolution within 24 hours.",
      'MEDIUM': "Thank you for your report. We've logged this issue and will investigate it during our next maintenance window. We'll update you with our findings.",
      'LOW': "Thank you for your feedback. We've noted this suggestion and will consider it for future improvements. We appreciate your input.",
      'EASY': "Thank you for your request. This appears to be a simple enhancement that we can address quickly. We'll include it in our next update cycle.",
    };

    let baseResponse = responses[severity] || responses['MEDIUM'];
    
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
